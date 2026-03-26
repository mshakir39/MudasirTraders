# Mudasir Traders - Invoice Management System

A comprehensive invoice management system built with modern web technologies, featuring advanced invoice operations, payment tracking, thermal printing, and customer management.

## 🌟 Key Features

### 📋 Invoice Management

- **Create & Edit Invoices** - Full CRUD operations with validation
- **Invoice Preview** - Real-time preview modal with all details
- **Invoice Status Management** - Active, Voided, Deleted, Archived states
- **Invoice Number Generation** - Automatic sequential numbering
- **Custom Date Support** - Override system dates for special cases

### 🔄 Advanced Invoice Operations

- **Invoice Consolidation** - Merge multiple invoices into one
- **Invoice Replacement** - Void and replace invoices with new ones
- **View Replacement Links** - Quick navigation between related invoices
- **Void Invoice Tracking** - Complete audit trail of voided invoices
- **Consolidated Invoice Preview** - Shows both old and new invoice amounts

### 💳 Payment Management

- **Multi-Payment Support** - Track multiple payments per invoice
- **Payment Methods** - Cash, Bank Transfer, JazzCash, EasyPaisa, Credit Card
- **Payment Status Tracking** - Pending, Partial, Paid statuses
- **Add Payment Modal** - Easy payment addition with validation
- **Battery Trade-in** - Old battery deductions support
- **Payment History** - Complete payment timeline with dates

### 🖨️ Thermal Printing

- **Thermal Printer Support** - Optimized for 80mm thermal printers
- **Professional Receipt Format** - Company branding and proper formatting
- **Consolidated Invoice Printing** - Shows previous invoice amounts
- **Payment Details** - Complete payment breakdown on receipts
- **Warranty Codes** - Product warranty information printing
- **Battery Details** - Full battery specifications on receipts

### 📊 Data Management

- **Advanced Filtering** - Filter by status, customer, date range
- **Search Functionality** - Quick invoice search
- **Data Tables** - Sortable, paginated invoice listings
- **Export Features** - Data export capabilities
- **Real-time Updates** - Live data synchronization

### 👥 Customer Management

- **Customer Database** - Complete customer information tracking
- **Customer History** - Invoice and payment history per customer
- **Contact Management** - Phone numbers, addresses, contact details
- **Customer Types** - Walk-in, Regular, Wholesale classifications

### 📦 Product & Inventory

- **Product Catalog** - Comprehensive product database
- **Battery Specifications** - Detailed battery information (plates, AH, type)
- **Brand Management** - Multi-brand product support
- **Stock Tracking** - Inventory management integration
- **Pricing Management** - Flexible pricing structures

### 🎯 User Interface

- **Modern Design** - Clean, intuitive interface
- **Responsive Layout** - Works on all device sizes
- **Modal-based Interactions** - Seamless user experience
- **Loading States** - Professional loading indicators
- **Error Handling** - Comprehensive error management
- **Toast Notifications** - User feedback system

### 🔧 Technical Features

- **TypeScript** - Type-safe development
- **React 18** - Modern React with hooks
- **State Management** - Efficient state handling
- **API Integration** - RESTful API connectivity
- **Form Validation** - Client-side validation with error messages
- **Data Persistence** - MongoDB database integration

## 🏗️ Architecture

### Frontend Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Jotai** - State management
- **React Table** - Data table component

### Backend Stack

- **Node.js** - Server runtime
- **MongoDB** - NoSQL database
- **REST API** - API architecture
- **Data Validation** - Input validation and sanitization

### Key Components

- **InvoiceManagement** - Main invoice dashboard
- **InvoiceDataTable** - Invoice listing with advanced features
- **InvoicePreviewModal** - Invoice preview and editing
- **InvoicePaymentModal** - Payment management
- **ThermalPrinter** - Receipt printing utility

## 📋 Invoice Features in Detail

### Invoice Creation

- Customer information input
- Product selection with pricing
- Payment method selection
- Battery trade-in support
- Automatic calculations
- Invoice number generation

### Invoice Consolidation

- Select multiple invoices to consolidate
- Preserve original invoice data
- Add new products to consolidated invoice
- Automatic total calculations
- Clear consolidation history
- Voided invoice tracking

### Payment Processing

- Multiple payment methods support
- Partial payment tracking
- Payment history timeline
- Automatic status updates
- Battery deduction calculations
- Payment validation

