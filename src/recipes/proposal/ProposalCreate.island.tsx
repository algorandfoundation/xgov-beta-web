import {
  useProposalsByProposer,
  UseQuery,
  useRegistry,
  useSearchParams,
  useSearchParamsObserver,
  UseWallet,
} from "@/hooks";
import { ProposalForm, proposalFormSchema } from "@/recipes";
import { ProposalStatus, openProposal } from "@/api";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { useBalance } from "@/hooks/useBalance";
import { useTransactionState } from "@/hooks/useTransactionState";

export function ProposalCreateIsland() {
  return (
    <UseQuery>
      <UseWallet>
        <ProposalCreate />
      </UseWallet>
    </UseQuery>
  );
}

const activeProposalTypes = [
  ProposalStatus.ProposalStatusDraft,
  ProposalStatus.ProposalStatusSubmitted,
  ProposalStatus.ProposalStatusVoting,
];

export function ProposalCreate() {
  const { activeAddress, transactionSigner: innerSigner, activeWallet } = useWallet();
  const userBalance = useBalance(activeAddress);
  const registry = useRegistry();
  const proposalsData = useProposalsByProposer(activeAddress);
  const [searchParams] = useSearchParams();
  const [_searchParams, setSearchParams] = useState(searchParams);
  useSearchParamsObserver((searchParams) => {
    setSearchParams(searchParams);
  });

  const {
    status,
    setStatus,
    errorMessage,
    reset,
    isPending
  } = useTransactionState();

  const emptyProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter(
      (proposal) => proposal.status === ProposalStatus.ProposalStatusEmpty,
    );
  const emptyProposal =
    emptyProposals && emptyProposals.length > 0 ? emptyProposals[0] : null;

  const appId =
    emptyProposal?.id || BigInt(Number(_searchParams.get("appId"))) || null;

  useEffect(() => {
    reset(); // reset transaction status and errors
  }, [appId])

  const currentProposals =
    !!proposalsData.data &&
    proposalsData.data?.filter((proposal) =>
      activeProposalTypes.includes(proposal.status),
    );

  const currentProposal =
    currentProposals && currentProposals.length > 0 && currentProposals[0];

  const maxRequestedAmount =
    !!userBalance.data?.available &&
      userBalance.data.available.microAlgos > 1_000n &&
      !!registry.data?.proposalCommitmentBps
      ? BigInt(
        Math.floor(
          Number(userBalance.data.available.microAlgos - 100_000n) /
          (Number(registry.data?.proposalCommitmentBps) / 10000),
        ),
      )
      : 0n;

  useEffect(() => {
    if (currentProposal) {
      navigate(`/proposal/${currentProposal.id}`);
    }
  }, [currentProposal]);

  return (
    <ProposalForm
      type="create"
      bps={registry.data?.proposalCommitmentBps || 0n}
      minRequestedAmount={registry.data?.minRequestedAmount || 1000000n}
      maxRequestedAmount={maxRequestedAmount}
      txnState={{
        status,
        errorMessage,
        isPending
      }}
      onSubmit={async (data: z.infer<typeof proposalFormSchema>) => {
        if (!activeAddress) {
          setStatus(new Error("No active address"));
          return;
        }

        if (!activeWallet) {
          setStatus(new Error("No active wallet"));
          return;
        }

        if (!registry.data?.proposalCommitmentBps) {
          setStatus(new Error("No proposal commitment bps"));
          return;
        }

        if (!appId) {
          setStatus(new Error("No appId set for Lute proposal"));
          return;
        }

        await openProposal({
          activeAddress,
          innerSigner,
          setStatus,
          refetch: [],
          data,
          appId,
          bps: registry.data?.proposalCommitmentBps,
        });

        navigate(`/proposal/${appId}`);
      }}
    />
  );
}
