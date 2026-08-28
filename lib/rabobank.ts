import {
  createHash,
  createHmac,
  createSign,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { readFileSync } from "node:fs";
import https from "node:https";

export interface RabobankStatePayload {
  organizationId: string;
  userId: string;
  nonce: string;
}

interface RabobankTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  token_type: string;
  scope?: string;
  metadata?: string;
  consented_on?: number;
}

interface RabobankRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  accessToken?: string;
  body?: unknown;
}

const oauthBaseUrl =
  process.env.RABOBANK_OAUTH_BASE_URL ??
  "https://oauth.rabobank.nl/openapi/oauth2-premium";
const apiBaseUrl =
  process.env.RABOBANK_API_BASE_URL ??
  "https://api.rabobank.nl/openapi/payments";

function requireEnvironmentValue(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getClientCredentials() {
  return {
    clientId: requireEnvironmentValue("RABOBANK_CLIENT_ID"),
    clientSecret: requireEnvironmentValue("RABOBANK_CLIENT_SECRET"),
  };
}

function getMtlsAgent() {
  const certPath = requireEnvironmentValue("RABOBANK_MTLS_CERT");
  const keyPath = requireEnvironmentValue("RABOBANK_MTLS_KEY");

  return new https.Agent({
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  });
}

function getSigningCredentials() {
  const certPath = requireEnvironmentValue("RABOBANK_SIGNING_CERT");
  const keyPath = requireEnvironmentValue("RABOBANK_SIGNING_KEY");

  return {
    certificate: readFileSync(certPath, "utf8"),
    privateKey: readFileSync(keyPath, "utf8"),
  };
}

function toCertificateHeader(pem: string) {
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
}

function createDigest(body: string) {
  const hash = createHash("sha512").update(body).digest("base64");
  return `sha-512=${hash}`;
}

function createSignatureHeader(values: {
  date: string;
  digest: string;
  requestId: string;
}) {
  const { privateKey } = getSigningCredentials();
  const signingString = [
    `date: ${values.date}`,
    `digest: ${values.digest}`,
    `x-request-id: ${values.requestId}`,
  ].join("\n");

  const signer = createSign("RSA-SHA512");
  signer.update(signingString);
  signer.end();

  const signature = signer.sign(privateKey, "base64");

  return `keyId="${process.env.RABOBANK_CLIENT_ID ?? "client"}",algorithm="rsa-sha512",headers="date digest x-request-id",signature="${signature}"`;
}

function createStateToken(payload: RabobankStatePayload) {
  const secret = requireEnvironmentValue("BETTER_AUTH_SECRET");
  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(serialized)
    .digest("base64url");
  return `${serialized}.${signature}`;
}

function parseStateToken(token: string) {
  const secret = requireEnvironmentValue("BETTER_AUTH_SECRET");
  const [serialized, signature] = token.split(".");

  if (!(serialized && signature)) {
    throw new Error("Invalid Rabobank state token");
  }

  const expected = createHmac("sha256", secret)
    .update(serialized)
    .digest("base64url");

  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error("Rabobank state token signature mismatch");
  }

  return JSON.parse(
    Buffer.from(serialized, "base64url").toString("utf8")
  ) as RabobankStatePayload;
}

function requestJson<T>(
  url: string,
  init: https.RequestOptions & { body?: string }
) {
  return new Promise<T>((resolve, reject) => {
    const request = https.request(url, init, (response) => {
      const chunks: Buffer[] = [];

      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");

        if (!response.statusCode || response.statusCode >= 400) {
          reject(
            new Error(
              text || `Rabobank request failed with ${response.statusCode}`
            )
          );
          return;
        }

        if (!text) {
          resolve(undefined as T);
          return;
        }

        resolve(JSON.parse(text) as T);
      });
    });

    request.on("error", reject);

    if (init.body) {
      request.write(init.body);
    }

    request.end();
  });
}

export function buildRabobankAuthorizationUrl(payload: RabobankStatePayload) {
  const url = new URL(`${oauthBaseUrl}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getClientCredentials().clientId);
  url.searchParams.set("scope", "bai.accountinformation.read");
  url.searchParams.set("state", createStateToken(payload));
  url.searchParams.set(
    "redirect_uri",
    requireEnvironmentValue("RABOBANK_REDIRECT_URI")
  );

  return url.toString();
}

export function decodeRabobankStateToken(token: string) {
  return parseStateToken(token);
}

export function exchangeRabobankAuthorizationCode(code: string) {
  const { clientId, clientSecret } = getClientCredentials();
  const tokenUrl = new URL(`${oauthBaseUrl}/token`);
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  }).toString();

  return requestJson<RabobankTokenResponse>(tokenUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    agent: getMtlsAgent(),
    body,
  });
}

export function refreshRabobankAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getClientCredentials();
  const tokenUrl = new URL(`${oauthBaseUrl}/token`);
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }).toString();

  return requestJson<RabobankTokenResponse>(tokenUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    agent: getMtlsAgent(),
    body,
  });
}

export function rabobankApiRequest<T>(options: RabobankRequestOptions) {
  const url = `${apiBaseUrl}${options.path}`;
  const requestId = randomUUID();
  const date = new Date().toUTCString();
  const body = options.body ? JSON.stringify(options.body) : "";
  const digest = createDigest(body);
  const signature = createSignatureHeader({ date, digest, requestId });
  const { certificate } = getSigningCredentials();

  const headers: Record<string, string> = {
    Accept: "application/json",
    Date: date,
    Digest: digest,
    "X-Request-ID": requestId,
    Signature: signature,
    "Signature-Certificate": toCertificateHeader(certificate),
    "X-IBM-Client-ID": requireEnvironmentValue("RABOBANK_CLIENT_ID"),
    "PSU-IP-Address": "127.0.0.1",
  };

  if (options.method === "POST" || options.method === "PUT") {
    headers["Content-Type"] = "application/json";
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return requestJson<T>(url, {
    method: options.method,
    headers,
    agent: getMtlsAgent(),
    body: body || undefined,
  });
}
