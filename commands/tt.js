// commands/tt.js — TikTok Downloader (multi-API fallback)
const { fetchJSON, fetchBuffer } = require("../lib/http");
const { card } = require("../lib/format");

// ── Daftar API (dicoba satu per satu sampai sukses) ─────────────────────────
const APIS = [
  // API 1: tikwm.com — HD support
  async (url) => {
    const res = await fetchJSON(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
    if (!res || res.code !== 0) throw new Error("tikwm: " + (res?.msg || "failed"));
    const d = res.data;
    return {
      videoUrl: d.hdplay || d.play,
      title:    d.title || "TikTok Video",
      author:   d.author?.nickname || "Unknown",
      duration: d.duration ? `${d.duration}s` : "-",
      likes:    fmtNum(d.digg_count),
      plays:    fmtNum(d.play_count),
    };
  },

  // API 2: tiklydown — fallback
  async (url) => {
    const res = await fetchJSON(`https://api.tiklydown.eu.org/api/download/v3?url=${encodeURIComponent(url)}`);
    if (!res?.video?.noWatermark) throw new Error("tiklydown: no video url");
    return {
      videoUrl: res.video.noWatermark,
      title:    res.title || "TikTok Video",
      author:   res.author?.name || "Unknown",
      duration: "-", likes: "-", plays: "-",
    };
  },

  // API 3: tikwm tanpa HD — last resort
  async (url) => {
    const res = await fetchJSON(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    if (!res || res.code !== 0) throw new Error("tikwm-sd: failed");
    const d = res.data;
    return {
      videoUrl: d.play,
      title:    d.title || "TikTok Video",
      author:   d.author?.nickname || "Unknown",
      duration: d.duration ? `${d.duration}s` : "-",
      likes:    fmtNum(d.digg_count),
      plays:    fmtNum(d.play_count),
    };
  },
];
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  name: "tt",
  aliases: ["tiktok", "tiktokdl"],
  description: "Download video TikTok tanpa watermark",
  category: "Downloader",

  async run({ reply, args, sock, from, msg }) {
    const url = args[0];

    if (!url || (!url.includes("tiktok.com") && !url.includes("vt.tiktok"))) {
      return reply("❌ Kirim link TikTok yang valid.\n\nContoh:\n*!tt https://vm.tiktok.com/xxxxx*");
    }

    await reply("⏳ Mengambil video TikTok...");

    let info = null;
    let lastErr = "";

    for (let i = 0; i < APIS.length; i++) {
      try {
        info = await APIS[i](url);
        console.log(`[TT] API #${i + 1} sukses`);
        break;
      } catch (e) {
        lastErr = e.message;
        console.warn(`[TT] API #${i + 1} gagal: ${e.message}`);
      }
    }

    if (!info) return reply(`❌ Semua API gagal.\nError: ${lastErr}`);

    try {
      const buf = await fetchBuffer(info.videoUrl);

      await sock.sendMessage(from, {
        text: card("🎵 TikTok DL", [
          { label: "Judul:",   value: info.title.substring(0, 80) },
          { label: "Creator:", value: `@${info.author}` },
          { label: "Durasi:",  value: info.duration },
          { label: "Likes:",   value: info.likes },
          { label: "Plays:",   value: info.plays },
        ]),
      }, { quoted: msg });

      await sock.sendMessage(from, {
        video: buf,
        caption: `🎵 *${info.title.substring(0, 80)}*\nBy @${info.author}`,
        mimetype: "video/mp4",
      });
    } catch (e) {
      console.error("[TT] Download buffer error:", e.message);
      await reply("❌ Gagal mengunduh video. Coba lagi nanti.");
    }
  },
};

function fmtNum(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
