// commands/tag.js — Tag semua member grup (tidak perlu admin)
// Bedanya dengan hidetag: ini tampilkan @nomor satu per satu
// tapi dalam satu pesan, bisa dipakai siapa saja

module.exports = {
  name: "tag",
  aliases: ["tagall", "tagmember"],
  description: "Tag semua anggota grup",
  category: "Grup",

  async run({ sock, from, msg, reply, isGroup, args }) {
    if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di grup.");

    await reply("⏳ Mengambil daftar member...");

    const groupMeta = await sock.groupMetadata(from);
    const botJid    = sock.user.id.replace(/:.*@/, "@");
    const members   = groupMeta.participants
      .map((p) => p.id)
      .filter((id) => id !== botJid);

    if (members.length === 0) return reply("❌ Tidak ada member yang bisa di-tag.");

    const teks = args.join(" ") || "📢 *Perhatian semua member!*";

    // Buat string mention @nomor yang terlihat rapi per baris
    const mentionLines = members.map((jid) => `@${jid.split("@")[0]}`).join(" ");

    await sock.sendMessage(from, {
      text: `${teks}\n\n${mentionLines}`,
      mentions: members,
    }, { quoted: msg });
  },
};
