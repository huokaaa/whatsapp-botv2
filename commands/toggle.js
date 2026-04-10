// commands/toggle.js — Toggle bot ON/OFF (hanya owner)
// Filter owner sudah di index.js, tapi double-check di sini juga

module.exports = {
  name: "toggle",
  aliases: ["boton", "botoff"],
  description: "Toggle bot ON/OFF (owner only)",
  category: "Utilitas",
  ownerOnly: true,

  async run({ reply, botState, pushName, isOwner }) {
    // Double check — seharusnya sudah diblok di index.js
    if (!isOwner) return; // diam saja

    botState.active = !botState.active;
    const status = botState.active ? "ON 🟢" : "OFF 🔴";
    const emoji  = botState.active ? "✅" : "🛑";

    await reply(
      `${emoji} Bot sekarang *${status}*\n\n` +
      `_Di-toggle oleh: ${pushName}_\n\n` +
      (botState.active
        ? "Bot akan merespon semua command seperti biasa."
        : "Bot tidak akan merespon command apapun.\nHanya owner yang bisa mengaktifkan kembali.")
    );
  },
};

