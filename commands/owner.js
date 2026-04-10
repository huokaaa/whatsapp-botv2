// commands/owner.js — Kirim vCard owner
// Data diambil dari lib/config.js

const { OWNER_NUMBERS, OWNER_NAME } = require("../lib/config");

module.exports = {
  name: "owner",
  aliases: ["creator", "dev"],
  description: "Tampilkan kontak pemilik bot",
  category: "Informasi",

  async run({ sock, from, msg }) {
    const number = OWNER_NUMBERS[0]; // Nomor utama
    const vcard  =
      `BEGIN:VCARD\n` +
      `VERSION:3.0\n` +
      `FN:${OWNER_NAME}\n` +
      `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n` +
      `END:VCARD`;

    await sock.sendMessage(
      from,
      {
        contacts: {
          displayName: OWNER_NAME,
          contacts: [{ vcard }],
        },
      },
      { quoted: msg }
    );
  },
};


