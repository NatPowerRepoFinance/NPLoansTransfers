import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

function useConfirmDialog({
  withInput = false,
  erpIframe = false,
}: {
  withInput?: boolean;
  erpIframe?: boolean;
} = {}) {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const resolveRef =
    useRef<(value: string | boolean | null) => void | null>(null);

  function open() {
    setInput("");
    setVisible(true);
    return new Promise<string | boolean | null>((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function onSubmit() {
    if (withInput && !input.trim()) {
      toast.error("Reason is required!");
      return;
    }
    setVisible(false);
    resolveRef.current?.(withInput ? input.trim() : true);
  }

  function onCancel() {
    setVisible(false);
    resolveRef.current?.(null);
  }

  const dialog = (
    <Dialog
      header={withInput ? "Please provide a reason" : "Confirm Deleting a Risk"}
      visible={visible}
      modal
      onHide={onCancel}
      style={{ width: "500px" }}
      className="rounded-xl"
      appendTo="self"
      dismissableMask={false}
      contentStyle={{
        backgroundColor: erpIframe ? "#1B1D22" : "white",
        color: erpIframe ? "white" : "black",
      }}
      headerStyle={{
        backgroundColor: erpIframe ? "#1B1D22" : "white",
        color: erpIframe ? "white" : "black",
      }}
    >
      {withInput ? (
        <InputText
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="Reason"
          className="w-full p-inputtext-sm my-3"
        />
      ) : (
        <p className="mb-6">Are you sure you want to delete the risk?</p>
      )}
      <div className="flex justify-end gap-2 mt-3">
        <Button
          label="Cancel"
          type="button"
          className="p-button-text"
          onClick={onCancel}
        />
        <Button
          label="Confirm"
          type="button"
          className="p-button-danger"
          onClick={onSubmit}
        />
      </div>
    </Dialog>
  );

  return { open, dialog };
}

export default useConfirmDialog;
