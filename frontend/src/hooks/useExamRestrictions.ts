import { useEffect, useRef, useState } from "react";

interface UseExamRestrictionsOptions {
  onFullscreenExitLimit?: () => void;
  maxFullscreenExits?: number;
}

export function useExamRestrictions(active: boolean, options: UseExamRestrictionsOptions = {}) {
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const exitCountRef = useRef(0);
  const onLimitRef = useRef(options.onFullscreenExitLimit);
  const maxExitsRef = useRef(options.maxFullscreenExits ?? 5);

  useEffect(() => {
    onLimitRef.current = options.onFullscreenExitLimit;
    maxExitsRef.current = options.maxFullscreenExits ?? 5;
  }, [options.onFullscreenExitLimit, options.maxFullscreenExits]);

  useEffect(() => {
    if (!active) return;

    setFullscreenWarning(!document.fullscreenElement);
    window.history.pushState(null, "", window.location.href);
    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    const handleFullscreen = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFullscreenWarning(!isFullscreen);
      if (!isFullscreen) {
        exitCountRef.current += 1;
        if (exitCountRef.current >= maxExitsRef.current) {
          onLimitRef.current?.();
        }
      }
    };
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
