import { Page } from "../components/Page.tsx";
import { ProposalFilter } from "@/components/ProposalFilter/ProposalFilter.tsx";
import { ProposalList } from "@/components/ProposalList/ProposalList.tsx";
import { Link } from "react-router-dom";
import { type ComponentType } from "react";
import type { LinkProps } from "../components/Link.tsx";
import { useGetAllProposals } from "src/hooks/useProposals.ts";
import { AlgoShapeIcon2 } from "@/components/icons/AlgoShapeIcon2.tsx";
import { AlgoShapeIcon4 } from "@/components/icons/AlgoShapeIcon4.tsx";
import { AlgoShapeIcon5 } from "@/components/icons/AlgoShapeIcon5.tsx";
import { AlgoShapeIcon7 } from "@/components/icons/AlgoShapeIcon7.tsx";
import { AlgoShapeIcon9 } from "@/components/icons/AlgoShapeIcon9.tsx";
import { AlgoShapeIcon10 } from "@/components/icons/AlgoShapeIcon10.tsx";
import { AlgoShapeIcon11 } from "@/components/icons/AlgoShapeIcon11.tsx";
import animations from "@/styles/homepage-animations.module.css";
import { cn } from "@/functions/utils.ts";
import { AlgoShapeIcon1 } from "@/components/icons/AlgoShapeIcon1.tsx";
import { FocusMap, ProposalFundingTypeMap, statusToPhase, type ProposalSummaryCardDetails } from "@/types/proposals.ts";
import { shortenAddress } from "@/functions/shortening.ts";
import { capitalizeFirstLetter } from "@/functions/capitalization.ts";
import { TokenIcon } from "@/components/icons/TokenIcon.tsx";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon.tsx";
import { UserCircleIcon } from "@/components/icons/UserCircleIcon.tsx";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon.tsx";
import { ChatBubbleLeftIcon } from "@/components/icons/ChatBubbleLeftIcon.tsx";
import { TargetIcon } from "@/components/icons/TargetIcon.tsx";

const title = 'Algorand xGov ';

