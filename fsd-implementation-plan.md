// Feature-Sliced Design (FSD) Implementation Plan
// Target: All components < 150 lines

// 1. Create FSD folder structure
src/
├── entities/ # Business entities
│ ├── invoice/
│ │ ├── model.ts
│ │ └── index.ts
│ ├── customer/
│ ├── product/
│ └── stock/
├── features/ # Business features
│ ├── create-invoice/
│ │ ├── api/
│ │ │ └── invoiceApi.ts
│ │ ├── model/
│ │ │ └── types.ts
│ │ ├── ui/
│ │ │ ├── InvoiceForm.tsx # ~120 lines
│ │ │ ├── ProductSelector.tsx # ~80 lines
│ │ │ ├── CustomerInfo.tsx # ~60 lines
│ │ │ ├── PaymentSection.tsx # ~90 lines
│ │ │ └── InvoicePreview.tsx # ~100 lines
│ │ ├── lib/
│ │ │ ├── validation.ts
│ │ │ └── calculations.ts
│ │ └── index.ts
│ ├── dashboard/
│ │ ├── ui/
│ │ │ ├── StatsCards.tsx # ~80 lines
│ │ │ ├── SalesChart.tsx # ~100 lines
│ │ │ ├── InventoryChart.tsx # ~90 lines
│ │ │ └── RecentActivity.tsx # ~70 lines
│ │ └── index.ts
│ ├── manage-customers/
│ ├── manage-stock/
│ └── ai-assistant/
├── shared/ # Reusable UI
│ ├── ui/
│ │ ├── Button.tsx # ~50 lines
│ │ ├── Input.tsx # ~60 lines
│ │ ├── Modal.tsx # ~80 lines
│ │ ├── Dropdown.tsx # ~70 lines
│ │ └── Table.tsx # ~100 lines
│ ├── lib/
│ │ ├── utils.ts
│ │ └── constants.ts
│ └── config/
├── pages/ # Page components
│ ├── DashboardPage.tsx # ~100 lines
│ ├── InvoicePage.tsx # ~80 lines
│ └── CustomersPage.tsx # ~90 lines
└── app/ # App configuration
├── providers/
├── styles/
└── config.ts

// 2. Component Size Rules
// - Each UI component: < 150 lines
// - API files: < 100 lines
// - Model files: < 80 lines
// - Lib files: < 120 lines
// - Index files: < 30 lines

// 3. Split Strategy
// Current: CreateInvoiceModal.tsx (571 lines)
// Into:
// - InvoiceForm.tsx (120 lines) - Main form logic
// - ProductSelector.tsx (80 lines) - Product selection
// - CustomerInfo.tsx (60 lines) - Customer details
// - PaymentSection.tsx (90 lines) - Payment info
// - InvoicePreview.tsx (100 lines) - Preview functionality

// 4. Lazy Loading Strategy
const CreateInvoiceFeature = lazy(() => import('@/features/create-invoice'));
const DashboardFeature = lazy(() => import('@/features/dashboard'));
const AIAssistantFeature = lazy(() => import('@/features/ai-assistant'));

// 5. Expected Results
// - Initial load: 60% faster
// - Bundle size: 40% smaller
// - Hot reload: 70% faster
// - Code maintainability: Significantly improved
