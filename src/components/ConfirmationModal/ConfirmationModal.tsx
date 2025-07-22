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
import { type StaticTransactionStateInfo, type TransactionState } from "@/hooks/useTransactionState";

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
  txnState: StaticTransactionStateInfo;
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
  txnState,
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
        {txnState instanceof Error && <p className="text-algo-red">{txnState.errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={submitVariant}
            onClick={() => onSubmit()}
            disabled={txnState.isPending}
          >
            {txnState.status === "signing"
              ? `Sign in ${walletName}`
              : txnState.status === "sending"
                ? "Executing"
                : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
