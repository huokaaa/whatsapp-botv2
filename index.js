const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  downloadMediaMessage,
  proto,
} = require("@whiskeysockets/baileys");

const pino   = require("pino");
const qrcode = require("qrcode-terminal");
const fs     = require("fs");
const path   = require("path");

const { PREFIX, BOT_NAME, botState, isOwner } = require("./lib/config");
const COMMANDS_DIR = path.join(__dirname, "commands");

module.exports = { BOT_NAME, botState };

// ─────────────────────────────────────────────
//  In-memory message store (fix Bad MAC di DM)
// ─────────────────────────────────────────────
const msgStore = new Map();

function storeMessage(msg) {
  if (!msg?.key?.id) return;
  msgStore.set(msg.key.id, msg);
  if (msgStore.size > 2000) {
    const firstKey = msgStore.keys().next().value;
    msgStore.delete(firstKey);
  }
}

// ─────────────────────────────────────────────
//  Auto-load commands
// ─────────────────────────────────────────────
const commands = new Map();

function loadCommands() {
  const files = fs.readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"));

  for (const file of files) {
    try {
      const command = require(path.join(COMMANDS_DIR, file));
      if (!command.name || typeof command.run !== "function") {
        console.warn(`[WARN] ${file}: tidak ada 'name'/'run'. Dilewati.`);
        continue;
      }
      commands.set(command.name.toLowerCase(), command);
      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) commands.set(alias.toLowerCase(), command);
      }
      console.log(`[CMD] Loaded: ${PREFIX}${command.name}`);
    } catch (e) {
      console.error(`[ERR] Gagal load ${file}:`, e.message);
    }
  }
  console.log(`\n[INFO] Total ${commands.size} command(s) siap.\n`);
}

// ─────────────────────────────────────────────
//  Helper: ambil body teks dari semua tipe pesan
// ─────────────────────────────────────────────
function getMessageBody(msg) {
  const m = msg.message;
  if (!m) return "";

  const unwrapped =
    m.ephemeralMessage?.message ||
    m.viewOnceMessage?.message ||
    m.viewOnceMessageV2?.message ||
    m.documentWithCaptionMessage?.message ||
    m.deviceSentMessage?.message?.deviceSentMessage?.message ||
    m.deviceSentMessage?.message ||
    m;

  return (
    unwrapped.conversation ||
    unwrapped.extendedTextMessage?.text ||
    unwrapped.imageMessage?.caption ||
    unwrapped.videoMessage?.caption ||
    unwrapped.documentMessage?.caption ||
    unwrapped.buttonsResponseMessage?.selectedButtonId ||
    unwrapped.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ""
  );
}

// ─────────────────────────────────────────────
//  Helper: unwrap ephemeral/device wrapper
// ─────────────────────────────────────────────
function unwrapMessage(msg) {
  const m = msg.message;
  if (!m) return msg;

  const unwrappedContent =
    m.ephemeralMessage?.message ||
    m.deviceSentMessage?.message?.deviceSentMessage?.message ||
    m.deviceSentMessage?.message ||
    null;

  return unwrappedContent ? { ...msg, message: unwrappedContent } : msg;
}

// ─────────────────────────────────────────────
//  Helper: viewonce
// ─────────────────────────────────────────────
function getViewOnceContent(msg) {
  const m = msg.message;
  if (!m) return null;
  return (
    m.viewOnceMessage?.message ||
    m.viewOnceMessageV2?.message ||
    m.viewOnceMessageV2Extension?.message ||
    null
  );
}

// ─────────────────────────────────────────────
//  Helper: cek apakah pesan ini dari bot sendiri
//  (bukan dari user yang chat ke bot)
//
//  Penjelasan masalah fromMe di DM:
//  Saat user kirim pesan dari HP mereka ke bot,
//  Baileys di sisi BOT menerima pesan dengan fromMe=false.
//  TAPI saat BOT yang kirim (reply), fromMe=true.
//
//  Yang jadi masalah: kalau bot dan user pakai nomor
//  yang sama (self-chat / testing), atau Baileys salah
//  identifikasi, fromMe bisa true padahal bukan bot.
//
//  Solusi: skip fromMe HANYA kalau ini bukan DM ke diri sendiri,
//  atau cek apakah sender == JID bot itu sendiri.
// ─────────────────────────────────────────────
function isFromBot(msg, botJid) {
  // Di grup: fromMe reliable, skip kalau true
  const isGroup = msg.key.remoteJid?.endsWith("@g.us");
  if (isGroup) return msg.key.fromMe === true;

  // Di DM: jangan pakai fromMe, cek sender langsung
  // Sender di DM = remoteJid (lawan bicara)
  // Kalau remoteJid == botJid berarti self-chat (bot chat ke dirinya sendiri)
  if (botJid && msg.key.remoteJid === botJid) return true;

  // DM biasa: fromMe=true artinya bot yang reply, bukan user yang kirim command
  // TAPI di Baileys versi baru, pesan dari user kadang masuk sebagai fromMe=true
  // karena sinkronisasi multi-device. Solusi: tetap proses semua DM.
  return false;
}

