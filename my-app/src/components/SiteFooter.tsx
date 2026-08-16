import { useState } from 'react'
import copyIcon from '../assets/figma/copy-icon.svg'
import socialX from '../assets/figma/social-1.png'
import socialInstagram from '../assets/figma/social-2.png'
import socialDribbble from '../assets/figma/social-3.png'
import socialThreads from '../assets/figma/social-4.png'
import socialLinkedin from '../assets/figma/social-5.png'

const EMAIL = 'usaid.ahmedmay@gmail.com'

const SOCIALS = [
  { name: 'X', icon: socialX, rotate: 3 },
  { name: 'Instagram', icon: socialInstagram, rotate: 8 },
  { name: 'Dribbble', icon: socialDribbble, rotate: -4 },
  { name: 'Threads', icon: socialThreads, rotate: 3 },
  { name: 'LinkedIn', icon: socialLinkedin, rotate: -3 },
]

export function SiteFooter() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <footer className="mt-[45px] px-6 pb-6">
      <div className="mx-auto flex w-full flex-col items-center justify-between gap-6 rounded-[32px] bg-shell px-[32px] py-6 sm:flex-row sm:gap-0 sm:py-0 lg:h-[104px]">
        <button
          type="button"
          onClick={copyEmail}
          className="flex items-center justify-center gap-[8px] text-center"
          aria-label={`Copy email address ${EMAIL}`}
        >
          <span className="font-display text-[clamp(18px,2vw,26px)] font-medium leading-[1.2] text-black">
            {EMAIL}
          </span>
          <img src={copyIcon} alt="" className="size-[24px] shrink-0" />
          <span className="sr-only" aria-live="polite">
            {copied ? 'Email copied' : ''}
          </span>
        </button>

        <ul className="flex h-[88px] items-center justify-center">
          {SOCIALS.map((social) => (
            <li key={social.name} className="flex size-[72px] items-center justify-center">
              <a href="#contact" aria-label={social.name}>
                <img
                  src={social.icon}
                  alt=""
                  className="size-[64px] object-cover"
                  style={{ transform: `rotate(${social.rotate}deg)` }}
                />
              </a>  
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
