# Kalon Mobile App

Kalon runs as:
1. **Installable PWA** — Add to home screen from Chrome on Android/iPhone
2. **Native Android APK** — Built with Capacitor

---

## Option 1: Install as PWA (Easiest)

1. Start backend and frontend on your PC
2. Open the site on your phone browser (same Wi‑Fi): `http://YOUR_PC_IP:5173`
3. Chrome → **Menu (⋮)** → **Install app** / **Add to Home screen**
4. Kalon opens full-screen like a native app

---

## Option 2: Build Android APK

### Requirements
- [Node.js](https://nodejs.org)
- [Android Studio](https://developer.android.com/studio) (with Android SDK)
- Java JDK 17+

### Steps

```powershell
cd "E:\Google Downloads\kalon\frontend"

# Install dependencies
npm install

# Build web app + sync to Android
npm run app:build

# Open in Android Studio
npm run cap:android
```

In **Android Studio**:
1. Wait for Gradle sync
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Copy APK to phone and install

### Run on emulator or device from CLI

```powershell
npm run cap:run:android
```

---

## Connect app to backend

The mobile app must reach your API server.

### Android Emulator
Uses `10.0.2.2` automatically (maps to your PC localhost).

### Real phone (same Wi‑Fi)
1. Find your PC IP: `ipconfig` → look for IPv4 (e.g. `192.168.1.5`)
2. Create `frontend/.env.mobile`:

```env
VITE_DEV_HOST=192.168.1.5
VITE_API_URL=http://192.168.1.5:5000/api
VITE_SOCKET_URL=http://192.168.1.5:5000
```

3. Rebuild: `npm run app:build`

4. Start backend (must listen on network):
```powershell
cd "E:\Google Downloads\kalon\backend"
npm run dev
```

5. Allow port **5000** in Windows Firewall if needed.

---

## App features on mobile

| Feature | Mobile support |
|---------|----------------|
| OTP Login | ✅ |
| GPS Location | ✅ Native via Capacitor |
| Real-time tracking | ✅ Socket.io |
| Back button | ✅ Android back navigates / exits |
| Offline shell | ✅ PWA caches UI |
| Splash screen | ✅ Blue Kalon splash |
| Safe area (notch) | ✅ |

---

## Production deployment

For a real published app:
1. Deploy backend to a cloud server (Railway, Render, AWS)
2. Set `VITE_API_URL=https://api.yourdomain.com/api` before build
3. Use HTTPS (required for production PWA)
4. Sign APK for Google Play with a release keystore

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API not connecting on phone | Check PC IP, firewall, same Wi‑Fi |
| White screen in APK | Run `npm run build` then `npx cap sync` |
| Location not working | Grant location permission in phone settings |
| OTP not loading | Ensure backend is running on port 5000 |
