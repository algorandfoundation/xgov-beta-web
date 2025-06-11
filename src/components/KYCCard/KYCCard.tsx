import { useState, useEffect, type ChangeEvent } from "react";
import { cn } from "@/functions";
import { ErrorModal } from "@/components/ErrorModal/ErrorModal";
import type { ProposerBoxState } from "@/api";
import { Button } from "../ui/button";

export interface KYCCardProps {
  proposalAddress: string;
  values: ProposerBoxState;
  callSetProposerKYC: (
    proposalAddress: string,
    status: boolean,
    expiration: number,
  ) => Promise<boolean>;
}

export function KYCCard({
  proposalAddress,
  values,
  callSetProposerKYC,
}: KYCCardProps) {
  const kyc_status = values.kycStatus;
  const expiry_date = Number(values.kycExpiring);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentKYCStatus, setCurrentKYCStatus] = useState(kyc_status);
  const [currentExpiryDate, setCurrentExpiryDate] = useState(expiry_date);

  useEffect(() => {
    setIsExpired(
      currentExpiryDate ? Date.now() > currentExpiryDate * 1000 : false,
    );
  }, [currentExpiryDate]);

  const handleApprove = (date: Date) => {
    const dateInSeconds = Math.floor(date.getTime() / 1000);

    callSetProposerKYC(proposalAddress, true, dateInSeconds).then((success) => {
      if (success) {
        setCurrentKYCStatus(true);
        setCurrentExpiryDate(dateInSeconds);
        setShowDatePicker(false);
      } else {
        setErrorMessage("Failed to approve KYC status.");
        setErrorModalOpen(true);
      }
    });
  };

  const handleDisqualify = () => {
    callSetProposerKYC(proposalAddress, false, 0).then((success) => {
      if (success) {
        setCurrentKYCStatus(false);
        setCurrentExpiryDate(0);
        setShowConfirmDialog(false);
      } else {
        setErrorMessage("Failed to disqualify KYC status.");
        setErrorModalOpen(true);
      }
    });
  };

  const handleReset = () => {
    callSetProposerKYC(proposalAddress, false, 0).then((success) => {
      if (success) {
        setCurrentKYCStatus(false);
        setCurrentExpiryDate(0);
      } else {
        setErrorMessage("Failed to reset KYC status.");
        setErrorModalOpen(true);
      }
    });
  };

  const handleButtonClick = () => {
    if (isExpired) {
      handleReset();
    } else if (currentKYCStatus) {
      setShowConfirmDialog(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (Date.now() > selectedDate.getTime()) {
      setSelectedDate(selectedDate);
      setShowConfirmDialog(true);
    } else {
      handleApprove(selectedDate);
    }
  };

  const handleConfirmExpiredKYC = () => {
    if (selectedDate) {
      handleApprove(selectedDate);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className={cn(
      "p-2 rounded-md dark:text-white",
      currentKYCStatus
        ? "bg-gradient-to-br from-algo-green/20 to-algo-black-10 dark:to-algo-black-90"
        : isExpired
          ? "bg-gradient-to-br from-algo-orange/20 dark:from-algo-yellow to-algo-black-10 dark:to-algo-black-90"
          : "bg-gradient-to-br from-algo-red/20 to-algo-black-10 dark:to-algo-black-90"
    )}>
      <div className="flex gap-2 items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xxs font-mono">
            {proposalAddress}
          </span>
        </div>

        <Button
          size="xs"
          onClick={handleButtonClick}
          className={cn(
            isExpired
              ? "bg-algo-orange dark:bg-algo-yellow text-white border-algo-orange dark:border-algo-yellow"
              : currentKYCStatus
                ? "bg-algo-red text-white dark:text-white border-algo-red dark:bg-algo-red dark:border-algo-red"
                : "bg-algo-green text-white border-algo-green",
          )}
        >
          {isExpired
            ? "Expired"
            : currentKYCStatus
              ? "Disqualify"
              : "Approve"}
        </Button>
        {showDatePicker && (
          <input
            type="date"
            className="ml-2 px-2 py-1.5 text-sm rounded-sm outline-none focus:bg-white dark:focus:bg-algo-black-90"
            onChange={handleDateChange}
          />
        )}
      </div>
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-algo-black p-4 rounded-lg shadow-lg">
            <p className="mb-4">
              {selectedDate && Date.now() > selectedDate.getTime()
                ? `The selected date is in the past. Do you want to proceed with an expired KYC status?`
                : `Confirm disqualify KYC status of ${proposalAddress}?`}
            </p>
            <div className="flex justify-end">
              <button
                className="mr-2 px-4 py-2 bg-algo-red text-white rounded"
                onClick={
                  selectedDate && Date.now() > selectedDate.getTime()
                    ? handleConfirmExpiredKYC
                    : handleDisqualify
                }
              >
                Yes
              </button>
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
                onClick={() => setShowConfirmDialog(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
}
