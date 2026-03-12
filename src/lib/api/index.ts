import { useCallback, useEffect, useState } from "react";
//import { PurchaseOrderPayload } from "../types";
import axios from "axios";

const hostname = window.location.hostname;

let apiUrl = "https://spt.natpower.uk/restapi/1.0/object";
let username_env = "c.belonwu@natpower.com";
let apiUrlBE =
  "https://as-natpower-purchase-order-backend-uksouth.azurewebsites.net";

let apiUrlProd =
  "https://as-natpower-purchase-order-backend-prod-uksouth.azurewebsites.net";

if (hostname.includes("frontend-dev")) {
  apiUrl =
    import.meta.env.VITE_DEV_API_BASE_URL ||
    "https://spt.natpower.uk/restapi/1.0/object";
  username_env = import.meta.env.VITE_DEV_USERNAME || "c.belonwu@natpower.com";
} else if (hostname.includes("natpo.natpower.uk")) {
  apiUrl =
    import.meta.env.VITE_PROD_API_BASE_URL ||
    "https://erp.natpower.uk/restapi/1.0/object";
  username_env =
    import.meta.env.VITE_PROD_USERNAME || "waseem.zafar@axiomworld.net";
}

export const API_BASE_URL = apiUrl;

// Production frontend hostnames (without protocol)
const PROD_HOSTNAMES = [
  "natpo.natpower.uk",
  "as-purchaseorder-prod-fe-uksouth.azurewebsites.net",
];

const isProductionHost = PROD_HOSTNAMES.some((prodHost) =>
  hostname.includes(prodHost)
);

export const BACKEND_API_BASE_URL = isProductionHost ? apiUrlProd : apiUrlBE;

// General function for calling Backend API
interface BackendApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
}

