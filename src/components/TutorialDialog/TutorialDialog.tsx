import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/functions";
import { TermsAndConditionsModal } from "@/recipes";
import termsAndConditionsString from "../ProfileCard/TermsAndConditionsText.md?raw";
import { BecomeProposerModal } from "../BecomeProposerModal/BecomeProposerModal";
import { BecomeXGovModal } from "../BecomeXGovModal/BecomeXGovModal";
import type { TransactionStateInfo } from "@/api/types/transaction_state";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";

export interface TutorialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentPage?: 'home' | 'profile' | 'proposals' | 'other';
    activeAddress: string | null;
    isXGov: boolean;
    xGovSignupCost: bigint;
    subscribeXgov: () => Promise<void>;
    subscribeXgovTxnState: TransactionStateInfo;
    isProposer: boolean;
    proposerSignupCost: bigint;
    subscribeProposer: () => Promise<void>;
    subscribeProposerTxnState: TransactionStateInfo;
}

const tutorialSteps = [
    {
        title: "Welcome to xGov",
        description: "You've successfully connected your wallet to the xGov platform. Let's take a quick tour of what you can do here.",
        content: `xGov is a decentralized, on-chain platform that enables Algorand Consensus participants to fund open-source builders across the ecosystem.`,
        action: null
    },
    {
        title: "Browse Proposals",
        description: "Explore active proposals from builders in the Algorand ecosystem.",
        content: `No extra steps are required to explore active proposals or review proposals that have been voted on. Simply click "Browse Proposals" below to start.`,
        action: {
            label: "Browse Proposals",
            type: "browse-proposals" as const
        }
    },
    {
        title: "Become an xGov",
        description: "Participate in governance by becoming an xGov voter.",
        content: `An xGov is an Algorand address that:
            - Has voting power derived from consensus participation through produced blocks.
            - Enrolled as an xGov in this platform by paying the one-time enrollment fee of 10 Algo.

            Note: The enrollment fee will be set to 1 ALGO until August 14th to encourage sign-ups. For the remainder of August, it will increase to 5 ALGO. From September, the enrollment fee will be set to 10 ALGO.

            Voting power is calculated by looking at all blocks produced during an observation window of 3,000,000 blocks. For the first xGov cohort the observation window is the three million blocks leading up to block 51,000,000. The cohort list will be updated every millionth block thereafter. 

            Once you formally enroll and pay the account creation fee, your address is cross-checked with the latest cohort list, and added to the next voting committee. This only happens periodically (ie. weekly), which means it can take a few days between paying the account creation fee and being able to vote on your first proposal. 

            Happy voting!
        `,
        action: {
            label: "Become an xGov",
            type: "become-xgov" as const
        }
    },
    {
        title: "Submit Proposals",
        description: "Built something cool that the community loves? Submit your own proposal to get funding.",
        content: `The xGov grants program aims to fund open-source builders across the ecosystem, fostering the development of useful tools for the community.

            Submitting a proposal is a four step process:
            1. Create your proposer profile by reading and agreeing to the program terms and conditions
            2. Paying the account creation fee
            3. Completing the know-your-customer process
            4. Creating your first proposal and paying the refundable anti-spam fee
        `,
        action: null
        // action: {
        //     label: "Get Started",
        //     type: "become-proposer" as const
        // }
    },
    {
        title: "Manage Your Profile",
        description: "Manage your xGov status and proposals from your profile.",
        content: "Visit your Profile page to manage your xGov status, create and manage proposals.",
        action: {
            label: "Manage Profile",
            type: "manage-profile" as const
        }
    }
];

