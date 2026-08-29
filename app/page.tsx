import Link from "next/link";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/activities", label: "Activities" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-border/80 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            className="font-black text-lg uppercase tracking-[0.18em]"
            href="/"
          >
            GEARS
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ModeSwitcher />
            <Button
              asChild
              className="rounded-full bg-[#F59E0B] px-5 font-semibold text-slate-950 shadow-sm hover:bg-[#fbbf24]"
            >
              <Link href="/login">JOIN GEARS</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center rounded-full border border-[#FFD142]/60 bg-[#FFD142]/10 px-3 py-1 font-medium text-[#b45309] text-sm">
              Community. Action. Belonging.
            </div>

            <h1 className="max-w-xl font-black text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Grow the student network behind your ideas.
            </h1>

            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              GEARS brings organisations together through collaboration,
              activities, and a shared student culture that turns momentum into
              action.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full bg-[#F59E0B] px-6 font-semibold text-slate-950 hover:bg-[#fbbf24]"
              >
                <Link href="/login">Join GEARS</Link>
              </Button>
              <Button asChild className="rounded-full px-6" variant="outline">
                <Link href="/about">Learn more</Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="font-black text-2xl">120+</div>
                <div className="text-muted-foreground text-sm">Members</div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="font-black text-2xl">18</div>
                <div className="text-muted-foreground text-sm">Activities</div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="font-black text-2xl">6</div>
                <div className="text-muted-foreground text-sm">
                  Organisations
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-border bg-gradient-to-br from-[#F59E0B]/15 via-background to-[#8B5CF6]/10 p-6 shadow-xl">
              <div className="rounded-[1.5rem] border border-border bg-background/80 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-[#F59E0B]/15 px-2.5 py-1 font-medium text-[#b45309] text-xs uppercase tracking-[0.2em]">
                    Live
                  </span>
                  <span className="text-muted-foreground text-xs">
                    GEARS Network
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                      Upcoming activity
                    </p>
                    <h2 className="mt-2 font-semibold text-xl">
                      Board meeting
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Wednesday • 18:30 • Campus Hall
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                      Membership
                    </p>
                    <h2 className="mt-2 font-semibold text-xl">
                      Open for new members
                    </h2>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Join the next cohort and contribute to community projects.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
