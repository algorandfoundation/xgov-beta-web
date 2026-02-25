import { useQuery } from "@tanstack/react-query";

interface TermsData {
  content: string;
  source: "kv" | "static";
}

async function fetchTerms(): Promise<TermsData> {
  const res = await fetch("/api/terms");
  if (!res.ok) {
    throw new Error("Failed to fetch terms");
  }
  return res.json();
}

export function useTerms() {
  return useQuery({
    queryKey: ["terms"],
    queryFn: fetchTerms,
    staleTime: 5 * 60 * 1000,
  });
}
