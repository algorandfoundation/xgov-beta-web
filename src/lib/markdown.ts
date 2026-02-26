import { marked } from "marked";

const renderer = new marked.Renderer();

renderer.link = ({ href, text }) => {
  if (href.startsWith("mailto:")) {
    return `<a href="${href}" class="text-algo-blue dark:text-algo-teal hover:underline">${text}</a>`;
  }
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-algo-blue dark:text-algo-teal hover:underline">${text}</a>`;
};

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
});

export function renderTermsMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}
