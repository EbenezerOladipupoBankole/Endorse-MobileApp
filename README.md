# Endorse Mobile

The Endorse mobile app for iOS, Android and web. Users can create, send and e-sign documents, scan paper documents, build reusable templates and issue invoices. It is built with Expo (React Native) and Firebase.

## Tech stack

- **Expo SDK 57** / React Native 0.86 with **Expo Router** (file-based routing, typed routes)
- **Firebase**: Authentication, Cloud Firestore, Cloud Storage and Cloud Functions (v2)
- **TypeScript** throughout
- `pdf-lib` and `expo-print` to generate PDFs; `react-native-signature-canvas` to capture signatures

## Getting started

### Prerequisites

- Node.js 22 or later, and npm
- The Expo Go app on your phone, or an iOS Simulator or Android emulator
- Firebase CLI (`npm i -g firebase-tools`), only needed to deploy rules or functions

### Setup

```bash
npm install
cp .env.example .env   # then fill in the values (see below)
npm start
```

In the Expo terminal, press `i` for the iOS Simulator, `a` for Android or `w` for web, or scan the QR code with Expo Go.

### Environment variables

Expo exposes every variable prefixed with `EXPO_PUBLIC_` to the app. Copy `.env.example` to `.env` and set:

| Variable | Where to find it |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase console → Project settings → Your apps → Web app config |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Cloud → APIs & Services → Credentials |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Same as above (Android OAuth client) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Same as above (iOS OAuth client) |

You only need the Google client IDs for Google sign-in on native. Google sign-in on web works without them.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `android` / `web` | Start the dev server and open that platform |
| `npm run lint` | Run ESLint (`eslint-config-expo`) |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

## Project structure

```
app/                 Screens (Expo Router)
  (auth)/            Welcome, login, sign-up, OTP, signature setup
  (tabs)/            Main tab bar: home dashboard, templates, create, ...
  document/[id].tsx  Document details
  sign/[id].tsx      Signing flow
  template/[id].tsx  Template editor
  invoice/new.tsx    Invoice builder
  send.tsx           Send a document for signature
  scanner.tsx        Document scanner (camera)
components/          UI components, grouped by feature (auth, dashboard, document, ...)
context/             React context (AuthContext: Firebase user and profile)
hooks/               Shared hooks
lib/                 Business logic and Firebase access
  firebase.ts        Firebase app, auth, Firestore, Storage and Functions setup
  documents/         Document API (Firestore and Cloud Functions)
  invoices/          Invoice API and currency data
  templates/         Template API and starter templates
  pdf/               PDF generation (agreements, invoices, signed copies)
theme/, constants/   Design tokens and colors
types/               Shared TypeScript types
functions/           Firebase Cloud Functions (signing, reminders, sealing)
firestore.rules      Firestore security rules
storage.rules        Cloud Storage security rules
```

## Firebase backend

The app shares a Firebase project with the Endorse web app. The mobile app keeps its data in its own collections (`mobile_documents`, `templates`, `invoices`, `clients`) and shares only the `users/{uid}` profiles with the web app.

### Cloud Functions

The functions live in `functions/src/index.ts` and are deployed as the `mobile` codebase:

- `mobileSignDocument`, `mobileDeclineDocument`, `mobileMarkViewed`: signer actions
- `mobileRemindSigners`, `mobileVoidDocument`: sender actions
- `mobileSealDocument`: Firestore trigger that seals a document once everyone has signed

```bash
cd functions && npm install && npm run build
firebase deploy --only functions:mobile
```

### Security rules

```bash
firebase deploy --only firestore:rules,storage
```

To run everything locally with the emulators:

```bash
cd functions && npm run serve
```

## Building with EAS

`eas.json` defines three build profiles:

```bash
eas build --profile development   # dev client, internal distribution
eas build --profile preview       # Android APK for testers
eas build --profile production
```

## Troubleshooting

- **`auth/network-request-failed` / "client is offline"**: the device cannot reach Google's servers. Check the simulator or device's network, any VPN or proxy, and the device clock. The app reconnects on its own when the network returns.
- **Environment changes not picked up**: restart Expo and clear the cache with `npx expo start -c`.
