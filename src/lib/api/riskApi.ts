import { useCallback, useEffect, useState } from "react";
import type { RiskPayload } from "../types";
import axios from "axios";
import Cookies from "js-cookie";

const hostname = window.location.hostname;

let apiUrl = "https://natpower-gis-project-dev.azurewebsites.net";
let authUrl = "https://natpower-auth-service-dev.azurewebsites.net";

console.log("Current hostname:", hostname);
if (hostname.includes("frontend-dev")) {
  apiUrl = import.meta.env.VITE_DEV_API_BASE_URL || "https://natpower-gis-project-dev.azurewebsites.net";
  authUrl = import.meta.env.VITE_DEV_API_AUTH_URL || "https://natpower-auth-service-dev.azurewebsites.net";
} else if (hostname.includes("natrisk.natpower.uk")) {
  apiUrl = import.meta.env.VITE_PROD_API_BASE_URL || "https://natpower-gis-project.azurewebsites.net";
  authUrl = import.meta.env.VITE_PROD_API_AUTH_URL || "https://natpower-auth-service.azurewebsites.net";
}

export const API_BASE_URL = apiUrl;
export const API_AUTH_URL = authUrl;

const username = "waseem.zafar@axiomworld.net";
const password = "1234";
export const encodedCredentials = btoa(`${username}:${password}`);

const token = localStorage.getItem("poAccessToken");

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
    "Content-Type": "application/json",
    },
    });
    
    // Attach token and handle refresh
    api.interceptors.request.use(async (config: any) => {
    
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
        Cookies.get("poRefreshToken")
        ) {
            originalRequest._retry = true;
        
            try {
            const res = await axios.post(`${API_AUTH_URL}/auth/authenticate`, {
                refresh_token: Cookies.get("poRefreshToken"),
            });
        
            const { access_token, refresh_token } = res.data.data;
        
            localStorage.setItem("poAccessToken", access_token);
            if (refresh_token) {
              Cookies.set("poRefreshToken", refresh_token, {
                sameSite: "strict",
                secure: true,
                path: "/",
                expires: 0.05
            });
            }
        
            // retry original request
            originalRequest.headers.Authorization = `Basic ${access_token}`;
            return axios(originalRequest);
            } catch (err: any) {
            // Refresh failed, logout user
            console.error("Refresh token failed:", err);
            localStorage.removeItem("poAccessToken");
            Cookies.remove("poRefreshToken");
            window.location.href = "/auth";
            }
    }
        return Promise.reject(error);
    }
);

export default api;

