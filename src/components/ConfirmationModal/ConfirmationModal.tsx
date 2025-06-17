import { useWallet } from "@txnlab/use-wallet-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useState } from "react";

export type TransactionStatus =
  | "idle"
  | "loading"
  | "signing"
  | "sending"
  | "error";

export function useTransactionState() {
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [errorMessage, _setErrorMessage] = useState("");

  const reset = () => {
    setStatus("idle");
    setErrorMessage("");
  };
  const setErrorMessage = (err: string) => {
    setStatus("error");
    _setErrorMessage(err);
  };

  return {
    status,
    setStatus,
    errorMessage,
    setErrorMessage,
    reset,
  };
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  warning?: JSX.Element;
  submitVariant?:
    | "default"
    | "link"
    | "destructive"
    | "success"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  submitText?: string;
  onSubmit: () => Promise<void>;
  transactionStatus: TransactionStatus;
  errorMessage?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  warning,
  submitVariant = "default",
  submitText = "Submit",
  onSubmit,
  transactionStatus,
  errorMessage = "",
}: ConfirmationModalProps) {
  const { activeWallet } = useWallet();

  const walletName = activeWallet?.metadata.name;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          {!!title && (
            <DialogTitle className="dark:text-white">{title}</DialogTitle>
          )}
          {!!description && (
            <DialogDescription>{description}</DialogDescription>
          )}
          {!!warning && warning}
        </DialogHeader>
        {errorMessage && <p className="text-algo-red">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={submitVariant}
            onClick={() => onSubmit()}
            disabled={
              transactionStatus === "signing" || transactionStatus === "sending"
            }
          >
            {transactionStatus === "signing"
              ? `Sign in ${walletName}`
              : transactionStatus === "sending"
                ? "Executing"
                : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
