import React from "react";

export type LinkProps = {
    className?: string;
    to: string;
    children: React.ReactNode;
}

export function Link({to, children, className = '', ...rest}: LinkProps){
    return (
        <a className={className} href={to} {...rest}>{children}</a>
    )
}
