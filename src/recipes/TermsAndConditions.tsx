import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Printer, ClipboardCheck, Clipboard, ExternalLink } from "lucide-react";
import { useRef, useState, useEffect } from "react";

function printString(content: string) {
  const printWindow = window.open("", "", "height=600,width=800");
  if (!printWindow) return;
  printWindow.document.documentElement.innerHTML = `
    <html>
      <head>
        <title>Print</title>
      </head>
      <body style="white-space:pre">
        ${content}
      </body>
    </html>
  `;
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

export function formatMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-algo-blue dark:text-algo-teal hover:underline">$1</a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-algo-blue dark:text-algo-teal hover:underline">$1</a>')
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="text-algo-blue dark:text-algo-teal hover:underline">$1</a>')
    .replace(/(?<!href=")(?<!href=')(https?:\/\/[^\s<>]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-algo-blue dark:text-algo-teal hover:underline">$1</a>')
    .split(/\n\s*\n/)
    .map(paragraph => {
      const formattedParagraph = paragraph.trim().replace(/\n/g, '<br>');
      return formattedParagraph ? `<p class="mb-4">${formattedParagraph}</p>` : '';
    })
    .filter(p => p)
    .join('');
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
        className="w-full max-w-4xl h-full max-h-full sm:h-auto sm:rounded-lg overflow-hidden"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">{title}</DialogTitle>
          <DialogDescription className="flex flex-col">
            {description}
            <div className="mt-2">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-algo-blue dark:text-algo-teal hover:underline"
              >
                View full page
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </DialogDescription>
          <div className="h-[60svh] w-full rounded-md border border-algo-blue dark:border-algo-teal px-2 text-sm text-left">
            <div
              tabIndex={0}
              onScroll={handleScroll}
              ref={scrollRef}
              id="tc-box"
              className="h-full overflow-y-auto overflow-x-hidden text-sm leading-relaxed [&>p]:mb-4 [&>p]:text-sm [&>p]:leading-relaxed [&_strong]:font-bold [&_a]:text-algo-blue dark:[&_a]:text-algo-teal [&_a]:no-underline hover:[&_a]:underline"
              dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(terms) }}
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
