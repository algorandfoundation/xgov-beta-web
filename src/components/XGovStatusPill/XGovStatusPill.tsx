import { CheckIcon, XIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

export interface XGovStatusPillProps {
    isXGov: boolean;
    unsubscribeXgov: () => void;
    unsubscribeXGovLoading: boolean;
}

export default function XGovStatusPill({ isXGov, unsubscribeXgov, unsubscribeXGovLoading }: XGovStatusPillProps) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger disabled={!isXGov} asChild>
                <button
                    type='button'
                    className="group flex items-center gap-2 bg-algo-blue/10 hover:bg-algo-blue hover:text-white dark:bg-algo-teal/10 dark:hover:bg-algo-teal dark:hover:text-algo-black disabled:hover:bg-algo-blue/10 disabled:hover:text-algo-black dark:disabled:hover:bg-algo-teal/10 dark:disabled:hover:text-white py-1 pl-1 pr-3 rounded-full"
                    disabled={!isXGov}
                >
                    {
                        isXGov
                            ? (
                                <div className="p-0.5 bg-algo-teal-10 dark:bg-algo-teal/10 dark:group-hover:bg-algo-black/40 rounded-full">
                                    <CheckIcon className="p-1 text-algo-teal" />
                                </div>
                            ) : (
                                <div className="p-0.5 bg-red-500/10 rounded-full">
                                    <XIcon className="p-1 text-red-500" />
                                </div>
                            )
                    }
                    <h2 className="text-xl font-bold">
                        xGov
                    </h2>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mx-1">
                <DropdownMenuItem
                    className="text-red-500"
                    onClick={unsubscribeXgov}
                    disabled={unsubscribeXGovLoading}
                >
                    {unsubscribeXGovLoading ? 'Loading...' : 'Unsubscribe from xGov'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}