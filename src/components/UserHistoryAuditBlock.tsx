import type { UserHistoryEntry } from "../utils/constants";
import { computeHistoryChanges } from "../utils/loanHistoryDisplay";
import { userSnapshotToDisplayRows } from "../utils/userHistoryDisplay";

export function UserHistoryAuditBlock({
  entry,
  isDarkMode,
}: {
  entry: UserHistoryEntry;
  isDarkMode: boolean;
}) {
  const phase =
    entry.action === "ADD" || entry.action === "IMPORT"
      ? "create"
      : entry.action === "EDIT"
        ? "update"
        : entry.action === "DELETE"
          ? "delete"
          : "import";

  const before = entry.beforeSnapshot;
  const after = entry.afterSnapshot;

  const muted = isDarkMode ? "text-gray-500" : "text-gray-600";
  const box = isDarkMode ? "bg-gray-900/60 border-gray-600" : "bg-gray-50 border-gray-200";
  const th = isDarkMode ? "text-gray-400" : "text-gray-600";
  const td = isDarkMode ? "text-gray-200" : "text-gray-800";

  if (phase === "update" && before && after) {
    const changes = computeHistoryChanges(before, after);
    if (changes.length === 0) {
      return (
        <p className={`mt-2 text-xs ${muted}`}>
          No field-level changes detected in the saved snapshot.
        </p>
      );
    }
    return (
      <div className={`mt-3 rounded-lg border text-xs overflow-x-auto ${box}`}>
        <table className="w-full min-w-[min(100%,420px)]">
          <thead>
            <tr className={isDarkMode ? "bg-gray-800/80" : "bg-gray-100"}>
              <th className={`px-2 py-1.5 text-left font-semibold ${th}`}>Field</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${th}`}>Previous</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${th}`}>New</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((row, rowIndex) => (
              <tr
                key={`${entry.id}-${row.field}-${rowIndex}`}
                className={`border-t ${isDarkMode ? "border-gray-600/40" : "border-gray-200"}`}
              >
                <td className={`px-2 py-1.5 font-medium align-top ${td}`}>{row.field}</td>
                <td className={`px-2 py-1.5 align-top break-words max-w-[220px] ${muted}`}>
                  {row.before}
                </td>
                <td className={`px-2 py-1.5 align-top break-words max-w-[220px] ${td}`}>
                  {row.after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if ((phase === "create" || phase === "import") && after && Object.keys(after).length > 0) {
    const rows = userSnapshotToDisplayRows(after);
    return (
      <div className={`mt-3 rounded-lg border text-xs overflow-x-auto ${box}`}>
        <p
          className={`px-2 py-1.5 font-semibold border-b ${
            isDarkMode ? "border-gray-600" : "border-gray-200"
          } ${th}`}
        >
          Added
        </p>
        <table className="w-full min-w-[min(100%,360px)]">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.field}
                className={`border-t ${isDarkMode ? "border-gray-600/40" : "border-gray-200"}`}
              >
                <td className={`px-2 py-1.5 font-medium w-[38%] align-top ${td}`}>{r.field}</td>
                <td className={`px-2 py-1.5 align-top break-words ${td}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (phase === "delete" && before && Object.keys(before).length > 0) {
    const rows = userSnapshotToDisplayRows(before);
    return (
      <div className={`mt-3 rounded-lg border text-xs overflow-x-auto ${box}`}>
        <p
          className={`px-2 py-1.5 font-semibold border-b ${
            isDarkMode ? "border-gray-600" : "border-gray-200"
          } ${isDarkMode ? "text-rose-300" : "text-rose-700"}`}
        >
          Removed
        </p>
        <table className="w-full min-w-[min(100%,360px)]">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.field}
                className={`border-t ${isDarkMode ? "border-gray-600/40" : "border-gray-200"}`}
              >
                <td className={`px-2 py-1.5 font-medium w-[38%] align-top ${td}`}>{r.field}</td>
                <td className={`px-2 py-1.5 align-top break-words ${td}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
