// commands/play.js — Cari & download lagu via YouTube
// Search : yt-search (npm)
// Download: eliteprotech-apis.zone.id/ytmp3

const yts   = require("yt-search");
const fetch = require("node-fetch");

module.exports = {
  name: "play",
  aliases: ["music", "song", "lagu", "mp3"],
  description: "Cari dan download lagu dari judul",
  category: "Musik",

  async run({ sock, from, msg, reply, args }) {
    const query = args.join(" ").trim();
    if (!query) return reply("❌ Masukkan judul lagu.\nContoh: *!play shape of you*");

    await reply(`🔍 Mencari: *${query}*...`);

    try {
      // ── Step 1: Search YouTube ──
      const { videos } = await yts(query);

      if (!videos || videos.length === 0) {
        return reply("❌ Lagu tidak ditemukan. Coba kata kunci yang berbeda.");
      }

      const video = videos[0];
      console.log(`[PLAY] Found: ${video.title} | ${video.url}`);

      await reply(`🎵 Ditemukan: *${video.title}*\n⏳ Mengunduh...`);

      // ── Step 2: Download via eliteprotech ──
      const res = await fetch(
        `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(video.url)}`
      );

      if (!res.ok) throw new Error(`API HTTP ${res.status}`);

      const data = await res.json();
      console.log("[PLAY] API response:", JSON.stringify(data)?.substring(0, 300));

      const audioUrl =
        data?.result?.download    ||
        data?.result?.downloadUrl ||
        data?.result?.url         ||
        data?.result?.audio       ||
        data?.download            ||
        data?.url                 ||
        data?.audio               ||
        data?.link                ||
        null;

      if (!audioUrl) {
        return reply("❌ Gagal mendapatkan link download. Coba lagi nanti.");
      }

      const title = data?.result?.title || video.title;

      // ── Step 3: Kirim audio ──
      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      }, { quoted: msg });

      console.log(`[PLAY] OK: ${title}`);

    } catch (e) {
      console.error("[PLAY ERR]", e.message);
      await reply("❌ Download gagal: " + e.message);
    }
  },
};
