import type { LoanFacility, LoanHistoryEntry, ScheduleItem } from "@/utils/constants";
import { parseHistoryJson } from "@/utils/loanHistoryDisplay";
import type { CompanyHistoryEntry, UserHistoryEntry } from "@/utils/constants";

export const API_BASE_URL = "https://as-natpower-loans-transfer-backend-uksouth.azurewebsites.net/loan-and-transfer";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

/** Parses JSON error bodies like `{"code":400,"message":"…","data":null}`. */
async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(trimmed) as {
        message?: unknown;
        Message?: unknown;
        error?: unknown;
      };
      const msg = parsed.message ?? parsed.Message;
      if (typeof msg === "string" && msg.trim()) {
        return msg.trim();
      }
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error.trim();
      }
    } catch {
      if (trimmed.length <= 280) {
        return trimmed;
      }
    }
  } catch {
    /* ignore body read failure */
  }
  return fallback;
}

/** When HTTP is OK but the envelope reports a client/server error code. */
function throwIfApiEnvelopeError<T>(result: ApiEnvelope<T> | null | undefined, fallback: string): void {
  if (result == null || typeof result !== "object") {
    return;
  }
  const code = result.code;
  if (typeof code === "number" && code >= 400) {
    const msg =
      typeof result.message === "string" && result.message.trim()
        ? result.message.trim()
        : fallback;
    throw new Error(msg);
  }
}

function parseCompanyBankAccountId(account: unknown): number {
  if (account === null || typeof account !== "object") {
    return 0;
  }
  const a = account as Record<string, unknown>;
  const raw =
    a.id ??
    a.Id ??
    a.accountId ??
    a.AccountId ??
    a.bankAccountId ??
    a.BankAccountId;
  if (raw === null || raw === undefined || raw === "") {
    return 0;
  }
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

type SsoLoginResponse = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  country?: string;
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
};

type CreateLoanFacilitySchedulePayload = {
  rowIndex?: number;
  startDate: string;
  endDate: string;
  lenderBankAccount: string;
  borrowerBankAccount: string;
  annualInterestRatePct: number;
  drawDown: number;
  repayment: number;
  fees: number;
};

type CreateLoanFacilityPayload = {
  name: string;
  lenderCompanyId: number;
  borrowerCompanyId: number;
  agreementDate: string;
  currency: LoanFacility["currency"];
  annualInterestRate: number;
  daysInYear: number;
  status: LoanFacility["status"];
};

type UpdateLoanFacilityPayload = CreateLoanFacilityPayload;
type CompanyApiItem = {
  id: string | number;
  name: string;
  sapCode?: string;
  sap_code?: string;
  code?: string;
  type?: string;
  country?: string;
  bankAccounts?:
    | Array<
        string | { id?: number; accountName?: string; account_name?: string; rowIndex?: number; row_index?: number }
      >
    | string;
  bank_accounts?:
    | Array<
        string | { id?: number; accountName?: string; account_name?: string; rowIndex?: number; row_index?: number }
      >
    | string;
};

type CompanyHistoryApiItem = {
  id?: number | string;
  eventType?: string;
  eventTimestamp?: string;
  performedBy?: string;
  summary?: string;
  beforeJson?: string | null;
  afterJson?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  entityId?: number | string | null;
  entity_id?: number | string | null;
  companyName?: string;
  company_name?: string;
  details?: string;
  action?: string;
  timestamp?: string;
  userName?: string;
};

