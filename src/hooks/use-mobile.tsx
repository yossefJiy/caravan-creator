import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Some older Android browsers/WebViews may not support matchMedia at all
    if (typeof window.matchMedia !== "function") {
      const onResize = () => onChange();
      window.addEventListener("resize", onResize, { passive: true });
      onChange();
      return () => window.removeEventListener("resize", onResize);
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Support older Android WebView / Safari that may not have addEventListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(onChange);
    }

    onChange();

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange);
      } else if (typeof mql.removeListener === "function") {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return !!isMobile;
}
