GYM WORKOUT TRACKER PWA
=======================

OVERVIEW
--------
A complete Progressive Web App for tracking gym workouts across a 4-day program with weight persistence using IndexedDB.

FILES INCLUDED
--------------
1. index.html (62 KB)
   - Main app with all CSS and JavaScript inline
   - Responsive dark theme design with Barlow font family
   - Full workout data for 4-day program hardcoded
   - Features:
     * Tab navigation between Day A/B/C/D
     * Weight input fields with history tracking
     * Date selector for reviewing past sessions
     * Weekly schedule indicator (Mon-Sun)
     * Auto-select today's workout
     * IndexedDB persistence for all weights
     * Save button with toast notifications
     * Weight history expansion (last 4 entries per exercise)
     * Progression plan for each day
     * Nutrition and active rest day info

2. manifest.json (596 bytes)
   - Standard PWA manifest
   - App name: "Gym Program" / short name: "Gym"
   - Icons: 192x192 and 512x512
   - Display mode: standalone (full-screen app)
   - Theme color: #0f0f0f (dark background)

3. sw.js (2.7 KB)
   - Service Worker with cache-first strategy
   - Version: 1.0.0 (change to force update)
   - Caches all assets on install
   - Falls back to network when cache unavailable
   - Handles offline functionality

4. icon-192.png (801 bytes)
   - App icon 192x192 pixels
   - Dumbbell design in accent color (#c8f135) on dark background

5. icon-512.png (3.8 KB)
   - App icon 512x512 pixels
   - Same dumbbell design at larger size

DESIGN COLORS
-------------
Background: #0f0f0f
Cards: #191919
Border: #2a2a2a
Accent (primary): #c8f135 (bright green-yellow)
Day A (Upper Push): #f17b2c (orange)
Day B (Lower Quad): #a78bfa (purple)
Day C (Upper Pull): #4fa8e8 (blue)
Day D (Lower Hinge): #f472b6 (pink)

FONTS
-----
Headers: Barlow Condensed (Google Fonts)
Body: Barlow (Google Fonts)
Numbers: Courier New (monospace, for weights)

FEATURES IMPLEMENTED
--------------------
✓ Tab-based navigation for 4 days
✓ Weight input fields for tracking
✓ IndexedDB persistence (no localStorage)
✓ Date selector (defaults to today)
✓ Automatic date limiting to today
✓ Weekly schedule display
✓ Auto-select today's workout based on day of week
✓ Weight history (last 4 entries expandable)
✓ Placeholder text showing last weight used
✓ Save workout button with success toast
✓ Progression guide for each day
✓ Nutrition guidelines
✓ Active rest day recommendations
✓ Fully offline capable once cached
✓ PWA meta tags in HTML head
✓ Service Worker for offline support
✓ Responsive design for mobile/tablet

WORKOUT STRUCTURE
-----------------
Day A - Upper Push (Monday)
  - 5 min warmup + exercises
  - Barbell bench press (compound)
  - 4 accessories + finisher
  - ~65 minutes

Day B - Lower Quad (Tuesday)
  - 5 min warmup + exercises
  - Barbell back squat (compound)
  - 4 accessories + finisher
  - ~65 minutes

Day C - Upper Pull (Thursday)
  - 5 min warmup + exercises
  - Barbell row (compound)
  - 4 accessories + finisher
  - ~65 minutes

Day D - Lower Hinge (Friday)
  - 5 min warmup + exercises
  - Romanian deadlift (compound)
  - 4 accessories + finisher
  - ~65 minutes

HOW TO USE
----------
1. Open index.html in a modern browser
2. Add to home screen (PWA install prompt will appear)
3. Select a date (defaults to today)
4. Auto-selects workout for day of week
5. Enter weights for each exercise
6. Click "Save Day X Workout" to persist
7. View weight history by clicking "history" button
8. Works offline after initial load

BROWSER SUPPORT
---------------
- Chrome/Edge 51+
- Firefox 44+
- Safari 15+
- Android Chrome
- Mobile Safari (iOS 15+)

DATABASE
--------
- IndexedDB store: "workouts"
- Key format: "YYYY-MM-DD_exercise-name"
- Stores: date, exercise, weight (lbs), timestamp
- Index: dateExercise

SERVICE WORKER
--------------
- Auto-registers on page load
- Caches all assets on install
- Serves from cache first, falls back to network
- Version-based cache busting (change CACHE_VERSION in sw.js)

TO UPDATE CACHE
---------------
Change CACHE_VERSION in sw.js (line 4) from 'gym-app-v1.0.0' to any new version.
All users will get a notification to update their cache.

INSTALLATION
------------
No build process needed. Just serve the files via HTTP/HTTPS.
For PWA to work, must be served over HTTPS (except localhost).

Example with Python:
  python3 -m http.server 8000

Then open: http://localhost:8000/index.html

OFFLINE MODE
------------
All assets are cached on first visit. After caching:
- Can open app without internet
- Can read all workout data
- Can enter new weights (stored locally)
- Data syncs once back online (if web DB implemented)

FUTURE ENHANCEMENTS
-------------------
- Cloud sync (Firebase/Supabase)
- Export to CSV
- Progress charts
- 1RM calculator
- Rest day workouts
- Custom exercises
- Sharing capabilities
- Dark/light theme toggle
