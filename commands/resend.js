// commands/resend.js — Kirim ulang dokumen sebagai media (video/image/audio)
// User reply ke dokumen lalu !resend

module.exports = {
  name: "resend",
  aliases: ["send", "kirim"],
  description: "Kirim ulang dokumen sebagai media",
  category: "Media",

  async run({ sock, from, msg, reply, downloadMediaMessage }) {
    // Cari dokumen di quoted message
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const docMsg = msg.message?.documentMessage || quoted?.documentMessage || null;

    if (!docMsg) {
      return reply(
        "❌ Reply ke pesan *dokumen* lalu ketik *!resend*.\n\n" +
        "_Mendukung: file video (.mp4), gambar (.jpg/.png), audio (.mp3/.ogg)_"
      );
    }

    const mime     = docMsg.mimetype || "";
    const fileName = docMsg.fileName || "file";

    await reply(`⏳ Memproses *${fileName}*...`);

    try {
      let targetMsg = msg;
      if (!msg.message?.documentMessage && quoted?.documentMessage) {
        targetMsg = { key: msg.key, message: quoted };
      }

      const buf = await downloadMediaMessage(targetMsg, "buffer", {});

      // Deteksi tipe berdasarkan mimetype
      if (mime.startsWith("image/")) {
        await sock.sendMessage(from, {
          image: buf,
          caption: `🖼️ *${fileName}*`,
          mimetype: mime,
        }, { quoted: msg });

      } else if (mime.startsWith("video/")) {
        await sock.sendMessage(from, {
          video: buf,
          caption: `🎬 *${fileName}*`,
          mimetype: "video/mp4",
        }, { quoted: msg });

      } else if (mime.startsWith("audio/") || mime === "application/ogg") {
        await sock.sendMessage(from, {
          audio: buf,
          mimetype: mime.includes("ogg") ? "audio/ogg; codecs=opus" : "audio/mpeg",
          ptt: mime.includes("ogg"), // kirim sebagai voice note kalau ogg
        }, { quoted: msg });

      } else {
        return reply(
          `❌ Tipe file *${mime}* tidak didukung.\n\n` +
          "_Yang didukung: gambar, video, audio_"
        );
      }

    } catch (e) {
      console.error("[RESEND ERR]", e.message);
      await reply("❌ Gagal memproses file: " + e.message);
    }
  },
};
