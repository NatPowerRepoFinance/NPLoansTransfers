import { ClockIcon, DocumentTextIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import { Field, Label } from "@headlessui/react";
import ReactSelect from "react-select";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import type { LoanFacility, LoanHistoryEntry } from "../../utils/constants";

type LoanFacilityTabProps = {
  isDarkMode: boolean;
  isCreatingLoan: boolean;
  visibleLoans: Array<{ id: string; name: string }>;
  selectedLoanId: string;
  setSelectedLoanId: (value: string) => void;
  setIsCreatingLoan: (value: boolean) => void;
  showOnlyActiveLoanFacilities: boolean;
  setShowOnlyActiveLoanFacilities: (value: boolean) => void;
  handleNewLoanFacility: () => void;
  handleEditLoanFacility: () => void;
  handleDeleteLoanFacility: () => void;
  exportLoanFacilityToExcel: () => void;
  exportLoanFacilityToPDF: () => void;
  onOpenLoanFacilityHistoryModal: () => void;
  setShowLoanFacilityHistoryModal: (value: boolean) => void;
  showLoanFacilityHistoryModal: boolean;
  loanFacilityHistory: LoanHistoryEntry[];
  isLoanFacilityHistoryLoading: boolean;
  showLoanFacilityModal: boolean;
  setShowLoanFacilityModal: (value: boolean) => void;
  loanForm: {
    facilityName: string;
    status: LoanFacility["status"];
    lenderCompanyId: string;
    borrowerCompanyId: string;
    agreementDate: string;
    currency: LoanFacility["currency"];
    annualInterestRate: number;
    daysInYear: number;
  };
  setLoanForm: React.Dispatch<
    React.SetStateAction<{
      facilityName: string;
      status: LoanFacility["status"];
      lenderCompanyId: string;
      borrowerCompanyId: string;
      agreementDate: string;
      currency: LoanFacility["currency"];
      annualInterestRate: number;
      daysInYear: number;
    }>
  >;
  companies: Array<{ id: string; name: string }>;
  handleSaveLoanFacility: () => void;
  selectedLoanFacility: unknown;
  loanFacilityFieldValue: (keys: string[], fallback?: string) => string;
  handleOpenAddScheduleRowModal: () => void;
  openImportScheduleModal: () => void;
  calculatedRows: Array<{ [key: string]: unknown }>;
  scheduleColumnDefs: ColDef<any>[];
  isImportScheduleModalOpen: boolean;
  downloadScheduleImportTemplate: () => void;
  triggerScheduleImportFile: () => void;
  importScheduleFile: File | null;
  scheduleImportInputRef: React.RefObject<HTMLInputElement | null>;
  handleScheduleImportFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importScheduleMode: "overwrite" | "extend";
  setImportScheduleMode: (value: "overwrite" | "extend") => void;
  errorMessage: string | null;
  closeImportScheduleModal: () => void;
  handleImportSchedule: () => void;
  showScheduleRowModal: boolean;
  onCloseScheduleRowModal: () => void;
  scheduleRowModalTitle: string;
  scheduleRowSubmitLabel: string;
  scheduleForm: {
    startDate: string;
    endDate: string;
    lenderBankAccount: string;
    borrowerBankAccount: string;
    annualInterestRate: string;
    drawDown: string;
    repayment: string;
    fees: string;
  };
  setScheduleForm: React.Dispatch<
    React.SetStateAction<{
      startDate: string;
      endDate: string;
      lenderBankAccount: string;
      borrowerBankAccount: string;
      annualInterestRate: string;
      drawDown: string;
      repayment: string;
      fees: string;
    }>
  >;
  availableLenderBankAccounts: string[];
  availableBorrowerBankAccounts: string[];
  handleSaveScheduleRow: () => void;
};

export default function LoanFacilityTab(props: LoanFacilityTabProps) {
  const {
    isDarkMode,
    isCreatingLoan,
    visibleLoans,
    selectedLoanId,
    setSelectedLoanId,
    setIsCreatingLoan,
    showOnlyActiveLoanFacilities,
    setShowOnlyActiveLoanFacilities,
    handleNewLoanFacility,
    handleEditLoanFacility,
    handleDeleteLoanFacility,
    exportLoanFacilityToExcel,
    exportLoanFacilityToPDF,
    onOpenLoanFacilityHistoryModal,
    setShowLoanFacilityHistoryModal,
    showLoanFacilityHistoryModal,
    loanFacilityHistory,
    isLoanFacilityHistoryLoading,
    showLoanFacilityModal,
    setShowLoanFacilityModal,
    loanForm,
    setLoanForm,
    companies,
    handleSaveLoanFacility,
    selectedLoanFacility,
    loanFacilityFieldValue,
    handleOpenAddScheduleRowModal,
    openImportScheduleModal,
    calculatedRows,
    scheduleColumnDefs,
    isImportScheduleModalOpen,
    downloadScheduleImportTemplate,
    triggerScheduleImportFile,
    importScheduleFile,
    scheduleImportInputRef,
    handleScheduleImportFileChange,
    importScheduleMode,
    setImportScheduleMode,
    errorMessage,
    closeImportScheduleModal,
    handleImportSchedule,
    showScheduleRowModal,
    onCloseScheduleRowModal,
    scheduleRowModalTitle,
    scheduleRowSubmitLabel,
    scheduleForm,
    setScheduleForm,
    availableLenderBankAccounts,
    availableBorrowerBankAccounts,
    handleSaveScheduleRow,
  } = props;

  const isScheduleRowSubmitDisabled = (() => {
    const annualInterestRate = Number(scheduleForm.annualInterestRate);
    const drawDown = Number(scheduleForm.drawDown);
    const repayment = Number(scheduleForm.repayment);
    const fees = Number(scheduleForm.fees);

    const hasRequiredFields =
      !!scheduleForm.startDate &&
      !!scheduleForm.endDate &&
      !!scheduleForm.lenderBankAccount &&
      !!scheduleForm.borrowerBankAccount;

    const hasValidNumbers = ![annualInterestRate, drawDown, repayment, fees].some((value) =>
      Number.isNaN(value),
    );

    const repaymentWithinDrawDown = repayment <= drawDown;
    const endDateNotEarlierThanStartDate =
      !scheduleForm.startDate ||
      !scheduleForm.endDate ||
      scheduleForm.endDate >= scheduleForm.startDate;

    return !(
      hasRequiredFields &&
      hasValidNumbers &&
      repaymentWithinDrawDown &&
      endDateNotEarlierThanStartDate
    );
  })();
  const scheduleRowValidationMessage = (() => {
    if (
      scheduleForm.startDate &&
      scheduleForm.endDate &&
      scheduleForm.endDate < scheduleForm.startDate
    ) {
      return "End Date cannot be earlier than Start Date.";
    }

    const drawDown = Number(scheduleForm.drawDown);
    const repayment = Number(scheduleForm.repayment);
    const hasValidNumbers = ![drawDown, repayment].some((value) => Number.isNaN(value));
    if (hasValidNumbers && repayment > drawDown) {
      return "Repayment cannot be greater than Draw Down.";
    }

    return "";
  })();
  const hasSelectedLoanFacility = selectedLoanId.trim().length > 0;
  const isLoanFacilitySubmitDisabled =
    !loanForm.facilityName.trim() ||
    !loanForm.status ||
    !loanForm.lenderCompanyId ||
    !loanForm.borrowerCompanyId ||
    !loanForm.agreementDate ||
    !loanForm.currency;
  const isLoanFacilityUnchanged =
    !isCreatingLoan &&
    !!selectedLoanFacility &&
    loanForm.facilityName.trim() === String((selectedLoanFacility as any).name ?? "").trim() &&
    loanForm.status === String((selectedLoanFacility as any).status ?? "") &&
    String(loanForm.lenderCompanyId) === String((selectedLoanFacility as any).lenderCompanyId ?? "") &&
    String(loanForm.borrowerCompanyId) === String((selectedLoanFacility as any).borrowerCompanyId ?? "") &&
    loanForm.agreementDate === String((selectedLoanFacility as any).agreementDate ?? "") &&
    loanForm.currency === String((selectedLoanFacility as any).currency ?? "") &&
    Number(loanForm.annualInterestRate) === Number((selectedLoanFacility as any).annualInterestRate ?? 0) &&
    Number(loanForm.daysInYear) === Number((selectedLoanFacility as any).daysInYear ?? 0);
  const isLoanFacilityActionDisabled =
    isLoanFacilitySubmitDisabled || (!isCreatingLoan && isLoanFacilityUnchanged);

  const formatLoanDate = (value: string, fallback = "-") => {
    if (!value || value.trim() === "-") {
      return fallback;
    }

    const normalized = value.trim();
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) {
      return normalized;
    }

    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatHistoryTimestamp = (value?: string) => {
    if (!value) {
      return "-";
    }
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }
    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-[0_10px_35px_rgba(2,6,23,0.12)] ${
        isDarkMode ? "bg-gray-900/80 border-gray-700/80 backdrop-blur" : "bg-white/90 border-gray-200"
      }`}
    >
      <div className={`rounded-2xl p-8 ${isDarkMode ? "bg-gray-800/90" : "bg-gray-50/90"}`}>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" role="group">
          <Field className="flex flex-wrap items-center gap-1 sm:gap-3 w-full">
            <Label
              className={`inline text-base font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600"} mr-3`}
            >
              Select Loan Facility:
            </Label>

            <ReactSelect
              theme={(theme) => ({
                ...theme,
                borderRadius: 12,
                colors: {
                  ...theme.colors,
                  primary: "#4f46e5",
                },
              })}
              className="text-base w-80 max-w-full z-10"
              classNamePrefix="loan-facility-select"
              name="selectedLoanId"
              options={visibleLoans.map((loan) => ({
                value: loan.id,
                label: loan.name,
              }))}
              value={
                visibleLoans
                  .map((loan) => ({ value: loan.id, label: loan.name }))
                  .find((opt) => String(opt.value) === String(selectedLoanId)) || null
              }
              onChange={(selected) => {
                const nextLoanId = String(selected?.value || "");
                setSelectedLoanId(nextLoanId);
                setIsCreatingLoan(false);
              }}
              placeholder="Select Loan Facility"
              styles={
                isDarkMode
                  ? {
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "#1f2937",
                        borderRadius: "0.9rem",
                        minHeight: "46px",
                        borderColor: state.isFocused ? "#818cf8" : "#4b5563",
                        boxShadow: state.isFocused
                          ? "0 0 0 3px rgba(129,140,248,0.22), 0 6px 16px rgba(15,23,42,0.25)"
                          : "0 2px 8px rgba(2,6,23,0.18)",
                        transition: "all 120ms ease",
                        "&:hover": { borderColor: "#818cf8" },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        backgroundColor: "#1f2937",
                        color: "#fff",
                        paddingLeft: "0.55rem",
                        paddingRight: "0.35rem",
                      }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      singleValue: (base) => ({ ...base, color: "#f9fafb", fontWeight: 600 }),
                      placeholder: (base) => ({ ...base, color: "#9CA3AF", fontWeight: 500 }),
                      indicatorSeparator: () => ({ display: "none" }),
                      dropdownIndicator: (base, state) => ({
                        ...base,
                        color: state.isFocused ? "#c7d2fe" : "#9ca3af",
                        "&:hover": { color: "#e0e7ff" },
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 30,
                        borderRadius: "0.9rem",
                        border: "1px solid #4b5563",
                        boxShadow: "0 12px 30px rgba(2,6,23,0.45)",
                        backgroundColor: "#111827",
                        color: "#fff",
                        overflow: "hidden",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#4f46e5"
                          : state.isFocused
                          ? "#374151"
                          : "#111827",
                        color: "#f9fafb",
                        cursor: "pointer",
                        fontWeight: state.isSelected ? 700 : 500,
                        paddingTop: "0.55rem",
                        paddingBottom: "0.55rem",
                      }),
                    }
                  : {
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "#ffffff",
                        borderRadius: "0.9rem",
                        minHeight: "46px",
                        borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
                        boxShadow: state.isFocused
                          ? "0 0 0 3px rgba(99,102,241,0.16), 0 8px 18px rgba(15,23,42,0.08)"
                          : "0 1px 3px rgba(15,23,42,0.08)",
                        transition: "all 120ms ease",
                        "&:hover": { borderColor: "#4f46e5" },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        backgroundColor: "#ffffff",
                        color: "#000",
                        paddingLeft: "0.55rem",
                        paddingRight: "0.35rem",
                      }),
                      input: (base) => ({ ...base, color: "#000" }),
                      singleValue: (base) => ({ ...base, color: "#0f172a", fontWeight: 600 }),
                      placeholder: (base) => ({ ...base, color: "#6b7280", fontWeight: 500 }),
                      indicatorSeparator: () => ({ display: "none" }),
                      dropdownIndicator: (base, state) => ({
                        ...base,
                        color: state.isFocused ? "#4f46e5" : "#64748b",
                        "&:hover": { color: "#4f46e5" },
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 30,
                        borderRadius: "0.9rem",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 12px 28px rgba(15,23,42,0.14)",
                        backgroundColor: "#ffffff",
                        color: "#000",
                        overflow: "hidden",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#4f46e5"
                          : state.isFocused
                          ? "#eef2ff"
                          : "#ffffff",
                        color: state.isSelected ? "#ffffff" : "#111827",
                        cursor: "pointer",
                        fontWeight: state.isSelected ? 700 : 500,
                        paddingTop: "0.55rem",
                        paddingBottom: "0.55rem",
                      }),
                    }
              }
            />
            <label
              className={`inline-flex items-center gap-2 ml-2 text-sm font-semibold ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={showOnlyActiveLoanFacilities}
                onChange={(e) => setShowOnlyActiveLoanFacilities(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Only Active
            </label>
            <button
              type="button"
              onClick={handleNewLoanFacility}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-sm ${
                isDarkMode
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 border-transparent text-white hover:from-indigo-500 hover:to-blue-500"
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 border-transparent text-white hover:from-indigo-500 hover:to-blue-500"
              }`}
            >
              New
            </button>
            <button
              type="button"
              onClick={handleEditLoanFacility}
              disabled={!hasSelectedLoanFacility}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-sm ${
                !hasSelectedLoanFacility
                  ? isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-indigo-500/15 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/25 hover:-translate-y-[1px]"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:-translate-y-[1px]"
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDeleteLoanFacility}
              disabled={!hasSelectedLoanFacility}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-sm ${
                !hasSelectedLoanFacility
                  ? isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-rose-500/15 border-rose-400/30 text-rose-200 hover:bg-rose-500/25 hover:-translate-y-[1px]"
                  : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:-translate-y-[1px]"
              }`}
            >
              Delete
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto justify-end pt-1 sm:pt-0">
              <button
                type="button"
                onClick={exportLoanFacilityToExcel}
                title="Export Excel"
                aria-label="Export Excel"
                className={`inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium border transition ${
                  isDarkMode
                    ? "bg-emerald-900/30 border-emerald-700 text-emerald-200 hover:bg-emerald-800/40"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={exportLoanFacilityToPDF}
                title="Export PDF"
                aria-label="Export PDF"
                className={`inline-flex items-center justify-center p-2 rounded-lg text-sm font-medium border transition ${
                  isDarkMode
                    ? "bg-red-900/30 border-red-700 text-red-200 hover:bg-red-800/40"
                    : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                }`}
              >
                <DocumentTextIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenLoanFacilityHistoryModal}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  isDarkMode
                    ? "bg-indigo-900/30 border-indigo-700 text-indigo-200 hover:bg-indigo-800/40"
                    : "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <ClockIcon className="w-3 h-3" />
                History
              </button>
            </div>
          </Field>
        </div>

        {showLoanFacilityHistoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-full max-w-2xl h-[75vh] flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Loan Facility Change History</h3>
                <button
                  onClick={() => setShowLoanFacilityHistoryModal(false)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-black"
                  }`}
                >
                  Close
                </button>
              </div>
              <div className={`rounded-lg border overflow-y-auto flex-1 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
                  <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Time</th>
                      <th className="px-4 py-3 text-left text-sm">User</th>
                      <th className="px-4 py-3 text-left text-sm">Action</th>
                      <th className="px-4 py-3 text-left text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoanFacilityHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-4 py-6 text-center text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Loading history...
                        </td>
                      </tr>
                    ) : loanFacilityHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-4 py-6 text-center text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          No history yet.
                        </td>
                      </tr>
                    ) : (
                      loanFacilityHistory.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                        >
                          <td className="px-4 py-3 text-sm">
                            {formatHistoryTimestamp(entry.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.userName || "System"}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.details || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showLoanFacilityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 w-full max-w-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-4">
                {isCreatingLoan ? "Add Loan Facility" : "Edit Loan Facility"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Facility Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={loanForm.facilityName}
                    onChange={(e) =>
                      setLoanForm((prev) => ({ ...prev, facilityName: e.target.value }))
                    }
                    placeholder="Enter facility name"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-black placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={loanForm.status}
                    onChange={(e) =>
                      setLoanForm((prev) => ({
                        ...prev,
                        status: e.target.value as LoanFacility["status"],
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                  >
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Lender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={loanForm.lenderCompanyId}
                    onChange={(e) =>
                      setLoanForm((prev) => ({ ...prev, lenderCompanyId: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                  >
                    <option value="">Select Lender</option>
                    {companies.map((company) => (
                      <option key={`lender-${company.id}`} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Borrower <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={loanForm.borrowerCompanyId}
                    onChange={(e) =>
                      setLoanForm((prev) => ({ ...prev, borrowerCompanyId: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                  >
                    <option value="">Select Borrower</option>
                    {companies.map((company) => (
                      <option key={`borrower-${company.id}`} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Agreement Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={loanForm.agreementDate}
                    onChange={(e) =>
                      setLoanForm((prev) => ({ ...prev, agreementDate: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={loanForm.currency}
                    onChange={(e) =>
                      setLoanForm((prev) => ({
                        ...prev,
                        currency: e.target.value as LoanFacility["currency"],
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                  >
                    <option value="">Select currency</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="YEN">YEN</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Annual Interest rate %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanForm.annualInterestRate}
                    onChange={(e) =>
                      setLoanForm((prev) => ({
                        ...prev,
                        annualInterestRate: Number(e.target.value),
                      }))
                    }
                    placeholder="Enter annual interest rate"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-black placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Days in Year
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={366}
                    value={loanForm.daysInYear}
                    onChange={(e) =>
                      setLoanForm((prev) => ({
                        ...prev,
                        daysInYear: Math.min(366, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                    placeholder="Enter days in year"
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
                  type="button"
                  onClick={() => setShowLoanFacilityModal(false)}
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
                  onClick={handleSaveLoanFacility}
                  disabled={isLoanFacilityActionDisabled}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    isLoanFacilityActionDisabled
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isCreatingLoan ? "Add" : "Edit"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <div>
            {!selectedLoanFacility && (
              <p className={`mb-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Please select a Loan Facility to view its details.
              </p>
            )}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? "bg-indigo-500/20 text-indigo-200" : "bg-indigo-50 text-indigo-700"}`}>
                Status: {loanFacilityFieldValue(["status"], "-")}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
                Currency: {loanFacilityFieldValue(["currency"], "-")}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? "bg-cyan-500/20 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>
                Interest: {loanFacilityFieldValue(["annualInterestRate", "annual_interest_rate"], "0")}%
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-5">
              {loanFacilityFieldValue(["facilityName", "name"], "Loan Facility")}
            </h3>
            <div className={`rounded-xl border px-4 py-4 overflow-hidden shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-800/70" : "border-gray-200 bg-white"}`}>
              <h4 className="text-base font-semibold mb-3 tracking-tight">Loan Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-sm">
                {[
                  ["Status", loanFacilityFieldValue(["status"])],
                  ["Start Date", formatLoanDate(loanFacilityFieldValue(["startDate", "start_date", "agreementDate", "agreement_date"], "-"))],
                  ["Close Date", formatLoanDate(loanFacilityFieldValue(["closeDate", "close_date"], "-"))],
                  ["Lender", loanFacilityFieldValue(["lender", "lenderName"])],
                  ["Borrower", loanFacilityFieldValue(["borrower", "borrowerName"])],
                  ["Agreement Date", formatLoanDate(loanFacilityFieldValue(["agreementDate", "agreement_date"], "-"))],
                  ["Currency", loanFacilityFieldValue(["currency"])],
                  ["Annual Interest Rate %", loanFacilityFieldValue(["annualInterestRate", "annual_interest_rate"], "0")],
                  ["Days in Year", loanFacilityFieldValue(["daysInYear", "days_in_year"], "365")],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={`rounded-lg border px-3 py-2.5 ${
                      isDarkMode
                        ? "border-gray-700 bg-gray-900/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className={`block text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {label}
                    </span>
                    <span className={`mt-1 block font-semibold ${isDarkMode ? "text-gray-100" : "text-slate-800"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-6 rounded-xl border p-4 shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-800/80" : "border-gray-200 bg-white"}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold">Draw Down Schedule</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddScheduleRowModal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isDarkMode
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={openImportScheduleModal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Import Schedule
                  </button>
                </div>
              </div>
              <div className="drawdown-schedule-scroll w-full max-w-full overflow-x-auto overflow-y-hidden rounded-xl shadow-sm">
                <div
                  className={`schedule-grid ${isDarkMode ? "ag-theme-alpine-dark" : "ag-theme-alpine"}`}
                  style={{ width: "100%", height: 360 }}
                >
                  <AgGridReact
                    key={`${selectedLoanId}-${calculatedRows.length}`}
                    rowData={calculatedRows}
                    columnDefs={scheduleColumnDefs}
                    defaultColDef={{
                      sortable: false,
                      resizable: true,
                      filter: false,
                      flex: 1,
                      minWidth: 110,
                    }}
                    rowHeight={42}
                    headerHeight={42}
                    suppressCellFocus
                    overlayNoRowsTemplate="No draw down schedule rows available."
                  />
                </div>
              </div>
            </div>

            {isImportScheduleModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={`rounded-lg p-6 w-full max-w-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h3 className="text-xl font-semibold mb-4">Import Draw Down Schedule</h3>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={downloadScheduleImportTemplate}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                          : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      Download Template
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={triggerScheduleImportFile}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                            : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        Choose File
                      </button>
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {importScheduleFile
                          ? importScheduleFile.name
                          : "File (.xlsx, .xls, .csv)"}
                      </span>
                      <input
                        ref={scheduleImportInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleScheduleImportFileChange}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Import Mode
                      </label>
                      <select
                        value={importScheduleMode}
                        onChange={(e) =>
                          setImportScheduleMode(e.target.value as "overwrite" | "extend")
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="extend">Extend existing schedule</option>
                        <option value="overwrite">Overwrite existing schedule</option>
                      </select>
                    </div>

                    {errorMessage && (
                      <div className="text-sm text-red-500">{errorMessage}</div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeImportScheduleModal}
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
                      onClick={handleImportSchedule}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showScheduleRowModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={`rounded-lg p-6 w-full max-w-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h3 className="text-xl font-semibold mb-4">{scheduleRowModalTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={scheduleForm.startDate}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={scheduleForm.endDate}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Lender Bank Account <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={scheduleForm.lenderBankAccount}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            lenderBankAccount: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select lender bank account</option>
                        {availableLenderBankAccounts.map((account) => (
                          <option key={`lender-account-${account}`} value={account}>
                            {account}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Borrower Bank Account <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={scheduleForm.borrowerBankAccount}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            borrowerBankAccount: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      >
                        <option value="">Select borrower bank account</option>
                        {availableBorrowerBankAccounts.map((account) => (
                          <option key={`borrower-account-${account}`} value={account}>
                            {account}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Annual Interest Rate %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={scheduleForm.annualInterestRate}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            annualInterestRate: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Draw Down
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={scheduleForm.drawDown}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, drawDown: e.target.value }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Repayment
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={scheduleForm.repayment}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, repayment: e.target.value }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Fees
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={scheduleForm.fees}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, fees: e.target.value }))
                        }
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-black"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onCloseScheduleRowModal}
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
                      onClick={handleSaveScheduleRow}
                      disabled={isScheduleRowSubmitDisabled}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        isScheduleRowSubmitDisabled
                          ? isDarkMode
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {scheduleRowSubmitLabel}
                    </button>
                  </div>
                  {scheduleRowValidationMessage && (
                    <p className="mt-3 text-sm text-red-500">{scheduleRowValidationMessage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
