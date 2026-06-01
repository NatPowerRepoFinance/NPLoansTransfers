import { useState } from "react";
import {
  RocketLaunchIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import type { QuickStartStep } from "./types";

export function QuickStartWizard({
  isDarkMode,
  steps,
}: {
  isDarkMode: boolean;
  steps: QuickStartStep[];
}) {
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
    if (step < steps.length - 1) setStep(step + 1);
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
            {completed.size}/{steps.length} completed
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
          {steps.map((s, i) => (
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
              src={steps[step].img}
              alt={steps[step].title}
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
                Step {step + 1} of {steps.length}
              </p>
              <h4 className="font-semibold text-lg mt-0.5">{steps[step].title}</h4>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {steps[step].desc}
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
                {step === steps.length - 1 ? (
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
            style={{ width: `${(completed.size / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
