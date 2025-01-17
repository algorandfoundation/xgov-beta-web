import { DocumentIcon } from "../icons/DocumentIcon";
import { Link } from "../Link";

export default function LoraPillLink({ id }: { id: bigint }) {
    return (
        <Link
            to={`https://lora.algokit.io/localnet/application/${id}`}
            className="group w-fit flex items-center bg-algo-blue dark:bg-algo-teal hover:bg-algo-blue dark:hover:bg-algo-black-90 text-algo-blue dark:text-algo-black hover:text-white dark:hover:text-white rounded-full text-xl lg:text-3xl max-w-3xl font-bold px-3 py-[3px] transition z-10"
        >
            <DocumentIcon className="size-6 -translate-x-1 stroke-algo-blue dark:stroke-algo-black group-hover:stroke-white dark:group-hover:stroke-white transition" />
            Proposal {Number(id)}
        </Link>
    )
}