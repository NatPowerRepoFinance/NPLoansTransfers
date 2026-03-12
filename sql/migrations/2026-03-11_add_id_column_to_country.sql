/*
  Migration: add serial id column to country table
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('npfinance.country', 'U') IS NOT NULL
   AND COL_LENGTH('npfinance.country', 'id') IS NULL
BEGIN
    ALTER TABLE npfinance.country
        ADD id INT IDENTITY(1,1) NOT NULL;
END
GO

IF OBJECT_ID('dbo.country', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.country', 'id') IS NULL
BEGIN
    ALTER TABLE dbo.country
        ADD id INT IDENTITY(1,1) NOT NULL;
END
GO
