// commands/brat.js — Buat stiker bergaya "brat" (teks blur/smudge)
// Pure sharp only — render teks via SVG, blur via sharp.blur()
// Deps: npm install sharp

module.exports = {
  name: "brat",
  aliases: ["bratsticker"],
  description: "Buat stiker gaya brat dari teks",
  category: "Media",

  async run({ sock, from, msg, args, reply }) {
    let sharp;
    try {
      sharp = require("sharp");
    } catch {
      return reply(
        "❌ Modul *sharp* belum terinstall.\n\nJalankan:\n```\nnpm install sharp\n```\nlalu restart bot."
      );
    }

    const text = args.join(" ").trim();
    if (!text) return reply("❌ Tulis teks setelah command.\nContoh: *!brat have fun*");

    await reply("⏳ Membuat stiker brat...");

    try {
      const SIZE     = 512;
      const fontSize = calcFontSize(text, SIZE);
      const safe     = escapeXml(text);

      // ── Layer 1: teks blur (efek smudge khas brat) ──
      // Render SVG teks hitam → blur pakai sharp.blur()
      const svgBlur = buildSvg(safe, SIZE, fontSize, 1.0);
      const blurLayer = await sharp(Buffer.from(svgBlur))
        .resize(SIZE, SIZE)
        .blur(6)           // gaussian blur → efek smear
        .png()
        .toBuffer();

      // ── Layer 2: teks tajam di atas ──
      const svgSharp = buildSvg(safe, SIZE, fontSize, 1.0);
      const sharpLayer = await sharp(Buffer.from(svgSharp))
        .resize(SIZE, SIZE)
        .png()
        .toBuffer();

      // ── Composite: background putih + blur + sharp ──
      const result = await sharp({
        create: {
          width: SIZE,
          height: SIZE,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: blurLayer,  blend: "over" },
          { input: sharpLayer, blend: "over" },
        ])
        .webp({ quality: 85 })
        .toBuffer();

      await sock.sendMessage(from, {
        sticker: result,
        mimetype: "image/webp",
        stickerPack: "HuokaMD",
        stickerAuthor: "brat",
      }, { quoted: msg });

    } catch (e) {
      console.error("[BRAT ERR]", e.message);
      await reply("❌ Gagal membuat stiker brat: " + e.message);
    }
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hitung font size adaptif berdasarkan panjang teks
 * Makin panjang teks → font makin kecil
 */
function calcFontSize(text, size) {
  // Estimasi kasar: ~0.6 * fontSize per karakter lebar rata-rata
  const maxWidth = size - 60;
  let fs = 90;
  while (fs > 18) {
    const estimatedWidth = text.length * fs * 0.55;
    if (estimatedWidth <= maxWidth) break;
    fs -= 4;
  }
  return fs;
}

/**
 * Build SVG string dengan teks di tengah
 */
function buildSvg(safeText, size, fontSize, opacity) {
  // Kalau teks panjang, pecah jadi multiline otomatis
  const words      = safeText.split(" ");
  const lineLimit  = Math.floor((size - 60) / (fontSize * 0.58));
  const lines      = [];
  let   current    = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > lineLimit && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineHeight = fontSize * 1.25;
  const totalH     = lines.length * lineHeight;
  const startY     = (size - totalH) / 2 + fontSize;

  const tspans = lines
    .map((line, i) =>
      `<tspan x="${size / 2}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <text
    x="${size / 2}"
    y="${startY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="black"
    opacity="${opacity}"
    text-anchor="middle"
    dominant-baseline="auto"
  >${tspans}</text>
</svg>`;
}

/** Escape karakter XML berbahaya agar SVG tidak corrupt */
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}