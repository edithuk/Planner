# Firebase Setup Guide

If Save is not working, follow these steps in **Firebase Console** ([console.firebase.google.com](https://console.firebase.google.com)):

## 1. Create Firestore Database

1. Go to your project → **Build** → **Firestore Database**
2. If you see **"Create database"**, click it
3. Choose **Start in production mode** (we'll add rules next)
4. Pick a region (e.g. `us-central1`) and click **Enable**
5. Wait for the database to be created

## 2. Deploy Firestore Rules

1. In Firestore → **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /trips/{tripDoc} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click **Publish**

## 3. Enable Authentication

1. Go to **Build** → **Authentication**
2. Click **Get started** if prompted
3. Under **Sign-in method**, enable:
   - **Email/Password**
   - **Google** (optional)

## 4. Verify Your .env

Ensure your `.env` has the correct Firebase config from **Project settings** → **Your apps**:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 5. Deploy Rules via CLI (Alternative)

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## Common Errors

| Error | Fix |
|-------|-----|
| `permission-denied` | Rules not deployed or wrong. Re-publish rules from step 2. |
| `not-found` | Firestore database not created. Complete step 1. |
| `unauthenticated` | User not logged in. Sign in before saving. |
