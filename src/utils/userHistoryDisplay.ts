import {
  formatHistorySnapshotValue,
  humanizeHistoryFieldKey,
  type HistorySnapshotRow,
} from "./loanHistoryDisplay";

const USER_FIELD_ORDER = [
  "firstName",
  "first_name",
  "lastName",
  "last_name",
  "email",
  "role",
  "country",
  "id",
];

function humanizeUserFieldKey(key: string): string {
  const map: Record<string, string> = {
    firstName: "First name",
    first_name: "First name",
    lastName: "Last name",
    last_name: "Last name",
    email: "Email",
    role: "Role",
    country: "Country",
    id: "User ID",
  };
  return map[key] ?? humanizeHistoryFieldKey(key);
}

function orderedUserKeys(obj: Record<string, unknown>): string[] {
  const keys = Object.keys(obj);
  const pref = USER_FIELD_ORDER.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !USER_FIELD_ORDER.includes(k)).sort();
  return [...pref, ...rest];
}

export function userSnapshotToDisplayRows(
  snapshot: Record<string, unknown>,
): HistorySnapshotRow[] {
  return orderedUserKeys(snapshot).map((key) => ({
    field: humanizeUserFieldKey(key),
    value: formatHistorySnapshotValue(snapshot[key]),
  }));
}
