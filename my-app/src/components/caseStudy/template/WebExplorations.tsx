import type { CmsBlock, CmsMedia } from '../../../content/types'

/**
 * Same card frame/shadow/radius as the reference. The reference crops each
 * image via a hand-tuned percentage inset baked to its specific pre-cropped
 * export; a CMS-authored image has no such export, so this uses plain
 * object-cover instead -- a deliberate simplification, not an oversight.
 */
export function WebExplorations({ gallery }: { gallery?: CmsBlock }) {
  const images = ((gallery?.data.media as CmsMedia[] | undefined) ?? []).filter(Boolean)
  if (images.length === 0) return null

  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1226px] flex-col gap-[45px]">
        <header className="flex max-w-[1188px] flex-col gap-[18px]">
          <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium tracking-[-0.0357em] text-ink">
            Iterating in multiple directions
          </h2>
        </header>

        <div className="grid grid-cols-1 items-center gap-[44px] lg:grid-cols-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-[589/514] w-full max-w-[589px] overflow-hidden rounded-[20px] border border-white bg-panel shadow-[0_4px_21px_0_rgba(0,0,0,0.07)]"
            >
              <img src={image.mediumUrl} alt={image.alt} className="absolute inset-0 size-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
