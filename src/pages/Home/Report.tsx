import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PptxGenJS from "pptxgenjs";
import {
  getBorrowerSummaryReport,
  getCountrySummaryLoansReport,
  getLenderSummaryReport,
} from "@/api";
import { getNatpowerLogoDataUrl, NATPOWER_LOGO_ASPECT_RATIO } from "@/utils/pdfLogo";

type ScheduleRow = {
  startDate?: string;
  endDate?: string;
  drawDown?: number;
  repayment?: number;
  fees?: number;
  annualInterestRate?: number;
  interest?: number;
  total?: number;
  principal?: number;
  days?: number;
};

type Loan = {
  name?: string;
  borrowerCompanyId: string;
  lenderCompanyId: string;
  annualInterestRate: number;
  daysInYear: number;
  schedule?: ScheduleRow[];
};

type Company = { id: string; name?: string; country: string };

type ReportTabProps = {
  isDarkMode: boolean;
  loans: Loan[];
  companies: Company[];
};

type Totals = {
  cumulativeInterest: number;
  cumulativePrincipal: number;
  cumulativeTotal: number;
  cumulativeFees: number;
};

type NameSummaryRow = {
  name: string;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  cumulativeFees: number;
  cumulativeTotal: number;
};

type LoanDetailRow = Totals & {
  lendingCountry: string;
  borrowingCountry: string;
  loanFacility: string;
  lender: string;
  borrower: string;
};

const PAGE_SIZE = 10;

function computeRowTotals(loan: Loan, rows: ScheduleRow[]): Totals {
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let cumulativeTotal = 0;
  let cumulativeFees = 0;

  for (const row of rows) {
    const drawDown = Number(row?.drawDown ?? 0);
    const repayment = Number(row?.repayment ?? 0);
    const fees = Number(row?.fees ?? 0);
    const principal = Number(row?.principal ?? drawDown - repayment);
    const rate = Number(row?.annualInterestRate ?? loan.annualInterestRate ?? 0);
    const explicitDays = Number(row?.days ?? 0);
    const derivedDays =
      row?.startDate && row?.endDate
        ? Math.max(
            0,
            Math.round(
              (new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) /
                86400000
            )
          )
        : 0;
    const days = explicitDays > 0 ? explicitDays : derivedDays;
    const yearBasis = Number(loan.daysInYear ?? 365) || 365;
    const interest = Number(
      row?.interest ?? (principal * rate * days) / (100 * yearBasis)
    );
    cumulativePrincipal += principal;
    cumulativeInterest += interest;
    cumulativeFees += fees;
    cumulativeTotal += Number(row?.total ?? principal + interest + fees);
  }

  return { cumulativeInterest, cumulativePrincipal, cumulativeTotal, cumulativeFees };
}