### Thermal Printing

- Optimized for 80mm thermal printers
- Company logo and branding
- Complete invoice details
- Payment breakdown
- Warranty codes
- Battery specifications
- Professional formatting

## 🎯 Business Logic

### Invoice Calculations

- **Subtotal**: Sum of all product prices
- **Tax Amount**: Automatic tax calculations
- **Total Amount**: Subtotal + Tax
- **Received Amount**: Initial + Additional payments
- **Remaining Amount**: Total - Received - Battery deductions
- **Payment Status**: Based on remaining amount

### Consolidation Logic

- **Previous Amounts**: Sum of consolidated invoices
- **New Items**: Products added to consolidated invoice
- **Total Amount**: Previous + New items
- **Payment Tracking**: Separate payment tracking for consolidated invoices

### Status Management

- **Active**: Regular active invoice
- **Voided**: Invoice was voided/replaced
- **Deleted**: Soft-deleted invoice
- **Archived**: Archived for record-keeping

## 🔍 Advanced Features

### Invoice Relationships

- **Replaced By**: Points to replacement invoice
- **Replaces Invoice**: Points to original invoice
- **Consolidated From**: Array of consolidated invoice IDs
- **Consolidation Details**: Complete consolidation history

### Payment Tracking

- **Initial Payment**: First payment amount
- **Additional Payments**: Multiple subsequent payments
- **Payment Methods**: Method selection per payment
- **Payment Dates**: Timestamp for each payment
- **Payment Notes**: Additional payment information

### Battery Management

- **Battery Details**: Plates, AH, Type specifications
- **Battery Trade-in**: Deduction calculations
- **Battery Count**: Quantity tracking
- **Battery Weight**: Weight-based pricing

## 🛠️ Development Features

### Code Quality

- **TypeScript** for type safety
- **Component Architecture** for maintainability
- **Error Boundaries** for error handling
- **Loading States** for UX
- **Form Validation** for data integrity

### Performance

- **Optimized Rendering** with React.memo
- **Efficient State Management** with Jotai
- **Virtual Scrolling** for large datasets
- **Lazy Loading** for better performance
- **Caching Strategy** for API calls

### Security

- **Input Validation** on all forms
- **SQL Injection Prevention**
- **XSS Protection**
- **Data Sanitization**
- **Secure API Endpoints**

## 📱 User Experience

### Interface Design

- **Clean Layout** with proper spacing
- **Intuitive Navigation** for easy access
- **Modal-based Interactions** for focused tasks
- **Responsive Design** for all devices
- **Professional Styling** with Tailwind CSS

### User Feedback

- **Toast Notifications** for actions
- **Loading Indicators** for operations
- **Error Messages** with clear explanations
- **Success Confirmations** for completed actions
- **Progress Indicators** for long operations

## 🔄 Workflow Integration

### Invoice Lifecycle

1. **Create** new invoice with customer and products
2. **Preview** invoice before finalizing
3. **Print** thermal receipt for customer
4. **Manage Payments** as they come in
5. **Track Status** changes automatically
6. **Consolidate** multiple invoices if needed
7. **Replace** invoices with corrections

### Customer Management

1. **Add Customer** information
2. **Create Invoices** for customer
3. **Track Payments** over time
4. **View History** of all transactions
5. **Manage Contact** information

## 🎨 Customization

### Branding

- **Company Logo** on receipts
- **Contact Information** display
- **Custom Colors** and styling
- **Business Details** configuration

### Business Rules

- **Invoice Number** format
- **Tax Calculations** setup
- **Payment Methods** configuration
- **Product Categories** organization

## 📊 Reporting

### Invoice Reports

- **Sales Summary** by date range
- **Customer Reports** with history
- **Payment Reports** by method
- **Product Sales** analysis
- **Consolidation Reports** tracking

### Analytics

- **Revenue Tracking** over time
- **Customer Analysis** and trends
- **Product Performance** metrics
- **Payment Method** preferences
- **Invoice Status** distribution

## 🚀 Deployment

### Environment Setup

- **Development Environment** configuration
- **Production Environment** setup
- **Database Configuration** MongoDB
- **API Endpoints** deployment
- **Environment Variables** management

### Performance Optimization

- **Code Splitting** for faster loading
- **Image Optimization** for receipts
- **API Response** caching
- **Database Indexing** for queries
- **Bundle Size** optimization

