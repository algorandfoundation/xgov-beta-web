
export interface ActionButtonProps {
    innerRef?: React.RefObject<HTMLButtonElement>;
    type: "button" | "submit" | "reset" | undefined;
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
}

export default function ActionButton({ innerRef, type, onClick, disabled, children }: ActionButtonProps) {
    return (
        <button
            ref={innerRef}
            type={type}
            // hover:border-l-[3px] hover:border-b-[3px] hover:-translate-y-[1px] hover:translate-x-[1px] disabled:border-2 disabled:translate-y-0 disabled:translate-x-0
            className="border-2  text-xs text-algo-black disabled:text-algo-black-40 dark:text-algo-blue-20 border-algo-black disabled:border-algo-black-40 dark:border-algo-blue-20 hover:border-algo-teal hover:text-algo-teal dark:hover:border-algo-blue-50 dark:hover:text-algo-blue-50 rounded-md px-2 py-1 duration-100"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    )
}