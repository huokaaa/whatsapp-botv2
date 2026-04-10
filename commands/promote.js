// commands/promote.js
// Jadikan anggota yang di-tag sebagai admin

module.exports = {
  name: "promote",
  aliases: ["jadikanadmin"],
  description: "Jadikan anggota sebagai admin grup",
  category: "Grup",

  async run(ctx) {
    await updateRole(ctx, "promote");
  },
};

// ── Shared helper (dipakai juga oleh demote.js) ──
async function updateRole({ sock, from, msg, sender, reply, isGroup }, action) {
  if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di dalam grup.");

  const groupMeta = await sock.groupMetadata(from);
  const admins = groupMeta.participants
    .filter((p) => p.admin)
    .map((p) => p.id);

  if (!admins.includes(sender)) {
    return reply("❌ Kamu bukan admin grup.");
  }

  const botJid = sock.user.id.replace(/:.*@/, "@");
  if (!admins.includes(botJid)) {
    return reply("❌ Bot bukan admin grup.");
  }

  const mentioned =
    msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  if (mentioned.length === 0) {
    const cmd = action === "promote" ? "!promote" : "!demote";
    return reply(`❌ Tag anggota yang ingin di-${action}.\nContoh: *${cmd} @nama*`);
  }

  await sock.groupParticipantsUpdate(from, mentioned, action);

  const icon = action === "promote" ? "⬆️" : "⬇️";
  const label = action === "promote" ? "dijadikan admin" : "diturunkan dari admin";
  const names = mentioned.map((jid) => "  • @" + jid.split("@")[0]);

  await reply(`${icon} Berhasil, anggota berikut telah ${label}:\n${names.join("\n")}`);
}

module.exports._updateRole = updateRole; // ekspor helper untuk demote.js
