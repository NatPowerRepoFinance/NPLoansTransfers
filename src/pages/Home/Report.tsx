import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PptxGenJS from "pptxgenjs";
import { getCountrySummaryLoansReport, getCountrySummaryReport } from "@/api";

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

type CountryRow = Totals & { country: string };

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
  const [apiCountrySummary, setApiCountrySummary] = useState<
    Array<{ country: string; cumulativeInterest: number; cumulativePrincipal: number; total: number }>
  >([]);
  const [apiLoanDetailSummary, setApiLoanDetailSummary] = useState<
    Array<{
      country: string;
      loanFacility: string;
      lender: string;
      borrower: string;
      cumulativePrincipal: number;
      cumulativeInterest: number;
      total: number;
    }>
  >([]);

  useEffect(() => {
    const token = localStorage.getItem("poAccessToken");
    if (!token) return;
    let cancelled = false;
    getCountrySummaryReport(token)
      .then((rows) => { if (!cancelled) setApiCountrySummary(rows); })
      .catch(() => {});
    getCountrySummaryLoansReport(token)
      .then((rows) => { if (!cancelled) setApiLoanDetailSummary(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── Show / hide section toggles ───────────────────────────────
  const [showPanelSummary, setShowPanelSummary] = useState(true);
  const [showLendingCountrySummary, setShowLendingCountrySummary] = useState(true);
  const [showBorrowingCountrySummary, setShowBorrowingCountrySummary] = useState(true);
  const [showLoanDetailSummary, setShowLoanDetailSummary] = useState(true);

  // ── Filter state ──────────────────────────────────────────────
  const [countryMode, setCountryMode] = useState<"lender" | "borrower">("borrower");
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [asOfDate, setAsOfDate] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setCountryDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const loan of loans) {
      const id = countryMode === "lender" ? loan.lenderCompanyId : loan.borrowerCompanyId;
      const c = companies.find((co) => co.id === id)?.country?.trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [loans, companies, countryMode]);

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

  const clearFilters = () => { setSelectedCountries(new Set()); setAsOfDate(""); };
  const hasActiveFilters = selectedCountries.size > 0 || !!asOfDate;

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

  // ── KPI aggregates ────────────────────────────────────────────
  const kpis = useMemo(() => {
    const lenders = new Set<string>();
    const borrowers = new Set<string>();
    let cumulativeInterest = 0, cumulativePrincipal = 0, cumulativeTotal = 0, cumulativeFees = 0;
    for (const loan of filteredLoans) {
      const lc = companies.find((c) => c.id === loan.lenderCompanyId)?.country?.trim();
      const bc = companies.find((c) => c.id === loan.borrowerCompanyId)?.country?.trim();
      if (lc) lenders.add(lc);
      if (bc) borrowers.add(bc);
      const t = computeRowTotals(loan, filterSchedule(Array.isArray(loan.schedule) ? loan.schedule : []));
      cumulativeInterest += t.cumulativeInterest;
      cumulativePrincipal += t.cumulativePrincipal;
      cumulativeTotal += t.cumulativeTotal;
      cumulativeFees += t.cumulativeFees;
    }
    return { lendingCountries: lenders.size, borrowingCountries: borrowers.size, cumulativeInterest, cumulativePrincipal, cumulativeTotal, cumulativeFees };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLoans, companies, asOfDate]);

  // ── Lending Country Summary (Table 1) ─────────────────────────
  const lendingCountrySummary = useMemo<CountryRow[]>(() => {
    const map = new Map<string, Totals>();
    for (const loan of filteredLoans) {
      const country = companies.find((c) => c.id === loan.lenderCompanyId)?.country?.trim() || "Unknown";
      const t = computeRowTotals(loan, filterSchedule(Array.isArray(loan.schedule) ? loan.schedule : []));
      const prev = map.get(country) ?? { cumulativeInterest: 0, cumulativePrincipal: 0, cumulativeTotal: 0, cumulativeFees: 0 };
      map.set(country, {
        cumulativeInterest: prev.cumulativeInterest + t.cumulativeInterest,
        cumulativePrincipal: prev.cumulativePrincipal + t.cumulativePrincipal,
        cumulativeTotal: prev.cumulativeTotal + t.cumulativeTotal,
        cumulativeFees: prev.cumulativeFees + t.cumulativeFees,
      });
    }
    return Array.from(map.entries())
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => a.country.localeCompare(b.country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLoans, companies, asOfDate]);

  // ── Borrowing Country Summary (Table 1A) ──────────────────────
  const borrowingCountrySummary = useMemo<CountryRow[]>(() => {
    const map = new Map<string, Totals>();
    for (const loan of filteredLoans) {
      const country = companies.find((c) => c.id === loan.borrowerCompanyId)?.country?.trim() || "Unknown";
      const t = computeRowTotals(loan, filterSchedule(Array.isArray(loan.schedule) ? loan.schedule : []));
      const prev = map.get(country) ?? { cumulativeInterest: 0, cumulativePrincipal: 0, cumulativeTotal: 0, cumulativeFees: 0 };
      map.set(country, {
        cumulativeInterest: prev.cumulativeInterest + t.cumulativeInterest,
        cumulativePrincipal: prev.cumulativePrincipal + t.cumulativePrincipal,
        cumulativeTotal: prev.cumulativeTotal + t.cumulativeTotal,
        cumulativeFees: prev.cumulativeFees + t.cumulativeFees,
      });
    }
    return Array.from(map.entries())
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => a.country.localeCompare(b.country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLoans, companies, asOfDate]);

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

    // Supplement with API data for loans without local schedules
    const merged = [...computed];
    for (const apiRow of apiLoanDetailSummary) {
      const idx = merged.findIndex((m) => m.loanFacility === apiRow.loanFacility);
      const src = loans.find((l) => l.name === apiRow.loanFacility);
      const hasSchedule = src && Array.isArray(src.schedule) && src.schedule.length > 0;
      if (idx === -1) {
        merged.push({
          lendingCountry: apiRow.country, borrowingCountry: "-",
          loanFacility: apiRow.loanFacility, lender: apiRow.lender, borrower: apiRow.borrower,
          cumulativePrincipal: apiRow.cumulativePrincipal ?? 0,
          cumulativeInterest: apiRow.cumulativeInterest ?? 0,
          cumulativeTotal: apiRow.total ?? 0,
          cumulativeFees: 0,
        });
      } else if (!hasSchedule) {
        merged[idx] = { ...merged[idx], cumulativePrincipal: apiRow.cumulativePrincipal ?? 0, cumulativeInterest: apiRow.cumulativeInterest ?? 0, cumulativeTotal: apiRow.total ?? 0 };
      }
    }

    return merged.sort((a, b) =>
      a.lendingCountry === b.lendingCountry
        ? a.loanFacility.localeCompare(b.loanFacility)
        : a.lendingCountry.localeCompare(b.lendingCountry)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLoans, companies, asOfDate, apiLoanDetailSummary, loans]);

  // ── Pagination ────────────────────────────────────────────────
  const [lendingPage, setLendingPage] = useState(0);
  const [borrowingPage, setBorrowingPage] = useState(0);
  const [loanDetailPage, setLoanDetailPage] = useState(0);

  const lendingTotalPages = Math.max(1, Math.ceil(lendingCountrySummary.length / PAGE_SIZE));
  const borrowingTotalPages = Math.max(1, Math.ceil(borrowingCountrySummary.length / PAGE_SIZE));
  const loanDetailTotalPages = Math.max(1, Math.ceil(loanDetailSummary.length / PAGE_SIZE));

  useEffect(() => setLendingPage((p) => Math.min(p, lendingTotalPages - 1)), [lendingTotalPages]);
  useEffect(() => setBorrowingPage((p) => Math.min(p, borrowingTotalPages - 1)), [borrowingTotalPages]);
  useEffect(() => setLoanDetailPage((p) => Math.min(p, loanDetailTotalPages - 1)), [loanDetailTotalPages]);

  const pagedLending = lendingCountrySummary.slice(lendingPage * PAGE_SIZE, (lendingPage + 1) * PAGE_SIZE);
  const pagedBorrowing = borrowingCountrySummary.slice(borrowingPage * PAGE_SIZE, (borrowingPage + 1) * PAGE_SIZE);
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
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary KPIs
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

    // Sheet 2: Lending Country Summary
    const lendingWs = XLSX.utils.json_to_sheet(lendingCountrySummary.map((r) => ({
      "Lending Country": r.country,
      "Cumulative Interest": +r.cumulativeInterest.toFixed(2),
      "Cumulative Principal": +r.cumulativePrincipal.toFixed(2),
      "Cumulative Fees": +r.cumulativeFees.toFixed(2),
      "Cumulative Total": +r.cumulativeTotal.toFixed(2),
    })));
    lendingWs["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, lendingWs, "Lending Country Summary");

    // Sheet 3: Borrowing Country Summary
    const borrowingWs = XLSX.utils.json_to_sheet(borrowingCountrySummary.map((r) => ({
      "Borrowing Country": r.country,
      "Cumulative Interest": +r.cumulativeInterest.toFixed(2),
      "Cumulative Principal": +r.cumulativePrincipal.toFixed(2),
      "Cumulative Fees": +r.cumulativeFees.toFixed(2),
      "Cumulative Total": +r.cumulativeTotal.toFixed(2),
    })));
    borrowingWs["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, borrowingWs, "Borrowing Country Summary");

    // Sheet 4: Loan Detail Summary
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

    XLSX.writeFile(wb, `country_summary_report_${dateStamp}.xlsx`);
  };

  // ── PDF ───────────────────────────────────────────────────────
  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Shared table styles
    const headStyles = { fillColor: [79, 70, 229] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const, fontSize: 8 };
    const altRowStyles = { fillColor: [238, 242, 255] as [number, number, number] };
    const numCols = (indices: number[]) => Object.fromEntries(indices.map((i) => [i, { halign: "right" as const }]));

    // Header on page 1
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("Loans & Transfers", 14, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Country Summary Report", 14, 23);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(exportStr, pageW - 14, 16, { align: "right" });
    if (activeFilterLabel) doc.text(`Filters: ${activeFilterLabel}`, pageW - 14, 22, { align: "right" });

    // KPI summary table
    doc.setTextColor(0, 0, 0);
    let y = 30;
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

    // Table 1: Lending Country Summary
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(79, 70, 229);
    doc.text("Lending Country Summary", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y,
      head: [["Lending Country", "Cumulative Interest", "Cumulative Principal", "Cumulative Fees", "Cumulative Total"]],
      body: lendingCountrySummary.map((r) => [r.country, fmt(r.cumulativeInterest), fmt(r.cumulativePrincipal), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
      headStyles, alternateRowStyles: altRowStyles,
      columnStyles: numCols([1, 2, 3, 4]),
      styles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    });

    // Table 2: Borrowing Country Summary
    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > pageH - 50) { doc.addPage(); y = 14; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(79, 70, 229);
    doc.text("Borrowing Country Summary", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y,
      head: [["Borrowing Country", "Cumulative Interest", "Cumulative Principal", "Cumulative Fees", "Cumulative Total"]],
      body: borrowingCountrySummary.map((r) => [r.country, fmt(r.cumulativeInterest), fmt(r.cumulativePrincipal), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
      headStyles, alternateRowStyles: altRowStyles,
      columnStyles: numCols([1, 2, 3, 4]),
      styles: { fontSize: 8 }, margin: { left: 14, right: 14 },
    });

    // Table 3: Loan Detail Summary — always new page
    doc.addPage();
    y = 14;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(79, 70, 229);
    doc.text("Loan Detail Summary", 14, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y,
      head: [["Lending Country", "Borrowing Country", "Loan Facility", "Lender", "Borrower", "Cum. Principal", "Cum. Interest", "Cum. Fees", "Cum. Total"]],
      body: loanDetailSummary.map((r) => [r.lendingCountry, r.borrowingCountry, r.loanFacility, r.lender, r.borrower, fmt(r.cumulativePrincipal), fmt(r.cumulativeInterest), fmt(r.cumulativeFees), fmt(r.cumulativeTotal)]),
      headStyles, alternateRowStyles: altRowStyles,
      columnStyles: numCols([5, 6, 7, 8]),
      styles: { fontSize: 7 }, margin: { left: 14, right: 14 },
    });

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

    // ── Slide 3: Lending Country Summary ──
    const lSlide = pptx.addSlide();
    lSlide.addText("Lending Country Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 18, bold: true, color: IND });
    lSlide.addTable(
      [
        [hdr("Lending Country"), hdr("Cumulative Interest", "right"), hdr("Cumulative Principal", "right"), hdr("Cumulative Fees", "right"), hdr("Cumulative Total", "right")],
        ...lendingCountrySummary.map((r, i) => [
          cel(r.country, false, i % 2 === 1),
          cel(fmt(r.cumulativeInterest), true, i % 2 === 1),
          cel(fmt(r.cumulativePrincipal), true, i % 2 === 1),
          cel(fmt(r.cumulativeFees), true, i % 2 === 1),
          cel(fmt(r.cumulativeTotal), true, i % 2 === 1),
        ]),
      ] as any,
      { x: 0.4, y: 0.82, w: 12.5, h: 6.2, colW: [3.5, 2.4, 2.4, 2.0, 2.2] }
    );

    // ── Slide 4: Borrowing Country Summary ──
    const bSlide = pptx.addSlide();
    bSlide.addText("Borrowing Country Summary", { x: 0.4, y: 0.15, w: 12.5, h: 0.5, fontSize: 18, bold: true, color: IND });
    bSlide.addTable(
      [
        [hdr("Borrowing Country"), hdr("Cumulative Interest", "right"), hdr("Cumulative Principal", "right"), hdr("Cumulative Fees", "right"), hdr("Cumulative Total", "right")],
        ...borrowingCountrySummary.map((r, i) => [
          cel(r.country, false, i % 2 === 1),
          cel(fmt(r.cumulativeInterest), true, i % 2 === 1),
          cel(fmt(r.cumulativePrincipal), true, i % 2 === 1),
          cel(fmt(r.cumulativeFees), true, i % 2 === 1),
          cel(fmt(r.cumulativeTotal), true, i % 2 === 1),
        ]),
      ] as any,
      { x: 0.4, y: 0.82, w: 12.5, h: 6.2, colW: [3.5, 2.4, 2.4, 2.0, 2.2] }
    );

    // ── Slide 5: Loan Detail Summary ──
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

  const PaginationRow = ({ page, total, totalPages, setPage }: { page: number; total: number; totalPages: number; setPage: (n: number) => void }) =>
    total > PAGE_SIZE ? (
      <div className={`flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Showing <b>{page * PAGE_SIZE + 1}</b>–<b>{Math.min(total, (page + 1) * PAGE_SIZE)}</b> of <b>{total}</b>
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className={btnPageCls(page === 0)}>Prev</button>
          <span className={`text-xs font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Page {page + 1} of {totalPages}</span>
          <button type="button" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className={btnPageCls(page >= totalPages - 1)}>Next</button>
        </div>
      </div>
    ) : null;

  // ── Country summary table helper ──────────────────────────────
  const CountryTable = ({ label, colLabel, rows, paged, page, totalPages, setPage }: {
    label: string; colLabel: string; rows: CountryRow[]; paged: CountryRow[];
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
              <tr key={r.country} className={trCls}>
                <td className={tdCls}>{r.country}</td>
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
            <button type="button" onClick={exportToExcel} className={exportCls}>Export Excel</button>
            <button type="button" onClick={exportToPDF} className={exportCls}>Export PDF</button>
            <button type="button" onClick={exportToPPT} className={exportCls}>Export PPT</button>
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
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>As of</span>
              <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={inputCls} style={{ minWidth: 140 }} />
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
            <input type="checkbox" checked={showLendingCountrySummary} onChange={(e) => setShowLendingCountrySummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Lending Country Summary
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showBorrowingCountrySummary} onChange={(e) => setShowBorrowingCountrySummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Borrowing Country Summary
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showLoanDetailSummary} onChange={(e) => setShowLoanDetailSummary(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5" />
            Loan Detail Summary
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

        {/* ── Table 1: Lending Country Summary ── */}
        {showLendingCountrySummary && (
          <CountryTable
            label="Lending Country Summary"
            colLabel="Lending Country"
            rows={lendingCountrySummary}
            paged={pagedLending}
            page={lendingPage}
            totalPages={lendingTotalPages}
            setPage={setLendingPage}
          />
        )}

        {/* ── Table 1A: Borrowing Country Summary ── */}
        {showBorrowingCountrySummary && (
          <CountryTable
            label="Borrowing Country Summary"
            colLabel="Borrowing Country"
            rows={borrowingCountrySummary}
            paged={pagedBorrowing}
            page={borrowingPage}
            totalPages={borrowingTotalPages}
            setPage={setBorrowingPage}
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
