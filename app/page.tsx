"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EmblemJourney } from "@/components/emblem-journey/emblem-journey";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  return (
    <div className="site">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <Image
                alt="GEARS Robotics & Engineering Association"
                className="hero-logo"
                height={180}
                src="/gears_branding/gears_logo.png"
                width={420}
              />
            </div>
            <p className="hero-tagline">
              Gronigen Engineering and Robotics Study Association
            </p>
            <h1>Platform for STEM student challenges.</h1>
            <p className="hero-lead">
              GEARS is a student-led STEM association that provides
              opportunities for challenge-based learning through
              interdisciplinary projects, competitions, workshops, and industry
              collaborations. Our mission is to help students develop practical
              skills, gain real world experience, and build meaningful
              connections while working on innovative solutions to technical and
              societal changes.
            </p>

            <div className="hero-actions">
              <Link
                className="btn btn-primary"
                href="https://docs.google.com/forms/d/e/1FAIpQLSfWqyAj0pHO3R68yfyFYpkpuL4kdzWFg-wHfs8_0LBnxyFTpw/viewform?usp=dialog"
                rel="noopener noreferrer"
                target="_blank"
              >
                JOIN GEARS
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  openPdfPopup(
                    "FSE Student Challenge Seed Fund 2026/2027",
                    "/fse-student-challenge-seed-fund.pdf"
                  )
                }
                type="button"
              >
                Apply for Seed Fund
              </button>
            </div>
          </div>
        </section>

        <EmblemJourney />

        <section className="section section-alt">
          <div className="section-header">
            <div>
              <p>GEARS supports students by:</p>
              <ul>
                <li>
                  Providing teams with seed-funding to enable them to enter
                  competitions
                </li>
                <li>Organizing and participating in STEM competitions</li>
                <li>Facilitating interdisciplinary projects</li>
                <li>Connecting students with industry partners</li>
                <li>Hosting workshops and networking events</li>
                <li>
                  Creating opportunities for hands-on learning and professional
                  development
                </li>
              </ul>
            </div>
          </div>
        </section>
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
