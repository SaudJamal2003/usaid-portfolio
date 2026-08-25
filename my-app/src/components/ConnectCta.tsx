import { useContent } from '../content/context'

/* The Connect button is a stack of gradient shells, reproduced at the Figma
   dimensions and scaled down as a unit on narrow screens. */
function Burst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <g stroke="#f4885a" strokeWidth="8" strokeLinecap="round">
        <path d="M48 6 L55 40" />   {/* near-vertical */}
        <path d="M12 28 L41 51" />  {/* diagonal */}
        <path d="M6 66 L41 61" />   {/* near-horizontal */}
      </g>
    </svg>
  )
}

function ConnectButton({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} className="group relative block h-[443px] w-[677px]" aria-label={label}>
      {/* pop marks — hidden until hover */}
      <div className="pointer-events-none absolute left-[5px] top-[72px] h-[130px] w-[130px] origin-bottom-right scale-50 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100">
        <Burst className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute bottom-[52px] right-[5px] h-[130px] w-[130px] origin-top-left scale-50 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100">
        <Burst className="h-full w-full rotate-180" />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[4deg]">
        <div className="relative h-[213.471px] w-[574px] rounded-[101.201px] bg-gradient-to-b from-[#e6e6e6] to-[#a6a6a6] drop-shadow-[0_4.744px_2.372px_#b8b8b8]">
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_-5.534px_2.372px_0_#cfcfcf,inset_0_-6.325px_0.791px_0_#ffffff]" />

          <div className="absolute left-[17.39px] top-[7.91px] h-[180.264px] w-[539.212px] overflow-hidden rounded-[86.97px] bg-black shadow-[0_2.372px_0_3.163px_#000000,0_11.069px_6.325px_0_rgba(0,0,0,0.2),0_15.022px_6.325px_0_rgba(0,0,0,0.3),0_50.601px_101.201px_0_rgba(0,0,0,0.25)]">
            <div className="absolute inset-0 rounded-[86.97px] bg-[#1f1f1f]" />

            <div className="absolute left-0 top-0 h-[168.405px] w-[539.212px] rounded-[86.97px] bg-gradient-to-b from-[#424242] to-[#2b2b2b]">
              {/* orange face fades in on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-[#ee8f63] to-[#d96b41] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />

              <p className="absolute left-1/2 top-[20.11px] z-10 -translate-x-1/2 whitespace-nowrap bg-gradient-to-t from-white/80 to-white bg-clip-text text-center font-['Inter',sans-serif] text-[101.201px] font-medium leading-[121.441px] tracking-[-0.0156em] text-transparent">
                {label}
              </p>
              <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] shadow-[inset_0_-2.372px_0.791px_0_rgba(255,255,255,0.1),inset_0_9.488px_4.744px_0_rgba(0,0,0,0.1)]" />
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

export function ConnectCta({ className = 'mt-[222px]' }: { className?: string }) {
  const content = useContent()

  /* Only the words come from the CMS. The gradient stack, the hover burst and
     the scaling are the frontend's business. */
  const note = content?.contactCta?.note ?? "Tap this 'tiny' button to highlight your product =)"
  const label = content?.contactCta?.buttonLabel ?? 'Connect'
  const url = content?.contactCta?.buttonUrl ?? '#contact'

  return (
    <section id="contact" className={`flex justify-center overflow-hidden px-6 ${className}`}>
      <div className="flex h-[238px] items-start sm:h-[325px] lg:h-[433px]">
        <div className="origin-top scale-[0.55] sm:scale-75 lg:scale-100">
          <div className="flex h-[433px] w-[726px] flex-col items-center justify-center">
            <div className="-mb-[33px] h-[61px] w-[273px]">
              <p className="-rotate-[5deg] text-center font-hand text-[32px] font-bold leading-[30.72px] tracking-[-0.03125em] text-black/40 ">
                {note}
              </p>
            </div>
            <ConnectButton label={label} url={url} />
          </div>
        </div>
      </div>
    </section>
  )
}