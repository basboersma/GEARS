import Link from "next/link";
import { Logout } from "./logout";
import { ModeSwitcher } from "./mode-switcher";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="absolute top-0 right-0 z-40 flex w-full items-center justify-between gap-3 border-[#FFEDD1]/10 border-b bg-[#141212] px-5 py-2.5">
      <h1 className="font-semibold text-[#FFEDD1] text-base tracking-wide">
        Member Dashboard
      </h1>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/personal-information">Settings</Link>
        </Button>
        <Logout />
        <ModeSwitcher />
      </div>
    </header>
  );
}
