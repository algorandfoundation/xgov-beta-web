import type { ProposerBoxState } from "@/types/proposer";
import { useRef, useState } from "react";
import EditableAddress from "../EditableAddress/EditableAddress";
import ActionButton from "../button/ActionButton/ActionButton";

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
}: ProfileCardProps) {
    const validKYC =
        (
            proposer
            && proposer.kycStatus
            && proposer.kycExpiring > Date.now()
        ) || false

    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            {/* list out details inline sections, address, voting address, xgov status, proposer status */}
            <div className="max-w-3xl py-10 flex flex-col gap-4">
                <div>
                    <h2 className="text-xl py-1 font-bold">Address</h2>
                    <p className="inline-block p-2 px-3 mt-2 border-2 border-algo-black bg-algo-black dark:border-white dark:bg-white text-white dark:text-algo-blue-50 rounded-lg text-xs sm:text-base font-mono w-full md:w-[36.5rem]">{activeAddress}</p>
                </div>

                {
                    isXGov && (
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
                        <h2 className="text-xl py-1 font-bold">xGov Status</h2>
                        {
                            isXGov
                                ? <>
                                    <ActionButton
                                        type='button'                                        
                                        onClick={unsubscribeXgov}
                                        disabled={subscribeXGovLoading}
                                    >
                                        {subscribeXGovLoading ? 'Loading...' : 'Remove me from xGov'}
                                    </ActionButton>
                                </>
                                : <>
                                    <ActionButton
                                        type='button'                                        
                                        onClick={subscribeXgov}
                                        disabled={subscribeXGovLoading}
                                    >
                                        {subscribeXGovLoading ? 'Loading...' : 'Become an xGov'}
                                    </ActionButton>
                                </>
                        }
                    </div>
                    <p className="text-xl mt-2 dark:text-algo-blue-20">
                        {isXGov
                            ? '✅ Active xGov'
                            : '❌ Not an xGov'
                        }
                    </p>
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl py-1 font-bold">Proposer Status</h2>
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
                    <p className="text-xl mt-2 dark:text-algo-blue-20">
                        {
                            proposer?.isProposer
                                ? '✅ Active Proposer'
                                : '❌ Not a Proposer'
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}