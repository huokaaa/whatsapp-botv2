// ─────────────────────────────────────────────
//  TEMPLATE: Buat command baru dari sini!
//  Salin file ini → rename → isi bagian bawah
// ─────────────────────────────────────────────

module.exports = {
  // ── WAJIB ─────────────────────────────────
  name: "namacommand",          // Nama command (huruf kecil, tanpa spasi)
  description: "Deskripsi singkat command ini",
  category: "Kategori",        // Contoh: "Utilitas", "Fun", "Informasi"

  // ── OPSIONAL ──────────────────────────────
  aliases: ["alias1", "alias2"], // Nama lain yang bisa dipakai

  // ── LOGIC ─────────────────────────────────
  async run(ctx) {
    // Destructure dari ctx sesuai kebutuhan:
    const {
      reply,       // Fungsi balas pesan (reply(text))
      args,        // Array argumen setelah prefix+command
      from,        // JID chat (pribadi / grup)
      sender,      // JID pengirim
      pushName,    // Nama pengirim
      isGroup,     // Boolean: true jika di grup
      sock,        // Socket Baileys (untuk fungsi lanjutan)
      msg,         // Objek pesan lengkap
      commands,    // Map semua command yang terdaftar
      PREFIX,      // Prefix bot (default: "!")
      BOT_NAME,    // Nama bot
    } = ctx;

    // Contoh: balas dengan teks biasa
    await reply("Halo! Ini respons dari command baru kamu.");

    // Contoh: balas dengan teks + args
    if (args.length > 0) {
      await reply(`Kamu nulis: ${args.join(" ")}`);
    }

    // Contoh: kirim gambar
    // await sock.sendMessage(from, {
    //   image: { url: "https://link-gambar.com/foto.jpg" },
    //   caption: "Caption gambar di sini"
    // }, { quoted: msg });
  },
};
