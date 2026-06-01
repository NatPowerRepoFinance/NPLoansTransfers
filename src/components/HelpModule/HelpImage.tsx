import { useState } from "react";
import { MagnifyingGlassPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function HelpImage({
  src,
  alt,
  className,
  caption,
}: {
  src: string;
  alt: string;
  className: string;
  caption?: string;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <figure className="group relative my-3">
        <div
          className={`relative cursor-zoom-in overflow-hidden ${className}`}
          onClick={() => setIsZoomed(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsZoomed(true)}
        >
          <img src={src} alt={alt} className="w-full h-auto" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
            <MagnifyingGlassPlusIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
          </div>
        </div>
        {caption && (
          <figcaption className="mt-1.5 text-xs text-center opacity-60 italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
          style={{ animation: "helpFadeIn 150ms ease-out" }}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[92vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
            style={{ animation: "helpScaleIn 200ms ease-out" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
