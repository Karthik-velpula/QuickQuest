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
    const preventClipboard = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("popstate", blockBack);
    document.addEventListener("fullscreenchange", handleFullscreen);
    window.addEventListener("keydown", preventKeys);
    document.addEventListener("copy", preventClipboard);
    document.addEventListener("cut", preventClipboard);
    document.addEventListener("paste", preventClipboard);
    document.addEventListener("contextmenu", preventClipboard);
    document.addEventListener("selectstart", preventClipboard);
    document.addEventListener("dragstart", preventClipboard);
    return () => {
      window.removeEventListener("popstate", blockBack);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.removeEventListener("keydown", preventKeys);
      document.removeEventListener("copy", preventClipboard);
      document.removeEventListener("cut", preventClipboard);
      document.removeEventListener("paste", preventClipboard);
      document.removeEventListener("contextmenu", preventClipboard);
      document.removeEventListener("selectstart", preventClipboard);
      document.removeEventListener("dragstart", preventClipboard);
    };
  }, [active]);

  const restoreFullscreen = async () => {
    await document.documentElement.requestFullscreen();
    setFullscreenWarning(false);
  };

  return { fullscreenWarning, restoreFullscreen };
}
