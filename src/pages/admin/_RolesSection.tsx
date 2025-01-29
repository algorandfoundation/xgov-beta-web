import React, { useEffect, useState } from "react";
import { isValidAddress } from "algosdk";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import type { TypedGlobalState } from "@algorandfoundation/xgov/registry";

const rolePretty: { [key: string]: string } = {
  kycProvider: 'KYC Provider',
  xGovManager: 'xGov Manager',
  committeePublisher: 'Committee Publisher',
  committeeManager: 'Committee Manager',
  xGovPayor: 'xGov Payor',
  xGovReviewer: 'xGov Reviewer',
  xGovSubscriber: 'xGov Subscriber',
};

export function RoleList({ registryGlobalState, activeAddress, xGovManager, handleSetRole }: { registryGlobalState: TypedGlobalState, activeAddress: string, xGovManager: string, handleSetRole: (role: string) => void }) {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Address copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  const roles = new Map<string, string>([
    ['kycProvider', registryGlobalState.kycProvider],
    ['xGovManager', registryGlobalState.xgovManager],
    ['committeePublisher', registryGlobalState.committeePublisher],
    ['committeeManager', registryGlobalState.committeeManager],
    ['xGovPayor', registryGlobalState.xgovPayor],
    ['xGovReviewer', registryGlobalState.xgovReviewer],
    ['xGovSubscriber', registryGlobalState.xgovSubscriber],
  ]);

  return (
    <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
      <ul>
        {Array.from(roles.entries()).map(([role, address]) => (
          <li key={role} className="mb-2 flex items-center justify-between">
            <div className="flex items-center w-full">
              <span className="font-semibold w-48">{rolePretty[role]}:</span>
              <span className="flex-1 truncate" title={address ? address : 'Not set'}>
                <span className="select-all">{address ? address : 'Not set'}</span>
              </span>
              {address && (
                <button
                  onClick={() => handleCopyToClipboard(address)}
                  className="ml-2 px-2 py-1 bg-gray-300 text-black rounded cursor-pointer"
                >
                  Copy
                </button>
              )}
              {xGovManager && activeAddress === xGovManager && (
                <button
                  onClick={() => handleSetRole(role)}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white rounded cursor-pointer"
                >
                  Set Role
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoleModal({ isOpen, onRequestClose, role, handleSubmitAddress }: { isOpen: boolean, onRequestClose: () => void, role: string, handleSubmitAddress: (address: string) => Promise<boolean> }) {
  const [address, setAddress] = useState('');
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
        <DialogTitle className="text-2xl font-bold mb-4 text-center">Set {rolePretty[role]}</DialogTitle>
        <DialogClose asChild>
        </DialogClose>
        <form onSubmit={handleFormSubmit}>
          <label className="block mb-2">
            Address:
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              className={`block w-full mt-1 p-2 border rounded ${isValid ? 'border-green-500' : 'border-red-500'}`}
            />
          </label>
          {errorMessage && (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={!isValid}
            >
              Submit
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}