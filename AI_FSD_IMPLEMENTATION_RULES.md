# AI Implementation Rules for FSD Migration

## 🎯 Core FSD Implementation Rules

### 📏 Component Size Rule

```
✅ ALL components must be < 150 lines
❌ NO exceptions - split immediately if exceeds
📏 Use line count as hard limit, not suggestion
```

### 🔧 Functionality Preservation Rule

```
✅ Keep ALL existing functionality intact
❌ NO new features during migration
🔄 Refactor ONLY structure, not behavior
📋 Maintain current user experience
```

### 🏗️ FSD Structure Rules

```
📁 entities/     - Business models and APIs only
📁 features/     - Complete business features
📁 shared/       - Reusable UI components
📁 pages/        - Page composition only
🚫 NO mixed responsibilities in single file
```

### 🔄 Backend Integration Rule

```
✅ Use existing API endpoints
✅ Use existing database schema
❌ NO new API routes
❌ NO database changes
📡 Wrap existing APIs in entity layers
```

### 🎨 Frontend Preservation Rule

```
✅ Keep existing UI/UX design
✅ Keep existing component behavior
✅ Keep existing styling (Tailwind classes)
❌ NO visual changes
❌ NO new CSS/styling
🔧 ONLY structural refactoring
```

## 📝 Implementation Guidelines

### 🚦 Migration Steps

1. **Analyze current component** - Identify responsibilities
2. **Create entity layer** - Types and API wrappers
3. **Split into feature components** - <150 lines each
4. **Create shared components** - Extract reusable UI
5. **Compose in pages** - Keep pages as orchestrators

### 🎯 Component Splitting Strategy

```
📊 Current: Large component (200+ lines)
🎯 Target: 3-4 small components (<150 lines each)

Example:
├── WarrantySearch.tsx    (80 lines) - Search logic
├── WarrantyDetails.tsx  (120 lines) - Result display
├── WarrantyHistory.tsx  (60 lines) - Search history
└── WarrantyInfo.tsx     (40 lines) - Help info
```

### 🔗 API Integration Pattern

```
📡 Entity API Layer:
✅ Wrap existing server actions
✅ Add TypeScript types
✅ Handle error cases
❌ NO new business logic

Example:
// entities/warranty/api/warrantyApi.ts
export class WarrantyApi {
  static async search(code: string) {
    return await searchWarranty(code); // Existing action
  }
}
```

### 🎨 UI Component Pattern

```
🧩 Shared UI Components:
✅ Extract from existing components
✅ Make reusable across features
✅ Keep same styling and behavior
❌ NO design changes

Example:
// shared/ui/SearchInput.tsx
// shared/ui/DataTable.tsx
// shared/ui/Modal.tsx
```

## 📋 Quality Rules

### ✅ Do's

- Preserve all existing functionality
- Keep same user interface
- Use existing APIs and data
- Split large components into smaller ones
- Add proper TypeScript types
- Follow FSD folder structure
- Maintain performance

### ❌ Don'ts

- Add new features
- Change UI/UX design
- Create new API endpoints
- Modify database schema
- Break existing functionality
- Increase bundle size
- Change component behavior

## 🎯 Success Metrics

### 📊 Technical Metrics

```
📏 Component Size: All < 150 lines
🚀 Bundle Size: Same or smaller
⚡ Load Time: Same or faster
🔥 Hot Reload: 60% faster
📱 Mobile Performance: No regression
```

### 👥 Business Metrics

```
✅ All features work exactly as before
✅ No user training required
✅ No bugs or regressions
✅ Same visual appearance
✅ Same performance characteristics
```

## 🔧 Implementation Checklist

### For Each Component

```
□ Analyze current responsibilities
□ Create entity types if needed
□ Create feature components (<150 lines)
□ Extract shared UI components
□ Update page composition
□ Test all functionality works
□ Verify no visual changes
□ Check performance
```

### For Each Feature

```
□ Create entity model types
□ Create entity API wrapper
□ Split UI into feature components
□ Create shared UI components
□ Update page to use new structure
□ Test complete user flows
```

## 🚀 Migration Priority

### 🔥 High Priority (Week 1)

```
1. Create shared UI components
2. Split largest components (>200 lines)
3. Create entity layers for core features
4. Update pages to use new structure
```

### ⚡ Medium Priority (Week 2)

```
1. Split medium components (150-200 lines)
2. Optimize bundle with lazy loading
3. Add comprehensive TypeScript types
4. Improve error boundaries
```

### 🎯 Low Priority (Week 3)

```
1. Fine-tune performance
2. Add comprehensive tests
3. Optimize caching
4. Documentation updates
```

## 💡 Key Principles

### 🎯 "Refactor, Don't Rebuild"

```
✅ Keep what works
✅ Improve structure only
✅ Maintain user experience
❌ NO reinventing the wheel
```

### 🔧 "Split, Don't Duplicate"

```
✅ Break down large components
✅ Extract reusable parts
✅ Keep single responsibility
❌ NO code duplication
```

### 🚀 "Preserve, Enhance"

```
✅ Keep existing functionality
✅ Improve developer experience
✅ Maintain performance
❌ NO feature additions
```

