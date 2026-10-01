"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { signUp } from "@/server/users";

const formSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

const ssoButton: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 11,
  width: "100%",
  height: 48,
  background: "#FFFFFF",
  border: "1px solid #E3DACB",
  borderRadius: 12,
  fontFamily: "var(--font-open-sans), sans-serif",
  fontSize: 15,
  fontWeight: 600,
  color: "#2E2C28",
  cursor: "pointer",
};

const fieldLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#3A382F",
  fontFamily: "var(--font-open-sans), sans-serif",
};

const fieldInput: CSSProperties = {
  height: 46,
  boxSizing: "border-box",
  padding: "0 14px",
  background: "#FFFFFF",
  border: "1px solid #E3DACB",
  borderRadius: 11,
  fontFamily: "var(--font-open-sans), sans-serif",
  fontSize: 15,
  color: "#26241F",
};

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const callbackURL = invitationId
    ? `/api/accept-invitation/${invitationId}`
    : "/dashboard";
  const loginHref = invitationId
    ? `/login?invitationId=${invitationId}`
    : "/login";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: searchParams.get("email") ?? "",
      password: "",
    },
  });

  const signInWithGoogle = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    if (error) {
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  const signInWithMicrosoft = async () => {
    const { error } = await authClient.signIn.social({
      provider: "microsoft",
      callbackURL,
    });
    if (error) {
      toast.error(error.message || "Microsoft sign-in failed.");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { success, message } = await signUp(
      values.email,
      values.password,
      values.username
    );
    if (success) {
      toast.success(
        invitationId
          ? `${message as string} Please check your email for verification, then use the invitation link again to join.`
          : `${message as string} Please check your email for verification.`
      );
      router.push("/dashboard");
    } else {
      toast.error(message as string);
    }
    setIsLoading(false);
  }

  return (
    <div
      style={{
        width: 400,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ width: "100%" }}>
        <h2
          style={{
            margin: "0 0 22px",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontWeight: 600,
            fontSize: 27,
            color: "#26241F",
          }}
        >
          Create your account
        </h2>

        {/* SSO */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={signInWithGoogle} style={ssoButton} type="button">
            <svg aria-hidden="true" height="19" viewBox="0 0 24 24" width="19">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
          <button onClick={signInWithMicrosoft} style={ssoButton} type="button">
            <svg aria-hidden="true" height="18" viewBox="0 0 21 21" width="18">
              <rect fill="#F25022" height="9" width="9" x="1" y="1" />
              <rect fill="#7FBA00" height="9" width="9" x="11" y="1" />
              <rect fill="#00A4EF" height="9" width="9" x="1" y="11" />
              <rect fill="#FFB900" height="9" width="9" x="11" y="11" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

        {/* divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "22px 0",
          }}
        >
          <div style={{ flexGrow: 1, height: 1, background: "#EBE3D5" }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: "#A29C90",
              textTransform: "uppercase",
              fontFamily: "var(--font-open-sans), sans-serif",
            }}
          >
            Or sign up with email
          </span>
          <div style={{ flexGrow: 1, height: 1, background: "#EBE3D5" }} />
        </div>

        {/* fields */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label htmlFor="username" style={fieldLabel}>
                Username
              </label>
              <input
                id="username"
                placeholder="yourname"
                style={fieldInput}
                type="text"
                {...form.register("username")}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label htmlFor="email" style={fieldLabel}>
                Email
              </label>
              <input
                id="email"
                placeholder="email@example.com"
                style={fieldInput}
                type="email"
                {...form.register("email")}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label htmlFor="password" style={fieldLabel}>
                Password
              </label>
              <input
                id="password"
                placeholder="••••••••"
                style={fieldInput}
                type="password"
                {...form.register("password")}
              />
            </div>
          </div>

          <button
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 48,
              marginTop: 22,
              background: "#E07056",
              border: 0,
              borderRadius: 12,
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: isLoading ? "default" : "pointer",
              opacity: isLoading ? 0.85 : 1,
            }}
            type="submit"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Signup"}
          </button>
        </form>

        {/* login link */}
        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            fontSize: 14,
            color: "#3A382F",
            fontFamily: "var(--font-open-sans), sans-serif",
          }}
        >
          Already have an account?{" "}
          <Link
            href={loginHref}
            style={{ color: "#E07056", fontWeight: 600 }}
          >
            Login
          </Link>
        </p>
      </div>

      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: 12,
          color: "#A29C90",
          fontFamily: "var(--font-open-sans), sans-serif",
        }}
      >
        By clicking continue, you agree to our{" "}
        <Link href="/terms" style={{ textDecoration: "underline" }}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" style={{ textDecoration: "underline" }}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
