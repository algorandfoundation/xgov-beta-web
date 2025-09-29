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
import type { TransactionStateInfo } from "@/api/types/transaction_state";
import { VotingFor } from "../VotingFor/VotingFor";
import { useXGovDelegates } from "@/hooks";
import { ExternalLink } from "lucide-react";

export interface ProfileCardProps {
  address: string;

  votingAddress: string;
  setVotingAddress: (votingAddress: string) => Promise<void>;
  setVotingAddressState: TransactionStateInfo;

  isXGov: boolean;
  xGovSignupCost: bigint;

  subscribeXgov: () => Promise<void>;
  unsubscribeXgov: () => Promise<void>;
  subscribeXGovState: TransactionStateInfo;

  proposer?: { isProposer: boolean } & ProposerBoxState;
  proposerSignupCost: bigint;
  subscribeProposer: () => Promise<void>;
  subscribeProposerState: TransactionStateInfo;

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
  const delegates = useXGovDelegates(address);
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

          <VotingFor
            delegates={delegates.data || []}
            isLoading={delegates.isLoading}
            isError={delegates.isError}
          />

          <div>
            <div className="flex items-center gap-6">
              {
                (!proposer?.isProposer || !proposer?.kycStatus) && (
                  <div className="flex flex-col">
                    <div className="flex flex-col gap-2 my-4">
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-algo-blue dark:text-algo-teal hover:underline"
                      >
                        View Terms & Conditions
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {!proposer?.isProposer
                      ? (
                        <div className="flex items-center gap-6">
                          <XGovProposerStatusPill proposer={proposer} />
                          <ActionButton
                            type="button"
                            onClick={() => setShowBecomeProposerTermsModal(true)}
                            disabled={subscribeProposerState.isPending}
                          >
                            {subscribeProposerState.isPending
                              ? "Loading..."
                              : "Become a Proposer"}
                          </ActionButton>
                        </div>
                      ) : (
                        <XGovProposerStatusPill proposer={proposer} />
                      )
                    }


                    {
                      proposer?.isProposer && !proposer?.kycStatus && (
                        <div className="mt-4 mb-2 p-4 bg-algo-blue/5 dark:bg-algo-teal/5 border border-algo-blue/20 dark:border-algo-teal/20 rounded-lg">
                          <h4 className="text-sm font-medium text-algo-black dark:text-white mb-2">
                            KYC Verification Required
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            To complete your Proposer registration, you need to verify your identity through our KYC process.
                            If you've already completed KYC verification, you can ignore this message.
                          </p>
                          <ActionButton
                            type="button"
                            onClick={() => window.open("https://in.sumsub.com/websdk/p/uni_nkxmvJFJATzDsSTA", "_blank", "noopener,noreferrer")}
                            disabled={false}
                          >
                            <span className="inline-flex items-center gap-2 text-sm">
                              Start KYC Verification
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </ActionButton>
                        </div>
                      )
                    }
                  </div>
                )
              }

              {proposer?.isProposer && proposer?.kycStatus && (
                <div className="flex flex-col gap-2 mb-2">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-algo-blue dark:text-algo-teal hover:underline"
                  >
                    View Terms & Conditions
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
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

