import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  MagnifyingGlassPlusIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

import imgSignIn from "@/assets/help/sign-in.png";
import imgLoanFacility from "@/assets/help/loan-facility-tab.png";
import imgLoanFacilityLight from "@/assets/help/loan-facility-light.png";
import imgNewLoanModal from "@/assets/help/new-loan-modal.png";
import imgImportSchedule from "@/assets/help/import-schedule-modal.png";
import imgAdminTab from "@/assets/help/admin-tab.png";
import imgAdminTabLight from "@/assets/help/admin-tab-light.png";
import imgReportTab from "@/assets/help/report-tab.png";
import imgNavbar from "@/assets/help/navbar.png";
import imgHelpOverview from "@/assets/help/help-overview.png";

type HelpTabProps = {
  isDarkMode: boolean;
};

type HelpSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  body: React.ReactNode;
};

/* ─── Lightbox component for zoomable images ─── */
function HelpImage({
  src,
  alt,
  className,
  caption,
}: {
  src: string;
  alt: string;
  className: string;
  caption?: string;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <figure className="group relative my-3">
        <div
          className={`relative cursor-zoom-in overflow-hidden ${className}`}
          onClick={() => setIsZoomed(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsZoomed(true)}
        >
          <img src={src} alt={alt} className="w-full h-auto" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
            <MagnifyingGlassPlusIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
          </div>
        </div>
        {caption && (
          <figcaption className="mt-1.5 text-xs text-center opacity-60 italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
          style={{ animation: "helpFadeIn 150ms ease-out" }}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[92vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
            style={{ animation: "helpScaleIn 200ms ease-out" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

/* ─── Quick Start Wizard ─── */
const QUICK_START_STEPS = [
  {
    title: "Sign In",
    desc: "Authenticate with your Microsoft account to access the system.",
    img: imgSignIn,
  },
  {
    title: "Set Up Admin",
    desc: "Configure companies, users, countries, and currency exchange rates.",
    img: imgAdminTabLight,
  },
  {
    title: "Create Loan",
    desc: "Open the Loan Facility tab and click New to create a loan facility.",
    img: imgNewLoanModal,
  },
  {
    title: "Add Schedule",
    desc: "Add draw down rows manually or import from Excel.",
    img: imgLoanFacilityLight,
  },
  {
    title: "View Reports",
    desc: "Open the Report tab for aggregated analytics and exports.",
    img: imgReportTab,
  },
];

function QuickStartWizard({ isDarkMode }: { isDarkMode: boolean }) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const cardBg = isDarkMode ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200";
  const stepActive = isDarkMode
    ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
    : "bg-indigo-50 border-indigo-500 text-indigo-700";
  const stepDone = isDarkMode
    ? "bg-green-500/15 border-green-500/50 text-green-400"
    : "bg-green-50 border-green-500 text-green-700";
  const stepInactive = isDarkMode
    ? "bg-gray-700/50 border-gray-600 text-gray-400"
    : "bg-gray-50 border-gray-300 text-gray-500";

  const markDone = () => {
    setCompleted((prev) => new Set([...prev, step]));
    if (step < QUICK_START_STEPS.length - 1) setStep(step + 1);
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${cardBg} mb-5`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className={`w-5 h-5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
          <h3 className="font-semibold text-sm">Quick Start Guide</h3>
          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {completed.size}/{QUICK_START_STEPS.length} completed
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""} ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? "max-h-0 opacity-0 mt-0" : "max-h-screen opacity-100 mt-4"
        }`}
      >
        {/* Stepper dots */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {QUICK_START_STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                i === step ? stepActive : completed.has(i) ? stepDone : stepInactive
              }`}
            >
              {completed.has(i) ? (
                <CheckCircleIcon className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className={`w-full sm:w-2/5 rounded-lg border ${
              isDarkMode ? "border-gray-600" : "border-gray-200"
            }`}
          >
            <img
              src={QUICK_START_STEPS[step].img}
              alt={QUICK_START_STEPS[step].title}
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}
              >
                Step {step + 1} of {QUICK_START_STEPS.length}
              </p>
              <h4 className="font-semibold text-lg mt-0.5">{QUICK_START_STEPS[step].title}</h4>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {QUICK_START_STEPS[step].desc}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  step === 0
                    ? "opacity-40 cursor-not-allowed"
                    : isDarkMode
                    ? "border-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                <ArrowLeftIcon className="w-3 h-3" /> Back
              </button>
              <button
                onClick={markDone}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all shadow-sm"
              >
                {step === QUICK_START_STEPS.length - 1 ? (
                  "Finish"
                ) : (
                  <>
                    Got it <ArrowRightIcon className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className={`mt-4 h-1.5 rounded-full overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completed.size / QUICK_START_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Table of Contents (mini nav) ─── */
function TableOfContents({
  sections,
  openIds,
  onJump,
  isDarkMode,
}: {
  sections: HelpSection[];
  openIds: Set<string>;
  onJump: (id: string) => void;
  isDarkMode: boolean;
}) {
  return (
    <nav
      className={`hidden lg:block sticky top-4 w-48 shrink-0 rounded-lg border p-3 text-xs space-y-1 ${
        isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}
    >
      <p className={`font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        On this page
      </p>
      {sections.map((s) => {
        const isActive = openIds.has(s.id);
        return (
          <button
            key={s.id}
            onClick={() => onJump(s.id)}
            className={`block w-full text-left px-2 py-1 rounded transition-colors truncate ${
              isActive
                ? isDarkMode
                  ? "bg-indigo-500/15 text-indigo-300 font-medium"
                  : "bg-indigo-50 text-indigo-700 font-medium"
                : isDarkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
            dangerouslySetInnerHTML={{ __html: s.title }}
          />
        );
      })}
    </nav>
  );
}

/* ─── Interactive FAQ accordion ─── */
function FAQ({
  isDarkMode,
  items,
}: {
  isDarkMode: boolean;
  items: { q: string; a: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`rounded-lg border transition-all duration-200 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } ${isOpen ? "shadow-sm" : ""}`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={`w-full flex items-center justify-between text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800/50 text-indigo-300"
                  : "hover:bg-gray-50 text-indigo-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <QuestionMarkCircleIcon className="w-4 h-4 shrink-0" />
                {item.q}
              </span>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p
                className={`px-3 pb-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Help Tab ─── */
export default function HelpTab({ isDarkMode }: HelpTabProps) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["overview"]));
  const [readSections, setReadSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setReadSections((prev) => new Set([...prev, id]));
  };

  const jumpTo = useCallback((id: string) => {
    setOpenIds((prev) => new Set([...prev, id]));
    setReadSections((prev) => new Set([...prev, id]));
    setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const card = isDarkMode
    ? "bg-gray-900 border-gray-700 text-gray-100"
    : "bg-white border-gray-200 text-gray-800";
  const subText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const accent = isDarkMode ? "text-indigo-300" : "text-indigo-700";
  const chip = isDarkMode
    ? "bg-indigo-500/15 text-indigo-300 border-indigo-400/30"
    : "bg-indigo-50 text-indigo-700 border-indigo-200";
  const codeBox = isDarkMode
    ? "bg-gray-800 border-gray-700 text-gray-200"
    : "bg-gray-50 border-gray-200 text-gray-800";
  const itemHeader = isDarkMode
    ? "bg-gray-800/60 hover:bg-gray-800 border-gray-700"
    : "bg-gray-50 hover:bg-gray-100 border-gray-200";

  const helpImg =
    "rounded-lg border shadow-sm w-full max-w-3xl " +
    (isDarkMode ? "border-gray-700" : "border-gray-200");

  const sections: HelpSection[] = useMemo(
    () => [
      {
        id: "overview",
        title: "Overview",
        icon: BookOpenIcon,
        summary:
          "What this application does and the high-level workflow for managing intercompany loan facilities.",
        body: (
          <div className="space-y-3">
            <p>
              <strong>NP Loans &amp; Transfers</strong> is the NatPower finance tool for creating
              and managing intercompany loan facilities, recording draw downs, repayments and fees
              on a schedule, and producing reports.
            </p>
            <HelpImage
              src={imgLoanFacility}
              alt="Loan Facility main view"
              className={helpImg}
              caption="The main Loan Facility workspace (dark mode) — click to zoom"
            />
            <p className={subText}>Typical workflow:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Set up reference data in <span className={accent}>Admin</span> (companies, users,
                countries, currency exchange rates).
              </li>
              <li>
                Create a Loan Facility under the <span className={accent}>Loan Facility</span> tab.
              </li>
              <li>
                Add schedule rows (draw downs, repayments, fees) — manually or via Excel import.
              </li>
              <li>
                Review the calculated principal, interest and totals in the schedule grid.
              </li>
              <li>
                Open the <span className={accent}>Report</span> tab for cross-loan analytics and
                exports.
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: "roles",
        title: "Roles &amp; Permissions",
        icon: ShieldCheckIcon,
        summary: "Who can do what — Admin, Editor and Viewer permissions.",
        body: (
          <div className="space-y-3">
            <HelpImage
              src={imgSignIn}
              alt="Sign in screen"
              className={helpImg}
              caption="Microsoft SSO sign-in page"
            />
            <ul className="space-y-2">
              <li>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}
                >
                  Admin
                </span>{" "}
                Full access — manages companies, users, countries, currency exchange rates, deletes
                loan facilities and schedule rows, views all audit history.
              </li>
              <li>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}
                >
                  Editor
                </span>{" "}
                Creates and edits loan facilities and schedule rows. Cannot delete loans or access
                Admin settings.
              </li>
              <li>
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}
                >
                  Viewer
                </span>{" "}
                Read-only access to loan facilities, schedule and reports. Action buttons are hidden
                or disabled.
              </li>
            </ul>
            <p className={subText}>
              Your effective role is determined at sign-in. If a button is greyed out or you see an
              &quot;Access denied&quot; toast, your role does not permit that action.
            </p>
            <HelpImage
              src={imgNavbar}
              alt="Navigation bar showing role badge"
              className={helpImg}
              caption="Navbar shows your role badge and user menu"
            />
          </div>
        ),
      },
      {
        id: "loan-facility",
        title: "Loan Facility",
        icon: BanknotesIcon,
        summary: "Create, select and manage loan facilities.",
        body: (
          <div className="space-y-3">
            <p>
              The <strong>Loan Facility</strong> tab is the main workspace. Use the dropdown to pick
              an existing facility or click <strong>New</strong> to create one.
            </p>
            <HelpImage
              src={imgLoanFacilityLight}
              alt="Loan Facility tab"
              className={helpImg}
              caption="Loan Facility workspace (light mode)"
            />
            <p className={`font-semibold ${accent}`}>Fields when creating a loan facility:</p>
            <HelpImage
              src={imgNewLoanModal}
              alt="New Loan Facility modal"
              className={helpImg}
              caption="Click New to open this creation form"
            />
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Facility Name</strong> — unique label.</li>
              <li><strong>Status</strong> — Active or Closed.</li>
              <li><strong>Lender / Borrower Company</strong> — must be set up in Admin first.</li>
              <li><strong>Agreement Date</strong> — date the contract starts.</li>
              <li><strong>Currency</strong> — EUR, GBP, USD, etc.</li>
              <li><strong>Annual Interest Rate</strong> — default rate applied to new schedule rows.</li>
              <li><strong>Days in Year</strong> — 360 or 365 day-count convention used for interest accrual.</li>
            </ul>
            <p className={subText}>
              Tick <strong>Show only Active</strong> to hide closed facilities from the dropdown.
              Use the <strong>History Log</strong> button to see every change made to the selected
              facility.
            </p>
          </div>
        ),
      },
      {
        id: "schedule",
        title: "Schedule (Draw Downs, Repayments, Fees)",
        icon: TableCellsIcon,
        summary:
          "Add schedule rows, understand calculated columns, insert sub-rows and import via Excel.",
        body: (
          <div className="space-y-3">
            <p>
              Each schedule row represents a date range with a draw down, optional repayment and
              fees. Calculated columns (Days, Principal, Cumulative Principal, Interest, Cumulative
              Interest, Total) update automatically.
            </p>
            <p className={`font-semibold ${accent}`}>Adding a row:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click <strong>Add Row</strong>.</li>
              <li>Enter Start Date, End Date, Lender / Borrower bank accounts, interest rate, draw down, repayment and fees.</li>
              <li>The repayment cannot exceed the outstanding principal (sum of prior draw downs minus prior repayments) plus any new draw down on the same row.</li>
              <li>Click <strong>Save Row</strong>.</li>
            </ol>
            <p className={`font-semibold ${accent}`}>Inserting a sub-row:</p>
            <p>
              Use the <strong>Insert</strong> action on an existing row to split its date range. The
              original row&apos;s end date is automatically shortened to the day before the inserted
              row&apos;s start date.
            </p>
            <p className={`font-semibold ${accent}`}>Editing &amp; deleting:</p>
            <p>
              Use the <strong>Edit</strong> icon to change a row, and the <strong>Delete</strong>{" "}
              icon (Admin only) to remove it. All edits are recorded in the loan facility history.
            </p>
            <p className={`font-semibold ${accent}`}>How interest is calculated:</p>
            <div className={`rounded-md border p-3 text-xs ${codeBox}`}>
              Interest = Outstanding Principal × (Annual Rate / Days in Year) × Days in Period
            </div>
            <p className={subText}>
              Repayments reduce the outstanding principal from the start of the row, so subsequent
              days in that row accrue interest on the lower balance.
            </p>
          </div>
        ),
      },
      {
        id: "import-export",
        title: "Importing &amp; Exporting Schedules",
        icon: ArrowUpTrayIcon,
        summary: "Bulk-load schedule rows from Excel and export the current view.",
        body: (
          <div className="space-y-3">
            <p className={`font-semibold ${accent}`}>Excel import:</p>
            <HelpImage
              src={imgImportSchedule}
              alt="Import Schedule modal"
              className={helpImg}
              caption="Import schedule dialog with mode selector"
            />
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click <strong>Import Schedule</strong>.</li>
              <li>Download the template if you don&apos;t have one yet.</li>
              <li>
                Choose a mode:
                <ul className="list-disc pl-5 mt-1">
                  <li><strong>Extend</strong> — append rows to the existing schedule.</li>
                  <li><strong>Overwrite</strong> — delete all existing rows for the loan and replace with the file&apos;s rows. You will be asked to confirm.</li>
                </ul>
              </li>
              <li>Pick the file and click <strong>Import</strong>.</li>
            </ol>
            <p className={`font-semibold ${accent}`}>Required columns:</p>
            <div className={`rounded-md border p-3 text-xs font-mono ${codeBox}`}>
              Start Date | End Date | Lender Bank Account | Borrower Bank Account | Annual Interest
              Rate % | Draw Down | Repayment | Fees
            </div>
            <p className={subText}>
              Dates must be in <code>YYYY-MM-DD</code>. Bank accounts must already exist on the
              selected lender / borrower companies.
            </p>
            <p className={`font-semibold ${accent}`}>Exporting:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <ArrowDownTrayIcon className="inline w-4 h-4" />{" "}
                <strong>Export Excel</strong> — downloads the calculated schedule.
              </li>
              <li>
                <strong>Export PDF</strong> — produces a printable summary for sharing.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "admin-companies",
        title: "Admin · Companies &amp; Shareholders",
        icon: BuildingOffice2Icon,
        summary: "Manage companies, SAP codes, types and bank accounts.",
        body: (
          <div className="space-y-3">
            <HelpImage
              src={imgAdminTabLight}
              alt="Admin tab - Companies management"
              className={helpImg}
              caption="Companies management panel (Admin tab)"
            />
            <p>
              Companies populate the lender and borrower dropdowns on a loan facility, and their
              bank accounts populate the schedule row dropdowns.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Add Company</strong> — name, SAP code, type (Holding / Subsidiary / Internal etc.), country, and one or more bank accounts.</li>
              <li><strong>Bank accounts</strong> — entered as separate rows. Each account becomes selectable on schedule rows where the company is the lender or borrower.</li>
              <li><strong>Import / Export Excel</strong> — bulk-load companies. Use <em>Extend</em> to append or <em>Overwrite</em> to replace.</li>
              <li><strong>History Log</strong> — every create / update / delete is captured with the user and timestamp.</li>
            </ul>
          </div>
        ),
      },
      {
        id: "admin-users",
        title: "Admin · Users",
        icon: UserGroupIcon,
        summary: "Manage user accounts, roles and country assignments.",
        body: (
          <div className="space-y-3">
            <HelpImage
              src={imgAdminTab}
              alt="Admin tab showing Users management (dark mode)"
              className={helpImg}
              caption="Users management panel (dark mode)"
            />
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Add User</strong> — first name, last name, email, role (Admin / Editor / Viewer) and country.</li>
              <li><strong>Country</strong> — used to scope visibility for non-Admin users; they only see loan facilities tied to companies in their country.</li>
              <li><strong>Import / Export Excel</strong> — same Extend / Overwrite modes as companies.</li>
              <li><strong>History Log</strong> — audit trail for user changes.</li>
            </ul>
          </div>
        ),
      },
      {
        id: "admin-countries",
        title: "Admin · Countries",
        icon: GlobeAltIcon,
        summary: "Maintain the list of countries used across companies and users.",
        body: (
          <div className="space-y-2">
            <p>
              Add or edit countries (name + ISO country code). Countries are referenced by company
              records and user country assignments.
            </p>
            <p className={subText}>
              Deleting a country that is in use may break visibility filtering — change the
              dependent records first.
            </p>
          </div>
        ),
      },
      {
        id: "admin-currency",
        title: "Admin · Currency Exchange Rates",
        icon: CurrencyDollarIcon,
        summary: "Maintain conversion rates used in cross-currency reporting.",
        body: (
          <div className="space-y-2">
            <p>
              Add a currency code and its exchange rate. Rates are used by the Report tab when
              normalising balances across loans denominated in different currencies.
            </p>
          </div>
        ),
      },
      {
        id: "report",
        title: "Report",
        icon: ChartBarIcon,
        summary: "Cross-loan analytics, totals and exports.",
        body: (
          <div className="space-y-2">
            <HelpImage
              src={imgReportTab}
              alt="Report tab with country summary and map"
              className={helpImg}
              caption="Country Summary Report with interactive map"
            />
            <p>
              The <strong>Report</strong> tab aggregates active loan facilities to show totals by
              company, currency and status. Use it to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>See outstanding principal, accrued interest and fees across all loans.</li>
              <li>Filter by company, currency or date range.</li>
              <li>Export the consolidated view to Excel or PDF for distribution.</li>
            </ul>
          </div>
        ),
      },
      {
        id: "history",
        title: "History &amp; Audit",
        icon: ClockIcon,
        summary: "Where to find audit trails for every change.",
        body: (
          <div className="space-y-2">
            <HelpImage
              src={imgHelpOverview}
              alt="Help panel overview"
              className={helpImg}
              caption="Every change is tracked with full audit history"
            />
            <p>
              The system records create, update, delete and import actions on loan facilities,
              schedule rows, companies and users. Open any <strong>History Log</strong> button
              (clock icon) to see:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Who performed the action.</li>
              <li>When it happened.</li>
              <li>The before / after values for updates, or the full snapshot for create / delete / import entries.</li>
            </ul>
          </div>
        ),
      },
      {
        id: "tips",
        title: "Tips &amp; Troubleshooting",
        icon: QuestionMarkCircleIcon,
        summary: "Common questions and quick fixes.",
        body: (
          <div className="space-y-3">
            <FAQ
              isDarkMode={isDarkMode}
              items={[
                {
                  q: 'I get "Repayment cannot exceed the outstanding principal".',
                  a: "The repayment on a row can be at most the outstanding principal carried forward from prior rows plus any new draw down on the current row. Check the Cumulative Principal column on the previous row.",
                },
                {
                  q: "Bank account dropdown is empty.",
                  a: "The lender or borrower company has no bank accounts configured. Open Admin → Companies and add one.",
                },
                {
                  q: "I can't see the Admin tab.",
                  a: "Only Admin users see the Admin tab. Ask another Admin to update your role.",
                },
                {
                  q: "My import failed.",
                  a: "Download the template again to confirm the column order and date format. Bank accounts and companies referenced in the file must already exist.",
                },
                {
                  q: "Switching dark / light mode.",
                  a: "Use the sun / moon button in the top-right header. The preference is remembered for your browser.",
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [accent, chip, codeBox, subText, helpImg, isDarkMode],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [query, sections]);

  const expandAll = () => {
    const allIds = new Set(sections.map((s) => s.id));
    setOpenIds(allIds);
    setReadSections(allIds);
  };

  const collapseAll = () => setOpenIds(new Set());

  // Scroll tracking for "back to top" button
  const [showBackToTop, setShowBackToTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        expandAll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div ref={containerRef} className={`rounded-xl border shadow-sm p-5 sm:p-6 ${card} relative`}>
      {/* CSS for animations */}
      <style>{`
        @keyframes helpFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes helpScaleIn { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6" />
            Help &amp; Documentation
          </h2>
          <p className={`mt-1 text-sm ${subText}`}>
            Learn how to set up companies, manage loan facilities, build schedules and run reports.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help…"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* Quick Start Wizard */}
      <div className="mt-5">
        <QuickStartWizard isDarkMode={isDarkMode} />
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            Collapse All
          </button>
        </div>
        <span className={`text-xs ${subText}`}>
          {readSections.size}/{sections.length} sections viewed
        </span>
      </div>

      {/* Content area with TOC sidebar */}
      <div className="flex gap-5 items-start">
        <TableOfContents
          sections={filtered}
          openIds={openIds}
          onJump={jumpTo}
          isDarkMode={isDarkMode}
        />

        <div className="flex-1 space-y-3 min-w-0">
          {filtered.length === 0 && (
            <p className={`text-sm ${subText}`}>
              No help topics matched &quot;{query}&quot;.
            </p>
          )}
          {filtered.map((section, idx) => {
            const isOpen = openIds.has(section.id);
            const isRead = readSections.has(section.id);
            const Icon = section.icon;
            const prevSection = idx > 0 ? filtered[idx - 1] : null;
            const nextSection = idx < filtered.length - 1 ? filtered[idx + 1] : null;
            return (
              <div
                key={section.id}
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
                className={`rounded-lg border transition-all duration-200 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } ${isOpen ? "shadow-md" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-t-lg border-b transition-all duration-150 ${itemHeader} ${
                    !isOpen ? "rounded-b-lg border-b-0" : ""
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${accent}`} />
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2">
                        <span
                          className="font-semibold text-sm"
                          dangerouslySetInnerHTML={{ __html: section.title }}
                        />
                        {isRead && !isOpen && (
                          <CheckCircleIcon
                            className={`w-3.5 h-3.5 ${
                              isDarkMode ? "text-green-500" : "text-green-600"
                            }`}
                          />
                        )}
                      </span>
                      <span
                        className={`text-xs ${subText}`}
                        dangerouslySetInnerHTML={{ __html: section.summary }}
                      />
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-1250 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`px-4 py-4 text-sm leading-relaxed ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {section.body}

                    {/* Section navigation footer */}
                    <div
                      className={`flex items-center justify-between mt-5 pt-3 border-t ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      {prevSection ? (
                        <button
                          onClick={() => jumpTo(prevSection.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-gray-400 hover:text-indigo-300 hover:bg-gray-800"
                              : "text-gray-500 hover:text-indigo-700 hover:bg-gray-100"
                          }`}
                        >
                          <ArrowLeftIcon className="w-3 h-3" />
                          <span dangerouslySetInnerHTML={{ __html: prevSection.title }} />
                        </button>
                      ) : (
                        <span />
                      )}
                      {nextSection ? (
                        <button
                          onClick={() => jumpTo(nextSection.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-gray-400 hover:text-indigo-300 hover:bg-gray-800"
                              : "text-gray-500 hover:text-indigo-700 hover:bg-gray-100"
                          }`}
                        >
                          <span dangerouslySetInnerHTML={{ __html: nextSection.title }} />
                          <ArrowRightIcon className="w-3 h-3" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-6 rounded-lg border p-4 text-xs ${codeBox}`}>
        Need more help? Contact the NatPower Finance team or your system administrator.
        <span className={`block mt-1 ${subText}`}>
          Tip: Press{" "}
          <kbd
            className={`px-1 py-0.5 rounded text-[10px] ${
              isDarkMode ? "bg-gray-700/50" : "bg-gray-200"
            }`}
          >
            Ctrl+Shift+E
          </kbd>{" "}
          to expand all sections at once.
        </span>
      </div>

      {/* Floating back-to-top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-lg border text-xs font-medium transition-all duration-200 hover:scale-105 ${
            isDarkMode
              ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
          style={{ animation: "helpFadeIn 200ms ease-out" }}
          title="Back to top"
        >
          <ChevronUpIcon className="w-4 h-4" />
          Top
        </button>
      )}
    </div>
  );
}
