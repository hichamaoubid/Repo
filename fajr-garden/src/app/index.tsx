import { formatInTimeZone } from "date-fns-tz";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { GardenView } from "../features/garden/GardenView";
import { CheckinCard } from "../features/habits/CheckinCard";
import { useFajrProgress } from "../features/habits/useFajrProgress";
import { useFajrLog } from "../features/habits/useFajrLog";
import {
  NO_LOCATION_PALETTE,
  usePrayerDay,
  type PrayerDay,
} from "../features/home/usePrayerDay";
import { useNow } from "../features/home/useNow";
import { useSettings } from "../features/settings/useSettings";
import { formatCountdown } from "../i18n/format";
import type { TimeName } from "../lib/prayer";
import type { AppSettings } from "../lib/settings";
import { fontSize, radius, space } from "../theme/tokens";

const ROWS: TimeName[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export default function HomeScreen() {
  const { t } = useTranslation();
  const now = useNow();
  const settings = useSettings();
  const day = usePrayerDay(settings, now);
  const palette = day?.palette ?? NO_LOCATION_PALETTE;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <StatusBar style={palette.scheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              style={styles.settingsLink}
              hitSlop={8}
            >
              <Text style={[styles.link, { color: palette.text }]}>
                {t("home.openSettings")}
              </Text>
            </Pressable>
          </Link>
        </View>

        {!day ? (
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: palette.text }]}
            >
              {t("home.setLocationTitle")}
            </Text>
            <Text style={[styles.body, { color: palette.textMuted }]}>
              {t("home.setLocationBody")}
            </Text>
            <Button
              label={t("settings.useMyLocation")}
              palette={palette}
              onPress={() => router.push("/settings")}
            />
            <Button
              label={t("settings.searchCity")}
              palette={palette}
              variant="secondary"
              onPress={() => router.push("/city-search")}
            />
          </View>
        ) : (
          <TodayView day={day} now={now} settings={settings} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayView({
  day,
  now,
  settings,
}: {
  day: PrayerDay;
  now: Date;
  settings: AppSettings;
}) {
  const { t } = useTranslation();
  const progress = useFajrProgress(day.location, now);
  const hasLog = useFajrLog().length > 0;
  const { garden } = progress;
  const { next, times, location, palette } = day;
  const hhmm = (d: Date) => formatInTimeZone(d, location.timeZone, "HH:mm");
  const minutes = Math.max(
    0,
    Math.round((next.time.getTime() - now.getTime()) / 60_000),
  );
  const countdown = formatCountdown(t, minutes);
  return (
    <>
      <View
        style={[
          styles.card,
          styles.heroCard,
          { backgroundColor: palette.surface },
        ]}
        accessible
        accessibilityLabel={`${t("home.nextPrayer")}: ${t(`prayer.${next.name}`)} ${hhmm(next.time)}, ${countdown}`}
      >
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>
          {t("home.nextPrayer")}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.hero, { color: palette.text }]}
        >
          {t(`prayer.${next.name}`)}
        </Text>
        <Text style={[styles.time, { color: palette.text }]}>
          {hhmm(next.time)}
        </Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>
          {countdown}
        </Text>
      </View>

      <View style={styles.list}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t(day.isTomorrow ? "home.tomorrow" : "home.today")}
        </Text>
        {ROWS.map((row) => {
          const isNext = row === next.name;
          const color = isNext ? palette.onAccent : palette.text;
          return (
            <View
              key={row}
              style={[
                styles.row,
                isNext && { backgroundColor: palette.accent },
              ]}
            >
              <Text style={[styles.body, { color }]}>{t(`prayer.${row}`)}</Text>
              <Text style={[styles.body, styles.tabular, { color }]}>
                {hhmm(times[row])}
              </Text>
            </View>
          );
        })}
        {times.estimated && (
          <Text style={[styles.caption, { color: palette.textMuted }]}>
            {t("home.estimated")}
          </Text>
        )}
      </View>

      <CheckinCard
        location={location}
        prayer={settings.prayer}
        now={now}
        progress={progress}
        palette={palette}
      />

      <GardenView garden={garden} palette={palette} />
      <Text style={[styles.body, styles.garden, { color: palette.text }]}>
        {!hasLog
          ? t("garden.empty")
          : garden.resting
            ? t("garden.welcomeBack")
            : t("garden.thisMonth", { count: garden.keptThisMonth })}
      </Text>
      <Text style={[styles.caption, { color: palette.textMuted }]}>
        {t("home.timesFor", { city: location.label })}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: space.md,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: space.xs,
  },
  settingsLink: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: fontSize.body, textDecorationLine: "underline" },
  card: { borderRadius: radius.md, padding: space.lg, gap: space.sm },
  // alignItems flex-start = the start edge, i.e. right in RTL, whatever the text's own direction
  heroCard: { alignItems: "flex-start", gap: space.xs },
  title: { fontSize: fontSize.heading, fontWeight: "600" },
  eyebrow: {
    fontSize: fontSize.small,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  hero: { fontSize: fontSize.hero, fontWeight: "600" },
  time: { fontSize: fontSize.display, fontVariant: ["tabular-nums"] },
  list: { gap: space.xs },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "600",
    marginBottom: space.xs,
  },
  // paddingStart/End follow the layout direction, so rows mirror correctly in RTL
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: space.sm,
    paddingStart: space.md,
    paddingEnd: space.md,
    borderRadius: radius.sm,
  },
  body: { fontSize: fontSize.body },
  tabular: { fontVariant: ["tabular-nums"] },
  caption: { fontSize: fontSize.caption },
  garden: { textAlign: "center", marginTop: space.md },
});
