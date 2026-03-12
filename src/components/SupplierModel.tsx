import React, { useEffect, useRef, useState } from "react";
import { createSupplierRequest, updateSupplierRequest } from "@/lib/api";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalTrigger,
  CloseIcon,
} from "@/components/animated-modal";
import {
  Field,
  Fieldset,
  Input,
  Label,
  Select,
  Textarea,
} from "@headlessui/react";
import { toast } from "react-toastify";
import { SupplierRequestPayload } from "@/lib/types";
import {
  requestRoleStatusAccess,
  getUserRole,
  statusRequestMap,
  useFormPlaceholders,
  getUserId,
  getUserFullName,
  statusCodeRequestMap,
} from "@/lib/utils";
import { TransText } from "@/components/TransText";
import { useAuth } from "@/lib/authProvider";
import usePromptDialog from "./promptDialog";
import { useErpIframe } from "@/lib/erpIframeContext";

export default function ServiceModal({
  children,
  params,
  onClick,
  mode,
  onSuccess,
}: {
  children: React.ReactNode;
  params?: any;
  onClick: () => void;
  mode?: "create" | "edit";
  onSuccess: () => void;
}) {
  const { lang } = useAuth();
  const { erpIframe } = useErpIframe();
  const placeholders = useFormPlaceholders();
  const role = getUserRole() || "User";
  const userId = getUserId() || 1;
  const fullname = getUserFullName();
  const accessibleStatuses = requestRoleStatusAccess[role] || [];
  const isCreateMode = mode === "create";
  const isSuperAdmin = role === "Super Admin";
  const isManagementGroup = role === "Management Approval Group";
  const isFinanceGroup = role === "Finance Approval Group";
  const isUser = role === "User";

  const [supplierName, setSupplierName] = useState<string>("");
  const [supplierCompanyRegisteredId, setSupplierCompanyRegisteredId] =
    useState<string>("");
  const [supplierNewId, setSupplierNewId] = useState<number>(0);
  const [supplierVatNumber, setSupplierVatNumber] = useState<string>("");
  const [supplierWebsite, setSupplierWebsite] = useState<string>("");
  const [supplierPhoneNumber, setSupplierPhoneNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("PENDING");

  const [bankName, setBankName] = useState<string>("");
  const [bankAddress, setBankAddress] = useState<string>("");
  const [sortCode, setSortCode] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ibanNo, setIbanNo] = useState<string>("");
  const [swiftBic, setSwiftBic] = useState<string>("");
  const [supplierCompanyRegisteredAddress, setSupplierCompanyAddress] =
    useState<string>("");
  const [invoiceAddress, setInvoiceAddress] = useState<string>("");
  const [invoiceSameAsCompany, setInvoiceSameAsCompany] = useState(false);
  const [invoiceSubmissionEmailAddress, setInvoiceSubmissionEmailAddress] =
    useState<string>("");
  const [invoiceSubmissionPortalWebsite, setInvoiceSubmissionPortalWebsite] =
    useState<string>("");
  const [financeInvoiceQueryContactName, setFinanceInvoiceQueryContactName] =
    useState<string>("");
  const [financeInvoiceQueryEmailAddress, setFinanceInvoiceQueryEmailAddress] =
    useState<string>("");
  const [financeInvoiceQueryPhoneNumber, setFinanceInvoiceQueryPhoneNumber] =
    useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [supplierSapId, setSupplierSapId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { dialog: promptDialog } = usePromptDialog();

  const formRef = useRef<HTMLFormElement>(null);

  //   const originalLineItemsRef = useRef<any[]>([]);

  //   const isFirstRun = useRef(true);

  const resetForm = () => {
    setInvoiceAddress("");
    setSortCode("");
    setAccountNumber("");
    setIbanNo("");
    setSwiftBic("");
    setStatus("PENDING");
    setSupplierName("");
    setSupplierCompanyAddress("");
    setBankName("");
    setBankAddress("");
    setSupplierCompanyRegisteredId("");
    setSupplierVatNumber("");
    setSupplierWebsite("");
    setSupplierPhoneNumber("");
    setInvoiceSameAsCompany(false);
    setInvoiceSubmissionEmailAddress("");
    setInvoiceSubmissionPortalWebsite("");
    setFinanceInvoiceQueryContactName("");
    setFinanceInvoiceQueryEmailAddress("");
    setFinanceInvoiceQueryPhoneNumber("");
    setReason("");
    setSupplierSapId("");
  };

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const closeModal = () => {
    closeButtonRef.current?.click();
  };

  //   const uploadLabel = normalMode ? "Upload Quote (PDF):" : "SAP Upload (PDF):";

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreateMode) {
        const poPayload: SupplierRequestPayload = {
          supplierSapId: supplierSapId,
          isInternational: false,
          createdBy: userId,
          supplierCompanyName: supplierName,
          country_id: 231,
          supplierCompanyRegisteredId: supplierCompanyRegisteredId,
          supplierVatNumber: supplierVatNumber,
          accountNumber: accountNumber,
          bankName: bankName,
          bankAddress: bankAddress,
          sortCode: sortCode,
          ibanNo: ibanNo,
          swiftBic: swiftBic,
          supplierWebsite: supplierWebsite,
          supplierPhoneNumber: supplierPhoneNumber,
          supplierCompanyAddress: supplierCompanyRegisteredAddress,
          invoiceAddress: invoiceAddress,
          invoiceCompanyAddressSame: invoiceSameAsCompany,
          invoiceSubmissionEmail: invoiceSubmissionEmailAddress,
          invoiceSubmissionPortalWebsite: invoiceSubmissionPortalWebsite,
          financeInvoiceQueryContactName: financeInvoiceQueryContactName,
          financeInvoiceQueryEmailAddress: financeInvoiceQueryEmailAddress,
          financeInvoiceQueryPhoneNumber: financeInvoiceQueryPhoneNumber,
          requestedBy: userId,
          status_code: 1,
        };
        console.log("Create Payload", poPayload);
        await createSupplierRequest(poPayload);
        toast.success("Supplier Created Successfully!");

        resetForm();
        onSuccess();
        setTimeout(() => {
          closeModal();
        }, 500);
      } else {
        const poPayload: Partial<SupplierRequestPayload> = {
          supplierNewId: supplierNewId,
          supplierSapId: supplierSapId,
          isInternational: false,
          supplierCompanyName: supplierName,
          supplierCompanyRegisteredId: supplierCompanyRegisteredId,
          supplierVatNumber: supplierVatNumber,
          accountNumber: accountNumber,
          bankName: bankName,
          bankAddress: bankAddress,
          sortCode: sortCode,
          ibanNo: ibanNo,
          swiftBic: swiftBic,
          supplierWebsite: supplierWebsite,
          supplierPhoneNumber: supplierPhoneNumber,
          supplierCompanyAddress: supplierCompanyRegisteredAddress,
          invoiceAddress: invoiceAddress,
          invoiceCompanyAddressSame: invoiceSameAsCompany,
          invoiceSubmissionEmail: invoiceSubmissionEmailAddress,
          invoiceSubmissionPortalWebsite: invoiceSubmissionPortalWebsite,
          financeInvoiceQueryContactName: financeInvoiceQueryContactName,
          financeInvoiceQueryEmailAddress: financeInvoiceQueryEmailAddress,
          financeInvoiceQueryPhoneNumber: financeInvoiceQueryPhoneNumber,
          reason: reason,
          status_code: statusCodeRequestMap[status],
        };
        await updateSupplierRequest(poPayload);
        toast.success("Supplier Request Updated Successfully!");
        onSuccess();
        resetForm();
        setTimeout(() => {
          closeModal();
        }, 500);
      }
    } catch (error: any) {
      toast.error(`Submission failed`);
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (invoiceSameAsCompany) {
      setInvoiceAddress(supplierCompanyRegisteredAddress);
    }
  }, [invoiceSameAsCompany, supplierCompanyRegisteredAddress]);

  useEffect(() => {
    if (isCreateMode || !params) return;
    if (!isCreateMode && params) {
      const d = params;
      setSupplierNewId(d.supplierNewId || -1);
      setSupplierName(d.supplierCompanyName || "");
      setAccountNumber(d.accountNumber || "");
      setBankName(d.bankName || "");
      setBankAddress(d.bankAddress || "");
      setSortCode(d.sortCode || "");
      setIbanNo(d.ibanNo || "");
      setSwiftBic(d.swiftBic || "");
      setSupplierCompanyRegisteredId(d.supplierCompanyRegisteredId || "");
      setSupplierVatNumber(d.supplierVatNumber || "");
      setSupplierCompanyAddress(d.supplierCompanyAddress || "");
      setInvoiceAddress(d.invoiceAddress || "");
      setInvoiceSameAsCompany(Boolean(d.invoiceCompanyAddressSame || false));
      setInvoiceSubmissionEmailAddress(d.invoiceSubmissionEmail || "");
      setInvoiceSubmissionPortalWebsite(d.invoiceSubmissionPortalWebsite || "");
      setStatus(d.statusName.toLowerCase() || "pending");
      setSupplierWebsite(d.supplierWebsite || "");
      setSupplierPhoneNumber(d.supplierPhoneNumber || "");
      setReason(d.reason || "");
      setFinanceInvoiceQueryContactName(d.financeInvoiceQueryContactName || "");
      setFinanceInvoiceQueryEmailAddress(
        d.financeInvoiceQueryEmailAddress || ""
      );
      setReason(d.reason || "");
      setFinanceInvoiceQueryPhoneNumber(d.financeInvoiceQueryPhoneNumber || "");
      setSupplierSapId(d.supplierSapId || "");
    }
  }, [isCreateMode, params]);

  return (
    <Modal>
      <ModalTrigger
        onClick={onClick}
        // onOpenChange={(isOpen) => setShouldFetch(isOpen)}
        className={`${"border-none shadow-none hover:shadow-none active:shadow-none"} active:bg-gray-50`}
      >
        {children}
      </ModalTrigger>
      <ModalBody>
        <form ref={formRef}>
          <ModalContent>
            <Fieldset className="space-y-6 p-6">
              {/* Header Section */}
              <div className={`flex flex-col sm:flex-row justify-between items-center border-b-[1px] ${erpIframe ? "text-white border-[#3a3f4b]" : "text-black border-[#E5E7EB]"}`}>
                <div className="text-2xl font-semibold">
                  <TransText text="New Supplier Request: " lang={lang} />{" "}
                  {params?.supplier_name}
                </div>
                <div className="flex items-center gap-4">
                  {(isUser ||
                    isManagementGroup ||
                    isFinanceGroup ||
                    !params?.isManagerMode) &&
                    !isCreateMode && (
                      <>
                        {params?.statusName?.toLowerCase() === "completed" && (
                          <div className="text-green-500 text-sm mt-4 text-center">
                            {/* {"It has been completed"} */}
                            {
                              <TransText
                                text="It has been completed"
                                lang={lang}
                              />
                            }
                          </div>
                        )}
                        {params?.statusName?.toLowerCase() === "cancelled" && (
                          <div className="text-red-500 text-sm mt-4 text-center">
                            <TransText
                              text="This Request has been cancelled"
                              lang={lang}
                            />
                          </div>
                        )}
                        {params?.statusName?.toLowerCase() ===
                          "not approved" && (
                          <div className="text-yellow-500 text-sm mt-4 text-center">
                            <TransText
                              text="This Request has not approved"
                              lang={lang}
                            />
                          </div>
                        )}
                        {params?.statusName?.toLowerCase() ===
                          "already on system" && (
                          <div className="text-yellow-500 text-sm mt-4 text-center">
                            <TransText
                              text="This Request has already in the system"
                              lang={lang}
                            />
                          </div>
                        )}
                      </>
                    )}

                  {isSuperAdmin && !isCreateMode && (
                    <Field>
                      <Label className={`inline text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"} mr-3`}>
                        <TransText text="Status" lang={lang} />:
                      </Label>
                      <Select
                        className={`mt-1 pl-2 py-1.5 border-2 rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20 w-40 ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"}`}
                        name="Status"
                        onChange={(e) => setStatus(e.target.value)}
                        value={status}
                      >
                        <option className="text-[#6C737F]" value="">
                          {/* <TransText text="Select Status" lang={lang} /> */}
                          {placeholders.SelectStatus}
                        </option>
                        {accessibleStatuses.map((value) => (
                          <option key={value} value={value}>
                            {
                              <TransText
                                text={statusRequestMap[value]}
                                lang={lang}
                              />
                            }
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                  {(status === "not approved" || status === "cancelled") && (
                    <Field>
                      <Input
                        name="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                        placeholder={placeholders.reason}
                        title="Enter reason for rejection or cancellation"
                        aria-label="reason"
                        required
                      />
                    </Field>
                  )}

                  <div className="flex gap-3 items-center">
                    {(isCreateMode || status === "pending" || isSuperAdmin) && (
                      <button
                        type="submit"
                        disabled={saving}
                        onClick={() => {
                          if (!formRef.current?.checkValidity()) {
                            formRef.current?.reportValidity();
                            return;
                          }
                          handleSave();
                        }}
                        className={`px-5 py-2.5 text-base font-medium rounded-lg hover:opacity-90 hover:shadow-md focus:shadow-md active:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-0 disabled:opacity-50 ${erpIframe ? "text-white bg-emerald-600 border border-emerald-600 active:bg-emerald-700" : "text-white bg-[#1D2636] border border-[#1D2636] active:bg-white active:text-black"}`}
                      >
                        {saving ? (
                          <TransText text="Saving..." lang={lang} />
                        ) : (
                          <TransText text="Save Request" lang={lang} />
                        )}
                      </button>
                    )}

                    <div
                      onClick={() => {
                        if (isCreateMode) resetForm();
                        if (!isCreateMode) {
                          const d = params;
                          console.log("dparam", d);
                          setSupplierName(d.supplierCompanyName || "");
                          setAccountNumber(d.accountNumber || "");
                          setBankName(d.bankName || "");
                          setBankAddress(d.bankAddress || "");
                          setSortCode(d.sortCode || "");
                          setIbanNo(d.ibanNo || "");
                          setSwiftBic(d.swiftBic || "");
                          setSupplierCompanyRegisteredId(
                            d.supplierCompanyRegisteredId || ""
                          );
                          setSupplierVatNumber(d.supplierVatNumber || "");
                          setSupplierCompanyAddress(
                            d.supplierCompanyAddress || ""
                          );
                          setInvoiceAddress(d.invoiceAddress || "");
                          setInvoiceSameAsCompany(
                            Boolean(d.invoiceCompanyAddressSame || false)
                          );
                          setInvoiceSubmissionEmailAddress(
                            d.invoiceSubmissionEmail || ""
                          );
                          setInvoiceSubmissionPortalWebsite(
                            d.invoiceSubmissionPortalWebsite || ""
                          );
                          setStatus(d.statusName.toLowerCase() || "pending");
                          setSupplierWebsite(d.supplierWebsite || "");
                          setSupplierPhoneNumber(d.supplierPhoneNumber || "");
                          setReason(d.reason || "");
                          setFinanceInvoiceQueryContactName(
                            d.financeInvoiceQueryContactName || ""
                          );
                          setFinanceInvoiceQueryEmailAddress(
                            d.financeInvoiceQueryEmailAddress || ""
                          );
                          setFinanceInvoiceQueryPhoneNumber(
                            d.financeInvoiceQueryPhoneNumber || ""
                          );
                          setSupplierSapId(d.supplierSapId || "");
                        }
                      }}
                      className={`cursor-pointer p-2 rounded-full ${erpIframe ? "hover:bg-[#3a3f4b]" : "hover:bg-gray-100"}`}
                    >
                      <CloseIcon ref={closeButtonRef} />
                      {promptDialog}
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="flex flex-row gap-4">
                <Field className={"flex-1"}>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Supplier Sap ID *:" lang={lang} />
                  </Label>
                  <Input
                    type="number"
                    name="SupplierSapId"
                    value={supplierSapId}
                    onChange={(e) => setSupplierSapId(e.target.value)}
                    aria-placeholder="Enter Supplier SapId"
                    aria-label="supplierSapId"
                    className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                    required
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field className={"flex-1"}>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Created By:" lang={lang} />
                  </Label>
                  <Input
                    type="text"
                    name="createdBy"
                    value={params?.createdByName || fullname}
                    readOnly
                    aria-placeholder="Created By"
                    aria-label="createdBy"
                    className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                  />
                </Field>
                <Field className={"flex-1"}>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Created Date:" lang={lang} />
                  </Label>
                  <Input
                    type="date"
                    name="createdDate"
                    value={
                      params?.createdTime?.split("T")[0] ||
                      new Date().toISOString().split("T")[0]
                    }
                    readOnly
                    aria-placeholder="Created Date"
                    aria-label="createdDate"
                    className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                  />
                </Field>
              </div> */}
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* First Column */}

                <div className={`flex flex-col gap-3 ${erpIframe ? "bg-[#2a3441]" : "bg-gray-50"} p-2 rounded-lg`}>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText text="Supplier Company Name *:" lang={lang} />
                    </Label>
                    <Input
                      type="text"
                      name="supplierName"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      aria-placeholder="Supplier Company Name"
                      aria-label="supplierName"
                      className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>

                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Supplier Company Registered ID *:"
                        lang={lang}
                      />
                    </Label>
                    <Input
                      type="text"
                      name="supplierCompanyRegisteredID"
                      value={supplierCompanyRegisteredId}
                      onChange={(e) =>
                        setSupplierCompanyRegisteredId(e.target.value)
                      }
                      aria-placeholder="Supplier Company Registered ID"
                      aria-label="supplierCompanyRegisteredID"
                      className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText text="Supplier VAT Number *:" lang={lang} />
                    </Label>
                    <Input
                      type="text"
                      name="supplierVatNumber"
                      value={supplierVatNumber}
                      onChange={(e) => setSupplierVatNumber(e.target.value)}
                      aria-placeholder="Supplier VAT Number"
                      aria-label="supplierVatNumber"
                      className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText text="Supplier Website *:" lang={lang} />
                    </Label>
                    <Input
                      type="url"
                      name="supplierWebsite"
                      placeholder="https://www.example.com"
                      value={supplierWebsite}
                      onChange={(e) => setSupplierWebsite(e.target.value)}
                      aria-placeholder="Supplier Website"
                      aria-label="supplierWebsite"
                      className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText text="Supplier Phone Number *:" lang={lang} />
                    </Label>
                    <Input
                      type="tel"
                      name="supplierPhoneNumber"
                      value={supplierPhoneNumber}
                      onChange={(e) => setSupplierPhoneNumber(e.target.value)}
                      aria-placeholder="Supplier Phone Number"
                      aria-label="supplierPhoneNumber"
                      pattern="^\+?[0-9]{7,15}$"
                      title="Please enter a valid phone number (with optional + and 7–15 digits)"
                      className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                </div>

                {/* Second Column */}
                <div className={`flex flex-col gap-3 ${erpIframe ? "bg-[#2a3441]" : "bg-gray-50"} p-2 rounded-lg`}>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Supplier Company Registered Address *:"
                        lang={lang}
                      />
                    </Label>
                    <Textarea
                      name="supplierCompanyRegisteredAddress"
                      value={supplierCompanyRegisteredAddress}
                      onChange={(e) =>
                        setSupplierCompanyAddress(e.target.value)
                      }
                      rows={4}
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      placeholder={
                        placeholders.EnterSupplierCompanyRegisteredAddress
                      }
                      required
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>

                  {/* Checkbox goes here */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="sameAddress"
                      checked={invoiceSameAsCompany}
                      onChange={(e) =>
                        setInvoiceSameAsCompany(e.target.checked)
                      }
                      className="accent-[#1D2636] h-4 w-4"
                      disabled={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                    <label
                      htmlFor="sameAddress"
                      className={`text-base ${erpIframe ? "text-white" : "text-[#1D2636]"}`}
                    >
                      <TransText
                        text="Invoice Address Same as Company Address"
                        lang={lang}
                      />
                    </label>
                  </div>

                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText text="Invoice Address:" lang={lang} />
                    </Label>
                    <Textarea
                      name="invoiceAddress"
                      value={invoiceAddress}
                      onChange={(e) => setInvoiceAddress(e.target.value)}
                      rows={4}
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      placeholder={placeholders.EnterInvoiceAddress}
                      disabled={invoiceSameAsCompany}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                </div>

                {/* Third Column */}
                <div className={`flex flex-col gap-3 ${erpIframe ? "bg-[#2a3441]" : "bg-gray-50"} p-2 rounded-lg`}>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Invoice Submission Email Address:"
                        lang={lang}
                      />
                    </Label>
                    <input
                      type="email"
                      name="supplierCompanyRegisteredAddress"
                      value={invoiceSubmissionEmailAddress}
                      onChange={(e) =>
                        setInvoiceSubmissionEmailAddress(e.target.value)
                      }
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                      pattern="^[^@\s]+@[^@\s]+\.[^@\s]{2,}$"
                      title="Please enter a valid email Address (with format user@example.com)"
                    />
                  </Field>

                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Invoice Submission Portal Website:"
                        lang={lang}
                      />
                    </Label>
                    <input
                      type="url"
                      name="supplierCompanyRegisteredAddress"
                      placeholder="https://www.example.com"
                      value={invoiceSubmissionPortalWebsite}
                      onChange={(e) =>
                        setInvoiceSubmissionPortalWebsite(e.target.value)
                      }
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Supplier Invoice Query Contact Name:"
                        lang={lang}
                      />
                    </Label>
                    <input
                      type="text"
                      name="financeInvoiceQueryContactName"
                      value={financeInvoiceQueryContactName}
                      onChange={(e) =>
                        setFinanceInvoiceQueryContactName(e.target.value)
                      }
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Supplier Invoice Query Email Address:"
                        lang={lang}
                      />
                    </Label>
                    <input
                      type="email"
                      name="financeInvoiceQueryEmailAddress"
                      value={financeInvoiceQueryEmailAddress}
                      onChange={(e) =>
                        setFinanceInvoiceQueryEmailAddress(e.target.value)
                      }
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                      pattern="^[^@\s]+@[^@\s]+\.[^@\s]{2,}$"
                      title="Please enter a valid email Address (with format user@example.com)"
                    />
                  </Field>
                  <Field>
                    <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                      <TransText
                        text="Supplier Invoice Query Phone Number:"
                        lang={lang}
                      />
                    </Label>
                    <input
                      type="tel"
                      name="financeInvoiceQueryPhoneNumber"
                      value={financeInvoiceQueryPhoneNumber}
                      onChange={(e) =>
                        setFinanceInvoiceQueryPhoneNumber(e.target.value)
                      }
                      pattern="^\+?[0-9]{7,15}$"
                      title="Please enter a valid phone number (with optional + and 7–15 digits)"
                      className={`border-2 px-2 py-1.5 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                      readOnly={
                        !isCreateMode && status !== "pending" && !isSuperAdmin
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Field>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Bank Name:" lang={lang} />
                  </Label>
                  <Input
                    name="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.BankName}
                    title="Enter Bank Name"
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Bank Address:" lang={lang} />
                  </Label>
                  <Input
                    type="text"
                    name="bankAddress"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.BankAddress}
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Sort Code:" lang={lang} />
                  </Label>
                  <Input
                    type="text"
                    name="SortCode"
                    value={sortCode}
                    onChange={(e) => setSortCode(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.SortCode}
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Account Number:" lang={lang} />
                  </Label>
                  <Input
                    type="text"
                    name="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.AccountNumber}
                    inputMode="numeric" // shows numeric keyboard on mobile, but keeps type text
                    autoComplete="off"
                    pattern="[0-9]*" // optional: restrict to numbers if you want
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>

                <Field>
                  <Label className={`w-full block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText
                      text="IBAN No (International companies only):"
                      lang={lang}
                    />
                  </Label>
                  <Input
                    type="text"
                    name="ibanNo"
                    value={ibanNo}
                    onChange={(e) => setIbanNo(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.IBANNumber}
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field>
                  <Label className={`w-max block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText
                      text="SWIFT BIC (International companies only): "
                      lang={lang}
                    />
                  </Label>
                  <Input
                    type="text"
                    name="swiftBic"
                    value={swiftBic}
                    onChange={(e) => setSwiftBic(e.target.value)}
                    className={`border-2 px-2 py-1 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] bg-[#E5E7EB]/40 text-black"} text-base`}
                    placeholder={placeholders.SWIFTCode}
                    readOnly={
                      !isCreateMode && status !== "pending" && !isSuperAdmin
                    }
                  />
                </Field>
                <Field className={"flex-1"}>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Created By:" lang={lang} />
                  </Label>
                  <Input
                    type="text"
                    name="createdBy"
                    value={params?.createdByName || fullname}
                    readOnly
                    aria-placeholder="Created By"
                    aria-label="createdBy"
                    className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                  />
                </Field>
                <Field className={"flex-1"}>
                  <Label className={`block text-base font-medium ${erpIframe ? "text-white" : "text-[#6C737F]"}`}>
                    <TransText text="Created Date:" lang={lang} />
                  </Label>
                  <Input
                    type="date"
                    name="createdDate"
                    value={
                      params?.createdTime?.split("T")[0] ||
                      new Date().toISOString().split("T")[0]
                    }
                    readOnly
                    aria-placeholder="Created Date"
                    aria-label="createdDate"
                    className={`pl-2 py-1.5 border-2 w-full rounded-lg ${erpIframe ? "bg-[#2a3441] border-[#3a3f4b] text-white" : "border-[#E5E7EB] text-black"} text-base focus:ring-2 focus:ring-[#1D2636]/20`}
                  />
                </Field>
              </div>
            </Fieldset>
          </ModalContent>
        </form>
      </ModalBody>
    </Modal>
  );
}
