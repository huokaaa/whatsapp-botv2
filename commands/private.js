// commands/private.js — Toggle private mode (hanya owner)
// Jika private ON: bot hanya merespon command dari owner

module.exports = {
  name: "private",
  aliases: ["privat", "privatemode"],
  description: "Toggle private mode ON/OFF (owner only)",
  category: "Utilitas",
  ownerOnly: true,

  async run({ reply, botState, isOwner, pushName }) {
    if (!isOwner) return; // diam saja

    botState.private = !botState.private;
    const status = botState.private ? "ON 🔒" : "OFF 🔓";
    const emoji  = botState.private ? "🔒" : "🔓";

    await reply(
      `${emoji} *Private Mode: ${status}*\n\n` +
      `_Di-toggle oleh: ${pushName}_\n\n` +
      (botState.private
        ? "Bot *hanya* akan merespon command dari owner.\nOrang lain diabaikan sepenuhnya."
        : "Bot kembali merespon command dari semua orang.")
    );
  },
};
