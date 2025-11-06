import React, { useEffect, useState } from "react";
import { isValidAddress } from "algosdk";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { removeCouncilMember } from "@/api";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { useCouncilGlobalState, useCouncilMembers } from "@/hooks";
import { TransactionStateLoader } from "@/components/TransactionStateLoader/TransactionStateLoader";
import { useWallet } from "@txnlab/use-wallet-react";
import type { TransactionState } from "@/api/types/transaction_state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CouncilList({ isAdmin }: { isAdmin: boolean }) {
  const { activeAddress, transactionSigner: innerSigner } = useWallet();
  const councilMembersQuery = useCouncilMembers();

  const [openTooltips, setOpenTooltips] = useState<{ [key: number]: boolean }>({});

  // Track transaction states for each council member
  const [memberStates, setMemberStates] = useState<Record<string, {
    status: TransactionState;
    errorMessage: string;
    isPending: boolean;
  }>>({});

  const handleCopyClick = (index: number, address: string) => {
    navigator.clipboard.writeText(address);
    setOpenTooltips(prev => ({ ...prev, [index]: true }));

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setOpenTooltips(prev => ({ ...prev, [index]: false }));
    }, 800);
  };

  const getOrCreateMemberState = (address: string) => {
    if (!memberStates[address]) {
      setMemberStates(prev => ({
        ...prev,
        [address]: {
          status: 'idle' as TransactionState,
          errorMessage: '',
          isPending: false
        }
      }));
      return {
        status: 'idle' as TransactionState,
        errorMessage: '',
        isPending: false
      };
    }
    return memberStates[address];
  };

  const setMemberStatus = (address: string, status: TransactionState) => {
    setMemberStates(prev => ({
      ...prev,
      [address]: {
        ...prev[address],
        status,
        errorMessage: status instanceof Error ? status.message : '',
        isPending: status === 'loading' || status === 'signing' || status === 'sending' || status === 'confirmed'
      }
    }));
  };

  return (
    <div className="relative">
      <ul className="flex flex-wrap gap-2 lg:gap-4">
        {councilMembersQuery?.data?.map((address, index) => {
          const memberState = getOrCreateMemberState(address);

          return (
            <li key={address} className="mb-2 flex items-center justify-between bg-algo-black-10 dark:bg-algo-black-90 text-algo-black dark:text-white p-2 md:p-4 rounded-lg w-full min-w-0 lg:max-w-xl">
              <div className="flex flex-col items-start w-full min-w-0">
                <span className="flex items-center gap-2 w-full min-w-0">
                  <p className="select-all font-mono text-xxs truncate flex-1 min-w-0">
                    {address}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip open={openTooltips[index] || false}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="p-1 h-6 dark:bg-algo-black-80"
                            onClick={() => handleCopyClick(index, address)}
                          >
                            <CopyIcon className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Copied!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {isAdmin && (
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => removeCouncilMember({
                          activeAddress,
                          innerSigner,
                          setStatus: (status: TransactionState) => setMemberStatus(address, status),
                          refetch: [councilMembersQuery.refetch],
                          address
                        })}
                      >
                        <TransactionStateLoader
                          defaultText="Remove"
                          txnState={{
                            status: memberState.status,
                            errorMessage: memberState.errorMessage,
                            isPending: memberState.isPending
                          }}
                        />
                      </Button>
                    )}
                  </div>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AddCouncilMemberModal({
  isOpen,
  onRequestClose,
  handleSubmitAddress,
  memberState
}: {
  isOpen: boolean;
  onRequestClose: () => void;
  handleSubmitAddress: (address: string) => Promise<boolean>;
  memberState: {
    status: TransactionState;
    errorMessage: string | undefined;
    isPending: boolean;
  };
}) {
  const [address, setAddress] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setIsValid(isValidAddress(newAddress));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      handleSubmitAddress(address).then((success) => {
        if (!success) {
          setErrorMessage("Failed to add member.");
        } else {
          errorMessage && setErrorMessage("");
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onRequestClose}>
      <DialogContent className="bg-white dark:bg-algo-black p-6 rounded-lg z-50 max-w-lg w-full">
        <DialogTitle className="text-2xl font-bold mb-4 text-center">
          Add Council Member
        </DialogTitle>
        <DialogClose asChild></DialogClose>
        <form onSubmit={handleFormSubmit}>
          <label className="block mb-2">
            Enter the address for the new Council Member:
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              className={`block w-full mt-1 p-2 dark:bg-algo-black border-2 rounded-md ${isValid ? "border-green-500" : "border-algo-red"}`}
            />
          </label>
          {errorMessage && (
            <div className="text-algo-red mb-4">{errorMessage}</div>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isValid}
            >
              <TransactionStateLoader
                defaultText="Submit"
                txnState={{
                  status: memberState.status,
                  errorMessage: memberState.errorMessage,
                  isPending: memberState.isPending
                }}
              />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
