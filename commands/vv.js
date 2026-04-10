// commands/vv.js — Capture & resend View Once media
// User reply ke pesan viewonce lalu ketik !vv

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "vv",
  aliases: ["viewonce", "vo"],
  description: "Lihat isi pesan View Once",
  category: "Utilitas",

  async run({ sock, from, msg, reply }) {

    // ── Ambil quoted message ──
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quoted      = contextInfo?.quotedMessage;

    if (!quoted) {
      return reply(
        "❌ Tidak ada pesan yang di-reply.\n\n" +
        "_Reply ke pesan View Once lalu ketik *!vv*_"
      );
    }

    // ── Unwrap viewonce wrapper kalau ada ──
    // Kadang imageMessage/videoMessage dibungkus viewOnceMessage
    const unwrapped =
      quoted.viewOnceMessage?.message ||
      quoted.viewOnceMessageV2?.message ||
      quoted.viewOnceMessageV2Extension?.message ||
      quoted;

    const imgMsg = unwrapped.imageMessage || null;
    const vidMsg = unwrapped.videoMessage || null;

    if (!imgMsg && !vidMsg) {
      return reply("❌ Pesan yang di-reply bukan gambar atau video View Once.");
    }

    await reply("⏳ Mengambil media View Once...");

    try {
      if (imgMsg) {
        const stream = await downloadContentFromMessage(imgMsg, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
          image: buffer,
          caption: "👁️ *View Once Image*\n_Diambil oleh bot_",
        }, { quoted: msg });

      } else {
        const stream = await downloadContentFromMessage(vidMsg, "video");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
          video: buffer,
          caption: "👁️ *View Once Video*\n_Diambil oleh bot_",
          mimetype: vidMsg.mimetype || "video/mp4",
        }, { quoted: msg });
      }

      console.log(`[VV] Berhasil kirim ${imgMsg ? "image" : "video"} view once`);

    } catch (e) {
      console.error("[VV ERR]", e.message);
      await reply("❌ Gagal mengambil media: " + e.message);
    }
  },
};