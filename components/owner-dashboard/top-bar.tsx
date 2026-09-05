import Link from "next/link";
import { Logout } from "@/components/logout";
import { Button } from "@/components/ui/button";

export function DashboardTopBar({ title }: { title: string }) {
  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between border-[#FFEDD1]/10 border-b bg-[#141212] px-5 py-2.5">
      <h1 className="font-semibold text-[#FFEDD1] text-base tracking-wide">
        {title}
      </h1>
      <div className="flex items-center gap-1.5">
        <Button
          asChild
          className="rounded-lg border-white/10 bg-white/5 px-2.5 py-1.5 text-[#9C8272] text-xs hover:border-white/20 hover:text-[#FFEDD1]"
          size="sm"
          variant="outline"
        >
          <Link href="/dashboard/personal-information">Settings</Link>
        </Button>
        <Logout />
      </div>
    </header>
  );
}
