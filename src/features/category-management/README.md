# Category Management Feature

This feature implements the FSD (Feature-Sliced Design) architecture for category management functionality.

## Structure

```
src/features/category-management/
├── entities/
│   └── category/
│       └── model/
│           └── types.ts              # Category entity types and interfaces
├── lib/
│   └── useCategoryActions.ts         # Category management business logic and actions
├── shared/
│   └── ui/
│       └── components/
│           ├── CategoryTable.tsx     # Reusable category table component
│           └── BatteryList.tsx       # Reusable battery list component
├── ui/
│   └── CategoryManagement.tsx        # Main category management component
├── ui/index.ts                      # Public UI API
├── index.ts                          # Feature public API
└── README.md                         # This documentation
```

## FSD Layers

### 📱 Entities Layer

Contains business entities and their types:

- `CategoryWithBatteryData` interface with brandName, series, salesTax
- `BatteryData` interface with detailed battery information
- `CategoryFormData` for form handling
- API request/response types for create, update, delete operations

### 🧩 Shared Layer

Contains reusable UI components:

- `CategoryTable` - Display categories with search and actions (view, edit, delete)
- `BatteryList` - Display and manage batteries within a category with price editing

### ⚙️ Process Layer (lib)

Contains business logic and state management:

- `useCategoryActions` - Custom hook for category operations
- API integration with proper error handling
- Price update functionality
- Battery management operations

### 🎨 UI Layer

Contains page-specific UI components:

- `CategoryManagement` - Main component orchestrating the feature
- Integrates all layers and handles component composition
- Manages modals, search, and user interactions

## Usage

```tsx
import { CategoryManagement } from '@/features/category-management';

export default function CategoriesPage() {
  return (
    <JotaiProvider>
      <CategoryErrorBoundary>
        <CategoryManagement />
      </CategoryErrorBoundary>
    </JotaiProvider>
  );
}
```

## Data Flow

- **GlobalDataProvider** pre-loads categories data at app level
- **Shared atoms** (`categoriesAtom`, `fetchCategoriesAtom`) manage state
- **No redundant fetching** - single source of truth
- **Real-time search** filtering
- **Price editing** with optimistic updates

## Key Features

- ✅ **Real-time search** filtering for categories and batteries
- ✅ **Price editing** for individual batteries
- ✅ **Global sales tax** management
- ✅ **Battery deletion** with confirmation
- ✅ **Category CRUD operations** (Create, Read, Update, Delete)
- ✅ **Optimistic updates** for better UX
- ✅ **Proper TypeScript typing** throughout all layers
- ✅ **Reusable components** in shared layer
- ✅ **Separation of concerns** following FSD principles
- ✅ **Error handling** with toast notifications
- ✅ **Responsive design** preserving original UI

## Migration Notes

This feature replaces the old `categoryLayout.tsx` file with a proper FSD structure. The old layout file can now be deprecated or removed. The functionality has been enhanced with:

- Better state management using Jotai atoms
- Optimistic updates for improved user experience
- Proper error handling and loading states
- Reusable components following FSD principles
- Enhanced search functionality
- Improved price editing workflow

## Preserved Functionality

All original functionality from `categoryLayout.tsx` has been preserved:

- ✅ Category listing with search
- ✅ Battery management within categories
- ✅ Price editing interface
- ✅ Global sales tax controls
- ✅ Delete operations with confirmation
- ✅ History tracking (when implemented)
- ✅ PDF upload functionality (when implemented)
- ✅ All original styling and design elements
