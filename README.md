# Trip Planner App

A web-based trip planner with multiple trips, draggable cards, Google Maps/Places integration, AI chatbot assistant, and Firebase cloud sync.

## Features

- **Multiple trips** – Plan several trips at once; add, delete, or clone trips
- **Planning flow** – Suggested for Me → Want to Visit → Confirmed → Day Plan
- **Sections** – Suggested for Me (places others recommended), Want to Visit (wishlist), Confirmed (final plan), Day sections with instructions per place
- **Google Places** – Search and add places with autocomplete; numbered pins on map for all sections
- **Drag and drop** – Move cards between sections with visual feedback; reorder within sections
- **Recommended for** – Optional field on places (e.g., "Best sunset views")
- **Day sections** – Add, rename, and remove day sections (Day 1, Beach Day, etc.); each place has an instructions field
- **AI Trip Assistant** – Chatbot for place info, suggestions, and itinerary creation (Groq or Gemini)
- **Itinerary creation** – Ask the chatbot to create an itinerary from your places; it prompts for entry/exit points and timing, then adds places to day sections (without removing them from source sections)
- **PDF export** – Download trip plans as PDF
- **Cloud sync** – Firebase Firestore for persistence and cross-device sync
- **Save button** – Click "Save" to persist your trips to the database (manual save)
- **Responsive** – Works on desktop and mobile browsers (including iOS Safari)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

**Google Maps** (required for Places and Map):

- Create a project in [Google Cloud Console](https://console.cloud.google.com/)
- Enable **Maps JavaScript API** and **Places API**
- Create an API key and add to `VITE_GOOGLE_MAPS_API_KEY`
- For chatbot place lookups, also set `GOOGLE_PLACES_API_KEY` (or reuse `VITE_GOOGLE_MAPS_API_KEY`)

**Chatbot** (required for AI assistant – use at least one):

- **Groq** (free): Get a key at [console.groq.com](https://console.groq.com) → add `GROQ_API_KEY`
- **Gemini**: Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey) → add `GEMINI_API_KEY` (optional: `GEMINI_MODEL=gemini-2.5-flash`)
- If both are set, Groq is used by default. Set `AI_PROVIDER=gemini` to prefer Gemini.

**Firebase** (required for auth and sync):

- Create a project in [Firebase Console](https://console.firebase.google.com/)
- Enable **Authentication** (Google + Email/Password)
- Create a **Firestore** database
- Add a web app and copy the config into `.env`:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

**Firestore security rules** (Firebase Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Run the app

```bash
npm run dev
```

This starts both the Vite frontend and the chat API server. Open [http://localhost:5173](http://localhost:5173).

- **Frontend**: http://localhost:5173
- **API health check**: http://localhost:5173/health or http://localhost:5173/api/health

**Scripts:**

- `npm run dev` – Vite + chat API (full stack)
- `npm run dev:vite` – Vite only (no chatbot)
- `npm run build` – Production build
- `npm run preview` – Preview production build

### 4. Build for production

```bash
npm run build
npm run preview
```

For deployment (e.g. Vercel), the `api/` folder is used as serverless functions. Set `GROQ_API_KEY` or `GEMINI_API_KEY` in your deployment environment.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- Firebase (Auth, Firestore)
- @dnd-kit (drag and drop)
- Google Maps JavaScript API
- Groq / Gemini (AI chatbot)
- react-markdown + remark-gfm (chatbot formatting)
- jsPDF (PDF export)
