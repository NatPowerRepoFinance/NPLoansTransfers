import type { LoanFacility } from "@/utils/constants";

export const API_BASE_URL = "https://as-natpower-loans-transfer-backend-uksouth.azurewebsites.net/loan-and-transfer";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type SsoLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
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
    throw new Error(`Failed to fetch loan facilities (${response.status})`);
  }

  const result = (await response.json()) as ApiEnvelope<any[]>;
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
