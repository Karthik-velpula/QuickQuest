import { useEffect, useState } from "react";

export const QUESTION_SECONDS = 30;

export function useQuestionTimer(questionIndex: number, onExpire: () => void, active = true) {
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);

  useEffect(() => {
    if (!active) {
      setSecondsLeft(QUESTION_SECONDS);
      return;
    }

    const deadline = Date.now() + QUESTION_SECONDS * 1000;
    setSecondsLeft(QUESTION_SECONDS);

    const interval = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 100);
    const timeout = window.setTimeout(onExpire, QUESTION_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [active, questionIndex, onExpire]);

  return secondsLeft;
}
