import quoteMark from '../assets/figma/shukar-quote.svg'
import founderPortrait from '../assets/figma/shukar-testimonial.png'

export function ShukarHaiTestimonial() {
  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1153px] flex-col gap-[64px]">
        <h2 className="font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.0375em] text-ink">
        What <span className="font-bold">Shukar Hai</span> Had to Say
      </h2>

      <figure className="grid grid-cols-1 items-center gap-[31px] lg:grid-cols-2">
        <div className="relative aspect-[561/628] w-full overflow-hidden rounded-[20px] border border-white bg-panel shadow-[0_4px_21px_0_rgba(0,0,0,0.07)]">
          <img
            src={founderPortrait}
            alt="Osamah Nasir, founder of Shukar Hai"
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-[40px] rounded-[20px] border border-hairline bg-white px-[24px] py-[40px] lg:min-h-[628px]">
          <img src={quoteMark} alt="" className="h-[75px] w-[76px] shrink-0 opacity-10" />
          <blockquote className="max-w-[501px] font-display text-[clamp(20px,1.94vw,28px)] tracking-[-0.0357em] text-black">
            The food was absolutely incredible from the very first bite. Every dish was fresh,
            flavorful, and beautifully presented, making the entire dining experience feel authentic
            and memorable. The staff was welcoming, the atmosphere was warm and inviting, and you
            could tell that every meal was prepared with genuine care. I’ll definitely be coming
            back and recommending this place to friends and family."
          </blockquote>
          </div>
        </figure>
      </div>
    </section>
  )
}
