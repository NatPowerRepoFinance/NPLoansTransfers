import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ITooltipParams } from "ag-grid-community";
import { Bounce, toast, ToastContainer } from "react-toastify";
import dummyData from "@/lib/api/dummyRisks.json";
import {
  CompanyHistoryEntry,
  LoanFacility,
  LoanHistoryEntry,
  UserHistoryEntry,
} from "../../utils/constants";
import { CompanyHistoryAuditBlock } from "@/components/CompanyHistoryAuditBlock";
import { UserHistoryAuditBlock } from "@/components/UserHistoryAuditBlock";
import {
  TrashIcon,
  MoonIcon,
  SunIcon,
  PlusIcon,
  PencilIcon,
  ClockIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import useConfirmDialog from "@/components/confirmDialog";
import * as XLSX from "xlsx";
import type { ColDef } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { mockApi } from '../../services/mockApi';
import type { MockUser } from '../../types';
import LoanFacilityTab from "./LoanFacility";
import ReportTab from "./Report";
import {
  createCountry,
  createCompany,
  getCompaniesHistory,
  createLoanFacility,
  createLoanFacilityScheduleRow,
  createUser,
  deleteCompany,
  deleteCountry,
  deleteUser,
  getCompanies,
  getCountries,
  importLoanFacilitySchedule,
  getLoanFacilities,
  getLoanFacilityHistory,
  getLoanFacilitySchedule,
  updateLoanFacilityScheduleRow,
  deleteLoanFacilityScheduleRow,
  getUsers,
  getUsersHistory,
  updateCountry,
  updateCompany,
  updateLoanFacility,
  updateUser,
} from "@/api";


export interface Company {
  id: string;
  name: string;
  sapCode: string;
  type: string;
  country: string;
  bankAccounts: string;
  bankAccountDetails?: Array<{
    id: number;
    accountName: string;
    rowIndex: number;
  }>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
}

export interface Country {
  id: number;
  name: string;
  countryCode: string;
}

const LOAN_FACILITY_SELECTION_STORAGE_PREFIX = "poSelectedLoanFacility";

function loanFacilitySelectionStorageKey(): string {
  const userKey =
    localStorage.getItem("user_email")?.trim() ||
    localStorage.getItem("id")?.trim() ||
    "";
  return userKey
    ? `${LOAN_FACILITY_SELECTION_STORAGE_PREFIX}:${userKey}`
    : LOAN_FACILITY_SELECTION_STORAGE_PREFIX;
}

type StoredLoanFacilitySelection = { id: string; label: string };

function readStoredLoanFacilitySelection(): StoredLoanFacilitySelection | null {
  try {
    const raw = localStorage.getItem(loanFacilitySelectionStorageKey());
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { id?: unknown; label?: unknown };
    const id = parsed?.id != null ? String(parsed.id).trim() : "";
    if (!id) {
      return null;
    }
    const label = parsed?.label != null ? String(parsed.label) : "";
    return { id, label };
  } catch {
    return null;
  }
}

function writeStoredLoanFacilitySelection(id: string, label: string) {
  localStorage.setItem(
    loanFacilitySelectionStorageKey(),
    JSON.stringify({ id, label }),
  );
}

function clearStoredLoanFacilitySelection() {
  localStorage.removeItem(loanFacilitySelectionStorageKey());
}

export const toolTipValueGetter = (params: ITooltipParams) =>
  params.value == null || params.value === "" ? "- Missing -" : params.value;

function companyNameFromMockCompanyHistory(details: string): string {
  const nameEq = details.match(/Name=([^|]+)/);
  if (nameEq) {
    return nameEq[1].trim();
  }
  const added = details.match(/^Added company (.+)$/);
  if (added) {
    return added[1].trim();
  }
  const upd = details.match(/Name:\s*Before=([^|]+)/);
  if (upd) {
    return upd[1].trim();
  }
  return "Company";
}

function mockCompanyHistoryAction(action: string): CompanyHistoryEntry["action"] {
  const a = action.toUpperCase();
  if (a.includes("CREATE") || a === "ADD") {
    return "ADD";
  }
  if (a.includes("UPDATE") || a === "EDIT") {
    return "EDIT";
  }
  if (a.includes("DELETE")) {
    return "DELETE";
  }
  return "IMPORT";
}

function userLabelFromMockUserHistory(details: string): string {
  const fn = details.match(/First Name=([^|]+)/);
  const ln = details.match(/Last Name=([^|]+)/);
  const em = details.match(/Email=([^|]+)/);
  const name = [fn?.[1]?.trim(), ln?.[1]?.trim()].filter(Boolean).join(" ").trim();
  if (name) {
    return name;
  }
  if (em?.[1]) {
    return em[1].trim();
  }
  if (details.startsWith("Imported")) {
    return "Bulk import";
  }
  return "User";
}

function mockUserHistoryAction(action: string): UserHistoryEntry["action"] {
  const a = action.toUpperCase();
  if (a.includes("CREATE") || a === "ADD") {
    return "ADD";
  }
  if (a.includes("UPDATE") || a === "EDIT") {
    return "EDIT";
  }
  if (a.includes("DELETE")) {
    return "DELETE";
  }
  return "IMPORT";
}

// const rowSelection: RowSelectionOptions = {
//     mode: "multiRow",
//     headerCheckbox: true,
// };

export const useDummyFetchJson = <T,>(url: string, limit?: number) => {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Note error handling is omitted here for brevity
      // const response = await fetch(url);
      // const json = await response.json();
      const json = await new Promise<T[]>((resolve) =>
        setTimeout(() => resolve(dummyData as T[]), 1000)
      );
      const data = limit ? json.slice(0, limit) : json;
      setData(data);
      setLoading(false);
    };
    fetchData();
  }, [url, limit]);
  return { data, loading };
};

