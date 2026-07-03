# Handoff: Endorse — Auth Flow (Welcome / Sign up / Log in / OTP / Signature)

## Overview
"Endorse" is a corporate, trustworthy **e-signature** app onboarding + auth flow.
Six screens: **Welcome/onboarding** (3-step carousel covering **scan → manage → sign**),
**Sign up**, **Log in**, **OTP email verification**, a **signature draw pad**, and a
**Success** confirmation. Endorse is a full document platform — scan, organize, and sign
— not e-sign alone. Brand palette is yellow `#FFC72C` + navy/light blue.

## About the Design Files
The files here are a **design reference built in web React (HTML/CSS)** — a working
prototype of the intended look and behavior, **not** production code to ship as-is.
Recreate these designs in **Expo / React Native**, using your app's existing
components, navigation, forms, and auth. `Endorse.jsx` runs on the web so you can
compare pixel-for-pixel while you port it.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, shadows, and interactions are final.
Replace the `<Phone>` device bezel with a real screen wrapper (`SafeAreaView`) and wire
the auth/OTP/signature handlers to your backend.

## Files
- `Endorse.jsx` — full flow as one web-React component (all 6 screens + validation +
  OTP + canvas signature). Inline styles, no deps beyond React. Exposes `onComplete(mode)`.
- `reference/Endorse.dc.html` — the original interactive prototype (open in a browser).

---

## Design Tokens
```
Backgrounds
  navy (welcome/success)   #0E1D34    hero gradient #1D3358 → #0E1D34
  cloud (forms/otp/sign)   #F5F8FC
  white / field            #FFFFFF
  icon chip (blue)         #EAF2FC     icon chip (yellow) #FFF4D6

Text
  ink / navy ink           #14213D    (also text on yellow)
  ink soft (secondary)     #5C6B84
  field label              #45536B
  on-navy body             #DCE7F5

Brand / accent
  yellow (primary CTA)     #FFC72C     text #14213D
  blue (links/active)      #2E68B0

Lines / borders
  hairline                 #E3EAF3
  input border (rest)      #DDE5EF
  input border (error)     #E39C93
  error text               #C0392B

Password strength          weak #D9534F · fair #E0A82E · strong #2E9E5B

Typography
  Display  Sora                600 wt, letter-spacing -0.4/-0.5
  UI       Plus Jakarta Sans   400/500/600/700

Radii    input 13 · button 15-16 · social 14 · hero card 28 · OTP cell 13 · phone screen 37
Field height 52 · button height 54-56 · OTP cell 60 · screen padding 26px horizontal
Shadow   primary btn 0 10px 24px rgba(255,199,44,.32)
```

Load fonts (web):
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Screens

### 1. Welcome / Onboarding — white background
Each slide's hero is a **static illustration** (built from HTML/CSS, non-interactive)
inside a rounded navy panel, with a dark bottom-up gradient scrim so the headline stays
legible and a small yellow accent badge (Scan / Organize / Signed) top-right:
- **Scan** — stacked document cards with yellow corner brackets + a glowing scan line.
- **Manage** — a mini file-list app preview: search bar + rows with a file icon, name
  lines, and Signed / Draft / Sent status tags.
- **Sign** — a document with a signature squiggle and a dashed yellow "signed" stamp.

Screen background is white; the panel holds the illustration. Uppercase yellow kicker +
Sora headline (29px, white on scrim). 3 progress bars (active widens to 26px, yellow).
Steps 0–1: `Skip` + `Continue →`. Final step: **Create account** (yellow) +
**I already have an account** (outline).
Slide copy: (1) "Scan any document with your camera." (2) "Organize and manage every file."
(3) "Sign, send and track — instantly."

### 2. Sign up — cloud background
Back button, Sora H1, Google/Apple social buttons, divider, then **Full name / Email /
Password** (eye toggle + 3-segment strength meter) and a **Terms + e-Sign Consent**
checkbox. Primary **Create account** → on valid submit shows a spinner (~1.1s) then goes
to **OTP**.

### 3. Log in — cloud background
Same header/social pattern. **Email** + **Password** (with **Forgot?** link). Primary
**Log in** → spinner → **Success** directly (login skips OTP). Footer link to Sign up.

### 4. OTP verification — cloud background
Blue mail icon chip. Six single-char numeric inputs: typing auto-advances to the next,
Backspace on an empty box moves back; filled boxes turn blue. Resend has a 30s countdown
("Resend available in Ns") then a **Resend code** link (clears the inputs, restarts timer).
**Verify & continue** requires all 6 digits, then spinner → **Signature**.

