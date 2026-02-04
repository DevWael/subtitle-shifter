# 🎬 Subtitle Shifter

A modern web application to adjust SRT subtitle timings. Shift entire files or specific portions with an intuitive, privacy-focused interface, works on windows, linux and mac.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🚀 Full Shift** - Adjust all subtitle timings at once
- **🎯 Partial Shift** - Shift only subtitles within a specific time range
- **👁️ Live Preview** - Compare original vs shifted timestamps before downloading
- **🌙 Dark/Light Mode** - Beautiful UI with theme persistence
- **🔒 Privacy First** - Files processed in-memory, never stored on server
- **📱 Responsive** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/DevWael/subtitle-shifter.git

# Navigate to the project
cd subtitle-shifter

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Start server with auto-reload
npm run dev:server

# In another terminal, watch for CSS changes
npm run css:watch
```

### 🐳 Docker

The easiest way to run the app - no Node.js required!

```bash
# Clone the repository
git clone https://github.com/DevWael/subtitle-shifter.git
cd subtitle-shifter

# Run with Docker Compose
docker compose up -d

# Or build and run manually
docker build -t subtitle-shifter .
docker run -p 3000:3000 subtitle-shifter
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To stop: `docker compose down`

## 🎮 Usage

1. **Upload** - Drag and drop an `.srt` file or click to browse
2. **Choose Mode**
   - *Full Shift*: Adjust all subtitles
   - *Partial Shift*: Set a time range (e.g., 00:10:00 to 00:20:00)
3. **Set Offset** - Enter milliseconds (positive = delay, negative = earlier)
4. **Preview** - Review the changes with side-by-side comparison
5. **Download** - Get your shifted subtitle file

### Common Use Cases

| Problem | Solution |
|---------|----------|
| Subtitles appear 2 seconds early | Set offset to `+2000` |
| Subtitles appear 500ms late | Set offset to `-500` |
| Only half the movie is out of sync | Use Partial Shift with time range |

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js 4.x
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS 3.x
- **SRT Parsing**: [subtitle](https://www.npmjs.com/package/subtitle) npm package
- **File Handling**: Multer (memory storage)

## 📁 Project Structure

```
subtitle-shifter/
├── server.js              # Express entry point
├── src/
│   ├── routes/
│   │   └── api.js         # REST API endpoints
│   └── utils/
│       └── srt-shifter.js # SRT parsing & shifting logic
├── public/
│   ├── index.html         # Main page
│   ├── css/
│   │   ├── input.css      # Tailwind source
│   │   └── styles.css     # Compiled CSS
│   └── js/
│       └── app.js         # Frontend logic
└── test-files/
    └── sample.srt         # Sample file for testing
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload and parse SRT file |
| `POST` | `/api/shift` | Shift subtitles and get preview |
| `POST` | `/api/download` | Generate shifted SRT file |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [subtitle](https://www.npmjs.com/package/subtitle) - Excellent SRT parsing library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework

---

<p align="center">
  Made with ❤️ by <a href="https://www.bbioon.com">Ahmad Wael</a>
</p>
