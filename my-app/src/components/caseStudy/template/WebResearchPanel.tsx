import type { CmsBlock } from '../../../content/types'

export function WebResearchPanel({ intro, findings }: { intro?: CmsBlock; findings: CmsBlock[] }) {
  const heading = (intro?.data.heading as string) ?? ''
  const quote = (intro?.data.quote as string) ?? ''

  if (!heading.trim() && findings.length === 0) return null

  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1393px] flex-col gap-[74px] rounded-[30px] bg-panel p-6 sm:p-10 lg:p-[80px]">
        {(heading.trim() || quote.trim()) && (
          <div className="flex max-w-[1211px] flex-col gap-[26px]">
            {heading.trim() && (
              <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
                {heading}
              </h2>
            )}
            {quote.trim() && (
              <blockquote className="border-l-3 border-accent-deep px-[20px] py-[10px]">
                <p className="max-w-[1168px] font-display text-[clamp(20px,1.94vw,28px)] text-black">{quote}</p>
              </blockquote>
            )}
          </div>
        )}

        {findings.length > 0 && (
          <ol className="grid max-w-[1229px] grid-cols-1 border-y border-hairline lg:grid-cols-2">
            {findings.map((block, index) => {
              const title = (block.data.title as string) ?? ''
              const body = (block.data.body as string) ?? ''
              const number = String(index + 1).padStart(2, '0')
              return (
                <li
                  key={block.id}
                  className={`flex flex-col gap-[69px] border-hairline px-[29px] py-[22px] ${
                    index > 0 ? 'border-t' : ''
                  } ${index % 2 === 1 ? 'lg:border-l' : ''} ${
                    index < 2 ? 'lg:border-t-0' : 'lg:border-t'
                  } lg:min-h-[331px]`}
                >
                  <p className="font-display text-[48px] font-bold text-peach">{number}</p>
                  <div className="flex flex-col gap-[16px]">
                    <h3 className="font-display text-[clamp(20px,1.94vw,28px)] font-medium leading-[1.036] tracking-[-0.0357em] text-black lg:max-w-[344px]">
                      {title}
                    </h3>
                    <p className="font-display text-[20px] text-body">{body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