const BYPASS_CMDS = new Set(["toggle"]);

// ─────────────────────────────────────────────
//  Main Bot
// ─────────────────────────────────────────────
async function startBot() {
  loadCommands();

  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      const stored = msgStore.get(key.id);
      if (stored?.message) return stored.message;
      return proto.Message.fromObject({});
    },
  });

  // ── Connection Events ──────────────────────
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.clear();
      console.log("[ SCAN QR CODE DI BAWAH ]\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[INFO] Koneksi terputus. Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) setTimeout(startBot, 3000);
      else { console.log("[INFO] Logged out. Hapus folder auth_info."); process.exit(0); }
    }
    if (connection === "open") {
      console.clear();
      console.log(`✅ ${BOT_NAME} TERHUBUNG!`);
      console.log(`   Prefix  : ${PREFIX}`);
      console.log(`   Command : ${commands.size} loaded`);
      console.log(`   Status  : ${botState.active ? "ON 🟢" : "OFF 🔴"}`);
      console.log(`   Private : ${botState.private ? "ON 🔒" : "OFF 🔓"}\n`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ── Message Handler ───────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    // Ambil JID bot sendiri untuk perbandingan
    const botJid = sock.user?.id?.replace(/:.*@/, "@") || "";

    for (const rawMsg of messages) {
      storeMessage(rawMsg);
      if (!rawMsg.message) continue;

      const msg  = unwrapMessage(rawMsg);
      const body = getMessageBody(msg);

      // Hanya proses pesan yang diawali PREFIX
      if (!body.startsWith(PREFIX)) continue;

      const from    = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender  = msg.key.participant || msg.key.remoteJid;
      const pushName = msg.pushName || "Pengguna";
      const fromMe  = msg.key.fromMe;

      // Log dulu sebelum filter apapun
      console.log(`[MSG] ${pushName} (${sender.split("@")[0]}) [${isGroup ? "Grup" : "DM"}${fromMe ? "/Me" : ""}] → ${body.substring(0, 80)}`);

      // Skip kalau memang dari bot sendiri (bukan user)
      if (isFromBot(msg, botJid)) {
        console.log(`[SKIP] Pesan dari bot sendiri, diabaikan.`);
        continue;
      }

      const senderIsOwner = isOwner(sender);

      // Simpan viewonce
      const voContent = getViewOnceContent(msg);
      if (voContent) {
        if (!sock._voStore) sock._voStore = new Map();
        sock._voStore.set(from, { msg, voContent });
      }

      const args        = body.slice(PREFIX.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();
      const command     = commands.get(commandName);

      if (!command) {
        console.log(`[MISS] Command tidak ditemukan: ${PREFIX}${commandName}`);
        continue;
      }

      const isBypass = BYPASS_CMDS.has(commandName);
      if (isBypass && !senderIsOwner) continue;
      if (!botState.active && !isBypass) continue;
      if (botState.private && !senderIsOwner) continue;

      const ctx = {
        sock,
        msg,
        from,
        sender,
        pushName,
        args,
        isGroup,
        commands,
        PREFIX,
        BOT_NAME,
        botState,
        isOwner: senderIsOwner,
        downloadMediaMessage,
        reply: (text) => sock.sendMessage(from, { text }, { quoted: msg }),
      };

      try {
        const start = Date.now();
        await command.run(ctx);
        console.log(`[OK] ${PREFIX}${commandName} (${Date.now() - start}ms)`);
      } catch (err) {
        console.error(`[ERR] ${PREFIX}${commandName}:`, err.message);
        ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  });
}

startBot();