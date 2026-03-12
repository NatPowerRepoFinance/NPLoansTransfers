import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useErpIframe } from "@/lib/erpIframeContext";

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function Modal({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({
  children,
  className,
  onClick,
  onOpenChange,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}) => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => {
        setOpen(true);
        onOpenChange?.(true);
        onClick?.();
      }}
      className={className}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useModal();
  const { erpIframe } = useErpIframe();
  const modalRef = useRef<HTMLDivElement | any>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  useOutsideClick(modalRef, () => setOpen(false));
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(1px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        >
          <Overlay />

          <motion.div
            ref={modalRef}
            className={cn(
              "relative z-50 flex flex-col rounded-xl shadow-lg max-w-[80%] w-full max-h-[90vh] overflow-hidden",
              erpIframe ? "bg-[#1D2636] text-white" : "bg-white text-black",
              className
            )}
            style={{ backgroundImage: "none" }}
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 35 }}
          >
            {/* Scrollable content wrapper */}
            <div className="overflow-y-auto p-4 flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col flex-1 px-6 py-3", className)}>
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex justify-between px-6 pb-6", className)}>
      {children}
    </div>
  );
};

const Overlay = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        backdropFilter: "blur(10px)",
      }}
      exit={{
        opacity: 0,
        backdropFilter: "blur(0px)",
      }}
      className={`fixed inset-0 h-full w-full backdrop-opacity-30 z-50 ${className}`}
    ></motion.div>
  );
};

export const CloseIcon = React.forwardRef<
  HTMLButtonElement,
  { onClick?: () => void }
>(({ onClick }, ref) => {
  const { setOpen } = useModal();
  const { erpIframe } = useErpIframe();

  const handleClick = () => {
    if (onClick) onClick();
    else setOpen(false);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={`group relative flex items-center justify-center h-9 w-9 rounded-full cursor-pointer text-sm font-medium focus:z-10 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] active:bg-red-600 active:text-white active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] transition duration-150 ease-in-out focus:outline-none focus:ring-0 ${erpIframe ? "text-red-400 bg-[#2a3441] border border-red-400/50" : "text-red-600 bg-white border border-red-300"}`}
    >
      <i className="pi pi-times text-lg transition-transform group-hover:scale-110" />
    </button>
  );
});

// Hook to detect clicks outside of a component.
export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement>,
  callback: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: any) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
