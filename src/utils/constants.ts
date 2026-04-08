export type LoanStatus = 'Active' | 'Closed' | 'Archived';
export type Currency = 'GBP' | 'EUR' | 'USD' | 'YEN'
export type UserRole = 'Admin' | 'Editor' | 'Viewer'
export type CompanyType = 'Internal' | 'Shareholder' | '3rd Party'

export interface ScheduleItem {
  id: string
  rowIndex?: number
  startDate: string
  endDate: string
  lenderBankAccount: string
  borrowerBankAccount: string
  annualInterestRate: number
  annualInterestRatePct?: number
  days?: number
  drawDown: number
  repayment: number
  principal?: number
  cumulativePrincipal?: number
  interest?: number
  cumulativeInterest?: number
  total?: number
  fees: number
  updatedAt: string
}

export interface LoanHistoryEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  details: string
  /** From API: loan | schedule | company-link */
  entityType?: string
  entityId?: string
  /** Parsed `beforeJson` for deletes and update diffs */
  beforeSnapshot?: Record<string, unknown> | null
  /** Parsed `afterJson` for creates and update diffs */
  afterSnapshot?: Record<string, unknown> | null
}

export interface CompanyHistoryEntry {
  id: number
  timestamp: string
  action: "ADD" | "EDIT" | "DELETE" | "IMPORT"
  createdBy: string
  companyName: string
  details: string
  entityType?: string | null
  entityId?: string | null
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
}

export interface UserHistoryEntry {
  id: number
  timestamp: string
  action: "ADD" | "EDIT" | "DELETE" | "IMPORT"
  /** Who performed the change (API `performedBy`) */
  performedBy: string
  /** Affected user label (name or email from snapshot) */
  userName: string
  details: string
  entityType?: string | null
  entityId?: string | null
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
}
export interface LoanFacility {
  id: string
  name: string
  status: LoanStatus
  startDate: string
  closeDate: string
  lenderCompanyId: string
  borrowerCompanyId: string
  agreementDate: string
  currency: Currency
  annualInterestRate: number
  daysInYear: number
  /** When true, backend may auto-add monthly schedule rows (e.g. on 1st of month). */
  addRow?: boolean
  schedule: ScheduleItem[]
  history: LoanHistoryEntry[]
  createdAt: string
  updatedAt: string
}