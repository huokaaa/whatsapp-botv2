// commands/group.js
// Buka / tutup grup (hanya admin yang bisa kirim pesan)

module.exports = {
  name: "group",
  aliases: ["gruplock", "lockgroup"],
  description: "Buka atau tutup grup (admin only)",
  category: "Grup",

  async run({ sock, from, sender, reply, isGroup, args }) {
    if (!isGroup) return reply("❌ Command ini hanya bisa dipakai di dalam grup.");

    const mode = args[0]?.toLowerCase();
    if (!mode || !["open", "close", "buka", "tutup"].includes(mode)) {
      return reply(
        "❌ Format salah. Gunakan:\n" +
        "  *!group open*  → Semua anggota bisa kirim pesan\n" +
        "  *!group close* → Hanya admin yang bisa kirim pesan"
      );
    }

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
      return reply("❌ Bot bukan admin grup.");
    }

    const isClose = mode === "close" || mode === "tutup";
    const setting = isClose ? "announcement" : "not_announcement";
    // "announcement" = hanya admin yang bisa kirim
    // "not_announcement" = semua anggota bisa kirim

    await sock.groupSettingUpdate(from, setting);

    if (isClose) {
      await reply(
        "🔒 *Grup ditutup!*\n\nHanya admin yang bisa mengirim pesan sekarang."
      );
    } else {
      await reply(
        "🔓 *Grup dibuka!*\n\nSemua anggota kini bisa mengirim pesan."
      );
    }
  },
};
