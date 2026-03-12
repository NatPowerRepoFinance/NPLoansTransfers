import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL, encodedCredentials } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (text: string, length: number) => {
  return text.length > length ? text.slice(0, length) + "..." : text;
};

export const formattedDate = (data : string) => {
  if (!data) return "";
  const date = new Date(data);
  return `${String(date.getDate()).padStart(2, '0')}/${String( date.getMonth() + 1 ).padStart(2, '0')}/${date.getFullYear()}`
}

export const toInputDate = (dateString: string, addDays: number = 0): string => {
  if (!dateString) return "";

  const [datePart] = dateString.split(" ");
  const date = new Date(datePart);

  if (isNaN(date.getTime())) return "";

  if (addDays) {
    date.setDate(date.getDate() + addDays);
  }

  return date.toISOString().split("T")[0];
};

export const formatToTwoDecimals = (value: number) =>
  parseFloat(value.toFixed(2));

export const handleViewPdf = async (url : string, key: string) => {
  let fileBase64 = '';
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
    const data = json["purchase.order"];
    fileBase64 = data?.[key];
  } catch (err) {
    console.error("Fetch error:", err);
  }

  if (!fileBase64) {
    alert("No PDF data available.");
    return;
  }

  const byteCharacters = atob(fileBase64);
  const byteNumbers = new Array(byteCharacters.length).fill(null).map((_, i) => byteCharacters.charCodeAt(i));
  const byteArray = new Uint8Array(byteNumbers);

  const blob = new Blob([byteArray], { type: "application/pdf" });

  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
};

export const statusMap: Record<string, string> = {
  "draft": "Draft",
  "to approve": "Pending Approval",
  "manager_approval": "Manager Approved",
  "fully_approved": "Finance Approved",
  "rejected": "Rejected",
  "cancel": "Cancelled",
  "purchase": "Completed",
  "sent": "RFQ Sent",
  "done": "Closed",
};

export const roleStatusAccess: Record<string, string[]> = {
  User: ["draft", "to approve", "cancel" ],
  "Management Approval Group": ["draft", "to approve", "manager_approval", "rejected", "cancel"],
  "Finance Approval Group": ["draft", "to approve", "fully_approved", "rejected", "cancel", "purchase", "done"],
  "Super Admin": Object.keys(statusMap), 
};

export const RiskScoreColours = [
  '#D4EDDA', // 1 - Pastel Green
  '#C3E6CB', // 2 - Light Green
  '#FFEEBA', // 3 - Yellow
  '#F4AEB5', // 4 - Light Pink f5c6cb
  '#E58B94' // 5 - Pastel Red
];

export const getColorFromValue = (value: string | number) => {
  const index = Number(value) - 1;
  if (index >= 0 && index < RiskScoreColours.length) {
    return RiskScoreColours[index];
  }
  return 'white'; // default background if invalid
};

export const RiskCategoryMap: Record<number, string> = {
  1: 'Land',
  2: 'Grid',
  3: 'Planning',
  4: 'Financial',
  5: 'Technical',
  6: 'Reputational',
  7: 'Legal',
  8: 'Development',
};

export const RiskTypeMap: Record<number, string> = {
  1: 'Risk',
  2: 'Issue',
}

export const RiskStatusMap: Record<number, string> = {
  1: 'Open',
  2: 'Closed',
}

export const Scores = [
  '1',
  '2',
  '3',
  '4',
  '5',
]

export const getMapLabel = (value: number, map: Record<number, string>): string | undefined => {
  return map[value];
};

export const mapToOptions = (arr: string[]) =>
  arr.map((item) => ({ value: item, label: item }));

export const getUserRole = (): string | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  return payload?.role;
};

export const isRiskAdmin = (): boolean => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return false;

  const payload = decodeJWT(token);
  return payload?.risk_role === "admin";
};

export const getUserInitials = (): string | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  if (!payload) return undefined;

  const first = payload.first_name?.[0]?.toUpperCase() || "";
  const last = payload.last_name?.[0]?.toUpperCase() || "";

  const initials = `${first}${last}`;
  return initials || undefined;
};

export const getUserFullName = (): string | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  if (!payload) return undefined;

  const first = payload.first_name || "";
  const last = payload.last_name || "";

  const initials = `${first} ${last}`;
  return initials || undefined;
};

export const decodeJWT = (token: string) => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return null;
  }
};