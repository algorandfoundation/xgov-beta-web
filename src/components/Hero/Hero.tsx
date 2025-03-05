import { AlgoShapeIcon1 } from "@/components/icons/AlgoShapeIcon1.tsx";
import { AlgoShapeIcon2 } from "@/components/icons/AlgoShapeIcon2.tsx";
import { AlgoShapeIcon4 } from "@/components/icons/AlgoShapeIcon4.tsx";
import { AlgoShapeIcon5 } from "@/components/icons/AlgoShapeIcon5.tsx";
import { AlgoShapeIcon7 } from "@/components/icons/AlgoShapeIcon7.tsx";
import { AlgoShapeIcon9 } from "@/components/icons/AlgoShapeIcon9.tsx";
import { AlgoShapeIcon10 } from "@/components/icons/AlgoShapeIcon10.tsx";
import { AlgoShapeIcon11 } from "@/components/icons/AlgoShapeIcon11.tsx";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon.tsx";
import animations from "@/styles/homepage-animations.module.css";
import { cn } from "@/functions/utils";

export interface HeroProps {
    title: string;
    description: string;
    xgovs: number;
    proposals: number;
    treasury: number;
    votes: number;
}

export function Hero({ title, description, xgovs, proposals, treasury, votes }: HeroProps) {
    return (
        <div className="relative w-full flex flex-col bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black rounded-b-3xl pt-24 xs:px-2 mb-2 lg:px-8 overflow-hidden">
            <div className="w-full flex flex-col lg:flex-row justify-between">
                <h1 className={cn(
                    animations.titleFadeIn,
                    "w-40 md:w-full text-wrap p-3 lg:p-6 text-4xl lg:text-8xl font-bold z-10"
                )}>
                    {title}
                </h1>
                <AlgoShapeIcon2 className={cn(
                    animations.shapeSlideFadeIn1,
                    "absolute right-2 xs:right-4 md:right-auto fill-white/10"
                )} />
                <AlgoShapeIcon4 className={cn(
                    animations.shapeSlideFadeIn2,
                    "hidden md:block absolute right-4 lg:right-10 stroke-algo-blue-40 dark:stroke-algo-teal-40"
                )} />
                <AlgoShapeIcon5 className={cn(
                    animations.shapeSlideFadeIn3,
                    "absolute fill-white/10 left-2 sm:left-auto"
                )} />
                <AlgoShapeIcon7 className={cn(
                    animations.shapeSlideFadeIn4,
                    "hidden md:block absolute stroke-algo-blue-40 dark:stroke-algo-teal-40"
                )} />
                <AlgoShapeIcon9 className={cn(
                    animations.shapeSlideFadeIn5,
                    "absolute right-36 sm:right-52 top-24 fill-algo-blue dark:fill-algo-teal dark:sm:fill-white/10 sm:fill-white/10"
                )} />
                <AlgoShapeIcon10 className={cn(
                    animations.shapeSlideFadeIn6,
                    "hidden md:block absolute right-20 fill-white/10"
                )} />
                <AlgoShapeIcon10 className={cn(
                    animations.shapeSlideFadeIn7,
                    "hidden md:block absolute right-20 fill-white/10"
                )} />
                <AlgoShapeIcon11 className={cn(
                    animations.shapeSlideFadeIn8,
                    "absolute fill-white/10"
                )} />
                <p className={cn(
                    animations.descriptionFadeIn,
                    "font-mono lg:text-2xl lg:pt-44 max-w-lg lg:max-w-4xl p-2 md:pr-8 mb-0 sm:mb-14 lg:mb-0 mt-2 z-10"
                )}>
                    {description}
                </p>
            </div>
            <div className="w-full flex mt-8 lg:mt-6 p-4">
                <div className={cn(
                    animations.popUpInCohort,
                    "relative w-full flex flex-col md:px-4"
                )}>
                    <div className="absolute -top-8 -left-6 w-[53rem]">
                        <AlgoShapeIcon1 className="w-full h-full stroke-algo-blue-10 dark:stroke-algo-teal-10 stroke-[0.2]" />
                    </div>
                    <div className="absolute -top-4 -left-4 w-[52rem]">
                        <AlgoShapeIcon1 className="w-full h-full fill-white/10" />
                    </div>

                    <h1 className="text-2xl mb-2 font-bold">Current Cohort</h1>
                    <ul className="flex flex-wrap gap-x-8 gap-y-4 sm:gap-10 md:gap-40 text-sm font-mono text-white dark:text-algo-black">
                        <li className="flex flex-col">
                            <span className="text-bold text-algo-blue-30 dark:text-algo-black-70">xGovs</span>
                            {xgovs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </li>
                        <li className="flex flex-col">
                            <span className="text-bold text-algo-blue-30 dark:text-algo-black-70">Proposals</span>
                            {proposals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </li>
                        <li className="flex flex-col">
                            <span className="text-bold text-algo-blue-30 dark:text-algo-black-70">Treasury</span>
                            <span className="flex items-center gap-1">
                                {(treasury / 1_000_000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                <AlgorandIcon className="fill-white dark:fill-algo-black size-3" />
                            </span>
                        </li>
                        <li className="flex flex-col">
                            <span className="text-bold text-algo-blue-30 dark:text-algo-black-70">Votes</span>
                            {votes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}