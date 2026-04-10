// commands/copilot.js — Chat dengan AI (Copilot)
// API: eliteprotech-apis.zone.id/copilot?q=

const { fetchJSON } = require("../lib/http");

module.exports = {
  name: "copilot",
  aliases: ["ai", "gpt", "ask", "chat"],
  description: "Tanya AI (Copilot) dengan prompt bebas",
  category: "AI",

  async run({ reply, args, sock, from, msg }) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return reply(
        "❌ Masukkan pertanyaan atau prompt.\n\nContoh:\n*!copilot apa itu fotosintesis?*"
      );
    }

    await reply("🤖 _Sedang berpikir..._");

    let data;
    try {
      data = await fetchJSON(
        `https://eliteprotech-apis.zone.id/copilot?q=${encodeURIComponent(prompt)}`
      );
    } catch (e) {
      return reply("❌ Gagal menghubungi AI: " + e.message);
    }

    // Tangani berbagai kemungkinan format response
    const answer =
      data?.answer   ||
      data?.response ||
      data?.result   ||
      data?.message  ||
      data?.text     ||
      (typeof data === "string" ? data : null);

    if (!answer) {
      return reply("❌ AI tidak memberikan jawaban. Coba ulangi pertanyaanmu.");
    }

    await sock.sendMessage(from, {
      text: `🤖 *Copilot AI*\n\n*Pertanyaan:*\n_${prompt}_\n\n*Jawaban:*\n${answer}`,
    }, { quoted: msg });
  },
};
