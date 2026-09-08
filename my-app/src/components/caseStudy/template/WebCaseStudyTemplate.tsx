import type { CmsCaseStudy } from '../../../content/types'
import { WebHero } from './WebHero'
import { WebProblem } from './WebProblem'
import { WebResearchPanel } from './WebResearchPanel'
import { WebExplorations } from './WebExplorations'
import { WebPrototype } from './WebPrototype'
import { WebFullWidthBand } from './WebFullWidthBand'
import { WebTestimonial } from './WebTestimonial'

/**
 * The Web case-study template: Shukar Hai's exact section order, populated
 * from a case study's own CMS content instead of hardcoded copy. Every Web
 * case study renders through this one component, so the structure stays
 * identical project to project -- only the content differs (§ case study
 * category). ShukarHai.tsx itself is untouched and unrelated to this file;
 * this reproduces its visual structure, not its code.
 */
export function WebCaseStudyTemplate({ caseStudy }: { caseStudy: CmsCaseStudy }) {
  const by = (type: string) => caseStudy.blocks.filter((b) => b.type === type)

  return (
    <>
      <WebHero
        title={caseStudy.heroTitle || caseStudy.title}
        subtitle={caseStudy.heroDescription}
        role={caseStudy.role}
        duration={caseStudy.duration}
        scope={caseStudy.projectType}
        client={caseStudy.client}
        heroImage={caseStudy.hero}
        statCards={by('HERO_STAT')}
      />
      <hr className="mt-[156px] border-t border-hairline" />
      <WebProblem problem={by('IMAGE_TEXT')[0]} friction={by('TEXT')[0]} />
      <WebResearchPanel intro={by('RESEARCH_INTRO')[0]} findings={by('INSIGHT_FINDING')} />
      <WebExplorations gallery={by('GALLERY')[0]} />
      <WebPrototype prototype={by('VIDEO')[0]} />
      <WebFullWidthBand band={by('FULL_WIDTH_VIDEO')[0]} />
      <WebTestimonial testimonial={by('QUOTE')[0]} name={caseStudy.client || caseStudy.title} />
    </>
  )
}
