# 🤖 NexusBot — WhatsApp Bot (Baileys)

Bot WhatsApp modular berbasis Node.js menggunakan library `@whiskeysockets/baileys`.

---

## 📁 Struktur Proyek

```
whatsapp-bot/
├── index.js                 ← Main file (koneksi + routing)
├── package.json
├── .gitignore
├── auth_info/               ← Dibuat otomatis setelah scan QR (JANGAN dihapus!)
└── commands/
    ├── _TEMPLATE.js         ← Template untuk command baru
    ├── ping.js              ← !ping — cek latensi
    ├── alive.js             ← !alive — status bot
    └── menu.js              ← !menu — daftar semua command
```

---

## ⚙️ Requirements

| Kebutuhan | Versi Minimum |
|-----------|--------------|
| Node.js   | **v18.0.0+** |
| npm       | v8+          |

Cek versi Node.js kamu:
```bash
node -v
```

---

## 🚀 Cara Menjalankan

### 1. Clone / Download project ini
```bash
# Kalau dari git:
git clone <url-repo-kamu>
cd whatsapp-bot

# Kalau download manual, cukup masuk ke foldernya:
cd whatsapp-bot
```

### 2. Install dependencies
```bash
npm install
```

> Proses ini akan mengunduh `@whiskeysockets/baileys`, `pino`, dan `qrcode-terminal`.
> Biasanya butuh 1–3 menit tergantung koneksi internet.

### 3. Jalankan bot
```bash
npm start
```

### 4. Scan QR Code
- QR Code akan muncul di terminal.
- Buka WhatsApp di HP → **Perangkat Tertaut** → **Tautkan Perangkat** → Scan QR.
- Setelah berhasil, terminal akan menampilkan pesan **"BERHASIL TERHUBUNG!"**

### 5. Test bot
Kirim pesan ke nomor bot (dari nomor lain):
```
!ping
!alive
!menu
```

---

## ➕ Cara Menambah Command Baru

1. **Copy file template:**
   ```bash
   cp commands/_TEMPLATE.js commands/namacommand.js
   ```

2. **Edit file tersebut**, ubah bagian `name`, `description`, `category`, dan isi logic di fungsi `run()`.

3. **Restart bot** — command akan otomatis terbaca tanpa perlu daftar di `index.js`.

### Contoh: Membuat command `!halo`

Buat file `commands/halo.js`:
```js
module.exports = {
  name: "halo",
  description: "Balas sapaan",
  category: "Fun",

  async run({ reply, pushName }) {
    await reply(`Halo juga, ${pushName}! 👋`);
  },
};
```

Selesai! Setelah restart, `!halo` langsung bisa dipakai.

---

## 🔄 Restart Otomatis (Opsional)

Pakai `pm2` biar bot otomatis restart kalau crash atau server reboot:
```bash
npm install -g pm2
pm2 start index.js --name nexusbot
pm2 save
pm2 startup
```

---

## ❗ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| QR tidak muncul | Pastikan terminal mendukung output teks |
| Logged out tiba-tiba | Hapus folder `auth_info/` lalu restart |
| Command tidak terbaca | Pastikan file ada properti `name` dan fungsi `run` |
| Error saat install | Coba `npm install --legacy-peer-deps` |

---

Made with ❤️ by Huoka