export function TutorialDialog({
    isOpen,
    onClose,
    currentPage = 'other',
    activeAddress,
    xGovSignupCost,
    subscribeXgov,
    subscribeXgovTxnState,
    proposerSignupCost,
    subscribeProposer,
    subscribeProposerTxnState,
    isXGov = false,
    isProposer = false
}: TutorialDialogProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [showBecomeXGovModal, setShowBecomeXGovModal] = useState(false);
    const [showBecomeProposerModal, setShowBecomeProposerModal] = useState(false);
    const [showBecomeProposerTermsModal, setShowBecomeProposerTermsModal] = useState(false);

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    const handleAction = (actionType: string) => {
        switch (actionType) {
            case 'browse-proposals':
                if (currentPage === 'home') {
                    handleClose();
                    setTimeout(() => {
                        const element = document.getElementById('list-header-title-anchor');
                        element?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                    }, 100);
                } else {
                    window.location.href = '/#list-header-title-anchor';
                }
                break;

            case 'become-xgov':
                setShowBecomeXGovModal(true);
                break;

            case 'become-proposer':
                setShowBecomeProposerTermsModal(true);
                break;

            case 'manage-profile':
                if (currentPage === 'profile') {
                    handleClose();
                } else {
                    window.location.href = `/profile/${activeAddress}`;
                }
                break;
        }
    };

    const getActionButton = (step: typeof tutorialSteps[0], stepIndex: number) => {
        if (!step.action) return null;

        const { type, label } = step.action;

        if (type === 'become-xgov') {
            if (isXGov) {
                return (
                    <div className="flex items-center gap-2 text-xs">
                        <CheckIcon className="size-4 text-algo-green dark:text-algo-black" />
                        Already an xGov
                    </div>
                );
            }

            return (
                <Button
                    onClick={() => handleAction(type)}
                    variant='outline'
                    disabled={subscribeXgovTxnState.isPending}
                    className="flex items-center gap-2"
                >
                    {subscribeXgovTxnState.isPending ? (
                        <>
                            <div className="size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        label
                    )}
                </Button>
            );
        }

        // if (type === 'become-proposer') {
        //     if (isProposer) {
        //         return (
        //             <div className="flex items-center gap-2 text-xs">
        //                 <CheckIcon className="size-4 text-algo-green dark:text-algo-black" />
        //                 Already a Proposer
        //             </div>
        //         );
        //     }

        //     return (
        //         <Button
        //             onClick={() => handleAction(type)}
        //             variant='outline'
        //             disabled={subscribeProposerTxnState.isPending}
        //             className="flex items-center gap-2"
        //         >
        //             {subscribeProposerTxnState.isPending ? (
        //                 <>
        //                     <div className="size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        //                     Processing...
        //                 </>
        //             ) : (
        //                 label
        //             )}
        //         </Button>
        //     );
        // }

        return (
            <Button
                onClick={() => handleAction(type)}
                variant='outline'
            >
                {label}
            </Button>
        );
    };

    const currentStepData = tutorialSteps[currentStep];

    return (
        <>
            <Dialog open={isOpen}>
                <DialogContent
                    className="w-full h-full sm:h-auto sm:max-w-6xl sm:rounded-lg"
                    onCloseClick={handleClose}
                >
                    <div className="sm:hidden flex flex-col h-full">
                        <DialogHeader className="mt-12 flex flex-col items-start gap-2 flex-shrink-0">
                            <DialogTitle className="dark:text-white text-xl">
                                {currentStepData.title}
                            </DialogTitle>
                            <DialogDescription className="text-left">
                                {currentStepData.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6 flex-1 overflow-y-auto">
                            <p className="text-algo-black dark:text-white leading-relaxed whitespace-pre-line pb-14">
                                {currentStepData.content}
                            </p>
                        </div>

                        <DialogFooter className="flex-shrink-0">
                            <div className="flex flex-row justify-end items-center">
                                <div className="w-full flex justify-between gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={handlePrevious}
                                        className={cn(
                                            currentStep === 0 && "opacity-0 pointer-events-none",
                                            "flex items-center gap-1 xs:text-xs xs:px-2 xs:py-1"
                                        )}
                                    >
                                        <ChevronLeftIcon className="size-4 xs:size-3" />
                                        <span className="hidden sm:inline">Previous</span>
                                    </Button>

                                    {getActionButton(currentStepData, currentStep)}

                                    {currentStep < tutorialSteps.length - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            className="flex items-center gap-1 xs:text-xs xs:px-2 xs:py-1"
                                        >
                                            <span className="xs:hidden">Next</span>
                                            <ChevronRightIcon className="size-4 xs:size-3" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleClose}
                                            variant="default"
                                            className="bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black xs:text-xs xs:px-2 xs:py-1"
                                        >
                                            Get Started
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-center mb-4">
                                <div className="flex space-x-2">
                                    {tutorialSteps.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                                ? "bg-algo-blue dark:bg-algo-teal"
                                                : "bg-algo-black-20 dark:bg-algo-black-60"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </DialogFooter>
                    </div>

                    <div className="hidden sm:flex min-h-[700px] pt-4">
                        <div className="w-1/3 border-r border-algo-black-20 dark:border-algo-black-60 pr-6 py-6">
                            <div className="space-y-4">
                                {tutorialSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer border",
                                            index === currentStep
                                                ? "bg-algo-blue/10 dark:bg-algo-teal/10 border-algo-blue dark:border-algo-teal"
                                                : "hover:bg-algo-black-10 dark:hover:bg-algo-black-80 border-transparent",

                                        )}
                                        onClick={() => setCurrentStep(index)}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5",
                                            index === currentStep
                                                ? "bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black"
                                                : index < currentStep
                                                    ? "bg-algo-blue dark:bg-algo-teal text-white"
                                                    : "bg-algo-black-20 dark:bg-algo-black-60 text-algo-black-60 dark:text-algo-black-40"
                                        )}>
                                            {index < currentStep ? <CheckCircleIcon /> : index + 1}
                                        </div>
                                        <div className={cn(
                                            index < currentStep && "opacity-50",
                                            "min-w-0"
                                        )}>
                                            <h4 className={cn(
                                                "font-medium text-sm mb-1",
                                                index === currentStep
                                                    ? "text-algo-blue dark:text-algo-teal"
                                                    : "text-algo-black dark:text-white"
                                            )}>
                                                {step.title}
                                            </h4>
                                            <p className="text-xs text-algo-black-60 dark:text-algo-black-40 line-clamp-2">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 pl-6 pt-6 flex flex-col">
                            <DialogHeader className="flex flex-col items-start gap-3 mb-6">
                                <DialogTitle className="dark:text-white text-2xl">
                                    {currentStepData.title}
                                </DialogTitle>
                                <DialogDescription className="text-left text-base">
                                    {currentStepData.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 mb-6 overflow-y-scroll">
                                <p className="text-algo-black dark:text-white leading-relaxed text-base whitespace-pre-line">
                                    {currentStepData.content}
                                </p>
                            </div>

                            <DialogFooter className="flex flex-row justify-between items-center">
                                <div className="w-full flex justify-between gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={handlePrevious}
                                        className={cn(
                                            currentStep === 0 && "opacity-0 pointer-events-none",
                                            "flex items-center gap-2 self-start"
                                        )}
                                    >
                                        <ChevronLeftIcon className="size-4" />
                                        Previous
                                    </Button>

                                    {getActionButton(currentStepData, currentStep)}

                                    {currentStep < tutorialSteps.length - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            className="flex items-center gap-2"
                                        >
                                            Next
                                            <ChevronRightIcon className="size-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleClose}
                                            variant="default"
                                            className="bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black"
                                        >
                                            Get Started
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <BecomeXGovModal
                isOpen={showBecomeXGovModal}
                onClose={() => setShowBecomeXGovModal(false)}
                onSignup={subscribeXgov}
                costs={xGovSignupCost}
                txnState={subscribeXgovTxnState}
            />

            <TermsAndConditionsModal
                title="xGov Proposer Terms & Conditions"
                description={
                    <>
                        <div>
                            By becoming a proposer, you will be able to submit funding
                            proposals.
                        </div>
                        <div>
                            Proposers need to agree to the Terms and Conditions below.
                        </div>
                    </>
                }
                terms={termsAndConditionsString}
                isOpen={showBecomeProposerTermsModal}
                onClose={() => setShowBecomeProposerTermsModal(false)}
                onAccept={() => {
                    setShowBecomeProposerTermsModal(false);
                    setShowBecomeProposerModal(true);
                }}
            />

            <BecomeProposerModal
                isOpen={showBecomeProposerModal}
                onClose={() => setShowBecomeProposerModal(false)}
                onSignup={subscribeProposer}
                costs={proposerSignupCost}
                txnState={subscribeProposerTxnState}
            />
        </>
    );
}
