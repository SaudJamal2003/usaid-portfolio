import animation from '../assets/figma/animation-shukr-he.mp4'

/* Full-bleed band: Figma stacks thirteen overlapping, clipped photographs behind
   the brushed "شکر ہے" wordmark, so it ships as one flattened export. */
export function ShukarHaiGallery() {
  return (
    <section className="mt-[200px]">
       <video
        src={animation}
        autoPlay
        loop
        muted
        playsInline
        className="h-auto w-full grayscale"
        width={1440}
        height={770}
      />
    </section>
  )
}
