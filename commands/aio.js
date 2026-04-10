// commands/aio.js — All-in-One Media Downloader
// API: eliteprotech-apis.zone.id/aio3
// Support: YouTube, TikTok, Instagram, Facebook, Twitter/X,
//          SoundCloud, Spotify, Pinterest, Capcut, dll

const { fetchJSON, fetchBuffer } = require("../lib/http");
const { card } = require("../lib/format");

// Pemetaan domain → nama platform yang tampil di output
const PLATFORM_MAP = {
  "youtube.com": "YouTube",  "youtu.be": "YouTube",
  "tiktok.com": "TikTok",    "vm.tiktok": "TikTok",   "vt.tiktok": "TikTok",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook", "fb.watch": "Facebook",  "fb.com": "Facebook",
  "twitter.com": "Twitter",  "x.com": "Twitter",
  "soundcloud.com": "SoundCloud",
  "open.spotify.com": "Spotify",
  "pinterest.com": "Pinterest",
  "capcut.com": "CapCut",
  "threads.net": "Threads",
  "dailymotion.com": "Dailymotion",
  "vimeo.com": "Vimeo",
  "likee.video": "Likee",
  "snack.video": "Snack Video",
  "bilibili.com": "Bilibili",
};

function detectPlatform(url) {
  for (const [domain, name] of Object.entries(PLATFORM_MAP)) {
    if (url.includes(domain)) return name;
  }
  return "Media";
}

module.exports = {
  name: "aio",
  aliases: [
    "allinone", "dl",
    // TikTok
    "tiktokv2", "ttv2",
    // YouTube
    "ytv2", "youtubev2",
    // Instagram
    "igv2", "instagramv2", "ig",
    // Facebook
    "fbv2", "facebookv2", "fb",
    // Twitter/X
    "twitterv2", "xdl",
    // SoundCloud
    "scv2", "soundcloud",
    // Pinterest
    "pin", "pinterest",
    // CapCut
    "capcut",
    // Threads
    "threads",
    // Umum
    "download",
  ],
  description: "Download media dari semua platform (YouTube, TikTok, IG, FB, dll)",
  category: "Downloader",

  async run({ reply, args, sock, from, msg }) {
    const url = args[0];

    if (!url || !url.startsWith("http")) {
      return reply(
        card("📥 AIO Downloader", [
          { value: "Kirim link media yang ingin didownload." },
          { divider: true },
          { label: "Platform yang didukung", value: "" },
          { value: "YouTube, TikTok, Instagram, Facebook" },
          { value: "Twitter/X, SoundCloud, Pinterest, CapCut" },
          { value: "Threads, Dailymotion, Vimeo, dan lainnya" },
          { divider: true },
          { value: "Contoh: *!aio https://youtu.be/xxxxx*" },
        ])
      );
    }

    const platform = detectPlatform(url);
    await reply(`⏳ Memproses *${platform}*...`);

    let data;
    try {
      data = await fetchJSON(
        `https://eliteprotech-apis.zone.id/aio3?url=${encodeURIComponent(url)}`
      );
    } catch (e) {
      return reply("❌ Gagal menghubungi API. Coba lagi nanti.\nError: " + e.message);
    }

    if (!data?.success || !data?.medias?.length) {
      return reply(
        "❌ Gagal mengambil media.\n\n" +
        "_Kemungkinan link tidak valid, konten privat, atau platform belum didukung._"
      );
    }

    // Pilih media terbaik: prioritaskan video → audio non-chunked terbesar
    const videoMedia = data.medias.find(
      (m) => m.videoAvailable && !m.chunked && !m.requiresRendering
    );
    const audioMedia = data.medias.find(
      (m) => m.audioAvailable && !m.chunked && !m.requiresRendering && m.extension !== "ogg"
    ) || data.medias.find(
      (m) => m.audioAvailable && !m.chunked && !m.requiresRendering
    );

    const best = videoMedia || audioMedia || data.medias.find((m) => !m.chunked && !m.requiresRendering);

    if (!best) {
      return reply(
        "❌ Media ditemukan tapi tidak bisa didownload langsung.\n" +
        "_Konten mungkin memerlukan rendering khusus atau berformat chunked._"
      );
    }

    // Kirim info card
    await sock.sendMessage(from, {
      text: card(`📥 ${platform}`, [
        { label: "Judul:",   value: (data.title || "Media").substring(0, 80) },
        { label: "Durasi:",  value: data.duration || "-" },
        { label: "Format:",  value: `${best.extension?.toUpperCase()} · ${best.quality || "-"}` },
        { label: "Ukuran:",  value: best.formattedSize || "-" },
        { label: "Source:",  value: data.source || platform },
      ]),
    }, { quoted: msg });

    try {
      const buf = await fetchBuffer(best.url);
      const isVideo = best.videoAvailable;
      const isAudio = best.audioAvailable && !isVideo;

      if (isVideo) {
        await sock.sendMessage(from, {
          video: buf,
          caption: `📥 *${(data.title || "Video").substring(0, 100)}*\n_via ${platform}_`,
          mimetype: "video/mp4",
        });
      } else if (isAudio) {
        const mime = best.extension === "ogg"
          ? "audio/ogg; codecs=opus"
          : "audio/mpeg";
        await sock.sendMessage(from, {
          audio: buf,
          mimetype: mime,
          ptt: false,
        });
      } else {
        // Kirim sebagai dokumen fallback
        await sock.sendMessage(from, {
          document: buf,
          fileName: `${data.title || "media"}.${best.extension || "mp4"}`,
          mimetype: `application/${best.extension || "octet-stream"}`,
          caption: `📥 ${data.title || "Media"}`,
        });
      }
    } catch (e) {
      console.error("[AIO] Download error:", e.message);
      await reply("❌ Gagal mengunduh media: " + e.message);
    }
  },
};
