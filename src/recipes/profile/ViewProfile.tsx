import { ProfileCard } from "@/components/ProfileCard/ProfileCard";

import { useMemo, useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  openProposal,
  registryClient,
  setVotingAddress,
  subscribeProposer,
  subscribeXgov,
  unsubscribeXgov,
} from "@/api";
import algosdk, {
  ALGORAND_MIN_TX_FEE,
  type TransactionSigner,
} from "algosdk";
import { Buffer } from "buffer";

import { XGovProposerStatusPill } from "@/components/XGovProposerStatusPill/XGovProposerStatusPill";
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";

import {
  UseQuery,
  UseWallet,
  useProposer,
  useXGov,
  useRegistry,
  useProposalsByProposer,
  useNFD,
} from "@/hooks";
import { StackedList } from "@/recipes";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { WarningNotice } from "@/components/WarningNotice/WarningNotice";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { queryClient } from "@/stores";
import { useTransactionState } from "@/hooks/useTransactionState";
import { set } from "date-fns";


export function ProfilePageIsland({ address }: { address: string }) {
  return (
    <UseQuery>
      <UseWallet>
        <ProfilePageController address={address} />
      </UseWallet>
    </UseQuery>
  );
}

export function ProfilePageController({ address }: { address: string }) {
  const { transactionSigner, activeAddress } = useWallet();
  const registry = useRegistry();
  const xgov = useXGov(address);
  const proposer = useProposer(address);
  const proposalsQuery = useProposalsByProposer(address);

  const isLoading =
    registry.isLoading ||
    xgov.isLoading ||
    proposer.isLoading ||
    proposalsQuery.isLoading;

  const isError =
    registry.isError ||
    xgov.isError ||
    proposer.isError ||
    proposalsQuery.isError;

  if (!address || isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error...</div>;
  }

  return (
    <ProfilePage
      address={address}
      activeAddress={activeAddress}
      transactionSigner={transactionSigner}
    />
  );
}
export function ProfilePage({
  address,
  activeAddress,
  transactionSigner,
}: {
  address: string;
  activeAddress: string | null;
  transactionSigner: TransactionSigner;
}) {
  const registry = useRegistry();
  const xgov = useXGov(address);
  const proposer = useProposer(address);
  const proposalsQuery = useProposalsByProposer(address);
  const nfd = useNFD(address);
  const [showOpenProposalModal, setShowOpenProposalModal] = useState(false);

  const isLoading =
    registry.isLoading ||
    xgov.isLoading ||
    proposer.isLoading ||
    proposalsQuery.isLoading;

  const isError =
    registry.isError ||
    xgov.isError ||
    proposer.isError ||
    proposalsQuery.isError;

  const {
    status: votAddrStatus,
    setStatus: setVotAddrStatus,
    reset: resetVotAddr,
    errorMessage: votAddrErrorMessage,
    isPending: votAddrIsPending,
  } = useTransactionState();

  const {
    status: subXgovStatus,
    setStatus: setSubXGovStatus,
    errorMessage: subXGovErrorMessage,
    isPending: subXGovIsPending,
  } = useTransactionState();

  const {
    reset: openReset,
    status: openStatus,
    setStatus: setOpenStatus,
    errorMessage: openErrorMessage,
    isPending: openIsPending,
  } = useTransactionState();

  const validProposer =
    (proposer?.data &&
      proposer.data.kycStatus &&
      proposer.data.kycExpiring > Date.now() / 1000) ||
    false;

  const proposalsWithNFDs = useMemo(() => {
    if (!proposalsQuery.data) return [];

    return proposalsQuery.data.map((proposal) => ({
      ...proposal,
      nfd: nfd.data
    }));
  }, [proposalsQuery.data, nfd.data]);

  if (!address || isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error...</div>;
  }

  return (
    <>
      <ProfileCard
        address={address}
        votingAddress={xgov.data?.votingAddress || ""}
        setVotingAddress={(address) => setVotingAddress(
          activeAddress,
          transactionSigner,
          setVotAddrStatus,
          address,
          proposer.refetch
        )}
        setVotingAddressState={{
          status: votAddrStatus,
          errorMessage: votAddrErrorMessage,
          isPending: votAddrIsPending
        }}
        isXGov={(address && xgov.data?.isXGov) || false}
        xGovSignupCost={registry.data?.xgovFee || 0n}
        subscribeXgov={() => subscribeXgov(
          activeAddress,
          transactionSigner,
          setSubXGovStatus,
          registry.data?.xgovFee,
          xgov.refetch
        )}
        unsubscribeXgov={() => unsubscribeXgov(
          activeAddress,
          transactionSigner,
          setSubXGovStatus,
          [xgov.refetch, proposer.refetch],
        )}
        subscribeXGovState={{
          status: subXgovStatus,
          errorMessage: subXGovErrorMessage,
          isPending: subXGovIsPending
        }}
        proposer={proposer.data}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer(
          activeAddress,
          transactionSigner,
          setSubXGovStatus,
          registry.data?.proposerFee!,
          proposer.refetch
        )}
        subscribeProposerState={{
          status: openStatus,
          errorMessage: openErrorMessage,
          isPending: openIsPending
        }}
        activeAddress={activeAddress}
        className="mt-6"
      />
      {validProposer && (
        <>
          <div className="flex items-center gap-6 mb-4">
            <XGovProposerStatusPill proposer={proposer.data} />
            {activeAddress === address && (
              <>
                <InfinityMirrorButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowOpenProposalModal(true)}
                  disabled={proposer.data?.activeProposal}
                  disabledMessage="You already have an active proposal"
                >
                  Create Proposal
                </InfinityMirrorButton>
                <ConfirmationModal
                  isOpen={showOpenProposalModal}
                  onClose={() => {
                    setShowOpenProposalModal(false);
                    openReset();
                  }}
                  title="Create Proposal"
                  description="Are you sure you want to create a new proposal? You can only have one active proposal at a time."
                  warning={
                    <WarningNotice
                      title="Proposal Fee"
                      description={
                        <>
                          It will cost
                          <span className="inline-flex items-center mx-1 gap-1">
                            <AlgorandIcon className="size-2.5" />
                            {Number(registry.data?.openProposalFee || 0n) /
                              1_000_000}
                          </span>
                          to create a proposal.
                        </>
                      }
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
                        setOpenStatus,
                      );

                      if (appId) {
                        queryClient.invalidateQueries({
                          queryKey: ["getProposalsByProposer", activeAddress],
                        });
                        navigate(`/new?appId=${appId}`);
                      }
                    } catch (error) {
                      console.error("Error opening proposal:", error);
                    }
                  }}
                  txnState={{
                    status: openStatus,
                    errorMessage: openErrorMessage,
                    isPending: openIsPending
                  }}
                />
              </>
            )}
          </div>
          {!!proposalsWithNFDs && (
            <StackedList proposals={proposalsWithNFDs} activeAddress={activeAddress} />
          )}
        </>
      )}
    </>
  );
}
