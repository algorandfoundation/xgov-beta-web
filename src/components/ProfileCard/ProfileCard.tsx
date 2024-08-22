import { shortenAddress } from "@/functions/shortening";

export interface ProfileCardProps {
    activeAddress: string;
    votingAddress: string;
    isXGov: boolean;
    isProposer: boolean;
}

export function ProfileCard({ activeAddress, votingAddress, isXGov, isProposer }: ProfileCardProps) {
    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            {/* list out details inline sections, address, voting address, xgov status, proposer status */}
            <div className="max-w-3xl py-10 flex flex-col gap-4">
                <div className="flex gap-4">
                    <h2 className="inline text-xl font-bold">Address</h2>
                    <p className="inline text-xl dark:text-algo-blue-10">{shortenAddress(activeAddress)}</p>
                </div>

                <div className="flex gap-4">
                    <h2 className="inline text-xl font-bold">Voting Address</h2>
                    <p className="inline text-xl dark:text-algo-blue-10">{shortenAddress(votingAddress)}</p>
                </div>

                <div className="flex items-center gap-4">
                    <h2 className="inline text-xl font-bold">xGov Status</h2>
                    {
                        isXGov
                            ? <p className="inline text-xl dark:text-algo-blue-10">Member</p>
                            : <button className="border-2 border-algo-black rounded-md px-2 py-1">Become an XGov</button>
                    }
                </div>

                <div className="flex items-center gap-4">
                    <h2 className="inline text-xl font-bold">Proposer Status</h2>
                    {
                        isProposer
                            ? <p className="inline text-xl dark:text-algo-blue-10">Proposer</p>
                            : <button className="border-2 border-algo-black rounded-md px-2 py-1">Become a Proposer</button>
                    }
                </div>
            </div>
        </div>
    )
}