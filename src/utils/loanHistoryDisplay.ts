/** Format values from loan facility history JSON (Java LocalDate/LocalDateTime arrays, etc.) */

const LOAN_FIELD_ORDER = [
  "name",
  "status",
  "currency",
  "agreementDate",
  "startDate",
  "closeDate",
  "daysInYear",
  "annualInterestRate",
  "lenderCompanyId",
  "borrowerCompanyId",
  "lenderCompanyName",
  "borrowerCompanyName",
  "scheduleRows",
  "id",
];

const SCHEDULE_FIELD_ORDER = [
  "rowIndex",
  "startDate",
  "endDate",
  "lenderBankAccount",
  "borrowerBankAccount",
  "annualInterestRatePct",
  "days",
  "drawDown",
  "repayment",
  "fees",
  "principal",
  "cumulativePrincipal",
  "interest",
  "cumulativeInterest",
  "total",
  "id",
];

function formatJavaTemporalArray(parts: number[]): string {
  const [y, mo, d, h, mi, s] = parts;
  const pad = (n: number) => String(Math.trunc(n)).padStart(2, "0");
  const date = `${pad(d)}/${pad(mo)}/${y}`;
  if (parts.length >= 6 && typeof h === "number" && typeof mi === "number") {
    const sec = typeof s === "number" ? Math.trunc(s) : 0;
    return `${date}, ${pad(h)}:${pad(mi)}:${pad(sec)}`;
  }
  return date;
}

export function formatHistorySnapshotValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toLocaleString("en-GB", { maximumFractionDigits: 6 });
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    return value.trim() === "" ? "—" : value;
  }
  if (Array.isArray(value)) {
    if (
      value.length >= 3 &&
      value.slice(0, 3).every((x) => typeof x === "number")
    ) {
      return formatJavaTemporalArray(value as number[]);
    }
    if (value.length === 0) {
      return "—";
    }
    if (value.every((x) => typeof x !== "object" || x === null)) {
      return value.map((x) => formatHistorySnapshotValue(x)).join(", ");
    }
    return `${value.length} row(s)`;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function humanizeHistoryFieldKey(key: string): string {
  const map: Record<string, string> = {
    id: "ID",
    rowIndex: "Row",
    startDate: "Start date",
    endDate: "End date",
    agreementDate: "Agreement date",
    closeDate: "Close date",
    daysInYear: "Days in year",
    annualInterestRate: "Annual interest rate %",
    annualInterestRatePct: "Annual interest rate %",
    lenderBankAccount: "Lender bank account",
    borrowerBankAccount: "Borrower bank account",
    lenderCompanyId: "Lender company ID",
    borrowerCompanyId: "Borrower company ID",
    lenderCompanyName: "Lender",
    borrowerCompanyName: "Borrower",
    drawDown: "Draw down",
    cumulativePrincipal: "Cumulative principal",
    cumulativeInterest: "Cumulative interest",
    scheduleRows: "Schedule rows",
    entityType: "Entity type",
    entityId: "Entity ID",
  };
  if (map[key]) {
    return map[key];
  }
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function historyValuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function orderedKeys(
  obj: Record<string, unknown>,
  entityType?: string,
): string[] {
  const keys = Object.keys(obj);
  const preferred =
    entityType === "schedule" ? SCHEDULE_FIELD_ORDER : LOAN_FIELD_ORDER;
  const pref = preferred.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !preferred.includes(k)).sort();
  return [...pref, ...rest];
}

export type HistoryChangeRow = {
  field: string;
  before: string;
  after: string;
};

export function computeHistoryChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): HistoryChangeRow[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const rows: HistoryChangeRow[] = [];
  for (const key of keys) {
    const bv = before[key];
    const av = after[key];
    if (historyValuesEqual(bv, av)) {
      continue;
    }
    rows.push({
      field: humanizeHistoryFieldKey(key),
      before: formatHistorySnapshotValue(bv),
      after: formatHistorySnapshotValue(av),
    });
  }
  return rows.sort((a, b) => a.field.localeCompare(b.field));
}

export type HistorySnapshotRow = { field: string; value: string };

export function snapshotToDisplayRows(
  snapshot: Record<string, unknown>,
  entityType?: string,
): HistorySnapshotRow[] {
  return orderedKeys(snapshot, entityType).map((key) => ({
    field: humanizeHistoryFieldKey(key),
    value: formatHistorySnapshotValue(snapshot[key]),
  }));
}

export function parseHistoryJson(
  raw: string | null | undefined,
): Record<string, unknown> | null {
  if (raw == null || raw === "") {
    return null;
  }
  try {
    const v = JSON.parse(raw) as unknown;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
