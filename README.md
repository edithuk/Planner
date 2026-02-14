# Trip Planner App

A web-based trip planner with multiple trips, draggable cards, Google Maps/Places integration, and Firebase cloud sync.

## Features

- **Multiple trips** – Plan several trips at once in separate sections
- **Sections** – Wishlist, To Do, Day planning, Recommended Places
- **Google Places** – Search and add places with autocomplete; pins appear on map for To Do items
- **Drag and drop** – Move cards between any sections
- **Recommended for** – Optional field on Recommended Places (e.g., "Best sunset views")
- **Day sections** – Add, rename, and remove day sections (Day 1, Beach Day, etc.)
- **Cloud sync** – Firebase Firestore for persistence and cross-device sync
- **Save button** – Click "Save" to persist your trips to the database (manual save)

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

Open [http://localhost:5173](http://localhost:5173).

### 4. Build for production

```bash
npm run build
npm run preview
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- Firebase (Auth, Firestore)
- @dnd-kit (drag and drop)
- Google Maps JavaScript API
