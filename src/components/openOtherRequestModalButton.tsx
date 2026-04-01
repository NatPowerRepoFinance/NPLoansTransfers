import OtherRequestModal from "./modal";

const OpenOtherReqModalButton = (params: any) => {
  const { data, context } = params;
  const onSuccess = context.onSuccess;
  return (
    <OtherRequestModal
      params={data}
      onClick={() => {
        console.log("[Other Request View] modal params:", data);
      }}
      mode="edit"
      onSuccess={onSuccess}
    >
      <a
        type="button"
        className="px-2 py-1 text-sm text-black bg-gray-200 rounded-2xl focus:z-10 hover:opacity-90 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] active:bg-white active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] transition duration-150 ease-in-out focus:outline-none focus:ring-0"
      >
        View
      </a>
    </OtherRequestModal>
  );
};

export default OpenOtherReqModalButton;
