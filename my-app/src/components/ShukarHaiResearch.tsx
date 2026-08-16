/* Figma draws this 2x2 as four absolutely-placed blocks over three horizontal
   rules and one vertical rule. A grid with borders lands on the same pixels and
   collapses to a single column on narrow screens. */
const FINDINGS = [
  {
    number: '01',
    title: 'Explain the journey before asking for commitment',
    body: 'Users needed to understand sourcing, preparation, distribution, delivery, and what their payment covered before proceeding.',
    bodyWidth: 'lg:max-w-[546px]',
  },
  {
    number: '02',
    title: 'Separate services by how they actually work',
    body: 'Aqeeqah required guided selection and conditional delivery logic. Dawat in a Box required a simpler, batch-based contribution flow.',
    bodyWidth: 'lg:max-w-[560px]',
  },
  {
    number: '03',
    title: 'Make trust visible, not implied',
    body: 'Farm standards, shariah-compliant preparation, packaging, experienced caretakers, and proof of distribution needed to become part of the interface.',
    bodyWidth: 'lg:max-w-[511px]',
  },
  {
    number: '04',
    title: 'Keep the emotion, remove the ambiguity',
    body: 'The brand’s emotional story was valuable, but it needed to support product clarity rather than replace it.',
    bodyWidth: 'lg:max-w-[511px]',
  },
]

export function ShukarHaiResearch() {
  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1393px] flex-col gap-[74px] rounded-[30px] bg-panel p-6 sm:p-10 lg:p-[80px]">
        <div className="flex max-w-[1211px] flex-col gap-[26px]">
          <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
            Research showed that people did not need more information. They needed clearer
            reassurance.
          </h2>
          <blockquote className="border-l-3 border-accent-deep px-[20px] py-[10px]">
            <p className="max-w-[1168px] font-display text-[clamp(20px,1.94vw,28px)] text-black">
              The strongest opportunities were not about adding more content. They were about
              presenting the right information at the moment users needed it.
            </p>
          </blockquote>
        </div>

        <ol className="grid max-w-[1229px] grid-cols-1 border-y border-hairline lg:grid-cols-2">
          {FINDINGS.map((finding, index) => (
            <li
              key={finding.number}
              className={`flex flex-col gap-[69px] border-hairline px-[29px] py-[22px] ${
                index > 0 ? 'border-t' : ''
              } ${index % 2 === 1 ? 'lg:border-l' : ''} ${
                index < 2 ? 'lg:border-t-0' : 'lg:border-t'
              } lg:min-h-[331px]`}
            >
              <p className="font-display text-[48px] font-bold text-peach">{finding.number}</p>
              <div className="flex flex-col gap-[16px]">
                <h3 className="font-display text-[clamp(20px,1.94vw,28px)] font-medium leading-[1.036] tracking-[-0.0357em] text-black lg:max-w-[344px]">
                  {finding.title}
                </h3>
                <p className={`font-display text-[20px] text-body ${finding.bodyWidth}`}>
                  {finding.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
