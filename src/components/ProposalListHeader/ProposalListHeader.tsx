import { useState, type ReactNode } from "react";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";
import { useProposer, UseQuery, useRegistry, UseWallet } from "@/hooks";
import { useWallet } from "@txnlab/use-wallet-react";
import { ProposalFilter } from "@/recipes";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { openProposal } from "@/api";
import { navigate } from "astro/virtual-modules/transitions-router.js";

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
  const [openProposalLoading, setOpenProposalLoading] = useState(false);

  const validProposer =
    (proposer?.data &&
      proposer.data.kycStatus &&
      proposer.data.kycExpiring > Date.now() / 1000) ||
    false;

  return (
    <div className="flex items-center justify-between mb-4 px-3">
      <div className="sm:flex-auto">
        <h1 className="text-lg sm:text-2xl md:text-4xl font-semibold text-algo-blue dark:text-algo-teal">
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
                Open Proposal
              </InfinityMirrorButton>
              {
                showOpenProposalModal && (
                  <ConfirmationModal
                    isOpen={showOpenProposalModal}
                    onClose={() => setShowOpenProposalModal(false)}
                    title="Open Proposal"
                    description="Are you sure you want to open a new proposal? You can only have one active proposal at a time."
                    warningTitle="Proposal Fee"
                    costs={registry.data?.proposalFee || 0n} // proposer.data?.proposalFee || 
                    actionText="open a proposal"
                    submitText="Confirm"
                    onSubmit={async () => {
                      if (!activeAddress) {
                        console.error("No active address");
                        return;
                      }

                      const appId = await openProposal(
                        activeAddress,
                        transactionSigner,
                        setOpenProposalLoading
                      )

                      navigate(`/new?appId=${appId}`)
                    }}
                    errorMessage=""
                  />
                )
              }
            </>
          )
        }
      </div>
    </div>
  );
}
