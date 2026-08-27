import Link from "next/link";
import { getOrganizations } from "@/server/organizations";
import { Logout } from "./logout";
import { ModeSwitcher } from "./mode-switcher";
import { OrganizationSwitcher } from "./organization-switcher";
import { Button } from "./ui/button";

export async function Header() {
  const organizations = await getOrganizations();

  return (
    <header className="absolute top-0 right-0 flex w-full items-center justify-between p-4">
      <OrganizationSwitcher organizations={organizations} />
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/personal-information">Account</Link>
        </Button>
        <Logout />
        <ModeSwitcher />
      </div>
    </header>
  );
}
