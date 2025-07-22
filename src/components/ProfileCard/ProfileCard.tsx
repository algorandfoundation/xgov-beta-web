import { type ProposerBoxState } from "@/api";
import { EditableAddress } from "../EditableAddress/EditableAddress";
import { ActionButton } from "../button/ActionButton/ActionButton";
import { cn } from "@/functions";
import { XGovProposerStatusPill } from "../XGovProposerStatusPill/XGovProposerStatusPill";
import { XGovStatusPill } from "../XGovStatusPill/XGovStatusPill";
import { useState } from "react";
import termsAndConditionsString from "./TermsAndConditionsText.md?raw";
import { TermsAndConditionsModal } from "@/recipes";
import { TestnetDispenserBanner } from "../TestnetDispenserBanner/TestnetDispenserBanner";

import { BecomeProposerModal } from "../BecomeProposerModal/BecomeProposerModal";
import { BecomeXGovModal } from "../BecomeXGovModal/BecomeXGovModal";
import type { StaticTransactionStateInfo } from "@/hooks/useTransactionState";

export interface ProfileCardProps {
  address: string;

  votingAddress: string;
  setVotingAddress: (votingAddress: string) => Promise<void>;
  setVotingAddressState: StaticTransactionStateInfo;

  isXGov: boolean;
  xGovSignupCost: bigint;

  subscribeXgov: () => Promise<void>;
  unsubscribeXgov: () => Promise<void>;
  subscribeXGovState: StaticTransactionStateInfo;

  proposer?: { isProposer: boolean } & ProposerBoxState;
  proposerSignupCost: bigint;
  subscribeProposer: () => Promise<void>;
  subscribeProposerState: StaticTransactionStateInfo;
  
  activeAddress: string | null;
  className?: string;
}

export function ProfileCard({
  address,

  votingAddress,
  setVotingAddress,
  setVotingAddressState,

  isXGov,
  xGovSignupCost,
  subscribeXgov,
  unsubscribeXgov,
  subscribeXGovState,

  proposer,
  proposerSignupCost,
  subscribeProposer,
  subscribeProposerState,
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
                unsubscribeXGovLoading={subscribeXGovState.isPending}
                disabled={address !== activeAddress}
              />
              {address === activeAddress && !isXGov && (
                <ActionButton
                  type="button"
                  onClick={() => setShowBecomeXGovModal(true)}
                  disabled={subscribeXGovState.isPending}
                >
                  {
                    subscribeXGovState.isPending
                      ? "Loading..."
                      : "Become an xGov"
                  }
                </ActionButton>
              )}
            </div>
          </div>

          {
            isXGov && (
              <EditableAddress
                title="Voting Address"
                defaultValue={votingAddress}
                loading={setVotingAddressState.isPending}
                onSave={(v) => {
                  setVotingAddress(v);
                }}
                disabled={address !== activeAddress}
              />
            )
          }

          <div>
            <div className="flex items-center gap-6">
              {
                (!proposer?.isProposer || !proposer?.kycStatus) && (
                  <XGovProposerStatusPill proposer={proposer} />
                )
              }

              {!proposer?.isProposer && (
                <ActionButton
                  type="button"
                  onClick={() => setShowBecomeProposerTermsModal(true)}
                  disabled={subscribeProposerState.isPending}
                >
                  {subscribeProposerState.isPending
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
        txnState={subscribeXGovState}
      />

      <TermsAndConditionsModal
        title="xGov Proposer Terms & Conditions"
        description={
          <>
            <span>
              By becoming a proposer, you will be able to submit funding
              proposals.
            </span>
            <span>
              Proposers need to agree to the Terms and Conditions below.
            </span>
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
        txnState={subscribeProposerState}
      />
    </>
  );
}

