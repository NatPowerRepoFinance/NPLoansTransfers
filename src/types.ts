export type Currency = 'GBP' | 'EUR' | 'USD' | 'YEN'
export type LoanStatus = 'Active' | 'Closed' | 'Archived'
export type UserRole = 'Editor' | 'Viewer'

export interface Company {
  id: string
  name: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleItem {
  id: string
  startDate: string
  endDate: string
  bankTransactionDate: string
  transactionDetail: string
  bankLedgerBalance: number
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
  lenderCompanyId: string
  borrowerCompanyId: string
  agreementDate: string
  currency: Currency
  bankAccountNumber: string
  bankAccountName: string
  bankAccountCurrency: Currency
  bankAccountTypeStatus: string
  bankIban: string
  bankIdentifier: string
  bankName: string
  bankAddress: string
  annualInterestRate: number
  daysInYear: number
  schedule: ScheduleItem[]
  history: LoanHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface MockUser {
  id: string
  name: string
  email: string
}

export interface AccessUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface DataStore {
  companies: Company[]
  loans: LoanFacility[]
  users: AccessUser[]
}
