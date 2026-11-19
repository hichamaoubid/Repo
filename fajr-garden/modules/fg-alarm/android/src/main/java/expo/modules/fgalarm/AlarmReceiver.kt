package expo.modules.fgalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Fired by AlarmManager: starts the ringing service (allowed from the background for exact alarms). */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val alarm = AlarmStore(context).get(id) ?: return // cancelled in the meantime
    ContextCompat.startForegroundService(context, RingingService.startIntent(context, alarm))
  }
}
