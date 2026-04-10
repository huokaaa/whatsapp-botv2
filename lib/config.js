// lib/config.js — Konfigurasi sentral bot
// Edit bagian ini sesuai kebutuhan kamu

// ── DATA OWNER ────────────────────────────────────────────────────────────────
// Nomor WA owner (format: 628xxx, tanpa +, tanpa spasi)
// Bisa lebih dari satu owner
const OWNER_NUMBERS = [
  "",   // ← Ganti dengan nomor WA kamu
  // "628xxxxxxxxxx", // ← Tambah owner kedua kalau mau
];

// Nama owner (untuk display)
const OWNER_NAME = "Huoka";

// ── BOT CONFIG ────────────────────────────────────────────────────────────────
const PREFIX   = "!";
const BOT_NAME = "HuokaMD";

// ── SHARED STATE (mutable, di-share ke semua command) ─────────────────────────
const botState = {
  active:  true,   // toggle on/off (hanya owner)
  private: false,  // private mode (hanya owner yang bisa pakai bot)
};

// ── HELPER: cek apakah sender adalah owner ───────────────────────────────────
function isOwner(senderJid) {
  const num = senderJid.replace(/@.+/, "").replace(/:\d+$/, "");
  return OWNER_NUMBERS.includes(num);
}

module.exports = { OWNER_NUMBERS, OWNER_NAME, PREFIX, BOT_NAME, botState, isOwner };
