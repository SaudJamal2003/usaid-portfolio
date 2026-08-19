import { useRef, useCallback } from 'react'
import connectorDown from '../assets/figma/connector-down.svg'
import connectorUp from '../assets/figma/connector-up.svg'
import job1 from '../assets/figma/job-1.png'
import job2 from '../assets/figma/job-2.png'
import job3 from '../assets/figma/job-3.png'
import job4 from '../assets/figma/job-4.png'

const HIGHLIGHTS = [
  'Own end to end product design across Resident App, ERP, Payments, Helpdesk, and Smart Devices.',
  'Led the design and launch of QuickPass, now used across 500+ societies with 28,000+ downloads.',
  'Redesigned the Helpdesk ecosystem and contributed to large scale payments and access control experiences.',
]

type Role = {
  title: string
  company: string
  location: string
  logo: string
  logoClassName: string
  rotate: number
  period: { lead: string; accent?: string; tone: 'mint' | 'sky' }
  connector: { asset: 'down' | 'up'; flipped: boolean }
  group: { width: number; height: number }
  card: { top: number; width: number; height: number }
  pill: { left: number; top: number; width: number; gap: number; place: 'above' | 'below' }
}

const ROLES: Role[] = [
  {
    title: 'Associate UX Designer',
    company: 'Bytecorp Technologies',
    location: 'KHI',
    logo: job1,
    logoClassName: 'size-[45px] rounded-[6px]',
    rotate: 2.28,
    period: { lead: 'Jan \'26      -      ', accent: 'Present', tone: 'mint' },
    connector: { asset: 'down', flipped: false },
    group: { width: 462.087, height: 500.74 },
    card: { top: 70.31, width: 462.087, height: 430.427 },
    pill: { left: 144, top: 0, width: 139, gap: 5, place: 'above' },
  },
  {
    title: 'UX Designer',
    company: 'Codefied',
    location: 'KHI',
    logo: job2,
    logoClassName: 'size-[45px] rounded-[6px] border border-hairline',
    rotate: -3.58,
    period: { lead: 'Jun \'25      -      Jan \'26', tone: 'sky' },
    connector: { asset: 'up', flipped: true },
    group: { width: 470.941, height: 505.828 },
    card: { top: 0, width: 470.941, height: 440.068 },
    pill: { left: 167, top: 423.33, width: 136, gap: 9, place: 'below' },
  },
  {
    title: 'UX Designer',
    company: 'Techtree.io',
    location: 'KHI',
    logo: job3,
    logoClassName: 'size-[45px] rounded-[6px] border border-hairline',
    rotate: 4.36,
    period: { lead: 'Jun \'25      -      Jan \'26', tone: 'sky' },
    connector: { asset: 'up', flipped: false },
    group: { width: 476.134, height: 508.24 },
    card: { top: 62.5, width: 476.134, height: 445.74 },
    pill: { left: 170.43, top: 0, width: 136, gap: 6, place: 'above' },
  },
  {
    title: 'UI/UX Designer Intern',
    company: 'Improdata',
    location: 'KHI',
    logo: job4,
    logoClassName: 'size-[44.235px] rounded-[4px] border border-hairline',
    rotate: -3.58,
    period: { lead: 'Jun \'25      -      Jan \'26', tone: 'sky' },
    connector: { asset: 'up', flipped: true },
    group: { width: 470.941, height: 505.828 },
    card: { top: 0, width: 470.941, height: 440.068 },
    pill: { left: 167, top: 423.33, width: 136, gap: 9, place: 'below' },
  },
]

function Connector({ connector }: { connector: Role['connector'] }) {
  return (
    <div className="relative h-[42.5px] w-[8px] shrink-0">
      <div className="absolute inset-[-2.35%_-12.5%_-1.18%_-12.5%]">
        <img
          src={connector.asset === 'down' ? connectorDown : connectorUp}
          alt=""
          className={`block size-full ${connector.flipped ? '-scale-y-100' : ''}`}
        />
      </div>
    </div>
  )
}

