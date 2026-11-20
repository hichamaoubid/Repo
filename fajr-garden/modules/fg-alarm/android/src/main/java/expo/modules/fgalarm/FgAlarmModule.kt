package expo.modules.fgalarm

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AlarmSpec : Record {
  @Field var id: String = ""
  @Field var fireAt: Double = 0.0
  @Field var title: String = ""
  @Field var body: String = ""
}

class FgAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun status(): Map<String, Boolean> {
    val nm = context.getSystemService(NotificationManager::class.java)
    val fullScreen = Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE || nm.canUseFullScreenIntent()
    val notifications = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    return mapOf(
      "canSchedule" to AlarmScheduler.canScheduleExact(context),
      "canShowFullScreen" to fullScreen,
      "notificationsAllowed" to notifications,
    )
  }

  /** Lets the mission screen appear over the lock screen while an alarm rings. */
  private fun updateLockScreenFlags() {
    val activity = appContext.currentActivity ?: return
    val ringing = RingingService.ringingAlarmId != null
    activity.runOnUiThread {
      activity.setShowWhenLocked(ringing)
      activity.setTurnScreenOn(ringing)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("FgAlarm")

    Function("isSupported") { true }

    AsyncFunction("getPermissionStatus") { status() }

    AsyncFunction("requestPermissions") { promise: Promise ->
      val permissions = appContext.permissions
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || permissions == null) {
        promise.resolve(status())
        return@AsyncFunction
      }
      permissions.askForPermissions({ _ -> promise.resolve(status()) }, Manifest.permission.POST_NOTIFICATIONS)
    }

    AsyncFunction("openFullScreenSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + context.packageName))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    AsyncFunction("schedule") { alarms: List<AlarmSpec> ->
      val stored = alarms.map { StoredAlarm(it.id, it.fireAt.toLong(), it.title, it.body) }
      AlarmStore(context).put(stored)
      stored.forEach { AlarmScheduler.schedule(context, it) }
    }

    AsyncFunction("cancel") { ids: List<String> ->
      ids.forEach { AlarmScheduler.cancel(context, it) }
      AlarmStore(context).remove(ids)
    }

    AsyncFunction("list") {
      AlarmStore(context).all().map { it.toMap() }
    }

    AsyncFunction("stopRinging") {
      if (RingingService.ringingAlarmId != null) context.startService(RingingService.stopIntent(context))
      appContext.currentActivity?.let { activity ->
        activity.runOnUiThread {
          activity.setShowWhenLocked(false)
          activity.setTurnScreenOn(false)
        }
      }
    }

    AsyncFunction("ringingAlarmId") { RingingService.ringingAlarmId }

    // Android opens the mission through the notification's deep link instead.
    AsyncFunction("consumePendingMission") { null as String? }

    OnActivityEntersForeground { updateLockScreenFlags() }
  }
}
