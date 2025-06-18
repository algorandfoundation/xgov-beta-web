import { Link } from "@/components/Link";
import { DocumentIcon } from "../icons/DocumentIcon";
import { NetworkId } from "@txnlab/use-wallet-react";

export function LoraPillLink({
  id,
  className,
  network = NetworkId.LOCALNET
}: {
  id: bigint;
  className?: string;
  network?: NetworkId
}) {
  return (
    <Link
      target="_blank"
      to={`https://lora.algokit.io/${network}/application/${id}`}
      className={`group w-fit flex items-center bg-algo-blue/10 dark:bg-algo-teal/10 hover:bg-algo-blue dark:hover:bg-algo-teal text-algo-blue dark:text-white hover:text-white dark:hover:text-algo-black rounded-full max-w-3xl px-3 py-[3px] transition z-10 ${className}`}
    >
      {Number(id)}
      <DocumentIcon className="size-4 translate-x-1 stroke-algo-blue dark:stroke-white group-hover:stroke-white dark:group-hover:stroke-algo-black transition" />
    </Link>
  );
}
