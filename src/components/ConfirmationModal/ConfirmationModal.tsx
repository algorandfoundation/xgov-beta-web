import { AlgorandIcon } from "../icons/AlgorandIcon";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { WarningNotice } from "../WarningNotice/WarningNotice";

export interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    warning?: JSX.Element;
    submitText?: string;
    onSubmit: () => Promise<void>;
    loading?: boolean;
    errorMessage?: string;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    title,
    description,
    warning,
    submitText = "Submit",
    onSubmit,
    loading = false,
    errorMessage = '',
}: ConfirmationModalProps) {

    const innerOnSubmit = async () => {
        try {
            await onSubmit();
        } catch (error) {
            console.error("Error during proposal submission:", error);
        }
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
                onCloseClick={onClose}
            >
                <DialogHeader className="mt-12 flex flex-col items-start gap-2">
                    {
                        !!title && (
                            <DialogTitle className="dark:text-white">
                                {title}
                            </DialogTitle>
                        )
                    }
                    {
                        !!description && (
                            <DialogDescription>
                                {description}
                            </DialogDescription>
                        )
                    }
                    {!!warning && warning}
                </DialogHeader>
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <DialogFooter className="mt-8">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={innerOnSubmit} disabled={loading}>
                        {loading
                            ? "Loading..."
                            : submitText
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}