export type Option = {
  label: string;
  value: string;
  email?: string;
};

export interface OrderLineItem {
  product_id: number;
  product_qty: number;
  price_unit: number;
}

export interface PurchaseOrderPayload {
  project_id: number;
  project_code?: any;
  npower_contact_id: number;
  contact_email: string;
  company_id: number;
  cost_center_code?: string;
  partner_id?: number;
  tax_rate?: number;
  delivery_address: any;
  date_planned?: string;
  payment_terms?: number;
  order_description?: string;
  early_payment_discount?: number;
  late_payment_penalities?: number;
  with_holding_tax?: boolean;
  with_holding_tax_rate?: number;
  vendor_contact_name: string;
  delivery_instructions?: string;
  order_line?: any;
  [key: string]: any;
  po_change_log?: {
    Date: string;
    User: string;
    Action: string;
  };
}

export interface SupplierRequestPayload {
  supplierNewId?: number,
  supplierSapId: string;
  supplierCompanyName: string;
  supplierCompanyAddress: string;
  country_id: number;
  supplierCompanyRegisteredId: string;
  supplierVatNumber: string;
  supplierWebsite: string;
  supplierPhoneNumber: string;
  invoiceAddress: string;
  invoiceCompanyAddressSame: boolean;
  invoiceSubmissionEmail: string;
  invoiceSubmissionPortalWebsite: string;
  financeInvoiceQueryContactName: string;
  financeInvoiceQueryEmailAddress: string;
  financeInvoiceQueryPhoneNumber: string;
  bankName: string;
  bankAddress: string;
  sortCode: string;
  accountNumber: string;
  isInternational: boolean;
  ibanNo: string;
  swiftBic: string;
  requestedBy?: number;
  status_code: number;
  reason?: string;
  createdBy: number;
}

export interface PoUpdatePayload {
  state?: string;
  date_planned?: string;
  order_description?: string;
  delivery_instructions?: string;
  internal_comments?: string;
  notes_to_supplier?: string;
  vendor_contact_name?: string;
  order_line?: any;
  [key: string]: any;
  po_change_log?: {
    Date: string;
    User: string;
    Action: string;
  };
}



export interface Risk {
    riskId: number;
    projectId: string;
    pdaId: string;
    createdDate: string;
    modifiedDate: string;
    createdBy: string;
    modifiedBy: string;
    type: string;
    category: string;
    title: string;
    date: string;
    status: string;
    assignedTo: string;
    description: string;
    consequence: string;
    externalRecommendation: string;
    likelihood: number;
    impact: number;
    score: number;
    mitigationDescription: string;
    postMitigationLikelihood: number;
    postMitigationImpact: number;
    postMitigationScore: number;
    postMitigationStatus: string;
}

export interface OrderLineItem {
    product_id: number;
    product_qty: number;
    price_unit: number;
}

export interface RiskPayload {
    project_id: number | string;
    pda_id?: number | undefined | null;
    risk_type: string | number;
    risk_category: string | number;
    title: string;
    risk_status: string | number;
    assigned_to: number | string;
    description: string;
    consequence: string | null;
    external_recommendation: string | null;
    likelihood: number;
    impact: number;
    score: number;
    mitigation_description: string;
    post_mitigation_likelihood: number;
    post_mitigation_impact: number;
    post_mitigation_score: number;
    post_mitigation_status: string | null;
    risk_closure_reason?: string;
}
