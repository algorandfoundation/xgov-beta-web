import { network } from "@/api";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { WarningNotice } from "../WarningNotice/WarningNotice";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import type { StaticTransactionStateInfo } from "@/hooks/useTransactionState";
import { useWallet } from "@txnlab/use-wallet-react";
import { CheckIcon } from "lucide-react";

export interface BecomeXGovModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => Promise<void>;
  costs: bigint;
  txnState: StaticTransactionStateInfo
}

export function BecomeXGovModal({
  isOpen,
  onClose,
  onSignup,
  costs,
  txnState
}: BecomeXGovModalProps) {
  const { activeWallet } = useWallet();
  const walletName = activeWallet?.metadata.name;

  const onSubmit = async () => {
    try {
      await onSignup();
      onClose();
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">Become an xGov?</DialogTitle>
          <DialogDescription>
            By becoming an xGov, you will be able to vote on proposals based on
            your accounts participation in consensus.
          </DialogDescription>
          <WarningNotice
            title="xGov Signup Fee"
            description={
              <>
                It will cost&nbsp;
                <span className="inline-flex items-center gap-1">
                  <AlgorandIcon className="size-2.5" />
                  {Number(costs) / 1_000_000}
                </span>
                &nbsp;to become an xGov. {network !== "testnet" ? null : <><br />On testnet, this fee is sponsored.</>}
              </>
            }
          />
        </DialogHeader>
        {txnState.errorMessage && <p className="text-algo-red">{txnState.errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={txnState.isPending}
          >
            Cancel
          </Button>
          <Button
            className="group"
            onClick={onSubmit}
            disabled={txnState.isPending}
          >
            {
              (!txnState.isPending || txnState.status === 'confirmed')
                ? <CheckIcon className="text-algo-green h-4 w-4 mr-2 dark:text-algo-black" />
                : txnState.isPending && <LoadingSpinner className="mr-2" size="xs" variant='secondary' />
            }
            {txnState.status === "signing"
              ? `Sign in ${walletName}`
              : txnState.status === "sending"
                ? "Executing"
                : "Signup"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
