// commands/menu.js
const { header, sep } = require("../lib/format");

module.exports = {
  name: "menu",
  aliases: ["help", "bantuan"],
  description: "Tampilkan semua daftar perintah",
  category: "Informasi",

  async run({ reply, commands, PREFIX, BOT_NAME, pushName }) {
    const categories = {};
    const seen = new Set();

    for (const [, cmd] of commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      const cat = cmd.category || "Lainnya";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "short",
      timeStyle: "short",
    });

    const lines = [];
    lines.push(header(`🤖 ${BOT_NAME}`));
    lines.push(`👤 Halo, *${pushName}*!`);
    lines.push(`🔑 Prefix: *${PREFIX}*  |  🕐 ${now}`);
    lines.push(sep());

    for (const [category, cmds] of Object.entries(categories)) {
      lines.push(`\n*📁 ${category.toUpperCase()}*`);
      for (const cmd of cmds) {
        lines.push(`  ${PREFIX}${cmd.name}`);
      }
    }

    lines.push(`\n${sep()}`);
    lines.push(`_Total: ${seen.size} command(s)_`);

    await reply(lines.join("\n"));
  },
};