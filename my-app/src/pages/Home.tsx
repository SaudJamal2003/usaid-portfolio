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
      <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden bg-white font-sans text-ink antialiased">
        <SiteHeader current="Home" />
        <main className="pt-[130px]">
          <Hero />
          <Stats />
          <Work />
          <Journey />
          <hr className="mt-[181px] border-t border-hairline" />
          <Mentors />
          <ConnectCta />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
