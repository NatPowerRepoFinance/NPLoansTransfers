import { useState } from "react";
import { QuestionMarkCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { FAQItem } from "./types";

export function FAQ({
  isDarkMode,
  items,
}: {
  isDarkMode: boolean;
  items: FAQItem[];
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
