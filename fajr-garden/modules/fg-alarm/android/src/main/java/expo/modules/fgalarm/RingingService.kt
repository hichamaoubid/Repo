package expo.modules.fgalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Plays the alarm on the alarm audio stream (heard in silent mode and Do Not Disturb's
 * default settings), vibrates, and shows a full-screen notification that opens the
 * mission. Only JS (mission completed) or the 10-minute safety timeout stops it; the
 * follow-up alarms ring again after that.
 */
class RingingService : Service() {
  private var player: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private val handler = Handler(Looper.getMainLooper())
  private val timeout = Runnable { stopRinging() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopRinging()
      return START_NOT_STICKY
    }
    val id = intent?.getStringExtra(EXTRA_ID) ?: run {
      stopSelf()
      return START_NOT_STICKY
    }
    val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
    val body = intent.getStringExtra(EXTRA_BODY).orEmpty()
    ringingAlarmId = id

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED else 0
    ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(id, title, body), type)

    if (player == null) startSound()
    startVibration()
    acquireWakeLock()
    handler.removeCallbacks(timeout)
    handler.postDelayed(timeout, MAX_RING_MS)
    return START_NOT_STICKY
  }

  private fun buildNotification(id: String, title: String, body: String): Notification {
    val nm = getSystemService(NotificationManager::class.java)
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      val channel = NotificationChannel(CHANNEL_ID, "Fajr alarm", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Rings at your Fajr alarm time"
        setSound(null, null) // the service plays the sound itself, on the alarm stream
        enableVibration(false) // idem
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
      nm.createNotificationChannel(channel)
    }
    val mission = PendingIntent.getActivity(
      this, 2, missionIntent(this, id),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(mission)
      .setFullScreenIntent(mission, true)
      .build()
  }

  private fun startSound() {
    val uri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      ?: return
    player = try {
      MediaPlayer().apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        setDataSource(this@RingingService, uri)
        isLooping = true
        prepare()
        start()
      }
    } catch (e: Exception) {
      null // vibration and the full-screen screen still wake the user
    }
  }

  private fun vibrator(): Vibrator? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

  private fun startVibration() {
    val pattern = longArrayOf(0, 800, 600)
    vibrator()?.vibrate(
      VibrationEffect.createWaveform(pattern, 0),
      AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build(),
    )
  }

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) return
    wakeLock = getSystemService(PowerManager::class.java)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FajrGarden:ringing")
      .apply { acquire(MAX_RING_MS) }
  }

  private fun stopRinging() {
    handler.removeCallbacks(timeout)
    player?.runCatching { stop(); release() }
    player = null
    vibrator()?.cancel()
    wakeLock?.takeIf { it.isHeld }?.release()
    wakeLock = null
    ringingAlarmId = null
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  override fun onDestroy() {
    if (ringingAlarmId != null) stopRinging()
    super.onDestroy()
  }

  companion object {
    private const val ACTION_STOP = "expo.modules.fgalarm.STOP"
    private const val EXTRA_ID = "id"
    private const val EXTRA_TITLE = "title"
    private const val EXTRA_BODY = "body"
    private const val CHANNEL_ID = "fg_alarm_ringing"
    private const val NOTIFICATION_ID = 4201
    private const val MAX_RING_MS = 10 * 60 * 1000L

    /** Deep link handled by the app's /mission route. Must match "scheme" in app.json. */
    private const val MISSION_URI = "fajrgarden://mission"

    @Volatile
    var ringingAlarmId: String? = null
      private set

    fun startIntent(context: Context, alarm: StoredAlarm): Intent =
      Intent(context, RingingService::class.java)
        .putExtra(EXTRA_ID, alarm.id)
        .putExtra(EXTRA_TITLE, alarm.title)
        .putExtra(EXTRA_BODY, alarm.body)

    fun stopIntent(context: Context): Intent = Intent(context, RingingService::class.java).setAction(ACTION_STOP)

    fun missionIntent(context: Context, id: String): Intent =
      Intent(Intent.ACTION_VIEW, Uri.parse("$MISSION_URI?alarmId=" + Uri.encode(id)))
        .setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
  }
}
