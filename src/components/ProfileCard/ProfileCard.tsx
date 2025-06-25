import { network, type ProposerBoxState } from "@/api";
import { EditableAddress } from "../EditableAddress/EditableAddress";
import { ActionButton } from "../button/ActionButton/ActionButton";
import { cn } from "@/functions";
import { XGovProposerStatusPill } from "../XGovProposerStatusPill/XGovProposerStatusPill";
import { XGovStatusPill } from "../XGovStatusPill/XGovStatusPill";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { WarningNotice } from "../WarningNotice/WarningNotice";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import termsAndConditionsString from "./TermsAndConditionsText.md?raw";
import { TermsAndConditionsModal } from "@/recipes";
import { TestnetDispenserBanner } from "../TestnetDispenserBanner/TestnetDispenserBanner";

export interface ProfileCardProps {
  address: string;
  votingAddress: string;
  setVotingAddress: (votingAddress: string) => Promise<void>;
  setVotingAddressLoading: boolean;
  isXGov: boolean;
  xGovSignupCost: bigint;
  subscribeXgov: () => Promise<void>;
  unsubscribeXgov: () => Promise<void>;
  subscribeXGovLoading: boolean;
  proposer?: { isProposer: boolean } & ProposerBoxState;
  proposerSignupCost: bigint;
  subscribeProposer: () => Promise<void>;
  subscribeProposerLoading: boolean;
  activeAddress: string | null;
  className?: string;
}

export function ProfileCard({
  address,
  votingAddress,
  setVotingAddress,
  setVotingAddressLoading,
  isXGov,
  xGovSignupCost,
  subscribeXgov,
  unsubscribeXgov,
  subscribeXGovLoading,
  proposer,
  proposerSignupCost,
  subscribeProposer,
  subscribeProposerLoading,
  activeAddress,
  className = "",
}: ProfileCardProps) {
  const [showBecomeXGovModal, setShowBecomeXGovModal] = useState(false);
  const [showBecomeProposerModal, setShowBecomeProposerModal] = useState(false);
  const [showBecomeProposerTermsModal, setShowBecomeProposerTermsModal] =
    useState(false);

  return (
    <>
      <div
        className={cn(
          className,
          "relative bg-white dark:bg-algo-black dark:border-white text-algo-black dark:text-white rounded-lg",
        )}
      >
        <div className="w-full flex flex-col gap-4">
          <div className="flex gap-6">
            <XGovStatusPill
              isXGov={isXGov}
              unsubscribeXgov={unsubscribeXgov}
              unsubscribeXGovLoading={subscribeXGovLoading}
              disabled={address !== activeAddress}
            />
            {!proposer ||
              (proposer?.isProposer && !proposer.kycStatus && (
                <XGovProposerStatusPill proposer={proposer} />
              ))}
          </div>

          <TestnetDispenserBanner />

          {address === activeAddress && !isXGov ? (
            <ActionButton
              type="button"
              onClick={() => setShowBecomeXGovModal(true)}
              disabled={subscribeXGovLoading}
            >
              {subscribeXGovLoading
                ? "Loading..."
                : "Become an xGov"}
            </ActionButton>
          ) : (
            <EditableAddress
              title="Voting Address"
              defaultValue={votingAddress}
              loading={setVotingAddressLoading}
              onSave={(v) => {
                setVotingAddress(v);
              }}
              disabled={address !== activeAddress}
            />
          )}

          <div>
            <div className="flex items-center gap-2">
              {!proposer?.isProposer && (
                <ActionButton
                  type="button"
                  onClick={() => setShowBecomeProposerTermsModal(true)}
                  disabled={subscribeProposerLoading}
                >
                  {subscribeProposerLoading
                    ? "Loading..."
                    : "Become a Proposer"}
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <BecomeXGovModal
        isOpen={showBecomeXGovModal}
        onClose={() => setShowBecomeXGovModal(false)}
        onSignup={subscribeXgov}
        costs={xGovSignupCost}
      />

      <TermsAndConditionsModal
        title="xGov Proposer Terms & Conditions"
        description={
          <>
            <div>
              By becoming a proposer, you will be able to submit funding
              proposals.
            </div>
            <div>
              Proposers need to agree to the Terms and Conditions below.
            </div>
          </>
        }
        terms={termsAndConditionsString}
        isOpen={showBecomeProposerTermsModal}
        onClose={() => setShowBecomeProposerTermsModal(false)}
        onAccept={() => {
          setShowBecomeProposerTermsModal(false);
          setShowBecomeProposerModal(true);
        }}
      />

      <BecomeProposerModal
        isOpen={showBecomeProposerModal}
        onClose={() => setShowBecomeProposerModal(false)}
        onSignup={subscribeProposer}
        costs={proposerSignupCost}
      />
    </>
  );
}

interface BecomeXGovModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => Promise<void>;
  costs: bigint;
  errorMessage?: string;
}

export function BecomeXGovModal({
  isOpen,
  onClose,
  onSignup,
  costs,
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
          <Button onClick={onSubmit}>Signup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BecomeProposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => Promise<void>;
  costs: bigint;
  errorMessage?: string;
}

export function BecomeProposerModal({
  isOpen,
  onClose,
  onSignup,
  costs,
  errorMessage,
}: BecomeProposerModalProps) {
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
          <DialogTitle className="dark:text-white">
            Become a Proposer?
          </DialogTitle>
          <DialogDescription>
            By becoming a proposer, you will be able to submit proposals for the
            community to vote on. There's a one time proposer sign up fee for
            your address. Your profile will be valid after KYC has been
            completed.
          </DialogDescription>
          <WarningNotice
            title="Proposer Signup Fee"
            description={
              <>
                It will cost&nbsp;
                <span className="inline-flex items-center gap-1">
                  <AlgorandIcon className="size-2.5" />
                  {Number(costs) / 1_000_000}
                </span>
                &nbsp;to become a proposer. {network !== "testnet" ? null : <><br />On testnet, this fee is sponsored.</>}
              </>
            }
          />
        </DialogHeader>
        {errorMessage && <p className="text-algo-red">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Signup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
