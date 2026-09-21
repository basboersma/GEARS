import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/forms/signup-form";
import { cn } from "@/lib/utils";
import styles from "../login/page.module.css";

export default function SignupPage() {
  return (
    <div className={cn("grid min-h-svh lg:grid-cols-2", styles.cream)}>
      {/*LEFT: GEARS brand panel*/}
      <div
        className={cn(
          "relative hidden overflow-hidden lg:block",
          styles.brandPanel
        )}
      >
        {/* emblem*/}
        <Image
          alt=""
          aria-hidden
          className={cn("pointer-events-none select-none", styles.watermark)}
          height={714}
          src="/gears-logo-grey.png"
          width={764}
        />

        <div className={styles.panelInner}>
          {/*lockup*/}
          <Link className={styles.lockup} href="/">
            <span className={styles.brandBadge}>
              <Image
                alt="GEARS"
                height={34}
                src="/gears-emblem.png"
                width={34}
              />
            </span>
            <span className={styles.wordmark}>GEARS</span>
          </Link>

          {/*headline*/}
          <div className={styles.headlineWrap}>
            <div className={styles.accent} />
            <h1 className={styles.headline}>
              Groningen Engineering And Robotics Study Association
            </h1>
          </div>
        </div>
      </div>

      {/*RIGHT: form*/}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 p-6 md:p-10",
          styles.cream
        )}
      >
        <Link
          className="flex items-center gap-2.5 self-center lg:hidden"
          href="/"
        >
          <span className={styles.mobileBadge}>
            <Image alt="GEARS" height={24} src="/gears-emblem.png" width={24} />
          </span>
          <span className={styles.mobileWordmark}>GEARS</span>
        </Link>

        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
