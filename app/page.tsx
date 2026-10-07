"use client";

import "./home-hero.css";
import Image from "next/image";
import { type PointerEvent, useRef, useState } from "react";
import { EmblemJourney } from "@/components/emblem-journey/emblem-journey";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhereNext } from "@/components/where-next/where-next";
import { COORDINATES } from "@/lib/location";
import { JOIN_DOCS } from "@/lib/routes";

export default function HomePage() {
  const [pdfPopup, setPdfPopup] = useState<{
    open: boolean;
    title: string;
    src: string;
  }>({
    open: false,
    title: "",
    src: "",
  });

  const openPdfPopup = (title: string, src: string) => {
    setPdfPopup({
      open: true,
      title,
      src,
    });
  };

  const crosshairRef = useRef<HTMLDivElement>(null);

  //moves the drafting cursor without re-rendering the page
  const moveCrosshair = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.round(event.clientX - box.left);
    const y = Math.round(event.clientY - box.top);
    crosshairRef.current?.style.setProperty("--x", `${x}px`);
    crosshairRef.current?.style.setProperty("--y", `${y}px`);
    crosshairRef.current?.setAttribute("data-pos", `x ${x}  y ${y}`);
  };

  return (
    <div className="site">
      <SiteHeader />

      <main>
        {/*full photo with the logo sitting on the edge of the see-through band*/}
        <section className="home-hero" onPointerMove={moveCrosshair}>
          <Image
            alt="Members working on a wooden rover in the GEARS workshop"
            className="home-hero-photo"
            fill
            priority
            sizes="100vw"
            src="/gears_branding/makercieatwork.jpeg"
          />

          <div className="home-hero-band">
            <div className="home-hero-title">
              <p className="home-hero-label">
                Groningen Engineering and Robotics Study Association
              </p>
              <h1>
                <Image
                  alt="GEARS"
                  height={228}
                  priority
                  src="/gears_branding/gears_logo_light.png"
                  width={1092}
                />
              </h1>
            </div>

            <div className="home-hero-body">
              <p className="home-hero-lead">
                GEARS is a student-led STEM association that offers
                challenge-based learning through interdisciplinary projects,
                competitions, workshops and industry collaborations. We help
                students build practical skills, get real-world experience and
                make meaningful connections while working on solutions to
                technical and societal challenges.
              </p>
              <a
                className="home-hero-join"
                href={JOIN_DOCS}
                rel="noopener noreferrer"
                target="_blank"
              >
                Join GEARS
              </a>
              <button
                className="home-hero-seed"
                onClick={() =>
                  openPdfPopup(
                    "FSE Student Challenge Seed Fund 2026/2027",
                    "/fse-student-challenge-seed-fund.pdf"
                  )
                }
                type="button"
              >
                Apply for seed fund →
              </button>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="home-hero-crosshair"
            ref={crosshairRef}
          />
          <p className="home-hero-coords">{COORDINATES} / ZERNIKE</p>
          <p className="home-hero-scroll">Read more...</p>
        </section>

        <EmblemJourney />
        <WhereNext />
      </main>

      {pdfPopup.open && (
        <Dialog
          onOpenChange={(open) => setPdfPopup((prev) => ({ ...prev, open }))}
          open={pdfPopup.open}
        >
          <DialogContent className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] h-[92vh] gap-0 overflow-hidden p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{pdfPopup.title}</DialogTitle>
            </DialogHeader>

            <iframe
              className="h-full w-full border-0"
              src={pdfPopup.src}
              title={pdfPopup.title}
            />
          </DialogContent>
        </Dialog>
      )}

      <SiteFooter />
    </div>
  );
}
