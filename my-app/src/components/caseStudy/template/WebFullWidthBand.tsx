import type { CmsBlock, CmsMedia } from '../../../content/types'

export function WebFullWidthBand({ band }: { band?: CmsBlock }) {
  const media = band?.data.media as CmsMedia | null | undefined
  const externalUrl = band?.data.externalUrl as string | undefined
  const grayscale = (band?.data.grayscale as boolean) ?? true
  const source = media?.url ?? (externalUrl?.trim() || null)
  if (!source) return null

  return (
    <section className="mt-[200px]">
      <video
        src={source}
        autoPlay
        loop
        muted
        playsInline
        className={`h-auto w-full ${grayscale ? 'grayscale' : ''}`}
      />
    </section>
  )
}
