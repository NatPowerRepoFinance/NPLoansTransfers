import { useCallback } from "react";
import { getCachedTranslation } from "@/lib/liveTranslationManager"; // shared cache-aware translator

export function useTranslatedStrings(lang: string) {
  const t = useCallback(
    async (text: string): Promise<string> => {
      if (!text || lang === "en") return text;
      return await getCachedTranslation(text, lang);
    },
    [lang]
  );

  return { t };
}
