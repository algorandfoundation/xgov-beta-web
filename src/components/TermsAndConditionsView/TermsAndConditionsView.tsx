import { renderTermsMarkdown } from "@/lib/markdown";
import { useTerms } from "@/hooks";
import { UseQuery } from "@/hooks/useQuery";

interface TermsAndConditionsViewProps {
  title?: string;
  description?: string | JSX.Element;
  className?: string;
}

function TermsAndConditionsContent({
  title = "xGov Proposer Terms & Conditions",
  description,
  className = "",
}: TermsAndConditionsViewProps) {
  const terms = useTerms();

  if (terms.isLoading) {
    return (
      <div className={`w-full max-w-6xl mx-auto p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          Loading terms...
        </div>
      </div>
    );
  }

  if (terms.isError) {
    return (
      <div className={`w-full max-w-6xl mx-auto p-4 ${className}`}>
        <div className="text-center text-red-500 py-12">
          Failed to load terms and conditions.
        </div>
      </div>
    );
  }

  const formattedContent = renderTermsMarkdown(terms.data?.content ?? "");

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-white mb-4">{title}</h1>
        {description && (
          <div className="text-gray-600 dark:text-gray-300 mb-4">
            {typeof description === 'string' ? (
              <p>{description}</p>
            ) : (
              description
            )}
          </div>
        )}
      </div>

      <div className="border border-algo-blue dark:border-algo-teal rounded-md p-6 bg-white dark:bg-gray-900">
        <div
          className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>
    </div>
  );
}

export function TermsAndConditionsView(props: TermsAndConditionsViewProps) {
  return (
    <UseQuery>
      <TermsAndConditionsContent {...props} />
    </UseQuery>
  );
}