type CreateCompanyPayload = {
  id: number;
  name: string;
  code: string;
  type: string;
  country: string;
  bankAccounts: Array<{
    id: number;
    accountName: string;
    rowIndex: number;
  }>;
};
type UpdateCompanyPayload = CreateCompanyPayload;
type CountryApiItem = {
  id?: number | string;
  name?: string;
  code?: string;
  countryCode?: string;
  country_code?: string;
};
type CountryPayload = {
  name: string;
  code: string;
};
type UserApiItem = {
  id?: number | string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
  role?: string;
  country?: string;
};
type UserHistoryApiItem = {
  id?: number | string;
  eventType?: string;
  eventTimestamp?: string;
  performedBy?: string;
  summary?: string;
  beforeJson?: string | null;
  afterJson?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  entityId?: number | string | null;
  entity_id?: number | string | null;
  userName?: string;
  user_name?: string;
  details?: string;
  action?: string;
  timestamp?: string;
};
type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
};
type UpdateUserPayload = {
  id: number;
} & CreateUserPayload;
type CountrySummaryReportItem = {
  country?: string;
  cumulativeInterest?: number;
  cumulative_interest?: number;
  cumulativePrincipal?: number;
  cumulative_principal?: number;
  total?: number;
};
type CountrySummaryLoanReportItem = {
  country?: string;
  loanFacility?: string;
  loan_facility?: string;
  lender?: string;
  borrower?: string;
  cumulativePrincipal?: number;
  cumulative_principal?: number;
  cumulativeInterest?: number;
  cumulative_interest?: number;
  total?: number;
};

export const ssoLogin = async (idToken: string): Promise<ApiEnvelope<SsoLoginResponse>> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/sso-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": idToken,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `SSO login failed (${response.status})`));
  }

  return response.json();
};

export const getLoanFacilities = async (poAccessToken: string): Promise<LoanFacility[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/loan-facilities`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to fetch loan facilities (${response.status})`),
    );
  }

  const result = (await response.json()) as ApiEnvelope<any[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch loan facilities (${response.status})`);
  const rawLoans = Array.isArray(result?.data) ? result.data : [];

  return rawLoans.map((loan: any, index: number) => {
    const status =
      loan?.status === "Active" || loan?.status === "Closed" || loan?.status === "Archived"
        ? loan.status
        : "Active";

    return {
      id: String(loan?.id ?? loan?.loanFacilityId ?? index + 1),
      name: String(loan?.name ?? loan?.facilityName ?? `Loan Facility ${index + 1}`),
      status,
      startDate: String(loan?.startDate ?? loan?.start_date ?? ""),
      closeDate: String(loan?.closeDate ?? loan?.close_date ?? ""),
      lenderCompanyId: String(loan?.lenderCompanyId ?? loan?.lender_company_id ?? ""),
      borrowerCompanyId: String(loan?.borrowerCompanyId ?? loan?.borrower_company_id ?? ""),
      agreementDate: String(loan?.agreementDate ?? loan?.agreement_date ?? ""),
      currency: (loan?.currency ?? "EUR") as LoanFacility["currency"],
      annualInterestRate: Number(loan?.annualInterestRate ?? loan?.annual_interest_rate ?? 0),
      daysInYear: Number(loan?.daysInYear ?? loan?.days_in_year ?? 365),
      schedule: Array.isArray(loan?.schedule) ? loan.schedule : [],
      history: Array.isArray(loan?.history) ? loan.history : [],
      createdAt: String(loan?.createdAt ?? loan?.created_at ?? new Date().toISOString()),
      updatedAt: String(loan?.updatedAt ?? loan?.updated_at ?? new Date().toISOString()),
    } as LoanFacility;
  });
};

export const getLoanFacilitySchedule = async (
  poAccessToken: string,
  loanFacilityId: string,
): Promise<ScheduleItem[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/schedule`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": poAccessToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch loan facility schedule (${response.status})`);
  }

  const result = (await response.json()) as ApiEnvelope<any[]>;
  const rawSchedule = Array.isArray(result?.data) ? result.data : [];

  return rawSchedule.map((row: any, index: number) => ({
    id: String(row?.id ?? row?.scheduleId ?? index + 1),
    rowIndex: Number(row?.rowIndex ?? row?.row_index ?? index + 1),
    startDate: String(row?.startDate ?? row?.start_date ?? ""),
    endDate: String(row?.endDate ?? row?.end_date ?? ""),
    lenderBankAccount: String(row?.lenderBankAccount ?? row?.lender_bank_account ?? ""),
    borrowerBankAccount: String(row?.borrowerBankAccount ?? row?.borrower_bank_account ?? ""),
    annualInterestRate: Number(
      row?.annualInterestRate ??
        row?.annualInterestRatePct ??
        row?.annual_interest_rate ??
        row?.annual_interest_rate_pct ??
        0,
    ),
    annualInterestRatePct: Number(
      row?.annualInterestRatePct ??
        row?.annualInterestRate ??
        row?.annual_interest_rate_pct ??
        row?.annual_interest_rate ??
        0,
    ),
    days: Number(row?.days ?? 0),
    drawDown: Number(row?.drawDown ?? row?.draw_down ?? 0),
    repayment: Number(row?.repayment ?? 0),
    principal: Number(row?.principal ?? 0),
    cumulativePrincipal: Number(row?.cumulativePrincipal ?? row?.cumulative_principal ?? 0),
    interest: Number(row?.interest ?? 0),
    cumulativeInterest: Number(row?.cumulativeInterest ?? row?.cumulative_interest ?? 0),
    total: Number(row?.total ?? 0),
    fees: Number(row?.fees ?? 0),
    updatedAt: String(row?.updatedAt ?? row?.updated_at ?? new Date().toISOString()),
  }));
};