export default function Home() {
  // const role = getUserRole() || "User";
  // const accessibleStatuses = roleStatusAccess[role] || [];
  const gisAppURL =
    import.meta.env.GIS_APP_URL || "https://natview.azurewebsites.net";

  const emptyLoanForm = {
      facilityName: '',
      status: 'Active' as LoanFacility['status'],
      lenderCompanyId: '',
      borrowerCompanyId: '',
      agreementDate: '',
      currency: 'EUR' as LoanFacility['currency'],
      annualInterestRate: 0,
      daysInYear: 365,
  };
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('')
  const [loans, setLoans] = useState<LoanFacility[]>([])
  const initialLoanSelectionRestoreRef = useRef(false);
  const loanSelectionStorageKeyRef = useRef<string>("");

  const [erpIframe, setErpIframe] = useState(false);
  const [sidebarCollapsed, setSideBarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme-mode");
    return stored ? stored === "dark" : true; // Default to dark mode
  });
  const [showOnlyActiveLoanFacilities, setShowOnlyActiveLoanFacilities] = useState(false);
  const [showLoanFacilityModal, setShowLoanFacilityModal] = useState(false);
  const [loanForm, setLoanForm] = useState(emptyLoanForm);
  const [activeTab, setActiveTab] = useState<"loan-facility" | "report" | "admin">("loan-facility");
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      name: "Natpower Holdings Ltd",
      sapCode: "SAP001",
      type: "Holding",
      country: "United Kingdom",
      bankAccounts: "GB12NATP000123456789",
      bankAccountDetails: [{ id: 0, accountName: "GB12NATP000123456789", rowIndex: 1 }],
    },
    {
      id: "2",
      name: "Natpower Trading Solutions",
      sapCode: "SAP002",
      type: "Subsidiary",
      country: "India",
      bankAccounts: "IN55NATP000987654321",
      bankAccountDetails: [{ id: 0, accountName: "IN55NATP000987654321", rowIndex: 1 }],
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const companyImportInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportCompanyModalOpen, setIsImportCompanyModalOpen] = useState(false);
  const [importCompanyFile, setImportCompanyFile] = useState<File | null>(null);
  const [importCompanyError, setImportCompanyError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sapCode: "",
    type: "",
    country: "",
    bankAccounts: [""],
  });
  const [users, setUsers] = useState<User[]>([
    { id: "1", firstName: "John", lastName: "Doe", email: "john@example.com", role: "Admin", country: "United Kingdom" },
    { id: "2", firstName: "Jane", lastName: "Smith", email: "jane@example.com", role: "User", country: "India" },
  ]);
  const userImportInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportUserModalOpen, setIsImportUserModalOpen] = useState(false);
  const [importUserFile, setImportUserFile] = useState<File | null>(null);
  const [importUserError, setImportUserError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([
    { id: 1, name: "United States", countryCode: "US" },
    { id: 2, name: "United Kingdom", countryCode: "GB" },
    { id: 3, name: "India", countryCode: "IN" },
  ]);

  const ADMIN_TABLE_PAGE_SIZE = 10;
  const [companiesPage, setCompaniesPage] = useState(0);
  const [countriesPage, setCountriesPage] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({ firstName: "", lastName: "", email: "", role: "", country: "" });
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
  const [countryFormData, setCountryFormData] = useState({ name: "", countryCode: "" });
  const [showCompanyHistoryModal, setShowCompanyHistoryModal] = useState(false);
  const [companyHistory, setCompanyHistory] = useState<CompanyHistoryEntry[]>([]);
  const [isCompanyHistoryLoading, setIsCompanyHistoryLoading] = useState(false);
  const [showLoanFacilityHistoryModal, setShowLoanFacilityHistoryModal] = useState(false);
  const [loanFacilityHistory, setLoanFacilityHistory] = useState<LoanHistoryEntry[]>([]);
  const [isLoanFacilityHistoryLoading, setIsLoanFacilityHistoryLoading] = useState(false);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [userHistory, setUserHistory] = useState<UserHistoryEntry[]>([]);
  const [isUserHistoryLoading, setIsUserHistoryLoading] = useState(false);
  const [showScheduleRowModal, setShowScheduleRowModal] = useState(false);
  const [editingScheduleRowId, setEditingScheduleRowId] = useState<string | null>(null);
  const [editingScheduleRowIndex, setEditingScheduleRowIndex] = useState<number | null>(null);
   const [isImportScheduleModalOpen, setIsImportScheduleModalOpen] = useState(false)
  const [importScheduleMode, setImportScheduleMode] = useState<'overwrite' | 'extend'>('extend')
  const [importScheduleFile, setImportScheduleFile] = useState<File | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    startDate: "",
    endDate: "",
    lenderBankAccount: "",
    borrowerBankAccount: "",
    annualInterestRate: "0",
    drawDown: "0",
    repayment: "0",
    fees: "0",
  });
  const scheduleImportInputRef = useRef<HTMLInputElement | null>(null);
  const companyHeaderButtonClass =
    "flex items-center justify-center gap-1.5 h-9 px-3.5 min-w-[130px] rounded-xl text-xs font-semibold transition-all shadow-sm border border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white";
  const userHeaderButtonClass =
    "flex items-center justify-center gap-1.5 h-9 px-3.5 min-w-[130px] rounded-xl text-xs font-semibold transition-all shadow-sm border border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white";
  const tableActionButtonBaseClass =
    "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 shadow-sm hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
  const tableEditButtonClass = `${tableActionButtonBaseClass} ${
    isDarkMode
      ? "bg-blue-500/15 border-blue-400/35 text-blue-300 hover:bg-blue-500/25 focus-visible:ring-blue-400"
      : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-300"
  }`;
  const tableDeleteButtonClass = `${tableActionButtonBaseClass} ${
    isDarkMode
      ? "bg-rose-500/15 border-rose-400/35 text-rose-300 hover:bg-rose-500/25 focus-visible:ring-rose-400"
      : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;

  const companiesTotalPages = Math.max(1, Math.ceil(companies.length / ADMIN_TABLE_PAGE_SIZE));
  const countriesTotalPages = Math.max(1, Math.ceil(countries.length / ADMIN_TABLE_PAGE_SIZE));
  const usersTotalPages = Math.max(1, Math.ceil(users.length / ADMIN_TABLE_PAGE_SIZE));

  const pagedCompanies = useMemo(() => {
    const startIndex = companiesPage * ADMIN_TABLE_PAGE_SIZE;
    return companies.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [companies, companiesPage]);

  const pagedCountries = useMemo(() => {
    const startIndex = countriesPage * ADMIN_TABLE_PAGE_SIZE;
    return countries.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [countries, countriesPage]);

  const pagedUsers = useMemo(() => {
    const startIndex = usersPage * ADMIN_TABLE_PAGE_SIZE;
    return users.slice(startIndex, startIndex + ADMIN_TABLE_PAGE_SIZE);
  }, [users, usersPage]);
  const isCompanyFormActionDisabled =
    !formData.name.trim() ||
    !formData.sapCode.trim() ||
    !formData.type.trim() ||
    !formData.country.trim() ||
    formData.bankAccounts.map((account) => account.trim()).filter(Boolean).length === 0;
  const editingCompany = editingId
    ? companies.find((company) => String(company.id) === String(editingId))
    : null;
  const normalizedFormBankAccounts = formData.bankAccounts
    .map((account) => account.trim())
    .filter(Boolean);
  const normalizedEditingCompanyBankAccounts = editingCompany
    ? String(editingCompany.bankAccounts ?? "")
        .split(",")
        .map((account) => account.trim())
        .filter(Boolean)
    : [];
  const isCompanyEditUnchanged =
    !!editingCompany &&
    formData.name.trim() === String(editingCompany.name ?? "").trim() &&
    formData.sapCode.trim() === String(editingCompany.sapCode ?? "").trim() &&
    formData.type.trim() === String(editingCompany.type ?? "").trim() &&
    formData.country.trim() === String(editingCompany.country ?? "").trim() &&
    normalizedFormBankAccounts.length === normalizedEditingCompanyBankAccounts.length &&
    normalizedFormBankAccounts.every(
      (account, index) => account === normalizedEditingCompanyBankAccounts[index]
    );
  const isCompanyActionButtonDisabled =
    isCompanyFormActionDisabled || (!!editingId && isCompanyEditUnchanged);
  const editingCountry = editingCountryId !== null
    ? countries.find((country) => country.id === editingCountryId) ?? null
    : null;
  const isCountryFormDisabled =
    !countryFormData.name.trim() || !countryFormData.countryCode.trim();
  const isCountryEditUnchanged =
    !!editingCountry &&
    countryFormData.name.trim() === String(editingCountry.name ?? "").trim() &&
    countryFormData.countryCode.trim().toUpperCase() ===
      String(editingCountry.countryCode ?? "").trim().toUpperCase();
  const isCountryActionButtonDisabled =
    isCountryFormDisabled || (editingCountryId !== null && isCountryEditUnchanged);
  const editingUser = editingUserId
    ? users.find((user) => String(user.id) === String(editingUserId)) ?? null
    : null;
  const isUserFormDisabled =
    !userFormData.firstName.trim() ||
    !userFormData.lastName.trim() ||
    !userFormData.email.trim() ||
    !userFormData.role.trim() ||
    !userFormData.country.trim();
  const isUserEditUnchanged =
    !!editingUser &&
    userFormData.firstName.trim() === String(editingUser.firstName ?? "").trim() &&
    userFormData.lastName.trim() === String(editingUser.lastName ?? "").trim() &&
    userFormData.email.trim() === String(editingUser.email ?? "").trim() &&
    userFormData.role.trim() === String(editingUser.role ?? "").trim() &&
    userFormData.country.trim() === String(editingUser.country ?? "").trim();
  const isUserActionButtonDisabled =
    isUserFormDisabled || (!!editingUserId && isUserEditUnchanged);
  const countryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          countries
            .map((country) => String(country.name ?? "").trim())
            .filter(Boolean)
        )
      ),
    [countries]
  );

  useEffect(() => {
    setCompaniesPage((previous) => Math.min(previous, Math.max(0, companiesTotalPages - 1)));
  }, [companiesTotalPages]);

  useEffect(() => {
    setCountriesPage((previous) => Math.min(previous, Math.max(0, countriesTotalPages - 1)));
  }, [countriesTotalPages]);

  useEffect(() => {
    setUsersPage((previous) => Math.min(previous, Math.max(0, usersTotalPages - 1)));
  }, [usersTotalPages]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if origin is valid
      if (event.origin !== gisAppURL) {
        console.warn("Invalid origin:", event.origin);
        return;
      }

      if (event.data?.type === "SET_DATA") {
        const { hideHeader, sidebarCollapsed } = event.data.payload;
        try {
          setErpIframe(hideHeader);
          setSideBarCollapsed(sidebarCollapsed);
        } catch (error) {
          console.error("Error setting header:", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Send ready message to parent if in iframe
    if (window.self !== window.top && window.parent) {
      window.parent.postMessage({ type: "IFRAME_READY" }, gisAppURL);
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const { dialog: dialog } = useConfirmDialog({
    erpIframe,
  });

  const addCompanyHistoryEntry = (
    action: CompanyHistoryEntry["action"],
    companyName: string,
    details: string
  ) => {
    setCompanyHistory((prev) => [
      {
        id: prev.length + 1,
        timestamp: new Date().toISOString(),
        action,
        createdBy: "System",
        companyName,
        details,
      },
      ...prev,
    ]);
  };

  const handleOpenCompanyHistoryModal = async () => {
    setShowCompanyHistoryModal(true);
    setIsCompanyHistoryLoading(true);
    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      const historyRows = await getCompaniesHistory(poAccessToken);
      setCompanyHistory(historyRows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch company history";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsCompanyHistoryLoading(false);
    }
  };

  const addUserHistoryEntry = (
    action: UserHistoryEntry["action"],
    userName: string,
    details: string,
    performedBy = "System",
  ) => {
    setUserHistory((prev) => [
      {
        id: prev.length + 1,
        timestamp: new Date().toISOString(),
        action,
        userName,
        details,
        performedBy,
      },
      ...prev,
    ]);
  };

  const handleOpenUserHistoryModal = async () => {
    setShowUserHistoryModal(true);
    setIsUserHistoryLoading(true);
    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      const historyRows = await getUsersHistory(poAccessToken);
      setUserHistory(historyRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch user history";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUserHistoryLoading(false);
    }
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingId(company.id);
      setFormData({
        name: company.name,
        sapCode: company.sapCode,
        type: company.type,
        country: company.country,
        bankAccounts: (
          company.bankAccountDetails?.length
            ? company.bankAccountDetails
                .slice()
                .sort((first, second) => first.rowIndex - second.rowIndex)
                .map((account) => account.accountName.trim())
                .filter(Boolean)
            : company.bankAccounts
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
        ).length
          ? (
              company.bankAccountDetails?.length
                ? company.bankAccountDetails
                    .slice()
                    .sort((first, second) => first.rowIndex - second.rowIndex)
                    .map((account) => account.accountName.trim())
                    .filter(Boolean)
                : company.bankAccounts
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
            )
          : [""],
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: [""] });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const normalizedBankAccounts = formData.bankAccounts
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      !formData.name.trim() ||
      !formData.sapCode.trim() ||
      !formData.type.trim() ||
      !formData.country.trim() ||
      normalizedBankAccounts.length === 0
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingId) {
      try {
        const poAccessToken = localStorage.getItem("poAccessToken");
        if (!poAccessToken) {
          throw new Error("Access token is missing. Please sign in again.");
        }

        const editingCompany = companies.find(
          (company) => String(company.id) === String(editingId),
        );
        const existingBankAccountDetails = (editingCompany?.bankAccountDetails ?? [])
          .slice()
          .sort((first, second) => first.rowIndex - second.rowIndex);
        const existingIdsByName = new Map<string, number[]>();
        for (const account of existingBankAccountDetails) {
          const key = account.accountName.trim().toLowerCase();
          const accountId = Number(account.id) || 0;
          if (accountId <= 0) {
            continue;
          }
          if (!existingIdsByName.has(key)) {
            existingIdsByName.set(key, []);
          }
          existingIdsByName.get(key)?.push(accountId);
        }

        let bankAccountsPayload = normalizedBankAccounts.map((accountName, index) => {
          const key = accountName.trim().toLowerCase();
          const candidateIds = existingIdsByName.get(key) ?? [];
          const preservedId =
            candidateIds.length > 0 ? (candidateIds.shift() ?? 0) : 0;
          existingIdsByName.set(key, candidateIds);
          return {
            id: preservedId,
            accountName,
            rowIndex: index + 1,
          };
        });

        if (normalizedBankAccounts.length === existingBankAccountDetails.length) {
          const usedIds = new Set(
            bankAccountsPayload.map((row) => row.id).filter((id) => id > 0),
          );
          bankAccountsPayload = bankAccountsPayload.map((row, index) => {
            if (row.id > 0) {
              return row;
            }
            const slotId = Number(existingBankAccountDetails[index]?.id) || 0;
            if (slotId > 0 && !usedIds.has(slotId)) {
              usedIds.add(slotId);
              return { ...row, id: slotId };
            }
            return row;
          });
        }

        await updateCompany(poAccessToken, editingId, {
          id: Number.parseInt(editingId, 10) || 0,
          name: formData.name.trim(),
          code: formData.sapCode.trim(),
          type: formData.type,
          country: formData.country,
          bankAccounts: bankAccountsPayload,
        });

        await loadAllData();
        addCompanyHistoryEntry(
          "EDIT",
          formData.name,
          `Updated company ${formData.name}`
        );
        toast.success("Company updated successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update company";
        toast.error(message);
        return;
      }
    } else {
      try {
        const poAccessToken = localStorage.getItem("poAccessToken");
        if (!poAccessToken) {
          throw new Error("Access token is missing. Please sign in again.");
        }

        await createCompany(poAccessToken, {
          id: 0,
          name: formData.name.trim(),
          code: formData.sapCode.trim(),
          type: formData.type,
          country: formData.country,
          bankAccounts: normalizedBankAccounts.map((accountName, index) => ({
            id: 0,
            accountName,
            rowIndex: index + 1,
          })),
        });

        await loadAllData();
        addCompanyHistoryEntry("ADD", formData.name, `Added company ${formData.name}`);
        toast.success("Company added successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create company";
        toast.error(message);
        return;
      }
    }

    setShowModal(false);
    setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: [""] });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      const companyToDelete = companies.find((c) => c.id === id);
      await deleteCompany(poAccessToken, id);
      await loadAllData();

      if (companyToDelete) {
        addCompanyHistoryEntry(
          "DELETE",
          companyToDelete.name,
          `Deleted company ${companyToDelete.name}`
        );
      }
      toast.success("Company deleted successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete company";
      toast.error(message);
    }
  };

  const exportCompaniesToExcel = () => {
    const rows = companies.map((company) => ({
      ID: company.id,
      Name: company.name,
      "SAP Code": company.sapCode,
      Type: company.type,
      Country: company.country,
      "Bank Accounts": company.bankAccounts,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    XLSX.writeFile(workbook, "companies_and_shareholders.xlsx");
    toast.success("Companies exported successfully");
  };

  const openImportCompanyModal = () => {
    setImportCompanyError(null);
    setImportCompanyFile(null);
    setIsImportCompanyModalOpen(true);
  };

  const downloadCompanyImportTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Name", "SAP Code", "Type", "Country", "Bank Accounts"],
      ["NatPower Holdings Ltd", "NPH", "Internal", "Italy", "Barclays GBP 30958472; HSBC USD 22001995"],
    ]);

    XLSX.utils.book_append_sheet(workbook, sheet, "Companies Template");
    XLSX.writeFile(workbook, "companies_import_template.xlsx");
    toast.success("Company template downloaded");
  };

  const triggerCompanyImportFile = () => {
    companyImportInputRef.current?.click();
  };

  const handleCompanyImportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    setImportCompanyFile(file);
    setImportCompanyError(null);
  };

  const handleCompanyImport = async () => {
    if (!importCompanyFile) {
      setImportCompanyError("Please choose a file to import.");
      return;
    }

    try {
      const buffer = await importCompanyFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const normalizedRows = rawRows
        .map((row, index) => {
          const idValue = row.ID ?? row.id ?? String(index + 1);
          const name = String(row.Name ?? row.name ?? "").trim();
          const sapCode = String(row["SAP Code"] ?? row.sapCode ?? row.sAPCode ?? "").trim();
          const type = String(row.Type ?? row.type ?? "").trim();
          const country = String(row.Country ?? row.country ?? "").trim();
          const bankAccounts = String(
            row["Bank Accounts"] ?? row.bankAccounts ?? row.bankAccount ?? ""
          ).trim();

          return {
            id: String(idValue || index + 1),
            name,
            sapCode,
            type,
            country,
            bankAccounts,
          } as Company;
        })
        .filter(
          (row) =>
            row.name &&
            row.sapCode &&
            row.type &&
            row.country &&
            row.bankAccounts
        );

      if (normalizedRows.length === 0) {
        setImportCompanyError("No valid company rows found in import file.");
        return;
      }

      setCompanies(normalizedRows);
      addCompanyHistoryEntry(
        "IMPORT",
        "Bulk Import",
        `Imported ${normalizedRows.length} companies from ${importCompanyFile.name}`
      );
      toast.success(`Imported ${normalizedRows.length} companies`);
      setIsImportCompanyModalOpen(false);
      setImportCompanyFile(null);
      setImportCompanyError(null);
    } catch {
      setImportCompanyError("Failed to import companies file.");
    }
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setUserFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, country: user.country });
    } else {
      setEditingUserId(null);
      setUserFormData({ firstName: "", lastName: "", email: "", role: "", country: "" });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.firstName.trim() || !userFormData.lastName.trim() || !userFormData.email.trim() || !userFormData.role.trim() || !userFormData.country.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      if (editingUserId) {
        await updateUser(poAccessToken, editingUserId, {
          id: Number(editingUserId) || 0,
          firstName: userFormData.firstName.trim(),
          lastName: userFormData.lastName.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
          country: userFormData.country,
        });
        addUserHistoryEntry(
          "EDIT",
          `${userFormData.firstName} ${userFormData.lastName}`,
          `Updated user ${userFormData.firstName}`
        );
        toast.success("User updated successfully");
      } else {
        await createUser(poAccessToken, {
          firstName: userFormData.firstName.trim(),
          lastName: userFormData.lastName.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
          country: userFormData.country,
        });
        addUserHistoryEntry(
          "ADD",
          `${userFormData.firstName} ${userFormData.lastName}`,
          `Added user ${userFormData.firstName} ${userFormData.lastName}`
        );
        toast.success("User added successfully");
      }

      await loadAllData();
      setShowUserModal(false);
      setUserFormData({ firstName: "", lastName: "", email: "", role: "", country: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save user";
      toast.error(message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      const userToDelete = users.find((u) => u.id === id);
      await deleteUser(poAccessToken, id);
      await loadAllData();

      if (userToDelete) {
        addUserHistoryEntry(
          "DELETE",
          `${userToDelete.firstName} ${userToDelete.lastName}`,
          `Deleted user ${userToDelete.firstName} ${userToDelete.lastName}`
        );
      }
      toast.success("User deleted successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(message);
    }
  };

  const exportUsersToExcel = () => {
    const rows = users.map((user) => ({
      ID: user.id,
      "First Name": user.firstName,
      "Last Name": user.lastName,
      "Email Address": user.email,
      Role: user.role,
      Country: user.country,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users.xlsx");
    toast.success("Users exported successfully");
  };

  const downloadUserTemplate = () => {
    const templateRows = [
      ["ID", "First Name", "Last Name", "Email Address", "Role", "Country"],
      ["1", "John", "Doe", "john@example.com", "Admin", "United Kingdom"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users Template");
    XLSX.writeFile(workbook, "users_template.xlsx");
    toast.success("User template downloaded");
  };

  const openImportUserModal = () => {
    setImportUserError(null);
    setImportUserFile(null);
    setIsImportUserModalOpen(true);
  };

  const triggerUserImport = () => {
    userImportInputRef.current?.click();
  };

  const handleUserImportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    setImportUserFile(file);
    setImportUserError(null);
  };

  const handleUserImport = async () => {
    if (!importUserFile) {
      setImportUserError("Please choose a file to import.");
      return;
    }

    try {
      const buffer = await importUserFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const normalizedRows = rawRows
        .map((row, index) => {
          const idValue = row.ID ?? row.id ?? String(index + 1);
          const firstName = String(row["First Name"] ?? row.firstName ?? "").trim();
          const lastName = String(row["Last Name"] ?? row.lastName ?? "").trim();
          const email = String(row["Email Address"] ?? row.email ?? "").trim();
          const role = String(row.Role ?? row.role ?? "").trim();
          const country = String(row.Country ?? row.country ?? "").trim();

          return {
            id: String(idValue || index + 1),
            firstName,
            lastName,
            email,
            role,
            country,
          } as User;
        })
        .filter((row) => row.firstName && row.lastName && row.email && row.role && row.country);

      if (normalizedRows.length === 0) {
        setImportUserError("No valid user rows found in import file.");
        return;
      }

      setUsers(normalizedRows);
      addUserHistoryEntry("IMPORT", "Bulk Import", `Imported ${normalizedRows.length} users from ${importUserFile.name}`);
      toast.success(`Imported ${normalizedRows.length} users`);
      setIsImportUserModalOpen(false);
      setImportUserFile(null);
      setImportUserError(null);
    } catch {
      setImportUserError("Failed to import users file.");
    }
  };

  const handleOpenCountryModal = (country?: Country) => {
    if (country) {
      setEditingCountryId(country.id);
      setCountryFormData({ name: country.name, countryCode: country.countryCode });
    } else {
      setEditingCountryId(null);
      setCountryFormData({ name: "", countryCode: "" });
    }
    setShowCountryModal(true);
  };

  const handleSaveCountry = async () => {
    if (!countryFormData.name.trim() || !countryFormData.countryCode.trim()) {
      toast.error("Please fill in all country fields");
      return;
    }

    const normalizedCode = countryFormData.countryCode.trim().toUpperCase();

    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      if (editingCountryId !== null) {
        await updateCountry(poAccessToken, editingCountryId, {
          name: countryFormData.name.trim(),
          code: normalizedCode,
        });
        toast.success("Country updated successfully");
      } else {
        await createCountry(poAccessToken, {
          name: countryFormData.name.trim(),
          code: normalizedCode,
        });
        toast.success("Country added successfully");
      }

      await loadAllData();
      setShowCountryModal(false);
      setCountryFormData({ name: "", countryCode: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save country";
      toast.error(message);
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this country?")) {
      return;
    }

    try {
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      await deleteCountry(poAccessToken, id);
      await loadAllData();
      toast.success("Country deleted successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete country";
      toast.error(message);
    }
  };

  const showActiveOnly = showOnlyActiveLoanFacilities;

  const currentAccessUser = useMemo(() => {
    const role = localStorage.getItem("user_role");
    const country = localStorage.getItem("user_country");

    if (!role && !country) {
      return null;
    }

    return {
      role: role || "",
      country: country || "",
    };
  }, []);

  const getLoanStatus = (loan: any) => {
    if (typeof loan?.status === "string" && loan.status.trim()) {
      return loan.status;
    }
    if (typeof loan?.isActive === "boolean") {
      return loan.isActive ? "Active" : "closed";
    }
    if (typeof loan?.active === "boolean") {
      return loan.active ? "Active" : "closed";
    }
    return "Active";
  };

  const selectedLoanFacility: any = loans.find(
    (candidate) => String(candidate.id) === String(selectedLoanId)
  );

  const isViewer = currentAccessUser?.role === "Viewer";
  const canEdit =
    currentAccessUser?.role === "Admin" || currentAccessUser?.role === "Editor";
  const canDelete = currentAccessUser?.role === "Admin";
  const isAdminUser = currentAccessUser?.role === "Admin";

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const normalized = String(value).trim();
    if (!normalized || normalized === "-") return "-";

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return "-";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatCurrencyInteger = (value: number) =>
    Number(value || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  type DrawDownRow = {
    id: string;
    scheduleIndex: number;
    startDate: string;
    endDate: string;
    lenderBankAccount: string;
    borrowerBankAccount: string;
    annualInterestRate: number;
    days: number;
    drawDown: number;
    repayment: number;
    principal: number;
    cumulativePrincipal: number;
    interest: number;
    cumulativeInterest: number;
    total: number;
    fees: number;
  };

  const availableLenderBankAccounts = useMemo(() => {
    const lenderCompany = companies.find(
      (company) => String(company.id) === String(selectedLoanFacility?.lenderCompanyId ?? "")
    );
    if (!lenderCompany) {
      return [];
    }
    return Array.from(
      new Set(
        String(lenderCompany.bankAccounts ?? "")
          .split(",")
          .map((account) => account.trim())
          .filter(Boolean)
      )
    );
  }, [companies, selectedLoanFacility]);

  const availableBorrowerBankAccounts = useMemo(() => {
    const borrowerCompany = companies.find(
      (company) => String(company.id) === String(selectedLoanFacility?.borrowerCompanyId ?? "")
    );
    if (!borrowerCompany) {
      return [];
    }
    return Array.from(
      new Set(
        String(borrowerCompany.bankAccounts ?? "")
          .split(",")
          .map((account) => account.trim())
          .filter(Boolean)
      )
    );
  }, [companies, selectedLoanFacility]);

  const resetScheduleForm = () => {
    setScheduleForm({
      startDate: "",
      endDate: "",
      lenderBankAccount: "",
      borrowerBankAccount: "",
      annualInterestRate: String(selectedLoanFacility?.annualInterestRate ?? 0),
      drawDown: "0",
      repayment: "0",
      fees: "0",
    });
  };

  const handleOpenAddScheduleRowModal = () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }
    setEditingScheduleRowId(null);
    setEditingScheduleRowIndex(null);
    resetScheduleForm();
    setShowScheduleRowModal(true);
  };

  const closeScheduleRowModal = () => {
    setShowScheduleRowModal(false);
    setEditingScheduleRowId(null);
    setEditingScheduleRowIndex(null);
    resetScheduleForm();
  };

  const handleSaveScheduleRow = async () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    if (
      !scheduleForm.startDate ||
      !scheduleForm.endDate ||
      !scheduleForm.lenderBankAccount ||
      !scheduleForm.borrowerBankAccount
    ) {
      toast.error("Please complete all required schedule fields.");
      return;
    }

    if (scheduleForm.endDate < scheduleForm.startDate) {
      toast.error("End Date cannot be earlier than Start Date.");
      return;
    }

    const annualInterestRate = Number(scheduleForm.annualInterestRate);
    const drawDown = Number(scheduleForm.drawDown);
    const repayment = Number(scheduleForm.repayment);
    const fees = Number(scheduleForm.fees);

    if (
      [annualInterestRate, drawDown, repayment, fees].some((value) =>
        Number.isNaN(value)
      )
    ) {
      toast.error("Please enter valid decimal numbers.");
      return;
    }

    try {
      ensureEditor();
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        toast.error("Access token is missing. Please sign in again.");
        return;
      }

      const loanFacilityId = String(selectedLoanId);
      const payload = {
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        lenderBankAccount: scheduleForm.lenderBankAccount,
        borrowerBankAccount: scheduleForm.borrowerBankAccount,
        annualInterestRatePct: annualInterestRate,
        drawDown,
        repayment,
        fees,
      };

      if (editingScheduleRowId) {
        await updateLoanFacilityScheduleRow(
          poAccessToken,
          loanFacilityId,
          editingScheduleRowId,
          {
            ...payload,
            rowIndex:
              editingScheduleRowIndex ??
              (Array.isArray(selectedLoanFacility.schedule)
                ? selectedLoanFacility.schedule.length
                : 0),
          },
        );
      } else {
        await createLoanFacilityScheduleRow(poAccessToken, loanFacilityId, payload);
      }

      const updatedSchedule = await getLoanFacilitySchedule(poAccessToken, loanFacilityId);
      setLoans((prevLoans) =>
        prevLoans.map((loan) =>
          String(loan.id) === loanFacilityId ? { ...loan, schedule: updatedSchedule } : loan,
        ),
      );

      closeScheduleRowModal();
      toast.success(
        editingScheduleRowId
          ? "Schedule row updated successfully."
          : "Schedule row added successfully.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingScheduleRowId
          ? "Failed to update schedule row."
          : "Failed to add schedule row."
      );
    }
  };

 const openImportScheduleModal = () => {
    setErrorMessage(null)
    setImportScheduleMode('extend')
    setImportScheduleFile(null)
    setIsImportScheduleModalOpen(true)
  }

  const closeImportScheduleModal = () => {
    setIsImportScheduleModalOpen(false)
    setImportScheduleFile(null)
    setErrorMessage(null)
  }

  const downloadScheduleImportTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      [
        "Start Date",
        "End Date",
        "Lender Bank Account",
        "Borrower Bank Account",
        "Annual Interest Rate %",
        "Draw Down",
        "Repayment",
        "Fees",
      ],
      [
        "2026-01-01",
        "2026-02-01",
        "Barclays GBP 30958472",
        "Intesa EUR 22199410",
        "5",
        "100000",
        "0",
        "0",
      ],
    ]);

    XLSX.utils.book_append_sheet(workbook, sheet, "Schedule Template");
    XLSX.writeFile(workbook, "drawdown_schedule_template.xlsx");
    toast.success("Schedule template downloaded");
  };

  const triggerScheduleImportFile = () => {
    scheduleImportInputRef.current?.click();
  };


  const handleScheduleImportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setImportScheduleFile(file);
    setErrorMessage(null);
  };

  const handleImportSchedule = async () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    if (!importScheduleFile) {
      setErrorMessage("Please choose a file to import.");
      return;
    }

    try {
      ensureEditor();
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }

      const loanFacilityId = String(selectedLoanId);
      await importLoanFacilitySchedule(
        poAccessToken,
        loanFacilityId,
        importScheduleFile,
        importScheduleMode,
      );
      const updatedSchedule = await getLoanFacilitySchedule(poAccessToken, loanFacilityId);
      setLoans((prevLoans) =>
        prevLoans.map((loan) =>
          String(loan.id) === loanFacilityId ? { ...loan, schedule: updatedSchedule } : loan,
        ),
      );

      closeImportScheduleModal();
      toast.success("Schedule imported successfully.");
    } catch (error) {
      console.error("Failed to import schedule file", error);
      const message = error instanceof Error ? error.message : "Failed to import schedule file.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const calculatedRows = useMemo<DrawDownRow[]>(() => {
    const currentLoan = loans.find(
      (loan) => String(loan.id) === String(selectedLoanId)
    );

    const scheduleRows = Array.isArray(currentLoan?.schedule)
      ? currentLoan.schedule
      : [];

    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;

    return scheduleRows.map((row: any, index: number) => {
      const drawDown = Number(row?.drawDown ?? 0);
      const repayment = Number(row?.repayment ?? 0);
      const fees = Number(row?.fees ?? 0);
      const annualInterestRate = Number(
        row?.annualInterestRate ??
          row?.annualInterestRatePct ??
          currentLoan?.annualInterestRate ??
          0
      );
      const startDate = String(row?.startDate ?? "");
      const endDate = String(row?.endDate ?? "");
      const explicitDays = Number(row?.days ?? 0);
      const derivedDays =
        startDate && endDate
          ? Math.max(
              0,
              Math.round(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 0;
      const days = explicitDays > 0 ? explicitDays : derivedDays;
      const principal = Number(row?.principal ?? drawDown - repayment);
      const yearBasis = Number(currentLoan?.daysInYear ?? 365) || 365;
      const interest = Number(
        row?.interest ?? (principal * annualInterestRate * days) / (100 * yearBasis)
      );

      cumulativePrincipal += principal;
      cumulativeInterest += interest;

      const cumulativePrincipalValue = Number(
        row?.cumulativePrincipal ?? cumulativePrincipal
      );
      const cumulativeInterestValue = Number(
        row?.cumulativeInterest ?? cumulativeInterest
      );

      return {
        id: String(row?.id ?? `${index + 1}`),
        scheduleIndex: Number(row?.rowIndex ?? row?.scheduleIndex ?? index + 1),
        startDate,
        endDate,
        lenderBankAccount: String(row?.lenderBankAccount ?? ""),
        borrowerBankAccount: String(row?.borrowerBankAccount ?? ""),
        annualInterestRate,
        days,
        drawDown,
        repayment,
        principal,
        cumulativePrincipal: cumulativePrincipalValue,
        interest,
        cumulativeInterest: cumulativeInterestValue,
        total: Number(row?.total ?? principal + interest + fees),
        fees,
      };
    });
  }, [loans, selectedLoanId]);

  const scheduleColumnDefs = useMemo<ColDef<DrawDownRow>[]>(() => {
    const columns: ColDef<DrawDownRow>[] = [
      { field: "scheduleIndex", headerName: "Index", minWidth: 90, pinned: "left" },
      {
        field: "startDate",
        headerName: "Start Date",
        minWidth: 130,
        valueFormatter: (params) => formatDate(String(params.value ?? "")),
      },
      {
        field: "endDate",
        headerName: "End Date",
        minWidth: 130,
        valueFormatter: (params) => formatDate(String(params.value ?? "")),
      },
      { field: "lenderBankAccount", headerName: "Lender Bank Account", minWidth: 180 },
      { field: "borrowerBankAccount", headerName: "Borrower Bank Account", minWidth: 190 },
      {
        field: "annualInterestRate",
        headerName: "Annual Interest Rate %",
        minWidth: 170,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "days",
        headerName: "Days",
        minWidth: 90,
        valueFormatter: (params) => formatCurrencyInteger(Number(params.value ?? 0)),
      },
      {
        field: "drawDown",
        headerName: "Draw Down",
        minWidth: 120,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "repayment",
        headerName: "Repayment",
        minWidth: 120,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "principal",
        headerName: "Principal",
        minWidth: 120,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "cumulativePrincipal",
        headerName: "Cumulative Principal",
        minWidth: 170,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "interest",
        headerName: "Interest",
        minWidth: 110,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "cumulativeInterest",
        headerName: "Cumulative Interest",
        minWidth: 170,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "total",
        headerName: "Total",
        minWidth: 110,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "fees",
        headerName: "Fees",
        minWidth: 110,
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
    ];

    if (!isViewer) {
      columns.push({
        headerName: "Actions",
        minWidth: 160,
        cellRenderer: (params: { data?: DrawDownRow }) => {
          const row = params.data;
          if (!row) return null;

          return (
            <div className="flex items-center gap-2 h-full">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => editSchedule(row)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    isDarkMode
                      ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => deleteSchedule(row)}
                  className={`px-2 py-1 rounded text-xs transition ${
                    isDarkMode
                      ? "bg-red-600/20 hover:bg-red-600/30 text-red-300"
                      : "bg-red-100 hover:bg-red-200 text-red-700"
                  }`}
                >
                  Delete
                </button>
              )}
            </div>
          );
        },
      });
    }

    return columns;
  }, [isViewer, canEdit, canDelete, isDarkMode, selectedLoanId, selectedLoanFacility, loans]);

  const editSchedule = (row: DrawDownRow) => {
    setEditingScheduleRowId(String(row.id));
    setEditingScheduleRowIndex(Number(row.scheduleIndex));
    setScheduleForm({
      startDate: row.startDate,
      endDate: row.endDate,
      lenderBankAccount: row.lenderBankAccount,
      borrowerBankAccount: row.borrowerBankAccount,
      annualInterestRate: String(row.annualInterestRate ?? 0),
      drawDown: String(row.drawDown ?? 0),
      repayment: String(row.repayment ?? 0),
      fees: String(row.fees ?? 0),
    });
    setShowScheduleRowModal(true);
  };

  const deleteSchedule = async (row: DrawDownRow) => {
    const shouldDelete = window.confirm(
      `Delete schedule row ${row.scheduleIndex}? This action cannot be undone.`,
    );
    if (!shouldDelete) {
      return;
    }

    try {
      ensureEditor();
      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        toast.error("Access token is missing. Please sign in again.");
        return;
      }

      const fallbackLoan = loans.find((loan) =>
        Array.isArray(loan.schedule)
          ? loan.schedule.some((scheduleRow: any) => String(scheduleRow?.id) === String(row.id))
          : false,
      );
      const loanFacilityId = String(selectedLoanId || fallbackLoan?.id || "");
      if (!loanFacilityId) {
        toast.error("Please select a Loan Facility first.");
        return;
      }
      await deleteLoanFacilityScheduleRow(poAccessToken, loanFacilityId, String(row.id));

      const updatedSchedule = await getLoanFacilitySchedule(poAccessToken, loanFacilityId);
      setLoans((prevLoans) =>
        prevLoans.map((loan) =>
          String(loan.id) === loanFacilityId ? { ...loan, schedule: updatedSchedule } : loan,
        ),
      );

      toast.success("Schedule row deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete schedule row.",
      );
    }
  };

  const loanFacilityFieldValue = (keys: string[], fallback = "-") => {
    if (!selectedLoanFacility) return fallback;

    for (const key of keys) {
      if (key === "lender" || key === "lenderName") {
        const lenderCompany = companies.find(
          (company) => String(company.id) === String(selectedLoanFacility.lenderCompanyId)
        );
        if (lenderCompany?.name) return lenderCompany.name;

        const lenderNameFallback = String(
          selectedLoanFacility.lender ?? selectedLoanFacility.lenderName ?? ""
        ).trim();
        if (lenderNameFallback) return lenderNameFallback;
      }

      if (key === "borrower" || key === "borrowerName") {
        const borrowerCompany = companies.find(
          (company) => String(company.id) === String(selectedLoanFacility.borrowerCompanyId)
        );
        if (borrowerCompany?.name) return borrowerCompany.name;

        const borrowerNameFallback = String(
          selectedLoanFacility.borrower ?? selectedLoanFacility.borrowerName ?? ""
        ).trim();
        if (borrowerNameFallback) return borrowerNameFallback;
      }

      const value = selectedLoanFacility[key];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return String(value);
      }
    }

    return fallback;
  };


  const visibleLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (showActiveOnly && getLoanStatus(loan) !== "Active") {
        return false;
      }

      if (!currentAccessUser) {
        return true;
      }

      if (
        currentAccessUser.role === "Admin" ||
        currentAccessUser.country === "Global"
      ) {
        return true;
      }

      if (
        currentAccessUser.role === "Editor" ||
        currentAccessUser.role === "Viewer"
      ) {
        const lenderCountry =
          companies.find((company) => company.id === loan.lenderCompanyId)
            ?.country ?? "";
        const borrowerCountry =
          companies.find((company) => company.id === loan.borrowerCompanyId)
            ?.country ?? "";

        return (
          lenderCountry.toLowerCase() ===
            currentAccessUser.country.toLowerCase() ||
          borrowerCountry.toLowerCase() ===
            currentAccessUser.country.toLowerCase()
        );
      }

      return false;
    });
  }, [loans, showActiveOnly, currentAccessUser, companies]);




  useEffect(() => {
    const storageKey = loanFacilitySelectionStorageKey();
    if (loanSelectionStorageKeyRef.current !== storageKey) {
      loanSelectionStorageKeyRef.current = storageKey;
      initialLoanSelectionRestoreRef.current = false;
    }

    if (isCreatingLoan) {
      return;
    }

    if (visibleLoans.length === 0) {
      setSelectedLoanId("");
      return;
    }

    const stillVisible = visibleLoans.some(
      (loan) => String(loan.id) === String(selectedLoanId),
    );

    if (!selectedLoanId || !stillVisible) {
      let nextId: string;
      if (!initialLoanSelectionRestoreRef.current) {
        initialLoanSelectionRestoreRef.current = true;
        const stored = readStoredLoanFacilitySelection();
        const storedIsValid =
          stored &&
          visibleLoans.some((loan) => String(loan.id) === String(stored.id));
        if (storedIsValid) {
          nextId = String(stored!.id);
        } else {
          if (stored) {
            clearStoredLoanFacilitySelection();
          }
          nextId = String(visibleLoans[0].id);
        }
      } else {
        nextId = String(visibleLoans[0].id);
      }
      setSelectedLoanId(nextId);
    } else if (!initialLoanSelectionRestoreRef.current) {
      initialLoanSelectionRestoreRef.current = true;
    }
  }, [isCreatingLoan, selectedLoanId, visibleLoans]);

  useEffect(() => {
    if (!selectedLoanId.trim()) {
      clearStoredLoanFacilitySelection();
      return;
    }
    const loan = loans.find((l) => String(l.id) === String(selectedLoanId));
    const stored = readStoredLoanFacilitySelection();
    let label = "";
    if (loan && typeof loan.name === "string" && loan.name.trim()) {
      label = loan.name.trim();
    } else if (stored?.id === String(selectedLoanId) && stored.label.trim()) {
      label = stored.label.trim();
    } else {
      label = `Loan #${selectedLoanId}`;
    }
    writeStoredLoanFacilitySelection(String(selectedLoanId), label);
  }, [selectedLoanId, loans]);

  useEffect(() => {
    if (!showActiveOnly || !selectedLoanId) {
      return;
    }

    const selectedLoan = visibleLoans.find(
      (loan) => String(loan.id) === String(selectedLoanId)
    );

    if (selectedLoan && getLoanStatus(selectedLoan) !== "Active") {
      const firstActive = visibleLoans.find(
        (loan) => getLoanStatus(loan) === "Active"
      );
      const fallbackId = String(firstActive?.id ?? "");
      setSelectedLoanId(fallbackId);
    }
  }, [showActiveOnly, visibleLoans, selectedLoanId]);

  useEffect(() => {
    if (activeTab === "admin" && !isAdminUser) {
      setActiveTab("loan-facility");
    }
  }, [activeTab, isAdminUser]);


  
  const handleNewLoanFacility = () => {
    setIsCreatingLoan(true);
   
     setLoanForm({
      ...emptyLoanForm,
      status: 'Active',
      lenderCompanyId: companies[0]?.id ?? '',
      borrowerCompanyId: companies[1]?.id ?? companies[0]?.id ?? '',
    })

    setShowLoanFacilityModal(true);
  };

  const handleEditLoanFacility = () => {
     setErrorMessage(null)

    if (!canEdit) {
    //setErrorMessage('Access denied: editor role is required for this action')
       toast.error("Access denied: editor role is required for this action");
      return
    }

    if (!selectedLoanId || !selectedLoanFacility) {
      setErrorMessage('Select a loan facility first')
      return
    }

    setIsCreatingLoan(false)
    setLoanForm({
      facilityName: selectedLoanFacility.name,
      status: getLoanStatus(selectedLoanFacility),
      lenderCompanyId: selectedLoanFacility.lenderCompanyId,
      borrowerCompanyId: selectedLoanFacility.borrowerCompanyId,
      agreementDate: selectedLoanFacility.agreementDate,
      currency: selectedLoanFacility.currency,
      annualInterestRate: selectedLoanFacility.annualInterestRate,
      daysInYear: selectedLoanFacility.daysInYear,
    })

    setShowLoanFacilityModal(true);
  };

  const handleDeleteLoanFacility = () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this Loan Facility?",
    );
    if (!shouldDelete) {
      return;
    }

    setLoans((prev) => prev.filter((loan) => String(loan.id) !== String(selectedLoanId)));
    clearStoredLoanFacilitySelection();
    setSelectedLoanId("");
    toast.success("Loan Facility deleted successfully.");
  };

  const exportLoanFacilityToExcel = () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    const loanDetailsRows = [
      {
        ID: selectedLoanFacility.id,
        Name: selectedLoanFacility.name,
        Status: loanFacilityFieldValue(["status"]),
        "Start Date": formatDate(
          loanFacilityFieldValue(
            ["startDate", "start_date", "agreementDate", "agreement_date"],
            "-"
          )
        ),
        "Close Date": formatDate(
          loanFacilityFieldValue(["closeDate", "close_date"], "-")
        ),
        Lender: loanFacilityFieldValue(["lender", "lenderName"]),
        Borrower: loanFacilityFieldValue(["borrower", "borrowerName"]),
        "Agreement Date": formatDate(
          loanFacilityFieldValue(["agreementDate", "agreement_date"], "-")
        ),
        Currency: loanFacilityFieldValue(["currency"]),
        "Annual Interest Rate %": loanFacilityFieldValue(
          ["annualInterestRate", "annual_interest_rate"],
          "0"
        ),
        "Days in Year": loanFacilityFieldValue(["daysInYear", "days_in_year"], "365"),
      },
    ];

    const scheduleRows = calculatedRows.map((row) => ({
      Index: row.scheduleIndex,
      "Start Date": formatDate(row.startDate),
      "End Date": formatDate(row.endDate),
      "Lender Bank Account": row.lenderBankAccount || "-",
      "Borrower Bank Account": row.borrowerBankAccount || "-",
      "Annual Interest Rate %": row.annualInterestRate,
      Days: row.days,
      "Draw Down": row.drawDown,
      Repayment: row.repayment,
      Principal: row.principal,
      "Cumulative Principal": row.cumulativePrincipal,
      Interest: row.interest,
      "Cumulative Interest": row.cumulativeInterest,
      Total: row.total,
      Fees: row.fees,
    }));

    const workbook = XLSX.utils.book_new();
    const detailsSheet = XLSX.utils.json_to_sheet(loanDetailsRows);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, "Loan Details");

    const scheduleSheet = XLSX.utils.json_to_sheet(scheduleRows);
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, "Draw Down Schedule");

    XLSX.writeFile(
      workbook,
      `loan_facility_${String(selectedLoanFacility.name || "details").replace(/\s+/g, "_")}.xlsx`
    );
    toast.success("Loan Facility exported to Excel.");
  };

  const exportLoanFacilityToPDF = () => {
    if (!selectedLoanFacility) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Loan Facility: ${selectedLoanFacility.name}`, 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Exported On: ${new Date().toLocaleDateString("en-GB")}`,
      doc.internal.pageSize.getWidth() - 14,
      16,
      { align: "right" }
    );

    autoTable(doc, {
      startY: 22,
      head: [["Field", "Value"]],
      body: [
        ["Status", loanFacilityFieldValue(["status"])],
        [
          "Start Date",
          formatDate(
            loanFacilityFieldValue(
              ["startDate", "start_date", "agreementDate", "agreement_date"],
              "-"
            )
          ),
        ],
        [
          "Close Date",
          formatDate(
            loanFacilityFieldValue(["closeDate", "close_date"], "-")
          ),
        ],
        ["Lender", loanFacilityFieldValue(["lender", "lenderName"])],
        ["Borrower", loanFacilityFieldValue(["borrower", "borrowerName"])],
        [
          "Agreement Date",
          formatDate(loanFacilityFieldValue(["agreementDate", "agreement_date"], "-")),
        ],
        ["Currency", loanFacilityFieldValue(["currency"])],
        [
          "Annual Interest Rate %",
          loanFacilityFieldValue(["annualInterestRate", "annual_interest_rate"], "0"),
        ],
        [
          "Days in Year",
          loanFacilityFieldValue(["daysInYear", "days_in_year"], "365"),
        ],
      ],
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[
        "Index",
        "Start Date",
        "End Date",
        "Lender Bank Account",
        "Borrower Bank Account",
        "Annual Interest Rate %",
        "Days",
        "Draw Down",
        "Repayment",
        "Principal",
        "Cumulative Principal",
        "Interest",
        "Cumulative Interest",
        "Total",
        "Fees",
      ]],
      body: calculatedRows.map((row) => [
        String(row.scheduleIndex),
        formatDate(row.startDate),
        formatDate(row.endDate),
        row.lenderBankAccount || "-",
        row.borrowerBankAccount || "-",
        formatCurrency(row.annualInterestRate),
        formatCurrencyInteger(row.days),
        formatCurrency(row.drawDown),
        formatCurrency(row.repayment),
        formatCurrency(row.principal),
        formatCurrency(row.cumulativePrincipal),
        formatCurrency(row.interest),
        formatCurrency(row.cumulativeInterest),
        formatCurrency(row.total),
        formatCurrency(row.fees),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [55, 65, 81] },
    });

    doc.save(
      `loan_facility_${String(selectedLoanFacility.name || "details").replace(/\s+/g, "_")}.pdf`
    );
    toast.success("Loan Facility exported to PDF.");
  };

  const ensureUser = (): MockUser => {
    const email = localStorage.getItem("user_email") || users[0]?.email || "system@local";
    const matchedUser = users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );

    return {
      id: matchedUser?.id || "system",
      name: matchedUser
        ? `${matchedUser.firstName} ${matchedUser.lastName}`.trim()
        : "System",
      email,
    };
  };

  const ensureEditor = (): MockUser => {
    const user = ensureUser()
    const accessUser = users.find(
      (candidate) => candidate.email.toLowerCase() === user.email.toLowerCase(),
    )

    if (!accessUser) {
      toast.error('Access denied: this email is not in the approved user list')
      throw new Error('Access denied: this email is not in the approved user list')
    }

    if (accessUser.role !== 'Editor' && accessUser.role !== 'Admin') {
      toast.error('Access denied: editor role is required for this action')
      throw new Error('Access denied: editor role is required for this action')
    }

    return user
  };

  const loadAllData = useCallback(async () => {
    const poAccessToken = localStorage.getItem("poAccessToken");
    if (!poAccessToken) {
      throw new Error("Access token is missing. Please sign in again.");
    }
    const loanFacilities = poAccessToken ? await getLoanFacilities(poAccessToken) : [];

    const [nextCountries, nextCompanies, nextLoans, nextUsers, nextCompanyHistory, nextUserHistory] = await Promise.all([
      getCountries(poAccessToken),
      getCompanies(poAccessToken),
      Promise.resolve(loanFacilities),
      getUsers(poAccessToken),
      mockApi.getCompanyHistory(),
      mockApi.getUserHistory(),
    ])

    setCountries(
      nextCountries.map((country, index) => ({
        id: Number.parseInt(String(country.id), 10) || index + 1,
        name: country.name,
        countryCode: country.code,
      }))
    )

    setCompanies(
      nextCompanies.map((company) => ({
        id: company.id,
        name: company.name,
        sapCode: company.code,
        type: company.type,
        country: company.country,
        bankAccountDetails: company.bankAccountDetails,
        bankAccounts: Array.isArray(company.bankAccounts)
          ? company.bankAccounts.join(", ")
          : String(company.bankAccounts ?? ""),
      }))
    )

    setLoans(nextLoans)
    setUsers(
      nextUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        country: user.country ?? "",
      }))
    )

    setCompanyHistory(
      nextCompanyHistory.map((entry, index) => ({
        id: Number.parseInt(String(entry.id), 10) || index + 1,
        timestamp: entry.timestamp,
        action: mockCompanyHistoryAction(entry.action),
        createdBy: entry.userName || "System",
        companyName: companyNameFromMockCompanyHistory(entry.details),
        details: entry.details,
      })),
    )

    setUserHistory(
      nextUserHistory.map((entry, index) => ({
        id: Number.parseInt(String(entry.id), 10) || index + 1,
        timestamp: entry.timestamp,
        action: mockUserHistoryAction(entry.action),
        performedBy: entry.userName || "System",
        userName: userLabelFromMockUserHistory(entry.details),
        details: entry.details,
      })),
    )

    return { nextLoans };
  }, [])

  useEffect(() => {
    loadAllData().catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load data";
      setErrorMessage(message);
      toast.error(message);
    });
  }, [loadAllData]);

  useEffect(() => {
    const poAccessToken = localStorage.getItem("poAccessToken");
    if (!poAccessToken || !selectedLoanId) {
      return;
    }

    let isCancelled = false;

    getLoanFacilitySchedule(poAccessToken, String(selectedLoanId))
      .then((scheduleRows) => {
        if (isCancelled) {
          return;
        }

        setLoans((prevLoans) =>
          prevLoans.map((loan) =>
            String(loan.id) === String(selectedLoanId)
              ? { ...loan, schedule: scheduleRows }
              : loan,
          ),
        );
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to load loan facility schedule";
        setErrorMessage(message);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedLoanId]);

  const handleOpenLoanFacilityHistoryModal = useCallback(async () => {
    if (!selectedLoanId) {
      toast.error("Please select a Loan Facility first.");
      return;
    }

    const poAccessToken = localStorage.getItem("poAccessToken");
    if (!poAccessToken) {
      toast.error("Access token is missing. Please sign in again.");
      return;
    }

    setShowLoanFacilityHistoryModal(true);
    setIsLoanFacilityHistoryLoading(true);
    setLoanFacilityHistory([]);

    try {
      const historyRows = await getLoanFacilityHistory(poAccessToken, String(selectedLoanId));
      setLoanFacilityHistory(historyRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load loan facility history";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoanFacilityHistoryLoading(false);
    }
  }, [selectedLoanId]);


  const handleSaveLoanFacility = async () => {


     setErrorMessage(null)
    const existingLoanIds = new Set(loans.map((loan) => String(loan.id)));
    let createdLoanId = "";

    try {
      ensureEditor()
      if (!loanForm.facilityName.trim() || !loanForm.lenderCompanyId || !loanForm.borrowerCompanyId) {
        throw new Error('Loan name, lender and borrower are required')
      }

      if (!loanForm.agreementDate) {
        throw new Error('Agreement date is required')
      }

      const poAccessToken = localStorage.getItem("poAccessToken");
      if (!poAccessToken) {
        throw new Error("Access token is missing. Please sign in again.");
      }
      if (!isCreatingLoan && selectedLoanId) {
        const lenderCompanyId = Number(loanForm.lenderCompanyId);
        const borrowerCompanyId = Number(loanForm.borrowerCompanyId);
        if (!Number.isFinite(lenderCompanyId) || !Number.isFinite(borrowerCompanyId)) {
          throw new Error("Invalid lender/borrower company id. Please refresh and try again.");
        }

        await updateLoanFacility(poAccessToken, String(selectedLoanId), {
          name: loanForm.facilityName.trim(),
          lenderCompanyId,
          borrowerCompanyId,
          agreementDate: loanForm.agreementDate,
          currency: loanForm.currency,
          annualInterestRate: Number(loanForm.annualInterestRate),
          daysInYear: Number(loanForm.daysInYear),
          status: loanForm.status,
        });
        toast.success("Loan Facility updated successfully.");
      } else {
        const createdLoan = await createLoanFacility(poAccessToken, {
          name: loanForm.facilityName.trim(),
          lenderCompanyId: Number(loanForm.lenderCompanyId) || 0,
          borrowerCompanyId: Number(loanForm.borrowerCompanyId) || 0,
          agreementDate: loanForm.agreementDate,
          currency: loanForm.currency,
          annualInterestRate: Number(loanForm.annualInterestRate),
          daysInYear: Number(loanForm.daysInYear),
          status: loanForm.status,
        });
        toast.success("Loan Facility created successfully.");
        if (createdLoan?.id) {
          createdLoanId = String(createdLoan.id);
        }
      }

      setIsCreatingLoan(false)
      setShowLoanFacilityModal(false)
      const refreshedData = await loadAllData()
      if (isCreatingLoan) {
        const newlyCreatedLoan =
          (createdLoanId
            ? refreshedData.nextLoans.find(
                (loan) => String(loan.id) === String(createdLoanId),
              )
            : undefined) ??
          refreshedData.nextLoans.find(
            (loan) => !existingLoanIds.has(String(loan.id)),
          ) ??
          refreshedData.nextLoans.find(
            (loan) =>
              String(loan.name ?? "").trim() === loanForm.facilityName.trim() &&
              String(loan.borrowerCompanyId ?? "") === String(loanForm.borrowerCompanyId) &&
              String(loan.lenderCompanyId ?? "") === String(loanForm.lenderCompanyId),
          ) ??
          refreshedData.nextLoans.at(-1);

        if (newlyCreatedLoan?.id) {
          setSelectedLoanId(String(newlyCreatedLoan.id));
        }
      }
      if (!isCreatingLoan && selectedLoanId) {
        const latestSchedule = await getLoanFacilitySchedule(poAccessToken, String(selectedLoanId));
        setLoans((prevLoans) =>
          prevLoans.map((loan) =>
            String(loan.id) === String(selectedLoanId)
              ? { ...loan, schedule: latestSchedule }
              : loan
          )
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Loan save failed')
    }

    
    // if (
    //   !loanForm.facilityName.trim() ||
    //   !loanForm.status ||
    //   !loanForm.lender ||
    //   !loanForm.borrower ||
    //   !loanForm.agreementDate ||
    //   !loanForm.currency ||
    //   !loanForm.annualInterestRate.trim() ||
    //   !loanForm.daysInYear.trim()
    // ) {
    //   toast.error("Please fill in all Loan Facility fields.");
    //   return;
    // }

    // const lenderCompany = findCompanyByName(loanForm.lender);
    // const borrowerCompany = findCompanyByName(loanForm.borrower);

    // const fallbackLenderCompany =
    //   (selectedLoanFacility
    //     ? companies.find(
    //         (company) =>
    //           String(company.id) === String(selectedLoanFacility.lenderCompanyId)
    //       )
    //     : undefined) ?? companies[0];

    // const fallbackBorrowerCompany =
    //   (selectedLoanFacility
    //     ? companies.find(
    //         (company) =>
    //           String(company.id) === String(selectedLoanFacility.borrowerCompanyId)
    //       )
    //     : undefined) ?? companies[1] ?? companies[0];

    // const resolvedLenderCompany = lenderCompany ?? fallbackLenderCompany;
    // const resolvedBorrowerCompany = borrowerCompany ?? fallbackBorrowerCompany;

    // if (!resolvedLenderCompany || !resolvedBorrowerCompany) {
    //   toast.error("Please configure companies before saving Loan Facility.");
    //   return;
    // }

    // // if (!lenderCompany || !borrowerCompany) {
    // //   toast.error("Please select valid lender and borrower companies.");
    // //   return;
    // // }

    // const annualInterestRate = Number.parseFloat(loanForm.annualInterestRate);
    // const daysInYear = Number.parseInt(loanForm.daysInYear, 10);

    // if (!Number.isFinite(annualInterestRate) || !Number.isFinite(daysInYear)) {
    //   toast.error("Annual Interest Rate and Days in Year must be valid numbers.");
    //   return;
    // }

    // const now = new Date().toISOString();
    // const targetLoan = isCreatingLoan ? null : selectedLoanFacility;

    // const payload: LoanFacility = {
    //   id: targetLoan ? String(targetLoan.id) : String(Date.now()),
    //   name: loanForm.facilityName.trim(),
    //   status: loanForm.status as LoanFacility["status"],
    //   startDate: targetLoan?.startDate ?? loanForm.agreementDate,
    //   closeDate: targetLoan?.closeDate ?? "",
    //   lenderCompanyId: resolvedLenderCompany.id,
    //   borrowerCompanyId: resolvedBorrowerCompany.id,
    //   agreementDate: loanForm.agreementDate,
    //   currency: loanForm.currency as LoanFacility["currency"],
    //   annualInterestRate,
    //   daysInYear,
    //   schedule: targetLoan?.schedule ?? [],
    //   history: targetLoan?.history ?? [],
    //   createdAt: targetLoan?.createdAt ?? now,
    //   updatedAt: now,
    // };

    // setLoans((prev) => {
    //   const isEdit = prev.some((loan) => String(loan.id) === String(payload.id));
    //   if (isEdit) {
    //     return prev.map((loan) => (String(loan.id) === String(payload.id) ? payload : loan));
    //   }
    //   return [...prev, payload];
    // });

    // setSelectedLoanId(payload.id);
    // toast.success(targetLoan ? "Loan Facility updated successfully." : "Loan Facility added successfully.");
    // setIsCreatingLoan(false);
    // setShowLoanFacilityModal(false);
  };

  useEffect(() => {
    localStorage.setItem("theme-mode", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) {
      if (erpIframe) {
        root.style.backgroundColor = "#1D2636";
      } else if (isDarkMode) {
        root.style.backgroundColor = "#1F2937";
      } else {
        root.style.backgroundColor = "#F9FAFB";
      }
    }
  }, [erpIframe, isDarkMode]);

  return (
    <div
      className={`relative min-h-screen w-full ${
        isDarkMode
          ? "bg-[radial-gradient(circle_at_top,_#1f2a44_0%,_#0f172a_45%,_#0b1020_100%)]"
          : "bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#f8fafc_45%,_#eef2f7_100%)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-24 -left-20 h-72 w-72 rounded-full blur-3xl ${
            isDarkMode ? "bg-indigo-500/20" : "bg-indigo-300/40"
          }`}
        />
        <div
          className={`absolute top-1/3 -right-24 h-80 w-80 rounded-full blur-3xl ${
            isDarkMode ? "bg-cyan-500/10" : "bg-cyan-200/50"
          }`}
        />
      </div>
      <div className={`5xl:mx-auto 5xl:w-full h-full px-5 sm:px-10 py-6 ${isDarkMode ? "text-white" : "text-black"}`}>
        <div
          className={`flex flex-wrap justify-between items-center mb-6 gap-4 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur
  ${erpIframe || isDarkMode ? "text-white" : "text-black"}
  ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white/70"}
  ${erpIframe && sidebarCollapsed ? "ml-10" : ""}
`}
        >
          <h4 className="text-lg font-semibold tracking-tight">Loans and Transfers Management Board</h4>
          <div className="flex-wrap inline-flex gap-1 sm:gap-3" role="group">
            {/* { role === "Super Admin" && (
                            <a href="/auth?admin=1" className="w-fit px-4 py-2 text-sm font-medium text-white bg-[#1D2636] border border-[#1D2636] rounded-xl focus:z-10 hover:opacity-90 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] active:bg-white active:text-black active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] transition duration-150 ease-in-out focus:outline-none focus:ring-0">
                                Open Admin Portal
                            </a>
                        )} */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-200 hover:bg-gray-300 text-indigo-600"
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`mb-5 inline-flex gap-2 rounded-xl border p-1 ${
            isDarkMode ? "border-gray-700/80 bg-gray-800/70" : "border-gray-200 bg-white/80"
          }`}
        >
          
          {isAdminUser && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "admin"
                  ? isDarkMode
                    ? "bg-indigo-500/20 text-indigo-300 shadow-inner"
                    : "bg-indigo-50 text-indigo-700 shadow-sm"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-800 hover:bg-slate-50"
              }`}
            >
              Admin
            </button>
          )}

          <button
            onClick={() => setActiveTab("loan-facility")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "loan-facility"
                ? isDarkMode
                  ? "bg-indigo-500/20 text-indigo-300 shadow-inner"
                  : "bg-indigo-50 text-indigo-700 shadow-sm"
                : isDarkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                : "text-gray-600 hover:text-gray-800 hover:bg-slate-50"
            }`}
          >
            Loan Facility
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "report"
                ? isDarkMode
                  ? "bg-indigo-500/20 text-indigo-300 shadow-inner"
                  : "bg-indigo-50 text-indigo-700 shadow-sm"
                : isDarkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                : "text-gray-600 hover:text-gray-800 hover:bg-slate-50"
            }`}
          >
            Report
          </button>
        </div>

        {/* Loan Facility Tab */}
        {activeTab === "loan-facility" && (
          <LoanFacilityTab
            isDarkMode={isDarkMode}
            isCreatingLoan={isCreatingLoan}
            visibleLoans={visibleLoans}
            selectedLoanId={selectedLoanId}
            setSelectedLoanId={setSelectedLoanId}
            setIsCreatingLoan={setIsCreatingLoan}
            showOnlyActiveLoanFacilities={showOnlyActiveLoanFacilities}
            setShowOnlyActiveLoanFacilities={setShowOnlyActiveLoanFacilities}
            handleNewLoanFacility={handleNewLoanFacility}
            handleEditLoanFacility={handleEditLoanFacility}
            handleDeleteLoanFacility={handleDeleteLoanFacility}
            exportLoanFacilityToExcel={exportLoanFacilityToExcel}
            exportLoanFacilityToPDF={exportLoanFacilityToPDF}
            onOpenLoanFacilityHistoryModal={handleOpenLoanFacilityHistoryModal}
            setShowLoanFacilityHistoryModal={setShowLoanFacilityHistoryModal}
            showLoanFacilityHistoryModal={showLoanFacilityHistoryModal}
            loanFacilityHistory={loanFacilityHistory}
            isLoanFacilityHistoryLoading={isLoanFacilityHistoryLoading}
            showLoanFacilityModal={showLoanFacilityModal}
            setShowLoanFacilityModal={setShowLoanFacilityModal}
            loanForm={loanForm}
            setLoanForm={setLoanForm}
            companies={companies}
            handleSaveLoanFacility={handleSaveLoanFacility}
            selectedLoanFacility={selectedLoanFacility}
            loanFacilityFieldValue={loanFacilityFieldValue}
            handleOpenAddScheduleRowModal={handleOpenAddScheduleRowModal}
            openImportScheduleModal={openImportScheduleModal}
            calculatedRows={calculatedRows}
            scheduleColumnDefs={scheduleColumnDefs}
            isImportScheduleModalOpen={isImportScheduleModalOpen}
            downloadScheduleImportTemplate={downloadScheduleImportTemplate}
            triggerScheduleImportFile={triggerScheduleImportFile}
            importScheduleFile={importScheduleFile}
            scheduleImportInputRef={scheduleImportInputRef}
            handleScheduleImportFileChange={handleScheduleImportFileChange}
            importScheduleMode={importScheduleMode}
            setImportScheduleMode={setImportScheduleMode}
            errorMessage={errorMessage}
            closeImportScheduleModal={closeImportScheduleModal}
            handleImportSchedule={handleImportSchedule}
            showScheduleRowModal={showScheduleRowModal}
            onCloseScheduleRowModal={closeScheduleRowModal}
            scheduleRowModalTitle={
              editingScheduleRowId ? "Edit Schedule Row" : "Add Schedule Row"
            }
            scheduleRowSubmitLabel={editingScheduleRowId ? "Update Row" : "Save Row"}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            availableLenderBankAccounts={availableLenderBankAccounts}
            availableBorrowerBankAccounts={availableBorrowerBankAccounts}
            handleSaveScheduleRow={handleSaveScheduleRow}
          />
        )}

        {activeTab === "report" && (
          <ReportTab
            isDarkMode={isDarkMode}
            loans={loans}
            companies={companies}
          />
        )}

        {/* Admin Tab */}
        {activeTab === "admin" && isAdminUser && (
          <div
            className={`rounded-xl border shadow-sm p-5 sm:p-6 ${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className={`rounded-lg p-8 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Companies and Shareholders</h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => handleOpenModal()}
                    className={companyHeaderButtonClass}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Company
                  </button>
                  <button
                    onClick={exportCompaniesToExcel}
                    className={companyHeaderButtonClass}
                  >
                    <TableCellsIcon className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button
                    onClick={downloadCompanyImportTemplate}
                    className={companyHeaderButtonClass}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Template
                  </button>
                  <button
                    onClick={openImportCompanyModal}
                    className={companyHeaderButtonClass}
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Import Excel
                  </button>
                  <button
                    onClick={handleOpenCompanyHistoryModal}
                    title="History Log"
                    className={`group inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all shadow-sm hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                      isDarkMode
                        ? "bg-indigo-500/15 border-indigo-400/35 text-indigo-300 hover:bg-indigo-500/25 focus-visible:ring-indigo-400"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-300"
                    }`}
                  >
                    <ClockIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    <span>History Log</span>
                  </button>
                </div>
              </div>

              {isImportCompanyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className={`rounded-lg p-6 w-full max-w-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h3 className="text-xl font-semibold mb-4">Import Companies</h3>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={downloadCompanyImportTemplate}
                          className={companyHeaderButtonClass}
                        >
                          Download Template
                        </button>
                        <button
                          type="button"
                          onClick={triggerCompanyImportFile}
                          className={companyHeaderButtonClass}
                        >
                          File Import
                        </button>
                        <input
                          ref={companyImportInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleCompanyImportFileChange}
                          className="hidden"
                        />
                      </div>

                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {importCompanyFile
                          ? `File (.xlsx, .xls, .csv): ${importCompanyFile.name}`
                          : "File (.xlsx, .xls, .csv)"}
                      </div>

                      {importCompanyError && (
                        <div className="text-sm text-red-500">{importCompanyError}</div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportCompanyModalOpen(false);
                          setImportCompanyError(null);
                          setImportCompanyFile(null);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-black"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCompanyImport}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          isDarkMode
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className={`overflow-x-auto rounded-xl border shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-900/30" : "border-gray-200 bg-white"}`}>
                <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700/80 border-gray-600"
                        : "bg-slate-100 border-gray-300"
                    } border-b`}
                  >
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        ID
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Name
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        SAP Code
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Type
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Country
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Bank Accounts
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className={`px-6 py-8 text-center text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          No companies found. Click "Add Companies" to create one.
                        </td>
                      </tr>
                    ) : (
                      pagedCompanies.map((company) => (
                        <tr
                          key={company.id}
                          className={`border-b ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-700/50"
                              : "border-gray-200 hover:bg-gray-100"
                          } transition`}
                        >
                          <td
                            className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {company.id}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {company.name}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {company.sapCode}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {company.type}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {company.country}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {company.bankAccounts}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal(company)}
                                className={tableEditButtonClass}
                                title="Edit"
                              >
                                <PencilIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(company.id)}
                                className={tableDeleteButtonClass}
                                title="Delete"
                              >
                                <TrashIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {companies.length > 0 && (
                <div className={`flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Showing{" "}
                    <span className="font-semibold">
                      {companiesPage * ADMIN_TABLE_PAGE_SIZE + 1}
                    </span>
                    {" "}-{" "}
                    <span className="font-semibold">
                      {Math.min(companies.length, (companiesPage + 1) * ADMIN_TABLE_PAGE_SIZE)}
                    </span>{" "}
                    of <span className="font-semibold">{companies.length}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCompaniesPage((p) => Math.max(0, p - 1))}
                      disabled={companiesPage === 0}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        companiesPage === 0
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Prev
                    </button>
                    <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Page {companiesPage + 1} of {companiesTotalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompaniesPage((p) => Math.min(companiesTotalPages - 1, p + 1))}
                      disabled={companiesPage >= companiesTotalPages - 1}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        companiesPage >= companiesTotalPages - 1
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div
                  className={`rounded-lg p-6 w-full max-w-2xl ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3 className="text-xl font-semibold mb-4">
                    {editingId ? "Edit Company" : "Add Company"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter company name"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        SAP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.sapCode}
                        onChange={(e) => setFormData({ ...formData, sapCode: e.target.value })}
                        placeholder="Enter SAP code"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select company type</option>
                        <option value="Internal">Internal</option>
                        <option value="Shareholder">Shareholder</option>
                        <option value="3rd Party">3rd Party</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select country</option>
                        {countryOptions.map((countryName) => (
                          <option key={`company-country-${countryName}`} value={countryName}>
                            {countryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Accounts <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {formData.bankAccounts.map((account, index) => (
                          <div key={`bank-account-${index}`} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={account}
                              onChange={(e) =>
                                setFormData((previous) => ({
                                  ...previous,
                                  bankAccounts: previous.bankAccounts.map((item, itemIndex) =>
                                    itemIndex === index ? e.target.value : item
                                  ),
                                }))
                              }
                              placeholder="e.g. Barclays GBP 30958472"
                              className={`w-full px-3 py-2 border rounded-lg ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                  : "bg-white border-gray-300 text-black placeholder-gray-500"
                              }`}
                            />
                            <button
                              type="button"
                              disabled={formData.bankAccounts.length === 1}
                              onClick={() =>
                                setFormData((previous) => ({
                                  ...previous,
                                  bankAccounts:
                                    previous.bankAccounts.length === 1
                                      ? previous.bankAccounts
                                      : previous.bankAccounts.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                                formData.bankAccounts.length === 1
                                  ? isDarkMode
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : isDarkMode
                                  ? "bg-red-600/20 hover:bg-red-600/30 text-red-300"
                                  : "bg-red-100 hover:bg-red-200 text-red-700"
                              }`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((previous) => ({
                              ...previous,
                              bankAccounts: [...previous.bankAccounts, ""],
                            }))
                          }
                          className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                            isDarkMode
                              ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                              : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                          }`}
                        >
                          Add account
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-black"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isCompanyActionButtonDisabled}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isCompanyActionButtonDisabled
                          ? isDarkMode
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {editingId ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCompanyHistoryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div
                  className={`rounded-lg p-6 w-full max-w-4xl h-[80vh] flex flex-col ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Company Change History</h3>
                    <button
                      type="button"
                      onClick={() => setShowCompanyHistoryModal(false)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-black"
                      }`}
                    >
                      Close
                    </button>
                  </div>

                  <div
                    className={`rounded-lg border overflow-y-auto flex-1 p-3 space-y-3 ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    {isCompanyHistoryLoading ? (
                      <p
                        className={`px-2 py-8 text-center text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Loading history...
                      </p>
                    ) : companyHistory.length === 0 ? (
                      <p
                        className={`px-2 py-8 text-center text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        No history yet.
                      </p>
                    ) : (
                      companyHistory.map((entry) => {
                        const rawAction = entry.action;
                        const badgeClass =
                          rawAction === "ADD" || rawAction === "IMPORT"
                            ? isDarkMode
                              ? "bg-emerald-900/45 text-emerald-200 border border-emerald-700"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : rawAction === "DELETE"
                              ? isDarkMode
                                ? "bg-rose-900/45 text-rose-200 border border-rose-700"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                              : isDarkMode
                                ? "bg-sky-900/45 text-sky-200 border border-sky-700"
                                : "bg-sky-50 text-sky-800 border border-sky-200";

                        const parsedTime = new Date(entry.timestamp);
                        const timeLabel = Number.isNaN(parsedTime.getTime())
                          ? entry.timestamp || "—"
                          : parsedTime.toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            });

                        return (
                          <article
                            key={entry.id}
                            className={`rounded-lg border p-4 text-sm ${
                              isDarkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                                {timeLabel}
                              </span>
                              <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>
                                ·
                              </span>
                              <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>
                                {entry.createdBy || "System"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}
                              >
                                <ClockIcon className="w-3 h-3 shrink-0 opacity-90" />
                                {entry.action}
                              </span>
                              {entry.entityType ? (
                                <span
                                  className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${
                                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {entry.entityType}
                                  {entry.entityId ? ` #${entry.entityId}` : ""}
                                </span>
                              ) : entry.entityId ? (
                                <span
                                  className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${
                                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  company #{entry.entityId}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {entry.companyName}
                            </p>
                            <p
                              className={`mt-2 font-medium ${
                                isDarkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              {entry.details || "—"}
                            </p>
                            <CompanyHistoryAuditBlock entry={entry} isDarkMode={isDarkMode} />
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-lg p-8 mt-8 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Countries</h2>
                <button
                  onClick={() => handleOpenCountryModal()}
                  className={companyHeaderButtonClass}
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Country
                </button>
              </div>

              <div className={`overflow-x-auto rounded-xl border shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-900/30" : "border-gray-200 bg-white"}`}>
                <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700/80 border-gray-600"
                        : "bg-slate-100 border-gray-300"
                    } border-b`}
                  >
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        ID
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Name
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Country Code
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {countries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-6 py-8 text-center text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          No countries found. Click "Add Country" to create one.
                        </td>
                      </tr>
                    ) : (
                      pagedCountries.map((country) => (
                        <tr
                          key={country.id}
                          className={`border-b ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-700/50"
                              : "border-gray-200 hover:bg-gray-100"
                          } transition`}
                        >
                          <td
                            className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {country.id}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {country.name}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {country.countryCode}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenCountryModal(country)}
                                className={tableEditButtonClass}
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCountry(country.id)}
                                className={tableDeleteButtonClass}
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {countries.length > 0 && (
                <div className={`flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Showing{" "}
                    <span className="font-semibold">
                      {countriesPage * ADMIN_TABLE_PAGE_SIZE + 1}
                    </span>
                    {" "}-{" "}
                    <span className="font-semibold">
                      {Math.min(countries.length, (countriesPage + 1) * ADMIN_TABLE_PAGE_SIZE)}
                    </span>{" "}
                    of <span className="font-semibold">{countries.length}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCountriesPage((p) => Math.max(0, p - 1))}
                      disabled={countriesPage === 0}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        countriesPage === 0
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Prev
                    </button>
                    <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Page {countriesPage + 1} of {countriesTotalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCountriesPage((p) => Math.min(countriesTotalPages - 1, p + 1))}
                      disabled={countriesPage >= countriesTotalPages - 1}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        countriesPage >= countriesTotalPages - 1
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showCountryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div
                  className={`rounded-lg p-6 w-full max-w-md ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3 className="text-xl font-semibold mb-4">
                    {editingCountryId !== null ? "Edit Country" : "Add Country"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Country Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={countryFormData.name}
                        onChange={(e) => setCountryFormData({ ...countryFormData, name: e.target.value })}
                        placeholder="Enter country name"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Country Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={countryFormData.countryCode}
                        onChange={(e) => setCountryFormData({ ...countryFormData, countryCode: e.target.value })}
                        placeholder="Enter country code"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCountryModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-black"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCountry}
                      disabled={isCountryActionButtonDisabled}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isCountryActionButtonDisabled
                          ? isDarkMode
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {editingCountryId !== null ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Section */}
            <div className={`rounded-lg p-8 mt-8 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Users</h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => handleOpenUserModal()}
                    className={userHeaderButtonClass}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add User
                  </button>
                  <button onClick={exportUsersToExcel} className={userHeaderButtonClass}>
                    <TableCellsIcon className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button onClick={downloadUserTemplate} className={userHeaderButtonClass}>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Template
                  </button>
                  <button onClick={openImportUserModal} className={userHeaderButtonClass}>
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Import Excel
                  </button>
                  <button
                    onClick={handleOpenUserHistoryModal}
                    title="User History Log"
                    className={`group inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all shadow-sm hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                      isDarkMode
                        ? "bg-indigo-500/15 border-indigo-400/35 text-indigo-300 hover:bg-indigo-500/25 focus-visible:ring-indigo-400"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-300"
                    }`}
                  >
                    <ClockIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    <span>History Log</span>
                  </button>
                  <input
                    ref={userImportInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleUserImportFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {isImportUserModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className={`rounded-lg p-6 w-full max-w-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h3 className="text-xl font-semibold mb-4">Import Users</h3>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={downloadUserTemplate}
                          className={userHeaderButtonClass}
                        >
                          Download Template
                        </button>
                        <button
                          type="button"
                          onClick={triggerUserImport}
                          className={userHeaderButtonClass}
                        >
                          File Import
                        </button>
                      </div>

                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {importUserFile
                          ? `File (.xlsx, .xls, .csv): ${importUserFile.name}`
                          : "File (.xlsx, .xls, .csv)"}
                      </div>

                      {importUserError && (
                        <div className="text-sm text-red-500">{importUserError}</div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportUserModalOpen(false);
                          setImportUserError(null);
                          setImportUserFile(null);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-black"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUserImport}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          isDarkMode
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className={`overflow-x-auto rounded-xl border shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-900/30" : "border-gray-200 bg-white"}`}>
                <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700/80 border-gray-600"
                        : "bg-slate-100 border-gray-300"
                    } border-b`}
                  >
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        First Name
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Last Name
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Email Address
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Role
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Country
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className={`px-6 py-8 text-center text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          No users found. Click "Add User" to create one.
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-700/50"
                              : "border-gray-200 hover:bg-gray-100"
                          } transition`}
                        >
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {user.firstName}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {user.lastName}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {user.email}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {user.role}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {user.country}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenUserModal(user)}
                                className={tableEditButtonClass}
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className={tableDeleteButtonClass}
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="text-xs">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {users.length > 0 && (
                <div className={`flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Showing{" "}
                    <span className="font-semibold">
                      {usersPage * ADMIN_TABLE_PAGE_SIZE + 1}
                    </span>
                    {" "}-{" "}
                    <span className="font-semibold">
                      {Math.min(users.length, (usersPage + 1) * ADMIN_TABLE_PAGE_SIZE)}
                    </span>{" "}
                    of <span className="font-semibold">{users.length}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.max(0, p - 1))}
                      disabled={usersPage === 0}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        usersPage === 0
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Prev
                    </button>
                    <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Page {usersPage + 1} of {usersTotalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.min(usersTotalPages - 1, p + 1))}
                      disabled={usersPage >= usersTotalPages - 1}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                        usersPage >= usersTotalPages - 1
                          ? isDarkMode
                            ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showUserHistoryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div
                  className={`rounded-lg p-6 w-full max-w-4xl h-[80vh] flex flex-col ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">User Change History</h3>
                    <button
                      type="button"
                      onClick={() => setShowUserHistoryModal(false)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-black"
                      }`}
                    >
                      Close
                    </button>
                  </div>

                  <div
                    className={`rounded-lg border overflow-y-auto flex-1 p-3 space-y-3 ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    {isUserHistoryLoading ? (
                      <p
                        className={`px-2 py-8 text-center text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Loading history...
                      </p>
                    ) : userHistory.length === 0 ? (
                      <p
                        className={`px-2 py-8 text-center text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        No history yet.
                      </p>
                    ) : (
                      userHistory.map((entry) => {
                        const rawAction = entry.action;
                        const badgeClass =
                          rawAction === "ADD" || rawAction === "IMPORT"
                            ? isDarkMode
                              ? "bg-emerald-900/45 text-emerald-200 border border-emerald-700"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : rawAction === "DELETE"
                              ? isDarkMode
                                ? "bg-rose-900/45 text-rose-200 border border-rose-700"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                              : isDarkMode
                                ? "bg-sky-900/45 text-sky-200 border border-sky-700"
                                : "bg-sky-50 text-sky-800 border border-sky-200";

                        const parsedTime = new Date(entry.timestamp);
                        const timeLabel = Number.isNaN(parsedTime.getTime())
                          ? entry.timestamp || "—"
                          : parsedTime.toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            });

                        return (
                          <article
                            key={entry.id}
                            className={`rounded-lg border p-4 text-sm ${
                              isDarkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                                {timeLabel}
                              </span>
                              <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>
                                ·
                              </span>
                              <span className={isDarkMode ? "text-gray-200" : "text-gray-800"}>
                                {entry.performedBy || "System"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}
                              >
                                <ClockIcon className="w-3 h-3 shrink-0 opacity-90" />
                                {entry.action}
                              </span>
                              {entry.entityType ? (
                                <span
                                  className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${
                                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {entry.entityType}
                                  {entry.entityId ? ` #${entry.entityId}` : ""}
                                </span>
                              ) : entry.entityId ? (
                                <span
                                  className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${
                                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  user #{entry.entityId}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {entry.userName}
                            </p>
                            <p
                              className={`mt-2 font-medium ${
                                isDarkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              {entry.details || "—"}
                            </p>
                            <UserHistoryAuditBlock entry={entry} isDarkMode={isDarkMode} />
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit User Modal */}
            {showUserModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div
                  className={`rounded-lg p-6 w-full max-w-2xl ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3 className="text-xl font-semibold mb-4">
                    {editingUserId ? "Edit User" : "Add User"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userFormData.firstName}
                        onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                        placeholder="Enter first name"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userFormData.lastName}
                        onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="Enter email address"
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select a role</option>
                        <option value="Viewer">Viewer</option>
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={userFormData.country}
                        onChange={(e) => setUserFormData({ ...userFormData, country: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select country</option>
                        {countryOptions.map((countryName) => (
                          <option key={`user-country-${countryName}`} value={countryName}>
                            {countryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-black"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUser}
                      disabled={isUserActionButtonDisabled}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isUserActionButtonDisabled
                          ? isDarkMode
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {editingUserId ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {dialog}
      {/* {promptDialog} */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
        transition={Bounce}
        toastClassName={"w-full"}
      />
    </div>
  );
}
