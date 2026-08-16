import { AboutIntro } from "../components/AboutIntro";
import { ConnectCta } from "../components/ConnectCta";
import { Journey } from "../components/Journey";
import { LifeOutsideFigma } from "../components/LifeOutsideFigma";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

/* Figma "Desktop - 6" (1:6674). Only the intro and the collage are new — the
   bar, the journey rail and the connect block are the same components the home
   page uses, re-spaced to this layout. */
export function About() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden bg-white font-sans text-ink antialiased">
        <SiteHeader current="About" className="h-[110px]" />
        <main className="pt-[110px]">
          <AboutIntro />
          <hr className="mt-[164px] border-t border-hairline" />
          <Journey className="mt-[184px]" align="center" />
          <LifeOutsideFigma />
          <ConnectCta className="mt-[231px]" />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
