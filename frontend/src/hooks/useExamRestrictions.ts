import { useEffect, useState } from "react";

export function useExamRestrictions(active: boolean) {
  const [fullscreenWarning, setFullscreenWarning] = useState(false);

  useEffect(() => {
    if (!active) return;

    setFullscreenWarning(!document.fullscreenElement);
    window.history.pushState(null, "", window.location.href);
    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    const handleFullscreen = () => setFullscreenWarning(!document.fullscreenElement);
    const preventKeys = (event: KeyboardEvent) => {
      if (event.key === "F5" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r")) {
        event.preventDefault();
      }
    };

    window.addEventListener("popstate", blockBack);
    document.addEventListener("fullscreenchange", handleFullscreen);
    window.addEventListener("keydown", preventKeys);
    return () => {
      window.removeEventListener("popstate", blockBack);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [active]);

  const restoreFullscreen = async () => {
    await document.documentElement.requestFullscreen();
    setFullscreenWarning(false);
  };

  return { fullscreenWarning, restoreFullscreen };
}
