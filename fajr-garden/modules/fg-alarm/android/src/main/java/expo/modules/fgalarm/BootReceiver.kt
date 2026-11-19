package expo.modules.fgalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * AlarmManager loses everything on reboot, and a clock or time zone change can shift
 * delivery. Re-arm the stored alarms; ring right away for one missed by under 10 minutes
 * (e.g. the phone restarted at Fajr time).
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val store = AlarmStore(context)
    val now = System.currentTimeMillis()
    val alarms = store.all()
    val expired = alarms.filter { it.fireAt < now - MISSED_GRACE_MS }
    store.remove(expired.map { it.id })

    val missed = alarms.filter { it.fireAt in (now - MISSED_GRACE_MS)..now }.maxByOrNull { it.fireAt }
    alarms.filter { it.fireAt > now }.forEach { AlarmScheduler.schedule(context, it) }
    if (missed != null && intent.action == Intent.ACTION_BOOT_COMPLETED) {
      ContextCompat.startForegroundService(context, RingingService.startIntent(context, missed))
    }
  }

  companion object {
    private const val MISSED_GRACE_MS = 10 * 60 * 1000L
  }
}
