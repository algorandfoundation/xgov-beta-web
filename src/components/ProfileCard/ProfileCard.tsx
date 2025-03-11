import type { ProposerBoxState } from "@/types/proposer";
import EditableAddress from "../EditableAddress/EditableAddress";
import ActionButton from "../button/ActionButton/ActionButton";
import { cn } from "@/functions/utils";
import XGovStatusPill from "../XGovStatusPill/XGovStatusPill";
import XGovProposerStatusPill from "../XGovProposerStatusPill/XGovProposerStatusPill";
import BecomeAnXGovBannerButton from "../BecomeAnXGovBannerButton/BecomeAnXGovBannerButton";

export interface ProfileCardProps {
    activeAddress: string;
    votingAddress: string;
    setVotingAddress: (votingAddress: string) => void;
    setVotingAddressLoading: boolean;
    isXGov: boolean;
    subscribeXgov: () => void;
    unsubscribeXgov: () => void;
    subscribeXGovLoading: boolean;
    proposer?: { isProposer: boolean } & ProposerBoxState;
    subscribeProposer: () => void;
    subscribeProposerLoading: boolean;
    className?: string;
}

export function ProfileCard({
    activeAddress,
    votingAddress,
    setVotingAddress,
    setVotingAddressLoading,
    isXGov,
    subscribeXgov,
    unsubscribeXgov,
    subscribeXGovLoading,
    proposer,
    subscribeProposer,
    subscribeProposerLoading,
    className = '',
}: ProfileCardProps) {

    return (
        <div className={cn(className, "relative bg-white dark:bg-algo-black dark:border-white text-algo-black dark:text-white rounded-lg")}>
            <div className="w-full flex flex-col gap-4">
                <div className="flex gap-6">
                    <XGovStatusPill
                        isXGov={isXGov}
                        unsubscribeXgov={unsubscribeXgov}
                        unsubscribeXGovLoading={subscribeXGovLoading}
                    />
                    {
                        !proposer || (proposer?.isProposer && !proposer.kycStatus) && <XGovProposerStatusPill proposer={proposer}/>
                    }
                </div>

                {
                    !isXGov ? (
                        <BecomeAnXGovBannerButton onClick={subscribeXgov} disabled={subscribeXGovLoading} />
                    ) : (
                        <EditableAddress
                            title='Voting Address'
                            defaultValue={votingAddress}
                            loading={setVotingAddressLoading}
                            onSave={(v) => { setVotingAddress(v); }}
                        />
                    )
                }

                <div>
                    <div className="flex items-center gap-2">
                        {
                            !proposer?.isProposer &&
                            <ActionButton
                                type='button'
                                onClick={subscribeProposer}
                                disabled={subscribeProposerLoading}
                            >
                                {subscribeProposerLoading ? 'Loading...' : 'Become a Proposer'}
                            </ActionButton>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}