export const backendApiFetch = async <T = any>(
  endpoint: string,
  options: BackendApiOptions = {}
): Promise<T> => {
  const { method = "GET", body } = options;
  const token = localStorage.getItem("poAccessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["X-Access-Token"] = token;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/${endpoint}`,
    fetchOptions
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
};

const username = username_env;
const password = "1234";
export const encodedCredentials = btoa(`${username}:${password}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token and handle refresh
api.interceptors.request.use(async (config: any) => {
  const token = localStorage.getItem("poAccessToken");

  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }

  return config;
});

// Optional: Attach a response interceptor for automatic refresh
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("poRefreshToken")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${BACKEND_API_BASE_URL}/auth/authenticate`,
          {
            refresh_token: localStorage.getItem("poRefreshToken"),
          }
        );

        const { access_token, refresh_token } = res.data.data;

        localStorage.setItem("poAccessToken", access_token);
        const jsonString = atob(access_token);
        const payload = JSON.parse(jsonString);
        localStorage.setItem("role", payload.role);
        localStorage.setItem("costCenter", JSON.stringify(payload.costCenter));
        localStorage.setItem("last_name", payload.last_name);
        localStorage.setItem("first_name", payload.first_name);
        localStorage.setItem("id", payload.id);

        if (refresh_token) {
          localStorage.setItem("poRefreshToken", refresh_token);
        }

        // retry original request
        originalRequest.headers.Authorization = `Basic ${access_token}`;
        return axios(originalRequest);
      } catch (err: any) {
        // Refresh failed, logout user
        console.error("Refresh token failed:", err);
        localStorage.removeItem("poAccessToken");
        localStorage.removeItem("poRefreshToken");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const useFetchJson = <T>(
  url: string,
  rootKey?: string,
  limit?: number
) => {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${url}`, {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      let records: T[] = [];

      if (rootKey) {
        records = json[rootKey] || [];
      } else if (Array.isArray(json)) {
        records = json;
      } else {
        records = [];
        console.warn("No array found in response. Use rootKey if necessary.");
      }
      const result = limit ? records.slice(0, limit) : records;
      setData(result);
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [url, rootKey, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
};

export const useFetchJsonFromBackend = <T>(
  url: string,
  rootKey?: string,
  limit?: number
) => {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    try {
      const json = await backendApiFetch(url);
      const result = limit ? json.slice(0, limit) : json;
      setData(result.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [url, rootKey, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
};

export interface IDataItem {
  id: number;
  label: string;
  value: number;
  code?: string;
  email?: string;
  wbs_sub_code?: string;
  // Optional cost centre id (used for project.project where cost_center_id=[id, name])
  cost_center_id?: number;
}

export const useFetchRawField = <T>(url: string, fieldName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/${url}`, {
          headers: { Authorization: `Basic ${encodedCredentials}` },
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const json = await res.json();

        const allRecords = Object.values(json).flat();

        const seen = new Set<string>();
        const uniqueItems: IDataItem[] = [];

        for (const item of allRecords) {
          if (typeof item === "object" && item !== null && fieldName in item) {
            const rawValue = (item as Record<string, unknown>)[fieldName];
            if (Array.isArray(rawValue) && rawValue.length === 2) {
              const [valueId, valueLabel, wbs_sub_code] = rawValue;
              const trimmedLabel = String(valueLabel).trim();
              if (
                !trimmedLabel ||
                trimmedLabel.toLowerCase() === "false" ||
                seen.has(trimmedLabel)
              )
                continue;

              seen.add(trimmedLabel);
              const entry: IDataItem = {
                id: valueId,
                label: trimmedLabel,
                value: valueId,
                wbs_sub_code: wbs_sub_code,
              };

              // Attach cost center id for project.project records if present
              if (
                url.startsWith("project.project") &&
                Array.isArray((item as any).cost_center_id)
              ) {
                entry.cost_center_id = (item as any).cost_center_id[0];
              }

              uniqueItems.push(entry);
            } else {
              const value = String(rawValue).trim();
              if (!value || value.toLowerCase() === "false" || seen.has(value))
                continue;

              seen.add(value);
              const entry: IDataItem = {
                id: (item as any).id,
                label: value,
                value: (item as any).id,
                wbs_sub_code: (item as any).wbs_sub_code,
              };

              if (url === "cost.center") {
                entry.code = (item as any).code;
              }
              if (url === "contact") {
                entry.label = (item as any).name;
                entry.email = (item as any).email;
              }

              // Attach cost center id for project.project records if present
              if (
                url.startsWith("project.project") &&
                Array.isArray((item as any).cost_center_id)
              ) {
                entry.cost_center_id = (item as any).cost_center_id[0];
              }

              uniqueItems.push(entry);
            }
          }
        }
        uniqueItems.sort((a, b) => a.label.localeCompare(b.label));

        setData(uniqueItems as T[]);
      } catch (error) {
        console.error(error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, fieldName]);

  return { data, loading };
};

//export const createPurchaseOrder = async (payload: PurchaseOrderPayload) => {
export const createPurchaseOrder = async (payload: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchase.order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify({ vals: payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create PO:", error);
    throw error;
  }
};

export const createSupplierRequest = async (payload: any) => {
  try {
    return await backendApiFetch("supplier/new/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Supplier:", error);
    throw error;
  }
};

export const createOtherRequest = async (payload: any) => {
  try {
    return await backendApiFetch("other/req/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Other Request:", error);
    throw error;
  }
};

export const updateOtherRequest = async (payload: any) => {
  try {
    return await backendApiFetch("other/req/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Other Request:", error);
    throw error;
  }
};

export const updateSupplierRequest = async (payload: any) => {
  try {
    return await backendApiFetch("supplier/new/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Supplier:", error);
    throw error;
  }
};

// export const getSupplierRequest = async () => {
//   try {
//     const response = await fetch(`${BACKEND_API_BASE_URL}/supplier/new/all`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Basic ${encodedCredentials}`,
//       },
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`API Error (${response.status}): ${errorText}`);
//     }

//     const result = await response.json();
//     return result;
//   } catch (error) {
//     console.error("Failed to Fetch Supplier:", error);
//     throw error;
//   }
// };

interface PoUploadFiles {
  quote?: File | null;
  sap?: File | null;
  payloadText?: string;
}

export const updatePurchaseOrder = async (
  id: number,
  payload: any,
  files?: PoUploadFiles
) => {
  const hasFiles = Boolean(files?.quote || files?.sap);
  const headers: HeadersInit = {
    Authorization: `Basic ${encodedCredentials}`,
  };

  let body: BodyInit;

  if (hasFiles) {
    const formData = new FormData();
    formData.append("vals", files?.payloadText ?? JSON.stringify(payload));
    if (files?.quote) {
      formData.append("quote", files.quote);
    }
    if (files?.sap) {
      formData.append("sap", files.sap);
    }
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ vals: payload });
  }

  const res = await fetch(`${API_BASE_URL}/purchase.order/${id}`, {
    method: "PUT",
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllPoStatus = async () => {
  const res = await fetch(
    `${API_BASE_URL}/ir.model.fields?domain=[('model', '=', 'purchase.order'), ('name', '=', 'state')]&fields=['name','selection']`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllProject = async () => {
  const res = await fetch(
    `${API_BASE_URL}/project.project?domain=[]&fields=['name','project_code','company_id','cost_center_id']`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllCompany = async () => {
  const res = await fetch(
    `${API_BASE_URL}/res.company?domain=[]&fields=['name','phone','email','street','street2','city','zip']`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllCostCenter = async () => {
  const res = await fetch(`${API_BASE_URL}/cost.center`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllProduct = async () => {
  const res = await fetch(
    `${API_BASE_URL}/product.product?domain=[('wbs_sub_code','!=',False)]&fields=['name','id','wbs_sub_code','detailed_type','list_price','standard_price']`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllVendor = async () => {
  const res = await fetch(
    `${API_BASE_URL}/res.partner?domain=[('supplier_rank', '=', 1)]`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const getAllContact = async () => {
  const res = await fetch(`${API_BASE_URL}/contact`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Update failed: ${res.status}`);
  }

  return await res.json();
};

export const addNewContact = async (contact: { name: any; email: string }) => {
  const payload = {
    vals: {
      name: contact.name,
      email: contact.email,
    },
  };

  const res = await fetch(`${API_BASE_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Create contact failed: ${res.status}`);
  }

  return await res.json();
};

export const updateContact = async (id: number, payload: any) => {
  const res = await fetch(`${API_BASE_URL}/contact/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: payload }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update contact:  ${res.status}`);
  }

  return await res.json();
};

export const addNewVendor = async (vendor: {
  name: string;
  email: string;
  phone: string;
  is_company: boolean;
  contact_address: string;
  tax_rate: number;
  payment_terms: number;
  early_payment_discount: number;
  late_payment_penalities: number;
  with_holding_tax: boolean;
  with_holding_tax_rate: number;
}) => {
  const payload = {
    vals: {
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      is_company: vendor.is_company,
      contact_address: vendor.contact_address,
      tax_rate: vendor.tax_rate,
      payment_terms: vendor.payment_terms,
      early_payment_discount: vendor.early_payment_discount,
      late_payment_penalities: vendor.late_payment_penalities,
      with_holding_tax: vendor.with_holding_tax,
      with_holding_tax_rate: vendor.with_holding_tax_rate,
      supplier_rank: 1, // always fixed
    },
  };

  const res = await fetch(`${API_BASE_URL}/res.partner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Vendor creation failed: ${res.status}`);
  }

  return await res.json();
};

export const updateVendorById = async (
  vendorId: number,
  updatedVendor: {
    name: string;
    email: string;
    phone: string;
    is_company: boolean;
    contact_address: string;
    tax_rate: number;
    payment_terms: number;
    early_payment_discount: number;
    late_payment_penalities: number;
    with_holding_tax: boolean;
    with_holding_tax_rate: number;
  }
) => {
  const payload = {
    vals: {
      name: updatedVendor.name,
      email: updatedVendor.email,
      phone: updatedVendor.phone,
      is_company: updatedVendor.is_company,
      contact_address: updatedVendor.contact_address,
      tax_rate: updatedVendor.tax_rate,
      payment_terms: updatedVendor.payment_terms,
      early_payment_discount: updatedVendor.early_payment_discount,
      late_payment_penalities: updatedVendor.late_payment_penalities,
      with_holding_tax: updatedVendor.with_holding_tax,
      with_holding_tax_rate: updatedVendor.with_holding_tax_rate,
    },
  };

  const res = await fetch(`${API_BASE_URL}/res.partner/${vendorId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Vendor update failed: ${res.status}`);
  }

  return await res.json();
};

export const addNewCompany = async (companyData: {
  name: string;
  phone: string;
  email: string;
  street: string;
  street2: string;
  city: string;
  zip: string;
}) => {
  const payload = { vals: companyData };

  const response = await fetch(`${API_BASE_URL}/res.company`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create company");
  }

  return await response.json();
};

export const addNewCostCenter = async (payload: {
  name: string;
  code: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/cost.center`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: payload }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add cost center: ${res.statusText}`);
  }

  return res.json();
};

export const updateCostCenterById = async (
  id: number,
  updatedData: { name: string; code: string }
) => {
  const response = await fetch(`${API_BASE_URL}/cost.center/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: updatedData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update cost center with id ${id}`);
  }

  return response.json();
};

export const addNewProduct = async (product: {
  name: string;
  detailed_type: string;
  list_price: number;
  standard_price: number;
  wbs_sub_code: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/product.template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({
      vals: {
        name: product.name,
        detailed_type: product.detailed_type,
        list_price: product.list_price,
        standard_price: product.standard_price,
        wbs_sub_code: product.wbs_sub_code,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add product: ${response.status}`);
  }

  return await response.json();
};

export const updateProduct = async (id: number, payload: any) => {
  const response = await fetch(`${API_BASE_URL}/product.template/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: payload }),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
};

export const addNewProject = async (payload: {
  name: string;
  project_code: string;
  cost_center_id: string;
  company_id: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/project.project`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: payload }),
  });

  if (!response.ok) throw new Error("Failed to add new project");
  return await response.json();
};

export const updateProjectById = async (id: number, payload: any) => {
  const response = await fetch(`${API_BASE_URL}/project.project/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({ vals: payload }),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
};

export const updateCompanyById = async (
  companyId: number,
  updatedCompany: any
) => {
  const payload = { vals: updatedCompany };
  const res = await fetch(`${API_BASE_URL}/res.company/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update company");
  return await res.json();
};

export const deleteCompanyById = async (id: any) => {
  const res = await fetch(`${API_BASE_URL}/res.company/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Company deletion failed: ${res.status}`);
  }

  return await res.json();
};

export interface CostCenterPayload {
  costCenterName: string;
  costCenterCode: string;
}

export interface CostCenterUpdatePayload extends CostCenterPayload {
  costCenterId: number;
}

export const createCostCenterBackend = async (payload: CostCenterPayload) => {
  try {
    return await backendApiFetch("costcenter/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Cost Center:", error);
    throw error;
  }
};

export const updateCostCenterBackend = async (
  payload: CostCenterUpdatePayload
) => {
  try {
    return await backendApiFetch("costcenter/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Cost Center:", error);
    throw error;
  }
};

export const getAllCostCenterBackend = async () => {
  try {
    return await backendApiFetch("costcenter/all");
  } catch (error) {
    console.error("Failed to fetch Cost Centers:", error);
    throw error;
  }
};

// ---------- Internal Company APIs ----------

export interface InternalCompanyPayload {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddressLine1: string;
  companyAddressLine2: string;
  companyAddressCity: string;
  companyAddressPostCode: string;
}

export interface InternalCompanyUpdatePayload extends InternalCompanyPayload {
  companyId: number;
}

export const createInternalCompany = async (
  payload: InternalCompanyPayload
) => {
  try {
    return await backendApiFetch("internal/company/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Internal Company:", error);
    throw error;
  }
};

export const updateInternalCompany = async (
  payload: InternalCompanyUpdatePayload
) => {
  try {
    return await backendApiFetch("internal/company/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Internal Company:", error);
    throw error;
  }
};

export const getAllInternalCompany = async () => {
  try {
    return await backendApiFetch("internal/company/all");
  } catch (error) {
    console.error("Failed to fetch Internal Companies:", error);
    throw error;
  }
};

// ---------- Product APIs ----------

export interface ProductBackendPayload {
  productName: string;
  wbsSubCode: string;
  listPrice: number;
}

export interface ProductBackendUpdatePayload extends ProductBackendPayload {
  productId: number;
}

export const createProductBackend = async (payload: ProductBackendPayload) => {
  try {
    return await backendApiFetch("product/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Product:", error);
    throw error;
  }
};

export const updateProductBackend = async (
  payload: ProductBackendUpdatePayload
) => {
  try {
    return await backendApiFetch("product/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Product:", error);
    throw error;
  }
};

export const getAllProductBackend = async () => {
  try {
    return await backendApiFetch("product/all");
  } catch (error) {
    console.error("Failed to fetch Products:", error);
    throw error;
  }
};

// ---------- Project APIs ----------

export interface ProjectBackendPayload {
  projectName: string;
  projectCode: string;
  internalCompanyId: number;
  costCenterId: number;
}

export interface ProjectBackendUpdatePayload extends ProjectBackendPayload {
  projectId: number;
}

export const createProjectBackend = async (payload: ProjectBackendPayload) => {
  try {
    return await backendApiFetch("projects/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Project:", error);
    throw error;
  }
};

export const updateProjectBackend = async (
  payload: ProjectBackendUpdatePayload
) => {
  try {
    return await backendApiFetch("projects/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Project:", error);
    throw error;
  }
};

export const getAllProjectBackend = async () => {
  try {
    return await backendApiFetch("projects/all");
  } catch (error) {
    console.error("Failed to fetch Projects:", error);
    throw error;
  }
};

// ---------- Supplier APIs ----------

export interface SupplierBackendPayload {
  supplierName: string;
  taxRate: number;
  paymentTerms: number;
  earlyPaymentDiscount: number;
  latePaymentPenalties: number;
  withholdingTaxRate: number;
  hasWithholdingTax: boolean;
  isCompany: boolean;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress: string;
  sapCode: string;
}

export interface SupplierBackendUpdatePayload extends SupplierBackendPayload {
  supplierId: number;
}

export const createSupplierBackend = async (
  payload: SupplierBackendPayload
) => {
  try {
    return await backendApiFetch("supplier/create", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Supplier:", error);
    throw error;
  }
};

export const updateSupplierBackend = async (
  payload: SupplierBackendUpdatePayload
) => {
  try {
    return await backendApiFetch("supplier/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Supplier:", error);
    throw error;
  }
};

export const getAllSupplierBackend = async () => {
  try {
    return await backendApiFetch("supplier/all");
  } catch (error) {
    console.error("Failed to fetch Suppliers:", error);
    throw error;
  }
};

// ---------- Contact List APIs ----------

export interface ContactListPayload {
  contactName: string;
  contactEmail: string;
  contactDisplayName: string;
}

export const createContactBackend = async (payload: ContactListPayload) => {
  try {
    return await backendApiFetch("contact-lists", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Contact:", error);
    throw error;
  }
};

export const updateContactBackend = async (
  contactId: number,
  payload: ContactListPayload
) => {
  try {
    return await backendApiFetch(`contact-lists/${contactId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Contact:", error);
    throw error;
  }
};

export const getAllContactBackend = async () => {
  try {
    return await backendApiFetch("contact-lists");
  } catch (error) {
    console.error("Failed to fetch Contacts:", error);
    throw error;
  }
};

export const getContactByIdBackend = async (contactId: number) => {
  try {
    return await backendApiFetch(`contact-lists/${contactId}`);
  } catch (error) {
    console.error("Failed to fetch Contact:", error);
    throw error;
  }
};

// ---------- Purchase Order APIs ----------

export interface PurchaseOrderLineItemDto {
  relId?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  net: number;
  vat: number;
  gross: number;
  wbsCode: string;
  lineItemDescription?: string;
}

export interface PurchaseOrderBackendPayload {
  contactId: number;
  internalCompanyId: number;
  costCenterId: number;
  deliveryDate: string;
  vendorId: number;
  internalComments?: string;
  description?: string;
  deliveryInstructions?: string;
  deliveryAddressId?: number;
  paymentDate?: string;
  supplierQuote?: string;
  projectId: number;
  vendorContactName?: string;
  noteOfSupplier?: string;
  sapPurchaseOrder?: string | null;
  sapPurchaseOrderDocument?: string | null;
  orderStatusId?: number;
  orderStatusReason?: string;
  purchaseOrderLineItemDtos?: PurchaseOrderLineItemDto[];
}

const wrapRequestPayload = <T>(payload: T) => payload;

const buildRequestText = <T>(payload: T, payloadText?: string) => {
  if (payloadText) {
    try {
      const parsed = JSON.parse(payloadText);
      // If it has a "request" wrapper, unwrap it
      if (parsed && typeof parsed === "object" && "request" in parsed) {
        return JSON.stringify(parsed.request);
      }
      return JSON.stringify(parsed);
    } catch {
      // Fall back to the typed payload if payloadText is invalid JSON.
    }
  }
  return JSON.stringify(payload);
};

export const createPurchaseOrderBackend = async (
  payload: PurchaseOrderBackendPayload,
  files?: PoUploadFiles
) => {
  try {
    if (files) {
      const token = localStorage.getItem("poAccessToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["X-Access-Token"] = token;
      }

      const formData = new FormData();
      // Match backend multipart contract used by curl:
      // - request: text JSON payload
      // - quote/sap: uploaded file parts
      formData.append("request", buildRequestText(payload, files?.payloadText));
      if (files?.quote) {
        formData.append("quote", files.quote);
      }
      if (files?.sap) {
        formData.append("sap", files.sap);
      }

      const response = await fetch(`${BACKEND_API_BASE_URL}/purchase-orders`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      return response.json();
    }

    return await backendApiFetch("purchase-orders", {
      method: "POST",
      body: wrapRequestPayload(payload),
    });
  } catch (error) {
    console.error("Failed to create Purchase Order:", error);
    throw error;
  }
};

export const updatePurchaseOrderBackend = async (
  poId: number,
  payload: Partial<PurchaseOrderBackendPayload>,
  files?: PoUploadFiles
) => {
  try {
    if (files) {
      const token = localStorage.getItem("poAccessToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["X-Access-Token"] = token;
      }

      const formData = new FormData();
      // Match multipart contract used for create:
      // - request: text JSON payload
      // - quote/sap: uploaded file parts
      // formData.append("request", buildRequestText(payload, files?.payloadText));
      formData.append("request", files?.payloadText ?? JSON.stringify(payload));
      if (files?.quote) {
        formData.append("quote", files.quote);
      }
      if (files?.sap) {
        formData.append("sap", files.sap);
      }

      const response = await fetch(
        `${BACKEND_API_BASE_URL}/purchase-orders/${poId}`,
        {
          method: "PATCH",
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      return response.json();
    }

    return await backendApiFetch(`purchase-orders/${poId}`, {
      method: "PATCH",
      body: wrapRequestPayload(payload),
    });
  } catch (error) {
    console.error("Failed to update Purchase Order:", error);
    throw error;
  }
};

export const getAllPurchaseOrderBackend = async () => {
  try {
    return await backendApiFetch("purchase-orders");
  } catch (error) {
    console.error("Failed to fetch Purchase Orders:", error);
    throw error;
  }
};

export const downloadPurchaseOrderFile = async (url: string): Promise<Blob> => {
  const safeUrl = String(url ?? "").trim();
  if (!safeUrl) {
    throw new Error("File URL is required.");
  }

  const token = localStorage.getItem("poAccessToken");
  const headers: HeadersInit = {};
  if (token) {
    headers["X-Access-Token"] = token;
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/purchase-orders/download?url=${encodeURIComponent(
      safeUrl
    )}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.blob();
};

export const getPurchaseOrderByIdBackend = async (poId: number) => {
  try {
    return await backendApiFetch(`purchase-orders/${poId}`);
  } catch (error) {
    console.error("Failed to fetch Purchase Order:", error);
    throw error;
  }
};

export const getPurchaseOrderStatusBackend = async () => {
  try {
    return await backendApiFetch("purchase-order/search");
  } catch (error) {
    console.error("Failed to fetch Purchase Order Status:", error);
    throw error;
  }
};

// Helper: given a status ID, return its displayName from the backend status list
export const getPurchaseOrderStatusDisplayName = async (
  orderStatusId: number
): Promise<string | undefined> => {
  try {
    const res = await getPurchaseOrderStatusBackend();
    const list = (res && (res.data || res)) || [];

    if (!Array.isArray(list)) {
      return undefined;
    }

    const matched = list.find(
      (s: any) => Number(s.orderStatusId) === Number(orderStatusId)
    );

    return matched?.internalName;
  } catch (error) {
    console.error(
      "Failed to resolve Purchase Order Status displayName:",
      error
    );
    return undefined;
  }
};

// ---------- Purchase Order Line Item APIs ----------

export interface PurchaseOrderLineItemPayload {
  projectId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  net: number;
  vat: number;
  gross: number;
  wbsCode: string;
}

export const createPurchaseOrderLineItemBackend = async (
  payload: PurchaseOrderLineItemPayload
) => {
  try {
    return await backendApiFetch("purchase-order-line-items", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to create Purchase Order Line Item:", error);
    throw error;
  }
};

export const updatePurchaseOrderLineItemBackend = async (
  lineItemId: number,
  payload: PurchaseOrderLineItemPayload
) => {
  try {
    return await backendApiFetch(`purchase-order-line-items/${lineItemId}`, {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update Purchase Order Line Item:", error);
    throw error;
  }
};

export const getAllPurchaseOrderLineItemsBackend = async () => {
  try {
    return await backendApiFetch("purchase-order-line-items");
  } catch (error) {
    console.error("Failed to fetch Purchase Order Line Items:", error);
    throw error;
  }
};

export const getPurchaseOrderLineItemByIdBackend = async (
  lineItemId: number
) => {
  try {
    return await backendApiFetch(`purchase-order-line-items/${lineItemId}`);
  } catch (error) {
    console.error("Failed to fetch Purchase Order Line Item:", error);
    throw error;
  }
};

// ---------- Delivery Address APIs ----------

export const getDeliveryAddressSearchBackend = async () => {
  try {
    return await backendApiFetch("delivery-address/search");
  } catch (error) {
    console.error("Failed to fetch Delivery Addresses:", error);
    throw error;
  }
};

// ---------- User APIs ----------

export interface UserBackendPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  costCenter: number[];
}

export interface UserBackendUpdatePayload {
  id: number;
  role?: number;
  costCenter?: number[];
}

export const getAllUsersBackend = async () => {
  try {
    return await backendApiFetch("user/all");
  } catch (error) {
    console.error("Failed to fetch Users:", error);
    throw error;
  }
};

export const createUserBackend = async (payload: UserBackendPayload) => {
  try {
    return await backendApiFetch("auth/register", {
      method: "POST",
      body: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        password: payload.password,
        costCenter: payload.costCenter,
      },
    });
  } catch (error) {
    console.error("Failed to create User:", error);
    throw error;
  }
};

export const updateUserBackend = async (payload: UserBackendUpdatePayload) => {
  try {
    return await backendApiFetch("user/update", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to update User:", error);
    throw error;
  }
};

export const deleteUserBackend = async (userId: number) => {
  try {
    return await backendApiFetch(`auth/remove-user/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Failed to delete User:", error);
    throw error;
  }
};

export const resetUserPasswordBackend = async (payload: {
  email: string;
  new_password: string;
  new_password_confirm: string;
}) => {
  try {
    return await backendApiFetch("auth/reset", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    throw error;
  }
};
