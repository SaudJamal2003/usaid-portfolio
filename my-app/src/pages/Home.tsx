import { ConnectCta } from "../components/ConnectCta";
import { Hero } from "../components/Hero";
import { Journey } from "../components/Journey";
import { Mentors } from "../components/Mentors";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { Stats } from "../components/Stats";
import { Work } from "../components/Work";

export function Home() {
  return (
    <>
      {/* overflow-x-*clip*, not hidden: hidden computes overflow-y to auto, which
          makes this div a scroll container and stops the Journey rail's sticky
          viewport from ever pinning. clip cuts the same overflow without one. */}
      <div className="mx-auto w-full max-w-[1440px] overflow-x-clip bg-white font-sans text-ink antialiased">
        <SiteHeader current="Home" />
        <main className="pt-[130px]">
          <Hero />
          <Stats />
          <Work />
          <Journey />
          <hr className="mt-[100px] border-t border-hairline" />
          <Mentors />
          <ConnectCta />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
