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
import { authClient } from "@/lib/auth-client";

export interface OrganizationOption {
  id: string;
  name: string;
  slug: string | null;
}

interface OrganizationSwitcherProps {
  organizations: OrganizationOption[];
  className?: string;
}

export function OrganizationSwitcher({
  organizations,
  className,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const handleChangeOrganization = async (organizationId: string) => {
    const nextOrganization = organizations.find(
      (organization) => organization.id === organizationId
    );

    try {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        console.error(error);
        toast.error("Failed to switch organization");
        return;
      }

      if (nextOrganization?.slug) {
        router.push(`/dashboard/organization/${nextOrganization.slug}`);
      } else {
        router.push("/dashboard");
      }

      router.refresh();
      toast.success("Organization switched successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch organization");
    }
  };

  return (
    <Select
      onValueChange={handleChangeOrganization}
      value={activeOrganization?.id}
    >
      <SelectTrigger className={className ?? "w-[180px]"}>
        <SelectValue placeholder="Organization" />
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
