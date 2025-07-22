import { useState, type ReactNode } from "react";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";
import { useProposer, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { useWallet } from "@txnlab/use-wallet-react";
import { ProposalFilter } from "@/recipes";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { openProposal } from "@/api";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { WarningNotice } from "../WarningNotice/WarningNotice";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import { queryClient } from "@/stores";
import { useTransactionState } from "@/hooks/useTransactionState";

export function ProposalListHeaderIsland({ title }: { title: string }) {

  return (
    <UseQuery>
      <UseWallet>
        <ProposalListHeader title={title}>
          <ProposalFilter />
        </ProposalListHeader>
      </UseWallet>
    </UseQuery>
  );
}

export interface ProposalListHeaderProps {
  title: string;
  children: ReactNode;
}

export function ProposalListHeader({
  title,
  children,
}: ProposalListHeaderProps) {
  const { activeAddress, transactionSigner } = useWallet();
  const registry = useRegistry();
  const proposer = useProposer(activeAddress);
  const [showOpenProposalModal, setShowOpenProposalModal] = useState(false);
  // const [openProposalLoading, setOpenProposalLoading] = useState(false);
  // const [openProposalError, setOpenProposalError] = useState<string>('');

  const validProposer =
    (proposer?.data &&
      proposer.data.kycStatus &&
      proposer.data.kycExpiring > Date.now() / 1000) ||
    false;

  const {
    status,
    setStatus,
    errorMessage,
    setErrorMessage,
    reset,
    isPending
  } = useTransactionState();

  return (
    <div className="flex items-center justify-between mb-4 px-3">
      <div className="sm:flex-auto">
        <h1 id="list-header-title" className="text-lg sm:text-2xl md:text-4xl font-semibold text-algo-blue dark:text-algo-teal">
          {title}
        </h1>
      </div>
      <div className="sm:ml-16 sm:mt-0 sm:flex-none flex flex-wrap-reverse justify-end items-center gap-2 md:gap-6">
        {children}
        {
          validProposer && (
            <>
              <InfinityMirrorButton
                variant="secondary"
                size="sm"
                onClick={() => setShowOpenProposalModal(true)}
                disabled={proposer.data?.activeProposal}
                disabledMessage="You already have an active proposal"
              >
                {
                  isPending
                    ? (<div className="animate-spin h-4 w-4 border-2 border-white dark:border-algo-black border-t-transparent dark:border-t-transparent rounded-full"></div>)
                    : "Create Proposal"
                }
              </InfinityMirrorButton>
              <ConfirmationModal
                isOpen={showOpenProposalModal}
                onClose={() => {
                  setShowOpenProposalModal(false)
                  reset();
                }}
                title="Create Proposal"
                description="Are you sure you want to create a new proposal? You can only have one active proposal at a time."
                warning={
                  <WarningNotice
                    title="Proposal Fee"
                    description={<>
                      It will cost
                      <span className="inline-flex items-center mx-1 gap-1">
                        <AlgorandIcon className="size-2.5" />{Number(registry.data?.openProposalFee || 0n) / 1_000_000}
                      </span>
                      to create a proposal.
                    </>}
                  />
                }
                submitText="Confirm"
                onSubmit={async () => {
                  if (!activeAddress) {
                    console.error("No active address");
                    return;
                  }

                  try {
                    const appId = await openProposal(
                      activeAddress,
                      transactionSigner,
                      setStatus
                    )

                    if (appId) {
                      queryClient.invalidateQueries({ queryKey: ["getProposalsByProposer", activeAddress] })
                      navigate(`/new?appId=${appId}`)
                    }
                  } catch (error) {
                    console.error("Error opening proposal:", error);
                  }
                }}
                txnState={{
                  status,
                  errorMessage,
                  isPending
                }}
              />
            </>
          )
        }
      </div>
    </div>
  );
}
