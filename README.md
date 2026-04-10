# 🤖 NexusBot

WhatsApp Bot berbasis [Baileys](https://github.com/WhiskeySockets/Baileys) dengan sistem command modular.

---

## ✨ Fitur

- Sistem command modular (tambah command cukup buat file baru di `commands/`)
- Auto-load semua command dari folder `commands/`
- Support grup & DM
- Private mode & toggle on/off
- Download lagu (YouTube)
- Lirik lagu
- Capture View Once media
- Dan masih banyak lagi...

---

## 📋 Requirements

- Node.js `v18+`
- npm
- VPS / server Linux (atau lokal)

---

## 🚀 Instalasi

### 1. Clone repo

```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi

Edit file `lib/config.js` sesuai kebutuhan:

```js
const PREFIX  = "!";
const BOT_NAME = "NexusBot";
const OWNER   = ["628xxxxxxxxxx@s.whatsapp.net"];
```

### 4. Jalankan bot

```bash
node index.js
```

Scan QR code yang muncul di terminal menggunakan WhatsApp.

---

## 📁 Struktur Folder

```
nexusbot/
├── commands/         # Semua file command (.js)
├── lib/
│   ├── config.js     # Konfigurasi PREFIX, BOT_NAME, OWNER
│   ├── format.js     # Helper formatting pesan
│   └── http.js       # Helper HTTP request
├── auth_info/        # Sesi WhatsApp (auto-generated, jangan di-commit)
├── index.js          # Entry point utama
├── package.json
└── README.md
```

---

## ➕ Menambah Command Baru

Buat file baru di folder `commands/`, contoh `commands/hello.js`:

```js
module.exports = {
  name: "hello",
  aliases: ["hi"],
  description: "Sapa pengguna",
  category: "Utilitas",

  async run({ reply, pushName }) {
    await reply(`Halo, ${pushName}! 👋`);
  },
};
```

Bot akan otomatis load command baru tanpa perlu edit file lain.

---

## 🔧 Menjalankan dengan PM2 (Recommended untuk VPS)

```bash
# Install PM2
npm install -g pm2

# Jalankan bot
pm2 start index.js --name nexusbot

# Auto-start saat server reboot
pm2 startup
pm2 save

# Cek log
pm2 logs nexusbot

# Restart
pm2 restart nexusbot
```

---

## 📜 Lisensi

MIT
