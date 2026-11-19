# Building Fajr Garden on real devices

The Fajr alarm only works in a native build (it uses AlarmKit on iOS and AlarmManager on
Android), so it cannot be tried in Expo Go or in the web preview. Builds run in the cloud
with EAS Build; no Xcode or Android Studio is needed.

## Android (installable APK)

Run these from the `fajr-garden/` folder on your own computer:

```sh
npx eas-cli@latest login            # once, with your Expo account
npx eas-cli@latest init             # once: links the project and writes extra.eas.projectId
npx eas-cli@latest build --platform android --profile preview
```

When the build finishes, EAS shows a QR code and a link: open it on the Android phone to
install the APK. Commit the `app.json` change made by `eas init`.

## iOS (needs an Apple Developer account, $99/year)

```sh
npx eas-cli@latest device:create    # register the iPhone (opens a page on the phone)
npx eas-cli@latest build --platform ios --profile preview
```

EAS asks for your Apple account once to create the certificates. The alarm needs iOS 26
or later.

## What to test (PRD §14, device matrix)

1. Settings → Fajr alarm → on. Accept the notification permission (Android 13+).
2. Settings → "Test the alarm (rings in 10 s)", then lock the phone. Expected: it rings
   with the sound on the alarm stream, vibrates, and the mission screen appears over the
   lock screen.
3. Same test with the phone in silent mode and in Do Not Disturb.
4. Stop the alarm from the notification without doing the mission: it must ring again
   2 minutes later (follow-up chain). Then complete the mission: everything stops.
5. Schedule the alarm, restart the phone before it rings: it must still ring.
6. Samsung / Xiaomi / Oppo: repeat test 2 with battery optimisation on. If it fails, note
   the model and Android version.
7. Android 14+: Settings → Apps → Fajr Garden → "Full-screen notifications" off, then
   test 2 again: the app must show the warning and the button to fix it.
