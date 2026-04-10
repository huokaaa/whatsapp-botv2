// commands/kick.js
// Keluarkan anggota yang di-tag dari grup
// Hanya bisa dipakai oleh admin

module.exports = {
  name: "kick",
  aliases: ["remove"],
  description: "Keluarkan anggota dari grup (admin only)",
  category: "Grup",

  async run({ sock, from, msg, sender, reply, isGroup }) {
    // Harus di grup
    if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di dalam grup.");

    // Cek apakah pengirim adalah admin
    const groupMeta = await sock.groupMetadata(from);
    const admins = groupMeta.participants
      .filter((p) => p.admin)
      .map((p) => p.id);

    if (!admins.includes(sender)) {
      return reply("❌ Kamu bukan admin grup. Tidak bisa menggunakan command ini.");
    }

    // Cek apakah bot sendiri admin
    const botJid = sock.user.id.replace(/:.*@/, "@");
    if (!admins.includes(botJid)) {
      return reply("❌ Bot bukan admin grup. Jadikan bot admin terlebih dahulu.");
    }

    // Ambil target dari mention
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mentioned.length === 0) {
      return reply("❌ Tag anggota yang ingin dikick.\nContoh: *!kick @nama*");
    }

    // Jangan izinkan kick sesama admin
    const targets = mentioned.filter((jid) => {
      if (admins.includes(jid)) return false;
      return true;
    });

    const skipped = mentioned.length - targets.length;

    if (targets.length === 0) {
      return reply("❌ Target yang kamu tag adalah admin. Bot tidak bisa mengeluarkan admin.");
    }

    // Kick
    await sock.groupParticipantsUpdate(from, targets, "remove");

    const names = targets.map((jid) => "@" + jid.split("@")[0]);
    let text = `✅ Berhasil mengeluarkan ${targets.length} anggota:\n${names.join("\n")}`;
    if (skipped > 0) text += `\n\n⚠️ ${skipped} target dilewati karena admin.`;

    await reply(text);
  },
};
