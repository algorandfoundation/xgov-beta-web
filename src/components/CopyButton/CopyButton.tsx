import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "../ui/button";

export function CopyButton({
  value,
  children,
  copiedLabel = "Copied!",
  failedLabel = "Failed to copy",
  resetDelay = 2000,
  ...buttonProps
}: {
  value: string;
  children: ReactNode;
  copiedLabel?: ReactNode;
  failedLabel?: ReactNode;
  resetDelay?: number;
} & Omit<ButtonProps, "onClick">) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setLabel(copiedLabel);
    } catch (e) {
      setLabel(failedLabel);
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
