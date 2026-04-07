import {
  computeHistoryChanges,
  formatHistorySnapshotValue,
  humanizeHistoryFieldKey,
  type HistoryChangeRow,
  type HistorySnapshotRow,
} from "./loanHistoryDisplay";

const COMPANY_FIELD_ORDER = [
  "name",
  "code",
  "type",
  "country",
  "id",
  "bankAccounts",
];

function humanizeCompanyFieldKey(key: string): string {
  const map: Record<string, string> = {
    name: "Name",
    code: "Code (SAP)",
    type: "Type",
    country: "Country",
    bankAccounts: "Bank accounts",
    id: "Company ID",
  };
  return map[key] ?? humanizeHistoryFieldKey(key);
}

type BankAcc = Record<string, unknown>;

function parseBankAccountsArray(raw: unknown): BankAcc[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item)) as BankAcc[];
}

function summarizeBankAccount(acc: BankAcc): string {
  const rowIndex = acc.rowIndex;
  const accountName = acc.accountName;
  const id = acc.id;
  const parts = [
    rowIndex != null ? `Row ${rowIndex}` : null,
    accountName != null && String(accountName).trim() !== "" ? String(accountName) : null,
    id != null && Number(id) > 0 ? `id ${id}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function stripBankAccounts(obj: Record<string, unknown>): Record<string, unknown> {
  const { bankAccounts: _b, ...rest } = obj;
  return rest;
}

function pushAccountFieldDiffs(
  rows: HistoryChangeRow[],
  accountId: number,
  br: BankAcc,
  ar: BankAcc,
) {
  const keys = new Set([...Object.keys(br), ...Object.keys(ar)]);
  for (const key of keys) {
    if (key === "id") {
      continue;
    }
    if (JSON.stringify(br[key]) === JSON.stringify(ar[key])) {
      continue;
    }
    const label =
      key === "accountName"
        ? "Account name"
        : key === "rowIndex"
          ? "Row"
          : humanizeHistoryFieldKey(key);
    rows.push({
      field: `Bank account ${accountId} (${label})`,
      before: formatHistorySnapshotValue(br[key]),
      after: formatHistorySnapshotValue(ar[key]),
    });
  }
}

function diffBankAccountsRows(before: unknown, after: unknown): HistoryChangeRow[] {
  const b = parseBankAccountsArray(before);
  const a = parseBankAccountsArray(after);
  const rows: HistoryChangeRow[] = [];

  const aById = new Map<number, BankAcc>();
  for (const acc of a) {
    const id = Number(acc.id);
    if (Number.isFinite(id) && id > 0) {
      aById.set(id, acc);
    }
  }

  const matchedAfterId = new Set<number>();

  for (const br of b) {
    const bid = Number(br.id);
    if (Number.isFinite(bid) && bid > 0 && aById.has(bid)) {
      const ar = aById.get(bid)!;
      matchedAfterId.add(bid);
      pushAccountFieldDiffs(rows, bid, br, ar);
    } else {
      rows.push({
        field:
          br.rowIndex != null
            ? `Bank account removed (row ${br.rowIndex})`
            : "Bank account removed",
        before: summarizeBankAccount(br),
        after: "—",
      });
    }
  }

  for (const ar of a) {
    const aid = Number(ar.id);
    if (Number.isFinite(aid) && aid > 0 && !matchedAfterId.has(aid)) {
      rows.push({
        field:
          ar.rowIndex != null
            ? `Bank account added (row ${ar.rowIndex})`
            : "Bank account added",
        before: "—",
        after: summarizeBankAccount(ar),
      });
    }
  }

  return rows;
}

export function computeCompanyHistoryChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): HistoryChangeRow[] {
  const base = computeHistoryChanges(stripBankAccounts(before), stripBankAccounts(after));
  const bBanks = before.bankAccounts;
  const aBanks = after.bankAccounts;
  if (JSON.stringify(bBanks) === JSON.stringify(aBanks)) {
    return base.sort((x, y) => x.field.localeCompare(y.field));
  }
  return [...base, ...diffBankAccountsRows(bBanks, aBanks)].sort((x, y) =>
    x.field.localeCompare(y.field),
  );
}

function orderedCompanyKeys(obj: Record<string, unknown>): string[] {
  const keys = Object.keys(obj);
  const pref = COMPANY_FIELD_ORDER.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !COMPANY_FIELD_ORDER.includes(k)).sort();
  return [...pref, ...rest];
}

export function companySnapshotToDisplayRows(
  snapshot: Record<string, unknown>,
): HistorySnapshotRow[] {
  return orderedCompanyKeys(snapshot).map((key) => {
    if (key === "bankAccounts") {
      const list = parseBankAccountsArray(snapshot[key]);
      const value =
        list.length === 0
          ? "—"
          : [...list]
              .sort(
                (x, y) =>
                  (Number(x.rowIndex) || 0) - (Number(y.rowIndex) || 0),
              )
              .map(summarizeBankAccount)
              .join("; ");
      return { field: humanizeCompanyFieldKey(key), value };
    }
    return {
      field: humanizeCompanyFieldKey(key),
      value: formatHistorySnapshotValue(snapshot[key]),
    };
  });
}
