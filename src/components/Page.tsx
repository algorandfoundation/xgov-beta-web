import { Header } from "@/components/Header/Header";
import { Link } from 'react-router-dom'
import type { ComponentProps, ComponentType, PropsWithChildren, ReactNode } from "react";
import type { LinkProps } from "@/components/Link.tsx";
import { useWallet } from "@txnlab/use-wallet-react";
import { useStore } from "@nanostores/react";
import { cn } from "@/functions/utils.ts";
import { ThemeToggle } from "@/components/button/ThemeToggle/ThemeToggle";
import { Connect } from "@/components/Connect/Connect";
import { MobileNav } from "@/components/MobileNav/MobileNav";

export function DefaultSidebar(){
    return (
        <div></div>
    )
}

type ContentProps = PropsWithChildren<{ Sidebar?: ComponentType; }>

export function Content({ children, Sidebar = DefaultSidebar }: ContentProps){
    return (
        <main className={cn(
            // overlay ? "max-h-full pointer-events-none overflow-hidden" : "",
            "m-auto p-4 lg:px-10 w-full grid grid-cols-1 lg:grid-cols-2"
        )}>
            {children}
            <div className="justify-self-end">
                <Sidebar/>
            </div>
        </main>
    )
}

export type PageProps = {
    title: string;
    children: ReactNode;

    // Header Components
    headerProps?: ComponentProps<typeof Header>;

    // Sidebar Components
    Sidebar?: ComponentType;
    // TODO: SidebarProps

    // Generic Components
    LinkComponent?: ComponentType<LinkProps>;
}

export function Page({
    children,
    title,
    headerProps,
    Sidebar = DefaultSidebar,
    LinkComponent = Link as unknown as ComponentType<LinkProps>
}: PageProps) {
    const { wallets, activeAddress, activeWallet } = useWallet();
    // TODO: Get NFD name using the activeAddress

    return (
        <>
            <Header
                title={title}
                LinkComponent={LinkComponent}
                MobileNav={<MobileNav />}
                {...headerProps}
            >                
                <Connect
                    wallets={wallets}
                    // nfdName={!!activeAddress ? activeAddress : undefined}
                    activeAddress={activeAddress}
                    activeWallet={activeWallet}
                />
                <ThemeToggle />   
            </Header>
            <Content Sidebar={Sidebar}>
                {children}
            </Content>
        </>
    )
}

