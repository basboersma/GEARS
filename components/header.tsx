import Link from "next/link";
import { Logout } from "./logout";
import { ModeSwitcher } from "./mode-switcher";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="absolute top-0 right-0 flex w-full items-center justify-between gap-3 p-4">
      <div />
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
