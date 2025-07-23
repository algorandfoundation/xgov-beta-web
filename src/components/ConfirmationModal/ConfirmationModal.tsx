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

import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import { CheckIcon } from "lucide-react";
import type { TransactionStateInfo } from "@/api/types/transaction_state";

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
  txnState: TransactionStateInfo;
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
        {txnState.status instanceof Error && <p className="text-algo-red">{txnState.errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose} disabled={txnState.isPending}>
            Cancel
          </Button>
          <Button
            variant={submitVariant}
            onClick={() => onSubmit()}
            disabled={txnState.isPending}
          >
            {
              (txnState.isPending && txnState.status === 'confirmed')
                ? <CheckIcon className="text-algo-green h-4 w-4 mr-2 dark:text-algo-black" />
                : txnState.isPending
                  ? <LoadingSpinner className="mr-2" size="xs" variant='secondary' />
                  : null
            }
            {
              txnState.status === "signing"
                ? `Sign in ${walletName}`
                : txnState.status === "sending"
                  ? "Executing"
                  : submitText
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
