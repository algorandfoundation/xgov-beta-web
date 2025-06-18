import { TriangleAlertIcon } from "lucide-react";

export function WarningNotice({ title, description }: { title: string; description: JSX.Element }) {
    return (
        <div className="flex items-center justify-start border border-algo-orange dark:border-algo-yellow w-full my-2 p-2 px-3 rounded-lg">
            <div className="inline-flex items-start gap-3">
                <TriangleAlertIcon className="flex-shrink-0 size-8 text-algo-orange dark:text-algo-yellow" />
                <div className="text-sm text-left">
                    <h6 className="text-xs">{title}</h6>
                    {description}
                </div>
            </div>
        </div>
    )
}