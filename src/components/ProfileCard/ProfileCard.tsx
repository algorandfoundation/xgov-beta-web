import type { ProposerBoxState } from "@/types/proposer";
import { useRef, useState } from "react";

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
    const votingAddressRef = useRef<HTMLInputElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [editingVotingAddress, setEditingVotingAddress] = useState<boolean>(false);
    const [votingAddressFieldError, setVotingAddressFieldError] = useState<string>('');

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
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl py-1 font-bold">Voting Address</h2>
                                {
                                    editingVotingAddress
                                        ? <>
                                            <button
                                                type='button'
                                                className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                                onClick={() => {
                                                    if (votingAddressRef?.current?.value) {
                                                        setVotingAddress(votingAddressRef?.current?.value);
                                                        setEditingVotingAddress(false);
                                                    }
                                                }}
                                                disabled={setVotingAddressLoading || !!votingAddressFieldError}
                                            >
                                                {subscribeXGovLoading ? 'Loading...' : 'Save'}
                                            </button>
                                            <button
                                                ref={cancelButtonRef}
                                                type='button'
                                                className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                                onClick={() => {
                                                    if (votingAddressRef?.current) {
                                                        votingAddressRef.current.value = votingAddress;
                                                    }

                                                    setEditingVotingAddress(false);
                                                    setVotingAddressFieldError('');
                                                }}
                                                disabled={setVotingAddressLoading}
                                            >
                                                {subscribeXGovLoading ? 'Loading...' : 'Cancel'}
                                            </button>
                                        </>
                                        : <button
                                            type='button'
                                            className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                            onClick={() => {
                                                setVotingAddressFieldError('');
                                                setEditingVotingAddress(true);
                                                setTimeout(() => {
                                                    if (votingAddressRef?.current) {
                                                        votingAddressRef.current.value = '';
                                                        votingAddressRef.current.focus();
                                                    }
                                                }, 0);
                                            }}
                                        >
                                            Edit
                                        </button>
                                }
                            </div>

                            <input
                                ref={votingAddressRef}
                                name="voting_address"
                                className="p-2 pl-3 mt-2 border-2 border-algo-black bg-algo-black dark:border-white dark:bg-white text-white dark:text-algo-blue-50 rounded-lg text-xs sm:text-base font-mono w-full md:w-[36.5rem] focus:outline-none focus:border-algo-teal focus:bg-white focus:text-algo-black dark:focus:bg-algo-black dark:focus:text-white dark:focus:border-white"
                                defaultValue={votingAddress}
                                onFocus={() => {
                                    setVotingAddressFieldError('');
                                }}
                                onBlur={(e) => {
                                    if (e.relatedTarget !== cancelButtonRef.current && editingVotingAddress) {
                                        if (e.currentTarget.value.length !== 58) {
                                            setVotingAddressFieldError('Invalid address');
                                        }
                                    }
                                }}
                                disabled={!editingVotingAddress}
                            />

                            {
                                !!votingAddressFieldError &&
                                <span className="block my-0.5 text-xs font-medium text-red-600">{votingAddressFieldError}</span>
                            }
                        </div>
                    )
                }

                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl py-1 font-bold">xGov Status</h2>
                        {
                            isXGov
                                ? <>
                                    <button
                                        type='button'
                                        className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 disabled:text-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                        onClick={unsubscribeXgov}
                                        disabled={subscribeXGovLoading}
                                    >
                                        {subscribeXGovLoading ? 'Loading...' : 'Remove me from xGov'}
                                    </button>
                                </>
                                : <>
                                    <button
                                        type='button'
                                        className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                        onClick={subscribeXgov}
                                        disabled={subscribeXGovLoading}
                                    >
                                        {subscribeXGovLoading ? 'Loading...' : 'Become an xGov'}
                                    </button>
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
                            <button
                                type='button'
                                className="border-2 hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-75 transform-gpu"
                                onClick={subscribeProposer}
                                disabled={subscribeProposerLoading}
                            >
                                {subscribeProposerLoading ? 'Loading...' : 'Become a Proposer'}
                            </button>
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