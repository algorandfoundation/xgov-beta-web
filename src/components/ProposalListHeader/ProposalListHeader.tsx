import type { ReactNode } from "react";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";
import { useProposer, UseQuery, UseWallet } from "@/hooks";
import { useWallet } from "@txnlab/use-wallet-react";
import { ProposalFilter } from "@/recipes";


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
  const { activeAddress } = useWallet();
  const proposer = useProposer(activeAddress);

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
        {validProposer && (
          <a href="/new">
            <InfinityMirrorButton
              variant="secondary"
              size="sm"
              disabled={proposer.data?.activeProposal}
              disabledMessage="You already have an active proposal"
            >
              New Proposal
            </InfinityMirrorButton>
          </a>
        )}
      </div>
    </div>
  );
}
