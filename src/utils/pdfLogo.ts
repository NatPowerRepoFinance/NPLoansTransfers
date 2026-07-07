/** NatPower "N" mark, rasterized for jsPDF (which requires PNG/JPEG data, not SVG). */
const LOGO_SVG_URL = "/logo-square.svg";
const LOGO_COLOR = "#000000";
const LOGO_VIEWBOX_WIDTH = 400;
const LOGO_VIEWBOX_HEIGHT = 413;

/** Height:width ratio of the source SVG viewBox — use to size the logo without distortion. */
export const NATPOWER_LOGO_ASPECT_RATIO = LOGO_VIEWBOX_HEIGHT / LOGO_VIEWBOX_WIDTH;

let cachedLogoDataUrl: Promise<string> | null = null;

async function rasterizeLogo(): Promise<string> {
  const response = await fetch(LOGO_SVG_URL);
  const rawSvg = await response.text();
  const coloredSvg = rawSvg.replace(/currentColor/g, LOGO_COLOR);

  const svgBlob = new Blob([coloredSvg], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load NatPower logo SVG"));
      img.src = blobUrl;
    });

    const scale = 4; // render at higher resolution than typical PDF placement size for crisp output
    const canvas = document.createElement("canvas");
    canvas.width = LOGO_VIEWBOX_WIDTH * scale;
    canvas.height = LOGO_VIEWBOX_HEIGHT * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Cached so the SVG is only fetched/rasterized once per session. */
export function getNatpowerLogoDataUrl(): Promise<string> {
  if (!cachedLogoDataUrl) {
    cachedLogoDataUrl = rasterizeLogo();
  }
  return cachedLogoDataUrl;
}
