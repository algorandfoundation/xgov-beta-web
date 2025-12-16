import { useState, type ReactNode } from "react";
import { Button } from "../ui/button";

export function CopyButton({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(value);
      setLabel("Copied!");
    } catch (e) {
      setLabel("Failed to copy");
    } finally {
      setTimeout(() => setLabel(children), 2000);
    }
  };
  const [label, setLabel] = useState<ReactNode | string>(children);
  return (
    <Button variant="link" onClick={handleCopy}>
      {label}
    </Button>
  );
}
