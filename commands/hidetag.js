// commands/hidetag.js — Tag semua anggota tersembunyi
// Izin: owner ATAU admin grup

module.exports = {
  name: "hidetag",
  aliases: ["everyone", "semua"],
  description: "Tag semua anggota grup secara tersembunyi (admin/owner)",
  category: "Grup",

  async run({ sock, from, msg, sender, reply, isGroup, isOwner, args }) {
    if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di dalam grup.");

    const groupMeta = await sock.groupMetadata(from);
    const admins    = groupMeta.participants.filter((p) => p.admin).map((p) => p.id);
    const isAdmin   = admins.includes(sender);

    // Izin: owner BOT atau admin grup
    if (!isOwner && !isAdmin) {
      return reply("❌ Hanya *admin grup* atau *owner bot* yang bisa menggunakan command ini.");
    }

    const botJid    = sock.user.id.replace(/:.*@/, "@");
    const allMembers = groupMeta.participants
      .map((p) => p.id)
      .filter((id) => id !== botJid);

    const text = args.join("") || "";

    await sock.sendMessage(
      from,
      {
        text: `${text}`,
        mentions: allMembers,
      },
      { quoted: msg }
    );
  },
};

