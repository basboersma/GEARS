"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Organization } from "@/db/schema";
import { authClient } from "@/lib/auth-client";

interface OrganizationSwitcherProps {
  organizations: Organization[];
}

export function OrganizationSwitcher({
  organizations,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const handleChangeOrganization = async (organizationId: string) => {
    try {
      const targetOrganization = organizations.find(
        (organization) => organization.id === organizationId
      );

      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        console.error(error);
        toast.error("Failed to switch organization");
        return;
      }

      toast.success("Organization switched successfully");

      if (targetOrganization?.slug) {
        router.push(`/dashboard/organization/${targetOrganization.slug}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch organization");
    }
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={activeOrganization?.id ?? organizations[0]?.id}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
