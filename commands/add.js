// commands/add.js
// Tambahkan nomor ke grup

module.exports = {
  name: "add",
  aliases: ["addmember"],
  description: "Tambahkan nomor ke grup (admin only)",
  category: "Grup",

  async run({ sock, from, msg, sender, reply, isGroup, args }) {
    if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di dalam grup.");

    // Cek admin
    const groupMeta = await sock.groupMetadata(from);
    const admins = groupMeta.participants
      .filter((p) => p.admin)
      .map((p) => p.id);

    if (!admins.includes(sender)) {
      return reply("❌ Kamu bukan admin grup.");
    }

    const botJid = sock.user.id.replace(/:.*@/, "@");
    if (!admins.includes(botJid)) {
      return reply("❌ Bot bukan admin grup. Jadikan bot admin terlebih dahulu.");
    }

    if (args.length === 0) {
      return reply(
        "❌ Masukkan nomor yang ingin ditambahkan.\n" +
        "Contoh: *!add 6281234567890*\n" +
        "Format: kode negara + nomor tanpa 0 di depan.\n" +
        "Bisa tambah lebih dari satu: *!add 628xxx 628yyy*"
      );
    }

    // Normalisasi nomor
    const numbers = args.map((n) => {
      const clean = n.replace(/\D/g, "");
      return clean.endsWith("@s.whatsapp.net") ? clean : `${clean}@s.whatsapp.net`;
    });

    const result = await sock.groupParticipantsUpdate(from, numbers, "add");

    const success = [];
    const failed  = [];

    for (const r of result) {
      const num = r.jid.split("@")[0];
      if (r.status === "200") success.push(num);
      else failed.push(`${num} (status: ${r.status})`);
    }

    let text = "";
    if (success.length) text += `✅ Berhasil menambahkan:\n${success.map((n) => "  • " + n).join("\n")}`;
    if (failed.length) {
      if (text) text += "\n\n";
      text += `❌ Gagal menambahkan:\n${failed.map((n) => "  • " + n).join("\n")}\n\n_Kemungkinan nomor tidak ada di WhatsApp atau privasi kontak diaktifkan._`;
    }

    await reply(text || "Tidak ada yang diproses.");
  },
};
