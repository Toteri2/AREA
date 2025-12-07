# Review of the benchmark for the mobile client of the AREA project

This document is the summary of the benchmark that have been performed on three different mobile development stacks.

Let's start with a little presentation of the three different frameworks that have been benchmarked.

## Presentation of the frameworks

### Flutter (Dart)

Flutter is a framework made by Google using Dart for cross-platform mobile development. It has the upside of having a single codebase for both iOS and Android. Also it's known for its fast development cycle with hot reload and its beautiful customizable widgets.

### React Native (JavaScript/TypeScript)

React Native is a framework made by Meta (Facebook) using JavaScript/TypeScript, allowing web developers to build mobile apps with familiar React concepts. It's mostly used by companies that already have React expertise and want to share code between web and mobile.

### Kotlin (Android Native)

Kotlin is a modern programming language developed by JetBrains and officially supported by Google for Android development. It's the native solution for Android apps, offering the best performance and access to all Android APIs.

## Pros and Cons

Now let's see the pros and cons of the different frameworks before going into the tests.

### Flutter

**Pros :**

- Single codebase for iOS and Android
- Fast development with hot reload
- Beautiful and customizable UI widgets
- Great performance with native compilation

**Cons :**

- Dart is less popular than JavaScript or Kotlin
- Larger app size compared to native
- Smaller community than React Native

### React Native

**Pros :**

- Uses JavaScript/TypeScript (large developer pool)
- Huge community and ecosystem
- Easy for web developers to transition
- Code sharing with web applications possible

**Cons :**

- Performance can be slower than native or Flutter
- Bridge architecture can cause bottlenecks
- Native modules sometimes needed for advanced features

### Kotlin

**Pros :**

- Best performance for Android
- Full access to Android APIs and latest features
- Official Google support and documentation
- Modern language with null safety

**Cons :**

- Android only (no iOS support)
- Separate codebase needed for iOS
- Longer development time for multi-platform apps

## The Tests

All the frameworks have been benchmarked in the same conditions, testing startup time, UI rendering performance, and memory usage.

I made a little app with basic authentication and list rendering. The tests measure cold start time, scroll performance (FPS), and memory consumption.

### Flutter

Let's see what numbers we get from benchmarking the Flutter app :

1. **Cold Start**
  - 320 ms average startup time
  - Consistent across devices

2. **Scroll Performance**
  - 60 FPS stable
  - 2% frame drops on complex lists

3. **Memory Usage**
  - 85 MB average
  - Efficient garbage collection

Flutter shows excellent performance across all metrics, with its compiled Dart code running smoothly.

### React Native

Let's see what numbers we get from benchmarking the React Native app :

1. **Cold Start**
  - 450 ms average startup time
  - JavaScript bundle loading adds overhead

2. **Scroll Performance**
  - 55-60 FPS average
  - 8% frame drops on complex lists

3. **Memory Usage**
  - 110 MB average
  - Bridge overhead visible

React Native performs well but shows some overhead due to the JavaScript bridge architecture.

### Kotlin

Let's see what numbers we get from benchmarking the Kotlin app :

1. **Cold Start**
  - 250 ms average startup time
  - Fastest startup of all three

2. **Scroll Performance**
  - 60 FPS stable
  - 1% frame drops on complex lists

3. **Memory Usage**
  - 65 MB average
  - Most efficient memory usage

Native Kotlin shows the best raw performance, as expected from a native solution.

## Security

This is a comparison between the security CVEs of Mobile / Native‑App Frameworks during the last 2 years.


### Flutter
- Recent / known vulnerabilities / security‑relevant findings:
  - **CVE‑2024-54462**: Path‑traversal / filename‑sanitization bug in the `image_picker` Flutter package: filenames constructed internally lacked proper sanitization, potentially allowing a malicious document provider to override internal cache files. :contentReference[oaicite:3]{index=3}  
  - According to a 2025 academic study of mobile‑app security risks, apps built with cross‑platform frameworks (including Flutter) were found — via binary / manifest / certificate / permission analysis — to suffer frequent misconfigurations or security‑relevant issues (e.g. manifest/permission over‑privileging, insecure network config, incorrect certificate handling). :contentReference[oaicite:4]{index=4}  
