import { WalletIcon } from "@/components/icons/WalletIcon"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { shortenAddress } from "@/functions/shortening"
import { BaseWallet, type Wallet } from "@txnlab/use-wallet-react"
import { useState } from "react"
import { cn } from "@/functions/utils";
import { Link, useNavigate } from 'react-router-dom'

export interface ConnectProps {
    path: string;
    wallets: Wallet[];
    activeAddress: string | null;
    activeWallet?: BaseWallet | null;
    nfdName?: string;
}

export function Connect({ path, wallets, activeAddress, activeWallet, nfdName }: ConnectProps) {
    const navigate = useNavigate();
    const [dialogOpen, setOpenDialog] = useState(false);

    if (!!activeAddress) {
        return (
            <ConnectDropdown
                activeAddress={activeAddress}
                onLogOut={() => {
                    activeWallet!.disconnect()
                    path.includes('profile') && navigate('/');
                }}
            >
                <Button
                    id="connect-button"
                    className="flex items-center gap-2.5 bg-white dark:bg-algo-black text-lg rounded-md text-algo-black dark:text-white border-none shadow-none p-2 px-4"
                    variant="default"
                >
                    <WalletIcon className="size-6 stroke-algo-black dark:stroke-white stroke-[1.5]" />
                    {!!nfdName ? nfdName : shortenAddress(activeAddress)}
                </Button>
            </ConnectDropdown>
        )
    }

    return (
        <ConnectDialog open={dialogOpen} setOpen={setOpenDialog} wallets={wallets}>
            <Button
                id="connect-button"
                className="flex items-center gap-2.5 bg-white dark:bg-algo-black text-lg rounded-md text-algo-black dark:text-white border-none shadow-none p-2 px-4"
                variant="default"
                onClick={() => setOpenDialog(true)}
            >
                <WalletIcon className="size-6 stroke-algo-black dark:stroke-white stroke-[1.5]" />
                Connect Wallet
            </Button>
        </ConnectDialog>
    )
}


interface ConnectDropdownProps {
    activeAddress: string | null;
    children: React.ReactNode;
    onLogOut: () => void;
}

function ConnectDropdown({ activeAddress, children, onLogOut }: ConnectDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
                <Link to={`/profile/${activeAddress}`}>
                    <DropdownMenuItem>
                        Profile
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={() => onLogOut()}>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface ConnectDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    wallets: Wallet[];
    children: React.ReactNode;
}

function ConnectDialog({ open, setOpen, wallets, children }: ConnectDialogProps) {
    return (
        <Dialog open={open}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="h-full w-full"
                onCloseClick={() => setOpen(false)}
            >
                <DialogTitle className="sr-only">Connect a Wallet</DialogTitle>
                <ul className="h-full flex flex-col items-start justify-center gap-8">
                    {
                        wallets.map((wallet) => (
                            <li key={wallet.id}>
                                <button
                                    className="group text-5xl font-bold flex items-center gap-4 h-18 pr-5 pl-1 py-1 hover:bg-algo-blue dark:hover:bg-algo-teal dark:text-white hover:text-white rounded-2xl transition"
                                    onClick={() => {
                                        setOpen(false);
                                        wallet.connect();
                                    }}
                                >
                                    <div
                                        className={cn(
                                            ['exodus', 'lute'].includes(wallet.metadata.name.toLowerCase())
                                                ? 'bg-algo-black'
                                                : '',
                                            "size-14 overflow-hidden rounded-2xl group-hover:shadow-xl"
                                        )}
                                    >
                                        <img
                                            className="object-cover"
                                            src={wallet.metadata.icon}
                                            alt={`${wallet.metadata.name} icon`}
                                        />
                                    </div>

                                    {wallet.metadata.name}
                                </button>
                            </li>
                        ))
                    }
                </ul>
            </DialogContent>
        </Dialog>
    )
}