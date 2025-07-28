import type { TransactionStateInfo } from "@/api/types/transaction_state";
import { useWallet } from "@txnlab/use-wallet-react";
import { CheckIcon } from "lucide-react";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";

export interface TransactionStateLoaderProps {
    defaultText: string;
    txnState: TransactionStateInfo;
}

export function TransactionStateLoader({ defaultText, txnState }: TransactionStateLoaderProps) {
    const { activeWallet } = useWallet();
    const walletName = activeWallet?.metadata.name;

    return (
        <>
            {
                (txnState.isPending && txnState.status === 'confirmed')
                    ? <CheckIcon className="size-4 text-algo-green dark:text-algo-black mr-2" />
                    : txnState.isPending
                        ? <LoadingSpinner className="mr-2" size="xs" variant='secondary' />
                        : null
            }
            {
                txnState.status === "signing"
                    ? `Sign in ${walletName}`
                    : txnState.status === "sending"
                        ? "Executing"
                        : defaultText
            }
        </>
    )
}