import { forwardRef, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "../ui/button";

type CopyButtonProps = {
  value: string;
  children: ReactNode;
  copiedLabel?: ReactNode;
  failedLabel?: ReactNode;
  onCopied?: () => void;
  onCopyFailed?: () => void;
  resetDelay?: number;
} & Omit<ButtonProps, "onClick">;

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      children,
      copiedLabel = "Copied!",
      failedLabel = "Failed to copy",
      onCopied,
      onCopyFailed,
      resetDelay = 2000,
      ...buttonProps
    },
    ref,
  ) => {
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setLabel(copiedLabel);
        onCopied?.();
      } catch (e) {
        setLabel(failedLabel);
        onCopyFailed?.();
      } finally {
        setTimeout(() => setLabel(children), resetDelay);
      }
    };
    const [label, setLabel] = useState<ReactNode>(children);
    return (
      <Button ref={ref} variant="link" onClick={handleCopy} {...buttonProps}>
        {label}
      </Button>
    );
  },
);

CopyButton.displayName = "CopyButton";
