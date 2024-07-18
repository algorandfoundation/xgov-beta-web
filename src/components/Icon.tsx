import React from "react";

export type IconProps = {
    name: string;
    class: string;
} & React.HTMLAttributes<HTMLDivElement>

export function Icon({name, class: className}: {name: string, class?: string}){
    return (
        <div className={className} aria-label={name}/>
    )
}
