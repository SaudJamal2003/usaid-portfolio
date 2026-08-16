import { ConnectCta } from '../components/ConnectCta'
import { ShukarHaiChallenge } from '../components/ShukarHaiChallenge'
import { ShukarHaiExplorations } from '../components/ShukarHaiExplorations'
import { ShukarHaiGallery } from '../components/ShukarHaiGallery'
import { ShukarHaiIntro } from '../components/ShukarHaiIntro'
import { ShukarHaiPrototype } from '../components/ShukarHaiPrototype'
import { ShukarHaiResearch } from '../components/ShukarHaiResearch'
import { ShukarHaiTestimonial } from '../components/ShukarHaiTestimonial'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

/* Figma "Desktop - 5" (1:4279). The bar, the connect block and the footer are
   the same components the other two pages use; everything between them is the
   case study itself. */
export function ShukarHai() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden bg-white font-sans text-ink antialiased">
        <SiteHeader current="Work" className="h-[110px]" />
        <main className="pt-[204px]">
          <ShukarHaiIntro />
          <hr className="mt-[156px] border-t border-hairline" />
          <ShukarHaiChallenge />
          <ShukarHaiResearch />
          <ShukarHaiExplorations />
          <ShukarHaiPrototype />
          <ShukarHaiGallery />
          <ShukarHaiTestimonial />
          <ConnectCta className="mt-[434px]" />
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
