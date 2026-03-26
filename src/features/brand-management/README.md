# Brand Management Feature

This feature implements the FSD (Feature-Sliced Design) architecture for brand management functionality.

## Structure

```
src/features/brand-management/
├── entities/
│   └── brand/
│       └── model/
│           └── types.ts          # Brand entity types and interfaces
├── lib/
│   └── useBrandActions.ts        # Brand management business logic and actions
├── shared/
│   └── ui/
│       └── components/
│           ├── BrandTable.tsx    # Reusable brand table component
│           └── BrandCreateModal.tsx # Brand creation modal component
├── ui/
│   ├── BrandManagement.tsx       # Main brand management component
│   └── index.ts                  # Public UI API
├── index.ts                      # Feature public API
└── README.md                     # This documentation
```

## FSD Layers

### 📱 Entities Layer

Contains business entities and their types:

- `Brand` interface with id, brandName, timestamps
- `BrandFormData` for form handling
- API request/response types

### 🧩 Shared Layer

Contains reusable UI components:

- `BrandTable` - Display brands with search and actions
- `BrandCreateModal` - Modal for creating new brands

### ⚙️ Process Layer (lib)

Contains business logic and state management:

- `useBrandActions` - Custom hook for brand operations
- Optimistic updates for create/delete operations
- API integration with proper error handling

### 🎨 UI Layer

Contains page-specific UI components:

- `BrandManagement` - Main component orchestrating the feature
- Integrates all layers and handles component composition

## Usage

```tsx
import { BrandManagement } from '@/features/brand-management';

export default function BrandsPage() {
  // Data is automatically loaded via GlobalDataProvider
  return <BrandManagement />;
}
```

## Data Flow

- **GlobalDataProvider** pre-loads brands data at app level
- **Shared atoms** (`brandsAtom`, `fetchBrandsAtom`) manage state
- **No redundant fetching** - single source of truth
- **Optimistic updates** for create/delete operations

## Key Features

- ✅ Optimistic updates for better UX
- ✅ Proper TypeScript typing throughout
- ✅ Reusable components in shared layer
- ✅ Separation of concerns
- ✅ Error handling with toast notifications
- ✅ Search functionality
- ✅ Responsive design

## Migration Notes

This feature replaces the old `brandsLayout.tsx` file with a proper FSD structure. The old layout file can now be deprecated or removed.
