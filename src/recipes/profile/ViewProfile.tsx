import { ProfileCard } from "@/components/ProfileCard/ProfileCard";
import { VotingPower } from "@/components/VotingPower/VotingPower";

import { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  createEmptyProposal,
  setVotingAddress,
  subscribeProposer,
  subscribeXgov,
  unsubscribeXgov,
} from "@/api";
import {
  type TransactionSigner,
} from "algosdk";

import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton";
import { LoadingSpinner } from "@/components/LoadingSpinner/LoadingSpinner";
import { CheckIcon, XIcon, CircleDashedIcon, ClockAlertIcon } from "lucide-react";

import {
  UseQuery,
  UseWallet,
  useProposer,
  useXGov,
  useRegistry,
  useProposalsByProposer,
  useNFD,
  useVotingPower,
} from "@/hooks";
import { StackedList } from "@/recipes";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { WarningNotice } from "@/components/WarningNotice/WarningNotice";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { queryClient } from "@/stores";
import { useTransactionState } from "@/hooks/useTransactionState";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ProfilePageIsland({ address }: { address: string }) {
  return (
    <UseQuery>
      <UseWallet>
        <TooltipProvider>
          <ProfilePageController address={address} />
        </TooltipProvider>
      </UseWallet>
    </UseQuery>
  );
}

