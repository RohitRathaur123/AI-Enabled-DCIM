// QR code image (SVG data URL) built in the browser — used for asset tags.
import { QrCode, Ecc } from "@rc-component/qrcode/es/libs/qrcodegen";

export function qrDataUrl(text, { scale = 8, margin = 4, color = "#0f172a" } = {}) {
  const qr = QrCode.encodeText(String(text), Ecc.MEDIUM);
  const n = qr.size + margin * 2;
  let path = "";
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.getModule(x, y)) path += `M${x + margin},${y + margin}h1v1h-1z`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n * scale}" height="${n * scale}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#ffffff"/><path d="${path}" fill="${color}"/></svg>`;
  const b64 = typeof btoa === "function" ? btoa(svg) : Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}
