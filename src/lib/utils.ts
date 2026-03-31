import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL, encodedCredentials, getAllCostCenter } from "./api";
import { useLiveTranslation } from "@/components/useLiveTranslation";
import { useAuth } from "./authProvider";

type EmailTemplateProps = {
  poNumber: string;
  newState: string;
  creationUser: string;
  cancellationReason: any;
  rejectionReason: any;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (text: string, length: number) => {
  return text.length > length ? text.slice(0, length) + "..." : text;
};

export const formattedDate = (data: string) => {
  const date = new Date(data);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

export const toInputDate = (
  dateString: string,
  addDays: number = 0
): string => {
  if (!dateString) return "";

  const [datePart] = dateString.split("T");
  const date = new Date(datePart);

  if (isNaN(date.getTime())) return "";

  if (addDays) {
    date.setDate(date.getDate() + addDays);
  }

  return date.toISOString().split("T")[0];
};

export const formatToTwoDecimals = (value: number) =>
  parseFloat(value.toFixed(2));

export const handleViewPdf = async (url: string, key: string) => {
  let fileBase64 = "";
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
  const byteNumbers = new Array(byteCharacters.length)
    .fill(null)
    .map((_, i) => byteCharacters.charCodeAt(i));
  const byteArray = new Uint8Array(byteNumbers);

  const blob = new Blob([byteArray], { type: "application/pdf" });

  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
};

export const statusMap: Record<string, string> = {
  draft: "Draft",
  manager_approval: "Manager Approved",
  fully_approved: "Finance Approved",
  submit_to_finance: "Submitted to Finance",
  rejected: "Rejected",
  sent: "RFQ Sent",
  "to approve": "Pending Approval",
  purchase: "Completed",
  done: "Closed",
  cancel: "Cancelled",
};

export const statusRequestMap: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  "not approved": "Not Approved",
  "already on system": "Already on System",
};

export const statusCodeRequestMap: Record<string, number> = {
  pending: 1,
  completed: 2,
  cancelled: 3,
  "not approved": 5,
  "already on system": 4,
};

export const requestRoleStatusAccess: Record<string, string[]> = {
  User: ["pending"],
  "Super Admin": Object.keys(statusRequestMap),
};
export const roleStatusAccess: Record<string, string[]> = {
  User: ["draft", "to approve", "cancel"],
  "Management Approval Group": [
    "draft",
    "to approve",
    "manager_approval",
    "rejected",
    "cancel",
  ],
  "Finance Approval Group": [
    "draft",
    "to approve",
    "fully_approved",
    "submit_to_finance",
    "rejected",
    "cancel",
    "purchase",
    "done",
  ],
  "Super Admin": Object.keys(statusMap),
};

export const getUserRole = (): string | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  return payload?.role;
};

export const getUserInitials = (): string | undefined => {
  const storedFirstName = localStorage.getItem("user_first_name") || "";
  const storedLastName = localStorage.getItem("user_last_name") || "";
  if (storedFirstName || storedLastName) {
    const first = storedFirstName.trim().charAt(0).toUpperCase();
    const last = storedLastName.trim().charAt(0).toUpperCase();
    const initials = `${first}${last}`.trim();
    return initials || undefined;
  }

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
  const storedFirstName = localStorage.getItem("user_first_name") || "";
  const storedLastName = localStorage.getItem("user_last_name") || "";
  if (storedFirstName || storedLastName) {
    const fullName = `${storedFirstName} ${storedLastName}`.trim();
    return fullName || undefined;
  }

  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  if (!payload) return undefined;

  const first = payload.first_name || "";
  const last = payload.last_name || "";

  const initials = `${first} ${last}`;
  return initials || undefined;
};

export const getUserId = (): number | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;

  const payload = decodeJWT(token);
  if (!payload) return undefined;

  const id = payload.id || "";

  return id || undefined;
};

export const getUserEmail = (): string | undefined => {
  const token = localStorage.getItem("poAccessToken");
  if (!token) return undefined;
  const payload = decodeJWT(token);
  if (!payload) return undefined;
  const email = payload.sub || "";
  return email || undefined;
};

export const getUserCostCenter = async () => {
  const stored = localStorage.getItem("costCenter");
  if (!stored) return {};

  // Parse stored IDs (e.g. "[1,2,3,4]")
  const ids: number[] = JSON.parse(stored);

  // Fetch cost center data
  const data = await getAllCostCenter();
  const allCenters = data["cost.center"] || [];

  // Filter by matching IDs
  const filtered = allCenters.filter((c: any) => ids.includes(c.id));

  // Convert to required output format
  const result: Record<string, string> = {};

  filtered.forEach((c: any) => {
    result[c.id] = c.name; // key = id, value = name
  });

  console.log("User Cost Centers:", result);
  return result;
};

export const decodeJWT = (token: string) => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Invalid JWT token:", error);
    return null;
  }
};

