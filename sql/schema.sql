/* NatPower Loans and Inter Company Transfers - SQL Server DDL */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'npfinance')
BEGIN
    EXEC('CREATE SCHEMA npfinance');
END
GO

CREATE TABLE npfinance.users (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_users PRIMARY KEY DEFAULT NEWID(),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(200) NOT NULL,
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN ('Editor', 'Viewer'))
);
GO

CREATE TABLE npfinance.companies (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_companies PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(200) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_companies_created_at DEFAULT SYSUTCDATETIME(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_companies_updated_at DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(200) NOT NULL,
    CONSTRAINT UQ_companies_code UNIQUE (code)
);
GO

CREATE TABLE npfinance.loan_facilities (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_loan_facilities PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(200) NOT NULL,
    lender_company_id UNIQUEIDENTIFIER NOT NULL,
    borrower_company_id UNIQUEIDENTIFIER NOT NULL,
    agreement_date DATE NOT NULL,
    currency VARCHAR(10) NOT NULL,
    bank_account_number NVARCHAR(100) NULL,
    bank_account_name NVARCHAR(200) NULL,
    bank_account_currency VARCHAR(10) NULL,
    bank_account_type_status NVARCHAR(100) NULL,
    bank_iban NVARCHAR(100) NULL,
    bank_identifier NVARCHAR(100) NULL,
    bank_name NVARCHAR(200) NULL,
    bank_address NVARCHAR(500) NULL,
    annual_interest_rate DECIMAL(9,6) NOT NULL,
    days_in_year INT NOT NULL CONSTRAINT DF_loan_facilities_days_in_year DEFAULT 365,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_loan_facilities_status DEFAULT 'Active',
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_loan_facilities_created_at DEFAULT SYSUTCDATETIME(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_loan_facilities_updated_at DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(200) NOT NULL,
    CONSTRAINT FK_loan_facilities_lender_company FOREIGN KEY (lender_company_id)
        REFERENCES npfinance.companies(id),
    CONSTRAINT FK_loan_facilities_borrower_company FOREIGN KEY (borrower_company_id)
        REFERENCES npfinance.companies(id),
    CONSTRAINT CK_loan_facilities_currency CHECK (currency IN ('GBP', 'EUR', 'USD', 'YEN')),
    CONSTRAINT CK_loan_facilities_bank_account_currency CHECK (
        bank_account_currency IS NULL OR bank_account_currency IN ('GBP', 'EUR', 'USD', 'YEN')
    ),
    CONSTRAINT CK_loan_facilities_status CHECK (status IN ('Active', 'Repaid')),
    CONSTRAINT CK_loan_facilities_days_in_year CHECK (days_in_year > 0),
    CONSTRAINT CK_loan_facilities_interest_rate CHECK (annual_interest_rate >= 0)
);
GO

CREATE TABLE npfinance.loan_schedule_rows (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_loan_schedule_rows PRIMARY KEY DEFAULT NEWID(),
    loan_facility_id UNIQUEIDENTIFIER NOT NULL,
    row_index INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    bank_transaction_date DATE NULL,
    transaction_detail NVARCHAR(500) NULL,
    bank_ledger_balance DECIMAL(18,2) NULL,
    days INT NOT NULL,
    draw_down DECIMAL(18,2) NOT NULL,
    repayment DECIMAL(18,2) NOT NULL,
    principal DECIMAL(18,2) NOT NULL,
    cumulative_principal DECIMAL(18,2) NOT NULL,
    interest DECIMAL(18,2) NOT NULL,
    cumulative_interest DECIMAL(18,2) NOT NULL,
    total DECIMAL(18,2) NOT NULL,
    fees DECIMAL(18,2) NOT NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_loan_schedule_rows_created_at DEFAULT SYSUTCDATETIME(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_loan_schedule_rows_updated_at DEFAULT SYSUTCDATETIME(),
    updated_by NVARCHAR(200) NOT NULL,
    CONSTRAINT FK_loan_schedule_rows_loan_facility FOREIGN KEY (loan_facility_id)
        REFERENCES npfinance.loan_facilities(id) ON DELETE CASCADE,
    CONSTRAINT UQ_loan_schedule_rows_loan_row_index UNIQUE (loan_facility_id, row_index),
    CONSTRAINT CK_loan_schedule_rows_dates CHECK (end_date >= start_date),
    CONSTRAINT CK_loan_schedule_rows_days CHECK (days >= 0),
    CONSTRAINT CK_loan_schedule_rows_bank_ledger_balance CHECK (
        bank_ledger_balance IS NULL OR bank_ledger_balance >= 0
    ),
    CONSTRAINT CK_loan_schedule_rows_amounts_non_negative CHECK (
        draw_down >= 0 AND repayment >= 0 AND fees >= 0 AND
        principal >= 0 AND cumulative_principal >= 0 AND
        interest >= 0 AND cumulative_interest >= 0 AND total >= 0
    )
);
GO

CREATE TABLE npfinance.loan_history (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_loan_history PRIMARY KEY DEFAULT NEWID(),
    loan_facility_id UNIQUEIDENTIFIER NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UNIQUEIDENTIFIER NULL,
    event_timestamp DATETIME2(3) NOT NULL CONSTRAINT DF_loan_history_event_timestamp DEFAULT SYSUTCDATETIME(),
    performed_by NVARCHAR(200) NOT NULL,
    summary NVARCHAR(500) NULL,
    before_json NVARCHAR(MAX) NULL,
    after_json NVARCHAR(MAX) NULL,
    CONSTRAINT FK_loan_history_loan_facility FOREIGN KEY (loan_facility_id)
        REFERENCES npfinance.loan_facilities(id) ON DELETE CASCADE,
    CONSTRAINT CK_loan_history_event_type CHECK (event_type IN ('create', 'update', 'delete', 'import')),
    CONSTRAINT CK_loan_history_entity_type CHECK (entity_type IN ('loan', 'schedule', 'company-link')),
    CONSTRAINT CK_loan_history_before_json CHECK (before_json IS NULL OR ISJSON(before_json) = 1),
    CONSTRAINT CK_loan_history_after_json CHECK (after_json IS NULL OR ISJSON(after_json) = 1)
);
GO

CREATE INDEX IX_loan_facilities_lender_company_id
    ON npfinance.loan_facilities(lender_company_id);
GO

CREATE INDEX IX_loan_facilities_borrower_company_id
    ON npfinance.loan_facilities(borrower_company_id);
GO

CREATE INDEX IX_users_email
    ON npfinance.users(email);
GO

CREATE INDEX IX_loan_schedule_rows_loan_facility_row_index
    ON npfinance.loan_schedule_rows(loan_facility_id, row_index);
GO

CREATE INDEX IX_loan_history_loan_facility_event_timestamp
    ON npfinance.loan_history(loan_facility_id, event_timestamp DESC);
GO
