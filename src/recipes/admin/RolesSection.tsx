import React, { useEffect, useState } from "react";
import { isValidAddress } from "algosdk";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import type { RegistryGlobalState } from "@/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";

const rolePretty: { [key: string]: string } = {
  kycProvider: "KYC Provider",
  xGovManager: "xGov Manager",
  committeePublisher: "Committee Publisher",
  committeeManager: "Committee Manager",
  xGovPayor: "xGov Payor",
  xGovReviewer: "xGov Reviewer",
  xGovSubscriber: "xGov Subscriber",
};

export function RoleList({
  registryGlobalState,
  activeAddress,
  xGovManager,
  handleSetRole,
}: {
  registryGlobalState: RegistryGlobalState;
  activeAddress: string;
  xGovManager: string;
  handleSetRole: (role: string) => void;
}) {
  const [openTooltips, setOpenTooltips] = useState<{ [key: string]: boolean }>({});

  const handleCopyClick = (role: string, address: string) => {
    navigator.clipboard.writeText(address);
    setOpenTooltips(prev => ({ ...prev, [role]: true }));

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setOpenTooltips(prev => ({ ...prev, [role]: false }));
    }, 800);
  };

  const roles = new Map<string, string>([
    ["kycProvider", registryGlobalState.kycProvider],
    ["xGovManager", registryGlobalState.xgovManager],
    ["committeePublisher", registryGlobalState.committeePublisher],
    ["committeeManager", registryGlobalState.committeeManager],
    ["xGovPayor", registryGlobalState.xgovPayor],
    ["xGovReviewer", registryGlobalState.xgovReviewer],
    ["xGovSubscriber", registryGlobalState.xgovSubscriber],
  ]);

  return (
    <div className="relative">
      <ul className="flex flex-wrap gap-2 lg:gap-4">
        {Array.from(roles.entries()).map(([role, address]) => (
          <li key={role} className="mb-2 flex items-center justify-between bg-algo-black-10 dark:bg-algo-black-90 text-algo-black dark:text-white p-2 md:p-4 rounded-lg w-full min-w-0 lg:max-w-xl">
            <div className="flex flex-col items-start w-full min-w-0">
              <span className="font-semibold text-algo-black-80 dark:text-algo-black-30 w-48">{rolePretty[role]}</span>
              <span className="flex items-center gap-2 w-full min-w-0">
                <p className="select-all font-mono text-xxs truncate flex-1 min-w-0">
                  {address ? address : "Not set"}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {address && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip open={openTooltips[role] || false}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="xs"
                            className="p-1 h-6 dark:bg-algo-black-80"
                            onClick={() => handleCopyClick(role, address)}
                          >
                            <CopyIcon className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Copied!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {xGovManager && activeAddress === xGovManager && (
                    <Button
                      size="xs"
                      onClick={() => handleSetRole(role)}
                    >
                      Update
                    </Button>
                  )}
                </div>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoleModal({
  isOpen,
  onRequestClose,
  role,
  handleSubmitAddress,
}: {
  isOpen: boolean;
  onRequestClose: () => void;
  role: string;
  handleSubmitAddress: (address: string) => Promise<boolean>;
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
          setErrorMessage("Failed to set role.");
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
          Set {rolePretty[role]}
        </DialogTitle>
        <DialogClose asChild></DialogClose>
        <form onSubmit={handleFormSubmit}>
          <label className="block mb-2">
            Enter the new address for {rolePretty[role]}:
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
              // className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={!isValid}
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
