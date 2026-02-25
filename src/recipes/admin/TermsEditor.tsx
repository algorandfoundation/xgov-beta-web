import { useState, useEffect } from "react";
import { useWallet, ScopeType } from "@txnlab/use-wallet-react";
import { bytesToBase64 } from "algosdk";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTerms } from "@/hooks";
import { renderTermsMarkdown } from "@/lib/markdown";
import { buildTermsUpdateChallenge, sha256Hex } from "@/lib/arc60";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function TermsEditor() {
  const { activeAddress, activeWallet, signData } = useWallet();
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

  const canSign = activeWallet?.canSignData ?? false;

  const handleSave = async () => {
    if (!activeAddress || !canSign) return;

    setSaveStatus("saving");
    try {
      // Build ARC-60 challenge
      const contentHash = await sha256Hex(content);
      const challenge = buildTermsUpdateChallenge(activeAddress, contentHash);

      // Sign challenge with wallet
      const signResult = await signData(challenge, {
        scope: ScopeType.AUTH,
        encoding: "utf-8",
      });

      // Serialize Uint8Array fields to base64 for JSON transport
      const arc60 = {
        challenge,
        signature: bytesToBase64(signResult.signature),
        signer: bytesToBase64(signResult.signer),
        domain: signResult.domain,
        authenticatorData: bytesToBase64(signResult.authenticatorData),
      };

      const res = await fetch("/api/terms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, address: activeAddress, arc60 }),
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
            disabled={saveStatus === "saving" || !canSign}
            title={!canSign ? "Wallet does not support signing data (ARC-60)" : undefined}
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

      {activeWallet && !canSign && (
        <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md px-3 py-2">
          Your wallet does not support signing data (ARC-60). Use Lute or Kibisis to save changes.
        </div>
      )}

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
