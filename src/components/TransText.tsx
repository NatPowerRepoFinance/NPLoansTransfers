import { useLiveTranslation } from "./useLiveTranslation";

interface TransTextProps {
  text: string;
  lang: string;
  className?: string;
  children?: React.ReactNode;
}

export function TransText({
  text,
  lang,
  children,
  className = "",
}: TransTextProps) {
  const translated = useLiveTranslation(text, lang);
  return (
    <span className={className}>
      {translated}
      {children && <> {children}</>}
    </span>
  );
}
