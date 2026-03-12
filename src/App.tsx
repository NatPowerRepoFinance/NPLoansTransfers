// import { useCallback, useEffect, useMemo, useState } from 'react'
// import type { FormEvent } from 'react'
// import styled from 'styled-components'
// import { jsPDF } from 'jspdf'
// import autoTable from 'jspdf-autotable'
// import * as XLSX from 'xlsx'
// import logoTagline from './assets/NatPower_Logo_Tagline-White.svg'
// import logoN from './assets/NatPower_Logo_N-White.svg'
// import './App.css'
// import { mockApi } from './services/mockApi'
// import type { AccessUser, LoanFacility, MockUser, ScheduleItem, UserRole } from './types'
// import { calculateSchedule } from './utils/calculations'
// import { formatCurrency, formatCurrencyInteger, formatDate } from './utils/format'

// type ThemeMode = 'light' | 'dark'

// const THEME_STORAGE_KEY = 'npfinance-theme'

// const ModalBackdrop = styled.div`
//   position: fixed;
//   inset: 0;
//   background: rgba(0, 0, 0, 0.35);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   z-index: 1000;
// `

// const ModalCard = styled.div`
//   width: min(656px, 92vw);
//   background: var(--surface);
//   border-radius: 10px;
//   border: 1px solid var(--border);
//   padding: 16px;
// `

// const ModalHeader = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   margin-bottom: 12px;
// `

// const BaseButton = styled.button`
//   border: 1px solid var(--button-border);
//   border-radius: 6px;
//   padding: 6px 10px;
//   cursor: pointer;
//   transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.05s ease;

//   &:active:not(:disabled) {
//     transform: translateY(1px);
//   }

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }
// `

// const NewSaveButton = styled(BaseButton)`
//   background: #d8f3dc;
//   border-color: #95d5b2;
//   color: #1b4332;

//   &:hover:not(:disabled) {
//     background: #c7efcf;
//     border-color: #74c69d;
//   }
// `

// const EditButton = styled(BaseButton)`
//   background: #dceeff;
//   border-color: #9bc2e6;
//   color: #0b3d91;

//   &:hover:not(:disabled) {
//     background: #c9e4ff;
//     border-color: #7aa6d8;
//   }
// `

// const DeleteButton = styled(BaseButton)`
//   background: #f8d7da;
//   border-color: #f1aeb5;
//   color: #842029;

//   &:hover:not(:disabled) {
//     background: #f5c6cb;
//     border-color: #ea999f;
//   }
// `

// const NeutralButton = styled(BaseButton)`
//   background: var(--button-neutral-bg);
//   color: var(--button-neutral-text);

//   &:hover:not(:disabled) {
//     background: var(--button-neutral-hover-bg);
//     border-color: var(--button-neutral-hover-border);
//   }
// `

// const IconButton = styled(NeutralButton)`
//   width: 34px;
//   height: 34px;
//   padding: 0;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 18px;
//   line-height: 1;
// `

// const SectionActionRow = styled.div`
//   display: flex;
//   gap: 8px;
//   align-items: flex-end;
//   margin-bottom: 12px;
// `

// const ImportModeSelect = styled.select`
//   padding: 6px 8px;
//   border: 1px solid #ccc;
//   border-radius: 6px;
// `

// const emptyScheduleForm = {
//   id: '',
//   startDate: '',
//   endDate: '',
//   bankTransactionDate: '',
//   transactionDetail: '',
//   bankLedgerBalance: 0,
//   drawDown: 0,
//   repayment: 0,
//   fees: 0,
// }

// const emptyLoanForm = {
//   name: '',
//   status: 'Active' as LoanFacility['status'],
//   lenderCompanyId: '',
//   borrowerCompanyId: '',
//   agreementDate: '',
//   currency: 'EUR' as LoanFacility['currency'],
//   bankAccountNumber: '',
//   bankAccountName: '',
//   bankAccountCurrency: 'EUR' as LoanFacility['currency'],
//   bankAccountTypeStatus: '',
//   bankIban: '',
//   bankIdentifier: '',
//   bankName: '',
//   bankAddress: '',
//   annualInterestRate: 0,
//   daysInYear: 365,
// }

// const emptyCompanyForm = {
//   name: '',
//   code: '',
// }

// const emptyUserForm = {
//   firstName: '',
//   lastName: '',
//   email: '',
//   role: 'Viewer' as UserRole,
// }

// type DeleteTarget =
//   | { kind: 'company'; id: string; label: string }
//   | { kind: 'loan'; id: string; label: string }
//   | { kind: 'schedule'; id: string; label: string }
//   | { kind: 'user'; id: string; label: string }

// function App() {
//   const getInitialTheme = (): ThemeMode => {
//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
//     if (savedTheme === 'light' || savedTheme === 'dark') {
//       return savedTheme
//     }

//     return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
//   }

//   const [activePage, setActivePage] = useState<'admin' | 'loan'>('loan')
//   const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
//   const [currentUser, setCurrentUser] = useState<MockUser | null>(null)
//   const [loginEmail, setLoginEmail] = useState('')
//   const [errorMessage, setErrorMessage] = useState<string | null>(null)

//   const [companies, setCompanies] = useState<Array<{ id: string; name: string; code: string }>>([])
//   const [companyForm, setCompanyForm] = useState(emptyCompanyForm)
//   const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
//   const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
//   const [users, setUsers] = useState<AccessUser[]>([])
//   const [userForm, setUserForm] = useState(emptyUserForm)
//   const [editingUserId, setEditingUserId] = useState<string | null>(null)
//   const [isUserModalOpen, setIsUserModalOpen] = useState(false)

//   const [loans, setLoans] = useState<LoanFacility[]>([])
//   const [selectedLoanId, setSelectedLoanId] = useState<string>('')
//   const [loanForm, setLoanForm] = useState(emptyLoanForm)
//   const [showActiveOnly, setShowActiveOnly] = useState(false)
//   const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
//   const [isCreatingLoan, setIsCreatingLoan] = useState(false)

//   const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm)
//   const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
//   const [isImportScheduleModalOpen, setIsImportScheduleModalOpen] = useState(false)
//   const [importScheduleMode, setImportScheduleMode] = useState<'overwrite' | 'extend'>('extend')
//   const [importScheduleFile, setImportScheduleFile] = useState<File | null>(null)
//   const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
//   const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

//   const selectedLoan = useMemo(
//     () => loans.find((loan) => loan.id === selectedLoanId) ?? null,
//     [loans, selectedLoanId],
//   )

//   const currentAccessUser = useMemo(() => {
//     if (!currentUser) {
//       return null
//     }

//     return (
//       users.find(
//         (user) => user.email.toLowerCase() === currentUser.email.toLowerCase(),
//       ) ?? null
//     )
//   }, [users, currentUser])

//   const canEdit = currentAccessUser?.role === 'Editor'

//   const calculatedRows = useMemo(() => {
//     if (!selectedLoan) {
//       return []
//     }

//     return calculateSchedule(
//       selectedLoan.schedule,
//       selectedLoan.annualInterestRate,
//       selectedLoan.daysInYear,
//     )
//   }, [selectedLoan])

//   const getLoanStatus = (loan: LoanFacility): LoanFacility['status'] => {
//     return loan.status ?? 'Active'
//   }

//   const visibleLoans = useMemo(
//     () => loans.filter((loan) => !showActiveOnly || getLoanStatus(loan) === 'Active'),
//     [loans, showActiveOnly],
//   )

