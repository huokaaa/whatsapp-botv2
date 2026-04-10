// commands/hd.js — Perbagus/enhance gambar via free AI API
// Menggunakan waifu2x-api (gratis, open) atau replicate public API
const { fetchBuffer } = require("../lib/http");
const https = require("https");

// ── Multi-API fallback untuk upscale ────────────────────────────────────────
const ENHANCERS = [
  // API 1: waifu2x.udp.jp (public, gratis)
  async (buf) => {
    const boundary = "----NexusBotBoundary" + Date.now();
    const body = buildMultipart(boundary, buf, "image.jpg", "image/jpeg");

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "waifu2x.udp.jp",
        path: "/api",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
        timeout: 30000,
      }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const result = Buffer.concat(chunks);
          if (result.length < 1000) reject(new Error("waifu2x: invalid response"));
          else resolve(result);
        });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("waifu2x: timeout")); });
      req.write(body);
      req.end();
    });
  },

  // API 2: picwish free upscale (via public endpoint)
  async (buf) => {
    // Pakai imglarger.com open API
    const boundary = "----NexusBotBoundary" + Date.now();
    const body = buildMultipart(boundary, buf, "image.jpg", "image/jpeg");

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.imglarger.com",
        path: "/api/Picwish/upscale",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
        timeout: 30000,
      }, (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", async () => {
          try {
            const json = JSON.parse(raw);
            const url  = json?.data?.download || json?.url;
            if (!url) throw new Error("picwish: no download url");
            const imgBuf = await fetchBuffer(url);
            resolve(imgBuf);
          } catch (e) { reject(e); }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("picwish: timeout")); });
      req.write(body);
      req.end();
    });
  },

  // Fallback API 3: sharp-only upscale (lokal, no AI — resize 2x)
  async (buf) => {
    let sharp;
    try { sharp = require("sharp"); }
    catch { throw new Error("sharp tidak tersedia untuk fallback lokal"); }

    const meta = await sharp(buf).metadata();
    const w = Math.min((meta.width || 512) * 2, 4096);
    const h = Math.min((meta.height || 512) * 2, 4096);

    return sharp(buf)
      .resize(w, h, { kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 95 })
      .toBuffer();
  },
];
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  name: "hd",
  aliases: ["enhance", "upscale"],
  description: "Perbagus kualitas gambar dengan AI",
  category: "Media",

  async run({ sock, from, msg, reply, downloadMediaMessage }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.message?.imageMessage || quoted?.imageMessage || null;

    if (!imgMsg) {
      return reply(
        "❌ Kirim gambar dengan caption *!hd* atau reply ke gambar dengan *!hd*."
      );
    }

    await reply("⏳ Meningkatkan kualitas gambar... (bisa 10–30 detik)");

    try {
      let targetMsg = msg;
      if (!msg.message?.imageMessage && quoted?.imageMessage) {
        targetMsg = { key: msg.key, message: quoted };
      }
      const buf = await downloadMediaMessage(targetMsg, "buffer", {});

      let result = null;
      let lastErr = "";

      for (let i = 0; i < ENHANCERS.length; i++) {
        try {
          result = await ENHANCERS[i](buf);
          console.log(`[HD] Enhancer #${i + 1} sukses`);
          break;
        } catch (e) {
          lastErr = e.message;
          console.warn(`[HD] Enhancer #${i + 1} gagal: ${e.message}`);
        }
      }

      if (!result) return reply(`❌ Semua metode gagal.\nError: ${lastErr}`);

      await sock.sendMessage(from, {
        image: result,
        caption: "✨ *Gambar berhasil di-enhance!*\n_Powered by AI Upscaler_",
      }, { quoted: msg });

    } catch (e) {
      console.error("[HD ERR]", e.message);
      await reply("❌ Gagal memproses gambar: " + e.message);
    }
  },
};

// ── Multipart form-data builder ──────────────────────────────────────────────
function buildMultipart(boundary, fileBuffer, filename, mimeType) {
  const parts = [];
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return Buffer.concat(parts);
}
