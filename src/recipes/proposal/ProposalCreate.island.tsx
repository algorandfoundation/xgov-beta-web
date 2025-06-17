import {
  useProposalsByProposer,
  UseQuery,
  useRegistry,
  useSearchParams,
  useSearchParamsObserver,
  UseWallet,
} from "@/hooks";
import { ProposalForm, proposalFormSchema } from "@/recipes";
import { ProposalStatus, submitProposal } from "@/api";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { useBalance } from "@/hooks/useBalance";
import { useTransactionState } from "@/components/ConfirmationModal/ConfirmationModal";

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
  ProposalStatus.ProposalStatusFinal,
  ProposalStatus.ProposalStatusVoting,
];

export function ProposalCreate() {
  const { activeAddress, transactionSigner, activeWallet } = useWallet();
  const userBalance = useBalance(activeAddress);
  const registry = useRegistry();
  const proposalsData = useProposalsByProposer(activeAddress);
  const [proposalSubmitLoading, setProposalSubmitLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [_searchParams, setSearchParams] = useState(searchParams);
  useSearchParamsObserver((searchParams) => {
    setSearchParams(searchParams);
  });

  const { status, setStatus, errorMessage, setErrorMessage, reset } =
    useTransactionState();

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
    userBalance.data.available.microAlgos > 1_000n
      ? ((userBalance.data.available.microAlgos - 1_000n) / 1_000_000n) * 10n
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
      minRequestedAmount={registry.data?.minRequestedAmount || 1n}
      maxRequestedAmount={maxRequestedAmount}
      loading={proposalSubmitLoading}
      error={errorMessage}
      transactionStatus={status}
      onSubmit={async (data: z.infer<typeof proposalFormSchema>) => {
        // TODO
        if (!activeAddress) {
          setErrorMessage("No active address");
          return;
        }

        if (!activeWallet) {
          setErrorMessage("No active wallet");
          return;
        }

        if (!registry.data?.proposalCommitmentBps) {
          setErrorMessage("No proposal commitment bps");
          return;
        }

        if (!appId) {
          setErrorMessage("No appId set for Lute proposal");
          return;
        }

        try {
          await submitProposal(
            activeAddress,
            data,
            transactionSigner,
            appId,
            registry.data?.proposalCommitmentBps,
            setStatus,
            setErrorMessage,
          );

          navigate(`/proposal/${appId}`);
        } catch (e) {
          console.error(e);
        }
      }}
    />
  );
}
