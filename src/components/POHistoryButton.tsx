import { formattedDate } from "@/lib/utils";
import { useState } from "react";
import { createPortal } from "react-dom";
import { TransText } from "./TransText";
import { useAuth } from "@/lib/authProvider";
import { useErpIframe } from "@/lib/erpIframeContext";

interface POHistoryButtonProps {
  po_change_log: any[] | any;
}

const POHistoryButton = ({ po_change_log }: POHistoryButtonProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const { erpIframe } = useErpIframe();
  const rawHistory = Array.isArray(po_change_log)
    ? po_change_log
    : po_change_log
    ? [po_change_log]
    : [];

  // Filter out entries where all fields are null/empty
  const history = rawHistory.filter((entry) => {
    const date = entry?.date || entry?.Date;
    const user = entry?.user || entry?.User;
    const action = entry?.action || entry?.Action;
    return date || user || action;
  });

  const { lang } = useAuth();

  // Clean up action text by extracting displayName from LookupPurchaseOrderStatus objects
  const formatAction = (action: string): string => {
    if (!action) return "";
    // Match pattern like: LookupPurchaseOrderStatus(orderStatusId=1, internalName=Draft, displayName=Draft)
    const match = action.match(
      /LookupPurchaseOrderStatus\([^)]*displayName=([^,)]+)[^)]*\)/
    );
    if (match) {
      const displayName = match[1].trim();
      return action.replace(match[0], displayName);
    }
    return action;
  };

  return (
    <>
      <button
        type="button"
        title="View PO History"
        aria-label="View PO History"
        onClick={() => setShowHistory(true)}
        className={`group relative flex items-center justify-center h-9 w-9 rounded-full cursor-pointer text-sm font-medium focus:z-10 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] transition duration-150 ease-in-out focus:outline-none focus:ring-0 ${erpIframe ? "text-white bg-[#2a3441] border border-[#3a3f4b] active:bg-[#3a3f4b]" : "text-[#1D2636] bg-white border border-[#1D2636] active:bg-[#1D2636] active:text-white"}`}
      >
        <i className="pi pi-history text-lg transition-transform group-hover:scale-110" />
      </button>

      {showHistory && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative rounded-lg shadow-xl w-full max-w-md p-4 ${erpIframe ? "bg-[#1D2636] text-white" : "bg-white text-black"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${erpIframe ? "text-white" : "text-[#1D2636]"}`}>
                <TransText text="PO Change History" lang={lang} />
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className={`cursor-pointer text-xl ${erpIframe ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
              >
                &times;
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {history.length > 0 ? (
                <ul className="space-y-3 p-1">
                  {history.map((entry, index) => (
                    <li
                      key={index}
                      className={`text-sm flex flex-col p-2 rounded-sm w-full transition duration-300 ease-in-out ${erpIframe ? "text-white bg-[#2a3441] hover:bg-[#3a3f4b]" : "text-[#1D2636] shadow-zinc-200/30 shadow-sm hover:shadow-zinc-400/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <strong>{formattedDate(entry.date || entry.Date)}</strong>
                        <div className={`text-xs ${erpIframe ? "text-gray-400" : "text-gray-500"}`}>
                          {entry.user || entry.User}
                        </div>
                      </div>
                      <div>
                        <TransText text={formatAction(entry.action || entry.Action)} lang={lang} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${erpIframe ? "text-gray-400" : "text-gray-500"}`}>
                  <TransText text="No history available." lang={lang} />
                </p>
              )}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 text-sm font-medium rounded cursor-pointer ${erpIframe ? "text-white bg-emerald-600 hover:bg-emerald-700" : "text-white bg-[#1D2636] hover:bg-[#2a3347]"}`}
              >
                <TransText text="Close" lang={lang} />
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default POHistoryButton;
