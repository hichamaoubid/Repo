Pod::Spec.new do |s|
  s.name           = 'FgAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Fajr Garden alarms (AlarmKit)'
  s.description    = 'Schedules Fajr alarms with AlarmKit on iOS 26+; JS decides the plan.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
