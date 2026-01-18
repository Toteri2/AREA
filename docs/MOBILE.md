# Mobile Architecture

## Overview

**Technology Stack:** React Native 0.82 + TypeScript
**State Management:** Redux Toolkit + RTK Query
**Navigation:** React Navigation v7
**Platform:** Android

---

## Project Structure

```
mobile/src/
├── App.tsx
├── components/
│   └── AreaWebView.tsx
├── pages/
│   ├── Login.tsx, Register.tsx
│   ├── Dashboard.tsx, Profile.tsx
│   └── GitHub.tsx, Microsoft.tsx
├── navigation/
└── shared/src/native
```

---

## Key Components

### App.tsx

**Responsibilities:**
- Redux Provider setup
- Stack navigation (conditional auth routing)
- Deep link handling for OAuth callbacks

```tsx
{!isAuthenticated ? (
  <Stack.Screen name="Login" component={Login} />
) : (
  <Stack.Screen name="Dashboard" component={Dashboard} />
)}
```

### Deep Links

**OAuth flow via `area://` scheme:**

```
User clicks "Connect GitHub"
  ↓
Opens browser → Backend /auth/github/url
  ↓
GitHub redirects to area://auth/github?code=...
  ↓
App catches deep link → Validates code
  ↓
Success Alert → Account linked
```

**Implementation:**
```tsx
useEffect(() => {
  const handleDeepLink = async ({ url }: { url: string }) => {
    const code = url.match(/[?&]code=([^&]+)/)?.[1];
    if (url.includes('auth/github')) {
      await validateGithub({ code }).unwrap();
    }
  };
  Linking.addEventListener('url', handleDeepLink);
}, []);
```

---

## State Management

### Redux Store

**Shared with web** (`shared/src/native.ts`)

```typescript
{
  auth: { isAuthenticated, token, user },
  api: { /* RTK Query cache */ }
}
```

### RTK Query Endpoints

```typescript
login(credentials) → { token, user }
getProfile() → User
getGithubUrl() → { url: string }
validateGithub({ code }) → { message }
listReactions() → Reaction[]
deleteReaction(id) → void
```

### AsyncStorage

**Persistent token storage:**
```typescript
await AsyncStorage.setItem('token', data.access_token);
const token = await AsyncStorage.getItem('token');
```

---

## Screens

### Authentication
**Login.tsx / Register.tsx:** Form inputs → API call → Navigate to Dashboard

### Dashboard.tsx
- Welcome message
- Service connection status
- Quick action: Create AREA (opens WebView)

### Profile.tsx
- User information
- Service connections (GitHub, Microsoft, Discord, etc.)
- Opens OAuth URLs in browser via `Linking.openURL()`

---

## WebView Integration

### AreaWebView Component

**Purpose:** Embeds web Blueprint Editor for AREA creation

**Location:** `components/AreaWebView.tsx`

**Features:**
- Loads `https://front.mambokara.dev/area`
- Injects JWT token into web localStorage
- Shares authentication state with web client
- Full drag-and-drop Blueprint Editor
- Whitelist security (only allows mambokara.dev and area://)

**Token injection:**
```tsx
const injectedJS = `
  (function () {
    const token = ${JSON.stringify(token || '')};
    if (token) {
      localStorage.setItem('area_token', token);
    }
  })();
`;
```

**Security:**
- `originWhitelist`: Only `https://front.mambokara.dev/*` and `area://*`
- `onShouldStartLoadWithRequest`: Blocks unauthorized URLs
- `mixedContentMode='never'`: HTTPS only

**UX:**
- Loading indicator while WebView loads
- Error handling for network issues
- Same experience as web client

---

## Styling

### StyleSheet API

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 20,
  },
  button: {
    backgroundColor: '#e94560',
    padding: 15,
    borderRadius: 8,
  },
});
```

### Design System

**Colors:**
- Primary: `#1a1a2e` (dark blue-gray)
- Accent: `#e94560` (pink/red) - used for alerts and logout
- Background: `#e9e9e9` (light gray)
- Text: `#000000` (black)
- Secondary text: `#888` (gray)

**Layout:** Flex-based with safe area handling

---

## UX/UI Choices

### 1. Stack Navigator vs. Tabs

**Decision:** Stack Navigator

**Why:**
- Linear authentication flow
- Less cognitive load (one screen at a time)
- Native transitions

### 2. OAuth via Browser

**Decision:** External browser for OAuth

**Why:**
- Security (no in-app webview risks)
- Trust (users see real URLs)
- Deep links for callbacks (`area://`)

### 3. Pull-to-Refresh

**Why:**
- Familiar mobile gesture
- Real-time data sync
- Clean UI (no extra buttons)

---

## Platform Features

### Android

**Deep Links:** `android/app/src/main/AndroidManifest.xml` → scheme `area://`

**APK Build:**
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/client.apk
```

**Docker:**
```bash
docker compose build client_mobile
# APK served at http://localhost:8081/client.apk
```

---- Info notifications (webhook triggered)


## Accessibility

### Implemented
- Touchable areas: Minimum 44x44 pt
- High contrast text
- Loading indicators
- Alert messages

---

## Performance

**Optimizations:**
- Hermes Engine (faster startup)
- Memoization (`useMemo`, `useCallback`)
- FlatList for long lists

**Metrics:**
- APK size: ~25 MB (release)
- Cold start: <2s
- Screen navigation: <100ms

---

## Development

### Build Commands

```bash
npm start              # Metro bundler
npm run android        # Run on Android
npm run lint:fix       # Biome lint + format
```

### TypeScript

Strict mode enabled:
```json
{ "strict": true, "noImplicitAny": true }
```