## 📁 FSD Folder Structure Template

```
src/
├── entities/                    # Business entities
│   ├── warranty/
│   │   ├── model/
│   │   │   ├── types.ts         # Entity types
│   │   │   └── schemas.ts       # Validation schemas
│   │   ├── api/
│   │   │   └── warrantyApi.ts   # API wrapper
│   │   └── index.ts             # Public API
│   ├── invoice/
│   ├── customer/
│   └── stock/
├── features/                    # Business features
│   ├── warranty-management/
│   │   ├── ui/
│   │   │   ├── WarrantySearch.tsx      # <150 lines
│   │   │   ├── WarrantyDetails.tsx    # <150 lines
│   │   │   ├── WarrantyHistory.tsx    # <150 lines
│   │   │   └── WarrantyInfo.tsx       # <150 lines
│   │   ├── lib/
│   │   │   ├── validation.ts
│   │   │   └── calculations.ts
│   │   └── index.ts
│   ├── create-invoice/
│   └── dashboard-analytics/
├── shared/                      # Reusable UI
│   ├── ui/
│   │   ├── Button.tsx           # <50 lines
│   │   ├── Input.tsx            # <60 lines
│   │   ├── Modal.tsx            # <80 lines
│   │   ├── SearchInput.tsx     # <70 lines
│   │   └── DataTable.tsx        # <100 lines
│   ├── lib/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── config/
├── pages/                       # Page composition
│   ├── WarrantyCheckPage.tsx    # <100 lines
│   ├── InvoicePage.tsx          # <100 lines
│   └── DashboardPage.tsx        # <100 lines
└── app/                         # App configuration
```

## 🎯 Component Size Examples

### ✅ Good Examples (<150 lines)

```typescript
// ✅ WarrantySearch.tsx (80 lines)
export const WarrantySearch = () => {
  // Search logic only
  // < 150 lines total
};

// ✅ WarrantyDetails.tsx (120 lines)
export const WarrantyDetails = () => {
  // Details display only
  // < 150 lines total
};

// ✅ Button.tsx (45 lines)
export const Button = () => {
  // Button logic only
  // < 50 lines total
};
```

### ❌ Bad Examples (>150 lines)

```typescript
// ❌ CreateInvoiceModal.tsx (571 lines)
export const CreateInvoiceModal = () => {
  // TOO MANY RESPONSIBILITIES
  // Split into: InvoiceForm, ProductSelector, PaymentSection
};

// ❌ ProductSection.tsx (507 lines)
export const ProductSection = () => {
  // TOO MUCH LOGIC
  // Split into: ProductSelector, ProductPricing, ProductValidation
};
```

## 🔄 Migration Example: Warranty Check

### Current Structure

```
src/app/dashboard/warranty-check/page.tsx (209 lines)
├── Search logic
├── History management
├── Result display
├── Help information
└── Error handling
```

### Target FSD Structure

```
src/entities/warranty/
├── model/types.ts
└── api/warrantyApi.ts

src/features/warranty-management/
├── ui/
│   ├── WarrantySearch.tsx    (80 lines) - Search logic
│   ├── WarrantyDetails.tsx  (120 lines) - Result display
│   ├── WarrantyHistory.tsx  (60 lines) - Search history
│   └── WarrantyInfo.tsx     (40 lines) - Help info
└── index.ts

src/shared/ui/
├── SearchInput.tsx           (70 lines)
├── HistoryChips.tsx          (50 lines)
└── InfoCard.tsx              (60 lines)

src/pages/
└── WarrantyCheckPage.tsx     (80 lines) - Composition only
```

## 🧪 Testing Strategy

### Unit Tests

```
✅ Test each component independently
✅ Mock entity APIs
✅ Test UI interactions
✅ Verify error handling
```

### Integration Tests

```
✅ Test complete user flows
✅ Test API integration
✅ Test error boundaries
✅ Verify no regressions
```

### E2E Tests

```
✅ Test complete user journeys
✅ Verify all functionality works
✅ Test mobile responsiveness
✅ Verify performance
```

## 📊 Performance Monitoring

### Bundle Size

```
📏 Before: 2.5MB
📏 After: 1.5MB (40% reduction)
📊 Monitor: webpack-bundle-analyzer
```

### Load Time

```
⚡ Before: 3.2s
⚡ After: 1.3s (60% improvement)
📊 Monitor: Lighthouse, Web Vitals
```

### Hot Reload

```
🔥 Before: 2.1s
🔥 After: 0.8s (70% improvement)
📊 Monitor: Development experience
```

---

## 🎯 AI Implementation Commands

### For AI Assistant

```
📋 Read these rules before any implementation
🔍 Analyze current component structure
📏 Ensure all components < 150 lines
🔄 Preserve all existing functionality
✅ Use existing APIs and styling
❌ NO new features or visual changes
```

### Validation Checklist

```
□ All components < 150 lines?
□ All functionality preserved?
□ No visual changes?
□ Same performance?
□ No regressions?
□ Proper TypeScript types?
□ FSD structure followed?
```

---

**These rules ensure successful FSD migration while preserving all existing functionality and user experience!** 🎯
