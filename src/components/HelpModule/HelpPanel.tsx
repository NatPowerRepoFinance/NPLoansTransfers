import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { QuickStartWizard } from "./QuickStartWizard";
import type { HelpSection, QuickStartStep } from "./types";

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

/* ─── Main Help Panel ─── */
export type HelpPanelProps = {
  isDarkMode: boolean;
  sections: HelpSection[];
  quickStartSteps?: QuickStartStep[];
  title?: string;
  subtitle?: string;
  footerText?: React.ReactNode;
};

export function HelpPanel({
  isDarkMode,
  sections,
  quickStartSteps,
  title = "Help & Documentation",
  subtitle = "Learn how to use this application.",
  footerText,
}: HelpPanelProps) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(sections.length > 0 ? [sections[0].id] : []),
  );
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
  const codeBox = isDarkMode
    ? "bg-gray-800 border-gray-700 text-gray-200"
    : "bg-gray-50 border-gray-200 text-gray-800";
  const itemHeader = isDarkMode
    ? "bg-gray-800/60 hover:bg-gray-800 border-gray-700"
    : "bg-gray-50 hover:bg-gray-100 border-gray-200";

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  })();

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
            {title}
          </h2>
          <p className={`mt-1 text-sm ${subText}`}>{subtitle}</p>
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
      {quickStartSteps && quickStartSteps.length > 0 && (
        <div className="mt-5">
          <QuickStartWizard isDarkMode={isDarkMode} steps={quickStartSteps} />
        </div>
      )}

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

      {footerText && (
        <div className={`mt-6 rounded-lg border p-4 text-xs ${codeBox}`}>
          {footerText}
        </div>
      )}

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
