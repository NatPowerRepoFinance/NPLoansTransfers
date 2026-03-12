import type {
  LoanFacility,
  LoanStatus,
  ScheduleItem,
  UserRole,
} from '../utils/constants'
import type { MockUser } from '../types'

type CompanyType = 'Internal' | 'Shareholder' | '3rd Party'

interface AdminHistoryEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  details: string
}

interface Country {
  id: string
  name: string
  code: string
  createdAt: string
  updatedAt: string
}

interface Company {
  id: string
  name: string
  code: string
  type: CompanyType
  country: string
  bankAccounts: string[]
  createdAt: string
  updatedAt: string
}

interface AccessUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  country: string
  createdAt: string
  updatedAt: string
}

interface DataStore {
  countries: Country[]
  companies: Company[]
  companyHistory: AdminHistoryEntry[]
  loans: LoanFacility[]
  users: AccessUser[]
  userHistory: AdminHistoryEntry[]
}

const STORAGE_KEY = 'npfinance-store-v1'

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const nowIso = (): string => new Date().toISOString()

const normalizeRole = (role: unknown): UserRole => {
  if (role === 'Admin') {
    return 'Admin'
  }

  if (role === 'Viewer') {
    return 'Viewer'
  }

  return 'Editor'
}

const normalizeCompanyType = (value: unknown): CompanyType => {
  return value === 'Internal' || value === 'Shareholder' || value === '3rd Party'
    ? value
    : 'Internal'
}

const normalizeCountry = (value: unknown): string => {
  const text = String(value ?? '').trim()
  return text || 'Italy'
}

const normalizeCompanyBankAccounts = (value: unknown): string[] => {
  const accounts = Array.isArray(value)
    ? value
        .map((account) => String(account ?? '').trim())
        .filter((account) => account.length > 0)
    : []

  return accounts.length > 0 ? accounts : ['Primary account']
}

const withScheduleBankAccountDefaults = (
  row: ScheduleItem,
  lenderFallback: string,
  borrowerFallback: string,
  annualInterestRateFallback: number,
): ScheduleItem => ({
  ...row,
  lenderBankAccount: row.lenderBankAccount || lenderFallback,
  borrowerBankAccount: row.borrowerBankAccount || borrowerFallback,
  annualInterestRate:
    Number.isFinite(row.annualInterestRate) && row.annualInterestRate >= 0
      ? row.annualInterestRate
      : annualInterestRateFallback,
})

