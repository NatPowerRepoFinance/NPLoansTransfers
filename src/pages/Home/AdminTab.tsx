import { useState } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

interface Company {
  id: string;
  name: string;
  sapCode: string;
  type: string;
  country: string;
  bankAccounts: string;
}

interface Country {
  id: number;
  name: string;
  countryCode: string;
}

interface AdminTabProps {
  isDarkMode: boolean;
}

export default function AdminTab({ isDarkMode }: AdminTabProps) {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      name: "Natpower Ltd",
      sapCode: "SAP001",
      type: "Holding",
      country: "United Kingdom",
      bankAccounts: "GB12NATP000123456789",
    },
    {
      id: "2",
      name: "Tech Solutions",
      sapCode: "SAP002",
      type: "Subsidiary",
      country: "India",
      bankAccounts: "IN55NATP000987654321",
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sapCode: "",
    type: "",
    country: "",
    bankAccounts: "",
  });

  const [countries, setCountries] = useState<Country[]>([
    { id: 1, name: "United States", countryCode: "US" },
    { id: 2, name: "United Kingdom", countryCode: "GB" },
    { id: 3, name: "India", countryCode: "IN" },
  ]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountryId, setEditingCountryId] = useState<number | null>(null);
  const [countryFormData, setCountryFormData] = useState({ name: "", countryCode: "" });

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingId(company.id);
      setFormData({
        name: company.name,
        sapCode: company.sapCode,
        type: company.type,
        country: company.country,
        bankAccounts: company.bankAccounts,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: "" });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (
      !formData.name.trim() ||
      !formData.sapCode.trim() ||
      !formData.type.trim() ||
      !formData.country.trim() ||
      !formData.bankAccounts.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingId) {
      setCompanies(
        companies.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: formData.name,
                sapCode: formData.sapCode,
                type: formData.type,
                country: formData.country,
                bankAccounts: formData.bankAccounts,
              }
            : c
        )
      );
      toast.success("Company updated successfully");
    } else {
      const nextId = companies.length > 0 ? String(Math.max(...companies.map((c) => Number(c.id))) + 1) : "1";
      setCompanies([
        ...companies,
        {
          id: nextId,
          name: formData.name,
          sapCode: formData.sapCode,
          type: formData.type,
          country: formData.country,
          bankAccounts: formData.bankAccounts,
        },
      ]);
      toast.success("Company added successfully");
    }

    setShowModal(false);
    setFormData({ name: "", sapCode: "", type: "", country: "", bankAccounts: "" });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      setCompanies(companies.filter((c) => c.id !== id));
      toast.success("Company deleted successfully");
    }
  };

  const handleOpenCountryModal = (country?: Country) => {
    if (country) {
      setEditingCountryId(country.id);
      setCountryFormData({ name: country.name, countryCode: country.countryCode });
    } else {
      setEditingCountryId(null);
      setCountryFormData({ name: "", countryCode: "" });
    }
    setShowCountryModal(true);
  };

  const handleSaveCountry = () => {
    if (!countryFormData.name.trim() || !countryFormData.countryCode.trim()) {
      toast.error("Please fill in all country fields");
      return;
    }

    const normalizedCode = countryFormData.countryCode.trim().toUpperCase();

    if (editingCountryId !== null) {
      setCountries(
        countries.map((country) =>
          country.id === editingCountryId
            ? { ...country, name: countryFormData.name.trim(), countryCode: normalizedCode }
            : country
        )
      );
      toast.success("Country updated successfully");
    } else {
      const nextId = countries.length > 0 ? Math.max(...countries.map((c) => c.id)) + 1 : 1;
      setCountries([
        ...countries,
        {
          id: nextId,
          name: countryFormData.name.trim(),
          countryCode: normalizedCode,
        },
      ]);
      toast.success("Country added successfully");
    }

    setShowCountryModal(false);
    setCountryFormData({ name: "", countryCode: "" });
  };

  const handleDeleteCountry = (id: number) => {
    if (window.confirm("Are you sure you want to delete this country?")) {
      setCountries(countries.filter((country) => country.id !== id));
      toast.success("Country deleted successfully");
    }
  };

  return (
    <div>
      <div className={`rounded-lg p-8 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Companies</h2>
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
                  ID
                </th>
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
                  SAP Code
                </th>
                <th
                  className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Type
                </th>
                <th
                  className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Country
                </th>
                <th
                  className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Bank Accounts
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
                    colSpan={7}
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
                      className={`px-6 py-4 text-sm font-mono ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {company.id}
                    </td>
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
                      {company.sapCode}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {company.type}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {company.country}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-mono ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {company.bankAccounts}
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

      <div className={`rounded-lg p-8 mt-6 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Countries</h2>
          <button
            onClick={() => handleOpenCountryModal()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <PlusIcon className="w-5 h-5" />
            Add Country
          </button>
        </div>

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
                  ID
                </th>
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
                  Country Code
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
              {countries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`px-6 py-8 text-center text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No countries found. Click "Add Country" to create one.
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr
                    key={country.id}
                    className={`border-b ${
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-700/50"
                        : "border-gray-200 hover:bg-gray-100"
                    } transition`}
                  >
                    <td
                      className={`px-6 py-4 text-sm font-mono ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {country.id}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {country.name}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-mono ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {country.countryCode}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenCountryModal(country)}
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
                          onClick={() => handleDeleteCountry(country.id)}
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
                  SAP Code
                </label>
                <input
                  type="text"
                  value={formData.sapCode}
                  onChange={(e) => setFormData({ ...formData, sapCode: e.target.value })}
                  placeholder="Enter SAP code"
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
                  Type
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Enter company type"
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
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
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
                  Bank Accounts
                </label>
                <input
                  type="text"
                  value={formData.bankAccounts}
                  onChange={(e) => setFormData({ ...formData, bankAccounts: e.target.value })}
                  placeholder="Enter bank account details"
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

      {showCountryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`rounded-lg p-6 w-full max-w-md ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">
              {editingCountryId !== null ? "Edit Country" : "Add Country"}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Country Name
                </label>
                <input
                  type="text"
                  value={countryFormData.name}
                  onChange={(e) =>
                    setCountryFormData({ ...countryFormData, name: e.target.value })
                  }
                  placeholder="Enter country name"
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
                  Country Code
                </label>
                <input
                  type="text"
                  value={countryFormData.countryCode}
                  onChange={(e) =>
                    setCountryFormData({ ...countryFormData, countryCode: e.target.value })
                  }
                  placeholder="Enter country code"
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
                onClick={() => setShowCountryModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCountry}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  isDarkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {editingCountryId !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
