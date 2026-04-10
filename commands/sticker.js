// commands/sticker.js — Ubah gambar jadi stiker WhatsApp
// Deps: npm install sharp
// Kalau sharp belum ada, bot akan kasih instruksi install

module.exports = {
  name: "sticker",
  aliases: ["s"],
  description: "Ubah gambar menjadi stiker",
  category: "Media",

  async run({ sock, msg, from, args, reply, downloadMediaMessage }) {
    // Cek apakah sharp tersedia
    let sharp;
    try {
      sharp = require("sharp");
    } catch {
      return reply(
        "❌ Modul *sharp* belum terinstall.\n\nJalankan perintah berikut di terminal:\n```\nnpm install sharp\n```\nlalu restart bot."
      );
    }

    // Tentukan nama stiker
    const packName  = "HuokaMD";
    const stickerName = args.length > 0 ? args.join(" ") : "HuokaMD";

    // Cari pesan gambar — bisa dari pesan langsung atau reply
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg =
      msg.message?.imageMessage ||
      quoted?.imageMessage ||
      null;

    if (!imgMsg) {
      return reply(
        "❌ Kirim gambar dengan caption *!s* atau reply ke gambar dengan *!s*.\n\nContoh caption: *!s nama stiker*"
      );
    }

    await reply("⏳ Membuat stiker...");

    try {
      // Download buffer gambar
      // Kalau pesan adalah quoted, buat msg palsu agar downloadMediaMessage bisa baca
      let targetMsg = msg;
      if (!msg.message?.imageMessage && quoted?.imageMessage) {
        targetMsg = {
          key: msg.key,
          message: quoted,
        };
      }

      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});

      // Konversi ke WebP (format stiker WA) pakai sharp
      const webpBuffer = await sharp(buffer)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toBuffer();

      // Kirim sebagai stiker
      await sock.sendMessage(from, {
        sticker: webpBuffer,
        mimetype: "image/webp",
        stickerPack: packName,
        stickerAuthor: stickerName,
      }, { quoted: msg });

    } catch (e) {
      console.error("[STICKER ERR]", e.message);
      await reply("❌ Gagal membuat stiker: " + e.message);
    }
  },
};
