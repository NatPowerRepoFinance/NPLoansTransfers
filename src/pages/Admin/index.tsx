import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, MoonIcon, SunIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { isRiskAdmin } from "@/lib/riskUtils";
import { toast } from "react-toastify";

interface Company {
  id: string;
  name: string;
  code: string;
}

export default function AdminAccess() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme-mode");
    return stored ? stored === "dark" : true;
  });

  const [companies, setCompanies] = useState<Company[]>([
    { id: "1", name: "Natpower Ltd", code: "NP001" },
    { id: "2", name: "Tech Solutions", code: "TS002" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  useEffect(() => {
    localStorage.setItem("theme-mode", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) {
      if (isDarkMode) {
        root.style.backgroundColor = "#1F2937";
      } else {
        root.style.backgroundColor = "#F9FAFB";
      }
    }
  }, [isDarkMode]);

  // Redirect if not admin
  if (!isRiskAdmin()) {
    return (
      <div
        className={`w-full h-screen flex items-center justify-center ${
          isDarkMode ? "bg-[#111827]" : "bg-[#F9FAFB]"
        }`}
      >
        <div
          className={`text-center p-8 rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          <h1
            className={`text-2xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Access Denied
          </h1>
          <p
            className={`mb-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            You do not have permission to access the Admin Panel.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingId(company.id);
      setFormData({ name: company.name, code: company.code });
    } else {
      setEditingId(null);
      setFormData({ name: "", code: "" });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingId) {
      setCompanies(
        companies.map((c) =>
          c.id === editingId ? { ...c, name: formData.name, code: formData.code } : c
        )
      );
      toast.success("Company updated successfully");
    } else {
      setCompanies([
        ...companies,
        { id: Date.now().toString(), name: formData.name, code: formData.code },
      ]);
      toast.success("Company added successfully");
    }

    setShowModal(false);
    setFormData({ name: "", code: "" });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      setCompanies(companies.filter((c) => c.id !== id));
      toast.success("Company deleted successfully");
    }
  };

  return (
    <div
      className={`relative w-full min-h-screen ${
        isDarkMode ? "bg-[#111827]" : "bg-[#F9FAFB]"
      }`}
    >
      <div
        className={`h-full px-5 sm:px-10 py-5 ${
          isDarkMode ? "text-white" : "text-black"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              title="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">Admin Access Panel</h1>
          </div>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                : "bg-gray-200 hover:bg-gray-300 text-indigo-600"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Companies Section */}
        <div
          className={`rounded-lg p-8 ${
            isDarkMode ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Companies and Shareholders</h2>
            <button
              onClick={() => handleOpenModal()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isDarkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              Add Companies
            </button>
          </div>

          {/* Table */}
          <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <table className="w-full">
              <thead
                className={`${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-200 border-gray-300"
                } border-b`}
              >
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-sm font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Name
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-sm font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Code
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-sm font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className={`px-6 py-8 text-center text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      No companies found. Click "Add Companies" to create one.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr
                      key={company.id}
                      className={`border-b ${
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700/50"
                          : "border-gray-200 hover:bg-gray-100"
                      } transition`}
                    >
                      <td
                        className={`px-6 py-4 text-sm ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {company.name}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-mono ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {company.code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(company)}
                            className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                              isDarkMode
                                ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                            }`}
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                              isDarkMode
                                ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                                : "bg-red-100 hover:bg-red-200 text-red-600"
                            }`}
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`rounded-lg p-6 w-full max-w-md ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Company" : "Add Company"}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black placeholder-gray-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Company Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Enter company code"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