export default function ReportTab({ isDarkMode, loans, companies }: ReportTabProps) {
  // ── API fallback data ─────────────────────────────────────────
  const [apiLoanDetailSummary, setApiLoanDetailSummary] = useState<
    Array<{
      country: string;
      loanFacility: string;
      lender: string;
      borrower: string;
      cumulativePrincipal: number;
      cumulativeInterest: number;
      cumulativeFees: number;
      cumulativeTotal: number;
    }>
  >([]);

  const [borrowerSummary, setBorrowerSummary] = useState<NameSummaryRow[]>([]);
  const [lenderSummary, setLenderSummary] = useState<NameSummaryRow[]>([]);

  // ── Show / hide section toggles ───────────────────────────────
  const [showPanelSummary, setShowPanelSummary] = useState(true);
  const [showLoanDetailSummary, setShowLoanDetailSummary] = useState(true);
  const [showBorrowerSummary, setShowBorrowerSummary] = useState(true);
  const [showLenderSummary, setShowLenderSummary] = useState(true);

  // ── Filter state ──────────────────────────────────────────────
  const [countryMode, setCountryMode] = useState<"lender" | "borrower">("borrower");
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [asOfDate, setAsOfDate] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Borrower / Lender summary date range ───────────────────────
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  // True while the date-filtered API data is being (re)fetched — exports must not
  // run during this window, or they'd bundle the previous filter's stale results.
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("poAccessToken");
    if (!token) return;
    let cancelled = false;
    setIsSummaryLoading(true);
    const requests = [
      getBorrowerSummaryReport(token, summaryStartDate || undefined, summaryEndDate || undefined)
        .then((rows) => {
          if (!cancelled) {
            setBorrowerSummary(rows.map((r) => ({ name: r.country, cumulativeInterest: r.cumulativeInterest, cumulativePrincipal: r.cumulativePrincipal, cumulativeFees: r.cumulativeFees, cumulativeTotal: r.cumulativeTotal })));
          }
        })
        .catch(() => {}),
      getLenderSummaryReport(token, summaryStartDate || undefined, summaryEndDate || undefined)
        .then((rows) => {
          if (!cancelled) {
            setLenderSummary(rows.map((r) => ({ name: r.country, cumulativeInterest: r.cumulativeInterest, cumulativePrincipal: r.cumulativePrincipal, cumulativeFees: r.cumulativeFees, cumulativeTotal: r.cumulativeTotal })));
          }
        })
        .catch(() => {}),
      getCountrySummaryLoansReport(token, summaryStartDate || undefined, summaryEndDate || undefined)
        .then((rows) => { if (!cancelled) setApiLoanDetailSummary(rows); })
        .catch(() => {}),
    ];
    Promise.allSettled(requests).then(() => {
      if (!cancelled) setIsSummaryLoading(false);
    });
    return () => { cancelled = true; };
  }, [summaryStartDate, summaryEndDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setCountryDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sourced from the actual Lender/Borrower Country Summary API data (not local loans/companies)
  // so the checkbox list always matches what's really available in those tables.
  const availableCountries = useMemo(() => {
    const source = countryMode === "lender" ? lenderSummary : borrowerSummary;
    const set = new Set<string>();
    for (const row of source) {
      if (row.name) set.add(row.name);
    }
    return Array.from(set).sort();
  }, [lenderSummary, borrowerSummary, countryMode]);

  const handleModeChange = (mode: "lender" | "borrower") => {
    setCountryMode(mode);
    setSelectedCountries(new Set());
  };

  const toggleCountry = (c: string) =>
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  const clearFilters = () => {
    setSelectedCountries(new Set());
    setAsOfDate("");
    setSummaryStartDate("");
    setSummaryEndDate("");
  };
  const hasActiveFilters = selectedCountries.size > 0 || !!asOfDate || !!summaryStartDate || !!summaryEndDate;

  // ── Filtered loans ────────────────────────────────────────────
  const filteredLoans = useMemo(() => {
    if (selectedCountries.size === 0) return loans;
    return loans.filter((loan) => {
      const id = countryMode === "lender" ? loan.lenderCompanyId : loan.borrowerCompanyId;
      const c = companies.find((co) => co.id === id)?.country?.trim() || "";
      return selectedCountries.has(c);
    });
  }, [loans, companies, countryMode, selectedCountries]);

  const filterSchedule = (rows: ScheduleRow[]) => {
    if (!asOfDate) return rows;
    return rows.filter((r) => {
      const end = String(r?.endDate ?? "").substring(0, 10);
      return !end || end <= asOfDate;
    });
  };

  // ── Loan Detail Summary (Table 2) ─────────────────────────────
  const loanDetailSummary = useMemo<LoanDetailRow[]>(() => {
    const computed: LoanDetailRow[] = filteredLoans.map((loan) => {
      const lenderCo = companies.find((c) => c.id === loan.lenderCompanyId);
      const borrowerCo = companies.find((c) => c.id === loan.borrowerCompanyId);
      const t = computeRowTotals(loan, filterSchedule(Array.isArray(loan.schedule) ? loan.schedule : []));
      return {
        lendingCountry: lenderCo?.country?.trim() || "Unknown",
        borrowingCountry: borrowerCo?.country?.trim() || "Unknown",
        loanFacility: loan.name || "-",
        lender: lenderCo?.name || "-",
        borrower: borrowerCo?.name || "-",
        ...t,
      };
    });

    // The country-summary/loans API is the authoritative, date-range-aware source
    // (it respects the "Summary from/to" filter) — prefer its cumulative values
    // over the local schedule computation whenever a matching loan facility is returned,
    // rather than only filling in loans that have no locally-loaded schedule.
    // Rows are still subject to the country dropdown filter, matched on apiRow.country.
    const merged = [...computed];
    for (const apiRow of apiLoanDetailSummary) {
      if (selectedCountries.size > 0 && !selectedCountries.has(apiRow.country)) continue;
      const idx = merged.findIndex((m) => m.loanFacility === apiRow.loanFacility);
      if (idx === -1) {
        merged.push({
          lendingCountry: apiRow.country, borrowingCountry: "-",
          loanFacility: apiRow.loanFacility, lender: apiRow.lender, borrower: apiRow.borrower,
          cumulativePrincipal: apiRow.cumulativePrincipal ?? 0,
          cumulativeInterest: apiRow.cumulativeInterest ?? 0,
          cumulativeFees: apiRow.cumulativeFees ?? 0,
          cumulativeTotal: apiRow.cumulativeTotal ?? 0,
        });
      } else {
        // country-summary/loans doesn't return fee data (always 0) — keep the
        // locally-computed cumulativeFees instead of clobbering it with that 0.
        merged[idx] = {
          ...merged[idx],
          cumulativePrincipal: apiRow.cumulativePrincipal ?? 0,
          cumulativeInterest: apiRow.cumulativeInterest ?? 0,
          cumulativeTotal: apiRow.cumulativeTotal ?? 0,
        };
      }
    }

    return merged.sort((a, b) =>
      a.lendingCountry === b.lendingCountry
        ? a.loanFacility.localeCompare(b.loanFacility)
        : a.lendingCountry.localeCompare(b.lendingCountry)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLoans, companies, asOfDate, apiLoanDetailSummary, selectedCountries]);

  // Lender/Borrower Country Summary are country-grouped datasets straight from the API,
  // so the country dropdown filter applies directly by matching row.name (the country).
  const filteredLenderSummary = useMemo(() => {
    if (selectedCountries.size === 0) return lenderSummary;
    return lenderSummary.filter((r) => selectedCountries.has(r.name));
  }, [lenderSummary, selectedCountries]);

  const filteredBorrowerSummary = useMemo(() => {
    if (selectedCountries.size === 0) return borrowerSummary;
    return borrowerSummary.filter((r) => selectedCountries.has(r.name));
  }, [borrowerSummary, selectedCountries]);

  // ── KPI aggregates ────────────────────────────────────────────
  // Interest/principal/total are summed from the already-merged Loan Detail Summary
  // rows so loans without a locally-loaded schedule (only known via the
  // country-summary/loans API) still contribute. That API doesn't return fee data
  // though (always 0), so Cumulative Fees is instead summed from the lender-summary
  // API — the only source that reliably reports real fee totals.
  const kpis = useMemo(() => {
    const lenders = new Set<string>();
    const borrowers = new Set<string>();
    let cumulativeInterest = 0, cumulativePrincipal = 0, cumulativeTotal = 0;
    for (const row of loanDetailSummary) {
      if (row.lendingCountry && row.lendingCountry !== "Unknown") lenders.add(row.lendingCountry);
      if (row.borrowingCountry && row.borrowingCountry !== "Unknown" && row.borrowingCountry !== "-") borrowers.add(row.borrowingCountry);
      cumulativeInterest += row.cumulativeInterest;
      cumulativePrincipal += row.cumulativePrincipal;
      cumulativeTotal += row.cumulativeTotal;
    }
    const cumulativeFees = filteredLenderSummary.reduce((sum, row) => sum + row.cumulativeFees, 0);
    return { lendingCountries: lenders.size, borrowingCountries: borrowers.size, cumulativeInterest, cumulativePrincipal, cumulativeTotal, cumulativeFees };
  }, [loanDetailSummary, filteredLenderSummary]);

  // ── Pagination ────────────────────────────────────────────────
  const [loanDetailPage, setLoanDetailPage] = useState(0);
  const [borrowerPage, setBorrowerPage] = useState(0);
  const [lenderPage, setLenderPage] = useState(0);

  const loanDetailTotalPages = Math.max(1, Math.ceil(loanDetailSummary.length / PAGE_SIZE));
  const borrowerTotalPages = Math.max(1, Math.ceil(filteredBorrowerSummary.length / PAGE_SIZE));
  const lenderTotalPages = Math.max(1, Math.ceil(filteredLenderSummary.length / PAGE_SIZE));

  useEffect(() => setBorrowerPage((p) => Math.min(p, borrowerTotalPages - 1)), [borrowerTotalPages]);
  useEffect(() => setLenderPage((p) => Math.min(p, lenderTotalPages - 1)), [lenderTotalPages]);
  const pagedBorrower = filteredBorrowerSummary.slice(borrowerPage * PAGE_SIZE, (borrowerPage + 1) * PAGE_SIZE);
  const pagedLender = filteredLenderSummary.slice(lenderPage * PAGE_SIZE, (lenderPage + 1) * PAGE_SIZE);

  useEffect(() => setLoanDetailPage((p) => Math.min(p, loanDetailTotalPages - 1)), [loanDetailTotalPages]);

  const pagedLoanDetail = loanDetailSummary.slice(loanDetailPage * PAGE_SIZE, (loanDetailPage + 1) * PAGE_SIZE);

  // ── Utilities ─────────────────────────────────────────────────
  const fmt = (v: number) =>
    Number(v || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Exports ───────────────────────────────────────────────────
  const activeFilterLabel = [
    ...(selectedCountries.size > 0
      ? [`${countryMode === "lender" ? "Lender" : "Borrower"}: ${Array.from(selectedCountries).join(", ")}`]
      : []),
    ...(asOfDate ? [`As of ${asOfDate}`] : []),
  ].join(" | ");

  const dateStamp = new Date().toISOString().substring(0, 10);
  const exportStr = new Date().toLocaleString("en-GB");

  // ── Excel ─────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (isSummaryLoading) {
      toast.error("Report data is still loading for the selected filters. Please wait a moment and try again.");
      return;
    }
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary KPIs
    if (showPanelSummary) {
      const summaryRows = [
        ["Loans & Transfers — Country Summary Report"],
        [`Exported: ${exportStr}`],
        ...(activeFilterLabel ? [[`Filters: ${activeFilterLabel}`]] : []),
        [],
        ["KPI", "Value"],
        ["Lending Countries", kpis.lendingCountries],
        ["Borrowing Countries", kpis.borrowingCountries],
        ["Cumulative Interest", +kpis.cumulativeInterest.toFixed(2)],
        ["Cumulative Principal", +kpis.cumulativePrincipal.toFixed(2)],
        ["Cumulative Fees", +kpis.cumulativeFees.toFixed(2)],
        ["Cumulative Total", +kpis.cumulativeTotal.toFixed(2)],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
      summaryWs["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    }

    // Note: Lending/Borrowing Country Summary (grouped by local schedule data rather
    // than the API) aren't shown on-screen anymore and have no "Show" toggle, so they're
    // intentionally excluded here — otherwise every export would always bundle them in
    // regardless of what the user has configured.

    // Sheet 4: Loan Detail Summary
    if (showLoanDetailSummary) {
      const detailWs = XLSX.utils.json_to_sheet(loanDetailSummary.map((r) => ({
        "Lending Country": r.lendingCountry,
        "Borrowing Country": r.borrowingCountry,
        "Loan Facility": r.loanFacility,
        "Lender": r.lender,
        "Borrower": r.borrower,
        "Cumulative Principal": +r.cumulativePrincipal.toFixed(2),
        "Cumulative Interest": +r.cumulativeInterest.toFixed(2),
        "Cumulative Fees": +r.cumulativeFees.toFixed(2),
        "Cumulative Total": +r.cumulativeTotal.toFixed(2),
      })));
      detailWs["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 26 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, detailWs, "Loan Detail Summary");
    }

    // Sheet 5: Borrower Country Summary
    if (showBorrowerSummary) {
      const borrowerWs = XLSX.utils.json_to_sheet(filteredBorrowerSummary.map((r) => ({
        "Country": r.name,
        "Cumulative Interest": +r.cumulativeInterest.toFixed(2),
        "Cumulative Principal": +r.cumulativePrincipal.toFixed(2),
        "Cumulative Fees": +r.cumulativeFees.toFixed(2),
        "Cumulative Total": +r.cumulativeTotal.toFixed(2),
      })));
      borrowerWs["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, borrowerWs, "Borrower Country Summary");
    }

    // Sheet 6: Lender Country Summary
    if (showLenderSummary) {
      const lenderWs = XLSX.utils.json_to_sheet(filteredLenderSummary.map((r) => ({
        "Country": r.name,
        "Cumulative Interest": +r.cumulativeInterest.toFixed(2),
        "Cumulative Principal": +r.cumulativePrincipal.toFixed(2),
        "Cumulative Fees": +r.cumulativeFees.toFixed(2),
        "Cumulative Total": +r.cumulativeTotal.toFixed(2),
      })));
      lenderWs["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, lenderWs, "Lender Country Summary");
    }

    if (wb.SheetNames.length === 0) {
      const emptyWs = XLSX.utils.aoa_to_sheet([["No sections selected. Enable at least one section under \"Show\" to export data."]]);
      XLSX.utils.book_append_sheet(wb, emptyWs, "Summary");
    }

    XLSX.writeFile(wb, `country_summary_report_${dateStamp}.xlsx`);
  };

  // ── PDF ───────────────────────────────────────────────────────
  const exportToPDF = async () => {
    if (isSummaryLoading) {
      toast.error("Report data is still loading for the selected filters. Please wait a moment and try again.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Shared table styles
    const headStyles = { fillColor: [79, 70, 229] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const, fontSize: 8 };
    const altRowStyles = { fillColor: [238, 242, 255] as [number, number, number] };
    const numCols = (indices: number[]) => Object.fromEntries(indices.map((i) => [i, { halign: "right" as const }]));

    // Header on page 1
    const logoHeight = 12;
    const logoWidth = logoHeight / NATPOWER_LOGO_ASPECT_RATIO;
    try {
      const logoDataUrl = await getNatpowerLogoDataUrl();
      doc.addImage(logoDataUrl, "PNG", 14, 5, logoWidth, logoHeight);
    } catch {
      /* logo is decorative — proceed without it if it fails to load */
    }
    const textX = 14 + logoWidth + 4;
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("Loans & Transfers", textX, 13);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Country Summary Report", textX, 20);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(exportStr, pageW - 14, 16, { align: "right" });
    if (activeFilterLabel) doc.text(`Filters: ${activeFilterLabel}`, pageW - 14, 22, { align: "right" });
    doc.setTextColor(0, 0, 0);

    let y = 30;
    let hasContent = false;

    // Advances y for the next section: starts a fresh page when forced or when the
    // current section wouldn't fit, otherwise flows beneath the previous table.
    const startSection = (title: string, forceNewPage: boolean) => {
      if (hasContent) {
        y = (doc as any).lastAutoTable.finalY + 8;
        if (forceNewPage || y > pageH - 50) {
          doc.addPage();
          y = 14;
        }
      }
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(79, 70, 229);
      doc.text(title, 14, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      hasContent = true;
    };

    // KPI summary table
    if (showPanelSummary) {
      autoTable(doc, {
        startY: y,
        head: [["Lending Countries", "Borrowing Countries", "Cumulative Interest", "Cumulative Principal", "Cumulative Fees", "Cumulative Total"]],
        body: [[
          String(kpis.lendingCountries),
          String(kpis.borrowingCountries),
          fmt(kpis.cumulativeInterest),
          fmt(kpis.cumulativePrincipal),
          fmt(kpis.cumulativeFees),
          fmt(kpis.cumulativeTotal),
        ]],
        headStyles: { ...headStyles, halign: "center" },
        bodyStyles: { halign: "center", fontStyle: "bold", fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
      hasContent = true;
    }

    // Note: Lending/Borrowing Country Summary aren't shown on-screen anymore and have
    // no "Show" toggle, so they're intentionally excluded here.

    // Table 3: Loan Detail Summary — always starts on its own page
    if (showLoanDetailSummary) {
      startSection("Loan Detail Summary", true);
      autoTable(doc, {
        startY: y,
        head: [["Lending Country", "Borrowing Country", "Loan Facility", "Lender", "Borrower", "Cum. Principal", "Cum. Interest", "Cum. Fees", "Cum. Total"]],
        body: loanDetailSummary.map((r) => [r.lendingCountry, r.borrowingCountry, r.loanFacility, r.lender, r.borrower, fmt(r.cumulativePrincipal), fmt(r.cumulativeInterest), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
        headStyles, alternateRowStyles: altRowStyles,
        columnStyles: numCols([5, 6, 7, 8]),
        styles: { fontSize: 7 }, margin: { left: 14, right: 14 },
      });
    }

    // Table 4: Borrower Country Summary — always starts on its own page
    if (showBorrowerSummary) {
      startSection("Borrower Country Summary", true);
      autoTable(doc, {
        startY: y,
        head: [["Country", "Cumulative Interest", "Cumulative Principal", "Cumulative Fees", "Cumulative Total"]],
        body: filteredBorrowerSummary.map((r) => [r.name, fmt(r.cumulativeInterest), fmt(r.cumulativePrincipal), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
        headStyles, alternateRowStyles: altRowStyles,
        columnStyles: numCols([1, 2, 3, 4]),
        styles: { fontSize: 8 }, margin: { left: 14, right: 14 },
      });
    }

    // Table 5: Lender Country Summary
    if (showLenderSummary) {
      startSection("Lender Country Summary", false);
      autoTable(doc, {
        startY: y,
        head: [["Country", "Cumulative Interest", "Cumulative Principal", "Cumulative Fees", "Cumulative Total"]],
        body: filteredLenderSummary.map((r) => [r.name, fmt(r.cumulativeInterest), fmt(r.cumulativePrincipal), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
        headStyles, alternateRowStyles: altRowStyles,
        columnStyles: numCols([1, 2, 3, 4]),
        styles: { fontSize: 8 }, margin: { left: 14, right: 14 },
      });
    }

    if (!hasContent) {
      doc.setFontSize(11); doc.setTextColor(120, 120, 120);
      doc.text("No sections selected. Enable at least one section under \"Show\" to export data.", 14, y);
    }

    // Page numbers
    const totalPg = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPg; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text("Loans & Transfers — Country Summary Report", 14, pageH - 6);
      doc.text(`Page ${i} of ${totalPg}`, pageW - 14, pageH - 6, { align: "right" });
    }

    doc.save(`country_summary_report_${dateStamp}.pdf`);
  };

  // ── PPT ───────────────────────────────────────────────────────
  const exportToPPT = () => {
    if (isSummaryLoading) {
      toast.error("Report data is still loading for the selected filters. Please wait a moment and try again.");
      return;
    }
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    const IND = "4F46E5";
    const WHT = "FFFFFF";
    const DRK = "1E293B";
    const SLT = "F8FAFC";
    const GRY = "64748B";

    // Header cell factory
    const hdr = (text: string, align: "left" | "right" | "center" = "left") => ({
      text,
      options: { bold: true, fontSize: 8, color: WHT, fill: { color: IND }, align, valign: "middle" as const, border: { type: "solid" as const, color: "3730A3", pt: 1 } },
    });

    // Data cell factory
    const cel = (text: string, right = false, alt = false) => ({
      text,
      options: { fontSize: 8, color: DRK, align: (right ? "right" : "left") as "left" | "right", valign: "middle" as const, fill: { color: alt ? SLT : WHT }, border: { type: "solid" as const, color: "E2E8F0", pt: 1 } },
    });

    // ── Slide 1: Cover ──
    const cover = pptx.addSlide();
    cover.background = { color: IND };
    cover.addText("Loans & Transfers", { x: 0.5, y: 1.4, w: 12.4, h: 0.8, fontSize: 36, bold: true, color: WHT, align: "center" });
    cover.addText("Country Summary Report", { x: 0.5, y: 2.3, w: 12.4, h: 0.6, fontSize: 20, color: "C7D2FE", align: "center" });
    if (activeFilterLabel) cover.addText(`Filters: ${activeFilterLabel}`, { x: 0.5, y: 3.1, w: 12.4, h: 0.35, fontSize: 10, color: "A5B4FC", align: "center" });
    cover.addText(exportStr, { x: 0.5, y: 6.8, w: 12.4, h: 0.3, fontSize: 9, color: "818CF8", align: "center" });

    // ── Slide 2: KPI Summary ──
    if (showPanelSummary) {
      const kpiSlide = pptx.addSlide();
      kpiSlide.addText("Report Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 20, bold: true, color: IND });
      kpiSlide.addTable(
        [
          [hdr("Borrowing Countries", "center"), hdr("Lending Countries", "center"), hdr("Cumulative Interest", "center"), hdr("Cumulative Principal", "center"), hdr("Cumulative Fees", "center"), hdr("Cumulative Total", "center")],
          [cel(String(kpis.borrowingCountries), true), cel(String(kpis.lendingCountries), true), cel(fmt(kpis.cumulativeInterest), true), cel(fmt(kpis.cumulativePrincipal), true), cel(fmt(kpis.cumulativeFees), true), cel(fmt(kpis.cumulativeTotal), true)],
        ] as any,
        { x: 0.4, y: 0.85, w: 12.5, h: 1.1, colW: [2.15, 2.15, 2.1, 2.15, 2.1, 2.1], fontSize: 12 }
      );
      kpiSlide.addText(`Generated: ${exportStr}${activeFilterLabel ? `   |   Filters: ${activeFilterLabel}` : ""}`, { x: 0.4, y: 7.0, w: 12.5, h: 0.3, fontSize: 8, color: GRY });
    }

    // Note: Lending/Borrowing Country Summary aren't shown on-screen anymore and have
    // no "Show" toggle, so they're intentionally excluded here.

    // ── Slide 5: Loan Detail Summary ──
    if (showLoanDetailSummary) {
      const dSlide = pptx.addSlide();
      dSlide.addText("Loan Detail Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 18, bold: true, color: IND });
      dSlide.addTable(
        [
          [hdr("Lending Country"), hdr("Borrowing Country"), hdr("Loan Facility"), hdr("Lender"), hdr("Borrower"), hdr("Cum. Principal", "right"), hdr("Cum. Interest", "right"), hdr("Cum. Fees", "right"), hdr("Cum. Total", "right")],
          ...loanDetailSummary.map((r, i) => [
            cel(r.lendingCountry, false, i % 2 === 1),
            cel(r.borrowingCountry, false, i % 2 === 1),
            cel(r.loanFacility, false, i % 2 === 1),
            cel(r.lender, false, i % 2 === 1),
            cel(r.borrower, false, i % 2 === 1),
            cel(fmt(r.cumulativePrincipal), true, i % 2 === 1),
            cel(fmt(r.cumulativeInterest), true, i % 2 === 1),
            cel(fmt(r.cumulativeFees), true, i % 2 === 1),
            cel(fmt(r.cumulativeTotal), true, i % 2 === 1),
          ]),
        ] as any,
        { x: 0.2, y: 0.82, w: 13.2, h: 6.2, colW: [1.7, 1.7, 2.1, 1.5, 1.5, 1.5, 1.5, 1.2, 1.5] }
      );
    }

    // ── Slide 6: Borrower Country Summary ──
    if (showBorrowerSummary) {
      const brSlide = pptx.addSlide();
      brSlide.addText("Borrower Country Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 18, bold: true, color: IND });
      brSlide.addTable(
        [
          [hdr("Country"), hdr("Cumulative Interest", "right"), hdr("Cumulative Principal", "right"), hdr("Cumulative Fees", "right"), hdr("Cumulative Total", "right")],
          ...filteredBorrowerSummary.map((r, i) => [
            cel(r.name, false, i % 2 === 1),
            cel(fmt(r.cumulativeInterest), true, i % 2 === 1),
            cel(fmt(r.cumulativePrincipal), true, i % 2 === 1),
            cel(fmt(r.cumulativeFees), true, i % 2 === 1),
            cel(fmt(r.cumulativeTotal), true, i % 2 === 1),
          ]),
        ] as any,
        { x: 0.4, y: 0.82, w: 12.5, h: 6.2, colW: [3.0, 2.5, 2.5, 2.25, 2.25] }
      );
    }

    // ── Slide 7: Lender Country Summary ──
    if (showLenderSummary) {
      const lnSlide = pptx.addSlide();
      lnSlide.addText("Lender Country Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 18, bold: true, color: IND });
      lnSlide.addTable(
        [
          [hdr("Country"), hdr("Cumulative Interest", "right"), hdr("Cumulative Principal", "right"), hdr("Cumulative Fees", "right"), hdr("Cumulative Total", "right")],
          ...filteredLenderSummary.map((r, i) => [
            cel(r.name, false, i % 2 === 1),
            cel(fmt(r.cumulativeInterest), true, i % 2 === 1),
            cel(fmt(r.cumulativePrincipal), true, i % 2 === 1),
            cel(fmt(r.cumulativeFees), true, i % 2 === 1),
            cel(fmt(r.cumulativeTotal), true, i % 2 === 1),
          ]),
        ] as any,
        { x: 0.4, y: 0.82, w: 12.5, h: 6.2, colW: [3.0, 2.5, 2.5, 2.25, 2.25] }
      );
    }

    void pptx.writeFile({ fileName: `country_summary_report_${dateStamp}.pptx` });
  };

  // ── Style helpers ─────────────────────────────────────────────
  const inputCls = `h-9 rounded-lg border px-3 text-xs font-medium transition focus:outline-none ${
    isDarkMode
      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-indigo-500"
      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-400"
  }`;

  const modeBtnCls = (active: boolean) =>
    `h-9 px-3 text-xs font-semibold border transition ${
      active
        ? "bg-indigo-600 border-indigo-600 text-white"
        : isDarkMode
        ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
    }`;

  const exportCls =
    "flex items-center justify-center h-9 px-3.5 rounded-xl text-xs font-semibold transition-all shadow-sm border-0 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white whitespace-nowrap";

  const thCls = "px-4 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap";
  const thRCls = "px-4 py-3 text-right text-xs font-bold uppercase tracking-wide whitespace-nowrap";
  const tdCls = "px-4 py-3.5 text-sm";
  const tdRCls = "px-4 py-3.5 text-sm text-right tabular-nums";
  const trCls = `border-t transition-colors ${isDarkMode ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-slate-50"}`;
  const theadCls = isDarkMode ? "bg-gray-700/80" : "bg-slate-100";
  const tableCls = `w-full overflow-x-auto rounded-xl border shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-900/40" : "border-gray-200 bg-white"}`;

  // ── Pagination sub-component ──────────────────────────────────
  const btnPageCls = (disabled: boolean) =>
    `h-9 px-3 rounded-lg text-xs font-semibold border transition ${
      disabled
        ? isDarkMode ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : isDarkMode ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
    }`;

  const PaginationRow = ({ page, total, totalPages, setPage }: { page: number; total: number; totalPages: number; setPage: (n: number) => void }) => (
    <div className={`flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
      <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        Showing <b>{total === 0 ? 0 : page * PAGE_SIZE + 1}</b>–<b>{Math.min(total, (page + 1) * PAGE_SIZE)}</b> of <b>{total}</b>
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className={btnPageCls(page === 0)}>Prev</button>
        <span className={`text-xs font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Page {page + 1} of {totalPages}</span>
        <button type="button" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className={btnPageCls(page >= totalPages - 1)}>Next</button>
      </div>
    </div>
  );

  // ── Borrower / Lender summary table helper ────────────────────
  const NameSummaryTable = ({ label, colLabel, rows, paged, page, totalPages, setPage }: {
    label: string; colLabel: string; rows: NameSummaryRow[]; paged: NameSummaryRow[];
    page: number; totalPages: number; setPage: (n: number) => void;
  }) => (
    <div className="mb-6">
      <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{label}</h3>
      <div className={tableCls}>
        <table className="min-w-full text-sm border-separate border-spacing-0">
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>{colLabel}</th>
              <th className={thRCls}>Cumulative Interest</th>
              <th className={thRCls}>Cumulative Principal</th>
              <th className={thRCls}>Cumulative Fees</th>
              <th className={thRCls}>Cumulative Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className={`px-6 py-8 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No data available.</td></tr>
            ) : paged.map((r) => (
              <tr key={r.name} className={trCls}>
                <td className={tdCls}>{r.name}</td>
                <td className={tdRCls}>{fmt(r.cumulativeInterest)}</td>
                <td className={tdRCls}>{fmt(r.cumulativePrincipal)}</td>
                <td className={tdRCls}>{fmt(r.cumulativeFees)}</td>
                <td className={tdRCls}>{fmt(r.cumulativeTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationRow page={page} total={rows.length} totalPages={totalPages} setPage={setPage} />
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`w-full min-w-0 rounded-2xl border p-5 sm:p-6 shadow-[0_10px_35px_rgba(2,6,23,0.12)] ${
      isDarkMode ? "bg-gray-900/80 border-gray-700/80 backdrop-blur" : "bg-white/90 border-gray-200"
    }`}>
      <div className={`rounded-2xl p-4 sm:p-6 w-full min-w-0 ${isDarkMode ? "bg-gray-800/90" : "bg-gray-50/90"}`}>

        {/* ── Header: title + exports ── */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight flex-1 min-w-0">Country Summary Report</h2>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={isSummaryLoading}
              title={isSummaryLoading ? "Report data is still loading for the selected filters" : undefined}
              className={`${exportCls} ${isSummaryLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={exportToPDF}
              disabled={isSummaryLoading}
              title={isSummaryLoading ? "Report data is still loading for the selected filters" : undefined}
              className={`${exportCls} ${isSummaryLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={exportToPPT}
              disabled={isSummaryLoading}
              title={isSummaryLoading ? "Report data is still loading for the selected filters" : undefined}
              className={`${exportCls} ${isSummaryLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Export PPT
            </button>
          </div>
        </div>

        {/* ── Filters row ── */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Lender / Borrower mode toggle */}
            <div className={`flex overflow-hidden rounded-lg border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>
              <button type="button" onClick={() => handleModeChange("lender")} className={`${modeBtnCls(countryMode === "lender")} rounded-none`}>Lender Country</button>
              <button type="button" onClick={() => handleModeChange("borrower")} className={`${modeBtnCls(countryMode === "borrower")} rounded-none border-l ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}>Borrower Country</button>
            </div>

            {/* Country multi-select dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setCountryDropdownOpen((o) => !o)} className={`${inputCls} flex items-center gap-2 min-w-37.5 cursor-pointer`}>
                <span className="flex-1 text-left truncate">
                  {selectedCountries.size === 0 ? "All Countries" : selectedCountries.size === 1 ? Array.from(selectedCountries)[0] : `${selectedCountries.size} countries`}
                </span>
                <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {countryDropdownOpen && (
                <div className={`absolute z-50 top-full mt-1 left-0 min-w-45 max-h-56 overflow-y-auto rounded-xl border shadow-xl ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                  {availableCountries.length === 0 ? (
                    <p className={`px-3 py-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No countries available</p>
                  ) : availableCountries.map((c) => (
                    <label key={c} className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}>
                      <input type="checkbox" checked={selectedCountries.has(c)} onChange={() => toggleCountry(c)} className="accent-indigo-600" />
                      {c}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* As-of date */}
            {/* <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>As of</span>
              <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={inputCls} style={{ minWidth: 140 }} />
            </div> */}

            {/* Borrower / Lender summary date range */}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Summary from</span>
              <input type="date" value={summaryStartDate} onChange={(e) => setSummaryStartDate(e.target.value)} className={inputCls} style={{ minWidth: 140 }} />
              <span className={`text-xs font-medium whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>to</span>
              <input type="date" value={summaryEndDate} onChange={(e) => setSummaryEndDate(e.target.value)} className={inputCls} style={{ minWidth: 140 }} />
              {(summaryStartDate || summaryEndDate) && (
                <button
                  type="button"
                  onClick={() => { setSummaryStartDate(""); setSummaryEndDate(""); }}
                  title="Reset date range"
                  className={`h-9 w-9 flex items-center justify-center rounded-lg border text-sm transition ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"}`}
                >
                  ×
                </button>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"}`}>
                Clear Filters
              </button>
            )}

        </div>

        {/* ── Show / hide toggles ── */}
        <div className={`mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          <span className="font-semibold text-xs">Show:</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showPanelSummary} onChange={(e) => setShowPanelSummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Panel Summary
          </label>
         
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showLoanDetailSummary} onChange={(e) => setShowLoanDetailSummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Loan Detail Summary
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showBorrowerSummary} onChange={(e) => setShowBorrowerSummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Borrower Summary
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showLenderSummary} onChange={(e) => setShowLenderSummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Lender Summary
          </label>
        </div>

        {/* ── Active filter chips ── */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Filters:</span>
            {Array.from(selectedCountries).map((c) => (
              <span key={c} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-indigo-900/40 text-indigo-200 border border-indigo-700/40" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                {c}
                <button type="button" onClick={() => toggleCountry(c)} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
              </span>
            ))}
            {asOfDate && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-cyan-900/40 text-cyan-200 border border-cyan-700/40" : "bg-cyan-50 text-cyan-700 border border-cyan-200"}`}>
                As of {asOfDate}
                <button type="button" onClick={() => setAsOfDate("")} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
              </span>
            )}
            {(summaryStartDate || summaryEndDate) && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-amber-900/40 text-amber-200 border border-amber-700/40" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                Summary {summaryStartDate || "…"} to {summaryEndDate || "…"}
                <button type="button" onClick={() => { setSummaryStartDate(""); setSummaryEndDate(""); }} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
              </span>
            )}
          </div>
        )}

        {/* ── KPI panels ── */}
        {showPanelSummary && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-violet-500/30 bg-violet-500/10" : "border-violet-100 bg-violet-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-violet-200" : "text-violet-700"}`}>Borrowing Countries</p>
              <p className="mt-2 text-xl font-bold leading-tight">{kpis.borrowingCountries}</p>
            </div>
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-indigo-500/30 bg-indigo-500/10" : "border-indigo-100 bg-indigo-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-indigo-200" : "text-indigo-600"}`}>Lending Countries</p>
              <p className="mt-2 text-xl font-bold leading-tight">{kpis.lendingCountries}</p>
            </div>
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-cyan-500/30 bg-cyan-500/10" : "border-cyan-100 bg-cyan-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-cyan-200" : "text-cyan-700"}`}>Cumulative Interest</p>
              <p className="mt-2 text-xl font-bold leading-tight break-all">{fmt(kpis.cumulativeInterest)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-100 bg-emerald-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-emerald-200" : "text-emerald-700"}`}>Cumulative Principal</p>
              <p className="mt-2 text-xl font-bold leading-tight break-all">{fmt(kpis.cumulativePrincipal)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-amber-500/30 bg-amber-500/10" : "border-amber-100 bg-amber-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-amber-200" : "text-amber-700"}`}>Cumulative Total</p>
              <p className="mt-2 text-xl font-bold leading-tight break-all">{fmt(kpis.cumulativeTotal)}</p>
            </div>
            <div className={`rounded-xl border p-4 ${isDarkMode ? "border-rose-500/30 bg-rose-500/10" : "border-rose-100 bg-rose-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${isDarkMode ? "text-rose-200" : "text-rose-700"}`}>Cumulative Fees</p>
              <p className="mt-2 text-xl font-bold leading-tight break-all">{fmt(kpis.cumulativeFees)}</p>
            </div>
          </div>
        )}

        {showLenderSummary && (
          <NameSummaryTable
            label="Lender Country Summary"
            colLabel="Country"
            rows={filteredLenderSummary}
            paged={pagedLender}
            page={lenderPage}
            totalPages={lenderTotalPages}
            setPage={setLenderPage}
          />
        )}

        {showBorrowerSummary && (
          <NameSummaryTable
            label="Borrower Country Summary"
            colLabel="Country"
            rows={filteredBorrowerSummary}
            paged={pagedBorrower}
            page={borrowerPage}
            totalPages={borrowerTotalPages}
            setPage={setBorrowerPage}
          />
        )}

        

        {/* ── Table 2: Loan Detail Summary ── */}
        {showLoanDetailSummary && (
          <div>
            <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>Loan Detail Summary</h3>
            <div className={tableCls}>
              <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className={theadCls}>
                  <tr>
                    <th className={thCls}>Lending Country</th>
                    <th className={thCls}>Borrowing Country</th>
                    <th className={thCls}>Loan Facility</th>
                    <th className={thCls}>Lender</th>
                    <th className={thCls}>Borrower</th>
                    <th className={thRCls}>Cumulative Principal</th>
                    <th className={thRCls}>Cumulative Interest</th>
                    <th className={thRCls}>Cumulative Fees</th>
                    <th className={thRCls}>Cumulative Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loanDetailSummary.length === 0 ? (
                    <tr><td colSpan={9} className={`px-6 py-8 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No loan detail data available.</td></tr>
                  ) : pagedLoanDetail.map((r, i) => (
                    <tr key={`${r.lendingCountry}-${r.loanFacility}-${i}`} className={trCls}>
                      <td className={tdCls}>{r.lendingCountry}</td>
                      <td className={tdCls}>{r.borrowingCountry}</td>
                      <td className={tdCls}>{r.loanFacility}</td>
                      <td className={tdCls}>{r.lender}</td>
                      <td className={tdCls}>{r.borrower}</td>
                      <td className={tdRCls}>{fmt(r.cumulativePrincipal)}</td>
                      <td className={tdRCls}>{fmt(r.cumulativeInterest)}</td>
                      <td className={tdRCls}>{fmt(r.cumulativeFees)}</td>
                      <td className={tdRCls}>{fmt(r.cumulativeTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationRow page={loanDetailPage} total={loanDetailSummary.length} totalPages={loanDetailTotalPages} setPage={setLoanDetailPage} />
          </div>
        )}

       

      </div>
    </div>
  );
}