export const getLoanFacilityHistory = async (
  poAccessToken: string,
  loanFacilityId: string,
): Promise<LoanHistoryEntry[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/history`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": poAccessToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to fetch loan facility history (${response.status})`),
    );
  }

  const result = (await response.json()) as ApiEnvelope<any[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch loan facility history (${response.status})`);
  const rawHistory = Array.isArray(result?.data) ? result.data : [];

  return rawHistory.map((entry: any, index: number) => ({
    id: String(entry?.id ?? index + 1),
    timestamp: String(
      entry?.eventTimestamp ?? entry?.timestamp ?? entry?.createdAt ?? entry?.created_at ?? "",
    ),
    userId: String(entry?.performedBy ?? entry?.userId ?? entry?.user_id ?? ""),
    userName: String(
      entry?.performedBy ?? entry?.userName ?? entry?.user_name ?? entry?.updatedBy ?? "System",
    ),
    action: String(entry?.eventType ?? entry?.action ?? "update").toUpperCase(),
    details: String(entry?.summary ?? entry?.details ?? ""),
    entityType:
      entry?.entityType != null || entry?.entity_type != null
        ? String(entry?.entityType ?? entry?.entity_type)
        : undefined,
    entityId:
      entry?.entityId != null || entry?.entity_id != null
        ? String(entry?.entityId ?? entry?.entity_id)
        : undefined,
    beforeSnapshot: parseHistoryJson(entry?.beforeJson ?? entry?.before_json),
    afterSnapshot: parseHistoryJson(entry?.afterJson ?? entry?.after_json),
  }));
};

export const createLoanFacilityScheduleRow = async (
  poAccessToken: string,
  loanFacilityId: string,
  payload: CreateLoanFacilitySchedulePayload,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/schedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": poAccessToken,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to create schedule row (${response.status})`),
    );
  }
};

export const updateLoanFacilityScheduleRow = async (
  poAccessToken: string,
  loanFacilityId: string,
  rowId: string,
  payload: CreateLoanFacilitySchedulePayload,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/schedule/${rowId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": poAccessToken,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to update schedule row (${response.status})`),
    );
  }
};

export const deleteLoanFacilityScheduleRow = async (
  poAccessToken: string,
  loanFacilityId: string,
  rowId: string,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/schedule/${rowId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": poAccessToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to delete schedule row (${response.status})`),
    );
  }
};

export const createLoanFacility = async (
  poAccessToken: string,
  payload: CreateLoanFacilityPayload,
): Promise<{ id?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/loan-facilities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to create loan facility (${response.status})`),
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {};
  }
  if (body && typeof body === "object" && "code" in body) {
    throwIfApiEnvelopeError(body as ApiEnvelope<unknown>, `Failed to create loan facility (${response.status})`);
  }
  const record = body as Record<string, unknown>;
  const createdId =
    record?.id ??
    record?.loanFacilityId ??
    record?.loan_facility_id ??
    (record?.data as Record<string, unknown> | undefined)?.id ??
    (record?.data as Record<string, unknown> | undefined)?.loanFacilityId;

  return createdId ? { id: String(createdId) } : {};
};

export const updateLoanFacility = async (
  poAccessToken: string,
  loanFacilityId: string,
  payload: UpdateLoanFacilityPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to update loan facility (${response.status})`),
    );
  }
};

