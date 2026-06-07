import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AskMode, ChatMessage, DocumentItem, FolderItem } from "@/types";

type ChatPanelProps = {
  documents: DocumentItem[];
  folders: FolderItem[];

  question: string;
  messages: ChatMessage[];

  askMode: AskMode;
  selectedDocumentId: string;
  selectedFolderId: string;

  activeConversationId: string | null;
  isAsking: boolean;
  isLoadingConversation: boolean;

  onQuestionChange: (value: string) => void;
  onAskModeChange: (mode: AskMode) => void;
  onSelectedDocumentChange: (documentId: string) => void;
  onSelectedFolderChange: (folderId: string) => void;
  onAsk: () => void;
};

const SAMPLE_PROMPTS = [
  "Summarize this document",
  "Find risks and obligations",
  "Compare selected documents",
];

function cleanMarkdown(content: string) {
  const lines = content.split("\n");
  const tableLines: string[] = [];
  const normalLines: string[] = [];
  const conclusionLines: string[] = [];

  let insideTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|");
    const hasConclusion =
      /conclusion\s*:/i.test(trimmed) || /in conclusion/i.test(trimmed);

    if (isTableRow) {
      insideTable = true;

      if (hasConclusion) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        const conclusionText =
          cells.find((cell) => /conclusion\s*:|in conclusion/i.test(cell)) ||
          cells.join(" ");

        conclusionLines.push(conclusionText);
        continue;
      }

      tableLines.push(line);
      continue;
    }

    if (insideTable && trimmed === "") {
      insideTable = false;
      tableLines.push("");
      continue;
    }

    if (hasConclusion) {
      conclusionLines.push(trimmed);
      continue;
    }

    normalLines.push(line);
  }

  return [...normalLines, "", ...tableLines, "", ...conclusionLines]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractConclusion(content: string) {
  const lines = content.split("\n");
  const bodyLines: string[] = [];
  const conclusionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(conclusion\s*:|in conclusion)/i.test(trimmed)) {
      conclusionLines.push(trimmed);
    } else {
      bodyLines.push(line);
    }
  }

  return {
    body: bodyLines.join("\n").trim(),
    conclusion: conclusionLines.join(" ").trim(),
  };
}

function MarkdownAnswer({ content }: { content: string }) {
  const cleaned = cleanMarkdown(content);
  const { body, conclusion } = extractConclusion(cleaned);

  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-[15px] font-medium leading-7 text-slate-700">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-extrabold text-slate-950">
              {children}
            </strong>
          ),

          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-[15px] font-medium text-slate-700">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-[15px] font-medium text-slate-700">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="leading-7 text-slate-700">{children}</li>
          ),

          table: ({ children }) => (
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  {children}
                </table>
              </div>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-slate-50 text-slate-950">{children}</thead>
          ),

          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 bg-white">
              {children}
            </tbody>
          ),

          tr: ({ children }) => (
            <tr className="align-top transition hover:bg-slate-50/70">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="px-5 py-4 text-left text-[12px] font-extrabold uppercase tracking-wide text-slate-900">
              <div className="whitespace-normal break-words">{children}</div>
            </th>
          ),

          td: ({ children }) => (
            <td className="px-5 py-4 align-top text-[13px] font-semibold leading-6 text-slate-700">
              <div className="whitespace-normal break-words">{children}</div>
            </td>
          ),

          code: ({ children }) => (
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-900">
              {children}
            </code>
          ),
        }}
      >
        {body}
      </ReactMarkdown>

      {conclusion && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
          <p className="text-sm font-extrabold text-blue-900">Conclusion</p>

          <p className="mt-2 max-w-3xl text-[15px] font-medium leading-7 text-slate-700">
            {conclusion.replace(/^conclusion\s*:\s*/i, "")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  documents,
  folders,
  question,
  messages,
  askMode,
  selectedDocumentId,
  selectedFolderId,
  activeConversationId,
  isAsking,
  isLoadingConversation,
  onQuestionChange,
  onAskModeChange,
  onSelectedDocumentChange,
  onSelectedFolderChange,
  onAsk,
}: ChatPanelProps) {
  const hasMessages = messages.length > 0;

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
            Ask your documents
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Get grounded answers from your indexed files.
          </p>
        </div>

        {activeConversationId && (
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
            Active
          </span>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-1.5 rounded-2xl bg-slate-100 p-1 text-sm sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onAskModeChange("all_documents")}
          className={`rounded-xl px-3 py-2.5 font-bold transition ${
            askMode === "all_documents"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All documents
        </button>

        <button
          type="button"
          onClick={() => onAskModeChange("selected_document")}
          className={`rounded-xl px-3 py-2.5 font-bold transition ${
            askMode === "selected_document"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Selected document
        </button>

        <button
          type="button"
          onClick={() => onAskModeChange("selected_folder")}
          className={`rounded-xl px-3 py-2.5 font-bold transition ${
            askMode === "selected_folder"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Selected folder
        </button>
      </div>

      {askMode === "selected_document" && (
        <div className="mb-4">
          <select
            value={selectedDocumentId}
            onChange={(event) => onSelectedDocumentChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">Choose a document</option>

            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.file_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {askMode === "selected_folder" && (
        <div className="mb-4">
          <select
            value={selectedFolderId}
            onChange={(event) => onSelectedFolderChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">Choose a folder</option>

            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name} ({folder.documents_count})
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className={`space-y-4 rounded-3xl bg-slate-50 p-4 ${
          hasMessages ? "min-h-[260px]" : "min-h-[180px]"
        }`}
      >
        {isLoadingConversation ? (
          <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
            Loading conversation...
          </div>
        ) : hasMessages ? (
          messages.map((message) => {
            if (message.role === "user") {
              return (
                <div
                  key={message.id}
                  className="ml-auto w-fit max-w-[620px] rounded-2xl bg-blue-600 px-5 py-3 text-[15px] font-semibold leading-7 text-white shadow-sm"
                >
                  {message.content}
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className="w-full rounded-2xl bg-white px-5 py-5 text-[15px] leading-7 text-slate-700 shadow-sm"
              >
                {message.isPending ? (
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />
                    Thinking through your documents...
                  </div>
                ) : (
                  <MarkdownAnswer content={message.content} />
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-base font-extrabold text-slate-950">
              Start asking questions
            </p>

            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
              Ask about summaries, risks, obligations, comparisons, clauses,
              reports, or spreadsheet values.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isAsking) {
              onAsk();
            }
          }}
          className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          placeholder="Ask anything about your documents..."
        />

        <button
          type="button"
          onClick={onAsk}
          disabled={isAsking}
          className="h-14 rounded-2xl bg-blue-600 px-7 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAsking ? "Sending..." : "Send"}
        </button>
      </div>

      {!hasMessages && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onQuestionChange(prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}