export const generateEmailHtml = ({
  poNumber,
  newState,
  creationUser,
  cancellationReason,
  rejectionReason,
}: EmailTemplateProps): string => {
  const status = statusMap[newState];
  const hasCancellationReason =
    status === "Cancelled" && cancellationReason !== false;
  const hasRejectionReason = status === "Rejected" && rejectionReason !== false;
  const trimmedPoNumber = poNumber.trim();
  const shortPoNumber = trimmedPoNumber.slice(-4);

  return `
  <div style="background-color: #f1f4f9; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; word-wrap: break-word;">
      <tr>
        <td style="background-color: #1d2636; padding: 24px 20px;">
          <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 600;">NatView • PO Status Update</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 20px;">
          <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
            Hello ${creationUser},
          </p>
          <p style="font-size: 16px; color: #333333; margin-bottom: 16px;">
            This is to notify you that the status of the following Purchase Order has been updated:
          </p>
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 30px; word-break: break-word;">
            <tr>
              <td style="font-size: 15px; color: #555; padding: 6px 0; vertical-align: top; width: 40%;"><strong>PO Request ID:</strong></td>
              <td style="font-size: 15px; color: #1d2636; padding: 6px 0; width: 60%;">${shortPoNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 15px; color: #555; padding: 6px 0; vertical-align: top; width: 40%;"><strong>New Status:</strong></td>
              <td style="font-size: 15px; color: #0b5ed7; padding: 6px 0; font-weight: 600; width: 60%;">${
                statusMap[newState]
              }</td>
            </tr>
            ${
              hasCancellationReason
                ? `<tr><td style="font-size: 15px; color: #555; padding: 6px 0; vertical-align: top; width: 40%;"><strong>Cancellation Reason:</strong></td><td style="font-size: 15px; color: #d00000; padding: 6px 0; width: 60%;">${cancellationReason}</td></tr>`
                : ""
            }
            ${
              hasRejectionReason
                ? `<tr><td style="font-size: 15px; color: #555; padding: 6px 0; vertical-align: top; width: 40%;"><strong>Rejection Reason:</strong></td><td style="font-size: 15px; color: #d00000; padding: 6px 0; width: 60%;">${rejectionReason}</td></tr>`
                : ""
            }
          </table>

          <p style="font-size: 15px; color: #444444; margin-bottom: 30px;">
            You can view or take action on this PO from your dashboard.
          </p>

          <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://as-natpower-notification-service-uksouth.azurewebsites.net/api/redirect" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0b5ed7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px;">
              View PO Details
            </a>
          </div>

          <p style="font-size: 13px; color: #999999; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated message from the NatView system. Please do not reply directly to this email.
          </p>
        </td>
      </tr>
    </table>

    <style>
      @media only screen and (max-width: 600px) {
        table, td, p, a {
          font-size: 14px !important;
          word-break: break-word !important;
        }
        h1 {
          font-size: 18px !important;
        }
        a {
          padding: 10px 20px !important;
        }
        td {
          display: block;
          width: 100% !important;
        }
      }
    </style>
  </div>`;
};

export function useFormPlaceholders() {
  const { lang } = useAuth();
  return {
    description: useLiveTranslation("Enter a description of the order", lang),
    deliveryInstructions: useLiveTranslation(
      "Special delivery instructions",
      lang
    ),
    reqDescription: useLiveTranslation("Description", lang),
    vendorContactName: useLiveTranslation("Enter Vendor Contact Name", lang),
    internalComments: useLiveTranslation("Enter any internal comments", lang),
    notesToSupplier: useLiveTranslation("Enter any notes to supplier", lang),
    sapPoNumber: useLiveTranslation("Enter SAP PO Number", lang),
    reason: useLiveTranslation("Enter reason", lang),
    quoteFile: useLiveTranslation("Upload Quote (PDF)", lang),
    sapFile: useLiveTranslation("Upload SAP file (PDF)", lang),
    viewQuote: useLiveTranslation("View Quote", lang),
    lineItem: useLiveTranslation("Line Item", lang),
    lineDescription: useLiveTranslation("Description", lang),
    lineQuantity: useLiveTranslation("Quantity", lang),
    lineUnitPrice: useLiveTranslation("Unit Price", lang),
    lineWbsCode: useLiveTranslation("WBS Code", lang),
    lineNet: useLiveTranslation("NET", lang),
    lineVAT: useLiveTranslation("VAT", lang),
    lineGross: useLiveTranslation("Gross", lang),
    lineheaderdescription: useLiveTranslation(
      "Max 43 characters are allowed",
      lang
    ),
    lineSelect: useLiveTranslation("Select a task", lang),
    save: useLiveTranslation("Save PO", lang),
    saving: useLiveTranslation("Saving...", lang),
    index: useLiveTranslation("Index", lang),
    PONumber: useLiveTranslation("PO Number", lang),
    CreatedBy: useLiveTranslation("Created By", lang),
    ProjectName: useLiveTranslation("Project Name", lang),
    VendorName: useLiveTranslation("Vendor Name", lang),
    TotalNet: useLiveTranslation("Total Net", lang),
    TotalGross: useLiveTranslation("Total Gross", lang),
    Status: useLiveTranslation("Status", lang),
    CostCenter: useLiveTranslation("Cost Center", lang),
    Edit: useLiveTranslation("Edit/View", lang),
    QuotePdf: useLiveTranslation("Quote PDF", lang),
    SAPPdf: useLiveTranslation("SAP PDF", lang),
    RequestTitle: useLiveTranslation("Request Title", lang),
    Date: useLiveTranslation("Date", lang),
    EnterSupplierCompanyRegisteredAddress: useLiveTranslation(
      "Enter Supplier Company Registered Address",
      lang
    ),
    EnterInvoiceAddress: useLiveTranslation("Enter Invoice Address", lang),
    BankName: useLiveTranslation("Bank Name", lang),
    BankAddress: useLiveTranslation("Bank Address", lang),
    SortCode: useLiveTranslation("Sort Code", lang),
    AccountNumber: useLiveTranslation("Account Number", lang),
    IBANNumber: useLiveTranslation("IBAN Number", lang),
    SWIFTCode: useLiveTranslation("SWIFT Code", lang),
    SelectStatus: useLiveTranslation("Select Status", lang),
    SelectCostCenter: useLiveTranslation("Select Cost Center", lang),
    SupplierCompanyName: useLiveTranslation("Supplier Name", lang),
    CreatedDate: useLiveTranslation("Created Time", lang),
  };
}
