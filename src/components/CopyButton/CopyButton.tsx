import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "../ui/button";

export function CopyButton({
  value,
  children,
  copiedLabel = "Copied!",
  failedLabel = "Failed to copy",
  onCopied,
  onCopyFailed,
  resetDelay = 2000,
  ...buttonProps
}: {
  value: string;
  children: ReactNode;
  copiedLabel?: ReactNode;
  failedLabel?: ReactNode;
  onCopied?: () => void;
  onCopyFailed?: () => void;
  resetDelay?: number;
} & Omit<ButtonProps, "onClick">) {
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
    <Button variant="link" onClick={handleCopy} {...buttonProps}>
      {label}
    </Button>
  );
}