//   const loadAllData = useCallback(async () => {
//     const [nextCompanies, nextLoans, nextUsers] = await Promise.all([
//       mockApi.getCompanies(),
//       mockApi.getLoans(),
//       mockApi.getUsers(),
//     ])

//     setCompanies(nextCompanies)
//     setLoans(nextLoans)
//     setUsers(nextUsers)

//     setLoginEmail((previous) => previous || nextUsers[0]?.email || '')
//   }, [])

//   const resetMockData = async () => {
//     setErrorMessage(null)

//     try {
//       ensureEditor()
//       await mockApi.resetData()
//       setSelectedLoanId('')
//       setEditingCompanyId(null)
//       setIsCompanyModalOpen(false)
//       setIsLoanModalOpen(false)
//       setIsScheduleModalOpen(false)
//       setIsImportScheduleModalOpen(false)
//       setIsHistoryModalOpen(false)
//       setDeleteTarget(null)
//       setCompanyForm(emptyCompanyForm)
//       setUserForm(emptyUserForm)
//       setEditingUserId(null)
//       setIsUserModalOpen(false)
//       setLoanForm(emptyLoanForm)
//       setScheduleForm(emptyScheduleForm)
//       setImportScheduleFile(null)
//       setImportScheduleMode('extend')
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Failed to reset mock data')
//     }
//   }

//   useEffect(() => {
//     loadAllData().catch((error) => {
//       setErrorMessage(error instanceof Error ? error.message : 'Failed to load data')
//     })
//   }, [loadAllData])

//   useEffect(() => {
//     document.documentElement.setAttribute('data-theme', theme)
//     localStorage.setItem(THEME_STORAGE_KEY, theme)
//   }, [theme])

//   useEffect(() => {
//     if (!currentUser) {
//       return
//     }

//     const stillAllowed = users.some(
//       (user) => user.email.toLowerCase() === currentUser.email.toLowerCase(),
//     )

//     if (!stillAllowed) {
//       setCurrentUser(null)
//       setErrorMessage('Your account is no longer on the approved user list')
//     }
//   }, [users, currentUser])

//   useEffect(() => {
//     if (!showActiveOnly) {
//       return
//     }

//     if (selectedLoan && getLoanStatus(selectedLoan) !== 'Active') {
//       const firstActive = loans.find((loan) => getLoanStatus(loan) === 'Active')
//       setSelectedLoanId(firstActive?.id ?? '')
//     }
//   }, [showActiveOnly, loans, selectedLoan])

//   useEffect(() => {
//     if (!selectedLoan && loans.length > 0 && !isCreatingLoan) {
//       setSelectedLoanId(loans[0].id)
//       return
//     }

//     if (!selectedLoan) {
//       setLoanForm({
//         ...emptyLoanForm,
//         status: 'Active',
//         lenderCompanyId: companies[0]?.id ?? '',
//         borrowerCompanyId: companies[1]?.id ?? companies[0]?.id ?? '',
//       })
//       return
//     }

//     setLoanForm({
//       name: selectedLoan.name,
//       status: getLoanStatus(selectedLoan),
//       lenderCompanyId: selectedLoan.lenderCompanyId,
//       borrowerCompanyId: selectedLoan.borrowerCompanyId,
//       agreementDate: selectedLoan.agreementDate,
//       currency: selectedLoan.currency,
//       bankAccountNumber: selectedLoan.bankAccountNumber,
//       bankAccountName: selectedLoan.bankAccountName,
//       bankAccountCurrency: selectedLoan.bankAccountCurrency,
//       bankAccountTypeStatus: selectedLoan.bankAccountTypeStatus,
//       bankIban: selectedLoan.bankIban,
//       bankIdentifier: selectedLoan.bankIdentifier,
//       bankName: selectedLoan.bankName,
//       bankAddress: selectedLoan.bankAddress,
//       annualInterestRate: selectedLoan.annualInterestRate,
//       daysInYear: selectedLoan.daysInYear,
//     })
//   }, [selectedLoan, loans, companies, isCreatingLoan])

//   const submitCompany = async (event: FormEvent) => {
//     event.preventDefault()
//     setErrorMessage(null)
//     try {
//       ensureEditor()
//       if (!companyForm.name.trim() || !companyForm.code.trim()) {
//         throw new Error('Company name and code are required')
//       }

//       if (editingCompanyId) {
//         await mockApi.updateCompany(editingCompanyId, companyForm)
//       } else {
//         await mockApi.createCompany(companyForm)
//       }

//       setCompanyForm(emptyCompanyForm)
//       setEditingCompanyId(null)
//       setIsCompanyModalOpen(false)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Company save failed')
//     }
//   }

//   const openNewCompanyModal = () => {
//     setErrorMessage(null)
//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }
//     setEditingCompanyId(null)
//     setCompanyForm(emptyCompanyForm)
//     setIsCompanyModalOpen(true)
//   }

//   const openEditCompanyModal = (company: { id: string; name: string; code: string }) => {
//     setErrorMessage(null)
//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }
//     setEditingCompanyId(company.id)
//     setCompanyForm({ name: company.name, code: company.code })
//     setIsCompanyModalOpen(true)
//   }

//   const onDeleteCompany = async (companyId: string) => {
//     setErrorMessage(null)
//     try {
//       ensureEditor()
//       await mockApi.deleteCompany(companyId)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Company delete failed')
//     }
//   }

//   const submitUser = async (event: FormEvent) => {
//     event.preventDefault()
//     setErrorMessage(null)

//     try {
//       ensureEditor()
//       if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
//         throw new Error('First name and last name are required')
//       }

//       const email = userForm.email.trim().toLowerCase()
//       if (!email) {
//         throw new Error('Email is required')
//       }

//       const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
//       if (!isEmailValid) {
//         throw new Error('Enter a valid email address')
//       }

//       const payload = {
//         firstName: userForm.firstName,
//         lastName: userForm.lastName,
//         email,
//         role: userForm.role,
//       }

//       if (editingUserId) {
//         await mockApi.updateUser(editingUserId, payload)
//       } else {
//         await mockApi.createUser(payload)
//       }

//       setUserForm(emptyUserForm)
//       setEditingUserId(null)
//       setIsUserModalOpen(false)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'User save failed')
//     }
//   }

//   const openNewUserModal = () => {
//     setErrorMessage(null)
//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }
//     setEditingUserId(null)
//     setUserForm(emptyUserForm)
//     setIsUserModalOpen(true)
//   }

//   const openEditUserModal = (user: AccessUser) => {
//     setErrorMessage(null)
//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }
//     setEditingUserId(user.id)
//     setUserForm({
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       role: user.role,
//     })
//     setIsUserModalOpen(true)
//   }

//   const onDeleteUser = async (userId: string) => {
//     setErrorMessage(null)
//     try {
//       ensureEditor()
//       await mockApi.deleteUser(userId)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'User delete failed')
//     }
//   }

//   const ensureUser = (): MockUser => {
//     if (!currentUser) {
//       throw new Error('Sign in required')
//     }

//     return currentUser
//   }

//   const ensureEditor = (): MockUser => {
//     const user = ensureUser()
//     const accessUser = users.find(
//       (candidate) => candidate.email.toLowerCase() === user.email.toLowerCase(),
//     )

//     if (!accessUser) {
//       throw new Error('Access denied: this email is not in the approved user list')
//     }

//     if (accessUser.role !== 'Editor') {
//       throw new Error('Access denied: editor role is required for this action')
//     }

//     return user
//   }

