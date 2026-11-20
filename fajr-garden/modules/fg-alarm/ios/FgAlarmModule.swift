import ExpoModulesCore
import Foundation

#if canImport(AlarmKit)
import ActivityKit
import AlarmKit
import AppIntents
import SwiftUI
#endif

struct AlarmSpec: Record {
  @Field var id: String = ""
  @Field var fireAt: Double = 0
  @Field var title: String = ""
  @Field var body: String = ""
}

/// Alarms this app scheduled, keyed by AlarmKit UUID. AlarmKit deletes an alarm from its
/// own store once it has fired, but JS still needs to see it (a day whose main alarm
/// rang keeps its follow-up chain), so the mapping lives until JS cancels it.
enum AlarmIndex {
  private static let key = "fg_alarm_index"
  static let pendingMissionKey = "fg_alarm_pending_mission"

  static func load() -> [String: [String: Any]] {
    UserDefaults.standard.dictionary(forKey: key) as? [String: [String: Any]] ?? [:]
  }

  static func save(_ index: [String: [String: Any]]) {
    UserDefaults.standard.set(index, forKey: key)
  }

  static func uuid(for id: String, in index: [String: [String: Any]]) -> UUID? {
    index.first { ($0.value["id"] as? String) == id }.flatMap { UUID(uuidString: $0.key) }
  }
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct FajrAlarmMetadata: AlarmMetadata {}

/// "Start mission" button on the system alarm UI: opens the app on the mission screen.
@available(iOS 26.0, *)
struct StartMissionIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Start mission"
  static var openAppWhenRun: Bool = true

  @Parameter(title: "Alarm")
  var alarmId: String

  init() {}
  init(alarmId: String) { self.alarmId = alarmId }

  func perform() async throws -> some IntentResult {
    UserDefaults.standard.set(alarmId, forKey: AlarmIndex.pendingMissionKey)
    return .result()
  }
}
#endif

public class FgAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FgAlarm")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    AsyncFunction("getPermissionStatus") { () -> [String: Bool] in
      [
        "canSchedule": Self.isAuthorized(),
        "canShowFullScreen": true,
        "notificationsAllowed": true,
      ]
    }

    AsyncFunction("requestPermissions") { () async -> [String: Bool] in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        _ = try? await AlarmManager.shared.requestAuthorization()
      }
      #endif
      return ["canSchedule": Self.isAuthorized(), "canShowFullScreen": true, "notificationsAllowed": true]
    }

    AsyncFunction("openFullScreenSettings") {
      // Not applicable on iOS: AlarmKit alarms always present full screen.
    }

    AsyncFunction("schedule") { (alarms: [AlarmSpec]) async throws in
      #if canImport(AlarmKit)
      guard #available(iOS 26.0, *) else { return }
      var index = AlarmIndex.load()
      for spec in alarms {
        // Replace an existing alarm with the same JS id.
        if let old = AlarmIndex.uuid(for: spec.id, in: index) {
          try? AlarmManager.shared.cancel(id: old)
          index.removeValue(forKey: old.uuidString)
        }
        let uuid = UUID()
        let alert = AlarmPresentation.Alert(
          title: LocalizedStringResource(stringLiteral: spec.title),
          secondaryButton: AlarmButton(
            text: LocalizedStringResource(stringLiteral: Self.startMissionLabel()),
            textColor: .white,
            systemImageName: "figure.walk"
          ),
          secondaryButtonBehavior: .custom
        )
        let attributes = AlarmAttributes<FajrAlarmMetadata>(
          presentation: AlarmPresentation(alert: alert),
          metadata: FajrAlarmMetadata(),
          tintColor: Color(red: 0.18, green: 0.5, blue: 0.48)
        )
        let configuration = AlarmManager.AlarmConfiguration<FajrAlarmMetadata>.alarm(
          schedule: .fixed(Date(timeIntervalSince1970: spec.fireAt / 1000)),
          attributes: attributes,
          secondaryIntent: StartMissionIntent(alarmId: spec.id)
        )
        _ = try await AlarmManager.shared.schedule(id: uuid, configuration: configuration)
        index[uuid.uuidString] = ["id": spec.id, "fireAt": spec.fireAt, "title": spec.title, "body": spec.body]
      }
      AlarmIndex.save(index)
      #endif
    }

    AsyncFunction("cancel") { (ids: [String]) in
      var index = AlarmIndex.load()
      for id in ids {
        guard let uuid = AlarmIndex.uuid(for: id, in: index) else { continue }
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) { try? AlarmManager.shared.cancel(id: uuid) }
        #endif
        index.removeValue(forKey: uuid.uuidString)
      }
      AlarmIndex.save(index)
    }

    AsyncFunction("list") { () -> [[String: Any]] in
      Array(AlarmIndex.load().values)
    }

    AsyncFunction("stopRinging") {
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        for alarm in (try? AlarmManager.shared.alarms) ?? [] where alarm.state == .alerting {
          try? AlarmManager.shared.stop(id: alarm.id)
        }
      }
      #endif
    }

    AsyncFunction("ringingAlarmId") { () -> String? in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let index = AlarmIndex.load()
        let alerting = ((try? AlarmManager.shared.alarms) ?? []).first { $0.state == .alerting }
        return alerting.flatMap { index[$0.id.uuidString]?["id"] as? String }
      }
      #endif
      return nil
    }

    AsyncFunction("consumePendingMission") { () -> String? in
      let defaults = UserDefaults.standard
      let id = defaults.string(forKey: AlarmIndex.pendingMissionKey)
      defaults.removeObject(forKey: AlarmIndex.pendingMissionKey)
      return id
    }
  }

  private static func isAuthorized() -> Bool {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) {
      return AlarmManager.shared.authorizationState == .authorized
    }
    #endif
    return false
  }

  /// Button label in the device language (the module has no access to the JS i18n).
  private static func startMissionLabel() -> String {
    switch Locale.preferredLanguages.first?.prefix(2) {
    case "fr": return "Lancer la mission"
    case "ar": return "ابدأ المهمة"
    default: return "Start mission"
    }
  }
}
