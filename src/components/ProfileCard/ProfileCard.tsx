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
import { BecomeProposerModal } from "../BecomeProposerModal/BecomeProposerModal";
import { BecomeXGovModal } from "../BecomeXGovModal/BecomeXGovModal";

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
  const [showBecomeProposerTermsModal, setShowBecomeProposerTermsModal] = useState(false);

  return (
    <>
      <div
        className={cn(
          className,
          "relative bg-white dark:bg-algo-black dark:border-white text-algo-black dark:text-white rounded-lg",
        )}
      >
        <div className="w-full flex flex-col gap-4">
          <TestnetDispenserBanner />

          <div>
            <div className="flex items-center gap-6">
              <XGovStatusPill
                isXGov={isXGov}
                unsubscribeXgov={unsubscribeXgov}
                unsubscribeXGovLoading={subscribeXGovLoading}
                disabled={address !== activeAddress}
              />
              {address === activeAddress && !isXGov && (
                <ActionButton
                  type="button"
                  onClick={() => setShowBecomeXGovModal(true)}
                  disabled={subscribeXGovLoading}
                >
                  {subscribeXGovLoading
                    ? "Loading..."
                    : "Become an xGov"}
                </ActionButton>
              )}
            </div>
          </div>

          {
            isXGov && (
              <EditableAddress
                title="Voting Address"
                defaultValue={votingAddress}
                loading={setVotingAddressLoading}
                onSave={(v) => {
                  setVotingAddress(v);
                }}
                disabled={address !== activeAddress}
              />
            )
          }


          <div>
            <div className="flex items-center gap-6">
              <XGovProposerStatusPill proposer={proposer} />

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

