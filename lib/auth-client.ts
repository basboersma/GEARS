import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authBaseURL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [organizationClient(), lastLoginMethodClient()],
});