export const useFetchJson = <T,>(url: string,  rootKey?: string, limit?: number,) => {
    const [data, setData] = useState<T[]>();
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("poAccessToken");
    const fetchData = useCallback(async () => {
        if (!url || !token) return;
    
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${url}`, {
                headers: {
                'Content-Type': 'application/json',
                'X-Access-Token': `${token}`,
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
    }, [url, rootKey, limit, token]);
        
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
}

export const useFetchRawField = <T,>(url: string,  fieldName: string = '') => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        try {

            const res = await fetch(`${url}`, {
              headers: {
                'Content-Type': 'application/json',
                'X-Access-Token': `${token}`,
                },
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
                        if (!trimmedLabel || trimmedLabel.toLowerCase() === "false" || seen.has(trimmedLabel)) continue;

                        seen.add(trimmedLabel);
                        uniqueItems.push({
                            id: valueId,
                            label: trimmedLabel,
                            value: valueId,
                            wbs_sub_code: wbs_sub_code
                        });
                    } else {
                        const value = String(rawValue).trim();
                        if (!value || value.toLowerCase() === "false" || seen.has(value)) continue;

                        seen.add(value);
                        const entry: IDataItem = {
                            id: (item as any).id,
                            label: value,
                            value: (item as any).id,
                            wbs_sub_code: (item as any).wbs_sub_code
                        };

                        if (url === "cost.center") {
                            entry.code = (item as any).code;
                        }
                        if (url === "contact") {
                            entry.label = (item as any).name;
                            entry.email = (item as any).email;
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

interface ContactOption {
  id: number;
  label: string;
  value: number;
  email: string;
  role?: string;
  domain?: string;
}

export const useFetchContactOptions = (url: string) => {
  const [data, setData] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("poAccessToken");

  useEffect(() => {
    const fetchData = async () => {
      if (!url || !token) return;
      setLoading(true);
      try {
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Token': token || '',
          },
        });
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);

        const json = await res.json();

        if (!Array.isArray(json)) throw new Error("Invalid response format");

        const contacts: ContactOption[] = json
          .filter(user => user.userId && user.username)
          .map(user => ({
            id: user.userId,
            label: user.username,
            value: user.userId,
            email: user.email,
            role: user.role,
            domain: user.domain,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setData(contacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, token]);

  return { data, loading };
};


export const createRisk = async (data: RiskPayload) => {
    const token = localStorage.getItem("poAccessToken");
    try {
        const response = await fetch(`${API_BASE_URL}/riskregister/create`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'X-Access-Token': `${token}`,
            },
            ...(data && typeof data === 'object'
              ? { body: JSON.stringify(data) }
              : { body: data }),
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

export const updateRisk = async (data: any) => {
    const token = localStorage.getItem("poAccessToken");
    const res = await fetch(`${API_BASE_URL}/riskregister/update`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Token': `${token}`,
        },
        ...(data && typeof data === 'object'
          ? { body: JSON.stringify(data) }
          : { body: data }),
    });

    if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
    }

    return await res.json();
};

export const deleteRisk = async (riskId: number | string) => {
  const token = localStorage.getItem("poAccessToken");
  try {
      const response = await fetch(`${API_BASE_URL}/riskregister/${riskId}`, {
          method: "DELETE",
          headers: {
              'Content-Type': 'application/json',
              'X-Access-Token': `${token}`,
          },
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
  } catch (error) {
      console.error(`Failed to delete risk ID ${riskId}:`, error);
      throw error;
  }
};

export const getAllPoStatus = async () => {
    const res = await fetch(`${API_BASE_URL}/ir.model.fields?domain=[('model', '=', 'purchase.order'), ('name', '=', 'state')]&fields=['name','selection']`, {
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

export const getAllProject = async () => {
    const res = await fetch(`${API_BASE_URL}/project.project?domain=[]&fields=['name','project_code']`, {
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
export const getAllCompany = async () => {
    const res = await fetch(`${API_BASE_URL}/res.company?domain=[]&fields=['name']`, {
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
    const res = await fetch(`${API_BASE_URL}/product.product?domain=[('wbs_sub_code','!=',False)]&fields=['name','id','wbs_sub_code','detailed_type','list_price','standard_price']`, {
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

export const getAllVendor = async () => {
    const res = await fetch(`${API_BASE_URL}/res.partner?domain=[('supplier_rank', '=', 1)]`, {
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

export const addNewContact = async (contact: { name:any ; email: string }) => {
    const payload = {
        vals: {
          name: contact.name,
          email: contact.email
        }
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
    method: 'PUT',
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      throw new Error(`Vendor creation failed: ${res.status}`);
    }
  
    return await res.json();
  };
  
  export const updateVendorById = async (vendorId: number, updatedVendor: {
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
  
  export const addNewCostCenter = async (payload: { name: string; code: string }) => {
    const res = await fetch(`${API_BASE_URL}/cost.center`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify({ vals: payload }),
    })
  
    if (!res.ok) {
      throw new Error(`Failed to add cost center: ${res.statusText}`)
    }
  
    return res.json()
  }
  
  export const updateCostCenterById = async (id: number, updatedData: { name: string; code: string }) => {
    const response = await fetch(`${API_BASE_URL}/cost.center/${id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
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
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify({ vals: payload }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
  
    return response.json();
  };
  
  export const addNewProject = async (payload: { name: string; project_code: string }) => {
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
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify({ vals: payload }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
  
    return response.json();
  };

  export const updateCompanyById = async (companyId: number, updatedCompany: any) => {
    const payload = { vals: updatedCompany };
    const res = await fetch(`${API_BASE_URL}/res.company/${companyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`
      },
      body: JSON.stringify(payload)
    });
  
    if (!res.ok) throw new Error('Failed to update company');
    return await res.json();
  };

  export const deleteCompanyById = async (id:any) => {
    const res = await fetch(`${API_BASE_URL}/res.company/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`,
      }
    });
  
    if (!res.ok) {
      throw new Error(`Company deletion failed: ${res.status}`);
    }
  
    return await res.json();
  }
  