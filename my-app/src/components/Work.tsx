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

const ROW_ONE: Project[] = [
  {
    name: 'Shukar hai',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought.',
    cover: shukarHai,
    aspect: '586/466',
    href: '#/work/shukar-hai',
  },
  {
    name: 'CricPR',
    description:
      'Voice that finally works is here. Flow lets you create, code, message, and write at the speed of thought, 4x faster than your keyboard.',
    cover: cricpr,
    aspect: '675/466',
  },
]

const ROW_TWO: Project[] = [
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
  return (
    <a href={project.href ?? '#work'} className="group flex flex-col">
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
    </a>
  )
}

export function Work() {
  return (
    <section id="work" className="mt-[239px] px-4 sm:px-6">
      <h2 className="text-center font-display text-[clamp(40px,5.56vw,80px)] leading-[1.1] tracking-[-0.05em] text-ink">
        My Latest Work
      </h2>

      <div className="mx-auto mt-[35px] w-full max-w-[1405px] rounded-[30px] bg-panel p-6 pb-16 sm:p-10 sm:pb-20 lg:p-[60px] lg:pb-[120px]">
        <div className="flex flex-col gap-[40px]">
          <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-[586fr_675fr] lg:gap-[24px]">
            {ROW_ONE.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-[675fr_586fr] lg:gap-[24px]">
            {ROW_TWO.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-[20px] lg:mt-[120px]">
          <img src={teaser} alt="" className="h-[162px] w-[165px] object-contain" />
          <p className="text-center font-display text-[clamp(32px,3.9vw,56px)] leading-[1.119] tracking-[-0.0714em] text-black">
            New cases are on the way,
            <br />
            slowly but surely 😅
          </p>
        </div>
      </div>
    </section>
  )
}
