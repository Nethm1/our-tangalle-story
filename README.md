# Our Tangalle Story 💛

> A magical interactive anniversary storybook game celebrating 3 years of love.

Built with pure HTML5 · CSS3 · Vanilla JavaScript — no frameworks, no dependencies.

---

## 🌟 Live Demo

Deploy on GitHub Pages and share the link with your love.

---

## 📁 Project Structure

```
OurTangalleStory/
├── index.html          ← Main game file
├── style.css           ← All styles & animations
├── script.js           ← Game logic & interactions
├── config.js           ← Edit names, dates, messages here
├── sw.js               ← Service worker (offline support)
├── README.md
└── assets/
    ├── images/         ← Place your photos here
    │   ├── memory1.jpg
    │   ├── memory2.jpg
    │   ├── memory3.jpg
    │   ├── memory4.jpg
    │   ├── memory5.jpg
    │   ├── memory6.jpg
    │   └── final-photo.jpg   ← Couple photo for final chapter
    ├── music/
    │   └── ocean-piano.mp3   ← Background music
    └── icons/
```

---

## 🖼️ How to Replace Photos

1. Open the `assets/images/` folder
2. Add your photos with these exact filenames:
   - `memory1.jpg` → `memory6.jpg` for the scrapbook gallery
   - `final-photo.jpg` for the final chapter frame
3. Any standard JPEG or PNG works. Recommended size: **800×600px** or similar.
4. The game automatically shows emoji placeholders if photos are missing — so it works without photos too.

---

## 🎵 How to Add Music

1. Find a soft piano + ocean waves track (royalty-free sources: Free Music Archive, pixabay.com/music)
2. Export/download as **MP3**
3. Rename it to `ocean-piano.mp3`
4. Place it in `assets/music/`
5. The music button remembers the user's preference between visits

To change the music file path, edit `config.js`:
```js
music: {
  src: "assets/music/your-filename.mp3",
  ...
}
```

---

## ✏️ How to Customize Names & Messages

Open `config.js` and edit:

```js
const storyConfig = {
  names: {
    girl: "Her Name",       // ← Change this
    boy:  "His Name"        // ← Change this
  },
  date: "July 29, 2026",   // ← Your special date
  messages: {
    home: "Your custom home message",
    finalLetter: `Your personal love letter here...`
  },
  photos: [
    "memory1.jpg",          // ← Add/remove photo filenames
    ...
  ]
};
```

---

## 🚀 Deploy on GitHub Pages

### Method 1 — Simple drag & drop

1. Create a new **public** repository on GitHub (e.g. `our-tangalle-story`)
2. Upload all files keeping the folder structure intact
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch and `/ (root)`
5. Click **Save**
6. Your site will be live at: `https://yourusername.github.io/our-tangalle-story/`

### Method 2 — Git CLI

```bash
git init
git add .
git commit -m "💛 Our Tangalle Story"
git remote add origin https://github.com/yourusername/our-tangalle-story.git
git push -u origin main
```
Then enable Pages in repository Settings.

---

## 🎮 Game Chapters

| # | Chapter | Game Type | Unlock |
|---|---------|-----------|--------|
| 1 | The Bus Ride 🚌 | Tap the saved seat | 💛 Saved Seat |
| 2 | The Blessed Restaurant 🍚 | Drag incense to couple | ✨ Blessed Together |
| 3 | The Temple 🙏 | Arrange prayer flowers | 🙏 Temple Blessing |
| 4 | Tangalle Beach 🌊 | Photo memory match | 📸 Beach Memories |
| 5 | Juices by the Beach 🍋🥑 | Find correct drinks | 🍋🥑 Juice Date |
| 6 | Sharing Ice Cream 🍦 | Move hands together | 🍦 Sweetest Memory |
| 7 | The Yellow Dress 💛 | Find the right dress | 💛 Yellow Dress |
| 8 | The Journey Home 🌙 | Tap heartbeat rhythm | 🤍💋 Kiss & Shoulder |

---

## 🎨 Color Theme

| Variable | Hex | Use |
|----------|-----|-----|
| Gold | `#F7D774` | Primary accent |
| Cream | `#FFF8E8` | Background |
| Yellow | `#FFD966` | Highlights |
| Sand | `#E8CFA4` | Secondary |

---

## ♿ Accessibility

- Full keyboard navigation (Arrow keys to move between chapters)
- ARIA labels on all interactive elements
- Focus-visible outlines
- `prefers-reduced-motion` support
- Screen reader friendly live regions

---

## 📱 Mobile Support

- Mobile-first responsive design
- Touch swipe to navigate chapters
- Touch drag for incense game
- 44px+ tap targets throughout
- Tested on iPhone and Android viewports

---

## 💛 Made with Love

*"Three years have passed, yet every memory still lives inside my heart."*

Happy Anniversary. 🌊💛
