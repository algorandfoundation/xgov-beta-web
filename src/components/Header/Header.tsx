import React from "react";
import { Link, type LinkProps } from "@/components/Link.tsx";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import { Link as RRLink } from "react-router-dom";
import { cn } from "@/functions/utils";

export type HeaderProps = {
    title?: string;
    /**
     * Router Path
     */
    path?: string;
    /**
     * Router Component to use for navigation
     */
    LinkComponent?: React.ComponentType<LinkProps>;
    MobileNav?: React.ReactNode;
    children?: React.ReactNode;
    showAdmin?: boolean;
}
export function Header({ path, title = "xGov", LinkComponent = Link, children, MobileNav, showAdmin }: HeaderProps){
    return (
        <header
            className="fixed w-full px-2 md:px-4 z-50">
            <div className="w-full bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black rounded-b-3xl flex justify-between items-center p-4 lg:px-10 ">
                <RRLink to='/' className="flex gap-4 items-center">
                    <AlgorandIcon className="fill-white dark:fill-algo-black size-8" />
                </RRLink>

                <div className="hidden lg:inline-flex items-center gap-2 lg:gap-6">
                    <nav className="hidden md:flex gap-6 font-bold text-lg">
                        <LinkComponent
                            data-testid="header-docs-link"
                            className={cn(
                                path === '/docs' ? 'text-algo-blue' : '',
                                'px-2 py-1 hover:bg-white/10 dark:hover:bg-algo-black/10 rounded-md'
                            )}
                            to="/docs"
                        >
                            Docs
                        </LinkComponent>
                        <LinkComponent
                            data-testid="header-cohort-link"
                            className={cn(
                                path === '/cohort' ? 'text-algo-blue' : '',
                                'px-2 py-1 hover:bg-white/10 dark:hover:bg-algo-black/10 rounded-md'
                            )}
                            to="/cohort"
                        >
                            Cohort
                        </LinkComponent>
                        {showAdmin && <LinkComponent data-testid="header-admin-link" className={path === '/admin' ? 'text-algo-blue' : ''} to="/admin">Admin</LinkComponent>}
                    </nav>
                    {children}
                </div>
                {MobileNav}
            </div>
        </header>
    )
}

