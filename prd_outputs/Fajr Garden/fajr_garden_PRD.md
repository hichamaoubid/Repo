# Fajr Garden — Product Requirements Document

**Version:** 1.3
**Date:** 2026-11-19
**Author:** PRD Generator
**Status:** Draft
**Scope:** MVP (v1.0), iOS and Android simultaneous launch

---

## 1. Executive Summary

Fajr Garden is a family app for iOS and Android that helps Muslims, children aged 6–12 and their parents, build a consistent prayer habit anchored on Fajr. v1 combines three things no competitor offers together: a Fajr alarm that cannot be dismissed without a physical "wake-up mission" verified on-device by the camera, a Salah coach that uses on-device pose detection to teach children the positions of prayer, and accurate prayer times with qibla. Consistency, never worship itself, is rewarded through a private family garden that grows with each day kept. The app is ad-free, sells no data, processes all camera frames on the phone, and earns revenue through a family subscription. The expected outcome for the first 12 months is 250k installs, 20% D30 retention and a 4% install-to-paid conversion.

---

## 2. Problem Statement

**Current state:** Muslim families juggle a prayer-times utility (Muslim Pro, Pillars, Athan), a separate Quran app, and generic alarm clocks. The market leader is ad-heavy (about 74% of revenue from ads, by third-party estimate) and still carries the reputational damage of its 2020 location-data scandal. Fajr-specific alarms (Subhi, Fajr O'Clock, Fajr Pulse) exist but are single-purpose. Kids' apps (Tarteel NOOR, Noorani Qaida apps) teach Quran but not salah, and nothing connects the parent's habit with the child's.

**Pain points:**
1. Waking up for Fajr is the hardest daily habit. Standard alarms are snoozed or dismissed half-asleep.
2. Parents have no engaging, trustworthy tool to teach children the movements and order of salah. YouTube is distracting, and books aren't interactive.
3. Existing gamified apps either ignore the religious sensitivity (public leaderboards of worship, points for prayers) or are visually dated.
4. Privacy-conscious families distrust Islamic apps after past data-selling incidents, especially for anything involving cameras and children.
5. Families pay for, or put up with ads in, three or four separate apps.

**Impact:** Missed Fajr is the most frequently cited struggle in Muslim self-improvement communities. Families lack a structured way to pass salah on between generations. The commercial opening is a privacy-first, subscription-funded category leader in a market whose largest player depends on ads.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (12 months post-launch) | Measurement Method |
|------|--------|-------------------------------|--------------------|
| Help users wake for Fajr | Fajr mission completion rate (missions completed ÷ alarms fired) | ≥ 70% | Client event `alarm_mission_completed` (aggregate, no camera data) |
| Build a lasting habit | D30 retention | ≥ 20% (category medians: about 3–4% for health apps, 2–8% for education; daily-use prayer utilities do better) | First-party analytics |
| Habit depth | Fajr check-ins or completed missions per active user per week | ≥ 4 | First-party analytics (aggregate) |
| Early habit formation | Users still active on day 40 of the starting journey (FR-028) | ≥ 25% of users who start it | First-party analytics |
| Teach children salah | Children completing the "Full Salah" coach path | ≥ 40% of child profiles active ≥ 14 days | Coach progress table |
| Sustainable revenue | Install-to-paid conversion | ≥ 4% | RevenueCat |
| Family adoption | Share of paying accounts on the Family plan | ≥ 55% | RevenueCat entitlements |
| Trust | App Store / Play rating | ≥ 4.7 | Store consoles |
| Reliability | Alarm fired on time (±5 s) | ≥ 99.9% of scheduled alarms | Client `alarm_fired` vs `scheduled_at` |
| Accuracy | Prayer time deviation vs reference timetables | ≤ 1 min for 95% of test cases, ≤ 2 min for all | Automated test suite |

---

## 4. User Personas

#### Amina — the parent (primary buyer)
- **Role:** Working mother, 34, two children (7 and 10), lives in Lyon. App language: French.
- **Goals:** Pray Fajr on time herself, and teach her children salah in a way they enjoy without a screen that turns into YouTube.
- **Pain points:** Snoozes Fajr alarms, distrusts apps with ads near her kids, can't find a modern, serious Islamic kids' app.
- **Technical proficiency:** Medium.
- **Usage context:** Sets alarms at night, checks the family garden over breakfast, sits beside her children for a 5-minute coach session after Maghrib.

#### Yusuf — the child (primary user of the coach)
- **Role:** 9-year-old, learning salah, uses a family iPad.
- **Goals:** Earn new plants in the garden, "beat" each coach level, show his parents what he learned.
- **Pain points:** Gets bored with static lessons, forgets the order of positions and what to say.
- **Technical proficiency:** Low to medium (reads simple English or French, recognizes Arabic letters).
- **Usage context:** 5–10 minute sessions with a parent nearby, phone propped on the floor.

#### Omar — the young adult (individual buyer)
- **Role:** 22-year-old student in London, lives alone. App language: English.
- **Goals:** Stop missing Fajr. Stay accountable with a friend.
- **Pain points:** Sleeps through alarms, dismisses them on autopilot, has no accountability.
- **Technical proficiency:** High.
- **Usage context:** Uses the Fajr protocol nightly with the "stand and perform" mission and a wake-up partner.

---

## 5. Product Principles (binding for all features)

1. **Gamify learning and consistency, never worship itself.** No points per prayer, no ranking of anyone's prayers, no public leaderboards. The garden rewards *showing up* and *learning*, privately.
2. **Private by default.** Family circle and up to 3 accountability partners. Nothing is posted publicly.
3. **On-device camera only.** Camera frames never leave the phone, are never written to disk, and are never sent to any server or AI API.
4. **No ads, no data sold, no third-party tracking SDKs.**
5. **Mercy over punishment.** Missing a day does not wipe progress. Streak freezes and qada (making up) are built in.
6. **Scholarly review.** All religious content (positions, recitations, adhkar) is reviewed by a named advisory board before release, and the board is credited in-app.

---

## 6. Functional Requirements

Priority split, by each requirement's main priority: P0 = 12 (43%), P1 = 14 (50%), P2 = 2 (7%). FR-002, FR-007 and FR-017 also have parts at lower priorities.

### Onboarding & Accounts

#### FR-001: Household onboarding and profiles
**Description:** A parent (adult) creates a household and adds up to 5 more profiles (adult or child).

**User story:** As Amina, I want to set up my family in under 3 minutes so that each child has their own garden and coach progress.

**Acceptance criteria:**
- [ ] Onboarding works fully without an account for prayer times and the Fajr alarm. An account is only required for family sync, partners and purchase restore.
- [ ] Sign-in methods: Sign in with Apple, Google, email magic link. No passwords.
- [ ] A household holds at most 6 profiles. Adding a 7th shows a clear limit message.
- [ ] Child profiles store only a display name (≤ 20 chars), a birth year and an avatar chosen from a predefined set. No email, photo or free-text bio.
- [ ] Creating a child profile requires verifiable parental consent (FR-019) before any data syncs to the server.
- [ ] Onboarding from first screen to the "garden" home completes in ≤ 3 minutes in moderated tests (median of 10 participants).

**Priority:** P0
**Dependencies:** FR-019

#### FR-002: Localization and RTL
**Description:** The full UI is available in English, French and Arabic at launch, with Urdu, Turkish and Indonesian in the same release.

**User story:** As a Moroccan parent, I want the app in Arabic with correct right-to-left layout so that it feels native, not translated.

**Acceptance criteria:**
- [ ] EN, FR, AR fully translated and reviewed by native speakers before launch (P0 part).
- [ ] UR (RTL), TR, ID translated and reviewed for the v1.0 release (P1 part. Can ship in v1.0.x if not ready).
- [ ] All screens mirror correctly in RTL: layout, icons with direction, progress bars, swipe gestures. Verified by screenshot tests in AR and UR.
- [ ] Language follows the device locale by default and can be changed per profile.
- [ ] Numbers use Western Arabic numerals by default with an option for Eastern Arabic numerals (٠١٢٣) in AR/UR.
- [ ] No string is hard-coded. A CI lint fails on any JSX text literal outside the i18n system.

**Priority:** P0 (EN/FR/AR + RTL engine), P1 (UR/TR/ID content)
**Dependencies:** none

### Prayer Times & Qibla (free tier)

#### FR-003: Prayer times
**Description:** The app computes the five daily prayer times plus sunrise locally, offline, from the device location.

**User story:** As any user, I want accurate prayer times for where I am, even without network, so that I can trust the app with my alarms.

**Acceptance criteria:**
- [ ] Times are computed on-device with the `adhan` library. No network call is needed after location is known.
- [ ] Supported calculation methods: Muslim World League, ISNA, Egyptian, Umm al-Qura, Karachi, Dubai, Qatar, Kuwait, Singapore, Turkey (Diyanet), Tehran, Moonsighting Committee, France UOIF (12°), Morocco. The default is chosen from country (mapping table in `lib/prayer/defaults.ts`).
- [ ] Asr madhab: Shafi'i/Maliki/Hanbali (standard) or Hanafi.
- [ ] High-latitude rules: middle of the night, seventh of the night, twilight angle. Auto-enabled above 48° latitude.
- [ ] Manual per-prayer offset of −30 to +30 min.
- [ ] Manual city search works when location permission is denied.
- [ ] Deviation vs reference timetables ≤ 1 min in 95% of the test matrix and ≤ 2 min in 100% (see §14).
- [ ] Times recompute on timezone change, DST change, or a location change > 10 km.

**Priority:** P0
**Dependencies:** none

#### FR-004: Prayer notifications (adhan)
**Description:** An optional notification at each prayer time, with a choice of adhan sound or a simple tone.

**User story:** As Omar, I want a gentle reminder at Dhuhr and Asr without a loud adhan in class.

**Acceptance criteria:**
- [ ] Per-prayer setting: off / silent notification / tone / adhan (3 bundled recordings, licensed).
- [ ] Notifications for the next 7 days are scheduled locally (within the iOS 64-pending-notification limit). The schedule refreshes on each app open and via background refresh.
- [ ] Optional pre-prayer reminder 5–30 min before.
- [ ] Notifications never use the alarm channel. Only the Fajr protocol (FR-006) can break through silent mode.
- [ ] The notification permission is requested in context (when the user sets up the Fajr alarm or turns on a prayer notification), never on first launch.
- [ ] Apart from prayer-time notifications the user switched on, the app sends at most 1 notification per day, and none between Isha + 30 min and Fajr − 60 min except alarms.
- [ ] Notification copy rotates (at least 7 variants per type) and never uses guilt or loss wording.

**Priority:** P1
**Dependencies:** FR-003

#### FR-005: Qibla compass
**Description:** A compass that points to the Kaaba from the user's location.

**User story:** As a traveler, I want to find the qibla quickly in a hotel room.

**Acceptance criteria:**
- [ ] Bearing is computed by great-circle formula to 21.4225° N, 39.8262° E.
- [ ] Uses true heading (corrected for magnetic declination). Falls back to magnetic heading plus a computed declination when true heading is unavailable.
- [ ] Shows a calibration prompt when heading accuracy > 15°.
- [ ] Haptic tick when the device is aligned within ±3°.
- [ ] Computed bearing matches reference bearings for 20 test cities within ±0.5° (unit test).

**Priority:** P1
**Dependencies:** FR-003 (location)

### Fajr Protocol (core differentiator)

#### FR-006: Fajr alarm that breaks through silent mode
**Description:** A true alarm, scheduled relative to Fajr or at a fixed time, that rings through silent mode and Focus/DND.

**User story:** As Omar, I want an alarm that actually rings for Fajr even if my phone is on silent so that I stop relying on luck.

**Acceptance criteria:**
- [ ] Alarm time options: "at Fajr", "X min before Fajr" (0–60), "X min before sunrise", or a fixed time. Recomputes daily from FR-003.
- [ ] **iOS 26+:** scheduled with AlarmKit (`AlarmManager`). Rings over silent mode and Focus, and shows on the Lock Screen and Dynamic Island. `NSAlarmKitUsageDescription` is set and authorization is requested in onboarding with an explanation screen.
- [ ] **iOS < 26:** falls back to time-sensitive local notifications with a 30 s custom sound repeated every 60 s for 10 min. A banner explains that iOS 26 gives a real alarm.
- [ ] **Android:** scheduled with `AlarmManager.setAlarmClock()`, ringing in a foreground service (`foregroundServiceType="specialUse"` or `mediaPlayback` per Play policy) with a full-screen intent (`USE_FULL_SCREEN_INTENT`, the alarm-clock use case) and `USE_EXACT_ALARM`. Survives reboot (`BOOT_COMPLETED` receiver re-schedules).
- [ ] Fires within ±5 s of the scheduled time in ≥ 99.9% of cases across the device test matrix (§14).
- [ ] Rings at user-chosen volume with optional gradual ramp-up (30 s), plus vibration.
- [ ] Works with no network.

**Priority:** P0
**Dependencies:** FR-003

#### FR-007: Wake-up missions
**Description:** The alarm can only be fully stopped after completing a mission that requires being physically awake.

**User story:** As Omar, I want the alarm to make me get up and move so that I can't switch it off half-asleep.

**Acceptance criteria:**
- [ ] **Mission "Stand & Perform"** (P0): the user props the phone up and performs a short sequence (standing → hands raised for takbir → bow → stand), verified by on-device pose detection (FR-009 engine). Passes after the sequence is detected once. Times out to a fallback after 3 failed minutes.
- [ ] **Mission "Steps"** (P0): walk N steps (default 30) measured by the pedometer. Used automatically when the camera is unavailable or the room is too dark (mean frame luminance below a threshold).
- [ ] **Mission "Math"** (P0, accessibility fallback): solve 3 arithmetic problems. Always available, so a user who can't do the others is never locked out.
- [ ] **Mission "Wudu"** (P1): photograph a running tap or sink. Verified on-device by an image classifier (Apple Vision `VNClassifyImageRequest` / ML Kit image labeling. If no suitable built-in label exists, a bundled custom Core ML/TFLite model ≤ 10 MB). Frame is classified in memory and discarded.
- [ ] **Mission "First Ayah"** (P2, v1.1): recite al-Fatiha 1:1, verified by on-device speech recognition (see FR-021).
- [ ] **iOS enforcement model:** AlarmKit's system Stop button cannot be disabled. When the user arms a mission, the app therefore pre-schedules a chain of follow-up alarms (default every 2 min for 20 min). Completing the mission in-app cancels the remaining chain. The alarm's secondary button ("Start mission") opens the app directly into the mission via an App Intent.
- [ ] **Android enforcement model:** the full-screen alarm activity has no dismiss control until the mission is passed. The volume keys and back button do not stop the sound. Force-stopping the app is the only escape, and the app logs this as `alarm_bypassed`.
- [ ] Mission completion is recorded as an event (type, duration, outcome). **No image, video or pose coordinates are stored or sent.**

**Priority:** P0 (Stand & Perform, Steps, Math), P1 (Wudu), P2 (First Ayah)
**Dependencies:** FR-006, FR-009

#### FR-008: Snooze escalation and wake-up partner
**Description:** Limited snoozes that get harder, and an optional partner who is notified if you don't confirm you're awake.

**User story:** As Omar, I want my friend to get a nudge if I haven't woken up 15 minutes after the alarm so that I feel accountable.

**Acceptance criteria:**
- [ ] Snooze: off by default, configurable 0–3 snoozes of 3–9 min. Each snooze raises the mission difficulty one step (e.g. 30 → 60 steps).
- [ ] Partner linking by invite link or QR code. Both sides must accept. Maximum 3 partners per adult. Children cannot be partners outside their household.
- [ ] When an alarm is armed, the client sends `alarm_armed {deadline}` to the server. If no `alarm_completed` arrives before the deadline (default alarm + 15 min), the server sends a push to the partners: "Omar hasn't checked in for Fajr yet. Send a nudge?"
- [ ] A partner can send one nudge, which triggers a high-priority push to the sleeper. No chat in v1.
- [ ] Partners only see "checked in / not yet / nudge sent". They never see times, mission type or streaks unless the user shares their garden.
- [ ] The user can pause partner alerts (travel, illness, women's monthly exemption) for 1–14 days with no explanation required.

**Priority:** P1
**Dependencies:** FR-001, FR-006, FR-007

### Salah Coach (premium)

#### FR-009: On-device pose detection engine
**Description:** A shared native module that classifies prayer positions in real time from the camera.

**User story:** As a developer, I need one reliable engine for both the missions and the coach so that accuracy improvements benefit both.

**Acceptance criteria:**
- [ ] iOS: Apple Vision `VNDetectHumanBodyPoseRequest` (2D). Android: ML Kit Pose Detection (base model, stream mode). Both run through a `react-native-vision-camera` frame processor plugin.
- [ ] Classified states: `qiyam` (standing), `takbir` (hands raised to ears), `ruku` (bowing), `itidal` (standing after ruku), `sujood` (prostration), `julus` (sitting), plus `unknown`. A state machine with hysteresis (state must hold ≥ 400 ms) emits transitions.
- [ ] Classification uses joint angles (hip, knee and torso inclination) and relative keypoint positions, not raw pixels, so it is skin-tone, clothing-color and lighting independent wherever the keypoints are detected.
- [ ] Recommended phone placement is side-on at 1.5–3 m, floor or shelf height. A placement assistant checks the full body is in frame before starting.
- [ ] Accuracy on the internal validation set (§14): per-state F1 ≥ 0.90 for qiyam/ruku/julus and ≥ 0.85 for sujood, for adults and for children aged 6–12.
- [ ] Processes ≥ 15 fps on iPhone 12 / Pixel 6 class devices and ≥ 10 fps on 2020 mid-range Android (e.g. Galaxy A51). Battery ≤ 6% per 10-minute session.
- [ ] Frames are never persisted or transmitted. The module exposes only state transitions to JavaScript.
- [ ] Works with loose clothing (thobe, abaya, jilbab). This is covered explicitly in the validation set.

**Priority:** P0
**Dependencies:** none

#### FR-010: Kids' Salah Coach path
**Description:** A step-by-step path that teaches children aged 6–12 the positions, order and words of each prayer, with live pose feedback.

**User story:** As Yusuf, I want the app to tell me when I'm doing ruku right and unlock a new plant when I finish a level.

**Acceptance criteria:**
- [ ] Path of 12 levels: wudu (video and illustration, no camera), each position on its own (6 levels), combining positions, a full 2-rak'ah Fajr, then 3- and 4-rak'ah prayers.
- [ ] Each level takes 3–7 minutes. Audio narration in the profile language, with Arabic recitation by a child-friendly reciter (licensed). Transliteration and translation are toggleable.
- [ ] Live feedback: a calm visual cue when the position is recognized, with gentle correction phrased positively ("Try lowering your back a little more"). No sounds of failure, no "wrong" buzzers.
- [ ] Completing a level grows the child's garden (FR-013). Levels unlock sequentially, and a parent can unlock any level.
- [ ] A coach session cannot start until a parent-set daily time window is open (default 07:00–20:00) and the session is capped at 20 min/day (parent-adjustable).
- [ ] Content passes advisory-board review before release. Madhab-specific differences (e.g. hand placement) follow the household madhab setting.

**Priority:** P0
**Dependencies:** FR-009, FR-001

#### FR-011: Adult rak'ah companion
**Description:** An optional mode that tracks rak'ahs during an adult's real prayer and helps when they lose count.

**User story:** As someone who sometimes loses count in a 4-rak'ah prayer, I want a discreet indicator so that I don't need to guess.

**Acceptance criteria:**
- [ ] Off by default, enabled per prayer session from the prayer card.
- [ ] Counts rak'ahs from the pose state sequence (a rak'ah = qiyam → ruku → itidal → sujood → julus → sujood).
- [ ] Display: a dim, minimal counter readable from 2 m, black background, no animation. The screen auto-dims to 10% brightness.
- [ ] Optional single gentle haptic per completed rak'ah (phone on a surface nearby).
- [ ] Count accuracy ≥ 98% on validation recordings of full 2-, 3- and 4-rak'ah prayers.
- [ ] Nothing is logged except, if the user chooses, "prayer completed" for their private tracker.

**Priority:** P1
**Dependencies:** FR-009

### Habit & Garden

#### FR-012: Private prayer check-in tracker
**Description:** The user can privately mark each daily prayer as prayed, prayed late, or missed / to make up.

**User story:** As Amina, I want to see my own consistency without anyone else judging it.

**Acceptance criteria:**
- [ ] One-tap check-in from the prayer card, notification action or home widget.
- [ ] States: `on_time`, `late`, `missed`, `made_up` (qada). Default view shows the last 7 days.
- [ ] Data is visible only to the profile owner. A parent sees a child's coach progress, but child prayer check-ins are visible to the parent only if the child profile is under 10 or the parent enables it.
- [ ] The tracker never displays a score or percentage that ranks the person. It shows days and the garden only.
- [ ] Women can enable an exemption mode that pauses tracking and streaks without explanation, and it is never shown to anyone else.

**Priority:** P1
**Dependencies:** FR-001

#### FR-013: The Garden (progress metaphor)
**Description:** Each profile owns a garden that grows with consistency and learning, and shared family elements grow when the family keeps going together.

**User story:** As Yusuf, I want to watch my date palm grow so that I want to come back tomorrow.

**Acceptance criteria:**
- [ ] Growth inputs: Fajr mission completed (water), coach level completed (new plant), 7-day consistency (bloom), family days where every member checked in at least once (the shared fountain grows).
- [ ] 5 growth stages per plant, 12 plant species in v1 (date palm, olive, fig, pomegranate, jasmine…). Hand-illustrated assets, no AI-generated imagery.
- [ ] No characters with faces. Living creatures are limited to birds and butterflies drawn without facial detail.
- [ ] Missing days never kill plants. The garden simply pauses growing ("resting"). A missed day can be "watered back" by a qada check-in within 24 h.
- [ ] The garden renders at 60 fps on target devices (§7) and is built in Skia (no WebView).
- [ ] Prayer counts are never shown as a number in the garden.

**Priority:** P0
**Dependencies:** FR-012 or FR-007 or FR-010 (any input)

#### FR-014: Streak with freezes and qada
**Description:** A consistency streak that forgives.

**User story:** As Omar, I want one bad night to not erase three weeks of progress.

**Acceptance criteria:**
- [ ] The streak counts consecutive days with a completed Fajr mission *or* a Fajr check-in.
- [ ] 2 automatic freezes per calendar month. A freeze applies silently to the first missed day.
- [ ] A missed day can be restored within 24 h by a `made_up` check-in (counts as "kept with qada").
- [ ] Exemption mode (FR-012) and travel mode pause the streak without breaking it.
- [ ] Streak logic is a pure function `computeStreak(events, settings, tz)` with ≥ 95% branch coverage (§14).
- [ ] Day boundaries: the "Fajr day" is the local calendar date in the user's timezone, with local midnight as the boundary (implemented in sprint 1). Travel across timezones never double-counts or skips a day.
- [ ] The main progress view shows "days kept this month" alongside the streak. Research on habit formation finds a single missed day barely affects automaticity, while repeated misses do (Lally et al., 2010), so the monthly count is the honest measure.
- [ ] After a missed day, the next app open shows a "welcome back" screen offering qada (if still within 24 h) and today's first step. No loss wording, no broken-chain imagery.

**Priority:** P0
**Dependencies:** FR-012

#### FR-015: Parent dashboard
**Description:** A parent view of each child's coach progress and garden.

**User story:** As Amina, I want to see what Yusuf learned this week and which level he's stuck on.

**Acceptance criteria:**
- [ ] Shows per child: levels completed, current level, minutes this week, days active, the garden.
- [ ] Shows a "stuck" hint when a child fails the same level 3 times, with a tip for the parent.
- [ ] Celebrations, not prizes: when a child reaches a milestone, the parent gets a prompt with ideas to celebrate it (praise for the effort, a surprise outing, telling a grandparent). The app never lets a parent set up a reward promised in advance for praying, because rewards promised in advance can undermine a child's own motivation while praise strengthens it (overjustification research, Lepper, Greene and Nisbett, 1973, and later meta-analyses).
- [ ] All in-app feedback to children praises effort and practice ("You kept practising ruku"), never ability or worthiness.
- [ ] Accessible only behind the parental gate (FR-019).
- [ ] Loads in ≤ 1.5 s on 4G with cached data shown instantly.

**Priority:** P1
**Dependencies:** FR-001, FR-010, FR-019

#### FR-016: Home screen and lock screen widgets
**Description:** Widgets showing the next prayer and garden status.

**User story:** As Amina, I want to see the next prayer time without opening the app.

**Acceptance criteria:**
- [ ] iOS: WidgetKit small/medium plus a Lock Screen accessory. Android: Glance widget 2×1 and 4×2.
- [ ] Shows next prayer name, time and countdown. The medium size adds the garden thumbnail and a check-in button (iOS interactive widget / Android action).
- [ ] Widget colors follow the sun-phase palette (§10).

**Priority:** P2
**Dependencies:** FR-003, FR-012

#### FR-023: If-then plan and small first goal at onboarding
**Description:** Onboarding asks the user to tie each habit to a concrete cue, preferably a prayer, and to choose a deliberately small first goal.

**User story:** As Omar, I want to decide exactly what I do when the alarm rings, so that I don't have to think at 5 a.m.

**Acceptance criteria:**
- [ ] Each habit is set up as an if-then plan built from choices, e.g. "When my Fajr alarm rings, I go to the sink for wudu" or "After Fajr, I read 1 page". Implementation intentions improve goal attainment (meta-analytic d = 0.65 in 2006; 0.15–0.35 after publication-bias correction in the 2024 update), so the effect is real but modest.
- [ ] Prayer-anchored cues are offered first (after Fajr, after Maghrib, after Isha), then time and place cues.
- [ ] The first goal suggested is the smallest meaningful version (1 page, 1 ayah, 2 rak'ahs). The user can raise it any time, and the app suggests raising it only after 14 kept days.
- [ ] The daily goal is separate from the streak: meeting the small goal keeps the day, going further is never required.
- [ ] The plan is shown back in the user's words on the mission screen after the alarm.
- [ ] Onboarding with the plan step still completes in ≤ 3 minutes (FR-001).

**Priority:** P0
**Dependencies:** FR-001, FR-006

#### FR-024: Fresh starts on the Islamic calendar
**Description:** On meaningful dates, the app offers a light "begin again" moment.

**User story:** As someone who drifted off for two weeks, I want a natural moment to restart without feeling I failed.

**Acceptance criteria:**
- [ ] Fresh-start dates: every Friday, the 1st of each Hijri month, the first 10 days of Dhul Hijjah, 1 Ramadan, 1 Shawwal, the user's birthday (optional), and the first day after a pause ends. People are more likely to start working on goals at such landmarks (Dai, Milkman and Riis, 2014).
- [ ] On those dates, a lapsed user (no check-in in the last 7 days) sees one gentle card offering to restart with a small goal. Active users see nothing extra.
- [ ] At most one fresh-start card per week, and it can be turned off.
- [ ] The Hijri dates come from the same Umm al-Qura calendar as FR-022, with the household's ±1 day adjustment.

**Priority:** P1
**Dependencies:** FR-014, FR-023

#### FR-025: Prayer Focus mode (khushoo)
**Description:** Help the user pray with presence, not only on time: a short transition before prayer, silence during it, and one meaning card a day.

**User story:** As Amina, I want my phone to stay quiet while I pray and to help me understand what I recite, so that my prayer feels present and not mechanical.

**Acceptance criteria:**
- [ ] Optional per prayer. When it's on, the phone's Focus / Do Not Disturb mode turns on for a user-set window (default 15 min from the prayer card's "Start prayer" tap). iOS: a Focus filter set up through App Intents. Android: Do Not Disturb with the notification-policy permission.
- [ ] A 60-second transition screen before prayer: a reminder to make wudu, put the phone away and set the intention, with no animation if Reduce Motion is on.
- [ ] One "meaning card" per day: a phrase of al-Fatiha or another short surah with translation and a one-line reflection, in a fixed sequence the user can follow. Content goes through the advisory board (FR-020).
- [ ] Research on prayer reminder apps found better punctuality but little gain in khushoo, and a 2025 review of Islamic apps found they rarely support long-term motivation, so this feature is a deliberate differentiator. Success is measured by an optional monthly self-rating ("My prayers felt present: rarely / sometimes / often"), stored on device only.
- [ ] The app records nothing about the prayer itself.

**Priority:** P1
**Dependencies:** FR-003, FR-020

#### FR-026: Bedtime coach worked out from Fajr
**Description:** A wind-down reminder computed backwards from tomorrow's alarm, so the user wakes for Fajr with enough sleep.

**User story:** As Omar, I want to know when to go to bed tonight so that waking for Fajr doesn't leave me exhausted.

**Acceptance criteria:**
- [ ] Bedtime = tomorrow's alarm time − the user's sleep target (default 7 h, range 5–9 h) − 15 min to fall asleep. A reminder fires 30 min before it.
- [ ] Because Fajr moves by hours across the year at high latitudes, the coach shows a weekly preview of alarm and bedtime so the user can keep a regular schedule. Regular sleep and wake timing is associated with better health than duration alone.
- [ ] During Ramadan, the coach shows a daily sleep budget including suhoor and suggests a short midday rest when the night's sleep falls under the target. The suggestion is framed as health advice only: the commonly quoted midday-nap hadith could not be verified during research (§18), so no hadith is cited unless the board approves one.
- [ ] Snooze stays off by default (FR-008): a sleep-lab study found snoozing prolongs grogginess after waking.
- [ ] The coach gives guidance only: no sleep tracking and no microphone use.

**Priority:** P1
**Dependencies:** FR-003, FR-006

#### FR-027: 7-day Fajr commitment
**Description:** The user can commit to waking for Fajr for the next 7 days. Keeping it grows a rare plant.

**User story:** As Omar, I want a short, concrete challenge to get started, because "every day forever" feels too big.

**Acceptance criteria:**
- [ ] One tap to commit for the next 7 days, with an optional wake-up partner told about it (FR-008).
- [ ] Completing 7 kept days (freezes and qada count as kept) grows a rare plant in the garden. Missing it simply ends the challenge with an offer to start a new one. Nothing is taken away.
- [ ] No money, sadaqah pledges or vows are involved. Paid commitment contracts work in secular apps, but betting raises maysir concerns, and the Prophet ﷺ forbade making vows, saying a vow "brings no good; it is only a means of extracting something from the miser" (Muslim 1639, Bukhari 6608, reference checked). The board approves the final wording.
- [ ] A user can run at most one commitment at a time.
- [ ] Evidence: Duolingo reports that asking learners to commit to a streak goal improved short-term retention (company-reported, not peer-reviewed).

**Priority:** P1
**Dependencies:** FR-007, FR-013, FR-014

#### FR-028: 40-day starting journey
**Description:** New users follow a guided 40-day journey: close daily support for the first two weeks, then gradually lighter support.

**User story:** As a new user, I want to be guided through the hardest early weeks, so that the habit sticks before I'm left on my own.

**Acceptance criteria:**
- [ ] Days 1–14: a short daily step (one tip, one evidence card or one small win), the welcome-back flow (FR-014) after any miss, and a check-in prompt after Fajr. Early repetitions bring the largest gains in automaticity (Lally et al., 2010).
- [ ] Days 15–40: a step every 3 days, then weekly. Prompts stop entirely at day 40.
- [ ] Day 40 shows a garden milestone and asks the user to choose their next small goal (FR-023).
- [ ] The journey is presented as habit science only. The best-known 40-day narration (praying 40 days in congregation catching the first takbir, Tirmidhi 241) has a disputed grading: rated hasan in some of al-Albani's works and by Ahmad Shakir, weak by others, and Tirmidhi himself notes it is mostly reported as a statement of Anas. It is not cited unless the board decides otherwise (§18).
- [ ] Days kept, not consecutive days, decide progress through the journey.

**Priority:** P1
**Dependencies:** FR-013, FR-014, FR-023

### Monetization & Trust

#### FR-017: Subscriptions and paywall
**Description:** Free tier plus Premium Individual, Premium Family and Lifetime, managed by RevenueCat.

**User story:** As Amina, I want one subscription that covers the whole family so that I don't pay per child.

**Acceptance criteria:**
- [ ] Free: prayer times, qibla, notifications, Fajr alarm with Steps and Math missions, 1 garden, kids' coach levels 1–2.
- [ ] Premium (entitlement `premium`): Stand & Perform and Wudu missions, the full coach path, rak'ah companion, wake-up partners, parent dashboard, all plant species.
- [ ] Products: Individual $39.99/yr or $5.99/mo. Family (up to 6 profiles) $69.99/yr or $9.99/mo. Lifetime Family $179.99. 7-day free trial on annual plans. Regional pricing via store price tiers (e.g. lower tiers for Indonesia, Pakistan, Egypt, Morocco).
- [ ] The paywall is reachable only from adult profiles and behind the parental gate. Child profiles never see prices or purchase buttons.
- [ ] Restore purchases works across iOS/Android when signed in to the same account (RevenueCat app user ID = Supabase user ID).
- [ ] Apple Family Sharing is enabled on Family products.
- [ ] "Sponsor a learner": a one-time $39.99 purchase gifts a 1-year Individual plan to a family on the need-based waitlist (P2. The waitlist UI is P2 too).
- [ ] A need-based discount request form (like Tarteel's Alim program) grants 1 year of Premium after manual review (P1).

**Priority:** P0 (core subscriptions), P1 (need-based discount), P2 (sponsor a learner)
**Dependencies:** FR-001

#### FR-018: Privacy center
**Description:** A plain-language screen explaining what is and isn't collected, with export and delete.

**User story:** As a privacy-conscious parent, I want proof that the camera data never leaves the phone.

**Acceptance criteria:**
- [ ] One screen with: "What we store", "What never leaves your phone (camera, pose, audio)", "Who we share with (no one, plus processors: Supabase, RevenueCat, Apple/Google push)".
- [ ] Export all household data as JSON within 60 s.
- [ ] Delete account and all household data: immediate soft delete, hard delete within 30 days, confirmation email.
- [ ] A network-traffic test in CI asserts that no request body contains image, audio or keypoint payloads during a full mission and coach session (§14).

**Priority:** P1
**Dependencies:** FR-001

#### FR-019: Parental gate and consent
**Description:** COPPA- and GDPR-K-compliant consent for child profiles, and a gate in front of parent-only areas.

**User story:** As Amina, I want my children to be unable to change settings, buy anything or add partners.

**Acceptance criteria:**
- [ ] The parental gate is an adult-level challenge (e.g. solve a written-out multiplication like "seven times eight" in the current language) or device biometrics on the parent's device. It is required for settings, purchases, partner links, the parent dashboard and external links.
- [ ] Verifiable parental consent before child data is synced: the signed-in adult confirms via a consent screen plus an email confirmation link. A `consent_record` is stored with timestamp, method and policy version.
- [ ] Without consent, child profiles work in local-only mode (no sync).
- [ ] No third-party analytics, ads or tracking SDKs in the app binary. Verified by dependency audit in CI.
- [ ] Store listing: General category ("Lifestyle" / "Education") with child profiles under parental control, not the Apple Kids Category. On Google Play, the target audience includes children, so the app complies with the Families Policy (no non-certified ad SDKs, no precise location from child profiles).

**Priority:** P0
**Dependencies:** FR-001

#### FR-020: Advisory board and content credits
**Description:** An in-app page naming the scholars and teachers who reviewed content.

**Acceptance criteria:**
- [ ] Lists each reviewer's name, credentials and the content they reviewed.
- [ ] Every coach level shows a "Reviewed by" line with a version date.
- [ ] Content updates bump the version and are re-reviewed before release.

**Priority:** P1
**Dependencies:** FR-010

#### FR-021: On-device recitation check (First Ayah mission)
**Description:** Verify that the user recited al-Fatiha 1:1 as a wake-up mission.

**Acceptance criteria:**
- [ ] Uses a Quran-fine-tuned Whisper model (e.g. a tarteel-ai Whisper checkpoint, after confirming its license) run via whisper.cpp, quantized to ≤ 80 MB and downloaded on demand.
- [ ] Recognizes the ayah with ≥ 95% true positive rate and ≤ 5% false positive rate on the validation set (adult voices, sleepy speech included).
- [ ] Audio is processed in memory only.

**Priority:** P2 (v1.1, after a feasibility spike)
**Dependencies:** FR-007

#### FR-022: Ramadan program, "30 Lanterns" (habits of the Prophet ﷺ in Ramadan)
**Description:** During Ramadan, the app runs a 30-night program built around what the Prophet ﷺ did in that month, with every habit backed by an evidence card (Arabic text, translation, source, grading, reviewer).

**User story:** As Omar, I want to follow the Prophet's ﷺ Ramadan routine (suhoor, Fajr, iftar, qiyam, the last ten nights) one night at a time, and to know where each practice comes from, so that my Ramadan is structured by the Sunnah rather than by an app's invented rules.

**Habit set and evidence** (references to be verified word for word by the advisory board before release, FR-020. "Checked" means the reference was confirmed against a hadith database during drafting; "To verify" means it was cited from memory):

| # | Habit | What the Prophet ﷺ did or taught | Reference | Status |
|---|-------|-----------------------------------|-----------|--------|
| 1 | Late suhoor | "Take suhoor, for in suhoor there is blessing." The gap between suhoor and the prayer was about 50 verses | Bukhari 1923, Muslim 1095; Bukhari 1921, Muslim 1097 | To verify |
| 2 | Fajr | The two rak'ahs before Fajr are better than the world and what it contains | Muslim 725 | To verify |
| 3 | Prompt iftar, with dates | "People remain upon good as long as they hasten to break the fast." He broke his fast with fresh dates, else dried dates, else water | Bukhari 1957, Muslim 1098; Abu Dawud 2356 | To verify |
| 4 | Guarding the tongue | "Whoever does not give up false speech and acting on it, Allah has no need of him leaving his food and drink." "Fasting is a shield… say: I am fasting" | Bukhari 1903; Bukhari 1904, Muslim 1151 | To verify |
| 5 | Daily Quran | Jibril met him every night of Ramadan to study the Quran, and reviewed it twice in his final year | Bukhari 6; Bukhari 3624 | Checked |
| 6 | Generosity, feeding a fasting person | He was most generous in Ramadan, "faster than the blowing wind." Whoever feeds a fasting person gets the same reward without reducing theirs | Bukhari 6, Muslim 2308; Tirmidhi 807 | Checked |
| 7 | Qiyam / Taraweeh | "Whoever stands in Ramadan with faith and seeking reward is forgiven his past sins." Praying with the imam until he finishes counts as the whole night. He did not exceed 11 rak'ahs, in Ramadan or otherwise | Bukhari 37, Muslim 759; Tirmidhi 806; Bukhari 1147, Muslim 738 | 806, 1147/738 checked; 37/759 to verify |
| 8 | Tahajjud in the last third of the night | Allah descends to the lowest heaven in the last third of every night | Bukhari 1145, Muslim 758 | To verify |
| 9 | Last ten nights: revive them, wake the family | "When the last ten began, he tightened his waist-wrapper, prayed all night, and woke his family." He strove in the last ten more than at any other time | Bukhari 2024, Muslim 1174; Muslim 1175 | 2024/1174 checked |
| 10 | Seek Laylat al-Qadr | Seek it in the odd nights of the last ten. The dua he taught Aisha: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni" | Bukhari 2017; Tirmidhi 3513 | To verify |
| 11 | I'tikaf (optional) | He did i'tikaf in the last ten nights until he passed away | Bukhari 2026, Muslim 1172 | To verify |
| 12 | Zakat al-Fitr | To be given before the people go out to the Eid prayer. Form of payment follows the household's country: Morocco's Higher Council of Ulema allows food or cash (25 MAD per person in 2026); Egypt's Dar al-Ifta allows cash (EGP 35 minimum in 2026); the Saudi position associated with Ibn Baz requires food | Bukhari 1503, Muslim 984 | To verify |
| 13 | Six days of Shawwal (after Ramadan) | "Whoever fasts Ramadan and follows it with six of Shawwal, it is as if he fasted for a lifetime" | Muslim 1164 | To verify |
| — | Principle behind the whole program | "The most beloved deeds to Allah are the most consistent, even if small" | Bukhari 6464, Muslim 783 | To verify |

**Acceptance criteria:**
- [ ] **Ramadan detection:** Ramadan starts on the date officially announced in the household's country, not on a calendar calculation. Saudi Arabia and Egypt announce it from crescent sightings, and Morocco runs its own national sighting and often starts one day after them (2021, 2024 and 2025). The app predicts the date from the Umm al-Qura calendar, shows it as "expected", asks the user to confirm on the evening of the sighting ("Has Ramadan been announced where you live?"), and the team can push the official dates per country through remote configuration. A ±1 day manual adjustment stays available. A preview "Get ready" screen opens 7 days before.
- [ ] **Isha in Ramadan:** under the Umm al-Qura method, Isha is 120 min after Maghrib during Ramadan instead of 90 (implemented and tested: `computePrayerTimes(..., { ramadan: true })`).
- [ ] **Day timeline:** the habits appear in the order of the user's actual day, driven by FR-003 prayer times: suhoor → Fajr → daily Quran → iftar → Isha + qiyam → (last ten) tahajjud.
- [ ] **Suhoor alarm:** a preset on the FR-006 engine at Fajr − N minutes (default 20, range 10–60), explained with the "50 verses" evidence card.
- [ ] **Tahajjud alarm:** a preset at the start of the last third of the night, computed as Fajr − (Fajr − Maghrib) / 3 for the user's location (pure function in `lib/prayer`, unit-tested including high latitudes). It uses the same missions as the Fajr alarm (FR-007), Stand & Perform by default.
- [ ] **Family wake chain (last ten nights):** a parent can link their tahajjud or suhoor alarm to other household profiles, so that their phones ring in turn after the parent completes the mission, following Bukhari 2024 ("he woke his family"). Each member can opt out. Children's devices ring only within the parent-set window.
- [ ] **Qiyam check-in:** a single private check-in ("I prayed qiyam", with "with the imam until the end" as an option). The app never asks for or scores a number of rak'ahs. The evidence card presents the 11 rak'ah report and notes that scholars accept other counts (e.g. 20 under 'Umar), with the advisory board's wording.
- [ ] **Daily Quran plan:** a khatm planner (1, 2 or 3 completions, or a custom number of pages per day) that redistributes missed pages over the remaining days instead of showing a deficit.
- [ ] **Generosity:** a private daily "gave or fed someone" check-in, plus a link to "Sponsor a learner" (FR-017) during Ramadan.
- [ ] **Tongue check:** an optional evening self-reflection with no answer stored server-side.
- [ ] **30 Lanterns (gamification):** each night lights one lantern in the user's garden when they complete at least one habit of that night. The last ten lanterns are larger, and the odd nights carry a star. No points, no percentages, no comparison between people. Lanterns never go out; an unlit night simply stays dark.
- [ ] **Family lantern:** a shared lantern lights on nights when every household member who opted in completed suhoor or iftar together.
- [ ] **Kids mode:** children see age-appropriate habits (practice fasts as defined by the parent, iftar dua, helping prepare iftar, a short surah per day). The app never asks a child to fast.
- [ ] **Evidence cards:** every habit has a "Why?" card with the Arabic text, translation in the profile language, reference, grading and "Reviewed by" line (FR-020). No habit ships without a card approved by the board.
- [ ] **Eid recap (opt-in):** on Eid, a shareable image of the garden with its 30 lanterns, without any counts, times or worship statistics. Sharing is off by default.
- [ ] **After Ramadan:** a Shawwal continuation offers 6 fasting days (Muslim 1164) and turns the Ramadan habits the user kept into a lighter year-round routine, to protect retention after the month.
- [ ] **Pricing:** the core program (timeline, suhoor and iftar, check-ins, lanterns, evidence cards) is free for everyone during Ramadan. The tahajjud camera mission, family wake chain and khatm planner are Premium.

**Priority:** P1. Target: public beta before Ramadan 1448 (expected to begin around 8 February 2027, subject to moon sighting).
**Dependencies:** FR-003, FR-006, FR-007, FR-012, FR-013, FR-017, FR-020

---

## 7. Non-Functional Requirements

#### Performance
- Cold start to home screen: ≤ 1.5 s on iPhone 12 / Pixel 6, ≤ 2.5 s on Galaxy A51.
- Prayer time computation: ≤ 10 ms for a full day.
- Pose pipeline: ≥ 15 fps on reference devices, end-to-end feedback latency ≤ 250 ms.
- Garden rendering: 60 fps, no frame > 32 ms during growth animations.
- App download size: ≤ 60 MB (models and recitation audio packs downloaded on demand).

#### Security
- Auth: Supabase Auth (Sign in with Apple, Google OAuth, email magic link). JWT access tokens (1 h) and rotating refresh tokens stored in iOS Keychain / Android Keystore via `expo-secure-store`.
- Row Level Security on every table. A user can only read rows in their household, and partner visibility is limited to a dedicated `partner_status` view.
- TLS 1.2+ in transit. Supabase Postgres encryption at rest.
- Secrets (RevenueCat webhook secret, push credentials, Supabase service role key) live only in Edge Function environment variables, never in the app bundle. `.env*` is in `.gitignore`.
- The RevenueCat webhook is verified via an authorization header. Edge Functions validate all input with Zod.
- Compliance: GDPR (EU hosting region `eu-central-1`), UK GDPR, COPPA, Apple App Review 5.1.4 (kids), Google Play Families Policy.

#### Scalability
- Launch: 50k MAU. 12-month target: 250k MAU.
- Server load is light by design (computation happens on-device). The main load is the 5:00–6:30 local-time partner deadline checks.
- Partner deadline checks run via `pg_cron` every minute over an indexed `alarm_sessions(deadline_at) WHERE status = 'armed'` query, and can scale out to a queue (Supabase Queues) above 1M sessions/day.

#### Availability
- Core features (times, alarm, missions, coach, garden) work 100% offline. Server outages only affect sync, partners and purchases.
- Backend uptime target: 99.9%. Daily backups with point-in-time recovery (7 days). RPO ≤ 24 h, RTO ≤ 4 h.

#### Accessibility (WCAG 2.2 AA equivalent for native)
- Dynamic Type / font scaling up to 200% without clipping.
- VoiceOver/TalkBack labels on every control. The coach gives audio cues so blind or low-vision users can follow it.
- Contrast ≥ 4.5:1 for text in every sun-phase palette (verified in CI with token contrast tests).
- Respect Reduce Motion: garden growth becomes cross-fades.
- Every mission has a non-camera, non-motion alternative (Math).

---

## 8. Technical Architecture

#### System Overview
A local-first React Native (Expo) app. Everything time-critical or privacy-sensitive (prayer times, alarms, pose detection, streak computation) runs on the device. Supabase provides accounts, household sync, partner coordination and push fan-out. RevenueCat handles purchases across both stores.

#### Technology Stack
- **App:** Expo SDK (latest stable at kickoff) with React Native New Architecture, TypeScript (strict), Expo Router.
- **Native modules (Expo Modules API, Swift/Kotlin):** `fg-alarm` (AlarmKit / AlarmManager), `fg-pose` (Vision / ML Kit frame-processor plugin), `fg-label` (image classification for the Wudu mission).
- **Camera:** `react-native-vision-camera` with frame processors.
- **Rendering:** `@shopify/react-native-skia` (garden, geometric patterns), `react-native-reanimated`.
- **Local data:** `expo-sqlite` with Drizzle ORM. It holds the source of truth for events and syncs to Supabase.
- **Backend:** Supabase (Postgres 15+, Auth, Edge Functions on Deno, pg_cron), EU region.
- **Purchases:** RevenueCat (`react-native-purchases`).
- **Push:** Expo Push Service (APNs/FCM).
- **Prayer math:** `adhan` (adhan-js).
- **i18n:** `i18next` + `react-i18next` + `expo-localization`, ICU plurals.
- **Analytics:** first-party events table in Supabase (aggregate, adult profiles only, opt-out available). No third-party SDK.
- **Crash reporting:** Sentry with PII scrubbing and `sendDefaultPii: false`. Disabled for child profile sessions.

#### Architecture Diagram (Description)
The app computes prayer times locally from the location with adhan-js and writes the next 7 days of alarms through the `fg-alarm` native module to AlarmKit (iOS) or AlarmManager (Android). When an alarm fires, the OS shows the system alarm UI (iOS) or the app's full-screen activity (Android). The user opens the mission screen, where `react-native-vision-camera` streams frames into the `fg-pose` plugin. Vision or ML Kit extracts keypoints on-device, and the plugin's classifier and state machine emit only position-state transitions to JavaScript. When the mission passes, the app cancels the follow-up alarm chain, writes a `mission_result` event to SQLite and, if signed in, sends `POST /alarm-completed` to a Supabase Edge Function. When armed, the app had already sent `POST /alarm-armed` with a deadline. Every minute pg_cron runs `check_partner_deadlines()`, finds armed sessions past their deadline and calls the `notify-partners` Edge Function, which sends Expo pushes to the linked partners. Household data (profiles, check-ins, garden state, coach progress) syncs between SQLite and Postgres through a last-write-wins-per-field sync on an `updated_at` vector, protected by RLS. Purchases go through RevenueCat SDK → App Store / Play. The RevenueCat webhook calls `POST /revenuecat-webhook`, which updates `household.entitlement`, and the app also reads entitlements directly from the RevenueCat SDK, so premium works offline.

---

## 9. API Specifications

All endpoints are Supabase Edge Functions under `https://<project>.supabase.co/functions/v1/`. Plain CRUD (profiles, check-ins, garden, coach progress) goes through supabase-js with RLS and needs no custom endpoint.

#### POST /alarm-armed
**Purpose:** Register an armed Fajr alarm so partners can be notified if the user doesn't check in.
**Authentication:** Required (user JWT)

**Request:**
```json
{
  "profile_id": "uuid — the adult profile",
  "alarm_id": "string — client alarm id",
  "scheduled_at": "ISO-8601 UTC timestamp",
  "deadline_minutes": "integer 5–60, default 15"
}
```
**Response (200):**
```json
{ "session_id": "uuid", "deadline_at": "ISO-8601 UTC timestamp" }
```
**Error responses:**
- 400: invalid payload or `scheduled_at` more than 48 h ahead
- 401: missing or invalid JWT
- 403: profile not in caller's household, or profile is a child
- 409: a session for this `alarm_id` and date already exists (idempotent: returns the existing session)

#### POST /alarm-completed
**Purpose:** Mark the session as completed and stop the partner escalation.
**Authentication:** Required

**Request:**
```json
{
  "session_id": "uuid",
  "completed_at": "ISO-8601 UTC timestamp",
  "mission_type": "stand_perform | steps | math | wudu | ayah",
  "snooze_count": "integer 0–3"
}
```
**Response (200):**
```json
{ "status": "completed", "partners_notified": false }
```
**Error responses:**
- 400: invalid payload
- 401: invalid JWT
- 404: session not found or not owned by caller

#### POST /partner-invite
**Purpose:** Create a single-use invite link for a wake-up partner.
**Authentication:** Required (adult profile, parental gate passed client-side)

**Request:**
```json
{ "profile_id": "uuid" }
```
**Response (200):**
```json
{ "invite_url": "https://fajrgarden.app/i/9Kx2mQ", "expires_at": "ISO-8601 UTC timestamp (+72h)" }
```
**Error responses:**
- 403: profile is a child, or already has 3 partners
- 429: more than 10 invites in 24 h

#### POST /partner-accept
**Purpose:** Accept an invite and create a mutual partner link.
**Authentication:** Required

**Request:**
```json
{ "invite_code": "string", "profile_id": "uuid — accepting adult profile" }
```
**Response (200):**
```json
{ "partner_link_id": "uuid", "partner_display_name": "Omar" }
```
**Error responses:**
- 404: invite not found
- 410: invite expired or already used
- 409: link already exists

#### POST /partner-nudge
**Purpose:** Send one nudge to a partner who hasn't checked in.
**Authentication:** Required

**Request:**
```json
{ "session_id": "uuid" }
```
**Response (200):**
```json
{ "status": "sent" }
```
**Error responses:**
- 403: caller is not a partner of the session owner
- 409: a nudge was already sent for this session
- 422: session already completed

#### POST /revenuecat-webhook
**Purpose:** Keep household entitlements in sync with RevenueCat.
**Authentication:** `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` (env var)

**Request (abridged RevenueCat event):**
```json
{
  "event": {
    "type": "INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION | PRODUCT_CHANGE",
    "app_user_id": "supabase user uuid",
    "product_id": "fg_family_annual",
    "expiration_at_ms": 1795000000000
  }
}
```
**Response (200):**
```json
{ "ok": true }
```
**Error responses:**
- 401: bad secret
- 400: unknown event shape (logged, still returns 200 for unknown event types to avoid retry storms)

#### POST /consent
**Purpose:** Record verifiable parental consent for a child profile.
**Authentication:** Required (adult)

**Request:**
```json
{ "child_profile_id": "uuid", "policy_version": "2026-11-01", "method": "email_plus" }
```
**Response (200):**
```json
{ "consent_id": "uuid", "status": "pending_email_confirmation" }
```
**Error responses:**
- 403: caller is not the household owner
- 404: child profile not found

#### DELETE /account
**Purpose:** Delete the caller's account and, if they own it, the whole household.
**Authentication:** Required, plus a re-authentication token less than 5 min old

**Response (200):**
```json
{ "status": "scheduled", "hard_delete_at": "ISO-8601 UTC timestamp (+30d)" }
```

#### GET /export
**Purpose:** Export all household data as JSON.
**Authentication:** Required (household owner)

**Response (200):** `application/json` file with households, profiles, check-ins, sessions, garden, coach progress, consents.

---

## 10. UI/UX Requirements

### Design language (binding)
- **Sun-phase palette:** the app's base colors follow the real solar phase at the user's location, computed from prayer times. Six token sets: `fajr` (deep indigo → rose dawn), `shuruq` (pale gold), `dhuhr` (clear sand, high-key), `asr` (warm ochre), `maghrib` (copper → plum), `isha` (ink blue, near-black). Tokens interpolate over 20 min around each transition. Every set must pass 4.5:1 text contrast.
- **Materials:** sand `#E9DFCC`, ink `#1B1F2A`, olive wood `#6B5A3E`, zellige turquoise `#2F7F7A`, terracotta `#B5543A`. No purple-to-blue gradients, no glassmorphism blur cards, no neon.
- **Geometry as structure:** layout spacing derives from an 8-fold star construction (base unit 8 pt, scale 8/12/16/24/32/48). Geometric patterns appear only as functional elements (progress rings drawn as girih segments, section dividers), never as wallpaper.
- **Typography:** Quran text in KFGQPC Uthmanic Script Hafs (licensed from the King Fahd Complex, with attribution). Arabic UI in IBM Plex Sans Arabic. Latin UI in a grotesk with real character (e.g. Inter Display is too common: prefer "Söhne", "Geist" or "Satoshi" depending on licensing). Type scale 12/14/16/20/24/32/40.
- **Illustration:** a commissioned human illustrator for plants, garden and coach figures. Coach figures are faceless silhouettes with simple, modest clothing. AI-generated images are banned in assets.
- **Abstract figure mode:** a household setting replaces the coach silhouettes with an abstract pose diagram (joints and lines only, no human form). Egypt's Dar al-Ifta allows two-dimensional drawings for teaching children, while the stricter view associated with Saudi scholars holds that even faceless drawings of living beings are prohibited. Families following the stricter view must be able to use the coach (§18).
- **Motion and haptics:** physics-based springs, 150–300 ms. Every meaningful action has a distinct haptic (check-in = soft, level complete = success pattern, alarm mission pass = rising triple).
- **Icons:** custom 1.5 pt stroke icon set. Emoji are banned as UI icons.
- **Copy tone:** warm, direct, never guilt-tripping ("Your garden rested today" rather than "You broke your streak!").

#### Home (Garden)
**Purpose:** At-a-glance next prayer and the garden.
**Key elements:**
- Next prayer card: name in profile language plus Arabic, time, countdown, check-in button.
- Garden canvas (Skia), with a tap on a plant to see what grew it.
- Fajr protocol status chip: "Armed for 05:42 · Stand & Perform".
- Family strip (if household > 1): small garden thumbnails per member.

**User flow:**
1. User opens the app.
2. The system computes the current sun phase and renders the palette and next prayer.
3. User taps "Check in" after praying, and the garden shows a growth animation and haptic.

**States:**
- Empty state: first launch shows a seedling with "Your garden starts with one Fajr."
- Loading state: none for local data. Remote family thumbnails show skeleton shapes.
- Error state: location unavailable leads to a city search prompt in the prayer card.

#### Fajr Protocol setup
**Purpose:** Configure the Fajr alarm and mission.
**Key elements:** time mode selector, mission picker with preview video for each, snooze slider, partner section, "Test alarm now" button.
**User flow:**
1. User picks "10 min before Fajr".
2. User chooses Stand & Perform. The app runs the placement assistant once to check camera framing in the bedroom.
3. User taps "Test alarm". It rings in 10 s and they complete the mission once.
**States:**
- Empty: default preset "At Fajr · Steps".
- Error: AlarmKit or exact alarm permission denied leads to an explanation and a button to open Settings.

#### Alarm ringing / Mission screen
**Purpose:** Wake the user and verify the mission.
**Key elements:** large current time, Fajr time, mission instructions with a live position indicator (abstract stick figure, not the camera feed by default. The camera preview can be toggled for framing), progress dots for the sequence, fallback mission link after 3 min.
**User flow:**
1. Alarm rings and user taps "Start mission".
2. User props the phone. The system detects the full body and gives a voice prompt: "Stand… raise your hands… bow…".
3. Sequence detected, sound stops, success haptic, then a short dua screen (Alhamdulillah alladhi ahyana…) and a "Check in for Fajr later" prompt.
**States:**
- Too dark: suggest turning on a light, offer Steps.
- Camera permission denied: Steps.

#### Salah Coach (kids)
**Purpose:** Learn a level with live feedback.
**Key elements:** level map (path through the garden), placement assistant, abstract figure demonstrating the target position, the child's live abstract figure side by side, narration controls, parent "unlock" (gated).
**States:**
- Locked level: shows what's needed to unlock.
- Time window closed: "The garden is sleeping. Come back at 7:00."

#### Parent Dashboard
**Purpose:** See children's progress and set rewards. Behind the parental gate.
**Key elements:** child selector, levels progress bar, minutes this week, stuck hints, rewards list, settings (time window, daily cap, check-in visibility).

#### Paywall
**Purpose:** Convert adults to Premium.
**Key elements:** three plan cards (Family highlighted as recommended), a clear trial timeline ("Today: full access · Day 5: reminder · Day 7: billing"), a privacy promise line ("No ads. No data sold. Camera never leaves your phone."), restore, need-based discount link.
**States:** offline leads to "Purchases need a connection". Store error leads to a retry with RevenueCat error code logged.

---

## 11. Data Models

Server (Postgres) models are listed. The client SQLite mirrors them with an additional `dirty` boolean and `synced_at` for sync.

#### households
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | Primary key |
| owner_user_id | uuid | Yes | FK → auth.users |
| madhab | enum(`shafii`,`maliki`,`hanbali`,`hanafi`) | Yes | Default from country |
| entitlement | enum(`free`,`individual`,`family`,`lifetime`) | Yes | Updated by webhook |
| entitlement_expires_at | timestamptz | No | Null for lifetime/free |
| created_at | timestamptz | Yes | |
| deleted_at | timestamptz | No | Soft delete |

#### profiles
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | Primary key |
| household_id | uuid | Yes | FK → households |
| user_id | uuid | No | FK → auth.users. Null for child profiles |
| kind | enum(`adult`,`child`) | Yes | |
| display_name | varchar(20) | Yes | |
| birth_year | smallint | No | Required for children |
| avatar_key | varchar(32) | Yes | From predefined set |
| locale | varchar(8) | Yes | e.g. `fr`, `ar`, `ur` |
| checkins_visible_to_parent | boolean | Yes | Default true if age < 10 |
| created_at / updated_at | timestamptz | Yes | |

#### prayer_settings
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| profile_id | uuid | Yes | PK, FK → profiles |
| method | varchar(24) | Yes | adhan-js method key |
| asr_madhab | enum(`standard`,`hanafi`) | Yes | |
| high_lat_rule | enum(`none`,`middle`,`seventh`,`twilight`) | Yes | |
| offsets_min | jsonb | Yes | `{fajr:0,dhuhr:0,...}` |
| location_mode | enum(`gps`,`city`) | Yes | |
| city_id | varchar(16) | No | GeoNames id |
| updated_at | timestamptz | Yes | |

Precise coordinates are **not** stored server-side. Only a city id is stored, if the user chose city mode.

#### alarm_configs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| profile_id | uuid | Yes | FK → profiles (adult) |
| mode | enum(`at_fajr`,`before_fajr`,`before_sunrise`,`fixed`) | Yes | |
| offset_min | smallint | Yes | 0–60 |
| fixed_time | time | No | |
| mission | enum(`stand_perform`,`steps`,`math`,`wudu`,`ayah`) | Yes | |
| snooze_max | smallint | Yes | 0–3 |
| snooze_min | smallint | Yes | 3–9 |
| partner_deadline_min | smallint | Yes | 5–60, default 15 |
| enabled_days | smallint | Yes | Bitmask Mon–Sun |
| updated_at | timestamptz | Yes | |

#### alarm_sessions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| profile_id | uuid | Yes | FK → profiles |
| alarm_client_id | varchar(64) | Yes | Unique with `fajr_date` |
| fajr_date | date | Yes | Local Fajr day |
| scheduled_at | timestamptz | Yes | |
| deadline_at | timestamptz | Yes | |
| status | enum(`armed`,`completed`,`expired`,`cancelled`) | Yes | |
| mission_type | varchar(16) | No | |
| snooze_count | smallint | No | |
| completed_at | timestamptz | No | |
| partners_notified_at | timestamptz | No | |

**Indexes:** `(deadline_at) WHERE status='armed'` for the cron scan, and `UNIQUE(profile_id, alarm_client_id, fajr_date)`.

#### partner_links
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| profile_a | uuid | Yes | FK → profiles (adult) |
| profile_b | uuid | Yes | FK → profiles (adult) |
| status | enum(`active`,`paused`,`removed`) | Yes | |
| paused_until | timestamptz | No | |
| created_at | timestamptz | Yes | |

**Constraint:** `profile_a < profile_b` (canonical order), unique pair.

#### partner_invites
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | varchar(12) | Yes | PK, random base62 |
| inviter_profile_id | uuid | Yes | |
| expires_at | timestamptz | Yes | +72 h |
| used_at | timestamptz | No | |

#### prayer_checkins
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| profile_id | uuid | Yes | |
| fajr_date | date | Yes | Islamic-day key |
| prayer | enum(`fajr`,`dhuhr`,`asr`,`maghrib`,`isha`) | Yes | |
| state | enum(`on_time`,`late`,`missed`,`made_up`) | Yes | |
| recorded_at | timestamptz | Yes | |

**Indexes:** `UNIQUE(profile_id, fajr_date, prayer)`.

#### coach_progress
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| profile_id | uuid | Yes | PK part |
| level_id | varchar(16) | Yes | PK part, e.g. `L06_ruku` |
| status | enum(`locked`,`unlocked`,`completed`) | Yes | |
| attempts | smallint | Yes | |
| best_accuracy | real | No | 0–1, aggregate only |
| content_version | varchar(16) | Yes | |
| completed_at | timestamptz | No | |

#### garden_state
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| profile_id | uuid | Yes | PK |
| plants | jsonb | Yes | `[{species, stage, planted_on, source}]` |
| streak_days | integer | Yes | Cached output of `computeStreak` |
| freezes_left | smallint | Yes | Resets monthly |
| exemption_until | timestamptz | No | Private, owner-only RLS |
| updated_at | timestamptz | Yes | |

#### consent_records
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| child_profile_id | uuid | Yes | |
| guardian_user_id | uuid | Yes | |
| method | varchar(16) | Yes | `email_plus` |
| policy_version | varchar(16) | Yes | |
| status | enum(`pending`,`granted`,`revoked`) | Yes | |
| created_at / confirmed_at | timestamptz | Yes / No | |

#### push_tokens
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | |
| profile_id | uuid | Yes | Adults only |
| expo_token | text | Yes | |
| platform | enum(`ios`,`android`) | Yes | |
| updated_at | timestamptz | Yes | |

**Relationships:**
- households 1—N profiles. profiles 1—1 prayer_settings, 1—N alarm_configs, 1—N alarm_sessions, 1—N prayer_checkins, 1—N coach_progress, 1—1 garden_state.
- profiles N—N profiles through partner_links (adults only, enforced by trigger).
- profiles (child) 1—N consent_records.

---

## 12. Integration Points

#### Apple AlarmKit (iOS 26+)
**Purpose:** True alarms that ring through silent mode and Focus.
**Integration type:** Native SDK (Swift, via Expo module `fg-alarm`).
**Data exchanged:** outbound alarm schedule and presentation. Inbound alarm state updates and App Intent invocations (secondary button).
**Authentication:** user authorization (`AlarmManager.requestAuthorization`).
**Fallback behavior:** on denial or iOS < 26, time-sensitive notifications with a repeated sound (FR-006) and a persistent in-app banner.

#### Android AlarmManager + full-screen intent
**Purpose:** Exact alarms that show over the lock screen.
**Integration type:** Native SDK (Kotlin).
**Authentication:** `USE_EXACT_ALARM` (alarm-clock apps), `USE_FULL_SCREEN_INTENT`, `POST_NOTIFICATIONS`.
**Fallback behavior:** if full-screen intent is revoked, a high-priority heads-up notification with sound and a deep link to the mission. The user is shown how to re-grant it.

#### Apple Vision / Google ML Kit
**Purpose:** On-device pose detection and image labeling.
**Integration type:** Native SDK in a frame-processor plugin.
**Data exchanged:** none leaves the device.
**Fallback behavior:** if a device can't sustain 8 fps, missions fall back to Steps and the coach shows a "this device is too slow for live feedback" mode with guided video only.

#### Supabase
**Purpose:** Auth, Postgres, Edge Functions, pg_cron.
**Integration type:** REST/Realtime via supabase-js, plus Edge Functions.
**Authentication:** user JWT. Service role only inside Edge Functions.
**Rate limits:** Edge Functions rate-limited per user (invites 10/24 h, nudges 1/session).
**Fallback behavior:** the app is local-first, so writes queue in SQLite and sync with exponential backoff (1 s → 5 min, jittered).

#### RevenueCat
**Purpose:** Subscriptions and entitlements across stores.
**Integration type:** SDK plus webhook.
**Data exchanged:** outbound app user ID (Supabase UUID, no email). Inbound entitlements and webhook events.
**Authentication:** public SDK key in the app. Webhook bearer secret in env.
**Fallback behavior:** cached entitlement (SDK cache) honored for up to 7 days offline.

#### Expo Push (APNs / FCM)
**Purpose:** Partner alerts and nudges.
**Integration type:** REST from Edge Functions.
**Data exchanged:** Expo token and minimal message text. No prayer data in the payload beyond "hasn't checked in yet".
**Fallback behavior:** on failure, retry 3 times over 2 min. Invalid tokens are deleted on `DeviceNotRegistered`.

#### Quran Foundation API (v1.1, not MVP)
**Purpose:** Quran text and audio for future Qaida/Quran paths.
**Fallback behavior:** bundled text for the surahs used in the coach (al-Fatiha, al-Ikhlas, al-Falaq, an-Nas, al-Kawthar, al-Asr), so v1 has no runtime dependency.

---

## 13. Edge Cases & Error Handling

#### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User travels across timezones overnight | Alarms recompute on timezone change. If Fajr has already passed in the new zone, the alarm is skipped and the user is notified. The streak uses the local Fajr day of check-in. |
| Polar day/night (e.g. Tromsø in June: no true Fajr) | The high-latitude rule produces a time. The UI shows "Estimated (high latitude)" next to times. |
| DST change on the night of the alarm | The alarm is scheduled in absolute UTC computed after the DST rule. Covered by tests for EU and US DST dates. |
| Phone dies or is off at alarm time | Android re-schedules on boot. If the alarm time has passed by < 10 min, it rings immediately. The partner deadline still triggers server-side. |
| User force-quits the app (iOS) | AlarmKit alarms still fire (system-owned). The follow-up chain is already scheduled. |
| Room is dark | Luminance check, then the "Turn on a light" prompt, and Steps is offered after 20 s. |
| Two people in camera frame | Track the largest/closest skeleton. If identity flips, reset the sequence progress. |
| Child tries to unlock levels or buy | Parental gate. Failed gate attempts don't lock the device but rate-limit (3 tries, then a 1 min wait). |
| Partner has uninstalled the app | Push fails with `DeviceNotRegistered`, the token is deleted, and after 7 days with no tokens the link shows "inactive" to the other side. |
| User in exemption mode gets a partner deadline | Sessions aren't armed during exemption or pause, so partners receive nothing. |
| Subscription lapses | Premium features lock gracefully. Gardens and progress are kept and visible. Premium missions fall back to Steps the same night. |
| Clock manipulation to cheat the streak | Streak uses server-confirmed timestamps when online and accepts local timestamps offline, with a ±10 min tolerance on sync. Gaming the streak only "cheats" oneself, so there is no aggressive anti-cheat. |
| Very loose clothing hides joints | Classifier relies on shoulder, hip and head keypoints with knee angle as optional. If confidence < 0.5 for > 3 s, show "Move a little further from the phone". |

#### Error Handling Strategy
- **User-facing errors:** inline, plain-language, in the profile language, always with a next action (retry, open Settings, use another mission). Never a raw error code except in a "details" disclosure.
- **System errors:** Sentry (adult sessions only, PII scrubbed). Edge Function errors are logged with request id. Alerts fire when the alarm-armed/completed endpoint error rate is > 1% over 5 min.
- **Retry logic:** sync and API calls use exponential backoff with jitter (max 5 min, unlimited attempts while online). Push retries 3 times. The webhook is idempotent on RevenueCat event id.
- **Graceful degradation:** with no network, everything except sync, partners and purchases works. With no camera, Steps or Math replace it. With no motion sensor, Math. With no location, city search.

---

## 14. Testing Requirements

#### Unit Tests (Jest + ts-jest)
- `lib/prayer` — times for a matrix of 30 cities × 4 dates (equinoxes, solstices) × all supported methods vs reference timetables (official sources: Umm al-Qura for Mecca, Diyanet for Istanbul, UOIF/Grande Mosquée timetables for Paris and Lyon, Habous ministry for Casablanca, ISNA tables for Toronto, MUIS for Singapore, JAKIM for Kuala Lumpur, Kemenag for Jakarta, plus London/Oslo/Tromsø for high latitudes). Tolerance: ≤ 1 min for 95%, ≤ 2 min for all.
- `lib/qibla` — bearing for 20 cities within ±0.5°.
- `lib/streak` — `computeStreak` with ≥ 95% branch coverage: freezes, qada within/after 24 h, exemption, travel across 3 timezones, DST, month boundary freeze reset.
- `lib/alarm/schedule` — next-7-days computation, follow-up chain generation, cancel logic.
- `native/fg-pose` classifier — angle-based classifier on recorded keypoint fixtures (JSON, no images) for each state.
- `lib/i18n` — every key exists in EN/FR/AR (fail CI on missing). Plurals for AR (6 forms).

#### Integration Tests
- Supabase RLS — pgTAP tests: a user can't read another household. Partners only see `partner_status`. A child profile has no direct access.
- Edge Functions — Deno tests for each endpoint including all error codes and idempotency.
- Partner deadline cron — seeded armed sessions past deadline produce exactly one push call per partner (Expo mock).
- RevenueCat webhook — each event type maps to the correct entitlement.
- Privacy — a proxy-based test (mitmproxy in CI on an Android emulator) runs a full mission and coach session and asserts no request body > 2 KB and no body containing image/audio MIME types or keypoint arrays.

#### E2E Tests (Maestro on real devices)
- Onboarding → arm Fajr alarm → test alarm rings → complete Steps mission → garden grows.
- Kids: create child profile → consent → complete coach level 1 → parent dashboard shows completion.
- Purchase in sandbox (StoreKit testing / Play test track) → premium unlocked → restore on second device.
- RTL: full onboarding in Arabic with screenshot comparison.

#### Device / Reliability Tests (manual plus scripted, before each release)
- Alarm matrix: iPhone (iOS 26, 27) × {silent switch on, Focus on, Low Power Mode, app force-quit}. Android {Pixel 8 (Android 15/16), Samsung A-series (One UI battery optimization), Xiaomi (MIUI/HyperOS autostart restrictions), Oppo/Realme} × {DND, battery saver, app swiped away, reboot}. Pass criterion: 100 scheduled alarms per device class, ≥ 99.9% fired within ±5 s (overall), zero silent failures without a user-visible warning.
- Pose validation set: ≥ 60 consenting participants (30 adults, 30 children aged 6–12 with parental consent), recorded **by the team in a controlled study** with signed releases, covering 3 lighting conditions (daylight, warm lamp, dim), 4 clothing types (fitted, thobe, abaya/jilbab, hoodie), and 3 phone placements. Recordings are used only offline to evaluate the on-device classifier and stored encrypted, never in the app. Pass criterion: per-state F1 targets in FR-009, rak'ah count ≥ 98% in FR-011.

#### Performance Tests
- Cold start ≤ 1.5 s (reference devices), measured via Flashlight (Android) and Xcode Instruments (iOS).
- Pose pipeline fps and battery drain per FR-009 on 3 reference devices.
- Garden frame times at 60 fps with 40 plants.
- Partner cron: 100k armed sessions with 10% expired processed in < 30 s.

---

## 15. Implementation Notes for AI

#### Build Order
1. **Repo setup:** Expo app (TypeScript strict, Expo Router), ESLint + Prettier, Jest, i18n scaffold with EN/FR/AR and RTL switch, design tokens package (sun-phase palettes plus contrast test).
2. **Prayer core (pure TS):** `lib/prayer` with adhan-js, method defaults, high-latitude handling, and the full reference test matrix. Write the failing tests first.
3. **Streak core (pure TS):** `computeStreak` with tests first.
4. **Local DB:** expo-sqlite + Drizzle schema mirroring §11.
5. **Home and prayer UI:** next prayer card, check-in, sun-phase theming, city search, qibla.
6. **`fg-alarm` native module:** AlarmKit (iOS) and AlarmManager/full-screen activity (Android), with the follow-up chain. Build the device test harness ("Test alarm in 10 s").
7. **Missions:** Math → Steps → `fg-pose` plugin + Stand & Perform.
8. **Garden (Skia):** placeholder shapes first, replaced by illustrator assets when delivered.
9. **Supabase:** schema migrations, RLS plus pgTAP tests, auth, sync engine.
10. **Partners:** Edge Functions, pg_cron, Expo push.
11. **Kids:** profiles, consent, parental gate, coach path levels 1–12, parent dashboard.
12. **RevenueCat:** products, paywall, entitlements gating, webhook.
13. **Privacy center, export, delete account.**
14. **P1/P2 features:** UR/TR/ID, widgets, Wudu mission, rak'ah companion, discounts.
15. **Hardening:** device matrix, pose validation study, performance passes, store submission.

#### File Structure Suggestion
```
/app                      # Expo Router routes
  /(tabs)/index.tsx       # Garden home
  /(tabs)/prayers.tsx
  /(tabs)/coach.tsx
  /fajr/setup.tsx
  /fajr/mission.tsx
  /parent/*.tsx           # behind parental gate
  /paywall.tsx
/src
  /components             # UI primitives (Button, Card, PrayerCard…)
  /features
    /prayer               # times, notifications, qibla
    /alarm                # scheduling, follow-up chain, mission orchestration
    /missions             # math, steps, standPerform, wudu
    /coach                # levels, content, feedback copy
    /garden               # Skia scene, growth rules
    /family               # profiles, consent, parental gate
    /partners
    /purchases
  /lib
    /prayer               # pure TS, 100% tested
    /streak               # pure TS, 100% tested
    /sync
    /db                   # drizzle schema, migrations
  /theme                  # tokens, sun-phase interpolation, typography
  /i18n                   # locales/en.json, fr.json, ar.json, ur.json, tr.json, id.json
/modules
  /fg-alarm               # Expo module: ios/ (Swift, AlarmKit), android/ (Kotlin)
  /fg-pose                # frame processor plugin: Vision / ML Kit + classifier
  /fg-label               # image labeling for Wudu
/supabase
  /migrations
  /functions              # alarm-armed, alarm-completed, partner-*, revenuecat-webhook, consent, account, export
  /tests                  # pgTAP
/e2e                      # Maestro flows
```

#### Critical Implementation Details
- **Camera privacy is non-negotiable:** the frame processor returns only `{state, confidence}` to JS. Never call `takePhoto`, never write frames, never log keypoints. Add a lint rule banning `takePhoto` and `recordVideo` imports outside a whitelist (none in v1).
- **iOS cannot block the AlarmKit Stop button.** Enforce missions through the pre-scheduled follow-up alarm chain that only mission completion cancels. Don't promise users an "undismissable" alarm on iOS. Say "keeps ringing until you complete your mission".
- **Android OEM battery killers** (Xiaomi, Oppo, Samsung): add a guided "Make alarms reliable" screen that deep-links to each OEM's autostart/battery settings (use the dontkillmyapp.com patterns). Use `setAlarmClock()`, not `setExactAndAllowWhileIdle()`.
- **All times in UTC internally.** Convert to local only for display. The "Fajr day" key is computed once in `lib/prayer/fajrDay.ts` and reused everywhere.
- **Pose classification is angle-based** with per-state thresholds in a single config file (`modules/fg-pose/config.json`), so tuning doesn't require native rebuilds (load it at runtime).
- **Hysteresis:** a state must hold ≥ 400 ms. Sujood detection needs a side-view placement, so the placement assistant must check the body bounding box aspect ratio.
- **Entitlement checks** go through one hook `useEntitlement()` reading the RevenueCat SDK cache. The server-side `households.entitlement` is only for partner features enforcement in Edge Functions.
- **RLS first:** write the RLS policies and pgTAP tests in the same migration as each table.
- **No guilt UX:** every copy string about missed prayers goes through the content review checklist (tone: mercy, never shame).
- **Licensed assets only:** KFGQPC font, recitation audio and adhan recordings must have written licenses stored in `/legal/licenses/`.

#### Code Style Preferences
- TypeScript strict, no `any` (lint error). Zod for all external input.
- React function components with hooks. Feature folders own their state (Zustand stores per feature, TanStack Query for server state).
- Naming: `camelCase` functions, `PascalCase` components, `kebab-case` file names for routes, `snake_case` in SQL.
- Pure logic in `/src/lib` with no React imports, so it's testable in Node.
- Swift and Kotlin modules follow the platform style guides. Each native module exposes a typed TS interface in `modules/*/src/index.ts`.

#### Libraries to Use
- `adhan` for prayer times — battle-tested, offline, supports all major methods.
- `react-native-vision-camera` for frame processors — the only mature real-time camera pipeline for RN.
- `@shopify/react-native-skia` for the garden and geometric UI — GPU rendering, 60 fps, no WebView.
- `react-native-reanimated` for UI-thread animations.
- `expo-sqlite` + `drizzle-orm` for local-first storage — typed, migrations.
- `@supabase/supabase-js` for backend access.
- `react-native-purchases` (RevenueCat) for cross-store subscriptions.
- `i18next` / `react-i18next` for i18n with ICU plurals (Arabic has 6 plural forms).
- `zod` for validation.
- `maestro` for E2E, `jest` for unit tests, `pgTAP` for database tests.

#### Libraries to Avoid
- Any ad SDK (AdMob, Unity Ads, AppLovin) — against the product principles and Families Policy.
- Third-party analytics or attribution SDKs (Firebase Analytics, Amplitude, AppsFlyer, Adjust, Meta SDK) — data-sharing risk and child privacy.
- `react-native-push-notification` and other unmaintained alarm/notification libraries — unreliable on modern Android. Use the custom `fg-alarm` module plus `expo-notifications`.
- Cloud vision or LLM APIs for mission verification — violates the on-device promise.
- `moment` — use `date-fns` / `date-fns-tz` or Temporal polyfill.

#### Common Pitfalls
- **iOS pending notification limit (64):** schedule at most 7 days ahead and refresh with background tasks.
- **Android 14+ full-screen intent permission** can be revoked by the user. Check it on every app open and surface a fix.
- **Exact alarm permission** (`SCHEDULE_EXACT_ALARM` may be denied). Use `USE_EXACT_ALARM`, which alarm-clock apps are allowed to declare, and justify it in the Play Console declaration.
- **RTL bugs:** use `start/end`, never `left/right`, in styles. Icons with direction need `transform: [{scaleX: -1}]` in RTL.
- **Arabic text shaping:** never split Arabic strings for styling mid-word. Quran text must never be auto-hyphenated or letter-spaced.
- **High-latitude prayer times** silently produce NaN without a rule set, so always set a high-latitude rule above 48°.
- **Child data leaking via crash reports:** disable Sentry in child sessions.
- **Pose bias:** validate across ages, body types and clothing before claiming accuracy publicly.

#### Testing Approach
- Write tests first for `lib/prayer`, `lib/streak`, `lib/alarm/schedule`, the pose classifier (on keypoint fixtures), RLS policies and Edge Functions. These are high-risk and pure.
- Light snapshot tests for UI primitives. Skip unit tests for simple presentational screens and rely on Maestro E2E plus RTL screenshot diffs.
- Device matrix tests for alarms are mandatory before every release. Alarms are the product's promise.

---

## 16. Assumptions & Open Questions

**Assumptions made in this PRD:**
- iOS 26 is installed on the majority of active iPhones at launch, so AlarmKit is the primary path and older iOS gets a degraded fallback.
- Prices are in USD and localized via store price tiers. Exact regional prices are to be set with the pricing review.
- The app is listed in a general category with parent-managed child profiles rather than the Apple Kids Category.
- UR/TR/ID ship in v1.0 if translations are ready, otherwise in v1.0.x.
- "Fajr Garden" is a working title, pending trademark search and domain availability.

**Open questions:**
1. Who sits on the scholarly advisory board, and which madhab variants are covered at launch? Proposal (§18): at least one scholar trained in each of the three main reference traditions of the launch markets: Maliki (Morocco), Azhari, Shafi'i or Hanafi (Egypt), Hanbali (Saudi Arabia).
2. Which reciter and adhan recordings will be licensed?
3. Is the follow-up alarm chain on iOS acceptable to App Review? Validate early with a TestFlight build.
4. Does the tarteel-ai Whisper checkpoint's license allow commercial on-device use (needed for FR-021)?
5. Should wake-up partners be possible between a parent and a teenage child (13+) in the same household?
6. Before Ramadan 1448, the advisory board must verify every reference in the FR-022 evidence table word for word, and approve the wording on qiyam rak'ah counts. Can that review be completed by mid-January 2027?
7. The board must also rule on three framings added in v1.2: an authentic source (if any) for presenting 40 days as meaningful (FR-028), the wording explaining why no vows or pledges are used (FR-027), and the midday rest suggestion in Ramadan (FR-026).

---

## 17. Research Basis (added in v1.2)

The behavior-design choices above rest on the following findings. Evidence strength varies, as noted.

| Finding | Source | Strength | Used in |
|---------|--------|----------|---------|
| Automaticity took 66 days on average (range 18–254). Early repetitions gave the largest gains. One missed day had little effect, repeated misses lowered the ceiling | Lally et al., 2010, *European Journal of Social Psychology* | Peer-reviewed, 96 participants, self-reported automaticity | FR-014, FR-028 |
| People are more likely to start goals at temporal landmarks | Dai, Milkman and Riis, 2014, *Management Science* | Peer-reviewed | FR-024 |
| If-then plans improve goal attainment: d = 0.65 (2006), 0.15–0.35 after bias correction (2024) | Gollwitzer and Sheeran 2006; Sheeran, Listrom and Gollwitzer 2024 | Meta-analyses | FR-023 |
| Lapses can trigger giving up entirely (abstinence violation effect) | Polivy and Herman 1985; Curry, Marlatt and Gordon 1987 | Peer-reviewed, diet and addiction context | FR-014 |
| Islamic apps support short-term tracking but rarely long-term motivation; gratitude and reflection recommended | *International Journal of Human–Computer Interaction*, 2025 | Peer-reviewed, small qualitative sample | FR-025, design principles |
| Prayer reminders improved punctuality but barely improved khushoo | Survey of 34 Muslim university students | Small survey | FR-025 |
| Snooze alarms prolong sleep inertia | *Journal of Physiological Anthropology*, 2022 | Peer-reviewed, small samples | FR-008, FR-026 |
| Sleep regularity predicts health outcomes beyond duration | Large wearable cohort (about 61,000 people), reported secondhand | To verify against the original paper | FR-026 |
| Ramadan delays bedtime and shortens total sleep | Saudi polysomnography study, 2013; later meta-analysis | Peer-reviewed | FR-026 |
| Rewards promised in advance can undermine children's intrinsic motivation; verbal praise increases it | Lepper, Greene and Nisbett, 1973; later meta-analyses | Peer-reviewed, debated scope | FR-010, FR-015 |
| Writing goals and reporting progress to a friend gave the highest self-rated progress | Matthews, Dominican University | Self-rated, not peer-reviewed | FR-008, FR-027 |
| Separating the daily goal from the streak raised D14 retention by 3.3%; a streak commitment raised D7 retention | Duolingo product blog | Company-reported A/B tests | FR-023, FR-027 |
| D30 retention medians: about 3–4% (health), 2–8% (education); push opt-in about 49% iOS, 53% Android | Braze, UXCam, Airship industry reports | Vendor data | §3, FR-004 |

---

## 18. Country Positions: Morocco, Saudi Arabia, Egypt (added in v1.3)

Research into the official bodies of the three reference countries, on every religious question the product touches. "Primary" means an official body's own publication; "secondary" means a news report or reposting; the board must confirm everything before release.

| Topic | Morocco | Saudi Arabia | Egypt | Product decision |
|-------|---------|--------------|-------|------------------|
| Prayer time angles | Ministry of Habous: Fajr 19°, Isha 17°, plus 5 min on Dhuhr and Maghrib (angles in technical references; the minute adjustments only in secondary sources, official timetable not reachable) | Umm al-Qura: Fajr 18.5°, Isha 90 min after Maghrib, 120 min in Ramadan (secondary sources consistent) | Egyptian General Authority for Survey: Fajr 19.5°, Isha 17.5°. Dar al-Ifta publicly defends 19.5° against claims that Fajr is announced too early (primary) | Default method per country (implemented). Keep the ±30 min per-prayer offset for users who follow a different local timetable. Verify Morocco's minute adjustments against the official Habous timetable before launch |
| Start of Ramadan | Own national crescent sighting; often one day after Saudi Arabia and Egypt | Crescent sighting announced officially; Umm al-Qura calendar is a civil calendar, not the Ramadan decision | Dar al-Ifta announces from sighting supported by astronomical calculation | FR-022: official announcement per country, prediction shown as "expected", user confirmation and remote dates |
| Number of taraweeh rak'ahs | No primary source found | Permanent Committee: the Prophet ﷺ usually prayed 11, there is no fixed number and praying more is fine (secondary report of the fatwa) | Dar al-Ifta: 20 rak'ahs plus witr; Ministry of Awqaf (2025): 20 in major mosques, 8 in others (primary and news) | No rak'ah count is tracked or suggested (already in FR-022). The evidence card presents 11 as the Prophet's ﷺ usual practice and 20 as the practice established under 'Umar, without preferring either |
| Zakat al-Fitr payment | Higher Council of Ulema: food or cash, 25 MAD per person for 1447 / 2026 (news reports of the council's statement) | Food, per the view associated with Ibn Baz (secondary; Permanent Committee text not found) | Dar al-Ifta: cash allowed; EGP 35 minimum per person for 2026 (primary) | Zakat reminder shows the official amount and form for the household's country; the amount is configured remotely each year |
| Drawings of people for children | No primary source found | Stricter view: drawings of living beings prohibited, faceless ones included, with an exception for children's toys (secondary) | Dar al-Ifta: two-dimensional drawings allowed for teaching children (primary) | Abstract figure mode (§10) |
| Counting worship with an app | — | Scholars differ on counting devices for dhikr; principle that acts of worship follow what is prescribed (secondary, IslamQA) | — | The app never counts or scores worship (already a product principle); only private check-ins of consistency |
| Vows (nadhr) as commitment devices | Sunni consensus text: "it brings no good; it only extracts from the miser" (Muslim 1639, Bukhari 6608, checked) | same | same | FR-027 uses no vows or pledges |
| 40-day framing | Tirmidhi 241: grading disputed | same | same | FR-028 presented as habit science only |
| Midday nap hadith | Not verified | — | — | FR-026: health framing only |

**Proposed advisory board:** one scholar from each tradition above, ideally with links to Morocco's Higher Council of Ulema or the Rabita Mohammadia des Oulémas, to Al-Azhar or Dar al-Ifta in Egypt, and to a Saudi university faculty of Sharia. The board signs off on the evidence cards, the zakat guidance, the taraweeh wording and the abstract figure mode.

