import quoteMark from '../../../assets/figma/shukar-quote.svg'
import type { CmsBlock, CmsMedia } from '../../../content/types'

/** "What <name> Had to Say" -- the bolded name is the case study's own
 *  client/title, everything else is fixed template chrome. The reference has
 *  no separate attribution line (it's implied by the heading); this adds one
 *  only when the block actually has attribution/role filled in. */
export function WebTestimonial({ testimonial, name }: { testimonial?: CmsBlock; name: string }) {
  const quote = (testimonial?.data.quote as string) ?? ''
  const attribution = (testimonial?.data.attribution as string) ?? ''
  const role = (testimonial?.data.role as string) ?? ''
  const portrait = testimonial?.data.portrait as CmsMedia | null | undefined
  if (!quote.trim()) return null

  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1153px] flex-col gap-[64px]">
        <h2 className="font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.0375em] text-ink">
          What <span className="font-bold">{name}</span> Had to Say
        </h2>

        <figure className="grid grid-cols-1 items-center gap-[31px] lg:grid-cols-2">
          {portrait && (
            <div className="relative aspect-[561/628] w-full overflow-hidden rounded-[20px] border border-white bg-panel shadow-[0_4px_21px_0_rgba(0,0,0,0.07)]">
              <img src={portrait.url} alt={portrait.alt} className="absolute inset-0 size-full object-cover" />
            </div>
          )}

          <div className="flex flex-col gap-[40px] rounded-[20px] border border-hairline bg-white px-[24px] py-[40px] lg:min-h-[628px]">
            <img src={quoteMark} alt="" className="h-[75px] w-[76px] shrink-0 opacity-10" />
            <blockquote className="max-w-[501px] font-display text-[clamp(20px,1.94vw,28px)] tracking-[-0.0357em] text-black">
              {quote}
            </blockquote>
            {(attribution.trim() || role.trim()) && (
              <p className="font-display text-[16px] text-muted">
                {attribution.trim()}
                {attribution.trim() && role.trim() && ' · '}
                {role.trim()}
              </p>
            )}
          </div>
        </figure>
      </div>
    </section>
  )
}
