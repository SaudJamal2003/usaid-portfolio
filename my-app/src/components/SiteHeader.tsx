import logo from "../assets/figma/logo.svg";
import { useContent } from "../content/context";
import navDot from "../assets/figma/nav-dot.svg";

/* Bundled fallback (§18). */
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#/about" },
  { label: "Work", href: "#work" },
];

type SiteHeaderProps = {
  /** which nav item shows the current-page dot */
  current?: string;
  /** header height — Desktop-1 sits the bar at 130px, Desktop-6 at 110px */
  className?: string;
};

export function SiteHeader({ current = "Home", className = "h-[130px]" }: SiteHeaderProps) {
  const content = useContent();

  /* Content only -- the bar's height, blur and layout stay here. An empty CMS
     nav falls back rather than rendering a bar with no links in it. */
  const links = content?.navigation?.length
    ? content.navigation.map((item) => ({
        label: item.label,
        href: item.url,
        newTab: item.openInNewTab,
      }))
    : NAV_LINKS.map((link) => ({ ...link, newTab: false }));

  return (
    <header
      className={`fixed top-0 z-50 flex w-full max-w-[1440px] items-end border-b border-white/50 px-4 backdrop-blur-sm sm:px-6 ${className}`}
    >
      <nav className="mx-auto flex h-[69px] w-full max-w-[1056px] items-center justify-between rounded-[10px] border border-hairline bg-white px-6">
        <a href="#home" className="shrink-0" aria-label="Usaid home">
          <img src={logo} alt="Usaid" className="h-[68.797px] w-[80px]" />
        </a>
        <ul className="hidden items-center sm:flex">
          {links.map((link) => {
            const isCurrent = link.label === current;
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.newTab && { target: "_blank", rel: "noreferrer" })}
                  className="flex h-[69px] min-w-[80px] flex-col items-center justify-center text-[16px] font-semibold leading-[20.8px] text-ink-soft lg:min-w-[108.05px]"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {link.label}
                  {isCurrent && <img src={navDot} alt="" className="size-[6px]" />}
                </a>
              </li>
            );
          })}
        </ul>
        <a
          href="#contact"
          className="flex h-[48px] w-[120px] shrink-0 items-center justify-center rounded-[12px] border-3 border-ink bg-accent text-[16px] font-semibold leading-none text-ink"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
