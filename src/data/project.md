# Meal Service Platform - Project Documentation
**Comprehensive Developer Handover Guide**

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features Implemented](#core-features-implemented)
6. [Database Schema](#database-schema)
7. [Authentication System](#authentication-system)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Testing Framework](#testing-framework)
11. [Error Handling & Logging](#error-handling--logging)
12. [Deployment & Infrastructure](#deployment--infrastructure)
13. [Future Enhancements](#future-enhancements)
14. [Development Guidelines](#development-guidelines)
15. [Known Issues](#known-issues)

## Project Overview
This is a meal service platform that allows users to purchase meal packs and order meals from a weekly rotating menu. The system operates on a pre-paid model where users buy meal credits and then redeem them for specific meals.

**Key Business Model:**
- Users purchase meal packs (10, 20, 40, 80 meals)
- Users select meals from weekly menus using their purchased credits
- No additional payment required at meal selection time

## Current Implementation Status
✅ **Completed Features**
- User authentication (signup/login/logout)
- Dashboard with meal balance display
- Meal pack purchase system (dummy payments)
- Weekly menu display and meal selection
- Order placement with meal balance deduction
- Order history and purchase history
- Responsive design for desktop and mobile
- Admin sidebar navigation
- Enhanced error handling and logging
- Comprehensive test coverage (671 tests passing)
- Admin management system (menus, orders, packs, users)
- Zoho CRM integration
- Rate limiting and security middleware

🚧 **In Progress Features**
- Real payment processing integration (Stripe)

🔜 **Planned Features**
- Admin panel for user management
- Menu rotation system
- Email notifications
- Analytics and reporting
- Mobile app development

## Technology Stack
### Frontend
- **Framework:** Next.js 16+ App Router
- **Language:** TypeScript
- **Styling:** CSS Modules
- **UI Components:** Custom components with Lucide React icons
- **State Management:** React Context (NextAuth.js)

### Backend
- **Authentication:** NextAuth.js with Credentials Provider
- **Database:** PostgreSQL (NeonDB)
- **API:** Next.js API Routes
- **Image Handling:** Next.js Image component

### Development Tools
- **Package Manager:** npm/yarn
- **Testing:** Jest with ts-jest
- **Error Tracking:** Sentry
- **Logging:** Custom logging system
- **Code Quality:** ESLint, Prettier, TypeScript

### Deployment
- **Hosting:** Vercel
- **Database:** NeonDB (PostgreSQL)
- **Environment:** Environment variables for configuration

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── menus/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── publish/route.ts
│   │   │   │   │   └── unpublish/route.ts
│   │   │   │   └── status/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── status/route.ts
│   │   │   │   ├── bulk-update/route.ts
│   │   │   │   └── stats/route.ts
│   │   │   ├── packs/
│   │   │   │   ├── sales/route.ts
│   │   │   │   │   └── stats/route.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   └── recent-orders/route.ts
│   │   │   ├── stats/route.ts
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           ├── route.ts
│   │   │           ├── role/route.ts
│   │   │           └── status/route.ts
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── signup/route.ts
│   │   ├── debug/
│   │   │   ├── users/route.ts
│   │   │   ├── sentry-test/route.ts
│   │   │   ├── env/route.ts
│   │   │   └── populate-menu/route.ts
│   │   ├── user/
│   │   │   └── balance/route.ts
│   │   ├── packs/
│   │   │   └── purchase/route.ts
│   │   ├── orders/
│   │   │   └── create/route.ts
│   │   ├── zoho/
│   │   │   ├── auth/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── enquiry/route.ts
│   │   └── health/route.ts
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── backend/
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── packs/
│   │       │   └── page.tsx
│   │       ├── order/
│   │       │   ├── page.tsx
│   │       │   └── OrderMealsClient.tsx
│   │       ├── history/
│   │       │   ├── page.tsx
│   │       │   ├── orders/
│   │       │   │   └── page.tsx
│   │       │   └── purchases/
│   │       │       └── page.tsx
│   │       └── components/
│   │           └── MealBalance.tsx
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── menus/
│   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   └── packs/
│   │       └── page.tsx
│   ├── frontend/
│   │   ├── landing/
│   │   │   └── page.tsx
│   │   ├── legal/
│   │   │   └── page.tsx
│   │   └── menu/
│   │       └── page.tsx
│   └── sentry-example-page/
│       └── page.tsx
├── components/
│   ├── backend/
│   │   └── dashboard/
│   │       └── Sidebar.tsx
│   ├── admin/
│   │   ├── charts/
│   │   │   ├── BarChart.tsx
│   │   │   └── SimpleChart.tsx
│   │   ├── forms/
│   │   │   ├── FormContainer.tsx
│   │   │   ├── MenuForm.tsx
│   │   │   ├── MenuItemForm.tsx
│   │   │   ├── OrderStatusForm.tsx
│   │   │   ├── PackForm.tsx
│   │   │   └── FormField.tsx
│   │   ├── modals/
│   │   │   ├── AdminModal.tsx
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── ImageUploadModal.tsx
│   │   │   └── UserDetailModal.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── DataTable.client.tsx
│   │   ├── SearchFilter.tsx
│   │   └── StatusBadge.tsx
│   ├── ui/
│   │   ├── animated-border/
│   │   │   ├── AnimatedBorderBox.tsx
│   │   │   └── AnimatedGradientBorder.tsx
│   │   ├── CTAButton/
│   │   │   └── CTAButton.tsx
│   │   ├── dish/
│   │   │   ├── DishCard.tsx
│   │   │   └── DishGrid.tsx
│   │   ├── forms/
│   │   │   └── enquiry/
│   │   │       └── EnquiryForm.tsx
│   │   ├── modal/
│   │   │   └── Modal.tsx
│   │   ├── universal-card/
│   │   │   └── UniversalCard.tsx
│   │   └── zoho/
│   │       └── ZohoSalesIQ.tsx
│   ├── ErrorBoundary.tsx
│   ├── MenuDishCard.tsx
│   └── SessionWrapper.tsx
├── lib/
│   ├── auth/
│   │   ├── admin.ts
│   │   └── auth.ts
│   ├── api/
│   │   └── admin/
│   │       └── client.ts
│   ├── cache/
│   │   └── adminCache.ts
│   ├── utils/
│   │   └── error-utils.ts
│   ├── validation/
│   │   └── input-validation.ts
│   ├── services/
│   │   ├── admin/
│   │   │   ├── menuService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── packService.ts
│   │   │   ├── statsService.ts
│   │   │   └── userService.ts
│   │   ├── menuService.ts
│   │   └── database.ts
│   ├── errors/
│   │   ├── business-errors.ts
│   │   └── system-errors.ts
│   ├── logging/
│   │   ├── audit-logger.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── rate-limiter.ts
│   │   └── performance-monitor.ts
│   ├── monitoring/
│   │   └── sentry.ts
│   ├── database/
│   │   └── client.ts
│   ├── zoho-crm.ts
│   ├── email-templates.ts
│   └── types/
│       ├── api.ts
│       ├── next-auth.d.ts
│       └── database.ts
├── data/
│   ├── dishData.ts
│   ├── faqData.ts
│   └── teamData.ts
├── hooks/
│   └── useAdminData.ts
└── tests/
    ├── test-helpers.d.ts
    ├── test-helpers.ts
    └── test-setup.ts
```

## Core Features Implemented

### 1. User Authentication System
**Location:** `src/lib/auth/auth.ts`, `src/app/api/auth/`

**Features:**
- User registration with email/password
- Secure password hashing with bcrypt
- Session management with JWT
- Protected routes using middleware
- Login/logout functionality
- Role-based access control (user/admin)

**Key Files:**
- `src/lib/auth/auth.ts` - NextAuth configuration
- `src/app/api/auth/signup/route.ts` - User registration API
- `src/app/login/page.tsx` - Login interface
- `src/app/signup/page.tsx` - Registration interface

### 2. Dashboard System
**Location:** `src/app/(client)/dashboard/`

**Features:**
- User meal balance display
- Quick action cards
- Recent orders overview
- Responsive design
- Protected access

**Key Files:**
- `src/app/(client)/dashboard/page.tsx` - Main dashboard
- `src/app/(client)/dashboard/layout.tsx` - Dashboard layout with sidebar
- `src/shared/components/backend/dashboard/Sidebar.tsx` - Navigation sidebar

### 3. Admin Management System
**Location:** `src/app/admin/`

**Features:**
- Menu management (CRUD operations)
- Order management and bulk updates
- User management and role assignment
- Pack template management
- Statistics and reporting
- Dashboard overview

**Key Files:**
- `src/app/admin/dashboard/page.tsx` - Admin dashboard
- `src/app/admin/menus/page.tsx` - Menu management
- `src/app/admin/orders/page.tsx` - Order management
- `src/app/admin/packs/page.tsx` - Pack management
- `src/app/admin/users/page.tsx` - User management

### 4. Meal Pack Purchase System
**Location:** `src/app/(client)/dashboard/packs/`

**Features:**
- Multiple pack size options (10, 20, 40, 80 meals)
- Dummy payment processing (ready for Stripe integration)
- Meal balance update
- Purchase history tracking

**Key Files:**
- `src/app/(client)/dashboard/packs/page.tsx` - Purchase interface
- `src/app/api/packs/purchase/route.ts` - Purchase API

### 5. Meal Ordering System
**Location:** `src/app/(client)/dashboard/orders/`

**Features:**
- Weekly menu display with dish details
- Meal selection with quantity controls
- Real-time meal balance calculation
- Order confirmation with balance deduction

**Key Files:**
- `src/app/(client)/dashboard/orders/page.tsx` - Order interface
- `src/app/(client)/dashboard/orders/OrderMealsClient.tsx` - Client-side ordering
- `src/app/api/orders/create/route.ts` - Order processing API

### 6. History System
**Location:** `src/app/(client)/dashboard/history/`

**Features:**
- Order history with status tracking
- Purchase history with pack details
- Filter and sort capabilities
- Detailed order information

**Key Files:**
- `src/app/(client)/dashboard/history/orders/page.tsx` - Order history
- `src/app/(client)/dashboard/history/purchases/page.tsx` - Purchase history

### 7. Zoho CRM Integration
**Location:** `src/lib/zoho-crm.ts`, `src/app/api/zoho/`

**Features:**
- OAuth authentication with Zoho
- Lead creation from enquiries
- Webhook handling
- Error handling and logging

**Key Files:**
- `src/lib/zoho-crm.ts` - Zoho CRM service
- `src/app/api/zoho/auth/route.ts` - OAuth authentication
- `src/app/api/zoho/callback/route.ts` - OAuth callback
- `src/app/api/zoho/webhook/route.ts` - Webhook handler

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Meal Packs Table
```sql
CREATE TABLE meal_packs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pack_size INTEGER NOT NULL,
  remaining_balance INTEGER NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Menus Table
```sql
CREATE TABLE menus (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Menu Items Table
```sql
CREATE TABLE menu_items (
  id VARCHAR(255) PRIMARY KEY, -- String IDs like 'c1', 'k4'
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  category VARCHAR(100),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  total_meals INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id VARCHAR(255) REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
```

## Authentication System

### Current Implementation
- **Provider:** CredentialsProvider (email/password)
- **Session Strategy:** JWT
- **Protected Routes:** Middleware-based protection
- **User Roles:** Basic role system (user/admin)

### Key Components
- **NextAuth Configuration:** `src/lib/auth/auth.ts`
- **Session Provider:** `src/components/SessionWrapper.tsx`
- **Protected Layouts:** Dashboard layout with session checking
- **API Protection:** Server-side session validation

### Security Features
- Password hashing with bcrypt
- CSRF protection
- Session encryption
- Role-based access control
- Rate limiting
- Audit logging

## API Endpoints

### Authentication
```
POST /api/auth/signup - User registration
GET  /api/auth/[...nextauth] - NextAuth endpoints
```

### User Data
```
GET  /api/user/balance - Get user meal balance
```

### Meal Packs
```
POST /api/packs/purchase - Purchase meal pack
```

### Orders
```
POST /api/orders/create - Create new order
```

### Admin APIs
```
GET    /api/admin/menus - List menus
POST   /api/admin/menus - Create menu
GET    /api/admin/menus/[id] - Get menu details
PUT    /api/admin/menus/[id] - Update menu
DELETE /api/admin/menus/[id] - Delete menu
POST   /api/admin/menus/[id]/publish - Publish menu
POST   /api/admin/menus/[id]/unpublish - Unpublish menu
GET    /api/admin/menus/status - Get menu status statistics

GET    /api/admin/orders - List orders
PUT    /api/admin/orders/[id]/status - Update order status
POST   /api/admin/orders/bulk-update - Bulk update orders
GET    /api/admin/orders/stats - Get order statistics

GET    /api/admin/packs/templates - List pack templates
POST   /api/admin/packs/templates - Create pack template
PUT    /api/admin/packs/templates/[id] - Update pack template
DELETE /api/admin/packs/templates/[id] - Delete pack template

GET    /api/admin/users - List users
PUT    /api/admin/users/[id]/role - Update user role
PUT    /api/admin/users/[id]/status - Update user status

GET    /api/admin/stats - Get dashboard statistics
GET    /api/admin/recent-orders - Get recent orders
```

### Zoho Integration
```
GET  /api/zoho/auth - Zoho OAuth initiation
GET  /api/zoho/callback - Zoho OAuth callback
POST /api/zoho/webhook - Zoho webhook handler
```

### Debug & Health
```
GET  /api/debug/users - List all users
POST /api/debug/create-test-user - Create test user
GET  /api/debug/env - Environment variables check
POST /api/debug/populate-menu - Populate test menu
GET  /api/debug/sentry-test - Sentry error test
GET  /api/health - Health check endpoint
```

## Frontend Components

### Core UI Components
- **Dashboard Layout:** Protected layout with sidebar navigation
- **Dish Cards:** Menu item display with nutritional information
- **Order Interface:** Meal selection with quantity controls
- **History Views:** Order and purchase history displays
- **Authentication Forms:** Login and signup interfaces
- **Admin Components:** Data tables, forms, charts, modals

### Component Architecture
- **Server Components:** Dashboard pages, history views, static content
- **Client Components:** Interactive elements, forms, state management
- **Shared Components:** Sidebar, session wrapper, error boundaries
- **UI Components:** Cards, buttons, forms, modals, charts

### Admin-Specific Components
- **Data Tables:** Client-side data tables with filtering and sorting
- **Forms:** CRUD forms for menus, orders, packs, users
- **Charts:** Data visualization components
- **Modals:** Confirmation dialogs, detail views, edit forms
- **Search/Filter:** Advanced search and filtering components

### Styling System
- **CSS Modules:** Scoped styling for each component
- **Responsive Design:** Mobile-first approach
- **Consistent Theme:** Unified color scheme and typography
- **Component Libraries:** Custom component library for admin UI

## Testing Framework

### Current Status
✅ **Comprehensive Test Coverage**
- **671 tests passing** across the application
- **38.66% overall coverage** (target: 70%+)
- **Unit tests** for services, utilities, and business logic
- **Integration tests** for API endpoints
- **Component tests** for key UI elements
- **End-to-end tests** for critical user flows

### Test Structure
```
src/
├── lib/
│   ├── auth/auth.test.ts
│   ├── services/admin/menuService.test.ts
│   ├── services/admin/orderService.test.ts
│   ├── services/admin/packService.test.ts
│   ├── services/admin/statsService.test.ts
│   ├── services/admin/userService.test.ts
│   ├── middleware/rate-limiter.test.ts
│   ├── zoho-crm.test.ts
│   └── ... (all service tests)
├── app/api/
│   ├── admin/menus/route.test.ts
│   ├── admin/menus/[id]/route.test.ts
│   ├── admin/orders/bulk-update/route.test.ts
│   └── ... (all API route tests)
├── components/
│   ├── admin/forms/MenuForm.test.tsx
│   ├── ui/forms/enquiry/EnquiryForm.test.tsx
│   └── ... (component tests)
└── hooks/
    └── useAdminData.test.ts
```

### Testing Tools
- **Unit Testing:** Jest with ts-jest
- **Component Testing:** React Testing Library
- **API Testing:** Jest with mock HTTP requests
- **Mocking:** Jest mocks for external dependencies
- **Test Utilities:** Custom test helpers and setup

### Test Categories
1. **API Route Tests:** HTTP status codes, response formats, authentication
2. **Service Tests:** Business logic, database interactions, error handling
3. **Component Tests:** Rendering, user interactions, props handling
4. **Integration Tests:** End-to-end flows, data consistency
5. **Security Tests:** Authentication, authorization, input validation

### Coverage Targets
- **Critical Paths:** 70%+ coverage
- **API Endpoints:** 100% tested
- **Services:** 80%+ coverage
- **Components:** 60%+ coverage for interactive components

## Error Handling & Logging

### Current Implementation
✅ **Structured Error Handling**
- **Business Errors:** Custom error classes for domain-specific issues
- **System Errors:** Infrastructure and technical error handling
- **Validation Errors:** Input validation with detailed feedback
- **Authentication Errors:** Login failures, access denied scenarios

### Logging System
✅ **Comprehensive Logging**
- **Audit Logging:** User actions, security events, business operations
- **Error Logging:** System errors, exceptions, stack traces
- **Debug Logging:** Development and troubleshooting information
- **Performance Logging:** Request timing, database queries

### Key Components
- **Error Utilities:** `src/lib/utils/error-utils.ts`
- **Business Errors:** `src/lib/errors/business-errors.ts`
- **System Errors:** `src/lib/errors/system-errors.ts`
- **Audit Logger:** `src/lib/logging/audit-logger.ts`
- **Application Logger:** `src/lib/logging/logger.ts`

### Error Types & Handling
1. **Authentication Errors:** Invalid credentials, session expired, access denied
2. **Authorization Errors:** Insufficient permissions, role violations
3. **Validation Errors:** Input validation failures, missing required fields
4. **Business Errors:** Insufficient balance, expired packs, duplicate entries
5. **System Errors:** Database failures, network issues, third-party API errors
6. **Rate Limiting Errors:** Too many requests, IP bans

### Monitoring & Alerting
✅ **Error Monitoring**
- **Sentry Integration:** Real-time error tracking and reporting
- **Performance Monitoring:** Request timing, database query performance
- **Security Monitoring:** Suspicious activities, failed login attempts
- **Business Metrics:** Key performance indicators, user behavior tracking

## Deployment & Infrastructure

### Current Setup
- **Frontend:** Vercel hosting with automatic deployments
- **Database:** NeonDB (PostgreSQL) with auto-scaling
- **Environment:** Environment variables for all configurations
- **Monitoring:** Sentry for error tracking, Vercel analytics

### Deployment Process
1. **Vercel Integration:** Automatic deployments from Git main branch
2. **Environment Variables:** Vercel dashboard configuration
3. **Database Migrations:** Manual SQL execution via NeonDB dashboard
4. **Monitoring Setup:** Sentry configuration for error tracking

### Infrastructure Components
- **CDN:** Vercel global CDN for static assets
- **Serverless Functions:** Auto-scaling API routes
- **Database:** PostgreSQL with connection pooling
- **Caching:** In-memory caching for admin data
- **Rate Limiting:** IP-based rate limiting middleware
- **Security:** HTTPS, CORS, security headers

### Scalability Considerations
- **Database:** NeonDB auto-scaling capabilities
- **Frontend:** Vercel global CDN and edge functions
- **API:** Serverless functions with auto-scaling
- **Images:** Next.js Image optimization with remote image caching
- **Caching:** Redis caching planned for future implementation

### Environment Configuration
- **Development:** Local environment with .env.local
- **Staging:** Vercel preview deployments
- **Production:** Vercel production environment
- **Database:** Environment-specific database connections
- **API Keys:** Secure storage of third-party service credentials

## Future Enhancements

### Phase 1: Immediate Improvements (1-2 weeks)
#### 1. Enhanced Test Coverage
**Priority:** High
**Description:** Increase overall test coverage to 70%+ target
**Tasks:**
- Add missing API endpoint tests
- Implement service layer testing for uncovered areas
- Add component tests for interactive UI elements
- Create integration tests for critical user flows

#### 2. Real Payment Integration
**Priority:** Medium
**Description:** Replace dummy payments with Stripe integration
**Tasks:**
- Stripe account setup and configuration
- Payment processing API implementation
- Webhook handling for payment events
- Payment success/failure flow management

#### 3. Email Notifications
**Priority:** Medium
**Description:** Automated email communications system
**Tasks:**
- Order confirmation emails
- Weekly menu announcements
- Account activity notifications
- Password reset functionality

### Phase 2: Admin Dashboard Enhancement (2-3 weeks)
#### 1. Advanced Menu Management
**Description:** Enhanced menu creation and management tools
**Tasks:**
- Menu scheduling system
- Automatic menu activation
- Menu archive functionality
- Seasonal menu templates

#### 2. User Analytics
**Description:** Detailed user behavior and engagement tracking
**Tasks:**
- User activity dashboards
- Engagement metrics
- Retention analysis
- User segmentation

#### 3. Order Processing Workflow
**Description:** Streamlined order management and fulfillment
**Tasks:**
- Order status workflow
- Bulk order operations
- Delivery scheduling
- Order fulfillment tracking

### Phase 3: Advanced Features (3-4 weeks)
#### 1. Subscription Management
**Description:** Recurring meal pack subscriptions
**Tasks:**
- Subscription creation interface
- Automatic renewal system
- Subscription management dashboard
- Cancellation workflow

#### 2. Dietary Preferences
**Description:** Personalized meal recommendations
**Tasks:**
- Dietary preference settings
- Allergen filtering
- Personalized menu suggestions
- Nutritional tracking

#### 3. Analytics and Reporting
**Description:** Business intelligence and reporting
**Tasks:**
- Sales analytics dashboard
- User behavior tracking
- Menu performance reports
- Financial reporting

#### 4. Multi-location Support
**Description:** Support for multiple service locations
**Tasks:**
- Location-based menu management
- Delivery zone configuration
- Location-specific pricing
- Multi-location reporting

### Phase 4: Advanced Features (4+ weeks)
#### 1. Loyalty Program
**Description:** Customer retention through rewards
**Tasks:**
- Points system implementation
- Reward redemption
- Tiered membership levels
- Referral program

#### 2. Mobile App Development
**Description:** Native mobile application
**Tasks:**
- React Native app development
- Mobile-optimized UI
- Push notifications
- Offline functionality

#### 3. Advanced Reporting
**Description:** Comprehensive business intelligence
**Tasks:**
- Custom report builder
- Data export functionality
- Scheduled reporting
- Executive dashboards

## Development Guidelines

### Code Standards
- **TypeScript:** Strict typing required, no implicit any
- **Naming:** Descriptive, consistent naming conventions
- **Documentation:** JSDoc comments for functions and classes
- **Testing:** Test coverage for new features (minimum 70%)
- **Error Handling:** Comprehensive error handling in all functions
- **Security:** Input validation, sanitization, and security best practices

### Git Workflow
- **Branching:** Feature branches from main
- **Commits:** Atomic, descriptive commit messages following conventional commits
- **Pull Requests:** Code review required with at least one approval
- **Merging:** Squash merge to main with descriptive commit messages
- **Branch Naming:** `feature/`, `bugfix/`, `hotfix/`, `release/` prefixes

### Component Architecture
- **Server Components:** Data fetching, static content, SEO-critical elements
- **Client Components:** Interactive elements, state management, client-side logic
- **Props:** Type-safe prop interfaces with clear documentation
- **State:** Minimal, predictable state management using React hooks
- **Reusability:** Components designed for reuse with clear interfaces

### API Design
- **RESTful:** Consistent endpoint design with proper HTTP methods
- **Error Handling:** Standardized error responses with proper status codes
- **Validation:** Input validation at API boundaries with clear error messages
- **Documentation:** API documentation with examples and expected responses
- **Versioning:** API versioning strategy for backward compatibility

### Security Best Practices
- **Authentication:** Secure session management, JWT validation
- **Authorization:** Role-based access control, permission checking
- **Input Validation:** Sanitization and validation of all user inputs
- **Rate Limiting:** IP-based rate limiting to prevent abuse
- **Error Handling:** Secure error messages that don't expose system details

### Performance Optimization
- **Caching:** Strategic caching of frequently accessed data
- **Database Queries:** Optimized queries with proper indexing
- **Bundle Size:** Code splitting and lazy loading for large components
- **Images:** Proper image optimization and responsive image loading
- **API Calls:** Efficient API usage with minimal requests

## Known Issues

### 1. Test Coverage Gap
**Status:** In Progress
**Description:** Overall test coverage at 38.66%, below target of 70%
**Solution:** Implementing comprehensive test coverage across all modules
**Monitoring:** Weekly coverage reports and targets

### 2. Authentication Redirect Loop
**Status:** Resolved but monitor
**Description:** Previous authentication errors persisted in URL
**Solution:** Implemented URL parameter cleanup and proper session handling
**Monitoring:** Check for recurrence in user feedback and error logs

### 3. Database Schema Constraints
**Status:** Workaround implemented
**Description:** Foreign key constraints require careful data management
**Solution:** VARCHAR IDs instead of UUID for flexibility in menu items
**Monitoring:** Ensure data consistency and referential integrity

### 4. Session Management
**Status:** Basic implementation
**Description:** Limited session timeout handling
**Solution:** Implement session refresh mechanism and proper timeout handling
**Monitoring:** User session timeout reports and feedback

### 5. Performance Optimization
**Status:** Not fully addressed
**Description:** No comprehensive caching or performance monitoring
**Solution:** Implement Redis caching and performance metrics tracking
**Monitoring:** API response time tracking and database query performance

### 6. Rate Limiting Configuration
**Status:** Basic implementation
**Description:** Default rate limiting settings may need tuning
**Solution:** Configure rate limits based on usage patterns and requirements
**Monitoring:** Rate limit violation reports and user feedback

## Getting Started for New Developers

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd <project-name>

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### 2. Database Setup
```sql
-- Run SQL scripts to create tables
-- Use NeonDB dashboard or psql
-- Ensure all foreign key relationships are properly configured
```

### 3. Test User Creation
```bash
# Visit debug endpoint to create test user
# Or use signup form in the application
# Admin user: Create user with role 'admin' in database
```

### 4. Development Workflow
1. Create feature branch from main
2. Implement changes following coding standards
3. Add comprehensive tests (unit, integration, component)
4. Run linting and formatting checks
5. Create pull request with detailed description
6. Address code review feedback
7. Merge after approval

### 5. Common Development Tasks
- **Add new API endpoint:** Create route.ts in appropriate app/api/ directory
- **Add new database table:** Update schema and create corresponding service
- **Add new UI component:** Create component in src/components/ with tests
- **Add new page:** Create folder structure in src/app/ with proper routing
- **Add new service:** Create service file in src/lib/services/ with tests
- **Add new middleware:** Create middleware in src/lib/middleware/

### 6. Testing Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/auth/auth.test.ts

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Support and Maintenance

### Key Contacts
- **Project Lead:** [To be determined]
- **Database Administrator:** [To be determined]
- **DevOps Engineer:** [To be determined]
- **Security Lead:** [To be determined]

### Maintenance Schedule
- **Weekly:** Dependency updates, security patches, test runs
- **Monthly:** Performance review, backup verification, log analysis
- **Quarterly:** Architecture review, scaling assessment, security audit
- **Annually:** Major version upgrades, infrastructure review

### Monitoring Requirements
- **Uptime:** 99.9% target with alerting for downtime
- **Response Time:** < 500ms for API calls, < 2000ms for page loads
- **Error Rate:** < 1% for user-facing operations
- **Database Performance:** < 100ms for 95% of queries
- **Security:** Zero critical vulnerabilities, regular penetration testing

### Incident Response
1. **Critical Issues (System Down):** Immediate response within 15 minutes
2. **High Priority (Major Functionality):** Response within 1 hour
3. **Medium Priority (Minor Functionality):** Response within 4 hours
4. **Low Priority (Enhancements/Bugs):** Response within 24 hours

This documentation provides a comprehensive overview of the current state of the project and a roadmap for future development. The modular architecture and clear separation of concerns should make it straightforward for new developers to understand and contribute to the codebase.