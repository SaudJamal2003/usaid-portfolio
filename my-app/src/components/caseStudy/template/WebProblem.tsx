import type { CmsBlock } from '../../../content/types'
import { RichText } from '../RichText'

/**
 * "Challenge, purpose and definition" -- the outer heading is fixed template
 * chrome (every Web case study uses this exact wording, matching the
 * reference), the two sub-sections' own headings and copy are CMS-authored
 * via the IMAGE_TEXT (problem) and TEXT (friction) blocks.
 */
export function WebProblem({ problem, friction }: { problem?: CmsBlock; friction?: CmsBlock }) {
  const problemHeading = (problem?.data.heading as string) ?? ''
  const problemContent = (problem?.data.content as string) ?? ''
  const problemMedia = problem?.data.media as { url: string; alt: string } | null | undefined

  const frictionHeading = (friction?.data.heading as string) ?? ''
  const frictionContent = (friction?.data.content as string) ?? ''

  if (!problemContent.trim() && !frictionContent.trim()) return null

  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[60px]">
        <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
          Challenge, purpose and definition
        </h2>

        <div className="flex flex-col gap-[50px]">
          {problemContent.trim() && (
            <div className="flex flex-col gap-[32px] lg:flex-row lg:gap-[64px]">
              {problemMedia && (
                <img
                  src={problemMedia.url}
                  alt={problemMedia.alt}
                  className="h-[260px] w-full shrink-0 rounded-[16px] border-2 border-hairline object-cover object-top shadow-[0_4px_25px_0_rgba(0,0,0,0.38)] lg:w-[402px]"
                />
              )}
              <div className="flex flex-col gap-[12px]">
                {problemHeading.trim() && (
                  <h3 className="font-display text-[clamp(28px,2.78vw,40px)] font-bold capitalize tracking-[-0.025em] text-slate">
                    {problemHeading}
                  </h3>
                )}
                <div className="font-display text-[clamp(20px,2.22vw,32px)] text-black">
                  <RichText html={problemContent} />
                </div>
              </div>
            </div>
          )}

          {problemContent.trim() && frictionContent.trim() && (
            <hr className="max-w-[1229px] border-t border-hairline" />
          )}

          {frictionContent.trim() && (
            <div className="flex flex-col gap-[12px]">
              {frictionHeading.trim() && (
                <h3 className="font-display text-[clamp(28px,2.78vw,40px)] font-bold tracking-[-0.025em] text-slate">
                  {frictionHeading}
                </h3>
              )}
              <div className="font-display text-[clamp(20px,2.22vw,32px)] text-black">
                <RichText html={frictionContent} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
