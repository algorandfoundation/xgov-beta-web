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
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/functions";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";

export interface TutorialDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const tutorialSteps = [
    {
        title: "Welcome to xGov!",
        description: "You've successfully connected your wallet to the xGov platform. Let's take a quick tour of what you can do here.",
        content: "xGov is a decentralized, on-chain platform enabling Algorand consensus participants to fund builders across the ecosystem."
    },
    {
        title: "Browse Proposals",
        description: "Explore active proposals from builders in the Algorand ecosystem.",
        content: "On the main page, you'll find all active proposals. You can filter them by status, type, requested amount, and category to find what interests you most."
    },
    {
        title: "Become an xGov",
        description: "Participate in governance by becoming an xGov voter.",
        content: "As an xGov, you can vote on proposals based on your account's participation in consensus. Visit your profile to sign up and become part of the decision-making process."
    },
    {
        title: "Submit Proposals",
        description: "Have an idea? Submit your own proposal to get funding.",
        content: "If you're a builder with a great idea, you can become a proposer and submit proposals for community funding. Complete KYC verification to get started."
    },
    {
        title: "Your Profile",
        description: "Manage your xGov status and proposals from your profile.",
        content: "Access your profile to view your voting status, submitted proposals, and manage your participation in the xGov ecosystem."
    }
];

export function TutorialDialog({ isOpen, onClose }: TutorialDialogProps) {
    const [currentStep, setCurrentStep] = useState(0);

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

    const currentStepData = tutorialSteps[currentStep];

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="w-full h-full sm:h-auto sm:max-w-[900px] lg:max-w-[1000px] sm:rounded-lg"
                onCloseClick={handleClose}
            >
                {/* Mobile Layout */}
                <div className="sm:hidden">
                    <DialogHeader className="mt-12 flex flex-col items-start gap-2">
                        <DialogTitle className="dark:text-white text-xl">
                            {currentStepData.title}
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            {currentStepData.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <p className="text-algo-black dark:text-white leading-relaxed">
                            {currentStepData.content}
                        </p>
                    </div>

                    <DialogFooter>
                        <div className="flex flex-row justify-end items-center">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    className={cn(
                                        currentStep === 0 && "opacity-0 pointer-events-none",
                                        "flex items-center gap-1"
                                    )}
                                >
                                    <ChevronLeftIcon className="size-4" />
                                    Previous
                                </Button>

                                {currentStep < tutorialSteps.length - 1 ? (
                                    <Button
                                        onClick={handleNext}
                                        className="flex items-center gap-1"
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

                <div className="hidden sm:flex h-[600px] pt-4">
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

                    {/* Right Content Area */}
                    <div className="flex-1 pl-6 pt-6 flex flex-col">
                        <DialogHeader className="flex flex-col items-start gap-3 mb-6">
                            <DialogTitle className="dark:text-white text-2xl">
                                {currentStepData.title}
                            </DialogTitle>
                            <DialogDescription className="text-left text-base">
                                {currentStepData.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 mb-6">
                            <p className="text-algo-black dark:text-white leading-relaxed text-base">
                                {currentStepData.content}
                            </p>
                        </div>

                        <DialogFooter className="flex flex-row justify-between items-center">
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    className={cn(
                                        currentStep === 0 && "opacity-0 pointer-events-none",
                                        "flex items-center gap-2"
                                    )}
                                >
                                    <ChevronLeftIcon className="size-4" />
                                    Previous
                                </Button>

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
    );
}
