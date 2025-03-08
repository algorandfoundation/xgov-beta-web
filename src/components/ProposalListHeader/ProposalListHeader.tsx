
export interface ProposalListHeaderProps {
    title: string;
    children: React.ReactNode;
}

export default function ProposalListHeader({ title, children }: ProposalListHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 px-3">
            <div className="sm:flex-auto">
                <h1 className="text-2xl md:text-4xl font-semibold text-algo-blue dark:text-algo-teal">{title}</h1>
            </div>
            <div className="sm:ml-16 sm:mt-0 sm:flex-none flex flex-wrap-reverse justify-end items-center gap-2 md:gap-6">
                {children}
            </div>
        </div>
    )
}