//   const openNewLoanModal = () => {
//     setErrorMessage(null)
//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }
//     setSelectedLoanId('')
//     setIsCreatingLoan(true)
//     setLoanForm({
//       ...emptyLoanForm,
//       status: 'Active',
//       lenderCompanyId: companies[0]?.id ?? '',
//       borrowerCompanyId: companies[1]?.id ?? companies[0]?.id ?? '',
//     })
//     setIsLoanModalOpen(true)
//     setScheduleForm(emptyScheduleForm)
//     setIsScheduleModalOpen(false)
//   }

//   const openEditLoanModal = () => {
//     setErrorMessage(null)

//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }

//     if (!selectedLoanId || !selectedLoan) {
//       setErrorMessage('Select a loan facility first')
//       return
//     }

//     setIsCreatingLoan(false)
//     setLoanForm({
//       name: selectedLoan.name,
//       status: getLoanStatus(selectedLoan),
//       lenderCompanyId: selectedLoan.lenderCompanyId,
//       borrowerCompanyId: selectedLoan.borrowerCompanyId,
//       agreementDate: selectedLoan.agreementDate,
//       currency: selectedLoan.currency,
//       bankAccountNumber: selectedLoan.bankAccountNumber,
//       bankAccountName: selectedLoan.bankAccountName,
//       bankAccountCurrency: selectedLoan.bankAccountCurrency,
//       bankAccountTypeStatus: selectedLoan.bankAccountTypeStatus,
//       bankIban: selectedLoan.bankIban,
//       bankIdentifier: selectedLoan.bankIdentifier,
//       bankName: selectedLoan.bankName,
//       bankAddress: selectedLoan.bankAddress,
//       annualInterestRate: selectedLoan.annualInterestRate,
//       daysInYear: selectedLoan.daysInYear,
//     })
//     setIsLoanModalOpen(true)
//   }

//   const openNewScheduleModal = () => {
//     setErrorMessage(null)

//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }

//     if (!selectedLoanId) {
//       setErrorMessage('Select or create a loan facility first')
//       return
//     }

//     setScheduleForm(emptyScheduleForm)
//     setIsScheduleModalOpen(true)
//   }

//   const openImportScheduleModal = () => {
//     setErrorMessage(null)

//     if (!canEdit) {
//       setErrorMessage('Access denied: editor role is required for this action')
//       return
//     }

//     if (!selectedLoanId) {
//       setErrorMessage('Select or create a loan facility first')
//       return
//     }

//     setImportScheduleMode('extend')
//     setImportScheduleFile(null)
//     setIsImportScheduleModalOpen(true)
//   }

//   const formatExcelDateToIso = (input: unknown): string => {
//     if (input instanceof Date) {
//       return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, '0')}-${String(
//         input.getDate(),
//       ).padStart(2, '0')}`
//     }

//     if (typeof input === 'number') {
//       const parsed = XLSX.SSF.parse_date_code(input)
//       if (parsed) {
//         return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
//       }
//     }

//     const text = String(input ?? '').trim()
//     if (!text) {
//       return ''
//     }

//     if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
//       return text
//     }

//     const slashMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
//     if (slashMatch) {
//       const [, day, month, year] = slashMatch
//       return `${year}-${month}-${day}`
//     }

//     const parsedDate = new Date(text)
//     if (!Number.isNaN(parsedDate.getTime())) {
//       return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(
//         parsedDate.getDate(),
//       ).padStart(2, '0')}`
//     }

//     return ''
//   }

//   const parseImportNumber = (input: unknown): number => {
//     if (typeof input === 'number') {
//       return input
//     }

//     const cleaned = String(input ?? '')
//       .replace(/,/g, '')
//       .trim()

//     const value = Number(cleaned)
//     return Number.isFinite(value) ? value : 0
//   }

//   const readScheduleRowsFromFile = async (
//     file: File,
//   ): Promise<Array<Omit<ScheduleItem, 'id' | 'updatedAt'>>> => {
//     const buffer = await file.arrayBuffer()
//     const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
//     const firstSheetName = workbook.SheetNames[0]
//     if (!firstSheetName) {
//       throw new Error('The selected file has no worksheets')
//     }

//     const sheet = workbook.Sheets[firstSheetName]
//     const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
//     if (rawRows.length === 0) {
//       throw new Error('The selected file has no rows')
//     }

//     const normalize = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '')
//     const getByNames = (
//       row: Record<string, unknown>,
//       names: string[],
//     ): unknown => {
//       const normalizedRow = new Map<string, unknown>()
//       Object.entries(row).forEach(([key, value]) => {
//         normalizedRow.set(normalize(key), value)
//       })

//       for (const name of names) {
//         const value = normalizedRow.get(normalize(name))
//         if (value !== undefined) {
//           return value
//         }
//       }

//       return ''
//     }

//     const mappedRows = rawRows
//       .map((row) => ({
//         startDate: formatExcelDateToIso(getByNames(row, ['Start Date', 'StartDate'])),
//         endDate: formatExcelDateToIso(getByNames(row, ['End Date', 'EndDate'])),
//         bankTransactionDate: formatExcelDateToIso(
//           getByNames(row, ['Bank Transaction Date', 'BankTransactionDate']),
//         ),
//         transactionDetail: String(
//           getByNames(row, ['Transaction Detail', 'TransactionDetail']) ?? '',
//         ).trim(),
//         bankLedgerBalance: parseImportNumber(
//           getByNames(row, ['Bank Ledger Balance', 'BankLedgerBalance']),
//         ),
//         drawDown: parseImportNumber(getByNames(row, ['Draw Down', 'DrawDown'])),
//         repayment: parseImportNumber(getByNames(row, ['Repayment'])),
//         fees: parseImportNumber(getByNames(row, ['Fees'])),
//       }))
//       .map((row) => ({
//         ...row,
//         bankTransactionDate: row.bankTransactionDate || row.endDate,
//         transactionDetail: row.transactionDetail || 'Imported transaction',
//       }))
//       .filter((row) => row.startDate && row.endDate)

//     if (mappedRows.length === 0) {
//       throw new Error(
//         'No valid schedule rows found. Ensure columns include Start Date and End Date.',
//       )
//     }

//     return mappedRows
//   }

//   const importSchedule = async (event: FormEvent) => {
//     event.preventDefault()
//     setErrorMessage(null)

//     try {
//       const user = ensureEditor()
//       if (!selectedLoanId) {
//         throw new Error('Select a loan facility first')
//       }

//       if (!importScheduleFile) {
//         throw new Error('Select a file to import')
//       }

//       const rows = await readScheduleRowsFromFile(importScheduleFile)
//       await mockApi.importSchedule(selectedLoanId, rows, importScheduleMode, user)

//       setIsImportScheduleModalOpen(false)
//       setImportScheduleFile(null)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Import schedule failed')
//     }
//   }

//   const downloadImportTemplate = () => {
//     const workbook = XLSX.utils.book_new()
//     const sheet = XLSX.utils.aoa_to_sheet([
//       [
//         'Start Date',
//         'End Date',
//         'Bank Transaction Date',
//         'Transaction Detail',
//         'Bank Ledger Balance',
//         'Draw Down',
//         'Repayment',
//         'Fees',
//       ],
//       ['01/01/2026', '01/02/2026', '01/02/2026', 'Monthly transfer', 100000, 100000, 0, 0],
//     ])

//     XLSX.utils.book_append_sheet(workbook, sheet, 'Schedule Template')
//     XLSX.writeFile(workbook, 'drawdown_schedule_import_template.xlsx')
//   }

//   const saveLoan = async (event: FormEvent) => {
//     event.preventDefault()
//     setErrorMessage(null)

