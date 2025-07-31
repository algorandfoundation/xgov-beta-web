import { cn } from "@/functions/utils";
import animations from "@/styles/homepage-animations.module.css";
import { AlgorandIcon } from "../icons/AlgorandIcon";

export function HeroAnimation() {
  return (
    <div
      className={cn(
        animations.intro,
        "fixed w-full h-full z-[60] overflow-hidden px-2 lg:px-4",
      )}
    >
      <div className="h-full w-full flex items-center justify-center bg-algo-blue dark:bg-algo-teal">
        <AlgorandIcon className="fill-white dark:fill-black size-20" />
      </div>
    </div>
  );
}
