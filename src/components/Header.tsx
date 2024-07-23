import React from "react";
import {Link, type LinkProps} from "./Link.tsx";
import { BarsIcon } from "../icons/BarsIcon.tsx";

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
    children?: React.ReactNode;
    mobileNav?: React.ReactNode;
}
export function Header({ path, title = "xGov", LinkComponent = Link, children, mobileNav}: HeaderProps){
    return (
        <header
            className="w-full h-16 lg:h-24 flex justify-between items-center border-b-2 border-algo-black bg-white px-4 lg:px-10">
            <h1 className="text-4xl lg:text-7xl font-bold">{title}</h1>
            <div className="hidden lg:inline-flex items-center gap-2 lg:gap-20">
                <nav className="hidden md:flex gap-20 font-bold text-lg">
                    <LinkComponent data-testid="header-docs-link" className={path === '/docs' ? 'bg-algo-blue' : ''} to="/docs">Docs</LinkComponent>
                    <LinkComponent data-testid="header-cohort-link" className={path === '/cohort' ? 'bg-algo-blue' : ''} to="/cohort">Cohort</LinkComponent>
                </nav>
                {children}
            </div>
            <div className="lg:hidden">
                <BarsIcon />
                {mobileNav}
            </div>
        </header>
    )
}

