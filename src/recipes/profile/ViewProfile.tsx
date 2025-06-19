import { ProfileCard } from "@/components/ProfileCard/ProfileCard";

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  algorand,
  network,
  openProposal,
  RegistryAppID,
  registryClient,
  signup,
  wrapTransactionSigner,
} from "@/api";
import algosdk, {
  ALGORAND_MIN_TX_FEE,
  makePaymentTxnWithSuggestedParamsFromObject,
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
} from "@/hooks";
import { StackedList } from "@/recipes";
import {
  ConfirmationModal,
  useTransactionState,
} from "@/components/ConfirmationModal/ConfirmationModal";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { WarningNotice } from "@/components/WarningNotice/WarningNotice";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { queryClient } from "@/stores";
import type { XGovRegistryComposer } from "@algorandfoundation/xgov/registry";
import {
  fundingLogicSig,
  fundingLogicSigSigner,
} from "@/api/testnet-funding-logicsig";

// const activeStatuses = [
//   // ProposalStatus.ProposalStatusEmpty,
//   ProposalStatus.ProposalStatusDraft,
//   ProposalStatus.ProposalStatusFinal,
//   ProposalStatus.ProposalStatusVoting,
//   ProposalStatus.ProposalStatusApproved,
//   ProposalStatus.ProposalStatusRejected,
//   ProposalStatus.ProposalStatusReviewed,
//   // ProposalStatus.ProposalStatusFunded,
//   ProposalStatus.ProposalStatusBlocked,
//   ProposalStatus.ProposalStatusDelete,
// ];

