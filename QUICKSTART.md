# Gym Workout Tracker PWA - Quick Start

## What You Have

A complete, production-ready Progressive Web App for tracking your 4-day gym program with automatic weight persistence.

## 5-Minute Setup

### Option 1: Local Testing (Python)
```bash
cd /sessions/great-stoic-ptolemy/mnt/gym/gym-app
python3 -m http.server 8000
```
Open: `http://localhost:8000`

### Option 2: Node.js
```bash
npx http-server /sessions/great-stoic-ptolemy/mnt/gym/gym-app
```

### Option 3: VS Code Live Server
- Right-click index.html → "Open with Live Server"

## First Use

1. **Open the app** in your browser
2. **Install as PWA** - Look for "Install" prompt in browser (Chrome/Edge)
   - Or: Menu → More → Install app (Edge)
   - Or: Share → Add to Home Screen (iOS)
3. **Today's workout auto-loads** based on day of week
   - Monday → Day A (Upper Push)
   - Tuesday → Day B (Lower Quad)
   - Thursday → Day C (Upper Pull)
   - Friday → Day D (Lower Hinge)
4. **Enter weights** in the input fields
5. **Click "Save Day X Workout"** to save to IndexedDB

## Key Features

### Weight Tracking
- Enter weight for each exercise
- Auto-loads previous weight as placeholder
- Expandable history shows last 4 weights
- All data stored in browser's IndexedDB (no server needed)

### Date Selection
- Defaults to today
- Can select past dates to review/edit old sessions
- Date picker limited to today (can't log future workouts)

### Auto-Select
- Opens correct workout based on calendar day
- Monday = Day A, Tuesday = Day B, etc.
- Falls back to Day A on other days

### Offline Support
- After first load, works completely offline
- All CSS/JS/fonts cached by Service Worker
- Data always stored locally on device

## File Structure

```
gym-app/
├── index.html          (Main app - all CSS & JS inline)
├── manifest.json       (PWA configuration)
├── sw.js              (Service Worker - offline support)
├── icon-192.png       (App icon)
├── icon-512.png       (App icon - large)
├── README.txt         (Full documentation)
└── QUICKSTART.md      (This file)
```

## Database Structure

**Storage:** IndexedDB (persistent, survives browser restart)

**Key Format:** `YYYY-MM-DD_exercise-name`

**Example entries:**
```
2026-04-10_Barbell bench press → 225
2026-04-10_Incline dumbbell press → 85
2026-04-09_Barbell back squat → 315
```

## Troubleshooting

### Data Not Saving?
- Check browser console (F12) for errors
- Ensure you click "Save Day X Workout" button
- Check IndexedDB in Dev Tools → Application → IndexedDB → GymTrackerDB

### Service Worker Not Caching?
- First visit loads from network (normal)
- Second visit loads from cache
- Refresh once fully loaded for best performance

### Icons Not Showing?
- Clear browser cache (Ctrl+Shift+Del)
- Or change version in sw.js line 4: `gym-app-v1.0.1`

### Weights Showing Different Value?
- That's the placeholder text from last use!
- Your actual saved weight will be loaded once date changes
- Enter new weight and save to override

## Customization

### Change Colors
Edit line 13-22 in `index.html` (CSS variables):
```css
--accent: #c8f135  /* Main highlight color */
--push: #f17b2c    /* Day A color */
--lower-q: #a78bfa /* Day B color */
--pull: #4fa8e8    /* Day C color */
--lower-h: #f472b6 /* Day D color */
```

### Force Cache Update
In `sw.js` line 4, change version:
```javascript
const CACHE_VERSION = 'gym-app-v1.0.1';  // Was v1.0.0
```

### Add Exercise
1. Find the day in `index.html`
2. Add table row in that day's section:
```html
<tr>
    <td class="exercise-name">New Exercise</td>
    <td class="sets-reps">3 x 8-10</td>
    <td class="rest-time">90s</td>
    <td class="weight-input-cell">
        <input type="number" class="weight-input" data-exercise="New Exercise" placeholder="lbs">
    </td>
</tr>
```

## Browser Compatibility

- ✓ Chrome 51+
- ✓ Edge 51+
- ✓ Firefox 44+
- ✓ Safari 15+
- ✓ Android Chrome/Firefox
- ✓ iOS Safari 15+

## Deployment

For production (HTTPS required for PWA):

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### GitHub Pages
Push to repo, enable Pages in settings

### Your Own Server
```bash
scp -r gym-app/* user@example.com:/var/www/html/
```

## Support Files

- **README.txt** - Full feature documentation
- **sw.js** - Service Worker (handles offline caching)
- **manifest.json** - PWA configuration (install behavior)

## Questions?

All code is inline in `index.html`. Check comments in:
- `<style>` section for CSS
- `<script>` section for JavaScript logic

Database operations documented with function comments.

---

Happy lifting! Track your progress, stay consistent.
