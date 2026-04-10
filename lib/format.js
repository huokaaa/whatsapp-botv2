// ─────────────────────────────────────────────
//  lib/format.js
//  Helper untuk formatting teks yang kompatibel
//  di desktop DAN mobile WhatsApp
// ─────────────────────────────────────────────

/**
 * Karakter box drawing unicode (╔╗╚╝║═╠╣╬)
 * tampil bagus di desktop tapi di mobile WA sering
 * geser karena font monospace tidak konsisten.
 *
 * Solusi: pakai karakter ASCII biasa yang fixed-width
 * di semua platform → * + - | dengan padding sederhana.
 *
 * Format output pakai *bold* WhatsApp markdown biar
 * tetap ada hierarki visual tanpa box drawing.
 */

/**
 * Buat card teks bergaya mobile-safe
 * @param {string} title  - Judul card
 * @param {Object[]} rows - Array of { label, value }
 * @param {string} [footer] - Teks bawah opsional
 */
function card(title, rows, footer = "") {
  const lines = [];

  lines.push(`*┌─「 ${title} 」─┐*`);
  lines.push("│");

  for (const row of rows) {
    if (row.divider) {
      lines.push("├──────────────────");
      continue;
    }
    if (row.label) {
      lines.push(`│  *${row.label}*`);
      lines.push(`│  ${row.value ?? ""}`);
    } else {
      lines.push(`│  ${row.value ?? ""}`);
    }
  }

  lines.push("│");
  if (footer) {
    lines.push(`│  _${footer}_`);
    lines.push("│");
  }
  lines.push("*└────────────────────┘*");

  return lines.join("\n");
}

/**
 * Buat section header sederhana
 * @param {string} text
 */
function header(text) {
  return `*━━━「 ${text} 」━━━*`;
}

/**
 * Buat list item
 * @param {string} cmd   - nama command (tanpa prefix)
 * @param {string} desc  - deskripsi singkat
 * @param {string} prefix
 */
function listItem(cmd, desc, prefix = "!") {
  return `  ◈ *${prefix}${cmd}*\n    _${desc}_`;
}

/**
 * Separator baris
 */
function sep() {
  return "───────────────────";
}

module.exports = { card, header, listItem, sep };
