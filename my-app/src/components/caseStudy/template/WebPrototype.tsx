import type { CmsBlock, CmsMedia } from '../../../content/types'

/** "UI that went live!" is fixed template chrome -- every Web case study
 *  uses this heading; the video and its caption are CMS-authored. */
export function WebPrototype({ prototype }: { prototype?: CmsBlock }) {
  const media = prototype?.data.media as CmsMedia | null | undefined
  const externalUrl = prototype?.data.externalUrl as string | undefined
  const caption = (prototype?.data.caption as string) ?? ''
  const source = media?.url ?? (externalUrl?.trim() || null)
  if (!source) return null

  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto w-full max-w-[1395px] rounded-[30px] bg-panel px-6 py-16 sm:px-10 sm:py-20 lg:px-[79px] lg:py-[100px]">
        <div className="flex flex-col gap-[39px]">
          <div className="flex max-w-[1225px] flex-col gap-[24px] lg:flex-row lg:gap-[17px]">
            <h2 className="font-display text-[clamp(32px,3.89vw,56px)] leading-[1.107] tracking-[-0.0357em] text-ink lg:w-[695px]">
              <span className="font-medium">UI that went live!</span>
              <br />
              Quickly know what I did
            </h2>
            {caption.trim() && (
              <p className="font-display text-[clamp(20px,2.22vw,32px)] text-body lg:w-[513px]">{caption}</p>
            )}
          </div>

          <div className="rounded-[37px] bg-white p-[19.73px_24.67px] shadow-[0_4.93px_29.6px_0_rgba(0,0,0,0.1)]">
            <video
              src={source}
              autoPlay
              loop
              muted
              playsInline
              className="h-auto w-full rounded-[24.67px]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
