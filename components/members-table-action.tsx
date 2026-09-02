"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { removeMember, setMemberRole } from "@/server/members";
import { Button } from "./ui/button";

export default function MembersTableAction({
  memberId,
  role,
  canManageRoles,
}: {
  memberId: string;
  role: "member" | "sub_owner" | "admin" | "owner";
  canManageRoles: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await removeMember(memberId);

      if (!success) {
        toast.error(error || "Failed to remove member");
        return;
      }

      setIsLoading(false);
      toast.success("Member removed from organization");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove member from organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async (nextRole: "member" | "sub_owner") => {
    setIsLoading(true);

    try {
      const result = await setMemberRole(memberId, nextRole);

      if (!result.success) {
        toast.error(result.error || "Failed to update member role.");
        return;
      }

      toast.success(
        nextRole === "sub_owner"
          ? "Member is now a sub-owner."
          : "Sub-owner role removed."
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update member role.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {canManageRoles && role === "member" ? (
        <Button
          disabled={isLoading}
          onClick={() => handleSetRole("sub_owner")}
          size="sm"
          variant="outline"
        >
          Make sub-owner
        </Button>
      ) : null}
      {canManageRoles && role === "sub_owner" ? (
        <Button
          disabled={isLoading}
          onClick={() => handleSetRole("member")}
          size="sm"
          variant="outline"
        >
          Remove sub-owner
        </Button>
      ) : null}
      <Button
        disabled={isLoading}
        onClick={handleRemoveMember}
        size="sm"
        variant="destructive"
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
      </Button>
    </div>
  );
}
