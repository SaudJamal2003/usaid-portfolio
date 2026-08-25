import { useLayoutEffect, useSyncExternalStore } from "react";
import { SignatureLoader } from "./components/SignatureLoader";
import { ContentProvider } from "./content/ContentProvider";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { CaseStudy } from "./pages/CaseStudy";
import { ShukarHai } from "./pages/ShukarHai";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/* No router dependency: "#/about" and "#/work/<slug>" are the standalone pages
   and every other hash falls through to home, which keeps the in-page "#work" /
   "#contact" anchors working from any of them.
   
   Shukar Hai keeps its hand-built page. Every other slug is rendered from CMS
   blocks, so the original case study presentation is preserved untouched while
   new ones come from the CMS. */
function useHashRoute() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
}

if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function App() {
  const hash = useHashRoute();
  const isAbout = hash.startsWith("#/about");
  const isShukarHai = hash.startsWith("#/work/shukar-hai");

  /* "#/work/<slug>?preview=<token>" — the fragment carries its own query, so it
     is parsed here rather than from location.search, which a hash route never
     populates. */
  const caseStudyRoute = (() => {
    if (isShukarHai || !hash.startsWith("#/work/")) return null;
    const [path, query] = hash.slice("#/work/".length).split("?");
    const slug = path.replace(/\/$/, "");
    if (!slug) return null;
    return { slug, previewToken: new URLSearchParams(query ?? "").get("preview") ?? undefined };
  })();

  // An anchor clicked from the other page lands before its section is mounted,
  // so the browser's own fragment scroll finds nothing. Redo it here, before
  // paint, where the swapped-in page is already in the DOM — same instant jump
  // a plain anchor gives you on a single page.
  useLayoutEffect(() => {
    const id = hash.startsWith("#/") ? "" : hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    window.scrollTo({
      top: target ? target.getBoundingClientRect().top + window.scrollY : 0,
    });
  }, [hash]);

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
