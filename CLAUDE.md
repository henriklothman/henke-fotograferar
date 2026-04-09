# Design System Rules for Figma MCP Integration

## Project Overview

This is an **Astro-based photography portfolio site** built with a minimal design system. The project prioritizes simplicity and performance with a carefully curated color palette and responsive Tailwind CSS styling.

- **Framework**: Astro 5.18.1 (Static Site Generator)
- **Styling System**: Tailwind CSS v4.2.2 with @tailwindcss/vite plugin
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Deployment**: Vercel (@astrojs/vercel integration)

---

## 1. Token Definitions

### Color Palette

The design system uses **Tailwind's default stone color palette** exclusively. No custom color tokens are defined.

**Primary Colors:**
- `bg-stone-950` - Near-black background (#0a0a0a)
- `text-stone-100` - Primary text (#f5f5f4)
- `bg-stone-900` - Elevated surface (#18181b)
- `border-stone-800` - Border color (#27272a)
- `text-stone-400` - Secondary/tertiary text (#a1a1aa)
- `text-stone-500` - Disabled/metadata text (#71717a)
- `text-stone-700` - Interactive states (#3f3f46)

**Current Usage:**
```astro
<!-- Layout.astro -->
<body class="bg-stone-950 text-stone-100 antialiased">

<!-- index.astro header -->
<p class="mb-3 text-xs uppercase tracking-[0.24em] text-stone-400">Henks / Photography</p>
<div class="border-b border-stone-800 pb-10">

<!-- Link states -->
<a class="border border-stone-700 hover:border-stone-500 hover:bg-stone-900">
```

### Typography Tokens

No custom typography scale is defined. System uses **standard Tailwind typography utilities**:

**Font Stack:**
```css
/* From Welcome.astro component -->
font-family: Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif;
```

**Applied via Tailwind utilities:**
- `text-xs` - Metadata, labels (12px)
- `text-sm` - Body text, descriptions (14px)
- `text-4xl` / `text-6xl` - Main headings
- `font-semibold` / `font-medium` - Font weights
- `leading-tight` - Heading line-height
- `tracking-[0.24em]` - Custom letter-spacing for labels
- `antialiased` - Subpixel rendering optimization

### Spacing System

**Uses Tailwind's default spacing scale** (4px base unit):
- `px-4` / `py-3` - Component padding
- `px-5 py-2` - Button padding
- `gap-6` / `gap-4` - Component gaps
- `mb-12` / `mt-auto` - Margins
- `max-w-7xl` - Maximum container width (80rem)

**Responsive spacing:**
```astro
padding: 16px (md:px-10) mobile-first
margin-bottom: mb-12 (md:mb-16)
```

### No Custom Token System

**Important:** This project has **no custom token definition file** (no tailwind.config.js with theme extensions). All styling relies on **Tailwind defaults**. For Figma designs:
- Map Figma variables to Tailwind utility class names directly
- Do not create custom CSS variables—use only Tailwind classes
- If design requires Tailwind customization, extend theme in `tailwind.config.js`

---

## 2. Component Library

### Component Architecture

**Astro Components (.astro files)** - Server-side rendered, HTML-first approach

**Key Components:**

#### Layout Component
**File:** [src/layouts/Layout.astro](src/layouts/Layout.astro)
- Wraps all pages with meta tags, favicon links, body styling
- Provides title and description via props interface
- Default body classes: `bg-stone-950 text-stone-100 antialiased`

```astro
---
interface Props {
  title?: string;
  description?: string;
}

const { title = 'Henks Photography', description = '...' } = Astro.props;
---

<html lang="en">
  <body class="bg-stone-950 text-stone-100 antialiased">
    <slot />
  </body>
</html>
```

#### Welcome Component (Placeholder)
**File:** [src/components/Welcome.astro](src/components/Welcome.astro)
- Not currently used in production pages
- Demonstrates embedded SVG assets and scoped styling
- Reference for Astro component patterns

#### Page Component
**File:** [src/pages/index.astro](src/pages/index.astro)
- Main portfolio landing page
- **Not a reusable component**—contains page-specific data

### Reusable UI Patterns

While no formal component library exists, the codebase demonstrates these patterns:

1. **Card Component Pattern** (repeating `article.group` structure):
```astro
<article class="group overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40">
  <div class="aspect-4/5 overflow-hidden">
    <img class="transition duration-500 group-hover:scale-105" />
  </div>
  <div class="flex items-center justify-between px-4 py-3">
    <p class="text-sm font-medium text-stone-200">{photo.title}</p>
    <p class="text-xs uppercase tracking-[0.12em] text-stone-500">{photo.location}</p>
  </div>
</article>
```

2. **Button/Link Component Pattern**:
```astro
<a class="inline-flex w-fit items-center rounded-full border border-stone-700 px-5 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:bg-stone-900">
  Book a shoot
</a>
```

### No Component Documentation or Storybook

- **No Storybook** setup
- **No component.json/components manifest**
- **No isolated component library**
- Components exist only as page/layout structures

---

## 3. Frameworks & Libraries

### UI Framework

**Astro 5.18.1**
- Static/hybrid site generation
- Server-side rendering by default (.astro files)
- No client-side JS by default (zero JS shipped unless opted-in)
- File-based routing under `src/pages/`

### Styling Framework

**Tailwind CSS 4.2.2**
- Integrated via `@tailwindcss/vite` plugin in Vite
- Imported globally in [src/styles/global.css](src/styles/global.css):
  ```css
  @import "tailwindcss";
  ```
- No CSS Modules—utility-first approach
- No styled-components or CSS-in-JS

### CSS Methodology

**Utility-First (Tailwind CSS)**
- Classes applied directly to HTML elements
- No custom CSS classes beyond scoped component styles (see Welcome.astro)
- Hover/focus states via Tailwind modifiers: `hover:`, `group-hover:`
- Responsive via Tailwind breakpoints: `md:`, `sm:`, `lg:`

### Build System & Bundler

**Vite + Astro**
- Entry point: [astro.config.mjs](astro.config.mjs)
- Vite plugins: `@tailwindcss/vite`
- Output: Static HTML to `./dist/` (build command)
- Dev server: `astro dev` on localhost:4321

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [vercel()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Dependencies Summary

```json
{
  "dependencies": {
    "@astrojs/vercel": "^9.0.5",  // Deployment adapter
    "@tailwindcss/vite": "^4.2.2",  // CSS styling
    "astro": "^5.18.1",            // Framework
    "tailwindcss": "^4.2.2"        // Utility CSS library
  }
}
```

---

## 4. Asset Management

### Asset Storage Location

**Directory:** [public/](public/) and [src/assets/](src/assets/)

```
public/
├── favicon.ico        (not used in current config)
└── favicon.svg        (linked in Layout.astro)

src/assets/
├── astro.svg         (demo SVG, used in Welcome.astro)
└── background.svg    (demo background SVG)
```

### Asset Import & Reference Pattern

**In Astro components, use static import for optimization:**

```astro
---
import astroLogo from '../assets/astro.svg';
import background from '../assets/background.svg';
---

<!-- Access via .src property -->
<img src={astroLogo.src} alt="..." />
<img src={background.src} alt="" fetchpriority="high" />
```

**Why:** Static imports create optimized references and enable Astro's asset processing.

### Asset Optimization

- **Lazy loading:** `loading="lazy"` (used in photo grid)
- **Fetchpriority:** `fetchpriority="high"` for above-fold images
- **Image optimization:** Relying on Unsplash CDN for photo URLs (external images with size parameters)

```astro
<img
  src={photo.url}
  alt={`${photo.title}, ${photo.location}`}
  loading="lazy"
  class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
/>
```

### No CDN Configuration

- No explicit CDN setup in Astro config
- External images sourced from Unsplash with URL parameters
- Static assets served from Vercel deployment (auto-optimized)

---

## 5. Icon System

### Icon Storage & Format

**Format:** SVG files as static assets

**Storage locations:**
1. **Static assets:** [src/assets/](src/assets/) (for reusable SVGs like logos)
2. **Inline SVGs:** Embedded directly in components (e.g., Discord icon in Welcome.astro)

### Icon Usage Patterns

#### Pattern 1: SVG Asset Import
```astro
---
import astroLogo from '../assets/astro.svg';
---
<img src={astroLogo.src} width="115" height="48" alt="Astro Homepage" />
```

#### Pattern 2: Inline SVG HTML
```astro
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
  <path fill="currentColor" d="..." />
</svg>
```

**Benefits of inline SVG:**
- Smaller file size if used once
- Can be styled with CSS (e.g., `fill="currentColor"` respects text color)
- No additional HTTP request

#### Pattern 3: SVG as Background
```astro
<img id="background" src={background.src} alt="" fetchpriority="high" />
<style>
  #background {
    position: fixed;
    filter: blur(100px);
  }
</style>
```

### Icon Styling

**CSS approach for SVGs:**
```astro
<svg class="h-1em w-1em">  <!-- Matches text size -->
<svg class="text-stone-400" />  <!-- Inherits text color -->
<svg class="transition duration-300" />  <!-- Can animate -->

<!-- Using Tailwind classes -->
svg {
  height: 1em;  /* matches font size -->
  margin-left: 8px;
}
```

### Icon Naming Convention

**Current practice:** Descriptive filenames with extension
- ✅ `background.svg`, `astro.svg`, `favicon.svg`
- Pattern: `[feature]-[variant].[ext]` (implicit)

**Recommendation for growth:**
```
icons/
├── social/
│   ├── instagram.svg
│   ├── behance.svg
│   └── email.svg
├── ui/
│   ├── chevron-right.svg
│   └── close.svg
└── logos/
    └── astro.svg
```

---

## 6. Styling Approach

### CSS Methodology: Utility-First (Tailwind CSS)

**No CSS Modules, no styled-components.**

All styling is **Tailwind utility classes applied inline to HTML elements**.

### Global Styles

**File:** [src/styles/global.css](src/styles/global.css)

```css
@import "tailwindcss";
```

**What this does:**
- Imports Tailwind's base styles (CSS reset/normalizers)
- Includes Tailwind's component layer (minimal)
- Includes Tailwind's utilities layer
- Applies default styling to HTML elements

**No additional global CSS** beyond Tailwind import.

### Component Scoping

**Astro supports scoped styles** within `<style>` blocks:

```astro
---
// Component logic
---

<div id="container">
  <!-- HTML -->
</div>

<style>
  #container {
    font-family: Inter, Roboto, sans-serif;
  }
  
  #background {
    position: fixed;
    top: 0;
    z-index: -1;
    filter: blur(100px);
  }
</style>
```

**Scope behavior:**
- Styles are scoped to component by default (no name collision risk)
- Can use ID selectors, class selectors, element selectors
- Mixable with Tailwind classes (both approaches used in codebase)

### Responsive Design Approach

**Mobile-first Tailwind breakpoints:**

```astro
<!-- Heading: 4xl mobile, 6xl on md+ -->
<h1 class="text-4xl font-semibold leading-tight text-stone-100 md:text-6xl">

<!-- Padding: 6on mobile, different on md+ -->
<main class="px-6 pb-20 pt-10 md:px-10 md:pt-14">

<!-- Layout: 1 column (grid-cols-1) on mobile, 2 on sm+, 3 on lg+ -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

<!-- Flex direction change -->
<header class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
```

**Breakpoints defined by Tailwind defaults:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

### Hover & Interactive States

**Tailwind modifiers for interactivity:**
```astro
<!-- Color change on hover -->
<a class="text-stone-200 transition hover:border-stone-500 hover:bg-stone-900">

<!-- Scale animation on group hover -->
<img class="transition duration-500 group-hover:scale-105" />

<!-- Transition duration control -->
class="transition duration-300"  <!-- 300ms -->
class="transition duration-500"  <!-- 500ms (default) -->
```

### No Theme Customization

**Important:** No `tailwind.config.js` file exists.
- All styling uses **Tailwind defaults**
- If design requires custom token additions, must create `tailwind.config.js`:

```javascript
// Example: tailwind.config.js (to be created if needed)
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1a1a1a',
          accent: '#ffffff',
        },
      },
      spacing: {
        'safe': 'max(1rem, safe-area-inset-left)',
      },
    },
  },
};
```

---

## 7. Project Structure

### File Organization

```
cv/
├── .astro/                          # Astro build metadata (auto-generated)
├── .git/                            # Version control
├── .vscode/                         # VS Code settings
│   ├── extensions.json              # Recommended extensions
│   ├── launch.json                  # Debug config
│   └── mcp.json                     # MCP server configuration
├── public/                          # Static assets (copied as-is to build)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── assets/                      # Optimized static assets
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/                  # Reusable Astro components
│   │   └── Welcome.astro            # Demo component (not in use)
│   ├── layouts/                     # Layout wrapper components
│   │   └── Layout.astro             # Base HTML layout
│   ├── pages/                       # File-based routes
│   │   └── index.astro              # Homepage (/)
│   └── styles/                      # Global stylesheets
│       └── global.css               # @import "tailwindcss"
├── astro.config.mjs                 # Astro configuration
├── tsconfig.json                    # TypeScript strict config
├── package.json                     # Dependencies & scripts
├── package-lock.json
└── README.md
```

### Naming Conventions

#### File Naming
- `.astro` - Astro components (PascalCase: `Welcome.astro`, `Layout.astro`)
- `.css` - Stylesheets (kebab-case: `global.css`)
- `.svg` - Asset files (kebab-case: `background.svg`, `astro.svg`)
- `.mjs` - ES modules configuration (kebab-case: `astro.config.mjs`)
- `.json` - Config files (kebab-case: `tsconfig.json`)

#### Component Naming
- PascalCase for Astro components: `Welcome`, `Layout`, `PhotoCard`
- Use semantic HTML elements: `<article>`, `<section>`, `<header>`, `<footer>`, `<main>`

#### ID & Class Naming
- **IDs (single purpose):** kebab-case, component-scoped
  - `id="container"`, `id="background"`, `id="hero"`, `id="links"`
- **Classes:** Tailwind utilities (no custom classes defined)

### Folder Purpose

| Folder | Purpose |
|--------|---------|
| `public/` | Static assets copied directly to dist (favicons, robots.txt) |
| `src/assets/` | Optimized SVG & image assets for import in components |
| `src/components/` | Reusable Astro components |
| `src/layouts/` | Wrapper layout components for pages |
| `src/pages/` | File-based routing (each .astro = a route) |
| `src/styles/` | Global CSS (Tailwind import) |

### Build Process

**Dev:** `npm run dev` → Astro dev server with hot reload
**Build:** `npm run build` → Static HTML output to `./dist/`
**Preview:** `npm run preview` → Local preview of build
**Deploy:** Vercel (via @astrojs/vercel adapter)

---

## 8. Figma MCP Integration Guidelines

### How to Map Figma Designs to Code

When integrating designs from Figma using the MCP protocol:

#### 1. Color Mapping
- Figma color value → Map to nearest **stone-\*  Tailwind class**
- Example: Dark gray #3f3f46 → `text-stone-700`
- Create custom color token in `tailwind.config.js` if design requires out-of-palette colors
- Do NOT create CSS variables; use Tailwind theme extension

#### 2. Typography Mapping
- Figma text size/style → Map to Tailwind text utilities
  - 12px → `text-xs`
  - 14px → `text-sm`
  - 32px → `text-4xl`
  - 48px → `text-6xl`
- Font weight → `font-semibold`, `font-medium`
- Letter spacing → `tracking-wider`, or custom `tracking-[0.24em]`

#### 3. Component Implementation
- Create new `.astro` file in `src/components/` with PascalCase name
- Use Tailwind classes for styling (no scoped CSS unless necessary)
- Accept props via TypeScript interface in frontmatter
- Example template:

```astro
---
// ComponentName.astro
interface Props {
  title: string;
  variant?: 'primary' | 'secondary';
}

const { title, variant = 'primary' } = Astro.props;
---

<div class={`component ${variant === 'primary' ? 'text-stone-100' : 'text-stone-400'}`}>
  {title}
</div>
```

#### 4. Spacing & Layout
- All spacing values → Tailwind spacing scale (4px units)
- Responsive breakpoints → Use md:, sm:, lg: prefixes
- Container max-width → Use `max-w-7xl` (80rem) or extend in theme

#### 5. Asset Integration
- Figma asset exports → Save to `src/assets/`
- Static import pattern: `import logo from '../assets/logo.svg'`
- Image HTML: `<img src={logo.src} alt="..." />`
- Icons → Inline SVG or asset import depending on reuse

#### 6. No Component Library Required
- Components do NOT need separate Storybook entries
- Unit testing is not implemented; focus on visual verification
- Documentation: Inline component comments are sufficient

### Code Generation Workflow

When using Figma MCP tools:

1. **Export design from Figma** → Get design context via MCP
2. **Reference provided code** → Use as starting point, not final code
3. **Adapt to project conventions:**
   - Replace React hooks with Astro (if applicable)
   - Remove design tool hints and comments
   - Use Tailwind utilities instead of inline styles
   - Follow component structure shown above
4. **Verify against Figma screenshot** → Visual matching is primary success metric
5. **Test responsive behavior** → Manually test at md/sm/lg breakpoints

### Common Patterns to Reuse

#### Card/Article
```astro
<article class="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40">
  <div class="aspect-video">
    <img class="h-full w-full object-cover" />
  </div>
  <div class="px-4 py-3">
    <p class="text-sm font-medium text-stone-200"></p>
  </div>
</article>
```

#### Button/Link
```astro
<a class="inline-flex items-center rounded-full border border-stone-700 px-5 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:bg-stone-900">
</a>
```

#### Layout Grid
```astro
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
</div>
```

#### Text Hierarchy
```astro
<p class="text-xs uppercase tracking-[0.24em] text-stone-400">Label</p>
<h1 class="text-4xl font-semibold leading-tight text-stone-100 md:text-6xl">Heading</h1>
<p class="text-sm text-stone-500">Metadata</p>
```

---

## Summary for LLMs

### Key Constraints
1. **No custom theme config** — extend Tailwind if new colors needed
2. **Utility-first only** — no CSS Modules or styled-components
3. **Astro component syntax** —  not React
4. **Static site** — no client-side interactivity by default
5. **Stone color palette** — primary design tokens
6. **Mobile-first responsive** — design for mobile, enhance with md:, lg:, etc.

### To Generate Code from Figma Designs:
1. Map colors to stone-* utilities
2. Map typography to text-* utilities
3. Use Tailwind spacing for layout
4. Create .astro components with TypeScript props
5. Test responsive at md/lg breakpoints
6. Inline SVG assets or import from src/assets/