export const deleteLoanFacility = async (
  poAccessToken: string,
  loanFacilityId: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to delete loan facility (${response.status})`),
    );
  }
};

export const getCompanies = async (
  poAccessToken: string,
): Promise<Array<{
  id: string;
  name: string;
  code: string;
  type: string;
  country: string;
  bankAccounts: string[] | string;
  bankAccountDetails: Array<{ id: number; accountName: string; rowIndex: number }>;
}>> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/companies`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to fetch companies (${response.status})`));
  }

  const result = (await response.json()) as ApiEnvelope<CompanyApiItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch companies (${response.status})`);
  const rawCompanies = Array.isArray(result?.data) ? result.data : [];

  return rawCompanies.map((company) => ({
    id: String(company?.id ?? ""),
    name: String(company?.name ?? ""),
    code: String(company?.code ?? company?.sapCode ?? company?.sap_code ?? ""),
    type: String(company?.type ?? ""),
    country: String(company?.country ?? ""),
    bankAccountDetails: (() => {
      const accounts = company?.bankAccounts ?? company?.bank_accounts ?? [];
      if (!Array.isArray(accounts)) {
        const single = String(accounts ?? "").trim();
        return single
          ? [{ id: 0, accountName: single, rowIndex: 1 }]
          : [];
      }
      return accounts
        .map((account, index) => {
          if (typeof account === "string") {
            return {
              id: 0,
              accountName: account.trim(),
              rowIndex: index + 1,
            };
          }
          return {
            id: parseCompanyBankAccountId(account),
            accountName: String(account?.accountName ?? account?.account_name ?? "").trim(),
            rowIndex: Number(account?.rowIndex ?? account?.row_index ?? index + 1),
          };
        })
        .filter((account) => !!account.accountName);
    })(),
    bankAccounts: (() => {
      const accounts = company?.bankAccounts ?? company?.bank_accounts ?? [];
      if (Array.isArray(accounts)) {
        return accounts
          .map((account) => {
            if (typeof account === "string") {
              return account.trim();
            }
            return String(account?.accountName ?? account?.account_name ?? "").trim();
          })
          .filter(Boolean);
      }
      return String(accounts);
    })(),
  }));
};

export const getCompaniesHistory = async (
  poAccessToken: string,
): Promise<CompanyHistoryEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/companies/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to fetch companies history (${response.status})`),
    );
  }

  const result = (await response.json()) as ApiEnvelope<CompanyHistoryApiItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch companies history (${response.status})`);
  const rows = Array.isArray(result?.data) ? result.data : [];

  return rows.map((entry, index) => {
    const rawEventType = String(entry?.eventType ?? entry?.action ?? "").toLowerCase();
    const action: CompanyHistoryEntry["action"] =
      rawEventType === "create"
        ? "ADD"
        : rawEventType === "update"
          ? "EDIT"
          : rawEventType === "delete"
            ? "DELETE"
            : "IMPORT";

    const beforeSnapshot = parseHistoryJson(entry?.beforeJson);
    const afterSnapshot = parseHistoryJson(entry?.afterJson);

    const nameFromSnapshot = afterSnapshot?.name ?? beforeSnapshot?.name;
    const parsedCompanyName = String(nameFromSnapshot ?? "").trim();

    const rawEntityId = entry?.entityId ?? entry?.entity_id;
    const entityIdStr =
      rawEntityId != null && rawEntityId !== "" ? String(rawEntityId) : null;

    const rawEntityType = entry?.entityType ?? entry?.entity_type;
    const entityTypeStr =
      rawEntityType != null && String(rawEntityType).trim() !== ""
        ? String(rawEntityType)
        : null;

    return {
      id: Number.parseInt(String(entry?.id ?? index + 1), 10) || index + 1,
      timestamp: String(entry?.eventTimestamp ?? entry?.timestamp ?? ""),
      action,
      createdBy: String(entry?.performedBy ?? entry?.userName ?? "").trim() || "System",
      companyName:
        String(entry?.companyName ?? entry?.company_name ?? "").trim() ||
        parsedCompanyName ||
        "Company",
      details: String(entry?.summary ?? entry?.details ?? ""),
      entityType: entityTypeStr,
      entityId: entityIdStr,
      beforeSnapshot,
      afterSnapshot,
    };
  });
};

