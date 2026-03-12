// hooks/useLiveTranslation.tsx
import { useEffect, useState } from "react";
import { getCachedTranslation } from "../lib/liveTranslationManager";

export function useLiveTranslation(text: string, targetLang: string) {
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let isCancelled = false;

    if (!text || targetLang === "en") {
      setTranslated(text);
      return;
    }

    getCachedTranslation(text, targetLang).then((result) => {
      if (!isCancelled) {
        setTranslated(result);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [text, targetLang]);

  return translated;
}
