import { network } from "@/api";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { WarningNotice } from "../WarningNotice/WarningNotice";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";

export interface BecomeXGovModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => Promise<void>;
  costs: bigint;
  loading?: boolean;
  errorMessage?: string;
}

export function BecomeXGovModal({
  isOpen,
  onClose,
  onSignup,
  costs,
  loading = false,
  errorMessage,
}: BecomeXGovModalProps) {
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
        {errorMessage && <p className="text-algo-red">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            { loading ? (<LoadingSpinner size="xs" />) : 'Signup' }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