export const createCompany = async (
  poAccessToken: string,
  payload: CreateCompanyPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to create company (${response.status})`));
  }
};

export const updateCompany = async (
  poAccessToken: string,
  companyId: string,
  payload: UpdateCompanyPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/companies/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to update company (${response.status})`));
  }
};

export const deleteCompany = async (
  poAccessToken: string,
  companyId: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/companies/${companyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to delete company (${response.status})`));
  }
};

export const getCountries = async (
  poAccessToken: string,
): Promise<Array<{ id: number; name: string; code: string }>> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/countries`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to fetch countries (${response.status})`));
  }

  const result = (await response.json()) as ApiEnvelope<CountryApiItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch countries (${response.status})`);
  const rawCountries = Array.isArray(result?.data) ? result.data : [];

  return rawCountries.map((country, index) => ({
    id: Number(country?.id ?? index + 1),
    name: String(country?.name ?? ""),
    code: String(country?.code ?? country?.countryCode ?? country?.country_code ?? ""),
  }));
};

export const createCountry = async (
  poAccessToken: string,
  payload: CountryPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/countries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to create country (${response.status})`));
  }
};

export const updateCountry = async (
  poAccessToken: string,
  countryId: number,
  payload: CountryPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/countries/${countryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to update country (${response.status})`));
  }
};

export const deleteCountry = async (
  poAccessToken: string,
  countryId: number,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/countries/${countryId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to delete country (${response.status})`));
  }
};

export const getUsers = async (
  poAccessToken: string,
): Promise<
  Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    country: string;
  }>
> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to fetch users (${response.status})`));
  }

  const result = (await response.json()) as ApiEnvelope<UserApiItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch users (${response.status})`);
  const rawUsers = Array.isArray(result?.data) ? result.data : [];

  return rawUsers.map((user, index) => ({
    id: String(user?.id ?? index + 1),
    firstName: String(user?.firstName ?? user?.first_name ?? ""),
    lastName: String(user?.lastName ?? user?.last_name ?? ""),
    email: String(user?.email ?? ""),
    role: String(user?.role ?? ""),
    country: String(user?.country ?? ""),
  }));
};

function userLabelFromHistorySnapshot(
  after: Record<string, unknown> | null,
  before: Record<string, unknown> | null,
): string {
  const s = after ?? before;
  if (!s) {
    return "User";
  }
  const fn = String(s.firstName ?? s.first_name ?? "").trim();
  const ln = String(s.lastName ?? s.last_name ?? "").trim();
  const em = String(s.email ?? "").trim();
  const name = [fn, ln].filter(Boolean).join(" ").trim();
  return name || em || "User";
}

export const getUsersHistory = async (
  poAccessToken: string,
): Promise<UserHistoryEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to fetch users history (${response.status})`),
    );
  }

  const result = (await response.json()) as ApiEnvelope<UserHistoryApiItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch users history (${response.status})`);
  const rows = Array.isArray(result?.data) ? result.data : [];

  return rows.map((entry, index) => {
    const rawEventType = String(entry?.eventType ?? entry?.action ?? "").toLowerCase();
    const action: UserHistoryEntry["action"] =
      rawEventType === "create"
        ? "ADD"
        : rawEventType === "update"
          ? "EDIT"
          : rawEventType === "delete"
            ? "DELETE"
            : "IMPORT";

    const beforeSnapshot = parseHistoryJson(entry?.beforeJson);
    const afterSnapshot = parseHistoryJson(entry?.afterJson);

    const userName =
      userLabelFromHistorySnapshot(afterSnapshot, beforeSnapshot) ||
      String(entry?.userName ?? entry?.user_name ?? "").trim() ||
      "User";

    const rawEntityId = entry?.entityId ?? entry?.entity_id;
    const entityIdStr =
      rawEntityId != null && rawEntityId !== "" ? String(rawEntityId) : null;

    const rawEntityType = entry?.entityType ?? entry?.entity_type;
    const entityTypeStr =
      rawEntityType != null && String(rawEntityType).trim() !== ""
        ? String(rawEntityType)
        : null;

    return {
      id: Number.parseInt(String(entry?.id ?? index + 1), 10) || index + 1,
      timestamp: String(entry?.eventTimestamp ?? entry?.timestamp ?? ""),
      action,
      performedBy: String(entry?.performedBy ?? "").trim() || "System",
      userName,
      details: String(entry?.summary ?? entry?.details ?? ""),
      entityType: entityTypeStr,
      entityId: entityIdStr,
      beforeSnapshot,
      afterSnapshot,
    };
  });
};

export const createUser = async (
  poAccessToken: string,
  payload: CreateUserPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to create user (${response.status})`));
  }
};

