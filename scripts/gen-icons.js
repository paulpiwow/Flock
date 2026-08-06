/*
 * Generate the PWA PNG icons from the sheep mark.
 * Maskable-safe: full-bleed green background with the sheep in the center ~58%
 * (inside the maskable safe zone). Run: node scripts/gen-icons.js
 */
const sharp = require("sharp");
const path = require("path");

const PUBLIC = path.join(__dirname, "..", "public");

// 512-based artwork; sharp resizes to each target.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#254c1e"/>
  <g transform="translate(106,112) scale(4.6875)" fill="none" stroke="#f3faef"
     stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 38c-6 0-9-4-9-8 0-3 2-5 4-6-1-4 2-8 6-8 2-4 7-5 11-3 3-2 8-1 10 2 5 0 8 4 7 8 2 1 3 3 3 6 0 4-3 8-9 8"/>
    <path d="M46 34c3 0 6 2 6 6 0 4-3 6-7 6-2 0-4-1-5-3"/>
    <path d="M52 33c2-1 4 0 4 2"/>
    <path d="M22 46v6M30 47v6M40 47v6M47 45v6"/>
  </g>
  <circle cx="340" cy="295" r="7" fill="#f3faef"/>
</svg>`;

async function main() {
  const buf = Buffer.from(svg);
  const targets = [
    { size: 512, file: "icon-512.png" },
    { size: 192, file: "icon-192.png" },
    { size: 180, file: "apple-touch-icon.png" },
  ];
  for (const t of targets) {
    await sharp(buf)
      .resize(t.size, t.size)
      .png()
      .toFile(path.join(PUBLIC, t.file));
    console.log("wrote", t.file, `(${t.size}x${t.size})`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
