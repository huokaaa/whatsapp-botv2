// commands/ping.js
const { card } = require("../lib/format");

module.exports = {
  name: "ping",
  aliases: ["p", "latency"],
  description: "Cek latensi response bot",
  category: "Utilitas",

  async run({ reply }) {
    const start = Date.now();
    await reply("⏳");
    const latency = Date.now() - start;

    const bar = generateBar(latency);
    const status =
      latency < 500 ? "🟢 Baik" : latency < 1000 ? "🟡 Sedang" : "🔴 Lambat";

    await reply(
      card("🏓 PONG", [
        { label: "Latensi", value: `${latency} ms` },
        { label: "Status",  value: status },
        { label: "Bar",     value: bar },
      ])
    );
  },
};

function generateBar(ms) {
  const filled = Math.min(Math.round((ms / 2000) * 8), 8);
  const empty = 8 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