const seedStore = (): DataStore => {
  const now = nowIso()

  const countries: Country[] = [
    { id: createId(), name: 'Italy', code: 'IT', createdAt: now, updatedAt: now },
    { id: createId(), name: 'United Kingdom', code: 'UK', createdAt: now, updatedAt: now },
    { id: createId(), name: 'Untied States', code: 'US', createdAt: now, updatedAt: now },
    { id: createId(), name: 'Khazakstan', code: 'KZ', createdAt: now, updatedAt: now },
  ]

  const users: AccessUser[] = [
    {
      id: 'u-1',
      firstName: 'Mina',
      lastName: 'Rossi',
      email: 'mina.rossi@natpower.com',
      role: 'Admin',
      country: 'Global',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'u-2',
      firstName: 'Alex',
      lastName: 'Carter',
      email: 'alex.carter@natpower.com',
      role: 'Viewer',
      country: 'United Kingdom',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'u-3',
      firstName: 'Luca',
      lastName: 'Bianchi',
      email: 'luca.bianchi@natpower.com',
      role: 'Editor',
      country: 'Italy',
      createdAt: now,
      updatedAt: now,
    },
  ]

  const companyA: Company = {
    id: createId(),
    name: 'NatPower Holdings Ltd',
    code: 'NPH',
    type: 'Internal',
    country: 'Italy',
    bankAccounts: ['Barclays GBP 30958472'],
    createdAt: now,
    updatedAt: now,
  }

  const companyB: Company = {
    id: createId(),
    name: 'NatPower Trading SRL',
    code: 'NPT',
    type: '3rd Party',
    country: 'United Kingdom',
    bankAccounts: ['Intesa EUR 22199410'],
    createdAt: now,
    updatedAt: now,
  }

  const buildSeedSchedule = (
    annualInterestRate: number,
    rows: Array<{
      startDate: string
      endDate: string
      drawDown: number
      repayment: number
      fees: number
    }>,
  ): ScheduleItem[] => {
    return rows.map((row) => ({
      id: createId(),
      startDate: row.startDate,
      endDate: row.endDate,
      lenderBankAccount: companyA.bankAccounts[0],
      borrowerBankAccount: companyB.bankAccounts[0],
      annualInterestRate,
      drawDown: row.drawDown,
      repayment: row.repayment,
      fees: row.fees,
      updatedAt: now,
    }))
  }

  const sampleLoan: LoanFacility = {
    id: createId(),
    name: 'Loan NatPower H to NatPower T',
    status: 'Active',
    startDate: '2026-01-01',
    closeDate: '',
    lenderCompanyId: companyA.id,
    borrowerCompanyId: companyB.id,
    agreementDate: '2026-01-01',
    currency: 'EUR',
    annualInterestRate: 5,
    daysInYear: 365,
    schedule: [
      {
        id: createId(),
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 100000,
        repayment: 0,
        fees: 0,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 25000,
        repayment: 0,
        fees: 250,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-03-01',
        endDate: '2026-04-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 20000,
        repayment: 5000,
        fees: 180,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-04-01',
        endDate: '2026-05-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 15000,
        repayment: 8000,
        fees: 150,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-05-01',
        endDate: '2026-06-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 18000,
        repayment: 12000,
        fees: 130,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-06-01',
        endDate: '2026-07-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 12000,
        repayment: 10000,
        fees: 120,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-07-01',
        endDate: '2026-08-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 10000,
        repayment: 15000,
        fees: 100,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-08-01',
        endDate: '2026-09-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 8000,
        repayment: 14000,
        fees: 90,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-09-01',
        endDate: '2026-10-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 6000,
        repayment: 12000,
        fees: 80,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-10-01',
        endDate: '2026-11-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 5000,
        repayment: 10000,
        fees: 70,
        updatedAt: now,
      },
      {
        id: createId(),
        startDate: '2026-11-01',
        endDate: '2026-12-01',
        lenderBankAccount: companyA.bankAccounts[0],
        borrowerBankAccount: companyB.bankAccounts[0],
        annualInterestRate: 5,
        drawDown: 4000,
        repayment: 9000,
        fees: 65,
        updatedAt: now,
      },
    ],
    history: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'CREATE_LOAN',
        details: 'Loan facility created with seed data',
      },
      {
        id: createId(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        userId: 'u-1',
        userName: 'Mina Rossi',
        action: 'UPDATE_LOAN',
        details: 'Updated loan Loan NatPower H to NatPower T',
      },
      {
        id: createId(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        userId: 'u-1',
        userName: 'Mina Rossi',
        action: 'CREATE_SCHEDULE',
        details:
          'Row 3 created. After: Start Date=2026-03-01 | End Date=2026-04-01 | Draw Down=20000 | Repayment=5000 | Fees=180',
      },
      {
        id: createId(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        userId: 'u-2',
        userName: 'Alex Carter',
        action: 'UPDATE_SCHEDULE',
        details:
          'Row 4 updated. Before: Start Date=2026-04-01 | End Date=2026-05-01 | Draw Down=15000 | Repayment=8000 | Fees=150 | After: Start Date=2026-04-01 | End Date=2026-05-01 | Draw Down=17000 | Repayment=9000 | Fees=140',
      },
      {
        id: createId(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        userId: 'u-2',
        userName: 'Alex Carter',
        action: 'DELETE_SCHEDULE',
        details:
          'Row 7 deleted. Before: Start Date=2026-07-01 | End Date=2026-08-01 | Draw Down=10000 | Repayment=15000 | Fees=100',
      },
      {
        id: createId(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        userId: 'u-1',
        userName: 'Mina Rossi',
        action: 'UPDATE_SCHEDULE',
        details:
          'Row 2 updated. Before: Start Date=2026-02-01 | End Date=2026-03-01 | Draw Down=25000 | Repayment=0 | Fees=250 | After: Start Date=2026-02-01 | End Date=2026-03-01 | Draw Down=25000 | Repayment=2000 | Fees=240',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const sampleLoan2: LoanFacility = {
    id: createId(),
    name: 'Bridge Facility Q1 2026',
    status: 'Active',
    startDate: '2026-02-15',
    closeDate: '',
    lenderCompanyId: companyA.id,
    borrowerCompanyId: companyB.id,
    agreementDate: '2026-02-15',
    currency: 'USD',
    annualInterestRate: 4.75,
    daysInYear: 365,
    schedule: buildSeedSchedule(4.75, [
      { startDate: '2026-02-15', endDate: '2026-03-15', drawDown: 70000, repayment: 0, fees: 220 },
      { startDate: '2026-03-15', endDate: '2026-04-15', drawDown: 30000, repayment: 5000, fees: 210 },
      { startDate: '2026-04-15', endDate: '2026-05-15', drawDown: 25000, repayment: 8000, fees: 190 },
      { startDate: '2026-05-15', endDate: '2026-06-15', drawDown: 22000, repayment: 10000, fees: 175 },
      { startDate: '2026-06-15', endDate: '2026-07-15', drawDown: 18000, repayment: 12000, fees: 160 },
      { startDate: '2026-07-15', endDate: '2026-08-15', drawDown: 15000, repayment: 14000, fees: 150 },
      { startDate: '2026-08-15', endDate: '2026-09-15', drawDown: 12000, repayment: 13000, fees: 130 },
      { startDate: '2026-09-15', endDate: '2026-10-15', drawDown: 9000, repayment: 11000, fees: 115 },
      { startDate: '2026-10-15', endDate: '2026-11-15', drawDown: 7000, repayment: 10000, fees: 100 },
      { startDate: '2026-11-15', endDate: '2026-12-15', drawDown: 6000, repayment: 9000, fees: 95 },
    ]),
    history: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'CREATE_LOAN',
        details: 'Loan facility created with seed data',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const sampleLoan3: LoanFacility = {
    id: createId(),
    name: 'Working Capital Line 2026',
    status: 'Active',
    startDate: '2026-03-01',
    closeDate: '',
    lenderCompanyId: companyA.id,
    borrowerCompanyId: companyB.id,
    agreementDate: '2026-03-01',
    currency: 'GBP',
    annualInterestRate: 5.2,
    daysInYear: 365,
    schedule: buildSeedSchedule(5.2, [
      { startDate: '2026-03-01', endDate: '2026-04-01', drawDown: 50000, repayment: 0, fees: 180 },
      { startDate: '2026-04-01', endDate: '2026-05-01', drawDown: 20000, repayment: 3000, fees: 165 },
      { startDate: '2026-05-01', endDate: '2026-06-01', drawDown: 18000, repayment: 6000, fees: 150 },
      { startDate: '2026-06-01', endDate: '2026-07-01', drawDown: 16000, repayment: 8500, fees: 140 },
      { startDate: '2026-07-01', endDate: '2026-08-01', drawDown: 14000, repayment: 10000, fees: 130 },
      { startDate: '2026-08-01', endDate: '2026-09-01', drawDown: 12000, repayment: 10500, fees: 120 },
      { startDate: '2026-09-01', endDate: '2026-10-01', drawDown: 10000, repayment: 11000, fees: 110 },
      { startDate: '2026-10-01', endDate: '2026-11-01', drawDown: 8000, repayment: 9500, fees: 95 },
      { startDate: '2026-11-01', endDate: '2026-12-01', drawDown: 6000, repayment: 9000, fees: 85 },
      { startDate: '2026-12-01', endDate: '2027-01-01', drawDown: 5000, repayment: 8500, fees: 80 },
    ]),
    history: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'CREATE_LOAN',
        details: 'Loan facility created with seed data',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const sampleLoan4: LoanFacility = {
    id: createId(),
    name: 'Project Finance Tranche A',
    status: 'Active',
    startDate: '2026-04-10',
    closeDate: '',
    lenderCompanyId: companyA.id,
    borrowerCompanyId: companyB.id,
    agreementDate: '2026-04-10',
    currency: 'EUR',
    annualInterestRate: 4.9,
    daysInYear: 365,
    schedule: buildSeedSchedule(4.9, [
      { startDate: '2026-04-10', endDate: '2026-05-10', drawDown: 90000, repayment: 0, fees: 260 },
      { startDate: '2026-05-10', endDate: '2026-06-10', drawDown: 35000, repayment: 4000, fees: 245 },
      { startDate: '2026-06-10', endDate: '2026-07-10', drawDown: 30000, repayment: 7000, fees: 230 },
      { startDate: '2026-07-10', endDate: '2026-08-10', drawDown: 26000, repayment: 10000, fees: 215 },
      { startDate: '2026-08-10', endDate: '2026-09-10', drawDown: 22000, repayment: 12000, fees: 200 },
      { startDate: '2026-09-10', endDate: '2026-10-10', drawDown: 18000, repayment: 14000, fees: 185 },
      { startDate: '2026-10-10', endDate: '2026-11-10', drawDown: 15000, repayment: 15000, fees: 170 },
      { startDate: '2026-11-10', endDate: '2026-12-10', drawDown: 12000, repayment: 14500, fees: 150 },
      { startDate: '2026-12-10', endDate: '2027-01-10', drawDown: 10000, repayment: 13000, fees: 140 },
      { startDate: '2027-01-10', endDate: '2027-02-10', drawDown: 8000, repayment: 12000, fees: 130 },
    ]),
    history: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'CREATE_LOAN',
        details: 'Loan facility created with seed data',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  return {
    countries,
    companies: [companyA, companyB],
    companyHistory: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'SEED_COMPANIES',
        details: 'Seed companies loaded',
      },
    ],
    loans: [sampleLoan, sampleLoan2, sampleLoan3, sampleLoan4],
    users,
    userHistory: [
      {
        id: createId(),
        timestamp: now,
        userId: 'system',
        userName: 'System',
        action: 'SEED_USERS',
        details: 'Seed users loaded',
      },
    ],
  }
}

const loadStore = (): DataStore => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = seedStore()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as DataStore
    if (
      (parsed.countries !== undefined && !Array.isArray(parsed.countries)) ||
      !Array.isArray(parsed.companies) ||
      !Array.isArray(parsed.loans) ||
      (parsed.users !== undefined && !Array.isArray(parsed.users)) ||
      (parsed.companyHistory !== undefined && !Array.isArray(parsed.companyHistory)) ||
      (parsed.userHistory !== undefined && !Array.isArray(parsed.userHistory))
    ) {
      throw new Error('Invalid store shape')
    }

    const now = nowIso()
    parsed.countries = (parsed.countries ?? [
      { id: createId(), name: 'Italy', code: 'IT', createdAt: now, updatedAt: now },
      { id: createId(), name: 'United Kingdom', code: 'UK', createdAt: now, updatedAt: now },
      { id: createId(), name: 'Untied States', code: 'US', createdAt: now, updatedAt: now },
      { id: createId(), name: 'Khazakstan', code: 'KZ', createdAt: now, updatedAt: now },
    ]).map((country) => ({
      ...country,
      name: String(country.name ?? '').trim() || 'Italy',
      code: String(country.code ?? '').trim().toUpperCase() || 'IT',
      createdAt: country.createdAt ?? now,
      updatedAt: country.updatedAt ?? now,
    }))

    parsed.companies = parsed.companies.map((company) => ({
      ...company,
      type: normalizeCompanyType(company.type),
      country: normalizeCountry(company.country),
      bankAccounts: normalizeCompanyBankAccounts(company.bankAccounts),
    }))

    const companyById = new Map(parsed.companies.map((company) => [company.id, company]))

    parsed.loans = parsed.loans.map((loan) => {
      const lenderCompany = companyById.get(loan.lenderCompanyId)
      const borrowerCompany = companyById.get(loan.borrowerCompanyId)
      const lenderFallback = lenderCompany?.bankAccounts[0] ?? 'Primary account'
      const borrowerFallback = borrowerCompany?.bankAccounts[0] ?? 'Primary account'

      return {
        ...loan,
        status: (loan.status as LoanStatus | undefined) ?? 'Active',
        startDate: loan.startDate || loan.createdAt?.slice(0, 10) || loan.agreementDate || nowIso().slice(0, 10),
        closeDate:
          (loan.status as LoanStatus | undefined) === 'Closed'
            ? loan.closeDate || loan.updatedAt?.slice(0, 10) || nowIso().slice(0, 10)
            : '',
        schedule: loan.schedule.map((row) =>
          withScheduleBankAccountDefaults(
            row,
            lenderFallback,
            borrowerFallback,
            loan.annualInterestRate,
          ),
        ),
      }
    })

    parsed.users = (parsed.users ?? mockUsers.map((user) => {
      const [firstName = user.name, ...rest] = user.name.split(' ')
      const lastName = rest.join(' ')
      const normalizedEmail = user.email.trim().toLowerCase()

      return {
        id: user.id,
        firstName,
        lastName,
        email: normalizedEmail,
        role:
          normalizedEmail === 'mina.rossi@natpower.com'
            ? ('Admin' as UserRole)
            : normalizedEmail === 'alex.carter@natpower.com'
              ? ('Viewer' as UserRole)
              : ('Editor' as UserRole),
        country:
          normalizedEmail === 'mina.rossi@natpower.com'
            ? 'Global'
            : normalizedEmail === 'alex.carter@natpower.com'
            ? 'United Kingdom'
            : 'Italy',
        createdAt: now,
        updatedAt: now,
      }
    })).map((user) => {
      const normalizedRole: UserRole =
        user.email.trim().toLowerCase() === 'mina.rossi@natpower.com'
          ? ('Admin' as UserRole)
          : user.email.trim().toLowerCase() === 'alex.carter@natpower.com'
          ? ('Viewer' as UserRole)
          : normalizeRole(user.role)

      return {
        ...user,
        email: user.email.trim().toLowerCase(),
        role: normalizedRole,
        country: normalizedRole === 'Admin' ? 'Global' : normalizeCountry(user.country),
      }
    })

    const defaultMockUsers: AccessUser[] = [
      {
        id: 'u-1',
        firstName: 'Mina',
        lastName: 'Rossi',
        email: 'mina.rossi@natpower.com',
        role: 'Admin',
        country: 'Global',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'u-2',
        firstName: 'Alex',
        lastName: 'Carter',
        email: 'alex.carter@natpower.com',
        role: 'Viewer',
        country: 'United Kingdom',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'u-3',
        firstName: 'Luca',
        lastName: 'Bianchi',
        email: 'luca.bianchi@natpower.com',
        role: 'Editor',
        country: 'Italy',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const existingEmails = new Set(parsed.users.map((user) => user.email.toLowerCase()))
    const missingDefaults = defaultMockUsers.filter(
      (user) => !existingEmails.has(user.email.toLowerCase()),
    )
    if (missingDefaults.length > 0) {
      parsed.users = [...parsed.users, ...missingDefaults]
    }

    parsed.companyHistory = Array.isArray(parsed.companyHistory) ? parsed.companyHistory : []
    parsed.userHistory = Array.isArray(parsed.userHistory) ? parsed.userHistory : []

    return parsed
  } catch {
    const seed = seedStore()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

const saveStore = (store: DataStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

const withLatency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 120))
  return value
}

const addLoanHistory = (
  loan: LoanFacility,
  user: MockUser,
  action: string,
  details: string,
): LoanFacility => {
  return {
    ...loan,
    history: [
      {
        id: createId(),
        timestamp: nowIso(),
        userId: user.id,
        userName: user.name,
        action,
        details,
      },
      ...loan.history,
    ],
  }
}

const toActor = (user?: MockUser): MockUser => {
  if (user) {
    return user
  }

  return {
    id: 'system',
    name: 'System',
    email: 'system@local',
  }
}

const createAdminHistoryEntry = (
  user: MockUser | undefined,
  action: string,
  details: string,
): AdminHistoryEntry => {
  const actor = toActor(user)
  return {
    id: createId(),
    timestamp: nowIso(),
    userId: actor.id,
    userName: actor.name,
    action,
    details,
  }
}

const getScheduleRowIndex = (schedule: ScheduleItem[], itemId: string): number => {
  const sorted = [...schedule].sort((first, second) =>
    first.startDate.localeCompare(second.startDate),
  )

  const index = sorted.findIndex((item) => item.id === itemId)
  return index >= 0 ? index + 1 : 0
}

const formatScheduleValues = (
  values: Pick<
    ScheduleItem,
    | 'startDate'
    | 'endDate'
    | 'lenderBankAccount'
    | 'borrowerBankAccount'
    | 'annualInterestRate'
    | 'drawDown'
    | 'repayment'
    | 'fees'
  >,
): string => {
  return [
    `Start Date=${values.startDate}`,
    `End Date=${values.endDate}`,
    `Lender Bank Account=${values.lenderBankAccount}`,
    `Borrower Bank Account=${values.borrowerBankAccount}`,
    `Annual Interest Rate %=${values.annualInterestRate}`,
    `Draw Down=${values.drawDown}`,
    `Repayment=${values.repayment}`,
    `Fees=${values.fees}`,
  ].join(' | ')
}

const formatUserValues = (
  values: Pick<AccessUser, 'firstName' | 'lastName' | 'email' | 'role' | 'country'>,
): string => {
  return [
    `First Name=${values.firstName}`,
    `Last Name=${values.lastName}`,
    `Email=${values.email}`,
    `Role=${values.role}`,
    `Country=${values.country}`,
  ].join(' | ')
}

const formatCompanyValues = (
  values: Pick<Company, 'name' | 'code' | 'type' | 'country' | 'bankAccounts'>,
): string => {
  return [
    `Name=${values.name}`,
    `SAP Code=${values.code}`,
    `Type=${values.type}`,
    `Country=${values.country}`,
    `Bank Accounts=${values.bankAccounts.join(', ')}`,
  ].join(' | ')
}

const formatUpdatedFields = (
  changes: Array<{ field: string; before: string; after: string }>,
): string => {
  if (changes.length === 0) {
    return 'No values changed'
  }

  return changes
    .map((change) => `${change.field}: Before=${change.before} | After=${change.after}`)
    .join(' || ')
}

export const mockUsers: MockUser[] = [
  { id: 'u-1', name: 'Mina Rossi', email: 'mina.rossi@natpower.com' },
  { id: 'u-2', name: 'Alex Carter', email: 'alex.carter@natpower.com' },
  { id: 'u-3', name: 'Luca Bianchi', email: 'luca.bianchi@natpower.com' },
]

export const mockApi = {
  async resetData(): Promise<DataStore> {
    const seed = seedStore()
    saveStore(seed)
    return withLatency(seed)
  },

  async getCountries(): Promise<Country[]> {
    const store = loadStore()
    return withLatency(store.countries)
  },

  async createCountry(input: Pick<Country, 'name' | 'code'>): Promise<Country> {
    const store = loadStore()
    const name = String(input.name ?? '').trim()
    const code = String(input.code ?? '').trim().toUpperCase()
    if (!name || !code) {
      throw new Error('Country name and code are required')
    }

    const duplicate = store.countries.some(
      (country) =>
        country.name.toLowerCase() === name.toLowerCase() ||
        country.code.toLowerCase() === code.toLowerCase(),
    )
    if (duplicate) {
      throw new Error('Country name or code already exists')
    }

    const now = nowIso()
    const country: Country = {
      id: createId(),
      name,
      code,
      createdAt: now,
      updatedAt: now,
    }

    store.countries.push(country)
    saveStore(store)
    return withLatency(country)
  },

  async updateCountry(countryId: string, input: Pick<Country, 'name' | 'code'>): Promise<Country> {
    const store = loadStore()
    const existing = store.countries.find((country) => country.id === countryId)
    if (!existing) {
      throw new Error('Country not found')
    }

    const name = String(input.name ?? '').trim()
    const code = String(input.code ?? '').trim().toUpperCase()
    if (!name || !code) {
      throw new Error('Country name and code are required')
    }

    const duplicate = store.countries.some(
      (country) =>
        country.id !== countryId &&
        (country.name.toLowerCase() === name.toLowerCase() ||
          country.code.toLowerCase() === code.toLowerCase()),
    )
    if (duplicate) {
      throw new Error('Country name or code already exists')
    }

    existing.name = name
    existing.code = code
    existing.updatedAt = nowIso()
    saveStore(store)
    return withLatency(existing)
  },

  async deleteCountry(countryId: string): Promise<void> {
    const store = loadStore()
    const existing = store.countries.find((country) => country.id === countryId)
    if (!existing) {
      throw new Error('Country not found')
    }

    const isInUseByCompany = store.companies.some((company) => company.country === existing.name)
    const isInUseByUser = store.users.some((user) => user.country === existing.name)
    if (isInUseByCompany || isInUseByUser) {
      throw new Error('Country is referenced by existing companies or users')
    }

    store.countries = store.countries.filter((country) => country.id !== countryId)
    saveStore(store)
    return withLatency(undefined)
  },

  async getCompanies(): Promise<Company[]> {
    const store = loadStore()
    return withLatency(store.companies)
  },

  async getUsers(): Promise<AccessUser[]> {
    const store = loadStore()
    return withLatency(store.users)
  },

  async getCompanyHistory(): Promise<AdminHistoryEntry[]> {
    const store = loadStore()
    return withLatency(store.companyHistory)
  },

  async getUserHistory(): Promise<AdminHistoryEntry[]> {
    const store = loadStore()
    return withLatency(store.userHistory)
  },

  async createUser(
    input: Pick<AccessUser, 'firstName' | 'lastName' | 'email' | 'role' | 'country'>,
    actor?: MockUser,
  ): Promise<AccessUser> {
    const store = loadStore()
    const normalizedEmail = input.email.trim().toLowerCase()
    if (!normalizedEmail) {
      throw new Error('Email is required')
    }

    const existing = store.users.find((user) => user.email === normalizedEmail)
    if (existing) {
      throw new Error('User email already exists')
    }

    const now = nowIso()
    const normalizedRole = normalizeRole(input.role)
    const user: AccessUser = {
      id: createId(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
      role: normalizedRole,
      country: normalizedRole === 'Admin' ? 'Global' : normalizeCountry(input.country),
      createdAt: now,
      updatedAt: now,
    }

    store.users.push(user)
    store.userHistory = [
      createAdminHistoryEntry(
        actor,
        'CREATE_USER',
        `Created user. After: ${formatUserValues(user)}`,
      ),
      ...store.userHistory,
    ]
    saveStore(store)
    return withLatency(user)
  },

  async updateUser(
    userId: string,
    input: Pick<AccessUser, 'firstName' | 'lastName' | 'email' | 'role' | 'country'>,
    actor?: MockUser,
  ): Promise<AccessUser> {
    const store = loadStore()
    const existing = store.users.find((user) => user.id === userId)
    if (!existing) {
      throw new Error('User not found')
    }

    const normalizedEmail = input.email.trim().toLowerCase()
    if (!normalizedEmail) {
      throw new Error('Email is required')
    }

    const emailConflict = store.users.some(
      (user) => user.id !== userId && user.email === normalizedEmail,
    )

    if (emailConflict) {
      throw new Error('User email already exists')
    }

    const beforeValues: Pick<AccessUser, 'firstName' | 'lastName' | 'email' | 'role' | 'country'> = {
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      role: existing.role,
      country: existing.country,
    }

    const normalizedRole = normalizeRole(input.role)
    existing.firstName = input.firstName.trim()
    existing.lastName = input.lastName.trim()
    existing.email = normalizedEmail
    existing.role = normalizedRole
    existing.country = normalizedRole === 'Admin' ? 'Global' : normalizeCountry(input.country)
    existing.updatedAt = nowIso()

    const changedValues = [
      { field: 'First Name', before: beforeValues.firstName, after: existing.firstName },
      { field: 'Last Name', before: beforeValues.lastName, after: existing.lastName },
      { field: 'Email', before: beforeValues.email, after: existing.email },
      { field: 'Role', before: beforeValues.role, after: existing.role },
      { field: 'Country', before: beforeValues.country, after: existing.country },
    ].filter((change) => change.before !== change.after)

    store.userHistory = [
      createAdminHistoryEntry(
        actor,
        'UPDATE_USER',
        formatUpdatedFields(changedValues),
      ),
      ...store.userHistory,
    ]

    saveStore(store)
    return withLatency(existing)
  },

  async deleteUser(userId: string, actor?: MockUser): Promise<void> {
    const store = loadStore()
    const target = store.users.find((user) => user.id === userId)
    if (!target) {
      throw new Error('User not found')
    }

    store.userHistory = [
      createAdminHistoryEntry(
        actor,
        'DELETE_USER',
        `Deleted user. Before: ${formatUserValues(target)}`,
      ),
      ...store.userHistory,
    ]

    store.users = store.users.filter((user) => user.id !== userId)
    saveStore(store)
    return withLatency(undefined)
  },

  async authenticateUserByEmail(email: string): Promise<MockUser> {
    const store = loadStore()
    const normalizedEmail = email.trim().toLowerCase()
    const allowed = store.users.find((user) => user.email === normalizedEmail)
    if (!allowed) {
      throw new Error('Access denied: this email is not in the approved user list')
    }

    return withLatency({
      id: allowed.id,
      name: `${allowed.firstName} ${allowed.lastName}`.trim(),
      email: allowed.email,
    })
  },

  async createCompany(
    input: Pick<Company, 'name' | 'code' | 'type' | 'country' | 'bankAccounts'>,
    actor?: MockUser,
  ): Promise<Company> {
    const store = loadStore()
    const now = nowIso()
    const company: Company = {
      id: createId(),
      name: input.name.trim(),
      code: input.code.trim(),
      type: normalizeCompanyType(input.type),
      country: normalizeCountry(input.country),
      bankAccounts: normalizeCompanyBankAccounts(input.bankAccounts),
      createdAt: now,
      updatedAt: now,
    }

    store.companies.push(company)
    store.companyHistory = [
      createAdminHistoryEntry(
        actor,
        'CREATE_COMPANY',
        `Created company. After: ${formatCompanyValues(company)}`,
      ),
      ...store.companyHistory,
    ]
    saveStore(store)
    return withLatency(company)
  },

  async updateCompany(
    companyId: string,
    input: Pick<Company, 'name' | 'code' | 'type' | 'country' | 'bankAccounts'>,
    actor?: MockUser,
  ): Promise<Company> {
    const store = loadStore()
    const existing = store.companies.find((company) => company.id === companyId)
    if (!existing) {
      throw new Error('Company not found')
    }

    const beforeValues: Pick<Company, 'name' | 'code' | 'type' | 'country' | 'bankAccounts'> = {
      name: existing.name,
      code: existing.code,
      type: existing.type,
      country: existing.country,
      bankAccounts: [...existing.bankAccounts],
    }

    existing.name = input.name.trim()
    existing.code = input.code.trim()
    existing.type = normalizeCompanyType(input.type)
    existing.country = normalizeCountry(input.country)
    existing.bankAccounts = normalizeCompanyBankAccounts(input.bankAccounts)
    existing.updatedAt = nowIso()

    const changedValues = [
      { field: 'Name', before: beforeValues.name, after: existing.name },
      { field: 'SAP Code', before: beforeValues.code, after: existing.code },
      { field: 'Type', before: beforeValues.type, after: existing.type },
      { field: 'Country', before: beforeValues.country, after: existing.country },
      {
        field: 'Bank Accounts',
        before: beforeValues.bankAccounts.join(', '),
        after: existing.bankAccounts.join(', '),
      },
    ].filter((change) => change.before !== change.after)

    store.companyHistory = [
      createAdminHistoryEntry(
        actor,
        'UPDATE_COMPANY',
        formatUpdatedFields(changedValues),
      ),
      ...store.companyHistory,
    ]

    saveStore(store)
    return withLatency(existing)
  },

  async deleteCompany(companyId: string, actor?: MockUser): Promise<void> {
    const store = loadStore()
    const target = store.companies.find((company) => company.id === companyId)
    if (!target) {
      throw new Error('Company not found')
    }

    const inUse = store.loans.some(
      (loan) =>
        loan.lenderCompanyId === companyId || loan.borrowerCompanyId === companyId,
    )

    if (inUse) {
      throw new Error('Company is referenced by an existing loan facility')
    }

    store.companyHistory = [
      createAdminHistoryEntry(
        actor,
        'DELETE_COMPANY',
        `Deleted company. Before: ${formatCompanyValues(target)}`,
      ),
      ...store.companyHistory,
    ]

    store.companies = store.companies.filter((company) => company.id !== companyId)
    saveStore(store)
    return withLatency(undefined)
  },

  async getLoans(): Promise<LoanFacility[]> {
    const store = loadStore()
    return withLatency(store.loans)
  },

  async createLoan(
    input: Omit<
      LoanFacility,
      'id' | 'schedule' | 'history' | 'createdAt' | 'updatedAt' | 'startDate' | 'closeDate'
    >,
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const now = nowIso()
    const actorRole =
      store.users.find(
        (candidate) =>
          candidate.id === user.id || candidate.email.toLowerCase() === user.email.toLowerCase(),
      )?.role ?? 'Viewer'

    if (input.status === 'Closed' && actorRole !== 'Admin') {
      throw new Error('Only admins can set status to Closed')
    }

    let loan: LoanFacility = {
      ...input,
      id: createId(),
      startDate: now.slice(0, 10),
      closeDate: input.status === 'Closed' ? now.slice(0, 10) : '',
      schedule: [],
      history: [],
      createdAt: now,
      updatedAt: now,
    }

    loan = addLoanHistory(loan, user, 'CREATE_LOAN', `Created loan ${loan.name}`)

    store.loans.push(loan)
    saveStore(store)
    return withLatency(loan)
  },

  async updateLoan(
    loanId: string,
    input: Omit<
      LoanFacility,
      'id' | 'schedule' | 'history' | 'createdAt' | 'updatedAt' | 'startDate' | 'closeDate'
    >,
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const index = store.loans.findIndex((loan) => loan.id === loanId)
    if (index < 0) {
      throw new Error('Loan facility not found')
    }

    const current = store.loans[index]
    const actorRole =
      store.users.find(
        (candidate) =>
          candidate.id === user.id || candidate.email.toLowerCase() === user.email.toLowerCase(),
      )?.role ?? 'Viewer'
    const isClosingTransition = current.status !== 'Closed' && input.status === 'Closed'
    if (isClosingTransition && actorRole !== 'Admin') {
      throw new Error('Only admins can set status to Closed')
    }

    const nextCloseDate =
      isClosingTransition
        ? nowIso().slice(0, 10)
        : input.status === 'Closed'
          ? current.closeDate
          : ''

    const nextLoan: LoanFacility = {
      ...current,
      ...input,
      closeDate: nextCloseDate,
      updatedAt: nowIso(),
    }

    store.loans[index] = addLoanHistory(
      nextLoan,
      user,
      'UPDATE_LOAN',
      `Updated loan ${nextLoan.name}`,
    )

    saveStore(store)
    return withLatency(store.loans[index])
  },

  async deleteLoan(loanId: string): Promise<void> {
    const store = loadStore()
    store.loans = store.loans.filter((loan) => loan.id !== loanId)
    saveStore(store)
    return withLatency(undefined)
  },

  async createScheduleItem(
    loanId: string,
    input: Omit<ScheduleItem, 'id' | 'updatedAt'>,
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const index = store.loans.findIndex((loan) => loan.id === loanId)
    if (index < 0) {
      throw new Error('Loan facility not found')
    }

    const current = store.loans[index]
    const lenderFallback =
      store.companies.find((company) => company.id === current.lenderCompanyId)?.bankAccounts[0] ??
      'Primary account'
    const borrowerFallback =
      store.companies.find((company) => company.id === current.borrowerCompanyId)?.bankAccounts[0] ??
      'Primary account'
    const now = nowIso()
    const item: ScheduleItem = {
      id: createId(),
      ...input,
      lenderBankAccount: input.lenderBankAccount || lenderFallback,
      borrowerBankAccount: input.borrowerBankAccount || borrowerFallback,
      annualInterestRate:
        Number.isFinite(input.annualInterestRate) && input.annualInterestRate >= 0
          ? input.annualInterestRate
          : current.annualInterestRate,
      updatedAt: now,
    }

    const updated: LoanFacility = {
      ...current,
      schedule: [...current.schedule, item],
      updatedAt: now,
    }

    const rowIndex = getScheduleRowIndex(updated.schedule, item.id)

    store.loans[index] = addLoanHistory(
      updated,
      user,
      'CREATE_SCHEDULE',
      `Row ${rowIndex} created. After: ${formatScheduleValues(input)}`,
    )

    saveStore(store)
    return withLatency(store.loans[index])
  },

  async updateScheduleItem(
    loanId: string,
    itemId: string,
    input: Omit<ScheduleItem, 'id' | 'updatedAt'>,
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const index = store.loans.findIndex((loan) => loan.id === loanId)
    if (index < 0) {
      throw new Error('Loan facility not found')
    }

    const current = store.loans[index]
    const beforeItem = current.schedule.find((item) => item.id === itemId)
    if (!beforeItem) {
      throw new Error('Schedule row not found')
    }

    const beforeIndex = getScheduleRowIndex(current.schedule, itemId)

    const updatedSchedule = current.schedule.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      return {
        ...item,
        ...input,
        updatedAt: nowIso(),
      }
    })

    const updatedLoan: LoanFacility = {
      ...current,
      schedule: updatedSchedule,
      updatedAt: nowIso(),
    }

    const afterIndex = getScheduleRowIndex(updatedSchedule, itemId)
    const indexText =
      beforeIndex === afterIndex
        ? `Row ${afterIndex}`
        : `Row ${beforeIndex} to Row ${afterIndex}`

    store.loans[index] = addLoanHistory(
      updatedLoan,
      user,
      'UPDATE_SCHEDULE',
      `${indexText} updated. Before: ${formatScheduleValues(beforeItem)} | After: ${formatScheduleValues(input)}`,
    )

    saveStore(store)
    return withLatency(store.loans[index])
  },

  async deleteScheduleItem(
    loanId: string,
    itemId: string,
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const index = store.loans.findIndex((loan) => loan.id === loanId)
    if (index < 0) {
      throw new Error('Loan facility not found')
    }

    const current = store.loans[index]
    const beforeItem = current.schedule.find((item) => item.id === itemId)
    if (!beforeItem) {
      throw new Error('Schedule row not found')
    }

    const beforeIndex = getScheduleRowIndex(current.schedule, itemId)

    const updatedLoan: LoanFacility = {
      ...current,
      schedule: current.schedule.filter((item) => item.id !== itemId),
      updatedAt: nowIso(),
    }

    store.loans[index] = addLoanHistory(
      updatedLoan,
      user,
      'DELETE_SCHEDULE',
      `Row ${beforeIndex} deleted. Before: ${formatScheduleValues(beforeItem)}`,
    )

    saveStore(store)
    return withLatency(store.loans[index])
  },

  async importSchedule(
    loanId: string,
    rows: Array<Omit<ScheduleItem, 'id' | 'updatedAt'>>,
    mode: 'overwrite' | 'extend',
    user: MockUser,
  ): Promise<LoanFacility> {
    const store = loadStore()
    const index = store.loans.findIndex((loan) => loan.id === loanId)
    if (index < 0) {
      throw new Error('Loan facility not found')
    }

    if (rows.length === 0) {
      throw new Error('No schedule rows found to import')
    }

    const now = nowIso()
    const current = store.loans[index]
    const lenderFallback =
      store.companies.find((company) => company.id === current.lenderCompanyId)?.bankAccounts[0] ??
      'Primary account'
    const borrowerFallback =
      store.companies.find((company) => company.id === current.borrowerCompanyId)?.bankAccounts[0] ??
      'Primary account'
    const importedRows: ScheduleItem[] = rows.map((row) => ({
      id: createId(),
      ...row,
      lenderBankAccount: row.lenderBankAccount || lenderFallback,
      borrowerBankAccount: row.borrowerBankAccount || borrowerFallback,
      annualInterestRate:
        Number.isFinite(row.annualInterestRate) && row.annualInterestRate >= 0
          ? row.annualInterestRate
          : current.annualInterestRate,
      updatedAt: now,
    }))

    const nextSchedule =
      mode === 'overwrite' ? importedRows : [...current.schedule, ...importedRows]

    const updatedLoan: LoanFacility = {
      ...current,
      schedule: nextSchedule,
      updatedAt: now,
    }

    const details =
      mode === 'overwrite'
        ? `Imported schedule with overwrite mode. Previous rows=${current.schedule.length}, imported rows=${importedRows.length}, final rows=${nextSchedule.length}`
        : `Imported schedule with extend mode. Existing rows=${current.schedule.length}, imported rows=${importedRows.length}, final rows=${nextSchedule.length}`

    store.loans[index] = addLoanHistory(
      updatedLoan,
      user,
      'IMPORT_SCHEDULE',
      details,
    )

    saveStore(store)
    return withLatency(store.loans[index])
  },
}
