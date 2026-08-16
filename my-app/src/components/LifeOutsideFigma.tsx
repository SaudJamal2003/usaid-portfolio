import camera from '../assets/figma/life-camera.png'
import photoCricket from '../assets/figma/life-cricket.png'
import photoKashmir from '../assets/figma/life-kashmir.png'
import photoMusic from '../assets/figma/life-music.png'
import photoPadel from '../assets/figma/life-padel.png'
import photoTrophy from '../assets/figma/life-trophy.png'
import playIcon from '../assets/figma/play-bold.svg'
import frame from '../assets/figma/polaroid-frame.svg'
import frameSmall from '../assets/figma/polaroid-frame-small.svg'
import frameTall from '../assets/figma/polaroid-frame-tall.svg'

/* The collage is laid out as percentages of the 1392×1311 Figma frame and type
   is sized in cqw, so the whole thing scales with its container instead of
   snapping between breakpoints. Every card is the same polaroid shape at a
   different size, which is why the photo inset below is shared by all of them. */
const PHOTO = { left: 2.4293, top: 1.7373, width: 95.0308, height: 74.5533 }

type Polaroid = {
  id: string
  frame: string
  photo: string
  alt: string
  caption: string
  /** placement on the stage, in % */
  left: number
  top: number
  width: number
  height: number
  rotate: number
  /** caption box, in % of the card */
  captionLeft: number
  captionCenterY: number
  captionWidth?: number
  /** caption type size, in cqw of the stage */
  captionSize: number
  captionLeading: number
  nowPlaying?: boolean
}

const POLAROIDS: Polaroid[] = [
  {
    id: 'kashmir',
    frame: frameSmall,
    photo: photoKashmir,
    alt: 'Usaid sitting on a hillside in Azad Kashmir, looking out at the mountains',
    caption: 'Azaad Kashmir',
    left: 43.6042,
    top: 38.5332,
    width: 16.2555,
    height: 17.2231,
    rotate: 0,
    captionLeft: 9.1924,
    captionCenterY: 87.5975,
    captionSize: 2.1139,
    captionLeading: 1.119,
  },
  {
    id: 'trophy',
    frame,
    photo: photoTrophy,
    alt: 'Usaid sitting on a football pitch next to a tall gold trophy',
    caption: 'Flexxxinggg....',
    left: 11.1249,
    top: 33.8267,
    width: 22.3862,
    height: 27.6161,
    rotate: 6.07,
    captionLeft: 9.178,
    captionCenterY: 87.558,
    captionWidth: 53.5905,
    captionSize: 2.9113,
    captionLeading: 1.119,
  },
  {
    id: 'cricket',
    frame,
    photo: photoCricket,
    alt: 'Usaid playing a shot during a cricket match',
    caption: 'Doing what i love',
    left: 28.9186,
    top: 63.7191,
    width: 22.3862,
    height: 27.6161,
    rotate: -4.78,
    captionLeft: 9.178,
    captionCenterY: 87.558,
    captionSize: 2.9113,
    captionLeading: 1.119,
  },
  {
    id: 'padel',
    frame: frameTall,
    photo: photoPadel,
    alt: 'A rooftop padel court with players mid rally',
    caption: 'You’ll find me at padel court aswell',
    left: 70.9152,
    top: 26.6605,
    width: 22.3862,
    height: 29.4568,
    rotate: 6.12,
    captionLeft: 6.0876,
    captionCenterY: 86.6521,
    captionWidth: 84.7942,
    captionSize: 2.9113,
    captionLeading: 0.889,
  },
  {
    id: 'music',
    frame,
    photo: photoMusic,
    alt: 'Cover art for “Pyaar” by Naam Sujal — a portrait lit in teal and orange',
    caption: '“Pyaar” by Naam sujal',
    left: 59.8139,
    top: 63.314,
    width: 22.3862,
    height: 27.6161,
    rotate: 7.61,
    captionLeft: 9.178,
    captionCenterY: 87.558,
    captionSize: 2.9113,
    captionLeading: 1.119,
    nowPlaying: true,
  },
]

function NowPlayingBadge() {
  return (
    <div
      className="absolute left-[41.0538%] top-[65.3591%] flex items-center gap-[0.7184cqw] rounded-[2.1552cqw] border border-white/[0.37] bg-white/10 p-[0.7184cqw] backdrop-blur-[1.31cqw]"
      style={{ transform: 'translate(-50%, -50%) rotate(0.85deg)' }}
    >
      <img src={playIcon} alt="" className="size-[1.7241cqw]" />
      <p className="whitespace-nowrap font-display text-[1.2931cqw] capitalize leading-none text-white">
        Listening rightnow
      </p>
    </div>
  )
}

function PolaroidCard({ card }: { card: Polaroid }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${card.left}%`,
        top: `${card.top}%`,
        width: `${card.width}%`,
        height: `${card.height}%`,
        transform: `rotate(${card.rotate}deg)`,
      }}
    >
      <img
        src={card.frame}
        alt=""
        className="absolute inset-0 size-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
      />
      <img
        src={card.photo}
        alt={card.alt}
        className="absolute object-cover"
        style={{
          left: `${PHOTO.left}%`,
          top: `${PHOTO.top}%`,
          width: `${PHOTO.width}%`,
          height: `${PHOTO.height}%`,
        }}
      />
      {card.nowPlaying && <NowPlayingBadge />}
      <p
        className="absolute -translate-y-1/2 font-brush capitalize tracking-[-0.0714em] text-black"
        style={{
          left: `${card.captionLeft}%`,
          top: `${card.captionCenterY}%`,
          width: card.captionWidth ? `${card.captionWidth}%` : undefined,
          whiteSpace: card.captionWidth ? undefined : 'nowrap',
          fontSize: `${card.captionSize}cqw`,
          lineHeight: card.captionLeading,
        }}
      >
        {card.caption}
      </p>
    </div>
  )
}

export function LifeOutsideFigma() {
  return (
    <section className="mt-[218px] px-6">
      <div className="mx-auto max-w-[1392px] overflow-hidden rounded-[30px] bg-panel dot-grid">
        <div className="@container relative aspect-[1392/1311] w-full">
          <h2 className="absolute inset-x-0 top-[9.6873%] text-center font-display text-[clamp(22px,5.7471cqw,80px)] leading-[1.1] tracking-[-0.05em] text-ink">
            Life Outside Figma
          </h2>

          <img
            src={camera}
            alt=""
            className="absolute left-[37.5719%] top-[19.5271%] h-[36.9947%] w-[27.5409%] object-contain"
          />

          {POLAROIDS.map((card) => (
            <PolaroidCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
