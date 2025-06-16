import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Printer, ClipboardCheck, Clipboard } from "lucide-react";
import { useRef, useState, useEffect } from "react";

function printString(content: string) {
  const printWindow = window.open("", "", "height=600,width=800");
  if (!printWindow) return;
  printWindow.document.write(
    `<html><head><title>Print</title></head><body style="white-space:pre">`,
  );
  printWindow.document.write(content);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

interface TermsAndConditionsModalProps {
  title: string;
  description: string | JSX.Element;
  terms: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsAndConditionsModal({
  title,
  description,
  terms,
  isOpen,
  onClose,
  onAccept,
}: TermsAndConditionsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScrolledToBottom(false);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10; // 10px threshold
    if (isAtBottom === true) setScrolledToBottom(true);
  };

  const handlePrint = () => printString(terms);
  const handleCopy = () => {
    navigator.clipboard.writeText(terms);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="w-full h-full max-h-full sm:h-auto sm:w-fit sm:rounded-lg overflow-y-auto"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">{title}</DialogTitle>
          <DialogDescription className="flex flex-col">
            {description}
          </DialogDescription>
          <div className="h-[60svh] self-center rounded-md border border-algo-blue dark:border-algo-teal p-2 text-sm text-left">
            <div
              tabIndex={0}
              onScroll={handleScroll}
              ref={scrollRef}
              id="tc-box"
              className="h-full overflow-y-auto whitespace-pre-line sm:whitespace-pre"
              dangerouslySetInnerHTML={{ __html: terms }}
            ></div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <div className="flex w-full justify-between">
            <div className="flex">
              <Button variant="ghost" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="ghost" onClick={handleCopy}>
                {copied ? (
                  <ClipboardCheck className="mr-2 h-4 w-4 text-algo-blue dark:text-algo-teal" />
                ) : (
                  <Clipboard className="mr-2 h-4 w-4" />
                )}
                {copied ? (
                  <span className="text-algo-blue dark:text-algo-teal">
                    Copied
                  </span>
                ) : (
                  <>Copy</>
                )}
              </Button>
            </div>
            <div className="flex">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!scrolledToBottom} onClick={() => onAccept()}>
                Accept Terms
              </Button>
            </div>{" "}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
