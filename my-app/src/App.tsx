import { useLayoutEffect } from "react";
import { SignatureLoader } from "./components/SignatureLoader";
import { ContentProvider } from "./content/ContentProvider";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { CaseStudy } from "./pages/CaseStudy";
import { ShukarHai } from "./pages/ShukarHai";
import { usePathname, useHash } from "./router";

/* Real paths, not hash routing: "/about" and "/work/<slug>" are the standalone
   pages and every other path falls through to home. A URL fragment never
   reaches the server, so a hash-routed URL could never carry per-page OG tags
   to a crawler — see docs/seo-limitation.md for why this file changed shape.

   Shukar Hai keeps its hand-built page. Every other slug is rendered from CMS
   blocks, so the original case study presentation is preserved untouched while
   new ones come from the CMS. */

if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function App() {
  const pathname = usePathname();
  const hash = useHash();
  const isAbout = pathname === "/about";
  const isShukarHai = pathname === "/work/shukar-hai";

  /* The preview token now lives in a real query string ("/work/<slug>?preview=
     <token>"), read from location.search directly — no more hand-parsing a
     "?" out of a hash fragment, since paths keep search and hash separate. */
  const caseStudyRoute = (() => {
    if (isShukarHai || !pathname.startsWith("/work/")) return null;
    const slug = pathname.slice("/work/".length).replace(/\/$/, "");
    if (!slug) return null;
    const previewToken = new URLSearchParams(window.location.search).get("preview") ?? undefined;
    return { slug, previewToken };
  })();

  // An anchor clicked from another page lands before its section is mounted,
  // so the browser's own fragment scroll finds nothing. Redo it here, before
  // paint, where the swapped-in page is already in the DOM — same instant jump
  // a plain anchor gives you on a single page. No fragment on arrival means a
  // fresh page, so that case scrolls to the top instead.
  useLayoutEffect(() => {
    const id = hash ? hash.slice(1) : "";
    const target = id ? document.getElementById(id) : null;
    window.scrollTo({
      top: target ? target.getBoundingClientRect().top + window.scrollY : 0,
    });
  }, [pathname, hash]);

  /* The provider sits outside the loader so its request starts on the very
     first frame, in parallel with the signature being drawn, rather than after
     the loader finishes. */
  return (
    <ContentProvider>
      <SignatureLoader>
        {isShukarHai ? (
        <ShukarHai />
      ) : caseStudyRoute ? (
        <CaseStudy slug={caseStudyRoute.slug} previewToken={caseStudyRoute.previewToken} />
      ) : isAbout ? (
        <About />
      ) : (
        <Home />
      )}
      </SignatureLoader>
    </ContentProvider>
  );
}

export default App;
