# AREA Frontend

React + TypeScript + Vite frontend application.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration:

```env
VITE_API_URL=http://localhost:3000
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

To automatically fix fixable issues:

```bash
npm run lint -- --fix
```
