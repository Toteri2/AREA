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

## Conclusion

These benchmarks show that while Kotlin offers the best raw performance for Android, it only targets a single platform which doubles the development effort for cross-platform apps.

Given these informations, the choice stays between Flutter and React Native for cross-platform development. After creating the apps for benchmarking, I realized that React Native offers significant advantages for our team. The large JavaScript/TypeScript developer pool, the massive community and ecosystem, and the ability to share code with web applications make it a practical choice. Additionally, our team already has React expertise which will speed up development.

That's why for the AREA mobile client, the framework we are going to use is React Native (JavaScript/TypeScript).
