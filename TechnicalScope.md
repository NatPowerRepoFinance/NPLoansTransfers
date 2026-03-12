# Technical Scope — NatPower Loans and Inter Company Transfers

## 1) Scope Overview
This document defines the technical scope for implementing the Loans and Inter-Company Transfers system across:
- Frontend (React + TypeScript)
- Backend API (service layer)
- SQL database (system of record)

The scope aligns to the functional requirements in `Requirements.md`, including:
- Company management (CRUD)
- User access list management (CRUD)
- Loan facility management (CRUD)
- Loan facility bank account details management
- Drawdown schedule management (CRUD + calculations)
- Full change history/audit log by loan facility
- Formatting standards for date and currency

---

## 2) Frontend Scope (React + TypeScript)

### 2.1 Functional Scope
- Authentication shell with Microsoft SSO integration point and mock login fallback for non-production.
- Admin-managed user allowlist (by email) used to control who can sign in.
- Role model for approved users:
  - `Editor`: create/update/delete/import/reset permissions.
  - `Viewer`: read-only access.
- Admin page for Companies:
  - Create, edit, delete, and list companies.
- Admin page for Users:
  - Create, edit, delete, and list approved users.
  - Fields: first name, last name, email address, role (`Editor` or `Viewer`).
- Loan Facility page:
  - Select loan facility from dropdown.
  - Create, edit, delete loan facility.
  - Display read-only loan details.
  - Display and maintain bank account details in loan details and loan add/edit flow.
  - Create, edit, delete schedule rows.
- Loan Facility bank account fields:
  - Account Number
  - Account Name
  - Bank Account Currency
  - Account Type / Status
  - IBAN
  - Bank Identifier
  - Bank Name
  - Bank Address
- Drawdown schedule additional fields:
  - Bank Transaction Date
  - Bank Transaction Detail
  - Bank Ledger Balance
- Derived schedule calculations (client display, server-validated):
  - Days = End Date - Start Date
  - Principal = Draw Down - Repayment
  - Cumulative Principal (running total)
  - Interest = ((Cumulative Principal * Annual Interest Rate) / Days in Year) * Days
  - Cumulative Interest (running total)
  - Total = Cumulative Principal + Cumulative Interest
- Full history view for each loan with row-level change details.
- Import/export support for schedules:
  - Excel import with overwrite/extend mode.
  - Import template includes transaction/bank ledger columns.
  - Excel/PDF export of selected loan schedule.
  - PDF report uses page sections and footer page numbering (`Page X of Y`).

### 2.2 UX/UI Scope
- Responsive layout for desktop/laptop use.
- Modal-based add/edit flows for company, loan, and schedule.
- Loan details panel displayed in left/right blocks, with bank account details on the right block.
- Confirmation dialog for destructive actions (delete).
- Theme support (light/dark) with persisted preference.
- Validation and user feedback:
  - Required fields, numeric/date validation, logical date sequence.
  - Error messages for failed API requests.

### 2.3 Formatting & Localization Scope
- Dates shown as `dd/mm/yyyy`.
- Currency displayed with:
  - No currency symbol
  - Thousands separator
  - 2 decimal places
- Integer-style currency fields displayed with 0 decimal places where required.

### 2.4 Frontend Non-Functional Scope
- TypeScript strict typing for domain models and API contracts.
- Accessible modal/dialog semantics and keyboard-usable form controls.
- Separation of concerns:
  - UI components
  - API client/service layer
  - formatting/calculation utilities

---

## 3) Backend Scope (API Service)

### 3.1 Service Responsibilities
- Provide REST API for users, companies, loan facilities, schedules, and audit history.
- Validate business rules and persist authoritative calculated values.
- Record every create/update/delete operation in audit tables.
- Enforce referential integrity and soft/hard delete policies.

### 3.2 API Scope (minimum endpoints)

