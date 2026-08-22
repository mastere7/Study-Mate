import React, { useState } from "react";
import { Check, Copy, Code2 } from "lucide-react";

interface MarkdownRendererProps {
  children?: string;
  content?: string;
  className?: string;
}

/**
 * Robust, zero-dependency Markdown renderer designed for AI Tutor Chat & Study Notes.
 * Completely immune to Rollup / Vite / Vercel bundling and ESM resolution errors.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  content,
  className = "",
}) => {
  const rawText = (children !== undefined ? children : content) || "";

  // Parse lines and blocks
  const renderBlocks = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code Block: ```lang ... ```
      if (line.trim().startsWith("```")) {
        const lang = line.trim().replace(/^```/, "").trim() || "text";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        const fullCode = codeLines.join("\n");
        blocks.push(
          <CodeBlock key={`code-${i}-${blocks.length}`} code={fullCode} language={lang} />
        );
        i++;
        continue;
      }

      // 2. Table Block: lines starting with |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          tableLines.push(lines[i]);
          i++;
        }
        blocks.push(
          <TableBlock key={`table-${i}-${blocks.length}`} tableLines={tableLines} />
        );
        continue;
      }

      // 3. Headings: #, ##, ###, ####
      if (line.startsWith("#")) {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2];
          blocks.push(
            <HeadingElement
              key={`h-${i}-${blocks.length}`}
              level={level}
              text={headingText}
            />
          );
          i++;
          continue;
        }
      }

      // 4. Horizontal Rule: ---, ***, ___
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        blocks.push(
          <hr
            key={`hr-${i}-${blocks.length}`}
            className="my-4 border-slate-200 dark:border-slate-700"
          />
        );
        i++;
        continue;
      }

      // 5. Blockquote: > text
      if (line.trim().startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        blocks.push(
          <blockquote
            key={`quote-${i}-${blocks.length}`}
            className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic text-slate-700 dark:text-slate-300 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-r-xl"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx} className="leading-relaxed">
                {renderInlineFormatted(ql)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 6. Lists (Unordered - * + and Ordered 1.)
      const isUnordered = /^(\s*)[-*+]\s+(.*)$/.test(line);
      const isOrdered = /^(\s*)\d+\.\s+(.*)$/.test(line);

      if (isUnordered || isOrdered) {
        const listItems: { text: string; isOrdered: boolean; indent: number }[] = [];
        while (i < lines.length) {
          const curLine = lines[i];
          const uMatch = curLine.match(/^(\s*)([-*+])\s+(.*)$/);
          const oMatch = curLine.match(/^(\s*)(\d+)\.\s+(.*)$/);

          if (uMatch) {
            listItems.push({
              indent: uMatch[1].length,
              isOrdered: false,
              text: uMatch[3],
            });
            i++;
          } else if (oMatch) {
            listItems.push({
              indent: oMatch[1].length,
              isOrdered: true,
              text: oMatch[3],
            });
            i++;
          } else if (curLine.trim() === "") {
            // Check if next line continues list
            if (
              i + 1 < lines.length &&
              (/^(\s*)[-*+]\s+/.test(lines[i + 1]) || /^(\s*)\d+\.\s+/.test(lines[i + 1]))
            ) {
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        blocks.push(
          <ListBlock key={`list-${i}-${blocks.length}`} items={listItems} />
        );
        continue;
      }

      // 7. Empty lines (spacers)
      if (line.trim() === "") {
        i++;
        continue;
      }

      // 8. Normal Paragraph (gather continuous text lines)
      const paragraphLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].trim().startsWith("```") &&
        !lines[i].trim().startsWith("#") &&
        !lines[i].trim().startsWith(">") &&
        !lines[i].trim().startsWith("|") &&
        !/^(\s*)[-*+]\s+/.test(lines[i]) &&
        !/^(\s*)\d+\.\s+/.test(lines[i]) &&
        !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <p
          key={`p-${i}-${blocks.length}`}
          className="my-2.5 leading-relaxed text-slate-800 dark:text-slate-200"
        >
          {paragraphLines.map((pLine, pIdx) => (
            <React.Fragment key={pIdx}>
              {pIdx > 0 && <br />}
              {renderInlineFormatted(pLine)}
            </React.Fragment>
          ))}
        </p>
      );
    }

    return blocks;
  };

  return (
    <div className={`markdown-content prose dark:prose-invert max-w-none text-sm leading-relaxed ${className}`}>
      {renderBlocks(rawText)}
    </div>
  );
};

// Component for Code Blocks with Copy button
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-md font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-slate-300">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
          <Code2 className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-slate-100 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
        <pre className="m-0 font-mono text-xs whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Component for Headings
const HeadingElement: React.FC<{ level: number; text: string }> = ({ level, text }) => {
  const formatted = renderInlineFormatted(text);
  switch (level) {
    case 1:
      return (
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2.5 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-1.5">
          {formatted}
        </h1>
      );
    case 2:
      return (
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-2 tracking-tight">
          {formatted}
        </h2>
      );
    case 3:
      return (
        <h3 className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1.5">
          {formatted}
        </h3>
      );
    case 4:
    default:
      return (
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-2.5 mb-1">
          {formatted}
        </h4>
      );
  }
};

// Component for Lists (nested & checkboxes supported)
const ListBlock: React.FC<{
  items: { text: string; isOrdered: boolean; indent: number }[];
}> = ({ items }) => {
  const isOrdered = items.length > 0 && items[0].isOrdered;

  if (isOrdered) {
    return (
      <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-slate-800 dark:text-slate-200 leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx} className="pl-1">
            {renderInlineFormatted(item.text)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-800 dark:text-slate-200 leading-relaxed">
      {items.map((item, idx) => {
        // Check for task checklist [ ] or [x]
        const isTaskUnchecked = /^\[\s\]\s+(.*)$/.test(item.text);
        const isTaskChecked = /^\[[xX]\]\s+(.*)$/.test(item.text);

        if (isTaskUnchecked || isTaskChecked) {
          const taskContent = item.text.replace(/^\[[\sxX]\]\s+/, "");
          return (
            <li key={idx} className="list-none -ml-5 flex items-start gap-2 py-0.5">
              <input
                type="checkbox"
                checked={isTaskChecked}
                readOnly
                className="mt-1 rounded text-indigo-600 border-slate-300 dark:border-slate-700 pointer-events-none"
              />
              <span className={isTaskChecked ? "line-through text-slate-400" : ""}>
                {renderInlineFormatted(taskContent)}
              </span>
            </li>
          );
        }

        return (
          <li key={idx} className="pl-1">
            {renderInlineFormatted(item.text)}
          </li>
        );
      })}
    </ul>
  );
};

// Component for Markdown Tables
const TableBlock: React.FC<{ tableLines: string[] }> = ({ tableLines }) => {
  if (tableLines.length === 0) return null;

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());

  const header = parseRow(tableLines[0]);
  const hasSeparator =
    tableLines.length > 1 && /^\|?(\s*:-+:?\s*\|?)+$/.test(tableLines[1].trim());
  const bodyRows = tableLines.slice(hasSeparator ? 2 : 1).map(parseRow);

  return (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
      <table className="min-w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100">
          <tr>
            {header.map((col, idx) => (
              <th key={idx} className="px-3.5 py-2">
                {renderInlineFormatted(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
          {bodyRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={rIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-850/50"}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                  {renderInlineFormatted(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper: Render bold, italics, inline code, strikethrough, links
function renderInlineFormatted(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize string for code, bold, italic, strikethrough, links
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={`code-${keyIndex++}`}
          className="font-mono text-[11px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-semibold"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold text: **bold** or __bold__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={`b-${keyIndex++}`} className="font-extrabold text-slate-900 dark:text-white">
          {renderInlineFormatted(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Strikethrough: ~~del~~
    const strikeMatch = remaining.match(/^~~(.*?)~~/);
    if (strikeMatch) {
      tokens.push(
        <del key={`del-${keyIndex++}`} className="line-through text-slate-400">
          {renderInlineFormatted(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 4. Italic text: *italic* or _italic_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={`em-${keyIndex++}`} className="italic font-medium text-slate-800 dark:text-slate-200">
          {renderInlineFormatted(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 5. Links: [text](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      tokens.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 6. Regular plain text until next potential special character
    const nextSpecial = remaining.search(/[`*_~\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Single orphan special char that didn't match regex
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export default MarkdownRenderer;
