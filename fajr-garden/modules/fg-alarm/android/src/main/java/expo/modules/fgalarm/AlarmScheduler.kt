package expo.modules.fgalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build

/** Thin wrapper over AlarmManager.setAlarmClock: exact, shown in the status bar, Doze-proof. */
object AlarmScheduler {
  const val EXTRA_ALARM_ID = "expo.modules.fgalarm.ALARM_ID"
  private const val ACTION_FIRE = "expo.modules.fgalarm.FIRE"

  fun canScheduleExact(context: Context): Boolean {
    val am = context.getSystemService(AlarmManager::class.java)
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
  }

  fun schedule(context: Context, alarm: StoredAlarm) {
    val am = context.getSystemService(AlarmManager::class.java)
    val info = AlarmManager.AlarmClockInfo(alarm.fireAt, showIntent(context))
    am.setAlarmClock(info, firePendingIntent(context, alarm.id))
  }

  fun cancel(context: Context, id: String) {
    val am = context.getSystemService(AlarmManager::class.java)
    am.cancel(firePendingIntent(context, id))
  }

  /** The data URI makes each alarm's PendingIntent distinct without relying on request codes. */
  private fun firePendingIntent(context: Context, id: String): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction(ACTION_FIRE)
      .setData(Uri.parse("fgalarm://alarm/" + Uri.encode(id)))
      .putExtra(EXTRA_ALARM_ID, id)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /** Tapping the alarm icon in the status bar opens the app. */
  private fun showIntent(context: Context): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(Intent.ACTION_MAIN).setPackage(context.packageName)
    return PendingIntent.getActivity(context, 1, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
}
