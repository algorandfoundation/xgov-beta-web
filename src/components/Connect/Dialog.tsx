import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/functions/utils";
import type { Wallet } from "@txnlab/use-wallet-react";

export interface ConnectDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    wallets: Wallet[];
    children: React.ReactNode;
}

export function ConnectDialog({ open, setOpen, wallets, children }: ConnectDialogProps) {
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
                                    className="group text-5xl font-bold flex items-center gap-4 h-18 pr-5 pl-1 py-1 hover:bg-algo-teal dark:hover:bg-algo-blue dark:text-white hover:text-white rounded-2xl transition"
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