export function HomePage() {

    const proposals = useGetAllProposals();

    return (
        <>
            {/* <div className={cn(
                animations.intro,
                "absolute h-svh w-full flex items-center justify-center bg-algo-blue dark:bg-algo-teal text-center text-8xl font-extrabold [-webkit-text-fill-color:rgb(45_45_241/var(--tw-bg-opacity,_1))] [-webkit-text-stroke:2px_white] z-[60] overflow-hidden"
            )}>
                <span className="mb-2 font-mono text-[10rem] mr-2">[</span>
                <h1 className="text-white mb-0 mx-0">Hello xGov</h1>
                <span className="mb-2 font-mono text-[10rem] ml-1">]</span>
            </div> */}
            <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
                <div className="relative w-full flex flex-col bg-algo-blue dark:bg-algo-teal text-white rounded-b-3xl pt-24 xs:px-2 mb-2 lg:px-8 overflow-hidden">
                    <div className="w-full flex flex-col lg:flex-row justify-between text-white">
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
                            "absolute fill-white/10 left-2"
                        )} />
                        <AlgoShapeIcon7 className={cn(
                            animations.shapeSlideFadeIn4,
                            "hidden md:block absolute stroke-algo-blue-40 dark:stroke-algo-teal-40"
                        )} />
                        <AlgoShapeIcon9 className={cn(
                            animations.shapeSlideFadeIn5,
                            "absolute right-36 sm:right-52 top-24 fill-algo-blue dark:fill-algo-teal md:fill-white/10"
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
                            "font-mono lg:text-2xl lg:pt-44 lg:max-w-4xl p-2 md:pr-8 mt-2 z-10"
                        )}>
                            xGov is a decentralized platform powered by Algorand smart contracts that enables community-driven funding for innovative projects and ideas. Through transparent governance, it empowers the Algorand ecosystem to collectively evaluate and support impactful initiatives.
                        </p>
                    </div>
                    {/* border-t border-r border-l border-white rounded-t-3xl */}
                    <div className="w-full flex mt-8 lg:mt-6 p-4">
                        <div className={cn(
                            animations.popUpInCohort,
                            "relative w-full flex flex-col md:px-4"

                        )}>
                            {/* <div className="absolute -top-40 -left-20 w-[54rem] -rotate-[78deg]">
                                <AlgoShapeIcon5 className="w-full h-full stroke-algo-blue-10 dark:stroke-algo-teal-10 stroke-[0.2]" />
                            </div> */}
                            <div className="absolute -top-8 -left-6 w-[53rem]">
                                <AlgoShapeIcon1 className="w-full h-full stroke-algo-blue-10 dark:stroke-algo-teal-10 stroke-[0.2]" />
                            </div>
                            <div className="absolute -top-4 -left-4 w-[52rem]">
                                <AlgoShapeIcon1 className="w-full h-full fill-white/10" />
                            </div>

                            <h1 className="text-2xl mb-2 font-bold">Current Cohort</h1>
                            <ul className="flex gap-10 md:gap-40 text-algo-blue-30 dark:text-algo-teal-30">
                                <li className="flex flex-col">
                                    <span className="text-bold text-white">xGovs</span>
                                    4,800
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-bold text-white">Proposals</span>
                                    127
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-bold text-white">Treasury</span>
                                    1,000,000 ALGO
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-bold text-white">Votes</span>
                                    8,329
                                </li>
                            </ul>
                        </div>
                        {/* <div className="hidden w-full md:flex flex-col items-end">
                            <h1 className="text-2xl mb-2 font-bold">Current Cohort</h1>
                            <ul className="flex gap-10 text-white/80">
                                <li>Stuff One</li>
                                <li>Stuff Two</li>
                                <li>Stuff Three</li>
                                <li>Stuff Four</li>
                            </ul>
                        </div> */}
                    </div>
                </div>
                {/* {!!proposals.data && <Table proposals={proposals.data} />} */}
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-4 px-3">
                        <div className="sm:flex-auto">
                            <h1 className="text-2xl md:text-4xl font-semibold text-algo-blue dark:text-algo-teal">Active Proposals  </h1>
                        </div>
                        <div className="sm:ml-16 sm:mt-0 sm:flex-none flex gap-2 md:gap-6">
                            <ProposalFilter />
                            <button
                                type="button"
                                className="block rounded-md bg-algo-blue dark:bg-algo-teal px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-algo-blue-50 dark:hover:bg-algo-teal-50"
                            >
                                New Proposal
                            </button>
                        </div>
                    </div>
                    {
                        !!proposals.data && <StackedList proposals={proposals.data} />
                    }
                </div>


                {/* <div>
                    {
                        !!proposals.data && <ProposalList proposals={proposals.data} />
                    }
                </div> */}
                {/* <div className="lg:justify-self-end lg:min-w-[36rem]">
                    <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Current Cohort</h1>
                </div> */}
            </Page>
        </>
    )
}

