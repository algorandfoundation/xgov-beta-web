import { useState, useEffect } from "react";
import { cn, shortenAddress } from "@/functions";
import type { ProposerBoxState } from "@/api";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";

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

  const [action, setAction] = useState<"approve" | "disqualify" | "expire" | undefined>(undefined);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentKYCStatus, setCurrentKYCStatus] = useState(kyc_status);
  const [currentExpiryDate, setCurrentExpiryDate] = useState(expiry_date);

  // reset error messages whenever dialog is closed
  useEffect(() => {
    if (!showConfirmDialog)
      setErrorMessage("")
  }, [showConfirmDialog])

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
        setShowConfirmDialog(false);
      } else {
        setErrorMessage("Failed to approve KYC status.");
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
      }
    });
  };

  const handleButtonClick = () => {
    if (isExpired) {
      handleReset();
    } else if (currentKYCStatus) {
      setShowConfirmDialog(true);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && Date.now() > date.getTime()) {
      setAction("expire");
    } else if (date) {
      setAction("approve");
    }
    setShowConfirmDialog(true);
    setSelectedDate(date);
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
        ? "bg-gradient-to-r from-algo-green/20 to-algo-black-10 dark:to-algo-black-90"
        : isExpired
          ? "bg-gradient-to-r from-algo-orange/20 dark:from-algo-yellow to-algo-black-10 dark:to-algo-black-90"
          : "bg-gradient-to-r from-algo-red/20 to-algo-black-10 dark:to-algo-black-90"
    )}>
      <div className="flex gap-2 items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xxs font-mono select-all">
            {proposalAddress}
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <ConfirmationModal
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setAction(undefined)
        }}
        title={
          action === "approve"
            ? "Confirm Approving KYC Status"
            : action === "expire"
              ? "Confirm Expired KYC Status"
              : "Confirm Disqualifying KYC Status"
        }
        description={
          selectedDate && Date.now() > selectedDate.getTime()
            ? `The selected date is in the past. Do you want to proceed with an expired KYC status?`
            : `${action === "approve" ? "Approve" : "Disqualify"} KYC for ${shortenAddress(proposalAddress)}?`
        }
        submitVariant={ action !== 'approve' ? "destructive" : "default"}
        onSubmit={async () => {
          action === "approve" ? handleApprove(selectedDate!) :
          selectedDate && Date.now() > selectedDate.getTime()
            ? handleConfirmExpiredKYC()
            : handleDisqualify()
        }}
        loading={loading}
        errorMessage={errorMessage}
      />
    </div>
  );
}
