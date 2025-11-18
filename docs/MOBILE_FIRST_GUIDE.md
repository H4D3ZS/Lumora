# Mobile-First Implementation & Native Build Troubleshooting

**Goal:** Make the Flutter-Dev-Client the most reliable component — minimize build failures, solve common iOS and Android issues, and ensure reproducible builds across platforms.

This guide provides step-by-step solutions for common mobile build issues, platform-specific configurations, and best practices for CI/CD integration.

---

## Table of Contents

- [iOS Configuration](#ios-configuration)
- [Android Configuration](#android-configuration)
- [Rebuild Workflows](#rebuild-workflows)
- [Common Issues & Solutions](#common-issues--solutions)
- [Reproducible Builds](#reproducible-builds)
- [CI/CD Integration](#cicd-integration)
- [Debug Artifacts](#debug-artifacts)

---

## iOS Configuration

### Minimum Requirements

- **iOS Version**: 12.0+
- **Xcode**: 14.0+
- **CocoaPods**: 1.11.0+
- **macOS**: 12.0+ (for development)

### Recommended Podfile

The Podfile configuration is critical for avoiding `flutter.h not found` errors and ensuring proper header search paths.

**Location**: `apps/flutter-dev-client/ios/Podfile`

```ruby
platform :ios, '12.0'
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

# Locate Flutter SDK
flutter_root = ENV['FLUTTER_ROOT'] || File.expand_path('../../flutter', __dir__)
require File.join(flutter_root, 'packages', 'flutter_tools', 'bin', 'podhelper')
flutter_ios_podfile_setup

target 'Runner' do
  # Use modular headers for better compatibility
  use_modular_headers!
  
  # Uncomment only if required by Swift pods
  # use_frameworks! :linkage => :static
  
  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    
    target.build_configurations.each do |config|
      # Fix header search paths for flutter.h
      config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)', '${PODS_ROOT}/Headers/Public']
      config.build_settings['HEADER_SEARCH_PATHS'] << '${PODS_ROOT}/Headers/Public/**'
      
      # Ensure proper deployment target
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
    end
  end
end
```

### Key Configuration Points

1. **Platform Version**: Set to iOS 12.0 for broad device compatibility
2. **Modular Headers**: Use `use_modular_headers!` instead of `use_frameworks!` when possible
3. **Header Search Paths**: Explicitly include `${PODS_ROOT}/Headers/Public/**` to resolve `flutter.h`
4. **Flutter Setup**: Call `flutter_ios_podfile_setup` to initialize Flutter-specific configurations

### Step-by-Step iOS Rebuild Workflow

When encountering build issues or after updating dependencies, follow this complete rebuild process:

```bash
# 1. Clean Flutter build artifacts
flutter clean

# 2. Remove all CocoaPods artifacts
rm -rf ios/Pods ios/Podfile.lock ios/Runner.xcworkspace

# 3. Clear CocoaPods cache (optional but recommended for persistent issues)
rm -rf ~/.cocoapods/repos/*

# 4. Navigate to iOS directory
cd ios

# 5. Update CocoaPods repository
pod repo update

# 6. Install pods with repo update
pod install --repo-update

# 7. Return to project root
cd ..

# 8. Get Flutter dependencies
flutter pub get

# 9. Run the app
flutter run -d ios
```

### iOS Common Issues & Solutions

#### Issue: `flutter.h not found`

**Symptoms**: Build fails with error `'Flutter/Flutter.h' file not found`

**Solutions**:
1. Verify `HEADER_SEARCH_PATHS` in Podfile post_install hook
2. Ensure you're opening `.xcworkspace` not `.xcodeproj` in Xcode
3. Run the complete rebuild workflow above
4. Check that Flutter SDK path is correct: `echo $FLUTTER_ROOT`

#### Issue: CocoaPods Installation Fails

**Symptoms**: `pod install` fails with dependency resolution errors

**Solutions**:
1. Update CocoaPods: `sudo gem install cocoapods`
2. Clear CocoaPods cache: `pod cache clean --all`
3. Deintegrate and reinstall:
   ```bash
   cd ios
   pod deintegrate
   pod install --repo-update
   ```
4. For M1/M2 Macs with architecture issues:
   ```bash
   arch -x86_64 pod install
   ```

#### Issue: Xcode Build Settings Conflicts

**Symptoms**: Build succeeds in terminal but fails in Xcode

**Solutions**:
1. Always open `Runner.xcworkspace`, never `Runner.xcodeproj`
2. Clean Xcode build folder: Product → Clean Build Folder (Cmd+Shift+K)
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
4. Verify deployment target matches Podfile: Build Settings → iOS Deployment Target = 12.0

#### Issue: Swift Version Conflicts

**Symptoms**: Errors about Swift language version mismatches

**Solutions**:
1. Add to Podfile post_install:
   ```ruby
   config.build_settings['SWIFT_VERSION'] = '5.0'
   ```
2. Ensure all pods use compatible Swift versions
3. Use `use_frameworks! :linkage => :static` only if required by Swift pods

### iOS Xcode Build Verification

To verify the build configuration without running on a device:

```bash
# Build for simulator
xcodebuild -workspace ios/Runner.xcworkspace \
  -scheme Runner \
  -sdk iphonesimulator \
  -configuration Debug \
  build

# Build for device
xcodebuild -workspace ios/Runner.xcworkspace \
  -scheme Runner \
  -sdk iphoneos \
  -configuration Release \
  build
```

---

## Android Configuration

### Minimum Requirements

- **Android SDK**: API 21+ (Android 5.0)
- **Target SDK**: API 33 (Android 13)
- **Gradle**: 7.4.2
- **Kotlin**: 1.8.10
- **Java**: 11

### Gradle Configuration

#### gradle.properties

**Location**: `apps/flutter-dev-client/android/gradle.properties`

```properties
# Enable AndroidX and Jetifier
android.useAndroidX=true
android.enableJetifier=true

# Increase JVM heap size for large projects
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError

# Enable Gradle daemon for faster builds
org.gradle.daemon=true

# Enable parallel execution
org.gradle.parallel=true

# Enable configuration cache (Gradle 7.4+)
org.gradle.configuration-cache=true
```

#### Project-Level build.gradle

**Location**: `apps/flutter-dev-client/android/build.gradle`

```gradle
buildscript {
    ext.kotlin_version = '1.8.10'
    
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.buildDir = '../build'

subprojects {
    project.buildDir = "${rootProject.buildDir}/${project.name}"
}

subprojects {
    project.evaluationDependsOn(':app')
}

tasks.register("clean", Delete) {
    delete rootProject.buildDir
}
```

#### App-Level build.gradle

**Location**: `apps/flutter-dev-client/android/app/build.gradle.kts`

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.flutter_dev_client"
    compileSdk = 33
    
    defaultConfig {
        applicationId = "com.example.flutter_dev_client"
        minSdk = 21
        targetSdk = 33
        versionCode = 1
        versionName = "1.0"
        
        // Enable multidex for apps with many dependencies
        multiDexEnabled = true
    }
    
    buildTypes {
        release {
            // Signing configuration for release builds
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = "11"
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("androidx.multidex:multidex:2.0.1")
}
```

### Step-by-Step Android Rebuild Workflow

When encountering build issues or after updating dependencies:

```bash
# 1. Clean Flutter build artifacts
flutter clean

# 2. Navigate to Android directory
cd android

# 3. Clean Gradle build
./gradlew clean

# 4. Clear Gradle cache (for persistent issues)
./gradlew cleanBuildCache

# 5. Return to project root
cd ..

# 6. Get Flutter dependencies
flutter pub get

# 7. Run the app
flutter run -d android
```

### Android Common Issues & Solutions

#### Issue: Gradle Build Fails

**Symptoms**: Build fails with Gradle errors or dependency resolution issues

**Solutions**:
1. Update Gradle wrapper:
   ```bash
   cd android
   ./gradlew wrapper --gradle-version=7.4.2
   ```
2. Clear Gradle cache:
   ```bash
   rm -rf ~/.gradle/caches
   ./gradlew clean build --refresh-dependencies
   ```
3. Verify Java version: `java -version` (should be 11)
4. Check Gradle daemon: `./gradlew --status`

#### Issue: MultiDex Errors

**Symptoms**: Build fails with "Cannot fit requested classes in a single dex file"

**Solutions**:
1. Enable multidex in `build.gradle`:
   ```kotlin
   defaultConfig {
       multiDexEnabled = true
   }
   ```
2. Add multidex dependency:
   ```kotlin
   dependencies {
       implementation("androidx.multidex:multidex:2.0.1")
   }
   ```

#### Issue: Kotlin Version Conflicts

**Symptoms**: Errors about Kotlin version mismatches

**Solutions**:
1. Ensure consistent Kotlin version across all build files
2. Update Kotlin plugin: `ext.kotlin_version = '1.8.10'`
3. Sync Gradle files in Android Studio

#### Issue: SDK License Not Accepted

**Symptoms**: Build fails with "Android SDK licenses not accepted"

**Solutions**:
```bash
flutter doctor --android-licenses
```
Accept all licenses when prompted.

#### Issue: Emulator Connection Issues

**Symptoms**: Cannot connect to Dev-Proxy from Android emulator

**Solutions**:
1. Use `10.0.2.2` instead of `localhost` for emulator:
   ```dart
   final wsUrl = 'ws://10.0.2.2:3000/ws';
   ```
2. For physical devices, use your machine's LAN IP:
   ```dart
   final wsUrl = 'ws://192.168.1.100:3000/ws';
   ```
3. Check firewall settings allow connections on port 3000

### Android Build Verification

To verify the build without running on a device:

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run tests
./gradlew test
```

---

## Rebuild Workflows

### Complete Clean Rebuild (Both Platforms)

When you need a completely fresh build:

```bash
# Clean everything
flutter clean
rm -rf ios/Pods ios/Podfile.lock ios/Runner.xcworkspace
rm -rf android/build android/app/build
rm -rf build

# iOS setup
cd ios
pod repo update
pod install --repo-update
cd ..

# Android setup
cd android
./gradlew clean
cd ..

# Flutter setup
flutter pub get
flutter pub upgrade

# Verify setup
flutter doctor -v

# Run on desired platform
flutter run -d <device-id>
```

### Quick Rebuild (After Code Changes)

For routine development:

```bash
# Clean build artifacts
flutter clean

# Get dependencies
flutter pub get

# Run
flutter run
```

### Dependency Update Workflow

When updating Flutter or package dependencies:

```bash
# Update Flutter SDK
flutter upgrade

# Update dependencies
flutter pub upgrade

# iOS: Update pods
cd ios
pod repo update
pod update
cd ..

# Android: Refresh dependencies
cd android
./gradlew --refresh-dependencies
cd ..

# Verify
flutter doctor -v
flutter run
```

---

## Common Issues & Solutions

### Cross-Platform Issues

#### Issue: Flutter Doctor Shows Errors

**Solutions**:
1. Run `flutter doctor -v` for detailed diagnostics
2. Follow the specific recommendations for each issue
3. Common fixes:
   - Install missing Android SDK components
   - Accept Android licenses: `flutter doctor --android-licenses`
   - Install Xcode command line tools: `xcode-select --install`
   - Update CocoaPods: `sudo gem install cocoapods`

#### Issue: Hot Reload Not Working

**Solutions**:
1. Ensure you're running in debug mode
2. Check that the device is properly connected
3. Restart the app: `r` in terminal or `R` for hot restart
4. If persistent, stop and restart: `flutter run`

#### Issue: Package Version Conflicts

**Solutions**:
1. Check `pubspec.yaml` for version constraints
2. Run `flutter pub upgrade` to update to compatible versions
3. Use `flutter pub outdated` to see available updates
4. Resolve conflicts by specifying exact versions

### Network & Connection Issues

#### Issue: Cannot Connect to Dev-Proxy

**Solutions**:
1. Verify Dev-Proxy is running: `curl http://localhost:3000/session/new`
2. Check WebSocket URL configuration
3. For emulators:
   - Android: Use `10.0.2.2` instead of `localhost`
   - iOS: Use `localhost` or `127.0.0.1`
4. For physical devices: Use LAN IP (e.g., `192.168.1.100`)
5. Check firewall settings
6. Ensure device and server are on same network

---

## Reproducible Builds

### Version Pinning

To ensure consistent builds across environments:

**pubspec.yaml**:
```yaml
environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.0.0"

dependencies:
  flutter:
    sdk: flutter
  web_socket_channel: 2.4.0  # Pin exact versions
  # ... other dependencies
```

**Android gradle.properties**:
```properties
# Pin Gradle version
distributionUrl=https\://services.gradle.org/distributions/gradle-7.4.2-all.zip
```

**iOS Podfile**:
```ruby
# Pin pod versions if needed
pod 'SomePod', '1.2.3'
```

### Build Scripts

Create reproducible build scripts:

**build-android.sh**:
```bash
#!/bin/bash
set -e

flutter clean
flutter pub get
cd android
./gradlew clean
./gradlew assembleRelease
cd ..

echo "✓ Android build complete: build/app/outputs/flutter-apk/app-release.apk"
```

**build-ios.sh**:
```bash
#!/bin/bash
set -e

flutter clean
flutter pub get
cd ios
pod install --repo-update
cd ..
flutter build ios --release

echo "✓ iOS build complete"
```

---

## CI/CD Integration

### GitHub Actions Example

**.github/workflows/build.yml**:
```yaml
name: Build Flutter App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.13.0'
          channel: 'stable'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.pub-cache
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/pubspec.yaml') }}
      
      - name: Install dependencies
        run: flutter pub get
        working-directory: apps/flutter-dev-client
      
      - name: Build APK
        run: flutter build apk --debug
        working-directory: apps/flutter-dev-client
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug.apk
          path: apps/flutter-dev-client/build/app/outputs/flutter-apk/app-debug.apk

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.13.0'
          channel: 'stable'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.pub-cache
            ~/Library/Caches/CocoaPods
          key: ${{ runner.os }}-pods-${{ hashFiles('**/Podfile.lock', '**/pubspec.yaml') }}
      
      - name: Install dependencies
        run: flutter pub get
        working-directory: apps/flutter-dev-client
      
      - name: Install CocoaPods
        run: |
          cd apps/flutter-dev-client/ios
          pod install --repo-update
      
      - name: Build iOS
        run: flutter build ios --release --no-codesign
        working-directory: apps/flutter-dev-client
```

### CI Best Practices

1. **Cache Dependencies**: Cache Gradle, CocoaPods, and pub-cache to speed up builds
2. **Pin Versions**: Use specific Flutter and dependency versions
3. **Parallel Jobs**: Run Android and iOS builds in parallel
4. **Artifact Upload**: Save build artifacts for testing and distribution
5. **Test Integration**: Run tests before building
6. **Environment Variables**: Use secrets for sensitive configuration

---

## Debug Artifacts

### Generating Debug Builds

#### Android Debug APK

```bash
cd apps/flutter-dev-client
flutter build apk --debug

# Output: build/app/outputs/flutter-apk/app-debug.apk
```

**Distribution**:
- Copy APK to `release-artifacts/` directory
- Share via file hosting or GitHub releases
- Users can install directly on Android devices

#### iOS Debug Build

```bash
cd apps/flutter-dev-client
flutter build ios --debug --no-codesign

# Output: build/ios/iphoneos/Runner.app
```

**Distribution Options**:
1. **TestFlight**: Requires Apple Developer account and proper signing
2. **Ad-Hoc Distribution**: For registered devices with provisioning profile
3. **Simulator Build**: For testing on macOS with Xcode Simulator

### Creating Release Artifacts

**Directory Structure**:
```
release-artifacts/
├── android/
│   ├── app-debug.apk
│   └── app-release.apk
├── ios/
│   └── Runner.ipa (if available)
└── README.md (installation instructions)
```

**Installation Instructions** (release-artifacts/README.md):
```markdown
# Installation Instructions

## Android
1. Download `app-debug.apk`
2. Enable "Install from Unknown Sources" in device settings
3. Open the APK file to install
4. Launch the app

## iOS
1. Install via TestFlight link: [link]
2. Or use Xcode to install on simulator

## Web Demo
For judges without mobile devices, visit: [hosted-demo-url]
```

### Hosted Web Demo

For maximum accessibility, consider hosting a web version of the editor:

```bash
# Build web version
cd tools/web-editor
npm run build

# Deploy to hosting service (Vercel, Netlify, etc.)
vercel deploy
```

---

## Performance Optimization

### Build Performance

**Android**:
- Enable Gradle daemon and parallel execution
- Increase JVM heap size in gradle.properties
- Use build cache: `org.gradle.caching=true`

**iOS**:
- Use modular headers instead of frameworks when possible
- Enable build parallelization in Xcode
- Clear derived data periodically

### Runtime Performance

- Use release builds for performance testing
- Profile with Flutter DevTools
- Monitor memory usage and frame rates
- Optimize large schemas with isolate parsing

---

## Troubleshooting Checklist

When encountering build issues, work through this checklist:

- [ ] Run `flutter doctor -v` and resolve all issues
- [ ] Verify Flutter SDK is up to date: `flutter upgrade`
- [ ] Check dependency versions in pubspec.yaml
- [ ] Clean build artifacts: `flutter clean`
- [ ] For iOS: Delete Pods and reinstall
- [ ] For Android: Clean Gradle cache
- [ ] Verify platform-specific configurations match this guide
- [ ] Check network connectivity for Dev-Proxy connection
- [ ] Review error logs for specific issues
- [ ] Try on a different device/emulator
- [ ] Create a minimal reproduction case

---

## Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [CocoaPods Guides](https://guides.cocoapods.org/)
- [Gradle User Manual](https://docs.gradle.org/)
- [Android Developer Guides](https://developer.android.com/docs)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the main [README.md](README.md) for general setup
2. Review component-specific READMEs:
   - [Dev-Proxy](tools/dev-proxy/README.md)
   - [Flutter-Dev-Client](apps/flutter-dev-client/README.md)
   - [Codegen-Tool](tools/codegen/README.md)
3. Search existing GitHub issues
4. Create a new issue with:
   - Platform (iOS/Android)
   - Flutter version: `flutter --version`
   - Error logs
   - Steps to reproduce

---

**Last Updated**: November 2025