/*
  Migration: sync existing database with updated scope
  - Adds npfinance.users table (if missing)
  - Adds loan facility bank account columns/constraints (if missing)
  - Adds schedule bank transaction columns/constraints (if missing)
  - Adds users email index (if missing)
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'npfinance')
BEGIN
    EXEC('CREATE SCHEMA npfinance');
END
GO

IF OBJECT_ID('npfinance.users', 'U') IS NULL
BEGIN
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
END
GO

IF OBJECT_ID('npfinance.users', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('npfinance.users', 'first_name') IS NULL
        ALTER TABLE npfinance.users ADD first_name NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.users', 'last_name') IS NULL
        ALTER TABLE npfinance.users ADD last_name NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.users', 'email') IS NULL
        ALTER TABLE npfinance.users ADD email NVARCHAR(320) NULL;

    IF COL_LENGTH('npfinance.users', 'role') IS NULL
        ALTER TABLE npfinance.users ADD role VARCHAR(20) NULL;

    IF COL_LENGTH('npfinance.users', 'created_at') IS NULL
        ALTER TABLE npfinance.users ADD created_at DATETIME2(3) NULL;

    IF COL_LENGTH('npfinance.users', 'created_by') IS NULL
        ALTER TABLE npfinance.users ADD created_by NVARCHAR(200) NULL;

    IF COL_LENGTH('npfinance.users', 'updated_at') IS NULL
        ALTER TABLE npfinance.users ADD updated_at DATETIME2(3) NULL;

    IF COL_LENGTH('npfinance.users', 'updated_by') IS NULL
        ALTER TABLE npfinance.users ADD updated_by NVARCHAR(200) NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = 'npfinance' AND t.name = 'users' AND c.name = 'created_at'
    )
        ALTER TABLE npfinance.users ADD CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME() FOR created_at;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = 'npfinance' AND t.name = 'users' AND c.name = 'updated_at'
    )
        ALTER TABLE npfinance.users ADD CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME() FOR updated_at;

    IF NOT EXISTS (
        SELECT 1 FROM sys.key_constraints
        WHERE name = 'UQ_users_email' AND parent_object_id = OBJECT_ID('npfinance.users')
    )
        ALTER TABLE npfinance.users ADD CONSTRAINT UQ_users_email UNIQUE (email);

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_users_role' AND parent_object_id = OBJECT_ID('npfinance.users')
    )
        ALTER TABLE npfinance.users WITH NOCHECK
        ADD CONSTRAINT CK_users_role CHECK (role IN ('Editor', 'Viewer'));
END
GO

IF OBJECT_ID('npfinance.loan_facilities', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('npfinance.loan_facilities', 'bank_account_number') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_account_number NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_account_name') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_account_name NVARCHAR(200) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_account_currency') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_account_currency VARCHAR(10) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_account_type_status') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_account_type_status NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_iban') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_iban NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_identifier') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_identifier NVARCHAR(100) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_name') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_name NVARCHAR(200) NULL;

    IF COL_LENGTH('npfinance.loan_facilities', 'bank_address') IS NULL
        ALTER TABLE npfinance.loan_facilities ADD bank_address NVARCHAR(500) NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_loan_facilities_bank_account_currency'
          AND parent_object_id = OBJECT_ID('npfinance.loan_facilities')
    )
        ALTER TABLE npfinance.loan_facilities WITH NOCHECK
        ADD CONSTRAINT CK_loan_facilities_bank_account_currency CHECK (
            bank_account_currency IS NULL OR bank_account_currency IN ('GBP', 'EUR', 'USD', 'YEN')
        );
END
GO

IF OBJECT_ID('npfinance.loan_schedule_rows', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('npfinance.loan_schedule_rows', 'bank_transaction_date') IS NULL
        ALTER TABLE npfinance.loan_schedule_rows ADD bank_transaction_date DATE NULL;

    IF COL_LENGTH('npfinance.loan_schedule_rows', 'transaction_detail') IS NULL
        ALTER TABLE npfinance.loan_schedule_rows ADD transaction_detail NVARCHAR(500) NULL;

    IF COL_LENGTH('npfinance.loan_schedule_rows', 'bank_ledger_balance') IS NULL
        ALTER TABLE npfinance.loan_schedule_rows ADD bank_ledger_balance DECIMAL(18,2) NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_loan_schedule_rows_bank_ledger_balance'
          AND parent_object_id = OBJECT_ID('npfinance.loan_schedule_rows')
    )
        ALTER TABLE npfinance.loan_schedule_rows WITH NOCHECK
        ADD CONSTRAINT CK_loan_schedule_rows_bank_ledger_balance CHECK (
            bank_ledger_balance IS NULL OR bank_ledger_balance >= 0
        );
END
GO

IF OBJECT_ID('npfinance.users', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = 'IX_users_email'
         AND object_id = OBJECT_ID('npfinance.users')
   )
BEGIN
    CREATE INDEX IX_users_email
        ON npfinance.users(email);
END
GO