export const updateUser = async (
  poAccessToken: string,
  userId: string,
  payload: UpdateUserPayload,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to update user (${response.status})`));
  }
};

export const deleteUser = async (
  poAccessToken: string,
  userId: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Failed to delete user (${response.status})`));
  }
};

export const getCountrySummaryReport = async (
  poAccessToken: string,
): Promise<
  Array<{
    country: string;
    cumulativeInterest: number;
    cumulativePrincipal: number;
    total: number;
  }>
> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/country-summary`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to fetch country summary report (${response.status})`),
    );
  }

  const result = (await response.json()) as ApiEnvelope<CountrySummaryReportItem[]>;
  throwIfApiEnvelopeError(result, `Failed to fetch country summary report (${response.status})`);
  const rows = Array.isArray(result?.data) ? result.data : [];

  return rows
    .map((row) => ({
      country: String(row?.country ?? "Unknown"),
      cumulativeInterest: Number(row?.cumulativeInterest ?? row?.cumulative_interest ?? 0),
      cumulativePrincipal: Number(row?.cumulativePrincipal ?? row?.cumulative_principal ?? 0),
      total: Number(row?.total ?? 0),
    }))
    .sort((first, second) => first.country.localeCompare(second.country));
};

export const getCountrySummaryLoansReport = async (
  poAccessToken: string,
): Promise<
  Array<{
    country: string;
    loanFacility: string;
    lender: string;
    borrower: string;
    cumulativePrincipal: number;
    cumulativeInterest: number;
    total: number;
  }>
> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/country-summary/loans`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": poAccessToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        `Failed to fetch country loan summary report (${response.status})`,
      ),
    );
  }

  const result = (await response.json()) as ApiEnvelope<CountrySummaryLoanReportItem[]>;
  throwIfApiEnvelopeError(
    result,
    `Failed to fetch country loan summary report (${response.status})`,
  );
  const rows = Array.isArray(result?.data) ? result.data : [];

  return rows
    .map((row) => ({
      country: String(row?.country ?? "Unknown"),
      loanFacility: String(row?.loanFacility ?? row?.loan_facility ?? "-"),
      lender: String(row?.lender ?? "-"),
      borrower: String(row?.borrower ?? "-"),
      cumulativePrincipal: Number(row?.cumulativePrincipal ?? row?.cumulative_principal ?? 0),
      cumulativeInterest: Number(row?.cumulativeInterest ?? row?.cumulative_interest ?? 0),
      total: Number(row?.total ?? 0),
    }))
    .sort((first, second) => {
      if (first.country === second.country) {
        return first.loanFacility.localeCompare(second.loanFacility);
      }
      return first.country.localeCompare(second.country);
    });
};

export const importLoanFacilitySchedule = async (
  poAccessToken: string,
  loanFacilityId: string,
  file: File,
  mode?: "overwrite" | "extend",
): Promise<void> => {
  const endpoint = new URL(
    `${API_BASE_URL}/api/v1/loan-facilities/${loanFacilityId}/schedule/import`,
  );
  if (mode) {
    endpoint.searchParams.set("mode", mode);
  }

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "X-Access-Token": poAccessToken,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, `Failed to import schedule file (${response.status})`),
    );
  }
};