//     try {
//       const user = ensureEditor()
//       if (!loanForm.name.trim() || !loanForm.lenderCompanyId || !loanForm.borrowerCompanyId) {
//         throw new Error('Loan name, lender and borrower are required')
//       }

//       if (!loanForm.agreementDate) {
//         throw new Error('Agreement date is required')
//       }

//       if (selectedLoanId) {
//         const updated = await mockApi.updateLoan(selectedLoanId, loanForm, user)
//         setSelectedLoanId(updated.id)
//       } else {
//         const created = await mockApi.createLoan(loanForm, user)
//         setSelectedLoanId(created.id)
//       }

//       setIsCreatingLoan(false)
//       setIsLoanModalOpen(false)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Loan save failed')
//     }
//   }

//   const deleteLoan = async (loanIdToDelete?: string) => {
//     const targetLoanId = loanIdToDelete ?? selectedLoanId
//     if (!targetLoanId) {
//       return
//     }

//     setErrorMessage(null)
//     try {
//       ensureEditor()
//       await mockApi.deleteLoan(targetLoanId)
//       setSelectedLoanId('')
//       setIsCreatingLoan(false)
//       setIsLoanModalOpen(false)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Loan delete failed')
//     }
//   }

//   const confirmDelete = async () => {
//     if (!deleteTarget) {
//       return
//     }

//     const target = deleteTarget
//     setDeleteTarget(null)

//     if (target.kind === 'company') {
//       await onDeleteCompany(target.id)
//       return
//     }

//     if (target.kind === 'loan') {
//       await deleteLoan(target.id)
//       return
//     }

//     if (target.kind === 'user') {
//       await onDeleteUser(target.id)
//       return
//     }

//     await deleteSchedule(target.id)
//   }

//   const editSchedule = (row: ScheduleItem) => {
//     setScheduleForm({
//       id: row.id,
//       startDate: row.startDate,
//       endDate: row.endDate,
//       bankTransactionDate: row.bankTransactionDate,
//       transactionDetail: row.transactionDetail,
//       bankLedgerBalance: row.bankLedgerBalance,
//       drawDown: row.drawDown,
//       repayment: row.repayment,
//       fees: row.fees,
//     })
//     setIsScheduleModalOpen(true)
//   }

//   const saveSchedule = async (event: FormEvent) => {
//     event.preventDefault()
//     setErrorMessage(null)

//     try {
//       const user = ensureEditor()
//       if (!selectedLoanId) {
//         throw new Error('Select or create a loan facility first')
//       }

//       if (!scheduleForm.startDate || !scheduleForm.endDate) {
//         throw new Error('Start and end date are required')
//       }

//       const payload = {
//         startDate: scheduleForm.startDate,
//         endDate: scheduleForm.endDate,
//         bankTransactionDate: scheduleForm.bankTransactionDate,
//         transactionDetail: scheduleForm.transactionDetail,
//         bankLedgerBalance: Number(scheduleForm.bankLedgerBalance),
//         drawDown: Number(scheduleForm.drawDown),
//         repayment: Number(scheduleForm.repayment),
//         fees: Number(scheduleForm.fees),
//       }

//       if (scheduleForm.id) {
//         await mockApi.updateScheduleItem(selectedLoanId, scheduleForm.id, payload, user)
//       } else {
//         await mockApi.createScheduleItem(selectedLoanId, payload, user)
//       }

//       setScheduleForm(emptyScheduleForm)
//       setIsScheduleModalOpen(false)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Schedule save failed')
//     }
//   }

//   const deleteSchedule = async (itemId: string) => {
//     setErrorMessage(null)
//     try {
//       const user = ensureEditor()
//       if (!selectedLoanId) {
//         throw new Error('Select a loan first')
//       }

//       await mockApi.deleteScheduleItem(selectedLoanId, itemId, user)
//       await loadAllData()
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Schedule delete failed')
//     }
//   }

//   const companyNameById = (companyId: string): string => {
//     return companies.find((company) => company.id === companyId)?.name ?? '-'
//   }

//   const toExportFileName = (loanName: string, extension: 'pdf' | 'xlsx'): string => {
//     const safeName = loanName.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '')
//     const baseName = safeName || 'loan_facility'
//     return `${baseName}.${extension}`
//   }

//   const exportSelectedLoanToExcel = () => {
//     if (!selectedLoan) {
//       setErrorMessage('Select a loan facility to export')
//       return
//     }

//     setErrorMessage(null)

//     const scheduleRows = calculateSchedule(
//       selectedLoan.schedule,
//       selectedLoan.annualInterestRate,
//       selectedLoan.daysInYear,
//     )

//     const detailsRows = [
//       { Field: 'Facility Name', Value: selectedLoan.name },
//       { Field: 'Status', Value: getLoanStatus(selectedLoan) },
//       { Field: 'Lender', Value: companyNameById(selectedLoan.lenderCompanyId) },
//       { Field: 'Borrower', Value: companyNameById(selectedLoan.borrowerCompanyId) },
//       { Field: 'Agreement Date', Value: formatDate(selectedLoan.agreementDate) },
//       { Field: 'Currency', Value: selectedLoan.currency },
//       { Field: 'Annual Interest Rate %', Value: selectedLoan.annualInterestRate },
//       { Field: 'Days in Year', Value: selectedLoan.daysInYear },
//       { Field: 'Account Number', Value: selectedLoan.bankAccountNumber },
//       { Field: 'Account Name', Value: selectedLoan.bankAccountName },
//       { Field: 'Bank Account Currency', Value: selectedLoan.bankAccountCurrency },
//       { Field: 'Account Type / Status', Value: selectedLoan.bankAccountTypeStatus },
//       { Field: 'IBAN', Value: selectedLoan.bankIban },
//       { Field: 'Bank Identifier', Value: selectedLoan.bankIdentifier },
//       { Field: 'Bank Name', Value: selectedLoan.bankName },
//       { Field: 'Bank Address', Value: selectedLoan.bankAddress },
//     ]

//     const scheduleSheetRows = scheduleRows.map((row) => ({
//       'Start Date': formatDate(row.startDate),
//       'End Date': formatDate(row.endDate),
//       Days: row.days,
//       'Draw Down': row.drawDown,
//       Repayment: row.repayment,
//       Principal: row.principal,
//       'Cumulative Principal': row.cumulativePrincipal,
//       Interest: row.interest,
//       'Cumulative Interest': row.cumulativeInterest,
//       Total: row.total,
//       Fees: row.fees,
//       'Bank Transaction Date': row.bankTransactionDate ? formatDate(row.bankTransactionDate) : '',
//       'Bank Transaction Detail': row.transactionDetail,
//       'Bank Ledger Balance': row.bankLedgerBalance,
//     }))

//     const historyRows = selectedLoan.history.map((entry) => ({
//       Timestamp: new Date(entry.timestamp).toLocaleString('en-GB'),
//       User: entry.userName,
//       Action: entry.action,
//       Details: entry.details,
//     }))

//     const workbook = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(
//       workbook,
//       XLSX.utils.json_to_sheet(detailsRows),
//       'Loan Details',
//     )
//     XLSX.utils.book_append_sheet(
//       workbook,
//       XLSX.utils.json_to_sheet(scheduleSheetRows),
//       'Schedule',
//     )
//     XLSX.utils.book_append_sheet(
//       workbook,
//       XLSX.utils.json_to_sheet(historyRows),
//       'History',
//     )

//     XLSX.writeFile(workbook, toExportFileName(selectedLoan.name, 'xlsx'))
//   }

