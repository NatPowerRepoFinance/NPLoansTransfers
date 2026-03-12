export type LoanStatus = 'Active' | 'Closed' | 'Archived';
export type Currency = 'GBP' | 'EUR' | 'USD' | 'YEN'
export type UserRole = 'Admin' | 'Editor' | 'Viewer'
export type CompanyType = 'Internal' | 'Shareholder' | '3rd Party'

export interface ScheduleItem {
  id: string
  startDate: string
  endDate: string
  lenderBankAccount: string
  borrowerBankAccount: string
  annualInterestRate: number
  drawDown: number
  repayment: number
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
  schedule: ScheduleItem[]
  history: LoanHistoryEntry[]
  createdAt: string
  updatedAt: string
}