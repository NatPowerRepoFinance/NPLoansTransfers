import { useMemo, useState } from "react";
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
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

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

export default function HelpTab({ isDarkMode }: HelpTabProps) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["overview"]));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
              <strong>NP Loans &amp; Transfers</strong> is the NatPower finance tool for
              creating and managing intercompany loan facilities, recording draw
              downs, repayments and fees on a schedule, and producing reports.
            </p>
            <p className={subText}>
              Typical workflow:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Set up reference data in <span className={accent}>Admin</span> (companies, users, countries, currency exchange rates).</li>
              <li>Create a Loan Facility under the <span className={accent}>Loan Facility</span> tab.</li>
              <li>Add schedule rows (draw downs, repayments, fees) — manually or via Excel import.</li>
              <li>Review the calculated principal, interest and totals in the schedule grid.</li>
              <li>Open the <span className={accent}>Report</span> tab for cross-loan analytics and exports.</li>
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
            <ul className="space-y-2">
              <li>
                <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}>Admin</span>{" "}
                Full access — manages companies, users, countries, currency exchange rates, deletes loan facilities and schedule rows, views all audit history.
              </li>
              <li>
                <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}>Editor</span>{" "}
                Creates and edits loan facilities and schedule rows. Cannot delete loans or access Admin settings.
              </li>
              <li>
                <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${chip}`}>Viewer</span>{" "}
                Read-only access to loan facilities, schedule and reports. Action buttons are hidden or disabled.
              </li>
            </ul>
            <p className={subText}>
              Your effective role is determined at sign-in. If a button is greyed out or you see an &quot;Access denied&quot; toast, your role does not permit that action.
            </p>
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
              The <strong>Loan Facility</strong> tab is the main workspace. Use the dropdown to pick an existing facility or click <strong>New</strong> to create one.
            </p>
            <p className={`font-semibold ${accent}`}>Fields when creating a loan facility:</p>
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
              Tick <strong>Show only Active</strong> to hide closed facilities from the dropdown. Use the <strong>History Log</strong> button to see every change made to the selected facility.
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
              Each schedule row represents a date range with a draw down, optional repayment and fees. Calculated columns (Days, Principal, Cumulative Principal, Interest, Cumulative Interest, Total) update automatically.
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
              Use the <strong>Insert</strong> action on an existing row to split its date range. The original row&apos;s end date is automatically shortened to the day before the inserted row&apos;s start date.
            </p>
            <p className={`font-semibold ${accent}`}>Editing &amp; deleting:</p>
            <p>
              Use the <strong>Edit</strong> icon to change a row, and the <strong>Delete</strong> icon (Admin only) to remove it. All edits are recorded in the loan facility history.
            </p>
            <p className={`font-semibold ${accent}`}>How interest is calculated:</p>
            <div className={`rounded-md border p-3 text-xs ${codeBox}`}>
              Interest = Outstanding Principal × (Annual Rate / Days in Year) × Days in Period
            </div>
            <p className={subText}>
              Repayments reduce the outstanding principal from the start of the row, so subsequent days in that row accrue interest on the lower balance.
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
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click <strong>Import Schedule</strong>.</li>
              <li>Download the template if you don&apos;t have one yet.</li>
              <li>Choose a mode:
                <ul className="list-disc pl-5 mt-1">
                  <li><strong>Extend</strong> — append rows to the existing schedule.</li>
                  <li><strong>Overwrite</strong> — delete all existing rows for the loan and replace with the file&apos;s rows. You will be asked to confirm.</li>
                </ul>
              </li>
              <li>Pick the file and click <strong>Import</strong>.</li>
            </ol>
            <p className={`font-semibold ${accent}`}>Required columns:</p>
            <div className={`rounded-md border p-3 text-xs font-mono ${codeBox}`}>
              Start Date | End Date | Lender Bank Account | Borrower Bank Account | Annual Interest Rate % | Draw Down | Repayment | Fees
            </div>
            <p className={subText}>
              Dates must be in <code>YYYY-MM-DD</code>. Bank accounts must already exist on the selected lender / borrower companies.
            </p>
            <p className={`font-semibold ${accent}`}>Exporting:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><ArrowDownTrayIcon className="inline w-4 h-4" /> <strong>Export Excel</strong> — downloads the calculated schedule.</li>
              <li><strong>Export PDF</strong> — produces a printable summary for sharing.</li>
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
            <p>
              Companies populate the lender and borrower dropdowns on a loan facility, and their bank accounts populate the schedule row dropdowns.
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
              Add or edit countries (name + ISO country code). Countries are referenced by company records and user country assignments.
            </p>
            <p className={subText}>
              Deleting a country that is in use may break visibility filtering — change the dependent records first.
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
              Add a currency code and its exchange rate. Rates are used by the Report tab when normalising balances across loans denominated in different currencies.
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
            <p>
              The <strong>Report</strong> tab aggregates active loan facilities to show totals by company, currency and status. Use it to:
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
            <p>
              The system records create, update, delete and import actions on loan facilities, schedule rows, companies and users. Open any <strong>History Log</strong> button (clock icon) to see:
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
            <div>
              <p className={`font-semibold ${accent}`}>I get &quot;Repayment cannot exceed the outstanding principal&quot;.</p>
              <p className={subText}>
                The repayment on a row can be at most the outstanding principal carried forward from prior rows plus any new draw down on the current row. Check the <strong>Cumulative Principal</strong> column on the previous row.
              </p>
            </div>
            <div>
              <p className={`font-semibold ${accent}`}>Bank account dropdown is empty.</p>
              <p className={subText}>
                The lender or borrower company has no bank accounts configured. Open <strong>Admin → Companies</strong> and add one.
              </p>
            </div>
            <div>
              <p className={`font-semibold ${accent}`}>I can&apos;t see the Admin tab.</p>
              <p className={subText}>
                Only Admin users see the Admin tab. Ask another Admin to update your role.
              </p>
            </div>
            <div>
              <p className={`font-semibold ${accent}`}>My import failed.</p>
              <p className={subText}>
                Download the template again to confirm the column order and date format. Bank accounts and companies referenced in the file must already exist.
              </p>
            </div>
            <div>
              <p className={`font-semibold ${accent}`}>Switching dark / light mode.</p>
              <p className={subText}>
                Use the sun / moon button in the top-right header. The preference is remembered for your browser.
              </p>
            </div>
          </div>
        ),
      },
    ],
    [accent, chip, codeBox, subText],
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

  return (
    <div className={`rounded-xl border shadow-sm p-5 sm:p-6 ${card}`}>
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

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className={`text-sm ${subText}`}>No help topics matched &quot;{query}&quot;.</p>
        )}
        {filtered.map((section) => {
          const isOpen = openIds.has(section.id);
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className={`rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-t-lg border-b ${itemHeader} ${
                  !isOpen ? "rounded-b-lg border-b-0" : ""
                }`}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${accent}`} />
                  <span className="flex flex-col">
                    <span
                      className="font-semibold text-sm"
                      dangerouslySetInnerHTML={{ __html: section.title }}
                    />
                    <span
                      className={`text-xs ${subText}`}
                      dangerouslySetInnerHTML={{ __html: section.summary }}
                    />
                  </span>
                </span>
                {isOpen ? (
                  <ChevronDownIcon className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className={`px-4 py-4 text-sm leading-relaxed ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {section.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-6 rounded-lg border p-4 text-xs ${codeBox}`}>
        Need more help? Contact the NatPower Finance team or your system administrator.
      </div>
    </div>
  );
}