## 🔧 Maintenance

### Data Management

- **Database Backups** regular schedule
- **Data Cleanup** for old records
- **Performance Monitoring** and optimization
- **Error Logging** and monitoring
- **Security Updates** and patches

### Feature Updates

- **New Payment Methods** addition
- **Product Categories** expansion
- **Report Templates** customization
- **User Interface** improvements
- **Business Logic** enhancements

## 📞 Support

### User Support

- **Documentation** for all features
- **Training Materials** for staff
- **Troubleshooting Guide** for common issues
- **Feature Requests** and feedback system
- **Regular Updates** and improvements

## 📈 Business Value

### Efficiency Gains

- **Reduced Manual Work** with automation
- **Faster Invoice Processing** with templates
- **Accurate Calculations** preventing errors
- **Quick Customer Lookup** saving time
- **Professional Receipts** enhancing brand

### Financial Benefits

- **Better Cash Flow** with payment tracking
- **Reduced Errors** saving money
- **Customer Retention** with professional service
- **Inventory Management** reducing waste
- **Tax Compliance** with accurate records

## 🎯 Specialized Features

### Consolidated Invoice Management

- **Multi-invoice Consolidation** with clear history
- **Previous Amount Tracking** for transparent billing
- **Consolidated Payment Processing** with accurate calculations
- **View Original Invoices** for reference
- **Consolidated Thermal Printing** with complete details

### Advanced Payment System

- **Multiple Payment Methods** per invoice
- **Payment History Timeline** with dates
- **Partial Payment Support** with status updates
- **Battery Trade-in Integration** with deductions
- **Automatic Status Updates** based on payments

### Professional Receipt Printing

- **Thermal Printer Optimization** for 80mm paper
- **Company Branding** with logo and contact info
- **Complete Invoice Details** including consolidation info
- **Payment Breakdown** showing all transactions
- **Battery Specifications** with technical details
- **Warranty Code Printing** for product tracking

### Invoice Relationship Tracking

- **Replacement Chain** viewing for audit trails
- **Consolidation History** with original invoice references
- **Status Change Tracking** with timestamps
- **Quick Navigation** between related invoices
- **Modal-based Preview** for seamless experience

## 🏆 Conclusion

Mudasir Traders Invoice Management System is a comprehensive solution that handles all aspects of invoice management, from creation to payment tracking, with advanced features like consolidation, replacement, and thermal printing. Built with modern technologies and best practices, it provides a robust foundation for business operations while maintaining excellent user experience and data integrity.

The system continues to evolve with regular updates and new features based on business requirements and user feedback, ensuring it remains a valuable tool for business operations.

---

**Key Highlights:**

- ✅ **Complete Invoice Lifecycle** management
- ✅ **Advanced Consolidation** and replacement features
- ✅ **Professional Thermal Printing** with full details
- ✅ **Multi-payment Support** with tracking
- ✅ **Modern Tech Stack** with TypeScript and React
- ✅ **Comprehensive Error Handling** and validation
- ✅ **Responsive Design** for all devices
- ✅ **Business Intelligence** and reporting capabilities
- **Stock Management** with low-stock alerts
- **Customer Analytics** and purchase history

### 💼 Business Operations

- **Invoice Management** - Create, edit, and manage invoices
- **Customer Management** - Track customer details and purchase history
- **Dealer Management** - Manage suppliers and dealer relationships
- **Stock Management** - Real-time inventory tracking
- **Warranty System** - Battery warranty checking and management
- **Brand & Category Management** - Organize products effectively

### 🤖 AI Assistant

- **Intelligent Business Chat** - Powered by OpenRouter Step-3.5-Flash
- **Natural Language Queries** - Ask questions about your business data
- **Real-time Data Analysis** - AI analyzes MongoDB data for insights
- **Smart Recommendations** - Get business insights and suggestions
- **Multi-language Support** - English and Urdu queries supported

### 🔧 Advanced Features

- **PDF Invoice Generation** - Professional invoice creation
- **WhatsApp Integration** - Share invoices via WhatsApp
- **Payment Tracking** - Monitor payment status and pending amounts
- **Google Maps Integration** - Customer location tracking
- **Responsive Design** - Works on all devices
- **Authentication System** - Secure user access with NextAuth.js

### 📱 User Interface

