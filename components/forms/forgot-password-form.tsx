"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.string().email(),
});

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

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent");
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
            margin: "0 0 8px",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontWeight: 600,
            fontSize: 27,
            color: "#26241F",
          }}
        >
          Forgot password
        </h2>
        <p
          style={{
            margin: "0 0 22px",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontSize: 15,
            color: "#6B645B",
          }}
        >
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)}>
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
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            fontSize: 14,
            color: "#3A382F",
            fontFamily: "var(--font-open-sans), sans-serif",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#E07056", fontWeight: 600 }}>
            Sign up
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
        <Link href="#" style={{ textDecoration: "underline" }}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" style={{ textDecoration: "underline" }}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
