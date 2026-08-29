import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ActivitiesPage() {
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

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[#b45309] text-[10px] uppercase tracking-[0.24em]">
            Activities
          </p>
          <h1 className="mt-3 font-black text-4xl sm:text-5xl">
            What we do together
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Community events",
              text: "From socials to student exchanges, we create room for people to meet, connect, and build momentum.",
            },
            {
              title: "Workshops",
              text: "Practical sessions, skills-sharing, and peer-led learning that helps members grow beyond the classroom.",
            },
            {
              title: "Collaborations",
              text: "We bring organisations, students, and partners together to turn shared ideas into action.",
            },
          ].map((item) => (
            <div
              className="rounded-2xl border border-border bg-muted/20 p-6"
              key={item.title}
            >
              <h2 className="font-semibold text-xl">{item.title}</h2>
              <p className="mt-3 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