#### Users / Access List
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{userId}`
- `DELETE /api/users/{userId}`
- `POST /api/auth/sso-login` (validates SSO email against approved list)

#### Companies
- `GET /api/companies`
- `POST /api/companies`
- `PUT /api/companies/{companyId}`
- `DELETE /api/companies/{companyId}`

#### Loan Facilities
- `GET /api/loan-facilities`
- `GET /api/loan-facilities/{loanId}`
- `POST /api/loan-facilities`
- `PUT /api/loan-facilities/{loanId}`
- `DELETE /api/loan-facilities/{loanId}`

Loan Facility request/response payload includes bank account fields:
- `bankAccountNumber`
- `bankAccountName`
- `bankAccountCurrency`
- `bankAccountTypeStatus`
- `bankIban`
- `bankIdentifier`
- `bankName`
- `bankAddress`

#### Schedule Rows
- `GET /api/loan-facilities/{loanId}/schedule`
- `POST /api/loan-facilities/{loanId}/schedule`
- `PUT /api/loan-facilities/{loanId}/schedule/{rowId}`
- `DELETE /api/loan-facilities/{loanId}/schedule/{rowId}`
- `POST /api/loan-facilities/{loanId}/schedule/import?mode=overwrite|extend`

#### History / Audit
- `GET /api/loan-facilities/{loanId}/history`

### 3.3 Backend Validation Scope
- Required fields validation.
- User validation:
  - First name, last name, email and role are required.
  - Email unique (case-insensitive).
  - Role in (`Editor`, `Viewer`).
- Date validation (`startDate <= endDate`).
- Allowed enumerations:
  - Currency: GBP, EUR, USD, YEN
  - Bank Account Currency: GBP, EUR, USD, YEN
  - Loan status (if used): Active, Repaid
- Numeric constraints (non-negative where applicable).
- Recalculation of derived fields before persistence or response.

### 3.4 Security Scope
- Microsoft Entra ID token validation for production.
- Allowlist-based authentication:
  - Sign-in succeeds only when SSO email exists in approved users list.
  - Sessions are invalidated if user is removed from approved list.
- Role-based access control:
  - `Editor`: create/update/delete/import/reset operations.
  - `Viewer`: read-only access to pages and exports.
- Audit includes `who`, `when`, `action`, and before/after payload snapshots.

### 3.5 Non-Functional Scope (Backend)
- Structured logging with correlation/request IDs.
- Error model with stable HTTP status and payload schema.
- Idempotency considerations for import operations.
- API versioning (`/api/v1`) for future compatibility.

---

## 4) SQL Database Scope

### 4.1 Database Platform Scope
- SQL Server (preferred) or equivalent relational SQL engine.
- ACID transactions for multi-row update consistency.

### 4.2 Core Schema Scope

#### `users`
- `id` (PK)
- `first_name` (nvarchar)
- `last_name` (nvarchar)
- `email` (nvarchar, unique, case-insensitive)
- `role` (varchar: Editor, Viewer)
- `created_at`, `created_by`, `updated_at`, `updated_by`

#### `companies`
- `id` (PK, uniqueidentifier or bigint)
- `name` (nvarchar)
- `code` (nvarchar, unique)
- `created_at`, `created_by`, `updated_at`, `updated_by`

#### `loan_facilities`
- `id` (PK)
- `name` (nvarchar)
- `lender_company_id` (FK -> companies.id)
- `borrower_company_id` (FK -> companies.id)
- `agreement_date` (date)
- `currency` (varchar)
- `bank_account_number` (nvarchar)
- `bank_account_name` (nvarchar)
- `bank_account_currency` (varchar)
- `bank_account_type_status` (nvarchar)
- `bank_iban` (nvarchar)
- `bank_identifier` (nvarchar)
- `bank_name` (nvarchar)
- `bank_address` (nvarchar)
- `annual_interest_rate` (decimal)
- `days_in_year` (int, default 365)
- `status` (varchar, optional if status tracking enabled)
- `created_at`, `created_by`, `updated_at`, `updated_by`

#### `loan_schedule_rows`
- `id` (PK)
- `loan_facility_id` (FK -> loan_facilities.id)
- `row_index` (int, sequence within loan)
- `start_date` (date)
- `end_date` (date)
- `bank_transaction_date` (date)
- `transaction_detail` (nvarchar)
- `bank_ledger_balance` (decimal(18,2))
- `days` (int)
- `draw_down` (decimal(18,2))
- `repayment` (decimal(18,2))
- `principal` (decimal(18,2))
- `cumulative_principal` (decimal(18,2))
- `interest` (decimal(18,2))
- `cumulative_interest` (decimal(18,2))
- `total` (decimal(18,2))
- `fees` (decimal(18,2))
- `created_at`, `created_by`, `updated_at`, `updated_by`

#### `loan_history`
- `id` (PK)
- `loan_facility_id` (FK -> loan_facilities.id)
- `event_type` (varchar: create/update/delete/import)
- `entity_type` (varchar: loan/schedule/company-link)
- `entity_id` (nullable FK-like reference)
- `event_timestamp` (datetime2)
- `performed_by` (nvarchar)
- `summary` (nvarchar)
- `before_json` (nvarchar(max) / json)
- `after_json` (nvarchar(max) / json)

### 4.3 SQL Constraints & Indexing Scope
- Unique constraint on `users.email` (case-insensitive).
- Unique constraint on `companies.code`.
- Foreign keys with appropriate delete behavior (restrict or cascade by business rule).
- Indexes:
  - `users(email)`
  - `loan_schedule_rows(loan_facility_id, row_index)`
  - `loan_history(loan_facility_id, event_timestamp DESC)`
  - `loan_facilities(lender_company_id)` and `(borrower_company_id)`

### 4.4 Data Integrity Scope
- Database-level checks for non-negative amounts where applicable.
- Transactional writes for schedule batch operations/import.
- Audit write in same transaction as business data change.

---

## 5) Out of Scope (for MVP)
- Multi-tenant partitioning.
- Advanced workflow approvals.
- Real-time collaboration/locking.
- Complex BI dashboards.
- Automated FX conversion service.

---

## 6) Delivery Artifacts
- Frontend app with environment-based API configuration.
- Backend API with OpenAPI/Swagger definition.
- SQL migration scripts (schema + indexes + seed baseline data).
- Postman/HTTP collection for API testing.
- Deployment and runbook documentation.

---

## 7) Acceptance Criteria (Technical)
- All required CRUD operations work end-to-end using SQL persistence.
- User allowlist CRUD works end-to-end and controls sign-in by email.
- Viewer role cannot perform mutating actions; Editor role can.
- Loan facility bank account fields persist correctly and are visible in UI and exports.
- Schedule bank fields (`Bank Transaction Date`, `Bank Transaction Detail`, `Bank Ledger Balance`) persist and appear in grid and exports.
- Derived schedule fields are accurate and consistent between API and UI.
- Every change is present in history with before/after details.
- PDF export separates sections across pages and includes footer page numbering.
- Date and currency formatting match requirements.
- Authentication and authorization controls are enforced in production profile.
- No critical lint/type/build errors in frontend and backend pipelines.
