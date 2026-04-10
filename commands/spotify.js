// commands/spotify.js — Spotify Track Downloader
// API: eliteprotech-apis.zone.id/spotify

const { fetchJSON, fetchBuffer } = require("../lib/http");
const { card } = require("../lib/format");

module.exports = {
  name: "spotify",
  aliases: ["sp", "spotifydl"],
  description: "Download lagu dari link Spotify",
  category: "Downloader",

  async run({ reply, args, sock, from, msg }) {
    const url = args[0];

    if (!url || !url.includes("open.spotify.com")) {
      return reply(
        "❌ Masukkan link Spotify yang valid.\n\n" +
        "Contoh: *!spotify https://open.spotify.com/track/xxxxx*"
      );
    }

    await reply("⏳ Mengambil lagu dari Spotify...");

    let data;
    try {
      data = await fetchJSON(
        `https://eliteprotech-apis.zone.id/spotify?url=${encodeURIComponent(url)}`
      );
    } catch (e) {
      return reply("❌ Gagal menghubungi API: " + e.message);
    }

    // API eliteprotech spotify bisa return langsung URL audio atau objek
    // Tangani dua kemungkinan response format
    const downloadUrl =
      data?.download ||
      data?.url ||
      data?.audio_url ||
      data?.medias?.[0]?.url ||
      null;

    const title   = data?.title  || data?.name  || "Spotify Track";
    const artist  = data?.artist || data?.artists?.map?.((a) => a.name)?.join(", ") || "Unknown";
    const album   = data?.album  || "-";
    const duration = data?.duration || "-";

    if (!downloadUrl) {
      return reply(
        "❌ Gagal mendapatkan link download.\n\n" +
        "_Pastikan link Spotify valid dan bukan konten podcast/episode._"
      );
    }

    try {
      await sock.sendMessage(from, {
        text: card("🎵 Spotify DL", [
          { label: "Judul",   value: title.substring(0, 80) },
          { label: "Artist",  value: artist },
          { label: "Album",   value: album },
          { label: "Durasi",  value: duration },
        ]),
      }, { quoted: msg });

      const buf = await fetchBuffer(downloadUrl);

      await sock.sendMessage(from, {
        audio: buf,
        mimetype: "audio/mpeg",
        ptt: false,
      });

    } catch (e) {
      console.error("[SPOTIFY] Error:", e.message);
      await reply("❌ Gagal mengunduh audio: " + e.message);
    }
  },
};