export function ProfilePageIsland({ address }: { address: string }) {
  console.log(address);
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
  const proposalsData = useProposalsByProposer(address);

  const isLoading =
    registry.isLoading ||
    xgov.isLoading ||
    proposer.isLoading ||
    proposalsData.isLoading;

  const isError =
    registry.isError ||
    xgov.isError ||
    proposer.isError ||
    proposalsData.isError;

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
  const proposalsData = useProposalsByProposer(address);
  const [showOpenProposalModal, setShowOpenProposalModal] = useState(false);

  const isLoading =
    registry.isLoading ||
    xgov.isLoading ||
    proposer.isLoading ||
    proposalsData.isLoading;
  const isError =
    registry.isError ||
    xgov.isError ||
    proposer.isError ||
    proposalsData.isError;

  const [setVotingAddressLoading, setSetVotingAddressLoading] =
    useState<boolean>(false);
  const [subscribeProposerLoading, setSubscribeProposerLoading] =
    useState<boolean>(false);

  const {
    status: votAddrStatus,
    setStatus: setVotAddrStatus,
    reset: resetVotAddr,
  } = useTransactionState();

  const {
    status: subXgovStatus,
    setStatus: setSubXGovStatus,
  } = useTransactionState();

  const {
    reset: openReset,
    status: openStatus,
    setStatus: setOpenStatus,
  } = useTransactionState();

  const validProposer =
    (proposer?.data &&
      proposer.data.kycStatus &&
      proposer.data.kycExpiring > Date.now() / 1000) ||
    false;

  const proposals = proposalsData.data;

  if (!address || isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error...</div>;
  }

  const setVotingAddress = async (address: string) => {
    const wrappedTransactionSigner = wrapTransactionSigner(
      transactionSigner,
      setVotAddrStatus,
    );

    setVotAddrStatus("loading");

    if (!activeAddress || !transactionSigner) {
      console.error("No active address or transaction signer");
      setSetVotingAddressLoading(false);
      return;
    }

    try {
      await registryClient.send.setVotingAccount({
        sender: activeAddress,
        signer: wrappedTransactionSigner,
        args: {
          xgovAddress: activeAddress,
          votingAddress: address,
        },
        boxReferences: [
          new Uint8Array(
            Buffer.concat([
              Buffer.from("x"),
              algosdk.decodeAddress(activeAddress).publicKey,
            ]),
          ),
        ],
      });

      setVotAddrStatus("idle");
    } catch (e) {
      setVotAddrStatus(new Error(`Error: ${(e as Error).message}`));
      return;
    }

    await proposer.refetch();
  };

  const subscribeXgov = async () => {
    if (!transactionSigner) return;

    const wrappedTransactionSigner = wrapTransactionSigner(
      transactionSigner,
      setSubXGovStatus,
    );
    setSubXGovStatus("loading");

    if (!activeAddress || !wrappedTransactionSigner) {
      setSubXGovStatus(new Error("No active address or transaction signer"));
      return;
    }

    if (!registry.data?.xgovFee) {
      setSubXGovStatus(new Error("xgovFee is not set"));
      return;
    }

    const suggestedParams = await algorand.getSuggestedParams();

    const payment = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: algosdk.getApplicationAddress(RegistryAppID),
      amount: registry.data?.xgovFee,
      suggestedParams,
    });

    let builder: XGovRegistryComposer<any> = registryClient.newGroup();

    if (network === "testnet") {
      builder = builder.addTransaction(
        await registryClient.algorand.createTransaction.payment({
          sender: fundingLogicSig.address(),
          receiver: address,
          amount: (100).algos(),
        }),
        fundingLogicSigSigner,
      );
    }

    builder = builder.subscribeXgov({
      sender: activeAddress,
      signer: wrappedTransactionSigner,
      args: {
        payment,
        votingAddress: activeAddress,
      },
      boxReferences: [
        new Uint8Array(
          Buffer.concat([
            Buffer.from("x"),
            algosdk.decodeAddress(activeAddress).publicKey,
          ]),
        ),
      ],
    });

    try {
      await builder.send();
      setSubXGovStatus("idle");
    } catch (e) {
      setSubXGovStatus(new Error((e as Error).message));
    }

    xgov.refetch();
  };

  const unsubscribeXgov = async () => {
    if (!transactionSigner) return;

    const wrappedTransactionSigner = wrapTransactionSigner(
      transactionSigner,
      setSubXGovStatus,
    );
    setSubXGovStatus("loading");

    if (!activeAddress || !transactionSigner) {
      setSubXGovStatus(new Error("No active address or transaction signer"));
      return;
    }

    try {
      await registryClient.send
      .unsubscribeXgov({
        sender: activeAddress,
        signer: wrappedTransactionSigner,
        args: {
          xgovAddress: activeAddress,
        },
        extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
        boxReferences: [
          new Uint8Array(
            Buffer.concat([
              Buffer.from("x"),
              algosdk.decodeAddress(activeAddress).publicKey,
            ]),
          ),
        ],
      })

      setSubXGovStatus("idle");
    } catch (e) {
      setSubXGovStatus(new Error((e as Error).message));
    }

    await Promise.all([xgov.refetch(), proposer.refetch()]);
  };

  const subscribeProposer = async (amount: bigint) => {
    setSubscribeProposerLoading(true);

    if (!activeAddress || !transactionSigner) {
      console.error("No active address or transaction signer");
      setSubscribeProposerLoading(false);
      return;
    }

    await signup(activeAddress, transactionSigner, amount).catch((e: Error) => {
      console.error(`Error calling the contract: ${e.message}`);
      setSubscribeProposerLoading(false);
      return;
    });

    await proposer.refetch();
    setSubscribeProposerLoading(false);
  };

  return (
    <>
      <ProfileCard
        address={address}

        votingAddress={xgov.data?.votingAddress || ""}
        setVotingAddress={setVotingAddress}
        setVotingAddressStatus={votAddrStatus}

        isXGov={(address && xgov.data?.isXGov) || false}
        xGovSignupCost={registry.data?.xgovFee || 0n}

        subscribeXgov={subscribeXgov}
        unsubscribeXgov={unsubscribeXgov}
        subscribeXGovStatus={subXgovStatus}

        proposer={proposer.data}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer(registry.data?.proposerFee!)}
        subscribeProposerLoading={subscribeProposerLoading}
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
                            {Number(registry.data?.proposalFee || 0n) /
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
                  transactionStatus={openStatus}
                />
              </>
            )}
          </div>
          {!!proposals && (
            <StackedList proposals={proposals} activeAddress={activeAddress} />
          )}
        </>
      )}
    </>
  );
}
