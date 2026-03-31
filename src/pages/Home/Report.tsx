import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PptxGenJS from "pptxgenjs";
import { getCountrySummaryLoansReport, getCountrySummaryReport } from "@/api";

type ReportTabProps = {
  isDarkMode: boolean;
  loans: Array<{
    name?: string;
    borrowerCompanyId: string;
    lenderCompanyId: string;
    annualInterestRate: number;
    daysInYear: number;
    schedule?: Array<{
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
    }>;
  }>;
  companies: Array<{
    id: string;
    name?: string;
    country: string;
  }>;
};

export default function ReportTab({ isDarkMode, loans, companies }: ReportTabProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
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

  const computedCountrySummary = useMemo(() => {
    const summary = new Map<
      string,
      { cumulativeInterest: number; cumulativePrincipal: number; total: number }
    >();

    for (const loan of loans) {
      const borrowerCountry =
        companies.find((company) => company.id === loan.borrowerCompanyId)?.country?.trim() || "";
      const lenderCountry =
        companies.find((company) => company.id === loan.lenderCompanyId)?.country?.trim() || "";
      const country = borrowerCountry || lenderCountry || "Unknown";
      const rows = Array.isArray(loan.schedule) ? loan.schedule : [];

      let cumulativeInterest = 0;
      let cumulativePrincipal = 0;
      let total = 0;

      for (const row of rows) {
        const drawDown = Number(row?.drawDown ?? 0);
        const repayment = Number(row?.repayment ?? 0);
        const fees = Number(row?.fees ?? 0);
        const principal = Number(row?.principal ?? drawDown - repayment);

        const annualInterestRate = Number(
          row?.annualInterestRate ?? loan.annualInterestRate ?? 0
        );
        const explicitDays = Number(row?.days ?? 0);
        const derivedDays =
          row?.startDate && row?.endDate
            ? Math.max(
                0,
                Math.round(
                  (new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 0;
        const days = explicitDays > 0 ? explicitDays : derivedDays;
        const yearBasis = Number(loan.daysInYear ?? 365) || 365;
        const interest = Number(
          row?.interest ?? (principal * annualInterestRate * days) / (100 * yearBasis)
        );
        const rowTotal = Number(row?.total ?? principal + interest + fees);

        cumulativePrincipal += principal;
        cumulativeInterest += interest;
        total += rowTotal;
      }

      const current = summary.get(country) ?? {
        cumulativeInterest: 0,
        cumulativePrincipal: 0,
        total: 0,
      };

      summary.set(country, {
        cumulativeInterest: current.cumulativeInterest + cumulativeInterest,
        cumulativePrincipal: current.cumulativePrincipal + cumulativePrincipal,
        total: current.total + total,
      });
    }

    return Array.from(summary.entries())
      .map(([country, values]) => ({ country, ...values }))
      .sort((first, second) => first.country.localeCompare(second.country));
  }, [loans, companies]);

  useEffect(() => {
    const poAccessToken = localStorage.getItem("poAccessToken");
    if (!poAccessToken) {
      setApiCountrySummary([]);
      return;
    }

    let cancelled = false;
    getCountrySummaryReport(poAccessToken)
      .then((rows) => {
        if (!cancelled) {
          setApiCountrySummary(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiCountrySummary([]);
        }
      });

    getCountrySummaryLoansReport(poAccessToken)
      .then((rows) => {
        if (!cancelled) {
          setApiLoanDetailSummary(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiLoanDetailSummary([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countrySummary = apiCountrySummary.length > 0 ? apiCountrySummary : computedCountrySummary;

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const computedLoanDetailSummary = useMemo(() => {
    return loans
      .map((loan) => {
        const lenderCompany = companies.find((company) => company.id === loan.lenderCompanyId);
        const borrowerCompany = companies.find((company) => company.id === loan.borrowerCompanyId);
        const country = borrowerCompany?.country?.trim() || lenderCompany?.country?.trim() || "Unknown";
        const rows = Array.isArray(loan.schedule) ? loan.schedule : [];

        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;
        let total = 0;

        for (const row of rows) {
          const drawDown = Number(row?.drawDown ?? 0);
          const repayment = Number(row?.repayment ?? 0);
          const fees = Number(row?.fees ?? 0);
          const principal = Number(row?.principal ?? drawDown - repayment);

          const annualInterestRate = Number(
            row?.annualInterestRate ?? loan.annualInterestRate ?? 0
          );
          const explicitDays = Number(row?.days ?? 0);
          const derivedDays =
            row?.startDate && row?.endDate
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;
          const days = explicitDays > 0 ? explicitDays : derivedDays;
          const yearBasis = Number(loan.daysInYear ?? 365) || 365;
          const interest = Number(
            row?.interest ?? (principal * annualInterestRate * days) / (100 * yearBasis)
          );
          const rowTotal = Number(row?.total ?? principal + interest + fees);

          cumulativePrincipal += principal;
          cumulativeInterest += interest;
          total += rowTotal;
        }

        return {
          country,
          loanFacility: loan.name || "-",
          lender: lenderCompany?.name || "-",
          borrower: borrowerCompany?.name || "-",
          cumulativePrincipal,
          cumulativeInterest,
          total,
        };
      })
      .sort((first, second) => {
        if (first.country === second.country) {
          return first.loanFacility.localeCompare(second.loanFacility);
        }
        return first.country.localeCompare(second.country);
      });
  }, [loans, companies]);
  const loanDetailSummary =
    apiLoanDetailSummary.length > 0 ? apiLoanDetailSummary : computedLoanDetailSummary;

  const reportKpis = useMemo(() => {
    return countrySummary.reduce(
      (acc, row) => ({
        countries: acc.countries + 1,
        cumulativeInterest: acc.cumulativeInterest + Number(row.cumulativeInterest || 0),
        cumulativePrincipal: acc.cumulativePrincipal + Number(row.cumulativePrincipal || 0),
        total: acc.total + Number(row.total || 0),
      }),
      { countries: 0, cumulativeInterest: 0, cumulativePrincipal: 0, total: 0 },
    );
  }, [countrySummary]);

  const countryCoordinates = useMemo<Record<string, [number, number]>>(
    () => ({
      italy: [12.5674, 41.8719],
      "united kingdom": [-3.436, 55.3781],
      "united states": [-95.7129, 37.0902],
      usa: [-95.7129, 37.0902],
      us: [-95.7129, 37.0902],
      kazakhstan: [66.9237, 48.0196],
      khazakstan: [66.9237, 48.0196],
      india: [78.9629, 20.5937],
      global: [0, 20],
      unknown: [0, 0],
    }),
    []
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: isDarkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [10, 25],
      zoom: 1.2,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    for (const row of countrySummary) {
      const coordinate = countryCoordinates[row.country.trim().toLowerCase()];
      if (!coordinate) continue;

      const markerEl = document.createElement("div");
      markerEl.style.width = "10px";
      markerEl.style.height = "10px";
      markerEl.style.borderRadius = "9999px";
      markerEl.style.backgroundColor = "#2563eb";
      markerEl.style.border = "2px solid #ffffff";
      markerEl.style.boxShadow = "0 1px 6px rgba(0,0,0,0.4)";

      new maplibregl.Marker({ element: markerEl })
        .setLngLat(coordinate)
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<div><strong>${row.country}</strong><br/>Cumulative Interest: ${formatCurrency(
              row.cumulativeInterest
            )}<br/>Cumulative Principal: ${formatCurrency(
              row.cumulativePrincipal
            )}<br/>Total: ${formatCurrency(row.total)}</div>`
          )
        )
        .addTo(map);
    }

    return () => {
      map.remove();
    };
  }, [countrySummary, countryCoordinates, isDarkMode]);

  const exportReportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const countrySummarySheet = XLSX.utils.json_to_sheet(
      countrySummary.map((row) => ({
        Country: row.country,
        "Cumulative Interest": Number(row.cumulativeInterest.toFixed(2)),
        "Cumulative Principal": Number(row.cumulativePrincipal.toFixed(2)),
        Total: Number(row.total.toFixed(2)),
      }))
    );

    const loanDetailSheet = XLSX.utils.json_to_sheet(
      loanDetailSummary.map((row) => ({
        Country: row.country,
        "Loan Facility": row.loanFacility,
        Lender: row.lender,
        Borrower: row.borrower,
        "Cumulative Principal": Number(row.cumulativePrincipal.toFixed(2)),
        "Cumulative Interest": Number(row.cumulativeInterest.toFixed(2)),
        Total: Number(row.total.toFixed(2)),
      }))
    );

    XLSX.utils.book_append_sheet(workbook, countrySummarySheet, "Country Summary");
    XLSX.utils.book_append_sheet(workbook, loanDetailSheet, "Loan Detail Summary");
    XLSX.writeFile(workbook, "country_summary_report.xlsx");
  };

  const exportReportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Country Summary Report", 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Country", "Cumulative Interest", "Cumulative Principal", "Total"]],
      body: countrySummary.map((row) => [
        row.country,
        formatCurrency(row.cumulativeInterest),
        formatCurrency(row.cumulativePrincipal),
        formatCurrency(row.total),
      ]),
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[
        "Country",
        "Loan Facility",
        "Lender",
        "Borrower",
        "Cumulative Principal",
        "Cumulative Interest",
        "Total",
      ]],
      body: loanDetailSummary.map((row) => [
        row.country,
        row.loanFacility,
        row.lender,
        row.borrower,
        formatCurrency(row.cumulativePrincipal),
        formatCurrency(row.cumulativeInterest),
        formatCurrency(row.total),
      ]),
      styles: { fontSize: 7 },
    });

    doc.save("country_summary_report.pdf");
  };

  const exportReportToPPT = () => {
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    const slideOne = pptx.addSlide();
    slideOne.addText("Country Summary Report", {
      x: 0.4,
      y: 0.2,
      w: 12,
      h: 0.5,
      fontSize: 20,
      bold: true,
    });

    slideOne.addTable(
      [
        [
          { text: "Country" },
          { text: "Cumulative Interest" },
          { text: "Cumulative Principal" },
          { text: "Total" },
        ],
        ...countrySummary.map((row) => [
          { text: row.country },
          { text: formatCurrency(row.cumulativeInterest) },
          { text: formatCurrency(row.cumulativePrincipal) },
          { text: formatCurrency(row.total) },
        ]),
      ] as any,
      {
        x: 0.4,
        y: 0.9,
        w: 12.5,
        h: 5.0,
        fontSize: 10,
        border: { type: "solid", color: "D9D9D9", pt: 1 },
      }
    );

    const slideTwo = pptx.addSlide();
    slideTwo.addText("Loan Detail Summary By Country", {
      x: 0.4,
      y: 0.2,
      w: 12,
      h: 0.5,
      fontSize: 20,
      bold: true,
    });

    slideTwo.addTable(
      [
        [
          { text: "Country" },
          { text: "Loan Facility" },
          { text: "Lender" },
          { text: "Borrower" },
          { text: "Cumulative Principal" },
          { text: "Cumulative Interest" },
          { text: "Total" },
        ],
        ...loanDetailSummary.map((row) => [
          { text: row.country },
          { text: row.loanFacility },
          { text: row.lender },
          { text: row.borrower },
          { text: formatCurrency(row.cumulativePrincipal) },
          { text: formatCurrency(row.cumulativeInterest) },
          { text: formatCurrency(row.total) },
        ]),
      ] as any,
      {
        x: 0.2,
        y: 0.9,
        w: 13.0,
        h: 5.8,
        fontSize: 8,
        border: { type: "solid", color: "D9D9D9", pt: 1 },
      }
    );

    void pptx.writeFile({ fileName: "country_summary_report.pptx" });
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-[0_10px_35px_rgba(2,6,23,0.12)] ${
        isDarkMode ? "bg-gray-900/80 border-gray-700/80 backdrop-blur" : "bg-white/90 border-gray-200"
      }`}
    >
      <div className={`rounded-2xl p-8 ${isDarkMode ? "bg-gray-800/90" : "bg-gray-50/90"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Country Summary Report</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportReportToExcel}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition shadow-sm ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
              }`}
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={exportReportToPDF}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition shadow-sm ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
              }`}
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={exportReportToPPT}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition shadow-sm ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
              }`}
            >
              Export PPT
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className={`rounded-xl border p-4 ${isDarkMode ? "border-indigo-500/30 bg-indigo-500/10" : "border-indigo-100 bg-indigo-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-indigo-200" : "text-indigo-600"}`}>Countries</p>
            <p className="mt-2 text-2xl font-bold">{reportKpis.countries}</p>
          </div>
          <div className={`rounded-xl border p-4 ${isDarkMode ? "border-cyan-500/30 bg-cyan-500/10" : "border-cyan-100 bg-cyan-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-cyan-200" : "text-cyan-700"}`}>Cumulative Interest</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(reportKpis.cumulativeInterest)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-100 bg-emerald-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-emerald-200" : "text-emerald-700"}`}>Cumulative Principal</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(reportKpis.cumulativePrincipal)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${isDarkMode ? "border-violet-500/30 bg-violet-500/10" : "border-violet-100 bg-violet-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-violet-200" : "text-violet-700"}`}>Total Exposure</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(reportKpis.total)}</p>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border shadow-sm ${isDarkMode ? "border-gray-700/80 bg-gray-900/40" : "border-gray-200 bg-white"}`}>
          <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
            <thead className={`${isDarkMode ? "bg-gray-700/80" : "bg-slate-100"}`}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Cumulative Interest</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Cumulative Principal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {countrySummary.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`px-6 py-8 text-center text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No report data available.
                  </td>
                </tr>
              ) : (
                countrySummary.map((row) => (
                  <tr
                    key={row.country}
                    className={`border-t transition-colors ${isDarkMode ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-4 text-sm">{row.country}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(row.cumulativeInterest)}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(row.cumulativePrincipal)}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(row.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Map View</h3>
          <div
            ref={mapContainerRef}
            className={`rounded-lg border overflow-hidden ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            style={{ height: 360 }}
          />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Loan Detail Summary By Country</h3>
          <div
            className={`overflow-x-auto rounded-xl border shadow-sm ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <table className="w-full text-sm [border-collapse:separate] [border-spacing:0] [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px] [&_th]:font-bold [&_td]:align-middle [&_th]:border [&_td]:border [&_th]:border-slate-300/40 [&_td]:border-slate-300/30">
              <thead className={`${isDarkMode ? "bg-gray-700/80" : "bg-slate-100"}`}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Loan Facility</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Lender</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Borrower</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cumulative Principal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cumulative Interest</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {loanDetailSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className={`px-6 py-8 text-center text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      No loan detail data available.
                    </td>
                  </tr>
                ) : (
                  loanDetailSummary.map((row, index) => (
                    <tr
                      key={`${row.country}-${row.loanFacility}-${index}`}
                      className={`border-t transition-colors ${isDarkMode ? "border-gray-700 hover:bg-white/5" : "border-gray-200 hover:bg-slate-50"}`}
                    >
                      <td className="px-6 py-4 text-sm">{row.country}</td>
                      <td className="px-6 py-4 text-sm">{row.loanFacility}</td>
                      <td className="px-6 py-4 text-sm">{row.lender}</td>
                      <td className="px-6 py-4 text-sm">{row.borrower}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(row.cumulativePrincipal)}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(row.cumulativeInterest)}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
