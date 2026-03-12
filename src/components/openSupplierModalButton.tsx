import { useAuth } from "@/lib/authProvider";
import ServiceModal from "./SupplierModel";
import { TransText } from "./TransText";

const OpenSupplierModalButton = (params: any) => {
  const { lang } = useAuth();
  const { data, context } = params;
  const onSuccess = context.onSuccess;
  return (
    <ServiceModal
      params={data}
      onClick={() => {
        console.log("[Supplier Request View] modal params:", data);
      }}
      mode="edit"
      onSuccess={onSuccess}
    >
      <a
        type="button"
        className="px-2 py-1 text-sm text-black bg-gray-200 rounded-2xl focus:z-10 hover:opacity-90 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] active:bg-white active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] transition duration-150 ease-in-out focus:outline-none focus:ring-0"
      >
        {<TransText text={"View"} lang={lang} />}
      </a>
    </ServiceModal>
  );
};

export default OpenSupplierModalButton;
