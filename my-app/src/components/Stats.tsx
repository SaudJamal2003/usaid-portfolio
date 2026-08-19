import client1 from '../assets/figma/client-1.png'
import client2 from '../assets/figma/client-2.png'
import client3 from '../assets/figma/client-3.png'
import client4 from '../assets/figma/client-4.png'
import client5 from '../assets/figma/client-5.png'
import statusDot from '../assets/figma/status-dot.svg'

const CLIENT_AVATARS = [client1, client2, client3, client4, client5]

type MetricCardProps = {
  blurb: string
  value: string
  caption: string
  captionSize?: string
  blurbClassName?: string
  className?: string
}

function MetricCard({
  blurb,
  value,
  caption,
  captionSize = 'text-[18px]',
  blurbClassName = 'max-w-[284px] leading-[1.119]',
  className = '',
}: MetricCardProps) {
  return (
    <div className={`flex flex-col justify-between gap-6 rounded-[20px] p-[24px] capitalize text-white ${className}`}>
      <p className={`text-[18px] ${blurbClassName}`}>{blurb}</p>
      <div className="flex w-[223px] max-w-full flex-col gap-[16px]">
        <p className="font-display text-[56px] leading-[1.119]">{value}</p>
        <p className={`${captionSize} leading-[1.119]`}>{caption}</p>
      </div>
    </div>
  )
}

export function Stats() {
  return (
    <section className="mt-[1px] px-6 font-display">
      <div className="mx-auto grid w-full max-w-[1059px] grid-cols-1 items-start gap-[16px] sm:grid-cols-2 lg:grid-cols-[332px_332px_363px] lg:justify-center">
        <div className="flex flex-col gap-[17px]">
          <div className="flex items-center gap-[20px] rounded-[20px] bg-chip p-[24px]">
            <div className="flex items-center">
              {CLIENT_AVATARS.map((avatar, index) => (
                <img
                  key={avatar}
                  src={avatar}
                  alt=""
                  className={`size-[40.448px] rounded-full object-cover ${
                    index < CLIENT_AVATARS.length - 1 ? '-mr-[16.06px]' : ''
                  }`}
                />
              ))}
            </div>
            <p className="text-[18px] capitalize leading-[1.119] text-black">100+ Clients</p>
          </div>

          <MetricCard
            blurb="Earn back on your investment within 30 days"
            value="90%"
            caption="Return on investment"
            className="h-[322px] bg-graphite"
          />
        </div>

        <div className="flex flex-col gap-[16px]">
          <MetricCard
            blurb="Earn back on your investment within 30 days"
            value="$2.5+"
            caption="revenue Generated"
            className="h-[323px] bg-graphite"
          />

          <div className="flex h-[88px] items-center gap-[18px] rounded-[20px] bg-chip p-[24px]">
            <img src={statusDot} alt="" className="size-[10px]" />
            <p className="text-[18px] capitalize leading-[1.119] text-black">Available for new projects</p>
          </div>
        </div>

        <MetricCard
          blurb="I have delivered 50+ projects. helping service-based and product-based companies"
          value="4.8/5"
          caption="Trusted by clients"
          captionSize="text-[24px]"
          blurbClassName="leading-normal"
          className="h-[427px] bg-[#FF8E63] sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  )
}
