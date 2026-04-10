// commands/alive.js
const { card } = require("../lib/format");

module.exports = {
  name: "alive",
  aliases: ["status", "aktif"],
  description: "Cek status bot sedang aktif",
  category: "Utilitas",

  async run({ reply, pushName, BOT_NAME }) {
    const uptime = getUptime(process.uptime());
    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "short",
      timeStyle: "medium",
    });

    await reply(
      card(`⚡ ${BOT_NAME}`, [
        { label: "Status",   value: "ONLINE" },
        { label: "Uptime",   value: uptime },
        { label: "RAM",      value: `${memUsed} MB` },
        { label: "Node.js",  value: process.version },
        { label: "Waktu",    value: now },
        { divider: true },
        { value: `Halo, *${pushName}* HuokaMD is Online` },
      ])
    );
  },
};

function getUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}j ${m}m ${s}d`;
}
