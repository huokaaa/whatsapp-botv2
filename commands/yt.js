// commands/yt.js — YouTube Video Downloader
// API: eliteprotech-apis.zone.id/ytmp4?url=

const { fetchJSON, fetchBuffer } = require("../lib/http");
const { card } = require("../lib/format");

module.exports = {
  name: "yt",
  aliases: ["youtube", "ytdl", "ytv2", "youtubev2"],
  description: "Download video YouTube dari link",
  category: "Downloader",

  async run({ reply, args, sock, from, msg }) {
    const url = args[0];

    if (!url || !isYouTubeUrl(url)) {
      return reply(
        "❌ Masukkan link YouTube yang valid.\n\nContoh:\n*!yt https://youtu.be/xxxxx*"
      );
    }

    await reply("⏳ Memproses video YouTube...");

    let data;
    try {
      data = await fetchJSON(
        `https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(url)}`
      );
    } catch (e) {
      return reply("❌ Gagal menghubungi API: " + e.message);
    }

    const downloadUrl =
      data?.download ||
      data?.url      ||
      data?.video    ||
      data?.link     ||
      null;

    if (!downloadUrl) {
      // Fallback ke AIO endpoint
      try {
        const aioData = await fetchJSON(
          `https://eliteprotech-apis.zone.id/aio3?url=${encodeURIComponent(url)}`
        );
        const best = aioData?.medias?.find(
          (m) => m.videoAvailable && !m.chunked && !m.requiresRendering
        );
        if (best?.url) {
          return await sendVideo(sock, from, msg, best.url, aioData?.title || "YouTube Video", reply);
        }
      } catch {}

      return reply("❌ Gagal mendapatkan link download video.");
    }

    const title    = data?.title    || "YouTube Video";
    const duration = data?.duration || "-";
    const quality  = data?.quality  || "-";

    try {
      await sock.sendMessage(from, {
        text: card("▶️ YouTube DL", [
          { label: "Judul",    value: title.substring(0, 80) },
          { label: "Durasi",   value: duration },
          { label: "Kualitas", value: quality },
        ]),
      }, { quoted: msg });

      await sendVideo(sock, from, msg, downloadUrl, title, reply);

    } catch (e) {
      console.error("[YT] Error:", e.message);
      await reply("❌ Gagal mengunduh video: " + e.message);
    }
  },
};

async function sendVideo(sock, from, msg, url, title, reply) {
  const { fetchBuffer } = require("../lib/http");
  try {
    const buf = await fetchBuffer(url);
    await sock.sendMessage(from, {
      video: buf,
      caption: `▶️ *${title.substring(0, 100)}*`,
      mimetype: "video/mp4",
    });
  } catch (e) {
    await reply("❌ Gagal download buffer: " + e.message);
  }
}

function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/.test(url);
}
