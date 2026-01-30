# Tailwind CSS Styling Conventions

## Design System

### Color Palette
```typescript
// Primary colors (Blue for actions)
bg-blue-50, bg-blue-100, ..., bg-blue-900
text-blue-600, border-blue-500

// Semantic colors
bg-red-50, text-red-800      // Errors, critical alerts
bg-yellow-50, text-yellow-800 // Warnings, caution
bg-green-50, text-green-800   // Success, completion
bg-gray-50, text-gray-700     // Neutral, info

// Domain-specific (from ActionPlanGenerator)
bg-red-50        // Criminal
bg-blue-50       // Civil
bg-purple-50     // Employment
bg-yellow-50     // L/T
bg-green-50      // Other
```

### Typography Scale
```css
text-xs      /* 12px - Small labels */
text-sm      /* 14px - Secondary text */
text-base    /* 16px - Body text (default) */
text-lg      /* 18px - Emphasized text */
text-xl      /* 20px - Subheadings */
text-2xl     /* 24px - Page headings */
text-3xl     /* 30px - Hero headings */

font-normal  /* 400 - Body text */
font-medium  /* 500 - Emphasized */
font-semibold /* 600 - Headings */
font-bold    /* 700 - Strong emphasis */
```

### Spacing Scale
```css
p-2   /* 8px - Tight padding */
p-4   /* 16px - Default padding */
p-6   /* 24px - Spacious padding */
p-8   /* 32px - Large padding */

m-2   /* 8px - Tight margin */
m-4   /* 16px - Default margin */
m-6   /* 24px - Section spacing */
m-8   /* 32px - Large gaps */

gap-2  /* Grid/flex gaps */
space-y-4  /* Vertical stack spacing */
```

## Responsive Breakpoints
```css
/* Mobile-first approach */
sm:   /* 640px+ - Tablets */
md:   /* 768px+ - Small laptops */
lg:   /* 1024px+ - Desktops */
xl:   /* 1280px+ - Large screens */

/* Example usage */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Component Patterns

### Cards
```tsx
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
  <h3 className="text-xl font-semibold mb-2">Title</h3>
  <p className="text-gray-700">Content</p>
</div>
```

### Buttons
```tsx
{/* Primary action */}
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Submit
</button>

{/* Secondary action */}
<button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 focus:ring-2 focus:ring-gray-500">
  Cancel
</button>

{/* Danger action */}
<button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500">
  Delete
</button>

{/* Disabled state */}
<button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
  Disabled
</button>
```

### Form Inputs
```tsx
<div className="mb-4">
  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
    Description <span className="text-red-600" aria-label="required">*</span>
  </label>
  <textarea
    id="description"
    name="description"
    rows={4}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    aria-required="true"
  />
</div>

<div className="mb-4">
  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
    Province
  </label>
  <select
    id="province"
    name="province"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
  >
    <option value="Ontario">Ontario</option>
    <option value="BC">British Columbia</option>
  </select>
</div>
```

### Alerts/Banners
```tsx
{/* Info banner */}
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
  <p className="text-blue-800">This is information only, not legal advice.</p>
</div>

{/* Warning banner */}
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
  <p className="text-yellow-800">Deadline approaching in 7 days.</p>
</div>

{/* Error banner */}
<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
  <p className="text-red-800">Failed to save matter.</p>
</div>

{/* Success banner */}
<div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
  <p className="text-green-800">Matter created successfully!</p>
</div>
```

### Navigation
```tsx
<nav className="bg-white border-b border-gray-200 shadow-sm">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      <a href="/" className="text-xl font-bold text-blue-600">
        Legal Assistant
      </a>
      <div className="flex space-x-4">
        <a href="/matters" className="text-gray-700 hover:text-blue-600">
          Matters
        </a>
        <a href="/caselaw" className="text-gray-700 hover:text-blue-600">
          Case Law
        </a>
      </div>
    </div>
  </div>
</nav>
```

### Badges
```tsx
{/* Priority badges */}
<span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
  URGENT
</span>

<span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
  SOON
</span>

<span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
  WHEN READY
</span>
```

### Loading States
```tsx
{/* Spinner */}
<div className="flex justify-center items-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
</div>

{/* Skeleton loader */}
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

## Accessibility (WCAG 2.1 AA)

### Focus States
```tsx
{/* Always include focus rings */}
className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
```

### Color Contrast
```css
/* Ensure 4.5:1 contrast ratio */
✅ text-gray-700 on bg-white     (7.0:1)
✅ text-blue-800 on bg-blue-50   (8.2:1)
✅ text-red-800 on bg-red-50     (8.0:1)
❌ text-gray-400 on bg-white     (2.8:1 - fails)
```

### Touch Targets
```tsx
{/* Minimum 44x44px touch targets */}
<button className="px-4 py-2 min-h-[44px]">
  Click Me
</button>
```

## Layout Patterns

### Container
```tsx
<div className="container mx-auto px-4 max-w-7xl">
  {/* Constrained content width with padding */}
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### Flexbox
```tsx
<div className="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

<div className="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Utility-First Philosophy
```tsx
{/* ✅ Prefer utility classes */}
<div className="bg-white rounded-lg shadow-md p-6">

{/* ❌ Avoid custom CSS unless absolutely necessary */}
<div className="custom-card">
```

## Custom Styles (When Needed)
```tsx
{/* Use Tailwind's @apply in component CSS files */}
/* Component.module.css */
.custom-scrollbar {
  @apply overflow-y-auto;
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
}
```