- **Modern UI/UX** - Built with Tailwind CSS and Headless UI
- **Interactive Components** - Drag-and-drop, modals, and rich interactions
- **Data Tables** - Advanced sorting, filtering, and pagination
- **Charts & Visualizations** - Recharts for data visualization
- **Dark Mode Support** - Toggle between light and dark themes

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible components
- **React Icons** - Comprehensive icon library
- **Recharts** - Chart library for data visualization
- **React Markdown** - Markdown rendering for AI responses

### Backend & Database

- **MongoDB** - NoSQL database for business data
- **NextAuth.js** - Authentication solution
- **OpenAI API** - AI assistant integration via OpenRouter
- **PDF Generation** - jsPDF for invoice creation
- **File Upload** - Cloudinary integration for images

### Development Tools

- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Jest** - Unit testing framework
- **Cypress** - End-to-end testing
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai-assistant/  # AI assistant API
│   │   ├── invoices/      # Invoice management
│   │   ├── customers/     # Customer management
│   │   ├── dealers/       # Dealer management
│   │   └── stock/         # Stock management
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── AIAssistant.tsx   # AI chat interface
│   ├── FloatingAIAssistant.tsx # Floating AI widget
│   ├── warranty/          # Warranty components
│   ├── invoice/           # Invoice components
│   └── dealers/           # Dealer management components
├── actions/               # Server actions
│   └── warrantyActions.ts # Warranty search logic
└── layouts/               # Layout components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- OpenRouter API key (for AI assistant)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd mudasirtraders
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Configure environment variables**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mudasirtraders

# AI Assistant
OPENROUTER_API_KEY=your_openrouter_api_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🤖 AI Assistant Setup

### Getting OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Create an account and get your API key
3. Add the key to your `.env.local` file

### Supported Queries

The AI assistant can answer questions about:

- **Sales Data**: "What are our total sales this month?"
- **Revenue**: "How much revenue did we generate?"
- **Stock Levels**: "Which batteries are low in stock?"
- **Customer Analytics**: "Who are our top customers?"
- **Dealer Performance**: "Which dealers owe us money?"
- **Warranty Status**: "Check warranty for battery code XYZ"

## 📊 Database Schema

### Key Collections

- **invoices** - Sales invoices and transactions
- **customers** - Customer information and purchase history
- **dealers** - Supplier and dealer management
- **stock** - Battery inventory and stock levels
- **brands** - Battery brands and categories
- **warrantyHistory** - Warranty records and history

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:fixed        # Fixed development mode

# Building
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode

# Custom Scripts
npm run audit:dashboard  # Audit dashboard data
npm run audit:dealers    # Audit dealer data
```

## 🎯 Key Features in Detail

### AI Assistant

- **Natural Language Processing**: Understands business queries in English and Urdu
- **Real-time Data Analysis**: Connects directly to MongoDB for live data
- **Smart Context**: Maintains conversation context for follow-up questions
- **Tool Integration**: Uses database tools for accurate responses
- **Fallback Handling**: Provides raw data if AI processing fails

### Warranty System

- **Code Search**: Fast warranty code lookup across invoices and sales
- **Date Calculation**: Accurate remaining days calculation
- **History Tracking**: Maintains warranty history for deleted invoices
- **Multi-source Search**: Searches across active and archived data

### Invoice Management

- **PDF Generation**: Professional invoice PDFs with company branding
- **WhatsApp Sharing**: Direct WhatsApp integration for invoice sharing
- **Payment Tracking**: Monitor paid, partial, and unpaid invoices
- **Customer History**: Complete purchase history per customer

### Stock Management

- **Real-time Updates**: Live stock level tracking
- **Low Stock Alerts**: Automatic notifications for low inventory
- **Brand Management**: Organize by battery brands and categories
- **Sales Integration**: Automatic stock reduction on sales

## 🔒 Security Features

- **Authentication**: Secure login with NextAuth.js
- **Session Management**: Secure session handling
- **API Protection**: Protected API routes
- **Input Validation**: Comprehensive input sanitization
- **Database Security**: Safe MongoDB operations

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Perfect tablet experience
- **Desktop Layout**: Full-featured desktop interface
- **Touch Gestures**: Swipe and tap interactions
- **Adaptive UI**: Components adapt to screen size

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software for Mudasir Traders.

## 🆘 Support

For support and questions:

- Check the documentation
- Review the code comments
- Contact the development team

---

**Built with ❤️ for Mudasir Traders Battery Business**
