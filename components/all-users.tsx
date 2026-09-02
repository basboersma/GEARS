"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/db/schema";
import { Button } from "./ui/button";

interface AllUsersProps {
  users: User[];
  organizationId: string;
}

export default function AllUsers({ users, organizationId }: AllUsersProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleInviteMember = async (user: User) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/organization-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          organizationId,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error || "Failed to send invitation email.");
        return;
      }

      toast.success("Invitation email sent.");
    } catch (error) {
      toast.error("Failed to send invitation email.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div key={user.id}>
            <Button
              disabled={isLoading}
              onClick={() => handleInviteMember(user)}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                `Invite ${user.name} to organization`
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
