package expo.modules.fgalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class StoredAlarm(val id: String, val fireAt: Long, val title: String, val body: String) {
  fun toJson(): JSONObject = JSONObject().put("id", id).put("fireAt", fireAt).put("title", title).put("body", body)

  fun toMap(): Map<String, Any> = mapOf("id" to id, "fireAt" to fireAt.toDouble(), "title" to title, "body" to body)

  companion object {
    fun fromJson(o: JSONObject): StoredAlarm? = try {
      StoredAlarm(o.getString("id"), o.getLong("fireAt"), o.optString("title", ""), o.optString("body", ""))
    } catch (e: Exception) {
      null
    }
  }
}

/**
 * Alarms this app scheduled, kept in SharedPreferences so they can be listed and
 * re-armed after a reboot (AlarmManager forgets everything on reboot).
 */
class AlarmStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("fg_alarm_store", Context.MODE_PRIVATE)

  @Synchronized
  fun all(): List<StoredAlarm> {
    val raw = prefs.getString(KEY, null) ?: return emptyList()
    return try {
      val array = JSONArray(raw)
      (0 until array.length()).mapNotNull { StoredAlarm.fromJson(array.getJSONObject(it)) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  @Synchronized
  fun put(alarms: List<StoredAlarm>) {
    val byId = all().associateBy { it.id }.toMutableMap()
    alarms.forEach { byId[it.id] = it }
    save(byId.values)
  }

  @Synchronized
  fun remove(ids: Collection<String>) = save(all().filterNot { it.id in ids })

  fun get(id: String): StoredAlarm? = all().firstOrNull { it.id == id }

  private fun save(alarms: Collection<StoredAlarm>) {
    val array = JSONArray()
    alarms.forEach { array.put(it.toJson()) }
    prefs.edit().putString(KEY, array.toString()).apply()
  }

  companion object {
    private const val KEY = "alarms"
  }
}
