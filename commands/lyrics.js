// commands/lyrics.js — Cari lirik lagu
// API: lyricsapi.fly.dev

const fetch = require("node-fetch");

module.exports = {
  name: "lyrics",
  aliases: ["lirik"],
  description: "Cari lirik lagu",
  category: "Musik",

  async run({ reply, args }) {
    const query = args.join(" ").trim();
    if (!query) return reply("🔍 Masukkan judul lagu.\nContoh: *!lyrics shape of you*");

    await reply(`🔍 Mencari lirik: *${query}*...`);

    try {
      const res = await fetch(
        `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(query)}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data   = await res.json();
      const lyrics = data?.result?.lyrics || null;

      if (!lyrics) {
        return reply(`❌ Lirik untuk "*${query}*" tidak ditemukan.`);
      }

      const title  = data?.result?.title  || query;
      const artist = data?.result?.artist || "";

      const header = `🎵 *${title}*${artist ? `\n👤 ${artist}` : ""}\n${"─".repeat(30)}\n\n`;
      const full   = header + lyrics;

      const maxChars = 4096;
      const output = full.length > maxChars ? full.slice(0, maxChars - 3) + "..." : full;

      await reply(output);

    } catch (e) {
      console.error("[LYRICS ERR]", e.message);
      await reply(`❌ Gagal mengambil lirik untuk "*${query}*".`);
    }
  },
};