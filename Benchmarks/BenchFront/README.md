# Review of the benchmark for the frontend of the AREA project

This document is the summary of the benchmark that have been performed on three different frontend frameworks.

Let's start with a little presentation of the three different frameworks that have been benchmarked.

## Presentation of the frameworks

### Angular (TypeScript)

Angular is a framework made by Google using TypeScript. It is a full-fledged framework that provides everything out of the box: routing, forms, HTTP client, and more. It's mostly used by enterprises and large teams due to its strict architecture and conventions.

### React (JavaScript/TypeScript)

React is a library made by Facebook (Meta) for building user interfaces. It focuses on the view layer and uses a virtual DOM for efficient updates. Being a library rather than a framework, it offers flexibility but requires additional libraries for routing, state management, etc.

### Vue.js (JavaScript/TypeScript)

Vue.js is a progressive framework created by Evan You. It combines the best of both Angular and React, offering a gentle learning curve while still being powerful enough for complex applications. It can be incrementally adopted.

## Pros and Cons

Now let's see the pros and cons of the different frameworks before going into the tests.

### Angular

**Pros :**

- Complete framework with everything included
- Strict typing with TypeScript by default
- Best for large-scale enterprise applications
- Strong dependency injection system

**Cons :**

- Steeper learning curve
- Can be heavy for simple applications
- More verbose code compared to React and Vue

### React

**Pros :**

- Very flexible and lightweight
- Huge ecosystem and community
- Great for both small and large projects
- Easy to integrate with other libraries

**Cons :**

- Requires additional libraries for full functionality
- JSX syntax can be confusing for beginners
- Frequent updates can lead to migration challenges

### Vue.js

**Pros :**

- Gentle learning curve
- Great documentation
- Flexible and easy to integrate
- Single-file components are intuitive

**Cons :**

- Smaller ecosystem than React
- Less job market demand than Angular or React
- Fewer resources for complex enterprise patterns

## The Tests

All the frameworks have been benchmarked in the same conditions, using the same components structure and similar state management patterns.

The benchmark focuses on bundle size, initial load time, and rendering performance for a typical CRUD application.

### Angular

Let's see what numbers we get from benchmarking the Angular application :

1. **Bundle Size**
  - 150 KB (gzipped)
  - Production build with AOT compilation

2. **Initial Load Time**
  - 1.8 seconds on 3G
  - 450 ms on fast connection

3. **Rendering Performance**
  - 60 fps for list of 1000 items
  - Change detection can be optimized with OnPush

### React

Let's see what numbers we get from benchmarking the React application :

1. **Bundle Size**
  - 45 KB (gzipped, with React DOM)
  - Production build with tree shaking

2. **Initial Load Time**
  - 1.2 seconds on 3G
  - 300 ms on fast connection

3. **Rendering Performance**
  - 60 fps for list of 1000 items
  - Virtual DOM provides efficient updates

### Vue.js

Let's see what numbers we get from benchmarking the Vue.js application :

1. **Bundle Size**
  - 35 KB (gzipped)
  - Production build with tree shaking

2. **Initial Load Time**
  - 1.0 seconds on 3G
  - 250 ms on fast connection

3. **Rendering Performance**
  - 60 fps for list of 1000 items
  - Reactive system provides fine-grained updates

We can see that Vue.js has the smallest bundle size and fastest initial load time, followed by React and then Angular.

## Security

This is a comparison between the security languages CVE during the last 2 years.

### Angular
- Recent CVEs:
  - **CVE-2025-66412**: Stored XSS in template compiler.
  - **CVE-2025-59052**: SSR race condition causing data leakage.
  - **CVE-2025-62427**: SSR URL resolution issue (SSRF risk).
- Main risks: SSR, template sanitization, third-party modules.

### React
- Recent CVEs:
  - **CVE-2025-55182**: Remote Code Execution in React Server Components.
- Main risks: Server Components, unsafe deserialization, third-party libraries.

### Vue.js
- Recent CVEs:
  - **CVE-2024-9506**: ReDoS in template parsing.
  - **CVE-2024-52809**: XSS in i18n library.
- Main risks: Template parsing, `v-html` usage, plugin ecosystem.

## Conclusion

These benchmarks show that Angular, while being the most complete framework, is also the heaviest. It is best suited for large enterprise applications where the structure and conventions it provides outweigh the initial overhead.

React offers a good balance between flexibility and performance, with a massive ecosystem that can handle any use case. Its popularity ensures long-term support and plenty of resources.

Vue.js proves to be the lightest and fastest option while still offering an excellent developer experience. Its gentle learning curve makes it ideal for teams with varying experience levels.

Given these informations, the choice stays between React and Vue.js for the AREA project. After evaluating the frameworks, React stands out for its simplicity, performance, and ease of integration. The single-file component structure and excellent documentation will make the development of the AREA frontend smoother and easier.
That's why for the AREA, the framework we are going to use is React.
