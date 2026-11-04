import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "../../lib/format";

/** Markdown with GitHub tables and $…$ / $$…$$ math, matching what st.markdown rendered. */
export function Markdown({ children, className, inline }: { children: string; className?: string; inline?: boolean }) {
  return (
    <div className={cn(inline ? "[&>p]:m-0" : "doc-prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