export function ProfilePageController({ address }: { address: string }) {
  const { transactionSigner: innerSigner, activeAddress } = useWallet();
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
      innerSigner={innerSigner}
    />
  );
}
export function ProfilePage({
  address,
  activeAddress,
  innerSigner,
}: {
  address: string;
  activeAddress: string | null;
  innerSigner: TransactionSigner;
}) {
  const registry = useRegistry();
  const xgov = useXGov(address);
  const proposer = useProposer(address);
  const proposalsQuery = useProposalsByProposer(address);
  const nfd = useNFD(address);
  const votingPower = useVotingPower(address);
  const [activeTab, setActiveTab] = useState<'xgov' | 'proposer'>('xgov');
  const [showUnsubscribeXGovModal, setShowUnsubscribeXGovModal] = useState(false);
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
    status: subProposerStatus,
    setStatus: setSubProposerStatus,
    errorMessage: subProposerErrorMessage,
    isPending: subProposerIsPending,
  } = useTransactionState();

  const {
    reset: openReset,
    status: openStatus,
    setStatus: setOpenStatus,
    errorMessage: openErrorMessage,
    isPending: openIsPending,
  } = useTransactionState();

  const isXGov = (address && xgov.data?.isXGov) || false;
  const validProposer = (proposer?.data && proposer.data.kycStatus) || false;
  const validKYC = (proposer?.data && proposer.data.kycStatus && proposer.data.kycExpiring > Date.now() / 1000) || false;
  const proposerKycExpired = (proposer?.data && proposer.data.kycExpiring <= Date.now() / 1000) || false;
  const createProposalDisabled = proposerKycExpired || proposer.data?.activeProposal;
  const createProposalDisabledMessage = proposerKycExpired
      ? "Your KYC has expired. Please renew your KYC to create a proposal"
      : proposer.data?.activeProposal
        ? "You already have an active proposal"
        : "";

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
      <div className="mt-6 mb-6 inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1 gap-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'xgov'}
          onClick={() => setActiveTab('xgov')}
          className={`inline-flex items-center gap-2 py-1 pl-1 pr-3 text-sm font-semibold rounded-full transition-colors ${
            activeTab === 'xgov'
              ? 'bg-algo-blue text-white shadow-sm dark:bg-algo-teal dark:text-algo-black'
              : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {isXGov
            ? <div className={`p-0.5 rounded-full ${activeTab === 'xgov' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-teal/10'}`}><CheckIcon className="p-1 text-algo-teal" /></div>
            : <div className={`p-0.5 rounded-full ${activeTab === 'xgov' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-red/10'}`}><XIcon className="p-1 text-algo-red" /></div>
          }
          xGov
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proposer'}
          onClick={() => setActiveTab('proposer')}
          className={`inline-flex items-center gap-2 py-1 pl-1 pr-3 text-sm font-semibold rounded-full transition-colors ${
            activeTab === 'proposer'
              ? 'bg-algo-blue text-white shadow-sm dark:bg-algo-teal dark:text-algo-black'
              : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {!proposer.data?.isProposer
            ? <div className={`p-0.5 rounded-full ${activeTab === 'proposer' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-red/10'}`}><XIcon className="p-1 text-algo-red" /></div>
            : proposer.data?.isProposer && !proposer.data.kycStatus
              ? <div className={`p-0.5 rounded-full ${activeTab === 'proposer' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-blue/10 dark:bg-algo-blue/20'}`}><CircleDashedIcon className="p-1 text-algo-blue animate-spin-slow" /></div>
              : proposerKycExpired
                ? <div className={`p-0.5 rounded-full ${activeTab === 'proposer' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-red/10'}`}><ClockAlertIcon className="p-1 text-algo-red" /></div>
                : validKYC
                  ? <div className={`p-0.5 rounded-full ${activeTab === 'proposer' ? 'bg-white/20 dark:bg-algo-black/40' : 'bg-algo-teal/10'}`}><CheckIcon className="p-1 text-algo-teal" /></div>
                  : null
          }
          Proposer
        </button>
      </div>

      <ProfileCard
        address={address}
        activeTab={activeTab}
        votingAddress={xgov.data?.votingAddress || ""}
        setVotingAddress={(address) => setVotingAddress({
          activeAddress,
          innerSigner,
          setStatus: setVotAddrStatus,
          newAddress: address,
          refetch: [proposer.refetch]
        })}
        setVotingAddressState={{
          status: votAddrStatus,
          errorMessage: votAddrErrorMessage,
          isPending: votAddrIsPending
        }}
        isXGov={(address && xgov.data?.isXGov) || false}
        xGovSignupCost={registry.data?.xgovFee || 0n}
        subscribeXgov={() => subscribeXgov({
          activeAddress,
          innerSigner,
          setStatus: setSubXGovStatus,
          xgovFee: registry.data?.xgovFee,
          refetch: [xgov.refetch]
        })}
        unsubscribeXgov={() => unsubscribeXgov({
          activeAddress,
          innerSigner,
          setStatus: setSubXGovStatus,
          refetch: [xgov.refetch, proposer.refetch],
        })}
        subscribeXGovState={{
          status: subXgovStatus,
          errorMessage: subXGovErrorMessage,
          isPending: subXGovIsPending
        }}
        proposer={proposer.data}
        proposerSignupCost={registry.data?.proposerFee || 0n}
        subscribeProposer={() => subscribeProposer({
          activeAddress,
          innerSigner,
          setStatus: setSubProposerStatus,
          refetch: [proposer.refetch],
          amount: registry.data?.proposerFee!,
        })}
        subscribeProposerState={{
          status: subProposerStatus,
          errorMessage: subProposerErrorMessage,
          isPending: subProposerIsPending
        }}
        activeAddress={activeAddress}
      />

      {activeTab === 'xgov' && (
        <>
          <VotingPower
            committees={votingPower.data ?? []}
            isLoading={votingPower.isLoading}
            isError={votingPower.isError}
          />
          {activeAddress === address && isXGov && (
            <>
              <button
                type="button"
                onClick={() => setShowUnsubscribeXGovModal(true)}
                className="w-fit rounded-lg px-3 py-2 text-sm font-medium text-white bg-algo-red hover:bg-algo-red/80 transition-colors"
              >
                Unsubscribe from xGov
              </button>
              <ConfirmationModal
                isOpen={showUnsubscribeXGovModal}
                onClose={() => setShowUnsubscribeXGovModal(false)}
                title="Unsubscribe from xGov"
                description="Are you sure you want to unsubscribe from xGov? You will lose your xGov status and voting power."
                submitVariant="destructive"
                submitText="Unsubscribe"
                onSubmit={async () => {
                  await unsubscribeXgov({
                    activeAddress,
                    innerSigner,
                    setStatus: setSubXGovStatus,
                    refetch: [xgov.refetch, proposer.refetch],
                  });
                  setShowUnsubscribeXGovModal(false);
                }}
                txnState={{
                  status: subXgovStatus,
                  errorMessage: subXGovErrorMessage,
                  isPending: subXGovIsPending
                }}
              />
            </>
          )}
        </>
      )}

      {activeTab === 'proposer' && (
        <>
          {validProposer && (
            <div className="flex items-center gap-6 mb-4">
              {activeAddress === address && (
                <>
                  <InfinityMirrorButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowOpenProposalModal(true)}
                    disabled={createProposalDisabled}
                    disabledMessage={createProposalDisabledMessage}
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
                      const appId = await createEmptyProposal({
                        activeAddress,
                        innerSigner,
                        setStatus: setOpenStatus,
                        refetch: []
                      });

                      if (appId) {
                        setShowOpenProposalModal(false);
                        queryClient.invalidateQueries({
                          queryKey: ["getProposalsByProposer", activeAddress],
                        });
                        navigate(`/new?appId=${appId}`);
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
          )}

          {!!proposalsWithNFDs && (
            <StackedList proposals={proposalsWithNFDs} activeAddress={activeAddress} />
          )}
        </>
      )}
    </>
  );
}
