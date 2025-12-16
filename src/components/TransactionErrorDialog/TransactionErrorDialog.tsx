import type { TransactionState } from "@/api/types/transaction_state";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "../ui/dialog";
import { CopyButton } from "../CopyButton/CopyButton";
import { Button } from "../ui/button";

// TODO we could ignore some errors, e.g. "User Cancelled Request" when they reject signing
export function TransactionErrorDialog({
  status,
  setStatus,
}: {
  status: TransactionState;
  setStatus: (status: TransactionState) => void;
}) {
  const message = status instanceof Error ? status.message : ""; // won't show without instanceof Error
  return (
    <Dialog open={status && status instanceof Error}>
      <DialogContent
        className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
        onCloseClick={() => setStatus("idle")}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">
            Transaction Error
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-8">
          <CopyButton value={message}>Copy Error</CopyButton>
          <Button variant="secondary" onClick={() => setStatus("idle")}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