//   const exportSelectedLoanToPdf = () => {
//     if (!selectedLoan) {
//       setErrorMessage('Select a loan facility to export')
//       return
//     }

//     setErrorMessage(null)

//     const scheduleRows = calculateSchedule(
//       selectedLoan.schedule,
//       selectedLoan.annualInterestRate,
//       selectedLoan.daysInYear,
//     )

//     const doc = new jsPDF({ orientation: 'landscape' })
//     const reportDate = new Date().toLocaleDateString('en-GB')
//     const pageWidth = doc.internal.pageSize.getWidth()
//     doc.setFontSize(14)
//     doc.text(`Loan Facility: ${selectedLoan.name}`, 14, 14)
//     doc.setFontSize(10)
//     doc.text(`Date: ${reportDate}`, pageWidth - 14, 14, { align: 'right' })

//     autoTable(doc, {
//       startY: 20,
//       body: [
//         ['Status', getLoanStatus(selectedLoan)],
//         ['Lender', companyNameById(selectedLoan.lenderCompanyId)],
//         ['Borrower', companyNameById(selectedLoan.borrowerCompanyId)],
//         ['Agreement Date', formatDate(selectedLoan.agreementDate)],
//         ['Currency', selectedLoan.currency],
//         ['Annual Interest Rate %', String(selectedLoan.annualInterestRate)],
//         ['Days in Year', String(selectedLoan.daysInYear)],
//         ['Account Number', selectedLoan.bankAccountNumber],
//         ['Account Name', selectedLoan.bankAccountName],
//         ['Bank Account Currency', selectedLoan.bankAccountCurrency],
//         ['Account Type / Status', selectedLoan.bankAccountTypeStatus],
//         ['IBAN', selectedLoan.bankIban],
//         ['Bank Identifier', selectedLoan.bankIdentifier],
//         ['Bank Name', selectedLoan.bankName],
//         ['Bank Address', selectedLoan.bankAddress],
//       ],
//       theme: 'grid',
//       showHead: 'never',
//       styles: { fontSize: 9 },
//     })

//     doc.addPage('a4', 'landscape')
//     doc.setFontSize(12)
//     doc.text('Schedule', 14, 14)

//     autoTable(doc, {
//       startY: 20,
//       head: [[
//         'Start Date',
//         'End Date',
//         'Days',
//         'Draw Down',
//         'Repayment',
//         'Principal',
//         'Cumulative Principal',
//         'Interest',
//         'Cumulative Interest',
//         'Total',
//         'Fees',
//         'Bank Transaction Date',
//         'Bank Transaction Detail',
//         'Bank Ledger Balance',
//       ]],
//       body: scheduleRows.map((row) => [
//         formatDate(row.startDate),
//         formatDate(row.endDate),
//         formatCurrencyInteger(row.days),
//         formatCurrency(row.drawDown),
//         formatCurrency(row.repayment),
//         formatCurrency(row.principal),
//         formatCurrency(row.cumulativePrincipal),
//         formatCurrency(row.interest),
//         formatCurrency(row.cumulativeInterest),
//         formatCurrency(row.total),
//         formatCurrency(row.fees),
//         row.bankTransactionDate ? formatDate(row.bankTransactionDate) : '',
//         row.transactionDetail,
//         formatCurrency(row.bankLedgerBalance),
//       ]),
//       theme: 'grid',
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [216, 243, 220], textColor: [27, 67, 50] },
//     })

//     doc.addPage('a4', 'landscape')
//     doc.setFontSize(12)
//     doc.text('Change History', 14, 14)
//     autoTable(doc, {
//       startY: 20,
//       head: [['Timestamp', 'User', 'Action', 'Details']],
//       body: selectedLoan.history.map((entry) => [
//         new Date(entry.timestamp).toLocaleString('en-GB'),
//         entry.userName,
//         entry.action,
//         entry.details,
//       ]),
//       theme: 'grid',
//       styles: { fontSize: 9 },
//       headStyles: { fillColor: [248, 215, 218], textColor: [132, 32, 41] },
//     })

//     const totalPages = doc.getNumberOfPages()
//     for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
//       doc.setPage(pageNumber)
//       const pageWidthWithFooter = doc.internal.pageSize.getWidth()
//       const pageHeightWithFooter = doc.internal.pageSize.getHeight()
//       doc.setFontSize(9)
//       doc.text(
//         `Page ${pageNumber} of ${totalPages}`,
//         pageWidthWithFooter - 14,
//         pageHeightWithFooter - 8,
//         { align: 'right' },
//       )
//     }

//     doc.save(toExportFileName(selectedLoan.name, 'pdf'))
//   }

//   return (
//     <main className="app-shell">
//       <header className="header-row">
//         <div className="title-box">
//           <img src={logoTagline} alt="NatPower logo" className="app-logo app-logo-tagline" />
//           <img src={logoN} alt="NatPower N logo" className="app-logo app-logo-n" />
//           <h1>Loans and Transfers</h1>
//         </div>
//         <div className="auth-box">
//           {!currentUser ? (
//             <>
//               <input
//                 type="email"
//                 aria-label="Email address for sign in"
//                 placeholder="name@natpower.com"
//                 value={loginEmail}
//                 list="approved-user-emails"
//                 onChange={(event) => setLoginEmail(event.target.value)}
//               />
//               <datalist id="approved-user-emails">
//                 {users.map((user) => (
//                   <option key={user.id} value={user.email} />
//                 ))}
//               </datalist>
//               <NeutralButton
//                 type="button"
//                 onClick={async () => {
//                   setErrorMessage(null)
//                   try {
//                     const user = await mockApi.authenticateUserByEmail(loginEmail)
//                     setCurrentUser(user)
//                   } catch (error) {
//                     setErrorMessage(
//                       error instanceof Error ? error.message : 'Sign in failed',
//                     )
//                   }
//                 }}
//               >
//                 Microsoft Sign In (Mock)
//               </NeutralButton>
//               <DeleteButton type="button" disabled={!currentUser || !canEdit} onClick={resetMockData}>
//                 Reset Mock Data
//               </DeleteButton>
//             </>
//           ) : (
//             <>
//               <span>
//                 {currentUser.name} ({currentUser.email}) - {currentAccessUser?.role ?? 'Viewer'}
//               </span>
//               <NeutralButton type="button" onClick={() => setCurrentUser(null)}>
//                 Sign Out
//               </NeutralButton>
//               <DeleteButton type="button" disabled={!canEdit} onClick={resetMockData}>
//                 Reset Mock Data
//               </DeleteButton>
//             </>
//           )}

//           <NeutralButton
//             type="button"
//             aria-label="Toggle theme"
//             onClick={() => setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))}
//           >
//             {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
//           </NeutralButton>
//         </div>
//       </header>

//       <nav className="tab-row">
//         <NeutralButton
//           type="button"
//           className={activePage === 'loan' ? 'active' : ''}
//           onClick={() => setActivePage('loan')}
//         >
//           Loan Facility
//         </NeutralButton>

//         <div className="tab-spacer" />

//         <NeutralButton
//           type="button"
//           className={activePage === 'admin' ? 'active' : ''}
//           onClick={() => setActivePage('admin')}
//         >
//           Admin
//         </NeutralButton>
//       </nav>

//       {errorMessage && <p className="error-message">{errorMessage}</p>}

//       {activePage === 'admin' ? (
//         <section className="panel">
//           <h2>Companies</h2>
//           <SectionActionRow>
//             <NewSaveButton type="button" disabled={!canEdit} onClick={openNewCompanyModal}>
//               Add Company
//             </NewSaveButton>
//           </SectionActionRow>