function PeriodPill({ period }: { period: Role['period'] }) {
  const tone =
    period.tone === 'mint' ? 'bg-mint border-mint-edge' : 'bg-sky border-sky-edge'

  return (
    <div className={`flex w-full items-center justify-center rounded-[40px] border p-[10px] ${tone}`}>
      <p className="whitespace-pre text-[16px] leading-normal tracking-[-0.0625em] text-black font-display">
        {period.lead}
        {period.accent && <span className="text-mint-edge">{period.accent}</span>}
      </p>
    </div>
  )
}

function RoleCard({ role }: { role: Role }) {
  return (
    <div
      className="relative h-[413px] w-[446px] overflow-hidden rounded-[10px] border-[3px] border-white bg-panel shadow-[0_4px_14px_0_rgba(0,0,0,0.08)]"
      style={{ transform: `rotate(${role.rotate}deg)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[92px] bg-white" />

      <div className="absolute left-[21px] top-[23px] flex w-[402px] items-center justify-between">
        <div className="flex items-center gap-[11px]">
          <img src={role.logo} alt="" className={`shrink-0 object-cover ${role.logoClassName}`} />
          <div className="flex min-w-[217px] flex-col gap-[8px] whitespace-nowrap font-display tracking-[-0.0417em]">
            <p className="text-[24px] leading-normal text-black">{role.title}</p>
            <p className="text-[16px] leading-normal text-muted">{role.company}</p>
          </div>
        </div>
        <p className="font-display text-[17px] font-medium leading-normal text-meta">{role.location}</p>
      </div>

      <ul className="absolute left-[14px] top-[259px] w-[388px] -translate-y-1/2 space-y-[26px] font-display text-[17px] leading-normal text-graphite">
        {HIGHLIGHTS.map((item) => (
          <li key={item} className="ms-[25.5px] list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RoleGroup({ role }: { role: Role }) {
  const above = role.pill.place === 'above'

  return (
    <div
      className="relative shrink-0"
      style={{ width: role.group.width, height: role.group.height }}
    >
      <div
        className="absolute left-0 flex items-center justify-center"
        style={{ top: role.card.top, width: role.card.width, height: role.card.height }}
      >
        <RoleCard role={role} />
      </div>

      <div
        className="absolute flex flex-col items-center"
        style={{
          left: role.pill.left,
          top: role.pill.top,
          width: role.pill.width,
          gap: role.pill.gap,
        }}
      >
        {above ? (
          <>
            <PeriodPill period={role.period} />
            <Connector connector={role.connector} />
          </>
        ) : (
          <>
            <Connector connector={role.connector} />
            <PeriodPill period={role.period} />
          </>
        )}
      </div>
    </div>
  )
}

/** Hook: click-and-drag horizontal scroll for desktop mice */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current
    if (!el || !state.current.isDown) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - state.current.startX) * 1.5 // multiplier for speed
    el.scrollLeft = state.current.scrollLeft - walk
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    state.current.isDown = false
    ref.current?.releasePointerCapture(e.pointerId)
  }, [])

  return { ref, onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp }
}

type JourneyProps = {
  /** section spacing — differs between the home page and the about page */
  className?: string
  /** Desktop-1 hangs the heading off the first card; Desktop-6 centres it */
  align?: 'left' | 'center'
}

export function Journey({ className = 'mt-[175px]', align = 'left' }: JourneyProps) {
  // Destructured rather than kept as one `drag` object: reading members off a
  // hook return that carries a ref trips react-hooks/refs during render.
  const { ref: dragRef, onPointerDown, onPointerMove, onPointerUp, onPointerLeave } =
    useDragScroll()
  const centered = align === 'center'

  return (
    <section id="about" className={className}>
      <h2
        className={`px-6 font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.05em] text-ink ${
          centered ? 'text-center lg:px-[223px]' : 'lg:px-0 lg:ps-[402px]'
        }`}
      >
        The Journey So Far
      </h2>

      <div
        ref={dragRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        className="mt-[116px] cursor-grab select-none overflow-x-auto pb-4 active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className={`flex w-max gap-[40px] px-6 lg:pe-[60px] ${
            centered ? 'lg:ps-[223px]' : 'lg:ps-[402px]'
          }`}
        >
          {ROLES.map((role) => (
            <RoleGroup key={role.company} role={role} />
          ))}
        </div>
      </div>
    </section>
  )
}