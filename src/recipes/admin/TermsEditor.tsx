import { useState, useEffect } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTerms } from "@/hooks";
import { renderTermsMarkdown } from "@/lib/markdown";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function TermsEditor() {
  const { activeAddress } = useWallet();
  const terms = useTerms();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    if (terms.data?.content) {
      setContent(terms.data.content);
    }
  }, [terms.data?.content]);

  const handleSave = async () => {
    if (!activeAddress) return;

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/terms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, address: activeAddress }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save terms:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleReload = () => {
    terms.refetch();
  };

  if (terms.isLoading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading terms...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("edit")}
          >
            Edit
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {terms.data?.source && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Source: {terms.data.source}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleReload}>
            Reload
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved!"
                : saveStatus === "error"
                  ? "Error"
                  : "Save"}
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[500px] p-4 font-mono text-sm border rounded-md bg-white dark:bg-gray-900 text-algo-black dark:text-white border-algo-black-20 dark:border-algo-black-60 resize-y"
          placeholder="Enter terms and conditions in Markdown..."
        />
      ) : (
        <div className="border rounded-md p-6 bg-white dark:bg-gray-900 border-algo-black-20 dark:border-algo-black-60 min-h-[500px] overflow-y-auto">
          <div
            className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderTermsMarkdown(content) }}
          />
        </div>
      )}
    </div>
  );
}