const commenters = [
    {
        id: 12,
        name: 'Emma Dorsey',
        imageUrl:
            'https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        id: 6,
        name: 'Tom Cook',
        imageUrl:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        id: 4,
        name: 'Lindsay Walton',
        imageUrl:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        id: 16,
        name: 'Benjamin Russel',
        imageUrl:
            'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
        id: 23,
        name: 'Hector Gibbons',
        imageUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
];

export default function StackedList({ proposals }: { proposals: ProposalSummaryCardDetails[] }) {
    return (
        <div className="flex flex-col gap-y-4">
            {proposals.map(({
                id,
                title,
                status,
                focus,
                fundingType,
                requestedAmount,
                proposer
            }) => {

                const phase = statusToPhase[status];

                return (
                    <div
                        key={id}
                        className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:flex-nowrap relative transition overflow-hidden"
                    >
                        <Link className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30" to={`/proposal/${Number(id)}`}></Link>
                        <div>
                            <p className="text-xl font-semibold text-algo-black dark:text-white">
                                <div className="flex-grow-0 inline-flex items-center">
                                    <span className="text-2xl [-webkit-text-fill-color:#ffffff] dark:[-webkit-text-fill-color:#001324] [-webkit-text-stroke:1px_#2d2df1] dark:[-webkit-text-stroke:1px_white]">[</span>
                                    <span
                                        className={cn(
                                            phase === 'draft' ? 'text-algo-black-60' : '',
                                            phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                                            phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                                            phase === 'voting' ? 'text-algo-teal' : '',

                                            "p-0.5 px-1.5 text-base lg:text-lg"
                                        )}>

                                        {capitalizeFirstLetter(phase)}

                                    </span>
                                </div>
                                
                                <span className="text-2xl [-webkit-text-fill-color:#ffffff] dark:[-webkit-text-fill-color:#001324] [-webkit-text-stroke:1px_#2d2df1] dark:[-webkit-text-stroke:1px_white] mr-4">]</span>
                                {title}
                            </p>
                            <div className="mt-3 hidden md:flex md:items-center gap-4 md:gap-10 text-algo-blue dark:text-algo-teal font-mono">
                                <Link
                                    to={`/profile/${proposer}`}
                                    className="group flex items-center bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal hover:text-white rounded-full px-2.5 py-[3px] transition z-10"
                                >
                                    <UserCircleIcon className="size-6 -translate-x-2 group-hover:stroke-white" />
                                    {proposer.length === 58 ? shortenAddress(proposer) : proposer}
                                </Link>

                                <p className="flex items-center text-base text-algo-black dark:text-white/80 w-40">
                                    <TokenIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5 mr-3" />
                                    {(Number(requestedAmount) / 1_000_000).toLocaleString()}
                                    <AlgorandIcon className="fill-algo-black dark:fill-white/80 size-3" />
                                </p>

                                <p className="flex items-center gap-2 text-lg text-algo-black dark:text-white/80">
                                    <TargetIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5" />
                                    {FocusMap[focus]}
                                </p>
                            </div>
                        </div>
                        <dl className="flex w-full flex-none justify-between md:gap-x-8 sm:w-auto font-mono">
                            <div className="mt-3 flex md:hidden flex-col items-start justify-start gap-4 md:gap-10 text-algo-blue dark:text-algo-teal font-mono text-xs">
                                <Link
                                    to={`/profile/${proposer}`}
                                    className="group flex items-center bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal hover:text-white rounded-full px-2.5 py-[3px] transition z-10"
                                >
                                    <UserCircleIcon className="size-6 -translate-x-2 group-hover:stroke-white" />
                                    {proposer.length === 58 ? shortenAddress(proposer) : proposer}
                                </Link>

                                <p className="flex items-center text-algo-black dark:text-white/80 w-40">
                                    <TokenIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5 ml-1 mr-3" />
                                    {(Number(requestedAmount) / 1_000_000).toLocaleString()}
                                    <AlgorandIcon className="fill-algo-black dark:fill-white/80 size-3 ml-1" />
                                </p>

                                <p className="flex items-center gap-2 text-algo-black dark:text-white/80">
                                    <TargetIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5 ml-1 mr-1" />
                                    {FocusMap[focus]}
                                </p>
                            </div>
                            <div className="flex flex-col justify-end items-end gap-4 mr-2">
                                <div className="flex gap-6">
                                    <div className="flex flex-shrink-0 -space-x-0.5 py-0.5">
                                        <dt className="sr-only">Commenters</dt>
                                        {commenters.map((commenter) => (
                                            <dd key={commenter.id}>
                                                <img
                                                    alt={commenter.name}
                                                    src={commenter.imageUrl}
                                                    className="size-4 md:size-6 rounded-full bg-white darl:bg-algo-black ring-2 ring-white dark:ring-algo-black"
                                                />
                                            </dd>
                                        ))}
                                    </div>
                                    <Link
                                        to={`/proposal/${Number(id)}`}
                                        className="group flex items-center gap-2 px-2.5 py-0.5 bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal rounded-full z-10"
                                    >
                                        <dt>
                                            <span className="sr-only">Total comments</span>
                                            {phase === 'resolved' ? (
                                                <CheckCircleIcon aria-hidden="true" className="size-4 md:size-6 text-algo-blue dark:text-algo-teal group-hover:text-white" />
                                            ) : (
                                                <ChatBubbleLeftIcon aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />
                                            )}
                                        </dt>
                                        <dd className="text-xs md:text-base text-algo-blue dark:text-algo-teal group-hover:text-white">7</dd>
                                    </Link>
                                </div>
                                <div className="flex items-center gap-2 md:gap-6 text-xs md:text-lg text-algo-black dark:text-white/80">
                                    {ProposalFundingTypeMap[fundingType]}
                                    <span className="font-bold text-algo-blue dark:text-algo-teal">//</span>
                                    <p className="w-10 text-nowrap md:w-16 text-end">
                                        <time dateTime="2023-01-23T22:34Z">2d ago</time>
                                    </p>
                                </div>
                            </div>
                        </dl>
                    </div>
                )
            })}
        </div>
    )
}
