
---

# `MOBILE_FIRST_GUIDE.md`

```markdown
# Mobile-first Implementation & Native Build Troubleshooting

**Goal:** Make the Flutter dev-client the most reliable piece — minimize build failures, solve `flutter.h` errors, and ensure Android & iOS reproducible builds.

---

## iOS: Fixes for `flutter.h not found` and CocoaPods issues

### Recommended Podfile (ios/Podfile)
```ruby
platform :ios, '12.0'
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

flutter_root = ENV['FLUTTER_ROOT'] || File.expand_path('../../flutter', __dir__)
require File.join(flutter_root, 'packages', 'flutter_tools', 'bin', 'podhelper')
flutter_ios_podfile_setup

target 'Runner' do
  # Avoid use_frameworks! by default. If needed:
  # use_frameworks! :linkage => :static
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)', '${PODS_ROOT}/Headers/Public']
      config.build_settings['HEADER_SEARCH_PATHS'] << '${PODS_ROOT}/Headers/Public/**'
    end
  end
end



Step-by-step iOS rebuild workflow
flutter clean
rm -rf ios/Pods ios/Podfile.lock ios/Runner.xcworkspace ~/.cocoapods/repos/*
cd ios
pod repo update
pod install --repo-update
cd ..
flutter pub get
flutter run

Common tips

Always open .xcworkspace if editing in Xcode.

Use use_frameworks! :linkage => :static only if required by Swift pods.

If CocoaPods fails, pod deintegrate then reinstall.

For M1/ARM macs, run arch -x86_64 pod install if necessary.


Android: Gradle & SDK stability
Recommend android/build.gradle & android/app/build.gradle snippets

android/gradle.properties:
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4g

android/build.gradle (project-level):
buildscript {
    ext.kotlin_version = '1.8.10'
    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

android/app/build.gradle (module-level):
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.example.app"
        minSdkVersion 21
        targetSdkVersion 33
        multiDexEnabled true
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = '11'
    }
}

Android rebuild workflow
flutter clean
cd android
./gradlew clean
cd ..
flutter pub get
flutter run

Reproducible builds & CI tips

For CI, pin Gradle & plugin versions in repo; cache ~/.gradle and ~/.pub-cache.

For iOS, use macOS runners and pod install --repo-update. Run xcodebuild to detect header search path issues earlier:
xcodebuild -workspace ios/Runner.xcworkspace -scheme Runner -sdk iphonesimulator -configuration Debug build
