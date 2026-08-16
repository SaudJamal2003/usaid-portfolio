import problemGif from "../assets/figma/problem-gif.gif";

export function ShukarHaiChallenge() {
  return (
    <section className="mt-[200px] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[60px]">
        <h2 className="font-display text-[clamp(32px,3.89vw,56px)] font-medium leading-[1.107] tracking-[-0.0357em] text-ink">
          Challenge, purpose and definition
        </h2>

        <div className="flex flex-col gap-[50px]">
          <div className="flex flex-col gap-[32px] lg:flex-row lg:gap-[64px]">
            {/* <img
              src={problemStill}
              alt="A recording of the original Shukar Hai site being walked through"
              className="h-[260px] w-full shrink-0 rounded-[16px] border-2 border-hairline object-cover object-top shadow-[0_4px_25px_0_rgba(0,0,0,0.38)] lg:w-[402px]"
            /> */}
            <img
              src={problemGif}
              alt="A recording of the original Shukar Hai site being walked through"
              className="h-[260px] w-full shrink-0 rounded-[16px] border-2 border-hairline object-cover object-top shadow-[0_4px_25px_0_rgba(0,0,0,0.38)] lg:w-[402px]"
            />
            <div className="flex flex-col gap-[12px]">
              <h3 className="font-display text-[clamp(28px,2.78vw,40px)] font-bold capitalize tracking-[-0.025em] text-slate">
                The Problem
              </h3>
              <div className="font-display text-[clamp(20px,2.22vw,32px)] text-black">
                <p>
                  Shukar Hai had a meaningful mission, but the digital
                  experience did not make its services easy to understand,
                  trust, or act on.
                </p>
                <p>
                  Users were introduced to purpose before they were given enough
                  clarity around what each offering involved, how the process
                  worked, and what would happen after they made a selection.
                </p>
              </div>
            </div>
          </div>

          <hr className="max-w-[1229px] border-t border-hairline" />

          <div className="flex flex-col gap-[12px]">
            <h3 className="font-display text-[clamp(28px,2.78vw,40px)] font-bold tracking-[-0.025em] text-slate">
              What was getting in the way?
            </h3>
            <div className="font-display text-[clamp(20px,2.22vw,32px)] text-black">
              <p>
                The challenge was not a lack of information. It was how that
                information was structured.
              </p>
              <p>
                Aqeeqah involved multiple decisions around animal selection,
                fulfilment, delivery, and checkout, while Dawat in a Box
                followed an entirely different batch-based journey. Both were
                being presented within the same platform without enough
                distinction between how they worked.
              </p>
              <p>
                The redesign therefore focused on creating clearer product
                journeys, surfacing trust at the right moments, and building one
                consistent system that could support both offerings without
                making them feel generic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
