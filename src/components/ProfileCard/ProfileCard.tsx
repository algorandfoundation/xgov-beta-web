import { useWallet } from "@txnlab/use-wallet-react";
import algosdk, { ALGORAND_MIN_TX_FEE, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { useRef, useState } from "react";
import { AlgorandClient } from "src/algorand/algo-client";
import { RegistryAppID, RegistryClient } from "src/algorand/contract-clients";
import { Buffer } from 'buffer';
import { setIsProposer, setIsXGov, setVotingAddress as storeSetVotingAddress } from "@/stores/registryStore";
import { initializeMockEnvironment } from "src/algorand/mock-init";

export interface ProfileCardProps {
    activeAddress: string;
    votingAddress: string;
    isXGov: boolean;
    isProposer: boolean;
    validKYC: boolean;
}

export function ProfileCard({ activeAddress, votingAddress, isXGov, isProposer, validKYC }: ProfileCardProps) {
    const { transactionSigner } = useWallet();
    const [subscribeXGovLoading, setSubscribeXGovLoading] = useState<boolean>(false);
    const [setVotingAddressLoading, setSetVotingAddressLoading] = useState<boolean>(false);
    const [subscribeProposerLoading, setSubscribeProposerLoading] = useState<boolean>(false);

    const votingAddressRef = useRef<HTMLInputElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [editingVotingAddress, setEditingVotingAddress] = useState<boolean>(false);
    const [votingAddressFieldError, setVotingAddressFieldError] = useState<string>('');

    const subscribeXgov = async () => {
        setSubscribeXGovLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: 1_000_000,
            suggestedParams,
        })

        await RegistryClient.send.subscribeXgov({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                payment,
                votingAddress: activeAddress
            },
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            alert(`Error calling the contract: ${e.message}`)
            setSubscribeXGovLoading(false);
            return
        });

        setIsXGov(true);
        storeSetVotingAddress(activeAddress);
        setSubscribeXGovLoading(false);
    }

    const setVotingAddress = async (address: string) => {
        setSetVotingAddressLoading(true);

        await RegistryClient.send.setVotingAccount({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                xgovAddress: activeAddress,
                votingAddress: address
            },
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            alert(`Error calling the contract: ${e.message}`)
            setSetVotingAddressLoading(false);
            return
        });

        storeSetVotingAddress(activeAddress);
        setSetVotingAddressLoading(false);
        setEditingVotingAddress(false);
    }

    const unsubscribeXgov = async () => {
        setSubscribeXGovLoading(true);

        await RegistryClient.send.unsubscribeXgov({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
                xgovAddress: activeAddress
            },
            extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('x'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            alert(`Error calling the contract: ${e.message}`)
            setSubscribeXGovLoading(false);
            return
        });

        setIsXGov(false);
        storeSetVotingAddress('');
        setSubscribeXGovLoading(false);
    }

    const subscribeProposer = async () => {
        setSubscribeProposerLoading(true);

        const suggestedParams = await AlgorandClient.getSuggestedParams();

        const payment = makePaymentTxnWithSuggestedParamsFromObject({
            from: activeAddress,
            to: algosdk.getApplicationAddress(RegistryAppID),
            amount: 10_000_000,
            suggestedParams,
        })

        await RegistryClient.send.subscribeProposer({
            sender: activeAddress,
            signer: transactionSigner,
            args: { payment },
            boxReferences: [
                new Uint8Array(
                    Buffer.concat([
                        Buffer.from('p'),
                        algosdk.decodeAddress(activeAddress).publicKey
                    ])
                ),
            ]
        }).catch((e: Error) => {
            alert(`Error calling the contract: ${e.message}`)
            setSubscribeProposerLoading(false);
            return
        });

        setIsProposer(true);
        setSubscribeProposerLoading(false);
    }

    const setKYC = async () => {

    }

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
                                                className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md my-1 px-2 py-0.5 transition"
                                                onClick={() => {
                                                    if (votingAddressRef?.current?.value) {
                                                        setVotingAddress(votingAddressRef?.current?.value);
                                                    }
                                                }}
                                                disabled={setVotingAddressLoading || !!votingAddressFieldError}
                                            >
                                                {subscribeXGovLoading ? 'Loading...' : 'Save'}
                                            </button>
                                            <button
                                                ref={cancelButtonRef}
                                                type='button'
                                                className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md my-1 px-2 py-0.5 transition"
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
                                            className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md my-1 px-2 py-0.5 transition"
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
                                        className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 transition"
                                        onClick={unsubscribeXgov}
                                        disabled={subscribeXGovLoading}
                                    >
                                        {subscribeXGovLoading ? 'Loading...' : 'Remove me from xGov'}
                                    </button>
                                </>
                                : <>
                                    <button
                                        type='button'
                                        className="border-2 hover:border-b-[3px] text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 transition"
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
                            !isProposer &&
                            <button
                                type='button'
                                className="border-2 text-xs text-algo-black dark:text-algo-blue-20 border-algo-black dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 transition"
                                onClick={subscribeProposer}
                                disabled={subscribeProposerLoading}
                            >
                                {subscribeProposerLoading ? 'Loading...' : 'Become a Proposer'}
                            </button>
                        }
                    </div>
                    <p className="text-xl mt-2 dark:text-algo-blue-20">
                        {
                            isProposer
                                ? '✅ Active Proposer'
                                : '❌ Not a Proposer'
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}