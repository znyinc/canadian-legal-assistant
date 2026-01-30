# React 18.3 Patterns

## Component Structure
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface MyComponentProps {
  matterId: string;
  onUpdate?: (data: Matter) => void;
}

export function MyComponent({ matterId, onUpdate }: MyComponentProps) {
  const [data, setData] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Data fetching
  }, [matterId]);
  
  return (
    <div className="container mx-auto px-4">
      {/* Component content */}
    </div>
  );
}
```

## Hook Patterns

### Data Fetching
```typescript
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getMatter(matterId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [matterId]);
```

### Form Handling
```typescript
const [formData, setFormData] = useState({
  description: '',
  province: 'Ontario',
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await api.createMatter(formData);
    navigate(`/matters/${result.id}`);
  } catch (err) {
    setError(err.message);
  }
};
```

## Component Naming
- **Pages:** `MyPage.tsx` (e.g., `MatterDetailPage.tsx`)
- **Components:** `MyComponent.tsx` (e.g., `ImmediateActionsCard.tsx`)
- **Hooks:** `useMyHook.ts` (if custom hooks needed)

## Props Patterns
- Use TypeScript interfaces for props
- Optional callbacks with `?` suffix
- Destructure props in function signature
- Use React.FC sparingly (prefer explicit function syntax)

## State Management
- **Local state:** useState for component-specific data
- **Derived state:** Compute from props/state, don't duplicate
- **Lifting state:** Move to parent when multiple children need access
- **NO Redux:** Project uses React hooks only

## Accessibility (WCAG 2.1 AA)
```typescript
<button
  aria-label="Delete matter"
  aria-describedby="delete-warning"
  onClick={handleDelete}
  className="focus:ring-2 focus:ring-blue-500"
>
  Delete
</button>

<div id="delete-warning" role="alert" aria-live="assertive">
  {error && <p className="text-red-600">{error}</p>}
</div>
```

## Loading States
```typescript
if (loading) {
  return <div className="animate-pulse">Loading...</div>;
}

if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4" role="alert">
      <p className="text-red-800">{error}</p>
    </div>
  );
}

if (!data) {
  return <div>No data found</div>;
}
```

## List Rendering
```typescript
{items.map((item) => (
  <div key={item.id} className="border rounded p-4 mb-2">
    <h3>{item.title}</h3>
    <p>{item.description}</p>
  </div>
))}
```

## Conditional Rendering
```typescript
{/* Prefer && for simple conditionals */}
{showWarning && <Warning message="Important notice" />}

{/* Use ternary for if/else */}
{isApproved ? <ApprovedBadge /> : <PendingBadge />}

{/* Use early returns for complex conditions */}
if (!user) return <LoginPrompt />;
```
