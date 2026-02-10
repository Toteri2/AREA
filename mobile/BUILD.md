# Area Mobile - Build Guide

This guide explains how to compile and run the Area Mobile React Native app for Android and iOS.

## Prerequisites

### Common Requirements

- **Node.js** >= 20
- **npm** (comes with Node.js)
- **Watchman** (recommended for macOS)

Install dependencies:
```bash
npm install
```

---

## Android

### Requirements

1. **Java Development Kit (JDK) 17**
   ```bash
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk

   # macOS (using Homebrew)
   brew install openjdk@17

   # Fedora
   sudo dnf install java-17-openjdk-devel
   ```

2. **Android Studio** (download from https://developer.android.com/studio)
   - Install Android SDK
   - Install Android SDK Platform 35 (or latest)
   - Install Android SDK Build-Tools
   - Install Android Emulator
   - Install Intel x86 Emulator Accelerator (HAXM) or configure KVM on Linux

3. **Environment Variables**
   Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

### Running on Android

#### Development (Debug)

1. Start Metro bundler:
   ```bash
   npm start
   ```

2. In a new terminal, run the app:
   ```bash
   npm run android
   ```

   Or with react-native CLI directly:
   ```bash
   npx react-native run-android
   ```

#### Building Release APK

1. Generate a signing key (one-time):
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/gradle.properties`:
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

3. Build the release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

#### Building Release AAB (for Google Play)

```bash
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

---

## iOS

> **Note:** iOS development requires macOS with Xcode installed.

### Requirements

1. **macOS** (required for iOS development)

2. **Xcode** (from Mac App Store)
   - Version 15 or higher recommended
   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```

3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```
   Or with Homebrew:
   ```bash
   brew install cocoapods
   ```

4. **Ruby** (usually pre-installed on macOS)

### Setup

Install iOS dependencies:
```bash
cd ios
pod install
cd ..
```

### Running on iOS

#### Development (Debug)

1. Start Metro bundler:
   ```bash
   npm start
   ```

2. In a new terminal, run the app:
   ```bash
   npm run ios
   ```

   Or specify a simulator:
   ```bash
   npx react-native run-ios --simulator="iPhone 15 Pro"
   ```

#### Building for Device

1. Open the project in Xcode:
   ```bash
   open ios/AreaMobile.xcworkspace
   ```

2. Select your development team in Xcode:
   - Select the project in the navigator
   - Select the target "AreaMobile"
   - Go to "Signing & Capabilities"
   - Select your Team

3. Connect your iOS device and select it as the build target

4. Build and run (Cmd + R)

#### Building Release (Archive)

1. Open Xcode:
   ```bash
   open ios/AreaMobile.xcworkspace
   ```

2. Select "Any iOS Device" as the build target

3. Go to Product > Archive

4. Once archived, use the Organizer (Window > Organizer) to:
   - Distribute to App Store
   - Export for Ad Hoc distribution
   - Export for Development

---

## Troubleshooting

### Metro Bundler Issues

Reset Metro cache:
```bash
npm start -- --reset-cache
```

### Android Issues

Clean and rebuild:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Issues

Clean pods and rebuild:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

Clean Xcode build:
```bash
cd ios
xcodebuild clean
cd ..
```

### General Issues

Clear all caches:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear Metro cache
npx react-native start --reset-cache

# For Android
cd android && ./gradlew clean && cd ..

# For iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
