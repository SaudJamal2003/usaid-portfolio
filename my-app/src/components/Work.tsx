import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useContent } from '../content/context'
import { handleLinkClick } from '../router'
import arrow from '../assets/figma/arrow.svg'
import teaser from '../assets/figma/work-teaser.png'
import cricpr from '../assets/figma/work-cricpr.png'
import karoCar from '../assets/figma/work-karo-car.png'
import shukarHai from '../assets/figma/work-shukar-hai.png'
import sprinto from '../assets/figma/work-sprinto.png'

type Project = {
  name: string
  description: string
  cover: string
  /** Aspect ratio of the artboard slot in the Figma grid. */
  aspect: string
  /** Case study page, where one has been built. */
  href?: string
}

/* Bundled fallback, used when the CMS is unreachable or returns nothing (§18). */
const FALLBACK_PROJECTS: Project[] = [
  {
    name: 'Shukar hai',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.',
    cover: shukarHai,
    aspect: '586/466',
    href: '/work/shukar-hai',
  },
  {
    name: 'CricPR',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought, 4x faster than your keyboard.',
    cover: cricpr,
    aspect: '675/466',
  },
  {
    name: 'Sprinto',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought, 4x faster than your keyboard.',
    cover: sprinto,
    aspect: '675/466',
  },
  {
    name: 'Karo Car',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.',
    cover: karoCar,
    aspect: '586/466',
  },
]

function ProjectCard({ project }: { project: Project }) {
  const isComingSoon = !project.href
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const cardRef = useRef<HTMLDivElement & HTMLAnchorElement>(null)

  /* Scrolling slides the card out from under a stationary cursor without any
     mouse event being dispatched, which would otherwise leave the label pinned
     to a spot the card no longer occupies. Re-ask the document what is actually
     under the pointer instead of trusting the last hover we saw. */
  useEffect(() => {
    if (!cursorPos) return

    const verify = () => {
      const under = document.elementFromPoint(cursorPos.x, cursorPos.y)
      if (!under || !cardRef.current?.contains(under)) setCursorPos(null)
    }

    // Capture, so a scroll inside any nested scroller counts too.
    window.addEventListener('scroll', verify, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', verify, { capture: true })
  }, [cursorPos])

  const Tag = isComingSoon ? 'div' : 'a'
  /* Every card swaps the pointer for a label; only the wording differs between
     a case study you can open and one that isn't built yet. */
  const hint = isComingSoon ? 'Coming soon 👀' : 'Click me 👆🏻'

  return (
    <Tag
      {...(!isComingSoon && {
        href: project.href,
        onClick: (e: MouseEvent<HTMLElement>) => handleLinkClick(e, project.href!),
      })}
      ref={cardRef}
      className="group relative flex cursor-none flex-col"
      onMouseMove={(e: React.MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setCursorPos(null)}
    >
      {cursorPos && (
        <span
          // Sits inside the anchor, so it would otherwise be read out as part of
          // the link's name.
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black px-4 py-2 text-[15px] font-medium text-white shadow-lg"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          {hint}
        </span>
      )}
      <div className="flex flex-col transition-transform duration-300 ease-out will-change-transform group-hover:-rotate-2 group-hover:scale-[1.02]">
        <img
          src={project.cover}
          alt={`${project.name} case study cover`}
          className="w-full"
          style={{ aspectRatio: project.aspect }}
        />
        <div className="mt-[23px] flex flex-col gap-[17px]">
          <div className="flex items-center gap-[8px]">
            <h3 className="font-display text-[24px] font-medium leading-[23.755px] tracking-[-0.0173em] text-black">
              {project.name}
            </h3>
            <img src={arrow} alt="" className="size-[20px]" />
          </div>
          <p className="text-[20px] font-medium leading-[26px] text-ink">{project.description}</p>
        </div>
      </div>
    </Tag>
  )
}

export function Work() {
  const content = useContent()

  /* Featured projects, in the order the CMS sets, otherwise the bundled list.
     Falls back to all published projects if nothing is marked featured, so the
     section can never empty itself just because the flag was cleared.

     The rows keep their Figma column ratios, so the grid geometry is unchanged
     either way -- the CMS supplies content, never layout. */
  const fromCms = content?.projects.filter((project) => project.featured) ?? []
  const cmsProjects = fromCms.length > 0 ? fromCms : (content?.projects ?? [])

  const projects: Project[] =
    cmsProjects.length > 0
      ? cmsProjects.map((project) => ({
          name: project.title,
          description: project.shortDescription ?? '',
          cover: project.thumbnail?.mediumUrl ?? project.thumbnail?.url ?? '',
          aspect: project.aspectRatio ?? '586/466',
          href: project.caseStudySlug ? `#/work/${project.caseStudySlug}` : undefined,
        }))
      : FALLBACK_PROJECTS

  const rowOne = projects.slice(0, 2)
  const rowTwo = projects.slice(2, 4)

  return (
    <section id="work" className="mt-[239px] px-4 sm:px-6">
      <h2 className="text-center font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.05em] text-ink">
        My Latest Work
      </h2>

      <div className="mx-auto mt-[35px] w-full max-w-[1405px] rounded-[30px] bg-panel p-6 pb-16 sm:p-10 sm:pb-20 lg:p-[60px] lg:pb-[120px]">
        <div className="flex flex-col gap-[40px]">
          <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-[586fr_675fr] lg:gap-[24px]">
            {rowOne.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-[675fr_586fr] lg:gap-[24px]">
            {rowTwo.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-[20px] lg:mt-[120px]">
          <img src={teaser} alt="" className="h-[162px] w-[165px] object-contain" />
          <p className="text-center font-display text-[clamp(32px,3.9vw,56px)] leading-[1.119] tracking-[-0.05em] text-black">
            New cases are on the way,
            <br />
            slowly but surely 😅
          </p>
        </div>
      </div>
    </section>
  )
}
