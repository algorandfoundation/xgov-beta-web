import { Link } from "@/components/Link";

import { ProfileCard } from "@/components/ProfileCard/ProfileCard";

import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { algorand, RegistryAppID, registryClient, signup } from "@/api";
import algosdk, {
  ALGORAND_MIN_TX_FEE,
  makePaymentTxnWithSuggestedParamsFromObject,
  type TransactionSigner,
} from "algosdk";
import { Buffer } from "buffer";

import { ProposalStatus } from "@/api";

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

const activeStatuses = [
  // ProposalStatus.ProposalStatusEmpty,
  ProposalStatus.ProposalStatusDraft,
  ProposalStatus.ProposalStatusFinal,
  ProposalStatus.ProposalStatusVoting,
  ProposalStatus.ProposalStatusApproved,
  ProposalStatus.ProposalStatusRejected,
  ProposalStatus.ProposalStatusReviewed,
  // ProposalStatus.ProposalStatusFunded,
  ProposalStatus.ProposalStatusBlocked,
  ProposalStatus.ProposalStatusDelete,
];
export function ProfilePageIsland({ address }: { address: string }) {
  console.log(address)
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
  const xgov = useXGov(address || activeAddress);
  const proposer = useProposer(address || activeAddress);
  const proposalsData = useProposalsByProposer(address || activeAddress);

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

  // const [subscribeXGovLoading, setSubscribeXGovLoading] =
  //   useState<boolean>(false);
  // const [setVotingAddressLoading, setSetVotingAddressLoading] =
  //   useState<boolean>(false);
  // const [subscribeProposerLoading, setSubscribeProposerLoading] =
  //   useState<boolean>(false);

  // const validProposer =
  //   (proposer?.data &&
  //     proposer.data.kycStatus &&
  //     proposer.data.kycExpiring > Date.now() / 1000) ||
  //   false;

  // const hasCurrentProposal = proposalsData.data?.some((proposal) =>
  //   activeStatuses.includes(proposal.status),
  // );

  // const proposals = proposalsData.data?.filter(
  //   (proposal) => proposal.status !== ProposalStatus.ProposalStatusEmpty,
  // );

  if (!address || !activeAddress || isLoading) {
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
  const xgov = useXGov(address || activeAddress);
  const proposer = useProposer(address || activeAddress);
  const proposalsData = useProposalsByProposer(address || activeAddress);

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

  const [subscribeXGovLoading, setSubscribeXGovLoading] =
    useState<boolean>(false);
  const [setVotingAddressLoading, setSetVotingAddressLoading] =
    useState<boolean>(false);
  const [subscribeProposerLoading, setSubscribeProposerLoading] =
    useState<boolean>(false);

  const validProposer =
    (proposer?.data &&
      proposer.data.kycStatus &&
      proposer.data.kycExpiring > Date.now() / 1000) ||
    false;

  // const hasCurrentProposal = proposalsData.data?.some((proposal) =>
  //   activeStatuses.includes(proposal.status),
  // );

  const proposals = proposalsData.data?.filter(
    (proposal) => proposal.status !== ProposalStatus.ProposalStatusEmpty,
  );

  if (!address || !activeAddress || isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error...</div>;
  }

  const subscribeXgov = async () => {
    setSubscribeXGovLoading(true);

    if (!registry.data?.xgovFee) {
      console.error("xgovFee is not set");
      setSubscribeXGovLoading(false);
      return;
    }

    const suggestedParams = await algorand.getSuggestedParams();

    const payment = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: algosdk.getApplicationAddress(RegistryAppID),
      amount: registry.data?.xgovFee,
      suggestedParams,
    });

    await registryClient.send
      .subscribeXgov({
        sender: activeAddress,
        signer: transactionSigner,
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
      })
      .catch((e: Error) => {
        console.error(`Error calling the contract: ${e.message}`);
        setSubscribeXGovLoading(false);
        return;
      });

    xgov.refetch();
    setSubscribeXGovLoading(false);
  };

  const setVotingAddress = async (address: string) => {
    setSetVotingAddressLoading(true);

    await registryClient.send
      .setVotingAccount({
        sender: activeAddress,
        signer: transactionSigner,
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
      })
      .catch((e: Error) => {
        console.error(`Error calling the contract: ${e.message}`);
        setSetVotingAddressLoading(false);
        return;
      });

    await proposer.refetch();
    setSetVotingAddressLoading(false);
  };

  const unsubscribeXgov = async () => {
    setSubscribeXGovLoading(true);

    await registryClient.send
      .unsubscribeXgov({
        sender: activeAddress,
        signer: transactionSigner,
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
      .catch((e: Error) => {
        console.error(`Error calling the contract: ${e.message}`);
        setSubscribeXGovLoading(false);
        return;
      });

    await Promise.all([xgov.refetch(), proposer.refetch()]);
    setSubscribeXGovLoading(false);
  };

  const subscribeProposer = async (amount: bigint) => {
    setSubscribeProposerLoading(true);

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
        votingAddress={xgov.data?.votingAddress || ""}
        setVotingAddress={setVotingAddress}
        setVotingAddressLoading={setVotingAddressLoading}
        isXGov={(address === activeAddress && xgov.data?.isXGov) || false}
        subscribeXgov={subscribeXgov}
        unsubscribeXgov={unsubscribeXgov}
        subscribeXGovLoading={subscribeXGovLoading}
        proposer={proposer.data}
        subscribeProposer={() => subscribeProposer(registry.data?.proposerFee!)}
        subscribeProposerLoading={subscribeProposerLoading}
        className="mt-6"
      />
      {validProposer && (
        <>
          <div className="flex gap-6 mb-4">
            <XGovProposerStatusPill proposer={proposer.data} />
            <Link to="/new">
              <InfinityMirrorButton variant="secondary">
                New Proposal
              </InfinityMirrorButton>
            </Link>
          </div>
          {!!proposals && (
            <StackedList proposals={proposals} activeAddress={null} />
          )}
        </>
      )}
    </>
  );
}
