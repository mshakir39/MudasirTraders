# Customer Management Feature

This feature implements the FSD (Feature-Sliced Design) architecture for customer management functionality.

## Structure

```
src/features/customer-management/
├── entities/
│   └── customer/
│       └── model/
│           └── types.ts              # Customer entity types and interfaces
├── lib/
│   └── useCustomerActions.ts         # Customer management business logic and actions
├── shared/
│   └── ui/
│       └── components/
│           ├── CustomerTable.tsx     # Reusable customer table component
│           └── CustomerModal.tsx     # Customer creation/editing modal component
├── ui/
│   ├── CustomerManagement.tsx        # Main customer management component
│   ├── CustomerModal.tsx              # Re-export of shared modal
│   └── index.ts                      # Public UI API
├── index.ts                          # Feature public API
└── README.md                         # This documentation
```

## FSD Layers

### 📱 Entities Layer

Contains business entities and their types:

- `Customer` interface with \_id, customerName, phoneNumber, address, email, timestamps
- `CustomerFormData` for form handling
- API request/response types for create, update, delete operations

### 🧩 Shared Layer

Contains reusable UI components:

- `CustomerTable` - Display customers with search and actions (view invoices, edit, delete)
- `CustomerModal` - Modal for creating/editing customers

### ⚙️ Process Layer (lib)

Contains business logic and state management:

- `useCustomerActions` - Custom hook for customer operations
- Optimistic updates for create operations
- API integration with proper error handling
- Global state management integration

### 🎨 UI Layer

Contains page-specific UI components:

- `CustomerManagement` - Main component orchestrating the feature
- Integrates all layers and handles component composition
- Manages search, modal state, and user interactions

## Usage

```tsx
import { CustomerManagement } from '@/features/customer-management';

export default function CustomersPage() {
  return (
    <CustomerManagement
      onViewInvoices={(customer) => {
        // Handle viewing customer invoices
      }}
    />
  );
}
```

## Data Flow

- **GlobalDataProvider** pre-loads customers data at app level
- **Shared atoms** (`customersAtom`, `fetchCustomersAtom`) manage state
- **No redundant fetching** - single source of truth
- **Optimistic updates** for create operations
- **Real-time search** filtering

## Key Features

- ✅ Optimistic updates for better UX
- ✅ Proper TypeScript typing throughout
- ✅ Reusable components in shared layer
- ✅ Separation of concerns
- ✅ Error handling with toast notifications
- ✅ Real-time search functionality
- ✅ Customer creation and editing
- ✅ Customer deletion with confirmation
- ✅ Integration with invoice viewing

## Migration Notes

This feature replaces the old `customersLayout.tsx` file with a proper FSD structure. The old layout file can now be deprecated or removed. The functionality has been enhanced with:

- Better state management using Jotai atoms
- Optimistic updates for improved user experience
- Proper error handling and loading states
- Reusable components following FSD principles
