"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

interface AllUsersProps {
  users: User[];
  organizationId: string;
}

export default function AllUsers({ users, organizationId }: AllUsersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInviteMember = async (user: User) => {
    setIsLoading(true);

    try {
      const response = await authClient.organization.inviteMember({
        email: user.email,
        role: "member",
        organizationId,
      });

      if (response.error) {
        console.error("Failed to invite member", response.error);
        toast.error(
          response.error.message ||
            `Failed to invite member (status ${response.error.status ?? "unknown"})`
        );
        return;
      }

      toast.success("Invitation sent to member");
      router.refresh();
    } catch (error) {
      console.error("Unexpected error inviting member", error);
      const message =
        error instanceof Error ? error.message : "Failed to invite member";
      toast.error(message || "Failed to invite member to organization");
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
