// commands/demote.js
// Turunkan admin menjadi anggota biasa

const { _updateRole } = require("./promote");

module.exports = {
  name: "demote",
  aliases: ["turunkanjabatan"],
  description: "Turunkan admin menjadi anggota biasa",
  category: "Grup",

  async run(ctx) {
    await _updateRole(ctx, "demote");
  },
};
