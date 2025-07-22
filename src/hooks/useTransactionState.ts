import type { TransactionSigner } from "algosdk";
import { useMemo, useState } from "react";

export type TransactionState =
  | "idle"
  | "loading"
  | "signing"
  | "sending"
  | "confirmed"
  | Error;


export function isLoadingState(state: TransactionState) {
  return state === "loading" || state === "signing" || state === "sending"
}

export type TransactionStateInfo = {
  status: TransactionState;
  setStatus: React.Dispatch<React.SetStateAction<TransactionState>>
  errorMessage?: string;
  setErrorMessage: (err: string) => void;
  reset: () => void;
  isPending: boolean;
}

export type StaticTransactionStateInfo = Omit<TransactionStateInfo, "setStatus" | "setErrorMessage" | "reset">;

export function useTransactionState() {
  const [status, setStatus] = useState<TransactionState>("idle");

  const reset = () => setStatus("idle")
  const errorMessage = status instanceof Error ? status?.message : undefined;
  const setErrorMessage = (err: string) => setStatus(new Error(err));
  const isPending = useMemo(() => isLoadingState(status), [status]);

  return {
    status,
    setStatus,
    errorMessage,
    setErrorMessage,
    reset,
    isPending,
  };
}

export function wrapTransactionSigner(
  transactionSigner: TransactionSigner,
  setStatus: (s: TransactionState) => void,
): TransactionSigner {
  return async function (txns, idxs) {
    setStatus("signing");
    const signed = await transactionSigner(txns, idxs);
    setStatus("sending");
    return signed
  };
}