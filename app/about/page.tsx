import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            className="font-black text-lg uppercase tracking-[0.18em]"
            href="/"
          >
            GEARS
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {[
              { href: "/", label: "Home" },
              { href: "/activities", label: "Activities" },
              { href: "/membership", label: "Membership" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((item) => (
              <Link
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            asChild
            className="rounded-full bg-[#F59E0B] text-slate-950 hover:bg-[#fbbf24]"
          >
            <Link href="/login">JOIN GEARS</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[#b45309] text-[10px] uppercase tracking-[0.24em]">
            About
          </p>
          <h1 className="mt-3 font-black text-4xl sm:text-5xl">
            GEARS is built for connection
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-8">
          <p className="text-base text-muted-foreground">
            GEARS brings students, organisations, and communities together
            through shared ambitions, meaningful activities, and a strong sense
            of belonging. We believe that collaboration is the engine behind the
            strongest student experiences.
          </p>
        </div>
      </main>
    </div>
  );
}
