import mentorMain from '../assets/figma/mentor-main.png'
import polaroidOne from '../assets/figma/mentor-polaroid-1.png'
import polaroidTwo from '../assets/figma/mentor-polaroid-2.png'
import paperclip from '../assets/figma/paperclip.png'
import paperclipHook from '../assets/figma/paperclip-hook.svg'
import underline from '../assets/figma/mentor-underline.svg'

const TRIBUTE =
  'My brother, Tarib Ahmed, has been one of the most influential people in my life. More than a brother, he has been a mentor, guide, and constant source of support throughout my journey. From teaching me valuable lessons early on to helping me navigate challenges and opportunities, his advice and encouragement have shaped the way I think and grow. Through every high and low, he has always stood beside me, believing in me even when I doubted myself. Much of who I am today—both personally and professionally—is a reflection of the support, values, and confidence he helped instill in me.'

/* The collage keeps the Figma geometry (724×667, coordinates relative to the
   photo column) and is scaled down as a whole on narrow screens. */
function PhotoCollage() {
  return (
    <div className="relative h-[667px] w-[724px] shrink-0">
      {/* Main photo */}
      <div className="absolute left-0 top-0 flex h-[666.811px] w-[516.653px] items-center justify-center">
        <div className="rotate-[4.05deg]">
          <div className="relative h-[635px] w-[473px] rounded-[30px] border-4 border-[rgba(250,250,250,0.93)] shadow-[0_4px_24px_0_rgba(0,0,0,0.4)]">
            <img
              src={mentorMain}
              alt="Tarib Ahmed"
              className="absolute inset-0 size-full rounded-[30px] object-cover"
            />
          </div>
        </div>
      </div>

      {/* Polaroid 2 — behind */}
      <div className="absolute left-[426px] top-[393px] z-999 flex h-[274.245px] w-[246.634px] items-center justify-center">
        <div className="-rotate-[15.78deg]">
          <div className="relative h-[231px] w-[191px] overflow-hidden rounded-[30px] border border-panel shadow-[0_4px_24px_0_rgba(0,0,0,0.25)]">
            <img src={polaroidOne} alt="" className="absolute inset-0 size-full rounded-[30px] object-cover grayscale" />
          </div>
        </div>
      </div>

      {/* Polaroid 1 — on top */}
      <div className="absolute left-[517px] top-[423px] z-20 flex h-[244.06px] w-[207.021px] items-center justify-center">
        <div className="rotate-[4.1deg]">
          <div className="relative h-[231px] w-[191px] overflow-hidden rounded-[30px] border border-panel shadow-[0_4px_24px_0_rgba(0,0,0,0.25)]">
            <img src={polaroidTwo} alt="" className="absolute inset-0 size-full rounded-[30px] object-cover grayscale" />
          </div>
        </div>
      </div>

      {/* Paperclip — blend away the white background */}
      <img src={paperclipHook} alt="" className="absolute left-[459px] top-[34px] z-30 h-[28.5px] w-[20.5px]" />
      <img src={paperclip} alt="" className="absolute left-[474.9px] top-[99.4px] z-30 size-[107.41px] mix-blend-multiply" />
    </div>
  )
}

export function Mentors() {
  return (
    <section className="mt-[288px] px-6">
      <div className="mx-auto flex w-full max-w-[1288px] flex-col gap-16 lg:grid lg:grid-cols-[524px_724px] lg:gap-[40px]">
        <div className="lg:pt-[15.9px]">
          <h2 className="max-w-[467px] font-display text-[clamp(36px,3.9vw,56px)] leading-[1.119] tracking-[-0.0536em] text-black">
            Mentors who made me all I am today.
          </h2>
          <img src={underline} alt="" className="-mt-[9px] h-[29px] w-[363px] max-w-full" />

          <p className="mt-[83px] font-display text-[40px] capitalize leading-[1.119] tracking-[-0.05em] text-black">
            Tarib Ahmed
          </p>
          <p className="mt-[8px] font-display text-[24px] capitalize leading-[1.119] tracking-[-0.0417em] text-muted">
            COO - Techtree
          </p>
          <p className="mt-[40px] max-w-[524px] text-[20px] font-medium leading-[26px] text-ink">{TRIBUTE}</p>
        </div>

        <div className="flex h-[290px] justify-center overflow-hidden sm:h-[420px] lg:h-[667px] lg:justify-start lg:overflow-visible">
          <div className="origin-top scale-[0.42] sm:scale-[0.6] lg:scale-100">
            <PhotoCollage />
          </div>
        </div>
      </div>
    </section>
  )
}