//           {isCompanyModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="Company dialog">
//                 <ModalHeader>
//                   <h3>{editingCompanyId ? 'Edit Company' : 'Add Company'}</h3>
//                 </ModalHeader>
//                 <form className="form-grid" onSubmit={submitCompany}>
//                   <label>
//                     Name
//                     <input
//                       value={companyForm.name}
//                       onChange={(event) =>
//                         setCompanyForm((previous) => ({ ...previous, name: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Code
//                     <input
//                       value={companyForm.code}
//                       onChange={(event) =>
//                         setCompanyForm((previous) => ({ ...previous, code: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <div className="button-row">
//                     <NewSaveButton type="submit">Save</NewSaveButton>
//                     <NeutralButton
//                       type="button"
//                       onClick={() => {
//                         setIsCompanyModalOpen(false)
//                         setEditingCompanyId(null)
//                         setCompanyForm(emptyCompanyForm)
//                       }}
//                     >
//                       Cancel
//                     </NeutralButton>
//                   </div>
//                 </form>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//           <table>
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Code</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {companies.map((company) => (
//                 <tr key={company.id}>
//                   <td>{company.name}</td>
//                   <td>{company.code}</td>
//                   <td>
//                     <EditButton type="button" disabled={!canEdit} onClick={() => openEditCompanyModal(company)}>
//                       Edit
//                     </EditButton>{' '}
//                     <DeleteButton
//                       type="button"
//                       disabled={!canEdit}
//                       onClick={() =>
//                         setDeleteTarget({
//                           kind: 'company',
//                           id: company.id,
//                           label: company.name,
//                         })
//                       }
//                     >
//                       Delete
//                     </DeleteButton>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <h2 className="section-heading">User List</h2>
//           <SectionActionRow>
//             <NewSaveButton type="button" disabled={!canEdit} onClick={openNewUserModal}>
//               Add User
//             </NewSaveButton>
//           </SectionActionRow>

//           {isUserModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="User dialog">
//                 <ModalHeader>
//                   <h3>{editingUserId ? 'Edit User' : 'Add User'}</h3>
//                 </ModalHeader>
//                 <form className="form-grid" onSubmit={submitUser}>
//                   <label>
//                     First Name
//                     <input
//                       value={userForm.firstName}
//                       onChange={(event) =>
//                         setUserForm((previous) => ({ ...previous, firstName: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Last Name
//                     <input
//                       value={userForm.lastName}
//                       onChange={(event) =>
//                         setUserForm((previous) => ({ ...previous, lastName: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Email Address
//                     <input
//                       type="email"
//                       value={userForm.email}
//                       onChange={(event) =>
//                         setUserForm((previous) => ({ ...previous, email: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Role
//                     <select
//                       value={userForm.role}
//                       onChange={(event) =>
//                         setUserForm((previous) => ({
//                           ...previous,
//                           role: event.target.value as UserRole,
//                         }))
//                       }
//                     >
//                       <option value="Editor">Editor</option>
//                       <option value="Viewer">Viewer</option>
//                     </select>
//                   </label>
//                   <div className="button-row">
//                     <NewSaveButton type="submit">Save</NewSaveButton>
//                     <NeutralButton
//                       type="button"
//                       onClick={() => {
//                         setIsUserModalOpen(false)
//                         setEditingUserId(null)
//                         setUserForm(emptyUserForm)
//                       }}
//                     >
//                       Cancel
//                     </NeutralButton>
//                   </div>
//                 </form>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//           <table>
//             <thead>
//               <tr>
//                 <th>First Name</th>
//                 <th>Last Name</th>
//                 <th>Email Address</th>
//                 <th>Role</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map((user) => (
//                 <tr key={user.id}>
//                   <td>{user.firstName}</td>
//                   <td>{user.lastName}</td>
//                   <td>{user.email}</td>
//                   <td>{user.role}</td>
//                   <td>
//                     <EditButton type="button" disabled={!canEdit} onClick={() => openEditUserModal(user)}>
//                       Edit
//                     </EditButton>{' '}
//                     <DeleteButton
//                       type="button"
//                       disabled={!canEdit}
//                       onClick={() =>
//                         setDeleteTarget({
//                           kind: 'user',
//                           id: user.id,
//                           label: `${user.firstName} ${user.lastName}`.trim(),
//                         })
//                       }
//                     >
//                       Delete
//                     </DeleteButton>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </section>
//       ) : (
//         <section className="panel">
//           <div className="panel-title-row">
//             <h2>Loan Facility</h2>
//             <div className="button-row">
//               <IconButton
//                 type="button"
//                 title="Change History"
//                 aria-label="Open change history"
//                 disabled={!selectedLoan}
//                 onClick={() => setIsHistoryModalOpen(true)}
//               >
//                 🕘
//               </IconButton>
//               <NewSaveButton
//                 type="button"
//                 disabled={!selectedLoan}
//                 onClick={exportSelectedLoanToExcel}
//               >
//                 Export Excel
//               </NewSaveButton>
//               <EditButton type="button" disabled={!selectedLoan} onClick={exportSelectedLoanToPdf}>
//                 Export PDF
//               </EditButton>
//             </div>
//           </div>

//           <div className="select-row">
//             <label className="loan-selector-label">
//               <span className="loan-selector-text">Select Loan Facility</span>
//               <select
//                 value={selectedLoanId}
//                 onChange={(event) => {
//                   setSelectedLoanId(event.target.value)
//                   setIsCreatingLoan(false)
//                 }}
//               >
//                 {visibleLoans.map((loan) => (
//                   <option key={loan.id} value={loan.id}>
//                     {loan.name}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             <label className="active-only-toggle">
//               <input
//                 type="checkbox"
//                 checked={showActiveOnly}
//                 onChange={(event) => setShowActiveOnly(event.target.checked)}
//               />
//               <span>Only Active</span>
//             </label>
//             <NewSaveButton type="button" disabled={!canEdit} onClick={openNewLoanModal}>
//               New
//             </NewSaveButton>
//             <EditButton type="button" disabled={!selectedLoanId || !canEdit} onClick={openEditLoanModal}>
//               Edit
//             </EditButton>
//             <DeleteButton
//               type="button"
//               disabled={!selectedLoanId || !selectedLoan || !canEdit}
//               onClick={() => {
//                 if (!selectedLoan) {
//                   return
//                 }

//                 setDeleteTarget({ kind: 'loan', id: selectedLoan.id, label: selectedLoan.name })
//               }}
//             >
//               Delete
//             </DeleteButton>
//           </div>

//           <section className="readonly-section" aria-label="Selected loan facility details">
//             <div className="facility-name-row">
//               <span className="readonly-label">Facility Name</span>
//               <span className="facility-name-value">{selectedLoan?.name ?? '-'}</span>
//             </div>
//             <div className="readonly-two-column">
//               <div className="readonly-block">
//                 <h4 className="readonly-block-title">Loan Details</h4>
//                 <div className="readonly-grid">
//                   <div className="readonly-item">
//                     <span className="readonly-label">Status</span>
//                     <span className="readonly-value">
//                       {selectedLoan ? getLoanStatus(selectedLoan) : '-'}
//                     </span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Lender</span>
//                     <span className="readonly-value">
//                       {selectedLoan ? companyNameById(selectedLoan.lenderCompanyId) : '-'}
//                     </span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Borrower</span>
//                     <span className="readonly-value">
//                       {selectedLoan ? companyNameById(selectedLoan.borrowerCompanyId) : '-'}
//                     </span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Agreement Date</span>
//                     <span className="readonly-value">
//                       {selectedLoan ? formatDate(selectedLoan.agreementDate) : '-'}
//                     </span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Currency</span>
//                     <span className="readonly-value">{selectedLoan?.currency ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Annual Interest Rate %</span>
//                     <span className="readonly-value">
//                       {selectedLoan ? selectedLoan.annualInterestRate : '-'}
//                     </span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Days in Year</span>
//                     <span className="readonly-value">{selectedLoan?.daysInYear ?? '-'}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="readonly-block">
//                 <h4 className="readonly-block-title">Bank Account Details</h4>
//                 <div className="readonly-grid">
//                   <div className="readonly-item">
//                     <span className="readonly-label">Account Number</span>
//                     <span className="readonly-value">{selectedLoan?.bankAccountNumber ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Account Name</span>
//                     <span className="readonly-value">{selectedLoan?.bankAccountName ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Bank Account Currency</span>
//                     <span className="readonly-value">{selectedLoan?.bankAccountCurrency ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Account Type / Status</span>
//                     <span className="readonly-value">{selectedLoan?.bankAccountTypeStatus ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">IBAN</span>
//                     <span className="readonly-value">{selectedLoan?.bankIban ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Bank Identifier</span>
//                     <span className="readonly-value">{selectedLoan?.bankIdentifier ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Bank Name</span>
//                     <span className="readonly-value">{selectedLoan?.bankName ?? '-'}</span>
//                   </div>
//                   <div className="readonly-item">
//                     <span className="readonly-label">Bank Address</span>
//                     <span className="readonly-value">{selectedLoan?.bankAddress ?? '-'}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           <h3>Draw Down Schedule</h3>
//           <SectionActionRow>
//             <NewSaveButton type="button" disabled={!canEdit} onClick={openNewScheduleModal}>
//               Add Row
//             </NewSaveButton>
//             <NeutralButton type="button" disabled={!canEdit} onClick={openImportScheduleModal}>
//               Import Schedule
//             </NeutralButton>
//           </SectionActionRow>

//           {isImportScheduleModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="Import schedule dialog">
//                 <ModalHeader>
//                   <h3>Import Draw Down Schedule</h3>
//                   <NeutralButton
//                     type="button"
//                     onClick={() => {
//                       setIsImportScheduleModalOpen(false)
//                       setImportScheduleFile(null)
//                     }}
//                   >
//                     Close
//                   </NeutralButton>
//                 </ModalHeader>
//                 <form className="form-grid" onSubmit={importSchedule}>
//                   <div className="button-row">
//                     <NeutralButton type="button" onClick={downloadImportTemplate}>
//                       Download Template
//                     </NeutralButton>
//                   </div>
//                   <label>
//                     File (.xlsx, .xls, .csv)
//                     <input
//                       type="file"
//                       accept=".xlsx,.xls,.csv"
//                       onChange={(event) =>
//                         setImportScheduleFile(event.target.files?.[0] ?? null)
//                       }
//                     />
//                   </label>
//                   <label>
//                     Import Mode
//                     <ImportModeSelect
//                       value={importScheduleMode}
//                       onChange={(event) =>
//                         setImportScheduleMode(event.target.value as 'overwrite' | 'extend')
//                       }
//                     >
//                       <option value="extend">Extend existing schedule</option>
//                       <option value="overwrite">Overwrite existing schedule</option>
//                     </ImportModeSelect>
//                   </label>
//                   <div className="button-row">
//                     <NewSaveButton type="submit">Import</NewSaveButton>
//                     <NeutralButton
//                       type="button"
//                       onClick={() => {
//                         setIsImportScheduleModalOpen(false)
//                         setImportScheduleFile(null)
//                       }}
//                     >
//                       Cancel
//                     </NeutralButton>
//                   </div>
//                 </form>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//           {isLoanModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="Loan facility dialog">
//                 <ModalHeader>
//                   <h3>{selectedLoanId ? 'Edit Loan Facility' : 'Add Loan Facility'}</h3>
//                 </ModalHeader>
//                 <form className="form-grid two-column-form" onSubmit={saveLoan}>
//                   <label>
//                     Facility Name
//                     <input
//                       value={loanForm.name}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({ ...previous, name: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Status
//                     <select
//                       value={loanForm.status}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           status: event.target.value as LoanFacility['status'],
//                         }))
//                       }
//                     >
//                       <option value="Active">Active</option>
//                       <option value="Closed">Closed</option>
//                       <option value="Archived">Archived</option>
//                     </select>
//                   </label>
//                   <label>
//                     Lender
//                     <select
//                       value={loanForm.lenderCompanyId}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           lenderCompanyId: event.target.value,
//                         }))
//                       }
//                     >
//                       <option value="">Select lender</option>
//                       {companies.map((company) => (
//                         <option key={company.id} value={company.id}>
//                           {company.name}
//                         </option>
//                       ))}
//                     </select>
//                   </label>
//                   <label>
//                     Borrower
//                     <select
//                       value={loanForm.borrowerCompanyId}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           borrowerCompanyId: event.target.value,
//                         }))
//                       }
//                     >
//                       <option value="">Select borrower</option>
//                       {companies.map((company) => (
//                         <option key={company.id} value={company.id}>
//                           {company.name}
//                         </option>
//                       ))}
//                     </select>
//                   </label>
//                   <label>
//                     Agreement Date
//                     <input
//                       type="date"
//                       value={loanForm.agreementDate}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           agreementDate: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Currency
//                     <select
//                       value={loanForm.currency}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           currency: event.target.value as LoanFacility['currency'],
//                         }))
//                       }
//                     >
//                       <option value="GBP">GBP</option>
//                       <option value="EUR">EUR</option>
//                       <option value="USD">USD</option>
//                       <option value="YEN">YEN</option>
//                     </select>
//                   </label>
//                   <label>
//                     Account Number
//                     <input
//                       value={loanForm.bankAccountNumber}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankAccountNumber: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Account Name
//                     <input
//                       value={loanForm.bankAccountName}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankAccountName: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Account Currency
//                     <select
//                       value={loanForm.bankAccountCurrency}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankAccountCurrency: event.target.value as LoanFacility['currency'],
//                         }))
//                       }
//                     >
//                       <option value="GBP">GBP</option>
//                       <option value="EUR">EUR</option>
//                       <option value="USD">USD</option>
//                       <option value="YEN">YEN</option>
//                     </select>
//                   </label>
//                   <label>
//                     Account Type / Status
//                     <input
//                       value={loanForm.bankAccountTypeStatus}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankAccountTypeStatus: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     IBAN
//                     <input
//                       value={loanForm.bankIban}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankIban: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Identifier
//                     <input
//                       value={loanForm.bankIdentifier}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankIdentifier: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Name
//                     <input
//                       value={loanForm.bankName}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankName: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Address
//                     <input
//                       value={loanForm.bankAddress}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           bankAddress: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Annual Interest Rate %
//                     <input
//                       type="number"
//                       min={0}
//                       step="0.01"
//                       value={loanForm.annualInterestRate}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           annualInterestRate: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Days in Year
//                     <input
//                       type="number"
//                       min={1}
//                       step="1"
//                       value={loanForm.daysInYear}
//                       onChange={(event) =>
//                         setLoanForm((previous) => ({
//                           ...previous,
//                           daysInYear: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <div className="button-row">
//                     <NewSaveButton type="submit">Save</NewSaveButton>
//                     <NeutralButton
//                       type="button"
//                       onClick={() => {
//                         setIsLoanModalOpen(false)
//                         setIsCreatingLoan(false)
//                         setLoanForm(emptyLoanForm)
//                       }}
//                     >
//                       Cancel
//                     </NeutralButton>
//                   </div>
//                 </form>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//           <div className="table-scroll">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Index</th>
//                   <th>Start Date</th>
//                   <th>End Date</th>
//                   <th>Days</th>
//                   <th>Draw Down</th>
//                   <th>Repayment</th>
//                   <th>Principal</th>
//                   <th>Cumulative Principal</th>
//                   <th>Interest</th>
//                   <th>Cumulative Interest</th>
//                   <th>Total</th>
//                   <th>Fees</th>
//                   <th>Bank Transaction Date</th>
//                   <th>Bank Transaction Detail</th>
//                   <th>Bank Ledger Balance</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {calculatedRows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.scheduleIndex}</td>
//                     <td>{formatDate(row.startDate)}</td>
//                     <td>{formatDate(row.endDate)}</td>
//                     <td>{formatCurrencyInteger(row.days)}</td>
//                     <td>{formatCurrency(row.drawDown)}</td>
//                     <td>{formatCurrency(row.repayment)}</td>
//                     <td>{formatCurrency(row.principal)}</td>
//                     <td>{formatCurrency(row.cumulativePrincipal)}</td>
//                     <td>{formatCurrency(row.interest)}</td>
//                     <td>{formatCurrency(row.cumulativeInterest)}</td>
//                     <td>{formatCurrency(row.total)}</td>
//                     <td>{formatCurrency(row.fees)}</td>
//                     <td>{row.bankTransactionDate ? formatDate(row.bankTransactionDate) : '-'}</td>
//                     <td>{row.transactionDetail || '-'}</td>
//                     <td>{formatCurrency(row.bankLedgerBalance)}</td>
//                     <td>
//                       <EditButton type="button" disabled={!canEdit} onClick={() => editSchedule(row)}>
//                         Edit
//                       </EditButton>{' '}
//                       <DeleteButton
//                         type="button"
//                         disabled={!canEdit}
//                         onClick={() =>
//                           setDeleteTarget({
//                             kind: 'schedule',
//                             id: row.id,
//                             label: `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
//                           })
//                         }
//                       >
//                         Delete
//                       </DeleteButton>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {isScheduleModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="Schedule row dialog">
//                 <ModalHeader>
//                   <h3>{scheduleForm.id ? 'Edit Schedule Row' : 'Add Schedule Row'}</h3>
//                 </ModalHeader>
//                 <form className="form-grid two-column-form" onSubmit={saveSchedule}>
//                   <label>
//                     Start Date
//                     <input
//                       type="date"
//                       value={scheduleForm.startDate}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({ ...previous, startDate: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     End Date
//                     <input
//                       type="date"
//                       value={scheduleForm.endDate}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({ ...previous, endDate: event.target.value }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Transaction Date
//                     <input
//                       type="date"
//                       value={scheduleForm.bankTransactionDate}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           bankTransactionDate: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Transaction Detail
//                     <input
//                       value={scheduleForm.transactionDetail}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           transactionDetail: event.target.value,
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Bank Ledger Balance
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={scheduleForm.bankLedgerBalance}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           bankLedgerBalance: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Draw Down
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={scheduleForm.drawDown}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           drawDown: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Repayment
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={scheduleForm.repayment}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           repayment: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <label>
//                     Fees
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={scheduleForm.fees}
//                       onChange={(event) =>
//                         setScheduleForm((previous) => ({
//                           ...previous,
//                           fees: Number(event.target.value),
//                         }))
//                       }
//                     />
//                   </label>
//                   <div className="button-row">
//                     {scheduleForm.id ? (
//                       <EditButton type="submit">Update Row</EditButton>
//                     ) : (
//                       <NewSaveButton type="submit">Add Row</NewSaveButton>
//                     )}
//                     <NeutralButton
//                       type="button"
//                       onClick={() => {
//                         setIsScheduleModalOpen(false)
//                         setScheduleForm(emptyScheduleForm)
//                       }}
//                     >
//                       Cancel
//                     </NeutralButton>
//                   </div>
//                 </form>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//           {selectedLoan && isHistoryModalOpen && (
//             <ModalBackdrop>
//               <ModalCard role="dialog" aria-modal="true" aria-label="Change history dialog">
//                 <ModalHeader>
//                   <h3>Change History</h3>
//                   <NeutralButton type="button" onClick={() => setIsHistoryModalOpen(false)}>
//                     Close
//                   </NeutralButton>
//                 </ModalHeader>
//                 <div className="history-modal-scroll" aria-label="Change history list slider">
//                   <table>
//                     <thead>
//                       <tr>
//                         <th>Timestamp</th>
//                         <th>User</th>
//                         <th>Action</th>
//                         <th>Details</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {selectedLoan.history.map((entry) => (
//                         <tr key={entry.id}>
//                           <td>{new Date(entry.timestamp).toLocaleString('en-GB')}</td>
//                           <td>{entry.userName}</td>
//                           <td>{entry.action}</td>
//                           <td>{entry.details}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </ModalCard>
//             </ModalBackdrop>
//           )}

//         </section>
//       )}

//       {deleteTarget && (
//         <ModalBackdrop>
//           <ModalCard role="dialog" aria-modal="true" aria-label="Confirm delete">
//             <ModalHeader>
//               <h3>Confirm Delete</h3>
//             </ModalHeader>
//             <p className="confirm-message">
//               {deleteTarget.kind === 'company' &&
//                 `Are you sure you want to delete company "${deleteTarget.label}"?`}
//               {deleteTarget.kind === 'loan' &&
//                 `Are you sure you want to delete loan facility "${deleteTarget.label}"?`}
//               {deleteTarget.kind === 'schedule' &&
//                 `Are you sure you want to delete schedule row "${deleteTarget.label}"?`}
//               {deleteTarget.kind === 'user' &&
//                 `Are you sure you want to delete user "${deleteTarget.label}"?`}
//             </p>
//             <div className="button-row">
//               <DeleteButton type="button" onClick={confirmDelete}>
//                 Delete
//               </DeleteButton>
//               <NeutralButton type="button" onClick={() => setDeleteTarget(null)}>
//                 Cancel
//               </NeutralButton>
//             </div>
//           </ModalCard>
//         </ModalBackdrop>
//       )}
//     </main>
//   )
// }

// export default App


import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./lib/authProvider";
import { AppRoutes } from "./routes/AppRoutes";



function App() {
  const { token, refreshAuthToken, setToken, setRefreshToken } = useAuth();
  useEffect(() => {
    const checkLoginExpiry = () => {
      const loginTimeStr = localStorage.getItem("poLoginTime");
      if (!loginTimeStr) return;
  
      const loginTime = parseInt(loginTimeStr, 10);
      const now = Date.now();
      const eightHours = 8 * 60 * 60 * 1000;
  
      if (now - loginTime > eightHours) {
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem("poLoginTime");
        window.location.href = "/auth";
      }
    };
  
    checkLoginExpiry();
  
    const interval = setInterval(() => {
      checkLoginExpiry();
    }, 60 * 1000);
  
    return () => clearInterval(interval);
  }, [setToken, setRefreshToken]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (token) {
      interval = setInterval(async () => {
        const success = await refreshAuthToken();
        if (!success) {
          setToken(null);
          setRefreshToken(null);
        }
      }, 480 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [token, refreshAuthToken, setToken, setRefreshToken]);

  return (
    <BrowserRouter>
      <AppRoutes token={token} />
    </BrowserRouter>
  );
}

export default App;
