import Link from "next/link";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <header className="absolute top-0 right-0 flex items-center justify-end p-4">
        <ModeSwitcher />
      </header>

      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),transparent_35%),linear-gradient(180deg,#fff7ed_0%,#fff_100%)] px-6 py-16 dark:bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),transparent_35%),linear-gradient(180deg,#0f172a_0%,#020817_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:text-left">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 font-medium text-orange-700 text-sm dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200">
              <span className="size-2 rounded-full bg-orange-500" />
              Built for student organizations
            </div>

            <h1 className="font-black text-5xl text-slate-900 leading-tight tracking-tight sm:text-6xl dark:text-white">
              Bring your club
              <span className="block text-orange-500">
                operations into focus.
              </span>
            </h1>

            <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
              GEARS helps student communities organize agendas, manage orders,
              track budgets, and coordinate members from one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600">
                  Join GEARS
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="px-6" variant="outline">
                  Create account
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500 font-bold text-sm text-white">
                      G
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        GEARS
                      </p>
                      <p className="text-slate-500 text-xs dark:text-slate-400">
                        Dashboard overview
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700 text-xs dark:bg-emerald-500/10 dark:text-emerald-300">
                    Live
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-500 text-xs dark:text-slate-400">
                      Total budget
                    </p>
                    <p className="mt-2 font-bold text-slate-900 text-xl dark:text-white">
                      €24.8k
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-500 text-xs dark:text-slate-400">
                      Orders
                    </p>
                    <p className="mt-2 font-bold text-slate-900 text-xl dark:text-white">
                      128
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-slate-500 text-xs dark:text-slate-400">
                      Members
                    </p>
                    <p className="mt-2 font-bold text-slate-900 text-xl dark:text-white">
                      42
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        Budgets
                      </p>
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                        74%
                      </span>
                    </div>
                    <div className="h-28 rounded-xl bg-[linear-gradient(135deg,#fbbf24,#f97316,#f43f5e)] opacity-90" />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      Upcoming agenda
                    </p>
                    <ul className="mt-3 space-y-2 text-slate-600 text-sm dark:text-slate-300">
                      <li>• Board meeting</li>
                      <li>• Budget review</li>
                      <li>• Order approval</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