### 5. Signature pad — cloud background
Yellow squiggle icon chip. A dashed-border card with a baseline + "✕ Sign above the line"
hint holds a **draw canvas** (finger/pointer). **Clear** wipes it; **Save signature**
requires a non-empty drawing then goes to Success; **I'll do this later** skips.

### 6. Success — navy background
Yellow gradient check circle, Sora H1 ("You're all set!" from signup / "Welcome back!"
from login), subhead, and **Go to dashboard** → fires `onComplete(mode)`.

---

## Interactions & Behavior
- **Flow:** `welcome → signup → otp → sign → done`. `welcome → login → done`. Social
  buttons jump straight to `done` (wire to real OAuth).
- **Validation (on blur + on submit):** name required; email required + regex
  `^[^\s@]+@[^\s@]+\.[^\s@]+$`; signup password ≥ 8 chars; login password required;
  terms must be checked. Errors show only after touch/submit; invalid inputs get the
  `#E39C93` border.
- **Password strength:** +1 len ≥ 8, +1 mixed case, +1 digit/symbol → Weak/Fair/Strong.
- **OTP:** 6 cells, auto-advance + backspace nav, 30s resend countdown.
- **Signature:** freehand draw; "Save" blocked until something is drawn.
- **Submit:** simulated `setTimeout` delays — replace with real API calls; route on success.

## State Management
```
screen     'welcome'|'signup'|'login'|'otp'|'sign'|'done'
step       0..2                (onboarding)
showPw     bool
submitting bool                (spinner / disable)
doneFrom   'signup'|'login'    (success headline + subcopy)
su         { name,email,pass,terms } + touched + submitted
li         { email,pass }            + touched + submitted
otp        string[6]  + submitted + resendIn (seconds)
hasSig     bool        (canvas has ink)   sigTouched bool
```

---

## Expo / React Native handoff

`Endorse.jsx` is **web** React — translate it, don't copy it.

**Primitive mapping**
- `div → View`, text → `Text`, buttons → `Pressable`, inputs → `TextInput`
  (`keyboardType="email-address"` / `"number-pad"`, `secureTextEntry` for password).
- Inline CSS → `StyleSheet.create`. RN differences: no `boxShadow` (use
  `shadowColor/shadowOffset/shadowOpacity/shadowRadius` + `elevation`); no CSS gradients
  (use `expo-linear-gradient`); `letterSpacing` is a number; no `cursor`; percentage
  line-height not supported (use a number).
- All SVG icons (status bar, chevrons, eye, mail, check, squiggle, Google, Apple) →
  `react-native-svg`.
- Drop the `<Phone>` bezel; wrap each screen in `SafeAreaView`.

**Screen-specific**
- **Fonts:** `@expo-google-fonts/sora` + `@expo-google-fonts/plus-jakarta-sans` with
  `useFonts`, gate first render on `fontsLoaded`.
- **Navigation:** React Navigation native stack. Onboarding steps are local state (not
  routes); each auth screen is a route. Header back button ← the custom circle button.
- **OTP:** array of 6 `TextInput`s with a `refs` array. `onChangeText`: keep last digit,
  advance focus; `onKeyPress` for `Backspace` to go back. `keyboardType="number-pad"`.
  (Optional: `expo-clipboard` + iOS `textContentType="oneTimeCode"` for SMS autofill.)
- **Signature:** don't use `<canvas>`. Use **`react-native-signature-canvas`** (WebView
  based) OR draw an SVG path with `PanResponder` + `react-native-svg` `Path` (accumulate
  points into a `d` string; "Save" exports the path/PNG). "Save" stays disabled until the
  path is non-empty.
- **Keyboard:** wrap forms in `KeyboardAvoidingView` + `ScrollView`
  (`keyboardShouldPersistTaps="handled"`).
- **Auth:** replace the simulated timeouts with your real calls — sign-up, `verifyOtp`,
  `login`, and social OAuth via `expo-auth-session` (use official Google/Apple sign-in;
  Apple sign-in via `expo-apple-authentication`). Persist the saved signature; route to
  the dashboard from `onComplete`.

**Likely dependencies:** `expo-linear-gradient`, `react-native-svg`, the two font
packages, `@react-navigation/native` + native-stack, and a signature lib
(`react-native-signature-canvas`) or `react-native-svg` for the pad.

## Assets
- No raster assets — the onboarding "document" and signature squiggle are inline
  SVG/markup. Icons are inline SVG in the file.
- Google/Apple marks are placeholders for the social buttons — use each platform's
  official, brand-compliant sign-in assets in production.