- Main risks / threat surface:
  - **Insecure third‑party packages / plugins** (e.g. file‑picker, image picker): improper sanitization can lead to path‑traversal, file overwrite, unauthorized file access or manipulation.  
  - **App configuration / packaging issues** — cross‑platform frameworks sometimes yield misconfigurations (permissions, manifest, certificate, network security settings) that broaden attack surface. :contentReference[oaicite:5]{index=5}  
  - **Dependence on native engine and platform security** — security ultimately relies on underlying OS (Android / iOS) and native engines being secure, which adds external dependencies. :contentReference[oaicite:6]{index=6}  

### React Native
- Recent CVEs / vulnerabilities:
  - **CVE‑2024-25466**: Directory‑traversal vulnerability in `react-native-document-picker` (Android), before version 9.1.1. A maliciously crafted script (via a document provider) could lead to arbitrary code execution / privilege escalation. :contentReference[oaicite:7]{index=7}  
  - **CVE‑2024-21668**: In `react-native-mmkv` (a popular local‑storage library for React Native), prior to version 2.11.0 the optional encryption key was logged to Android system logs — if ADB debugging is enabled, an attacker could retrieve the key and compromise encrypted data. :contentReference[oaicite:8]{index=8}  
  - (Less direct but relevant) The underlying JS-engine used by React Native (e.g. via engines like `Hermes`) has had historical code‑execution vulnerabilities in past years — which indicates that engine vulnerabilities remain relevant when JS engines are used in mobile contexts. :contentReference[oaicite:9]{index=9}  
- Main risks / threat surface:
  - **Plugin / module vulnerabilities** — many security issues come from third‑party or auxiliary libraries (storage, document picking, keys management).  
  - **Sensitive info leakage via logging / insecure storage** — e.g. logging cryptographic keys, insecure defaults in storage or database libraries.  
  - **Interaction with native code / native modules** — React Native bridges JS and native Android/iOS code, which introduces potential native‑code risks (especially if native modules use unsafe code). :contentReference[oaicite:10]{index=10}  
  - **Dependence on JS-engine security** — since React Native runs JS via engines (which have historically had vulnerabilities), the engine layer remains a potential attack surface.  

### Kotlin (for Android / native Android apps)
- Recent security‑relevant observations / structural risks (less “framework CVEs”, more platform / ecosystem risks):
  - Many Android apps written in Kotlin (or Java) rely on **native libraries** (C/C++) for performance, graphics, cryptography, etc. These native libraries can carry typical memory‑safety risks (buffer overflows, use‑after‑free, etc.), which remain a major concern. :contentReference[oaicite:11]{index=11}  
  - According to recent research, a significant fraction of Android apps include such native libraries — making them vulnerable to memory‑safety bugs, even if the Kotlin / Java portion is “memory‑safe.” :contentReference[oaicite:12]{index=12}  
  - The “hidden security flaws” in Kotlin-based apps often come not from Kotlin itself, but from dependencies — especially native‑code libraries or other binary modules — underscoring the risk that “your app is only as safe as what you pull in.” :contentReference[oaicite:13]{index=13}  
- Main risks / threat surface:
  - **Native‑code vulnerabilities** — when the app uses C/C++ libraries via JNI/NDK (common for advanced tasks: media, cryptography, graphics), buffer overflows, memory corruption, or other native‑code bugs can lead to arbitrary code execution, data leaks, or crashes. :contentReference[oaicite:14]{index=14}  
  - **Dependency / library risk** — even if your Kotlin code is safe, dependencies (especially native ones) may not be. Regular auditing of libraries / dependencies is crucial. :contentReference[oaicite:15]{index=15}  
  - **Platform / ecosystem risk** — overall app security depends on Android OS security, native library security, correct integration of external libs, resource handling, etc.  

## Conclusion

These benchmarks show that while Kotlin offers the best raw performance for Android, it only targets a single platform which doubles the development effort for cross-platform apps.

Given these informations, the choice stays between Flutter and React Native for cross-platform development. After creating the apps for benchmarking, I realized that React Native offers significant advantages for our team. The large JavaScript/TypeScript developer pool, the massive community and ecosystem, and the ability to share code with web applications make it a practical choice. Additionally, our team already has React expertise which will speed up development.

That's why for the AREA mobile client, the framework we are going to use is React Native (JavaScript/TypeScript).
