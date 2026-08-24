import { useLayoutEffect, useSyncExternalStore } from "react";
import { SignatureLoader } from "./components/SignatureLoader";
import { ContentProvider } from "./content/ContentProvider";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { ShukarHai } from "./pages/ShukarHai";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/* Three pages, no router dependency: "#/about" and "#/work/shukar-hai" are the
   standalone pages and every other hash falls through to home, which keeps the
   in-page "#work" / "#contact" anchors working from any of them. */
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
        {isShukarHai ? <ShukarHai /> : isAbout ? <About /> : <Home />}
      </SignatureLoader>
    </ContentProvider>
  );
}

export default App;
