import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  CloseIcon,
} from "@/components/animated-modal";

import { Field, Fieldset, Input, Label, Textarea } from "@headlessui/react";
import DropdownSelect from "./dropdownSelect";
import ColorDropdownSelect from "./colorDropdownSelect";
import { toast } from "react-toastify";
import {
  createRisk,
  updateRisk,
  // useFetchJson,
} from "../lib/api/riskApi";
// import type { Option } from "@/lib/types";
import {
  formattedDate,
  RiskCategoryMap,
  RiskStatusMap,
  toInputDate,
} from "@/lib/riskUtils";
import usePromptDialog from "./promptDialog";
// import {
//   statusMap,
//   roleStatusAccess,
//   getUserRole,
//   getUserFullName,
// } from "@/lib/utils";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function PoModal({
  children,
  params,
  onClick,
  mode,
  onSuccess,
  disabled = false,
  erpIframe = false,
}: {
  children: React.ReactNode;
  params?: any;
  onClick: () => void;
  mode?: "create" | "edit";
  onSuccess: () => void;
  disabled?: boolean;
  erpIframe?: boolean;
}) {
  // const role = getUserRole() || "User";
  // const fullName = getUserFullName() || "";
  // const accessibleStatuses = roleStatusAccess[role] || [];
  const isCreateMode = mode === "create";
  // const [shouldFetch, setShouldFetch] = useState(false);

  // const [project, setProject] = useState<string>("");
  // const [natpowerContact, setNatpowerContact] = useState<string>("");
  // const [natpowerCompany, setNatpowerCompany] = useState<string>("");
  // const [costCentre, setCostCentre] = useState<string>("");
  // const [vendor, setVendor] = useState<string>("");
  // const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  // const today = new Date().toISOString().split("T")[0];
  // const [deliveryDate, setDeliveryDate] = useState<string>(today);

  // const [paymentTerms, setPaymentTerms] = useState<string>("");
  // const [earlyPaymentDiscount, setEarlyPaymentDiscount] = useState<string>("");
  // const [latePaymentPenalties, setLatePaymentPenalties] = useState<string>("");
  // const [hasWithholdingTax, setHasWithholdingTax] = useState<string>("");
  // const [withholdingTaxRate, setWithholdingTaxRate] = useState<string>("");
  // const [description, setDescription] = useState<string>("");
  // const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  // const [vendorContactName, setVendorContactName] = useState<string>("");
  // const [projectCode, setProjectCode] = useState<string>("");
  // const [contactEmail, setContactEmail] = useState<string>("");
  // const [costCentreCode, setCostCentreCode] = useState<string>("");
  // const [paymentDate, setPaymentDate] = useState<string>("2025-01-01");
  // const [taxRate, setTaxRate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [status, setStatus] = useState<string>("1");
  const [projectId, setProjectId] = useState<number | string | null>(
    params.projectId
  );
  const [pdaId, setPdaId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [type, setType] = useState<string>("1");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [consequence, setConsequence] = useState<string | null>(null);
  const [mitigationDescription, setMitigationDescription] =
    useState<string>("");
  const [postMitigationLikelihood, setPostMitigationLikelihood] =
    useState<string>("1");
  const [postMitigationImpact, setPostMitigationImpact] = useState<string>("1");
  const [postMitigationScore, setPostMitigationScore] = useState<string>("");
  const [postMitigationStatus, setPostMitigationStatus] = useState<
    string | null
  >(null);
  const [externalRecommendation, setExternalRecommendation] = useState<
    string | null
  >(null);
  const [likelihood, setLikelihood] = useState<string>("1");
  const [impact, setImpact] = useState<string>("1");
  const [score, setScore] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [createdByName, setCreatedByName] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>("");
  const [modifiedBy, setModifiedBy] = useState<string>("");
  const [modifiedByName, setModifiedByName] = useState<string>("");
  const [modifiedDate, setModifiedDate] = useState<string>("");

  // const [rowData, setRowData] = useState<any[]>([]);
  const { open: openPrompt, dialog: promptDialog } = usePromptDialog();

  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (likelihood && impact) {
      setScore(String(parseInt(likelihood) * parseInt(impact)));
    }
  }, [likelihood, impact]);

  useMemo(() => {
    if (postMitigationLikelihood && postMitigationImpact) {
      setPostMitigationScore(
        String(
          parseInt(postMitigationLikelihood) * parseInt(postMitigationImpact)
        )
      );
    }
  }, [postMitigationLikelihood, postMitigationImpact]);

  // Sync likelihood with impact
  useEffect(() => {
    if (impact) {
      setLikelihood(impact);
    }
  }, [impact]);

  // const getScoreBgClass = (score: number) => {
  //   if (score >= 1 && score < 6) return "bg-[#D4EDDA]";
  //   if (score >= 6 && score < 11) return "bg-[#C3E6CB]";
  //   if (score >= 11 && score < 16) return "bg-[#FFEEBA]";
  //   if (score >= 16 && score < 21) return "bg-[#F4AEB5]";
  //   if (score >= 21) return "bg-[#E58B94]";
  //   return "bg-[#E5E7EB]/40";
  // };

  // const [taxDataFetchUrl, setTaxDataFetchUrl] = useState<string>("");
  // const [projectDataFetchUrl, setProjectDataFetchUrl] = useState<string>("");

  // const isFirstRun = useRef(true);
  // const getReasonFieldName = (status: string) =>
  //   status === "rejected" ? "rejection_reason" : "cancellation_reason";

  const categoryOptions = Object.entries(RiskCategoryMap).map(
    ([key, label]) => ({
      value: Number(key),
      label,
    })
  );
  const statusOptions = Object.entries(RiskStatusMap).map(([key, label]) => ({
    value: Number(key),
    label,
  }));
  // const typeOptions = Object.entries(RiskTypeMap).map(([key, label]) => ({
  //   value: Number(key),
  //   label,
  // }));
  // const likelihoodOptions = mapToOptions(Scores);
  const impactOptions = [
    { value: 1, label: "Green", color: "#22C55E" },
    { value: 3, label: "Amber", color: "#F59E0B" },
    { value: 5, label: "Red", color: "#EF4444" },
  ];
  const pdaIdOptions = params?.pdaData?.map((item: any) => ({
    value: item.id,
    label: item.name,
  }));
  const assignedToOptions = params?.natpowerContactOptions;
  const selectedProject = params?.projectData?.find(
    (item: any) => item.id === projectId
  );
  const projectName = selectedProject?.name || "";
  // const initialRowData = useMemo(() => {
  //   return [
  //     { No: 1 },
  //     { No: 2 },
  //     { No: 3 },
  //     { No: 4 },
  //     { No: 5 },
  //     { No: 6 },
  //     { No: 7 },
  //     { No: 8 },
  //     { No: 9 },
  //     { No: 10 },
  //   ];
  // }, []);

  const resetForm = () => {
    setProjectId(params.projectId);
    setPdaId("");
    setTitle("");
    setType("1");
    setCategory("");
    setAssignedTo("");
    setConsequence(null);
    setPostMitigationStatus(null);
    setExternalRecommendation(null);
    setLikelihood("1");
    setImpact("1");
    setScore("1");
    setCreatedBy("");
    setCreatedDate("");
    setModifiedBy("");
    setModifiedDate("");
    setStatus("1");
    setDescription("");
    setMitigationDescription("");
    setPostMitigationLikelihood("1");
    setPostMitigationImpact("1");
    setPostMitigationScore("1");
  };

  // const { data: projectData } = useFetchJson<any>(
  //   project ? projectDataFetchUrl : "",
  //   "project.project"
  // );

  // const { data: contactData } = useFetchJson<any>(
  //   isCreateMode && natpowerContact ? `purchase.order/${natpowerContact} ` : "",
  //   "purchase.order"
  // );

  // const { data: taxDetailsData } = useFetchJson<any>(
  //   vendor ? taxDataFetchUrl : "",
  //   "res.partner"
  // );

  // const { data: lineItemData } = useFetchJson<any>(
  //   !isCreateMode && shouldFetch && params?.id
  //     ? `purchase.order.line?domain=[('order_id', '=',${params.id})]`
  //     : "",
  //   "purchase.order.line"
  // );

  // useEffect(() => {
  //   if (!shouldFetch) return;
  //   if (isFirstRun.current) {
  //     isFirstRun.current = false;
  //     return;
  //   }
  //   if (vendor) {
  //     setTaxDataFetchUrl(`res.partner?domain=[('id', '=', ${vendor})]`);
  //   }
  //   if (project) {
  //     setProjectDataFetchUrl(`project.project/${project}`);
  //   }
  // }, [vendor, project, shouldFetch]);

  useEffect(() => {
    if (String(status) === "2") {
      setReason(params?.reason || "");
    } else {
      setReason("");
    }
  }, [params?.reason, status]);

  // useEffect(() => {
  //   if (!project) return;
  //   if (Array.isArray(projectData)) {
  //     setProjectCode(projectData[0]?.project_code || "");
  //   } else {
  //     return;
  //   }
  // }, [project, projectData]);

  useEffect(() => {
    if (!createdBy || !params?.natpowerContactOptions) {
      setCreatedByName("");
      return;
    }
    setCreatedByName(
      params?.natpowerContactOptions?.find(
        (item: any) => Number(item.id) === Number(createdBy)
      )?.label || ""
    );
  }, [createdBy, params?.natpowerContactOptions]);
  useEffect(() => {
    if (!modifiedBy || !params?.natpowerContactOptions) {
      setModifiedByName("");
      return;
    }
    setModifiedByName(
      params?.natpowerContactOptions?.find(
        (item: any) => Number(item.id) === Number(modifiedBy)
      )?.label || ""
    );
  }, [modifiedBy, params?.natpowerContactOptions]);

  // useEffect(() => {
  //   if (!vendor || !taxDetailsData) return;

  //   if (Array.isArray(taxDetailsData)) {
  //     setTaxRate(taxDetailsData[0]?.tax_rate || "");
  //     setPaymentTerms(taxDetailsData[0]?.payment_terms || "");
  //     setEarlyPaymentDiscount(taxDetailsData[0]?.early_payment_discount || "");
  //     setLatePaymentPenalties(taxDetailsData[0]?.late_payment_penalities || "");
  //     setHasWithholdingTax(taxDetailsData[0]?.with_holding_tax || "");
  //     setWithholdingTaxRate(taxDetailsData[0]?.with_holding_tax_rate || "");
  //   } else if (taxDetailsData) {
  //     setTaxRate(
  //       (taxDetailsData as any)?.tax_rate !== undefined
  //         ? String((taxDetailsData as any)?.tax_rate)
  //         : ""
  //     );
  //     setPaymentTerms(
  //       (taxDetailsData as any)?.payment_terms !== undefined
  //         ? String((taxDetailsData as any)?.payment_terms)
  //         : ""
  //     );
  //     setEarlyPaymentDiscount(
  //       (taxDetailsData as any)?.early_payment_discount !== undefined
  //         ? String((taxDetailsData as any)?.early_payment_discount)
  //         : ""
  //     );
  //     setLatePaymentPenalties(
  //       (taxDetailsData as any)?.late_payment_penalities !== undefined
  //         ? String((taxDetailsData as any)?.late_payment_penalities)
  //         : ""
  //     );
  //     setHasWithholdingTax(
  //       (taxDetailsData as any)?.with_holding_tax !== undefined
  //         ? (taxDetailsData as any)?.with_holding_tax
  //           ? "Yes"
  //           : "No"
  //         : ""
  //     );
  //     setWithholdingTaxRate(
  //       (taxDetailsData as any)?.with_holding_tax_rate !== undefined
  //         ? String((taxDetailsData as any)?.with_holding_tax_rate)
  //         : ""
  //     );
  //   }
  // }, [vendor, taxDetailsData]);

  // useEffect(() => {
  //   if (isCreateMode)
  //     setPaymentDate(
  //       toInputDate(deliveryDate, paymentTerms ? parseInt(paymentTerms) : 0)
  //     );
  //   return;
  // }, [deliveryDate, paymentTerms, isCreateMode]);
  useEffect(() => {
    if (isCreateMode) setProjectId(params.projectId);
    return;
  }, [params.projectId, isCreateMode]);

  // const mapOrderLine = (): [
  //   number,
  //   number,
  //   {
  //     product_id: number;
  //     product_qty: number;
  //     price_unit: number;
  //     wbs_code?: string;
  //   }
  // ][] => {
  //   return rowData
  //     .filter((row) => row.product_id && row.quantity && row.unitPrice)
  //     .map((row) => [
  //       0,
  //       0,
  //       {
  //         product_id: row.product_id!,
  //         product_qty: Number(row.quantity),
  //         price_unit: Number(row.unitPrice),
  //         wbs_code: row.wbsCode || "",
  //       },
  //     ]);
  // };

  // const mapOrderLineUpdate = (): [
  //   number,
  //   number,
  //   {
  //     product_id: number;
  //     product_qty: number;
  //     price_unit: number;
  //     wbs_code?: string;
  //   }
  // ][] => {
  //   const fallbackDataArray = Array.isArray(lineItemData)
  //     ? lineItemData
  //     : lineItemData
  //     ? [lineItemData]
  //     : [];

  //   return rowData
  //     .map((row, index) => {
  //       const fallbackItem = fallbackDataArray[index];
  //       const orderLineId = fallbackItem?.id || 0;
  //       const product_id = row.product_id ?? fallbackItem?.product_id?.[0];
  //       const product_qty =
  //         Number(row.quantity) || Number(fallbackItem?.product_qty);
  //       const price_unit =
  //         Number(row.unitPrice) || Number(fallbackItem?.price_unit);
  //       const wbs_code = row.wbsCode || fallbackItem?.wbs_code || "";

  //       if (!product_id && !product_qty && !price_unit) {
  //         return null;
  //       }

  //       return [
  //         Number(orderLineId) == 0 ? 0 : 1,
  //         orderLineId,
  //         {
  //           product_id,
  //           product_qty,
  //           price_unit,
  //           wbs_code,
  //         },
  //       ];
  //     })
  //     .filter(Boolean) as [
  //     number,
  //     number,
  //     {
  //       product_id: number;
  //       product_qty: number;
  //       price_unit: number;
  //       wbs_code?: string;
  //     }
  //   ][];
  // };

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const closeModal = () => {
    closeButtonRef.current?.click();
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    let promptReason: string | undefined = undefined;
    const isClosing = String(status) === "2";
    // const reasonFieldName = getReasonFieldName(status);
    if (String(status) === "2" && String(params?.riskStatus) === "1") {
      // toast.info(`Please add reason for Closing`);
      const promptResult = await openPrompt();
      promptReason = promptResult === null ? reason || undefined : promptResult;
      if (!promptReason || !promptReason.trim()) {
        toast.error("Update cancelled: Reason is required.");
        setSaving(false);
        return;
      }
    } else if (String(status) === "2" && String(params?.riskStatus) === "2") {
      promptReason = reason;
    } else if (isClosing && !params?.riskStatus) {
      const promptResult = await openPrompt();
      promptReason = promptResult === null ? "" : promptResult;
      if (!promptReason || !promptReason.trim()) {
        toast.error("Create cancelled: Reason is required.");
        setSaving(false);
        return;
      }
    }
    try {
      if (isCreateMode) {
        const riskPayload = {
          // creation_user: fullName,
          project_id: Number(projectId),
          pda_id:
            isNaN(Number(pdaId)) || Number(pdaId) === 0 ? null : Number(pdaId),
          risk_type: Number(type),
          risk_category: Number(category),
          title: title,
          risk_status: Number(status),
          assigned_to: assignedTo || 52,
          description: description,
          consequence: consequence,
          external_recommendation: externalRecommendation,
          likelihood: Number(likelihood),
          impact: Number(impact),
          score: Number(score),
          mitigation_description: mitigationDescription,
          post_mitigation_likelihood: Number(postMitigationLikelihood),
          post_mitigation_impact: Number(postMitigationImpact),
          post_mitigation_score: Number(postMitigationScore),
          post_mitigation_status: postMitigationStatus,
          ...(!!promptReason?.trim() && { risk_closure_reason: promptReason }),
        };
        const result = await createRisk(riskPayload);
        console.log("Risk Created:", result);
        toast.success("Risk Ticket Created Successfully!");
        resetForm();
        onSuccess();
        setTimeout(() => {
          closeModal();
        }, 500);
      } else {
        const poPayload = {
          risk_id: Number(params.risk_id),
          // project_id: Number(projectId),
          pda_id:
            isNaN(Number(pdaId)) || Number(pdaId) === 0 ? null : Number(pdaId),
          risk_type: Number(type),
          ...(!!category && { risk_category: Number(category) }),
          ...(!!title?.trim() && { title: title }),
          ...(!!createdDate.trim() && { risk_date: createdDate }),
          ...(!!status && { risk_status: Number(status) }),
          ...(!!assignedTo?.trim() && { assigned_to: assignedTo || 52 }),
          description: description,
          consequence: consequence,
          external_recommendation: externalRecommendation,
          ...(!!likelihood && { likelihood: Number(likelihood) }),
          ...(!!impact && { impact: Number(impact) }),
          ...(!!score && { score: Number(score) }),
          mitigation_description: mitigationDescription,
          ...(!!postMitigationLikelihood && {
            post_mitigation_likelihood: Number(postMitigationLikelihood),
          }),
          ...(!!postMitigationImpact && {
            post_mitigation_impact: Number(postMitigationImpact),
          }),
          ...(!!postMitigationScore && {
            post_mitigation_score: Number(postMitigationScore),
          }),
          post_mitigation_status: postMitigationStatus,
          ...(!!promptReason?.trim() && { risk_closure_reason: promptReason }),
        };
        const result = await updateRisk(poPayload);
        console.log("Risk Updated:", result);
        toast.success("Risk Ticket Updated Successfully!");
        onSuccess();
        setTimeout(() => {
          closeModal();
        }, 500);
      }
    } catch (error: any) {
      // toast.error(`Submission failed`);
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  // const costCentreOptions = useMemo(
  //   () => params?.costCentreOptions || [],
  //   [params?.costCentreOptions]
  // );

  useEffect(() => {
    if (isCreateMode || !params) return;
    if (!isCreateMode && params) {
      const d = params;
      setPdaId(d.pdaId || "");
      setStatus(d.riskStatus || "2");
      setType(d.riskType || "1");
      setCategory(d.riskCategory || "Land");
      setTitle(d.title || "");
      setAssignedTo(d.assignedTo || "Stephen Holmes");
      setDescription(d.description || "");
      setConsequence(null);
      setExternalRecommendation(null);
      setLikelihood(d.impact ? String(d.impact) : "1");
      setImpact(d.impact ? String(d.impact) : "1");
      setScore(d.score || "");
      setMitigationDescription(d.mitigationDescp || "");
      setPostMitigationLikelihood("1");
      setPostMitigationImpact("1");
      setPostMitigationScore("1");
      setPostMitigationStatus(null);
      setCreatedDate(toInputDate(d.created_date) || "");
      setCreatedBy(d.createdBy || "");
      setModifiedDate(toInputDate(d.last_updated_date) || "");
      setModifiedBy(d.modifiedBy || "");
    }
  }, [isCreateMode, params, params?.impact, params?.riskStatus, params?.title]);

  // useEffect(() => {
  //   if (!params) return;

  //   const reasonFieldName = getReasonFieldName(status);
  //   setReason(params?.[reasonFieldName] || "");
  // }, [status, params]);

  // const normalizeOption = (
  //   tuple: [string | number, string] | false | null | undefined
  // ): Option[] => {
  //   if (!tuple || !Array.isArray(tuple) || tuple.length < 2) return [];
  //   return [
  //     {
  //       value: String(tuple[0]),
  //       label: tuple[1],
  //     },
  //   ];
  // };

  // const projectOptions: Option[] = isCreateMode
  //   ? params?.projectOptions || []
  //   : [
  //       ...(params?.projectOptions || []),
  //       // ...normalizeOption(params?.project_id),
  //     ];

  // const natpowerContactOptions: Option[] = isCreateMode
  //   ? params?.natpowerContactOptions || []
  //   : [
  //       ...(params?.natpowerContactOptions || []),
  //       // ...normalizeOption(params?.npower_contact_id),
  //     ];

  // const natpowerCompanyOptions: Option[] = isCreateMode
  //   ? params?.natpowerCompanyOptions || []
  //   : [
  //       ...(params?.natpowerCompanyOptions || []),
  //       // ...normalizeOption(params?.company_id),
  //     ];

  // useEffect(() => {
  //   if (!costCentre && isCreateMode) {
  //     setCostCentreCode("");
  //     return;
  //   }
  //   const selectedOption = costCentreOptions.find(
  //     (opt: any) => String(opt.value) === String(costCentre)
  //   );

  //   if (selectedOption) {
  //     setCostCentreCode(selectedOption.code);
  //   } else {
  //     console.warn("No matching cost centre found.");
  //   }
  // }, [costCentre, costCentreOptions, isCreateMode]);

  // const lineItemOptions = useMemo(() => {
  //   const options = params?.lineDescriptionOptions ?? [];
  //   return Array.isArray(options) && options.length > 0 ? options : [];
  // }, [params?.lineDescriptionOptions]);

  // useEffect(() => {
  //   if (!lineItemOptions.length) return;

  //   const updated = rowData.map((row) => {
  //     const matched = lineItemOptions.find(
  //       (item: any) => String(item.label) === String(row.lineItemDescription)
  //     );

  //     const wbsSubCode =
  //       matched?.wbs_sub_code ?? row.wbsCode?.split(".")[1] ?? "";

  //     const wbsCode = wbsSubCode
  //       ? projectCode
  //         ? `WUKBE${projectCode?.slice(0, 4) ?? ""}.${wbsSubCode}`
  //         : `WUKBE.${wbsSubCode}`
  //       : "";

  //     return {
  //       ...row,
  //       wbsCode,
  //     };
  //   });

  //   setRowData(updated);
  // }, [projectCode, lineItemOptions]);

  return (
    <Modal>
      <ModalTrigger
        onClick={onClick}
        disabled={disabled}
        // onOpenChange={(isOpen) => setShouldFetch(isOpen)}
        className={`${"border-none shadow-none hover:shadow-none active:shadow-none"} active:bg-gray-50`}
      >
        {children}
      </ModalTrigger>
      <ModalBody className={erpIframe ? "bg-[#171717]" : ""}>
        <form onSubmit={handleSave}>
          <ModalContent>
            <Fieldset className="space-y-2 ">
              {/* Header Section */}
              <div
                className={`flex flex-col sm:flex-row justify-between items-center pb-2 border-b-[1px] border-[#E5E7EB] ${
                  erpIframe ? "text-white" : "text-black"
                }`}
              >
                <div className="text-2xl font-semibold">
                  Risk ID: {params.risk_id}
                </div>
                <div className="flex items-center gap-4">
                  {/* <Field>
                    <Label className="inline text-base font-medium text-[#6C737F] mr-3">
                      Status:
                    </Label>
                    <Select
                      className="pl-2 py-1.5 border-2 rounded-lg border-[#E5E7EB] text-base focus:ring-2 focus:ring-[#1D2636]/20 w-40"
                      name="Status"
                      onChange={(e) => setStatus(e.target.value)}
                      value={status}
                    >
                      <option className="text-[#6C737F]" value="">
                        Select Status
                      </option>
                      {accessibleStatuses.map((value) => (
                        <option key={value} value={value}>
                          {statusMap[value]}
                        </option>
                      ))}
                    </Select>
                  </Field> */}
                  {String(status) === "2" && params.reason && (
                    <Field className={"flex items-center"}>
                      <Label className="whitespace-nowrap text-base font-medium text-[#6C737F] mr-3">
                        Reason for Closing:
                      </Label>
                      <Input
                        name="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="border-2 px-2 py-1 w-full rounded-lg border-[#E5E7EB] bg-[#E5E7EB]/40 text-base text-black"
                        placeholder="Enter Reason *"
                        required
                      />
                    </Field>
                  )}

                  <div className="flex gap-3 items-center">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 hover:shadow-md focus:shadow-md active:bg-white active:text-black active:shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-0 disabled:opacity-50
    ${
      erpIframe
        ? "bg-emerald-500/80 border border-emerald-500/80"
        : "bg-[#1D2636] border border-[#1D2636]"
    }
  `}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <div
                      onClick={() => {
                        if (isCreateMode) resetForm();
                        if (!isCreateMode && params) {
                          const d = params;
                          setPdaId(d.pdaId || "");
                          setStatus(d.riskStatus || "2");
                          setType(d.riskType || "1");
                          setCategory(d.riskCategory || "Land");
                          setTitle(d.title || "");
                          setAssignedTo(d.assignedTo || "Stephen Holmes");
                          setDescription(d.description || "");
                          setConsequence(null);
                          setExternalRecommendation(null);
                          setLikelihood(d.impact ? String(d.impact) : "1");
                          setImpact(d.impact ? String(d.impact) : "1");
                          setScore(d.score || "");
                          setMitigationDescription(d.mitigationDescp || "");
                          setPostMitigationLikelihood("1");
                          setPostMitigationImpact("1");
                          setPostMitigationScore("1");
                          setPostMitigationStatus(null);
                          setCreatedDate(toInputDate(d.created_date) || "");
                          setCreatedBy(d.createdBy || "");
                          setModifiedDate(
                            toInputDate(d.last_updated_date) || ""
                          );
                          setModifiedBy(d.modifiedBy || "");
                        }
                      }}
                      className="cursor-pointer hover:bg-gray-100 rounded-xl"
                    >
                      <CloseIcon ref={closeButtonRef} />
                      {promptDialog}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 5xl:grid-cols-2 gap-1 gap-x-3 text-sm">
                {/* First Row */}
                <div>
                  <div className="flex flex-row gap-3 bg-transparent rounded-lg">
                    <Field className="flex-1/4 shrink">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Project Name:
                      </Label>
                      <Input
                        name="projectName"
                        value={projectName ? projectName : ""}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                        disabled
                        placeholder="N/A"
                      />
                    </Field>
                    <div className="flex-1/4">
                      <DropdownSelect
                        label="PDA/Site Name"
                        value={pdaId}
                        onChange={setPdaId}
                        options={pdaIdOptions}
                        placeholder="Select PDA/Site Name"
                        name="pdaId"
                        erpIframe={erpIframe}
                        // disabled={!isCreateMode && !pdaId}
                        className="text-base w-full border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                      />
                    </div>
                    <Field className="flex-1/2">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Title *:
                      </Label>
                      <Input
                        name="title"
                        value={title ? title : ""}
                        onChange={(e) => {
                          if (e.target.value.length >= 101) {
                            toast.warn("Maximum 100 characters allowed");
                            return;
                          }
                          setTitle(e.target.value);
                        }}
                        maxLength={101}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                        required
                      />
                    </Field>
                  </div>

                  {/* Second Row */}
                  <div className="flex flex-row gap-3 bg-transparent rounded-lg">
                    <DropdownSelect
                      label="Status *"
                      value={status}
                      onChange={setStatus}
                      options={statusOptions}
                      placeholder="Select Status"
                      name="status"
                      required={true}
                      disabled={isCreateMode}
                      erpIframe={erpIframe}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                    />
                    {/* <DropdownSelect
                      label="Type *"
                      value={type}
                      onChange={setType}
                      options={typeOptions}
                      placeholder="Select Type"
                      name="type"
                      required={true}
                      erpIframe={erpIframe}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                    /> */}
                    <DropdownSelect
                      label="Category *"
                      value={category}
                      onChange={setCategory}
                      options={categoryOptions}
                      placeholder="Select Category"
                      name="category"
                      required={true}
                      erpIframe={erpIframe}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                    />
                    <DropdownSelect
                      label="Assigned To *"
                      value={assignedTo}
                      onChange={setAssignedTo}
                      options={assignedToOptions}
                      placeholder="Select Assigned To"
                      name="assignedTo"
                      required={true}
                      erpIframe={erpIframe}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                    />
                  </div>

                  {/* Third Row */}
                  <div className="flex flex-col gap-1 bg-transparent rounded-lg">
                    <Field>
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Description *:
                      </Label>
                      <Textarea
                        name="description"
                        value={description ? description : ""}
                        onChange={(e) => {
                          if (e.target.value.length >= 1025) {
                            toast.warn("Maximum 1024 characters allowed");
                            return;
                          }
                          setDescription(e.target.value);
                        }}
                        maxLength={1025}
                        rows={2}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                        required
                      />
                    </Field>
                    {/* Consequence field hidden - defaults to null */}

                    {/* <Field>
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Consequence:
                      </Label>
                      <Textarea
                        name="consequence"
                        value={consequence ? consequence : ""}
                        onChange={(e) => {
                          if (e.target.value.length >= 1025) {
                            toast.warn("Maximum 1024 characters allowed");
                            return;
                          }
                          setConsequence(e.target.value);
                        }}
                        maxLength={1025}
                        rows={2}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                      />
                    </Field> */}
                  </div>

                  {/* Fourth Row */}
                  <div className="flex flex-row gap-3 bg-transparent rounded-lg">
                    {/* Likelihood field hidden - auto-synced with Impact */}
                    {/* <DropdownSelect
                      label="Likelihood *"
                      value={likelihood}
                      onChange={setLikelihood}
                      options={likelihoodOptions}
                      placeholder="Select Likelihood"
                      name="likelihood"
                      required={true}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                      useColorSystem={true}
                    /> */}
                    <ColorDropdownSelect
                      label="Risk Level *"
                      value={impact}
                      onChange={setImpact}
                      options={impactOptions}
                      placeholder="Select Risk Level"
                      name="impact"
                      required={true}
                      erpIframe={erpIframe}
                      className="text-base"
                    />
                  </div>
                </div>
                <div>
                  {/* Fifth Row */}
                  <div className="flex flex-col gap-1 bg-transparent rounded-lg">
                    {/* External Recommendation field hidden - defaults to null */}
                    {/* <Field>
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        External Recommendation:
                      </Label>
                      <Textarea
                        name="externalRecommendation"
                        value={
                          externalRecommendation ? externalRecommendation : ""
                        }
                        onChange={(e) => {
                          if (e.target.value.length >= 1025) {
                            toast.warn("Maximum 1024 characters allowed");
                            return;
                          }
                          setExternalRecommendation(e.target.value);
                        }}
                        maxLength={1025}
                        rows={2}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                      />
                    </Field> */}
                    <Field>
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Mitigation Description *:
                      </Label>
                      <Textarea
                        name="mitigationDescription"
                        value={
                          mitigationDescription ? mitigationDescription : ""
                        }
                        onChange={(e) => {
                          if (e.target.value.length >= 1025) {
                            toast.warn("Maximum 1024 characters allowed");
                            return;
                          }
                          setMitigationDescription(e.target.value);
                        }}
                        maxLength={1025}
                        rows={2}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                        required
                      />
                    </Field>
                  </div>

                  {/* Post Mitigation section hidden - all fields default to 1 or null */}
                  {/* Post-Mitigation Likelihood, Impact, Score default to 1 */}
                  {/* Post-Mitigation Status defaults to null */}
                  {/* <Label
                    className={`block text-base font-bold ${
                      erpIframe ? "text-white" : "text-black"
                    }`}
                  >
                    Post Mitigation
                  </Label>

                  <div className="flex flex-row gap-3 bg-transparent rounded-lg">
                    <DropdownSelect
                      label="Likelihood *"
                      value={postMitigationLikelihood}
                      onChange={setPostMitigationLikelihood}
                      options={likelihoodOptions}
                      placeholder="Select Likelihood"
                      name="postMitigationLikelihood"
                      required={true}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                      useColorSystem={true}
                    />
                    <DropdownSelect
                      label="Impact *"
                      value={postMitigationImpact}
                      onChange={setPostMitigationImpact}
                      options={impactOptions}
                      placeholder="Select Impact"
                      name="postMitigationImpact"
                      required={true}
                      className="text-base border-2 rounded-lg border-[#E5E7EB] py-1.5 px-2 focus:ring-2 focus:ring-[#1D2636]/20"
                      useColorSystem={true}
                    />
                    <Field className="w-full">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Risk Score:
                      </Label>
                      <Input
                        name="postMitigationScore"
                        value={postMitigationScore}
                        className={`border-2 px-2 py-1 w-full rounded-lg border-[#E5E7EB] text-base text-black ${getScoreBgClass(
                          Number(postMitigationScore)
                        )}`}
                        disabled
                        placeholder="N/A"
                        title={postMitigationScore}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-col gap-1 bg-transparent rounded-lg">
                    <Field>
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Post Mitigation Status:
                      </Label>
                      <Textarea
                        name="postMitigationStatus"
                        value={postMitigationStatus ? postMitigationStatus : ""}
                        onChange={(e) => {
                          if (e.target.value.length >= 129) {
                            toast.warn("Maximum 128 characters allowed");
                            return;
                          }
                          setPostMitigationStatus(e.target.value);
                        }}
                        maxLength={129}
                        rows={2}
                        className={`border-2 px-2 py-1.5 w-full rounded-lg text-base focus:ring-2 focus:ring-[#1D2636]/20
    ${
      erpIframe
        ? "border-gray-600 text-white bg-[#1B1D22]"
        : "border-[#E5E7EB] text-black"
    }
  `}
                      />
                    </Field>
                  </div> */}

                  {/* Eighth Row */}
                  <div className="flex flex-row gap-3 bg-transparent rounded-lg">
                    <Field className="w-full">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Created By:
                      </Label>
                      <Input
                        name="createdByName"
                        value={createdByName}
                        className={`
  border-2 px-2 py-1 w-full rounded-lg text-base
  ${
    erpIframe
      ? "border-gray-600 text-white bg-[#1B1D22]"
      : "border-[#E5E7EB] text-black bg-[#E5E7EB]/40"
  }
`}
                        disabled
                        placeholder="N/A"
                        title={createdByName}
                      />
                    </Field>
                    <Field className="w-full">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Created Date:
                      </Label>
                      <Input
                        type="createdDate"
                        value={formattedDate(createdDate)}
                        disabled
                        name="createdDate"
                        placeholder="N/A"
                        aria-placeholder="createdDate"
                        aria-label="createdDate"
                        className={`
  border-2 px-2 py-1 w-full rounded-lg text-base
  ${
    erpIframe
      ? "border-gray-600 text-white bg-[#1B1D22]"
      : "border-[#E5E7EB] text-black bg-[#E5E7EB]/40"
  }
`}
                      />
                    </Field>
                    <Field className="w-full">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Modified By:
                      </Label>
                      <Input
                        name="modifiedByName"
                        value={modifiedByName}
                        className={`
  border-2 px-2 py-1 w-full rounded-lg text-base
  ${
    erpIframe
      ? "border-gray-600 text-white bg-[#1B1D22]"
      : "border-[#E5E7EB] text-black bg-[#E5E7EB]/40"
  }
`}
                        disabled
                        placeholder="N/A"
                        title={modifiedByName}
                      />
                    </Field>
                    <Field className="w-full">
                      <Label
                        className={`block text-base font-medium ${
                          erpIframe ? "text-white" : "text-[#6C737F]"
                        }`}
                      >
                        Modified Date:
                      </Label>
                      <Input
                        type="modifiedDate"
                        value={formattedDate(modifiedDate || "")}
                        disabled
                        name="modifiedDate"
                        placeholder="N/A"
                        aria-placeholder="modifiedDate"
                        aria-label="modifiedDate"
                        className={`
  border-2 px-2 py-1 w-full rounded-lg text-base
  ${
    erpIframe
      ? "border-gray-600 text-white bg-[#1B1D22]"
      : "border-[#E5E7EB] text-black bg-[#E5E7EB]/40"
  }
`}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <ModalFooter className="flex flex-col gap-6 md:flex-row md:justify-between items-start md:items-center text-sm w-full">
                <></>
              </ModalFooter>
            </Fieldset>
          </ModalContent>
        </form>
      </ModalBody>
    </Modal>
  );
}
