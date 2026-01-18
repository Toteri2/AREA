# Frontend Architecture

## Overview

**Technology Stack:** React 19 + Vite + TypeScript
**State Management:** Redux Toolkit + RTK Query
**Routing:** React Router v7
**UI Library:** ReactFlow (visual editor)
**Graph Layout:** Dagre (auto-arrange nodes)
**Notifications:** React-Toastify (toast notifications)
## Project Structure

```
front/src/
├── App.tsx
├── main.tsx
├── components/
│   ├── Navbar.ts
│   └── blueprint/
├── pages/
│   ├── Login.tsx, Register.tsx
│   ├── Dashboard.tsx, Profile.tsx
│   ├── BlueprintEditor/
│   └── *Callback.tsx
├── layout/
│   ├── AppLayout.tsx
│   ├── MobileLayout.tsx
│   └── NoNavbarLayout.tsx
└── shared/src/
```

---

## Architecture

### Component Hierarchy

![App architecture](assets/app_architecture.png)

---

## Key Components

### App.tsx

**Responsibilities:**
- Route configuration with lazy loading
- Authentication guard (redirect to `/login` if not authenticated)
- OAuth callback handlers

```tsx
const BlueprintEditor = lazy(() => import('./pages/BlueprintEditor'));

{isAuthenticated ? (
  <Route element={<AppLayout />}>
    <Route path='/dashboard' element={<Dashboard />} />
    <Route path='/area' element={<BlueprintEditor />} />
  </Route>
) : (
  <Route path='*' element={<Navigate to='/login' />} />
)}
```

### Layouts

- **AppLayout:** Navbar + page content (authenticated users)
- **NoNavbarLayout:** Clean layout (OAuth callbacks, public pages)
- **MobileLayout:** Responsive mobile adaptation

### OAuth Flow

```
User clicks "Connect GitHub"
  ↓
Frontend → /auth/github/url → Redirect to GitHub
  ↓
GitHub authorizes → /github/callback?code=...
  ↓
GitHubCallback extracts code → Backend validates
  ↓
Backend returns JWT → Redux stores token → Redirect to Dashboard
```

---

## State Management

### Redux Store

```typescript
{
  auth: {
    isAuthenticated: boolean,
    token: string | null,
    user: User | null
  },
  api: { /* RTK Query cache */ }
}
```

### RTK Query Endpoints

**File:** `shared/src/web.ts`

```typescript
// Auth
login(credentials) → { token, user }
register(data) → { token, user }

// Services
getServices() → Service[]

// Webhooks & Reactions
createWebhook(data) → Webhook
listWebhooks() → Webhook[]
createReaction(data) → Reaction
deleteReaction(id) → void
```

**Usage:**
```tsx
const { data: user } = useGetProfileQuery();
const [createWebhook] = useCreateWebhookMutation();
```

---

## Routing

### Routes

```
/login, /register         → Public (NoNavbarLayout)
/dashboard, /profile      → Protected (AppLayout)
/area                     → Blueprint Editor (AppLayout)
/github/callback, etc.    → OAuth handlers (NoNavbarLayout)
```

### Lazy Loading

All pages are lazy-loaded for performance:
- Initial bundle: ~45 KB (gzipped)
- Page chunks: 10-30 KB each
- Faster load on slow connections

---

## Blueprint Editor

### Purpose

**Visual workflow builder** for creating AREA (Action → Reaction automations).

Users drag-and-drop services instead of filling complex forms.

### Features

1. **Drag & Drop:** Drag services from sidebar to canvas
2. **Visual Connections:** Connect Action → Reaction with edges (ReactFlow)
3. **Dynamic Forms:** Configuration modal adapts to service type
4. **Live Sync:** Fetches existing webhooks, displays on canvas
5. **Auto-Layout (Dagre):** Graph layout algorithm that automatically arranges nodes for optimal readability

### Custom Hooks

**useBlueprintData:**
- Fetches webhooks from API
- Transforms webhooks → ReactFlow nodes/edges

**useBlueprintGraph:**
- Handles node creation (drag/drop, double-click)
- Manages connections (edges)
- Opens config modal
- Saves to backend

### Node Types

- **ActionNode** (blue): Trigger (e.g., GitHub push)
- **ReactionNode** (green): Response (e.g., Discord message)

---

## UX/UI Choices

### 1. Visual Editor vs. Forms

**Decision:** Blueprint Editor with drag-and-drop

**Why:**
- **Intuitive:** Familiar interaction pattern
- **Visual clarity:** See workflow at a glance
- **Less overwhelming:** No long multi-step forms

### 2. Lazy Loading

**Why:**
- 3x smaller initial bundle (45 KB vs. 150+ KB)
- Faster time-to-interactive on 3G (<1s)

### 3. OAuth Redirect Flow

**Why:**
- **Security:** No credentials in frontend
- **Familiar UX:** Same pattern as Google, GitHub
- **Simple:** Backend handles token exchange

### 4. Responsive Layouts

**Breakpoints:**
- Mobile: `<768px` → MobileLayout
- Tablet: `768-1024px`
- Desktop: `>1024px` → AppLayout

### 5. Toast Notifications (React-Toastify)

**Used for:**
- Success messages (AREA created, service connected)
- Error alerts (API failures, validation errors)

**Why:**
- **Non-intrusive:** Doesn't block UI
- **Auto-dismiss:** Disappears automatically
- **Clear feedback:** Visual confirmation of actions

---

## Accessibility

### Implemented

- **ARIA labels:** `aria-label`, `aria-modal`, `aria-hidden`
- **Semantic HTML:** `<nav>`, `<button>`, `<form>`
- **Keyboard navigation:** Tab, Enter, Escape

**Example:**
```tsx
<button aria-label="Toggle Sidebar">
  <Icon aria-hidden="true" />
</button>
```

---

## Performance

### Optimizations

1. **Code Splitting:** Lazy loading all pages
2. **Memoization:** `useMemo` for expensive computations
3. **RTK Query Caching:** Automatic cache management (60s TTL)

### Metrics

**Bundle Sizes:**
```
main.js:            45 KB (gzipped)
BlueprintEditor.js: 28 KB
Dashboard.js:       12 KB
```

**Lighthouse Scores:**
- Performance: 85-90
- Accessibility: 80-85
- Best Practices: 95

---

## Development Guidelines

### File Organization

**Group by feature, not by type:**
```
pages/BlueprintEditor/
├── BlueprintEditor.tsx
├── BlueprintEditor.css
├── hooks/
│   ├── useBlueprintData.ts
│   └── useBlueprintGraph.ts
└── utils.ts
```

### Naming

- **Components:** PascalCase (`BlueprintEditor.tsx`)
- **Hooks:** camelCase with `use` prefix (`useBlueprintData`)
- **Constants:** SCREAMING_SNAKE_CASE

### TypeScript

Strict mode enabled:
```json
{
  "strict": true,
  "noImplicitAny": true
}
```
