import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

function usePromptDialog() {
    const [visible, setVisible] = useState(false);
    const [input, setInput] = useState("");
    const resolveRef = useRef<(value: string | null) => void | null>(null);

    function open() {
        setInput("");
        setVisible(true);
        return new Promise<string | null>((resolve) => {
            resolveRef.current = resolve;
        });
    }
    
    function onSubmit() {
        if (!input.trim()) {
            toast.error("Reason is required!");
            return;
        }
        setVisible(false);
        resolveRef.current?.(input.trim() || null);
    }

    function onCancel() {
        setVisible(false);
        resolveRef.current?.(null);
    }

    const dialog = (
        <Dialog
            header="Please provide a reason for closing"
            visible={visible}
            modal
            onHide={onCancel}
            style={{ width: "35vw" }}
            className="rounded-xl"
            appendTo="self"
            dismissableMask={false}
        >
            <InputText
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            placeholder="Reason"
            className="w-full p-inputtext-sm my-3"
            />
            <div className="flex justify-end gap-2 mt-3">
                <Button label="Cancel" type="button" className="p-button-text" onClick={onCancel} />
                <Button label="Submit" type="button" className="p-button-success" onClick={onSubmit} />
            </div>
        </Dialog>
    );

    return { open, dialog };
}
export default usePromptDialog;