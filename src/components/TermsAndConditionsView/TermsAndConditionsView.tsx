import { formatMarkdownToHtml } from "@/recipes";
import termsAndConditionsString from "../ProfileCard/TermsAndConditionsText.md?raw";

interface TermsAndConditionsViewProps {
  title?: string;
  description?: string | JSX.Element;
  className?: string;
}

export function TermsAndConditionsView({
  title = "xGov Proposer Terms & Conditions",
  description,
  className = "",
}: TermsAndConditionsViewProps) {
  const formattedContent = formatMarkdownToHtml(termsAndConditionsString);

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
