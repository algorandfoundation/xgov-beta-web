import { ProfileCard } from "@/components/ProfileCard/ProfileCard";

import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  openProposal,
  registryClient,
  subscribeProposer,
  subscribeXgov,
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
} from "@/hooks";
import { StackedList } from "@/recipes";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { WarningNotice } from "@/components/WarningNotice/WarningNotice";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { queryClient } from "@/stores";

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

  const [subscribeXGovLoading, setSubscribeXGovLoading] =
    useState<boolean>(false);
  const [setVotingAddressLoading, setSetVotingAddressLoading] =
    useState<boolean>(false);
  const [subscribeProposerLoading, setSubscribeProposerLoading] =
    useState<boolean>(false);
  const [openProposalLoading, setOpenProposalLoading] =
    useState<boolean>(false);
  const [openProposalError, setOpenProposalError] = useState<string>("");

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
    setSetVotingAddressLoading(true);

    if (!activeAddress || !transactionSigner) {
      console.error("No active address or transaction signer");
      setSetVotingAddressLoading(false);
      return;
    }

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

    if (!activeAddress || !transactionSigner) {
      console.error("No active address or transaction signer");
      setSubscribeXGovLoading(false);
      return;
    }

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

  return (
    <>
      <ProfileCard
        address={address}
        votingAddress={xgov.data?.votingAddress || ""}
        setVotingAddress={setVotingAddress}
        setVotingAddressLoading={setVotingAddressLoading}
        isXGov={(address && xgov.data?.isXGov) || false}
        xGovSignupCost={registry.data?.xgovFee || 0n}
        subscribeXgov={() => subscribeXgov(
          activeAddress,
          transactionSigner,
          setSubscribeXGovLoading,
          registry.data?.xgovFee,
          xgov.refetch
        )}
        unsubscribeXgov={unsubscribeXgov}
        subscribeXGovLoading={subscribeXGovLoading}
        proposer={proposer.data}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer(
          activeAddress,
          transactionSigner,
          setSubscribeProposerLoading,
          registry.data?.proposerFee!,
          proposer.refetch
        )}
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
                  onClose={() => setShowOpenProposalModal(false)}
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
                        setOpenProposalLoading,
                        setOpenProposalError,
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
                  loading={openProposalLoading}
                  errorMessage={openProposalError}
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
