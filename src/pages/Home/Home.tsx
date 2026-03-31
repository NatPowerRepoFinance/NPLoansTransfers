import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ITooltipParams } from "ag-grid-community";
import { Bounce, toast, ToastContainer } from "react-toastify";
import dummyData from "@/lib/api/dummyRisks.json";
import {
  ScheduleItem,
  LoanFacility,
} from "../../utils/constants";
import { TrashIcon, MoonIcon, SunIcon, PlusIcon, PencilIcon, ClockIcon } from "@heroicons/react/24/outline";
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
import { getLoanFacilities } from "@/api";


export interface Company {
  id: string;
  name: string;
  sapCode: string;
  type: string;
  country: string;
  bankAccounts: string;
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

interface CompanyHistoryEntry {
  id: number;
  timestamp: string;
  action: "ADD" | "EDIT" | "DELETE" | "IMPORT";
  companyName: string;
  details: string;
}

interface UserHistoryEntry {
  id: number;
  timestamp: string;
  action: "ADD" | "EDIT" | "DELETE" | "IMPORT";
  userName: string;
  details: string;
}

export const toolTipValueGetter = (params: ITooltipParams) =>
  params.value == null || params.value === "" ? "- Missing -" : params.value;

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
  const [, setIsCreatingLoan] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('')
  const [loans, setLoans] = useState<LoanFacility[]>([])

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
    },
    {
      id: "2",
      name: "Natpower Trading Solutions",
      sapCode: "SAP002",
      type: "Subsidiary",
      country: "India",
      bankAccounts: "IN55NATP000987654321",
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({ firstName: "", lastName: "", email: "", role: "", country: "" });
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
  const [countryFormData, setCountryFormData] = useState({ name: "", countryCode: "" });
  const [showCompanyHistoryModal, setShowCompanyHistoryModal] = useState(false);
  const [companyHistory, setCompanyHistory] = useState<CompanyHistoryEntry[]>([]);
  const [showLoanFacilityHistoryModal, setShowLoanFacilityHistoryModal] = useState(false);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [userHistory, setUserHistory] = useState<UserHistoryEntry[]>([]);
  const [showScheduleRowModal, setShowScheduleRowModal] = useState(false);
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
    "flex items-center justify-center gap-1.5 h-8 px-3 min-w-[130px] rounded-lg text-xs font-medium transition bg-[#1d2636] hover:bg-[#27354d] text-white";
  const userHeaderButtonClass =
    "flex items-center justify-center gap-1.5 h-8 px-3 min-w-[130px] rounded-lg text-xs font-medium transition bg-[#1d2636] hover:bg-[#27354d] text-white";


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
        companyName,
        details,
      },
      ...prev,
    ]);
  };

  const addUserHistoryEntry = (
    action: UserHistoryEntry["action"],
    userName: string,
    details: string
  ) => {
    setUserHistory((prev) => [
      {
        id: prev.length + 1,
        timestamp: new Date().toISOString(),
        action,
        userName,
        details,
      },
      ...prev,
    ]);
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingId(company.id);
      setFormData({
        name: company.name,
        sapCode: company.sapCode,
        type: company.type,
        country: company.country,
        bankAccounts:
          company.bankAccounts
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean).length > 0
            ? company.bankAccounts
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [""],
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: [""] });
    }
    setShowModal(true);
  };

  const handleSave = () => {
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
      const existingCompany = companies.find((c) => c.id === editingId);
      setCompanies(
        companies.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name,
                sapCode: formData.sapCode,
                type: formData.type,
                country: formData.country,
                bankAccounts: normalizedBankAccounts.join(", "),
              }
            : c
        )
      );
      addCompanyHistoryEntry(
        "EDIT",
        formData.name,
        `Updated company ${existingCompany?.name || formData.name}`
      );
      toast.success("Company updated successfully");
    } else {
      const nextId = companies.length > 0 ? String(Math.max(...companies.map((c) => Number(c.id))) + 1) : "1";
      const companyToAdd: Company = {
        id: nextId,
        name: formData.name,
        sapCode: formData.sapCode,
        type: formData.type,
        country: formData.country,
        bankAccounts: normalizedBankAccounts.join(", "),
      };
      setCompanies([
        ...companies,
        companyToAdd,
      ]);
      addCompanyHistoryEntry("ADD", companyToAdd.name, `Added company ${companyToAdd.name}`);
      toast.success("Company added successfully");
    }

    setShowModal(false);
    setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: [""] });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      const companyToDelete = companies.find((c) => c.id === id);
      setCompanies(companies.filter((c) => c.id !== id));
      if (companyToDelete) {
        addCompanyHistoryEntry(
          "DELETE",
          companyToDelete.name,
          `Deleted company ${companyToDelete.name}`
        );
      }
      toast.success("Company deleted successfully");
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

  const handleSaveUser = () => {
    if (!userFormData.firstName.trim() || !userFormData.lastName.trim() || !userFormData.email.trim() || !userFormData.role.trim() || !userFormData.country.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingUserId) {
      const existingUser = users.find((u) => u.id === editingUserId);
      setUsers(
        users.map((u) =>
          u.id === editingUserId ? { ...u, firstName: userFormData.firstName, lastName: userFormData.lastName, email: userFormData.email, role: userFormData.role, country: userFormData.country } : u
        )
      );
      addUserHistoryEntry(
        "EDIT",
        `${userFormData.firstName} ${userFormData.lastName}`,
        `Updated user ${existingUser?.firstName || userFormData.firstName}`
      );
      toast.success("User updated successfully");
    } else {
      const userToAdd: User = {
        id: Date.now().toString(),
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        email: userFormData.email,
        role: userFormData.role,
        country: userFormData.country,
      };
      setUsers([
        ...users,
        userToAdd,
      ]);
      addUserHistoryEntry("ADD", `${userToAdd.firstName} ${userToAdd.lastName}`, `Added user ${userToAdd.firstName} ${userToAdd.lastName}`);
      toast.success("User added successfully");
    }

    setShowUserModal(false);
    setUserFormData({ firstName: "", lastName: "", email: "", role: "", country: "" });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const userToDelete = users.find((u) => u.id === id);
      setUsers(users.filter((u) => u.id !== id));
      if (userToDelete) {
        addUserHistoryEntry(
          "DELETE",
          `${userToDelete.firstName} ${userToDelete.lastName}`,
          `Deleted user ${userToDelete.firstName} ${userToDelete.lastName}`
        );
      }
      toast.success("User deleted successfully");
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

  const handleSaveCountry = () => {
    if (!countryFormData.name.trim() || !countryFormData.countryCode.trim()) {
      toast.error("Please fill in all country fields");
      return;
    }

    const normalizedCode = countryFormData.countryCode.trim().toUpperCase();

    if (editingCountryId !== null) {
      setCountries(
        countries.map((country) =>
          country.id === editingCountryId
            ? {
                ...country,
                name: countryFormData.name.trim(),
                countryCode: normalizedCode,
              }
            : country
        )
      );
      toast.success("Country updated successfully");
    } else {
      const nextId = countries.length > 0 ? Math.max(...countries.map((country) => country.id)) + 1 : 1;
      setCountries([
        ...countries,
        {
          id: nextId,
          name: countryFormData.name.trim(),
          countryCode: normalizedCode,
        },
      ]);
      toast.success("Country added successfully");
    }

    setShowCountryModal(false);
    setCountryFormData({ name: "", countryCode: "" });
  };

  const handleDeleteCountry = (id: number) => {
    if (window.confirm("Are you sure you want to delete this country?")) {
      setCountries(countries.filter((country) => country.id !== id));
      toast.success("Country deleted successfully");
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

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-GB");
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

  const availableBankAccounts = useMemo(() => {
    const accounts = companies.flatMap((company) =>
      String(company.bankAccounts ?? "")
        .split(",")
        .map((account) => account.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(accounts));
  }, [companies]);

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
    resetScheduleForm();
    setShowScheduleRowModal(true);
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
      const user = ensureEditor();
      const updatedLoan = await mockApi.createScheduleItem(
        String(selectedLoanId),
        {
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          lenderBankAccount: scheduleForm.lenderBankAccount,
          borrowerBankAccount: scheduleForm.borrowerBankAccount,
          annualInterestRate,
          drawDown,
          repayment,
          fees,
        },
        user,
      );

      setLoans((prevLoans) =>
        prevLoans.map((loan) =>
          String(loan.id) === String(updatedLoan.id) ? updatedLoan : loan
        )
      );

      setShowScheduleRowModal(false);
      toast.success("Schedule row added successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add schedule row."
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


  const readCellValue = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
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
      const data = await importScheduleFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      const importedRows: ScheduleItem[] = rows
        .map((row, index) => {
          const startDate = readCellValue(row, ["Start Date", "startDate", "start_date"]);
          const endDate = readCellValue(row, ["End Date", "endDate", "end_date"]);
          const lenderBankAccount = readCellValue(row, [
            "Lender Bank Account",
            "lenderBankAccount",
            "lender_bank_account",
          ]);
          const borrowerBankAccount = readCellValue(row, [
            "Borrower Bank Account",
            "borrowerBankAccount",
            "borrower_bank_account",
          ]);

          const annualInterestRate = Number(
            readCellValue(row, [
              "Annual Interest Rate %",
              "annualInterestRate",
              "annual_interest_rate",
            ]) || selectedLoanFacility?.annualInterestRate || 0
          );
          const drawDown = Number(
            readCellValue(row, ["Draw Down", "drawDown", "draw_down"]) || 0
          );
          const repayment = Number(
            readCellValue(row, ["Repayment", "repayment"]) || 0
          );
          const fees = Number(readCellValue(row, ["Fees", "fees"]) || 0);

          if (!startDate || !endDate || !lenderBankAccount || !borrowerBankAccount) {
            return null;
          }

          return {
            id: `${Date.now()}-${index}`,
            startDate,
            endDate,
            lenderBankAccount,
            borrowerBankAccount,
            annualInterestRate: Number.isNaN(annualInterestRate)
              ? Number(selectedLoanFacility?.annualInterestRate ?? 0)
              : annualInterestRate,
            drawDown: Number.isNaN(drawDown) ? 0 : drawDown,
            repayment: Number.isNaN(repayment) ? 0 : repayment,
            fees: Number.isNaN(fees) ? 0 : fees,
            updatedAt: new Date().toISOString(),
          } as ScheduleItem;
        })
        .filter((row): row is ScheduleItem => row !== null);

      if (importedRows.length === 0) {
        toast.error("No valid schedule rows found in the selected file.");
        return;
      }

      setLoans((prevLoans) =>
        prevLoans.map((loan) => {
          if (String(loan.id) !== String(selectedLoanId)) {
            return loan;
          }

          return {
            ...loan,
            schedule:
              importScheduleMode === "overwrite"
                ? importedRows
                : [...(loan.schedule ?? []), ...importedRows],
            updatedAt: new Date().toISOString(),
          };
        })
      );

      closeImportScheduleModal();
      toast.success(`${importedRows.length} schedule row(s) imported successfully.`);
    } catch (error) {
      console.error("Failed to import schedule file", error);
      setErrorMessage("Failed to import schedule file.");
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
        row?.annualInterestRate ?? currentLoan?.annualInterestRate ?? 0
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
        scheduleIndex: Number(row?.scheduleIndex ?? index + 1),
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
  }, [isViewer, canEdit, canDelete, isDarkMode]);

  const editSchedule = (row: DrawDownRow) => {
    toast.info(`Edit for schedule row ${row.scheduleIndex} is not implemented yet.`);
  };

  const deleteSchedule = (row: DrawDownRow) => {
    toast.info(
      `Delete for schedule row ${row.scheduleIndex} is not implemented yet.`
    );
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
    if (visibleLoans.length === 0) {
      setSelectedLoanId("");
      return;
    }

    const stillVisible = visibleLoans.some(
      (loan) => String(loan.id) === String(selectedLoanId)
    );

    if (!selectedLoanId || !stillVisible) {
      const fallbackId = String(visibleLoans[0].id);
      setSelectedLoanId(fallbackId);
    }
  }, [selectedLoanId, visibleLoans]);

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


  
  const handleNewLoanFacility = () => {
    setIsCreatingLoan(true);
    setSelectedLoanId("");
   
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

    setLoans((prev) => prev.filter((loan) => String(loan.id) !== String(selectedLoanId)));
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
        Lender: loanFacilityFieldValue(["lender", "lenderName"]),
        Borrower: loanFacilityFieldValue(["borrower", "borrowerName"]),
        "Agreement Date": loanFacilityFieldValue(["agreementDate", "agreement_date"], "-"),
        Currency: loanFacilityFieldValue(["currency"]),
        "Annual Interest Rate %": loanFacilityFieldValue(
          ["annualInterestRate", "annual_interest_rate"],
          "0"
        ),
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

    autoTable(doc, {
      startY: 22,
      head: [["Field", "Value"]],
      body: [
        ["Status", loanFacilityFieldValue(["status"])],
        ["Lender", loanFacilityFieldValue(["lender", "lenderName"])],
        ["Borrower", loanFacilityFieldValue(["borrower", "borrowerName"])],
        [
          "Agreement Date",
          loanFacilityFieldValue(["agreementDate", "agreement_date"], "-"),
        ],
        ["Currency", loanFacilityFieldValue(["currency"])],
        [
          "Annual Interest Rate %",
          loanFacilityFieldValue(["annualInterestRate", "annual_interest_rate"], "0"),
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
    const loanFacilities = poAccessToken ? await getLoanFacilities(poAccessToken) : [];

    const [nextCountries, nextCompanies, nextLoans, nextUsers, nextCompanyHistory, nextUserHistory] = await Promise.all([
      mockApi.getCountries(),
      mockApi.getCompanies(),
      Promise.resolve(loanFacilities),
      mockApi.getUsers(),
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
        action:
          entry.action === "ADD" ||
          entry.action === "EDIT" ||
          entry.action === "DELETE" ||
          entry.action === "IMPORT"
            ? entry.action
            : "IMPORT",
        companyName: entry.userName || "System",
        details: entry.details,
      }))
    )

    setUserHistory(
      nextUserHistory.map((entry, index) => ({
        id: Number.parseInt(String(entry.id), 10) || index + 1,
        timestamp: entry.timestamp,
        action:
          entry.action === "ADD" ||
          entry.action === "EDIT" ||
          entry.action === "DELETE" ||
          entry.action === "IMPORT"
            ? entry.action
            : "IMPORT",
        userName: entry.userName || "System",
        details: entry.details,
      }))
    )
  }, [])

  useEffect(() => {
    loadAllData().catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load data";
      setErrorMessage(message);
      toast.error(message);
    });
  }, [loadAllData]);


  const handleSaveLoanFacility = async () => {


     setErrorMessage(null)

    try {
      const user = ensureEditor()
      if (!loanForm.facilityName.trim() || !loanForm.lenderCompanyId || !loanForm.borrowerCompanyId) {
        throw new Error('Loan name, lender and borrower are required')
      }

      if (!loanForm.agreementDate) {
        throw new Error('Agreement date is required')
      }

      if (selectedLoanId) {
        const updated = await mockApi.updateLoan(
          selectedLoanId,
          {
            name: loanForm.facilityName.trim(),
            status: loanForm.status,
            lenderCompanyId: loanForm.lenderCompanyId,
            borrowerCompanyId: loanForm.borrowerCompanyId,
            agreementDate: loanForm.agreementDate,
            currency: loanForm.currency,
            annualInterestRate: Number(loanForm.annualInterestRate),
            daysInYear: Number(loanForm.daysInYear),
          },
          user,
        )
        setSelectedLoanId(updated.id)
      } else {
        const created = await mockApi.createLoan(
          {
            name: loanForm.facilityName.trim(),
            status: loanForm.status,
            lenderCompanyId: loanForm.lenderCompanyId,
            borrowerCompanyId: loanForm.borrowerCompanyId,
            agreementDate: loanForm.agreementDate,
            currency: loanForm.currency,
            annualInterestRate: Number(loanForm.annualInterestRate),
            daysInYear: Number(loanForm.daysInYear),
          },
          user,
        )
        setSelectedLoanId(created.id)
      }

      setIsCreatingLoan(false)
      setShowLoanFacilityModal(false)
      await loadAllData()
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
      className={`relative w-full ${isDarkMode ? "bg-[#111827]" : "bg-[#F9FAFB]"}`}
    >
      <div className={`5xl:mx-auto 5xl:w-full h-full px-5 sm:px-10 py-5 ${isDarkMode ? "text-white" : "text-black"}`}>
        <div
          className={`flex flex-wrap justify-between items-center mb-5 gap-4
  ${erpIframe || isDarkMode ? "text-white" : "text-black"}
  ${erpIframe && sidebarCollapsed ? "ml-10" : ""}
`}
        >
          <h4>Loans and Transfers Management Board</h4>
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
        <div className={`flex gap-2 mb-5 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "admin"
                ? isDarkMode
                  ? "border-indigo-500 text-indigo-400"
                  : "border-indigo-600 text-indigo-600"
                : isDarkMode
                ? "border-transparent text-gray-400 hover:text-gray-300"
                : "border-transparent text-gray-600 hover:text-gray-700"
            }`}
          >
            Admin
          </button>

          <button
            onClick={() => setActiveTab("loan-facility")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "loan-facility"
                ? isDarkMode
                  ? "border-indigo-500 text-indigo-400"
                  : "border-indigo-600 text-indigo-600"
                : isDarkMode
                ? "border-transparent text-gray-400 hover:text-gray-300"
                : "border-transparent text-gray-600 hover:text-gray-700"
            }`}
          >
            Loan Facility
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "report"
                ? isDarkMode
                  ? "border-indigo-500 text-indigo-400"
                  : "border-indigo-600 text-indigo-600"
                : isDarkMode
                ? "border-transparent text-gray-400 hover:text-gray-300"
                : "border-transparent text-gray-600 hover:text-gray-700"
            }`}
          >
            Report
          </button>
        </div>

        {/* Loan Facility Tab */}
        {activeTab === "loan-facility" && (
          <LoanFacilityTab
            isDarkMode={isDarkMode}
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
            setShowLoanFacilityHistoryModal={setShowLoanFacilityHistoryModal}
            showLoanFacilityHistoryModal={showLoanFacilityHistoryModal}
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
            setShowScheduleRowModal={setShowScheduleRowModal}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            availableBankAccounts={availableBankAccounts}
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
        {activeTab === "admin" && (
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
                    Export Excel
                  </button>
                  <button
                    onClick={downloadCompanyImportTemplate}
                    className={companyHeaderButtonClass}
                  >
                    Download Template
                  </button>
                  <button
                    onClick={openImportCompanyModal}
                    className={companyHeaderButtonClass}
                  >
                    Import Excel
                  </button>
                  <button
                    onClick={() => setShowCompanyHistoryModal(true)}
                    title="Change history"
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition bg-[#1d2636] hover:bg-[#27354d] text-white"
                  >
                    <ClockIcon className="w-3 h-3" />
                   
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
              <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <table className="w-full">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-200 border-gray-300"
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
                      companies.map((company) => (
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
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                                    : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                }`}
                                title="Edit"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(company.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                                    : "bg-red-100 hover:bg-red-200 text-red-600"
                                }`}
                                title="Delete"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
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
                        Company Name
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
                        SAP Code
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
                        Type
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
                        Country
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
                        <option value="Italy">Italy</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Khazakstan">Khazakstan</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Bank Accounts
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
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={`rounded-lg p-6 w-full max-w-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Company Change History</h3>
                    <button
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

                  <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <table className="w-full">
                      <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <tr>
                          <th className="px-4 py-3 text-left text-sm">Time</th>
                          <th className="px-4 py-3 text-left text-sm">Action</th>
                          <th className="px-4 py-3 text-left text-sm">Company</th>
                          <th className="px-4 py-3 text-left text-sm">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={`px-4 py-6 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              No history yet.
                            </td>
                          </tr>
                        ) : (
                          companyHistory.map((entry) => (
                            <tr key={entry.id} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                              <td className="px-4 py-3 text-sm">{new Date(entry.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  {entry.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.companyName}</td>
                              <td className="px-4 py-3 text-sm">{entry.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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

              <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <table className="w-full">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-200 border-gray-300"
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
                      countries.map((country) => (
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
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                                    : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                }`}
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCountry(country.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                                    : "bg-red-100 hover:bg-red-200 text-red-600"
                                }`}
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
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
                        Country Name
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
                        Country Code
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
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
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
                    Export Excel
                  </button>
                  <button onClick={downloadUserTemplate} className={userHeaderButtonClass}>
                    Download Template
                  </button>
                  <button onClick={openImportUserModal} className={userHeaderButtonClass}>
                    Import Excel
                  </button>
                  <button
                    onClick={() => setShowUserHistoryModal(true)}
                    title="User history"
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition bg-[#1d2636] hover:bg-[#27354d] text-white"
                  >
                    <ClockIcon className="w-3 h-3" />
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
              <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <table className="w-full">
                  <thead
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-200 border-gray-300"
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
                      users.map((user) => (
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
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                                    : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                }`}
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                                  isDarkMode
                                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                                    : "bg-red-100 hover:bg-red-200 text-red-600"
                                }`}
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
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
            </div>

            {showUserHistoryModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={`rounded-lg p-6 w-full max-w-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">User Change History</h3>
                    <button
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

                  <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <table className="w-full">
                      <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <tr>
                          <th className="px-4 py-3 text-left text-sm">Time</th>
                          <th className="px-4 py-3 text-left text-sm">Action</th>
                          <th className="px-4 py-3 text-left text-sm">User</th>
                          <th className="px-4 py-3 text-left text-sm">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={`px-4 py-6 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              No history yet.
                            </td>
                          </tr>
                        ) : (
                          userHistory.map((entry) => (
                            <tr key={entry.id} className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                              <td className="px-4 py-3 text-sm">{new Date(entry.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  {entry.action}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.userName}</td>
                              <td className="px-4 py-3 text-sm">{entry.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                        First Name
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
                        Last Name
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
                        Email Address
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
                        Role
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
                        Country
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
                        <option value="Italy">Italy</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Khazakstan">Khazakstan</option>
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
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isDarkMode
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
