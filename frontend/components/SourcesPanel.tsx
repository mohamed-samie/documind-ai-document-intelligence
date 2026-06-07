import type { SourceItem } from "@/types";

type SourcesPanelProps = {
  sources: SourceItem[];
};

function getMatchLabel(source: SourceItem) {
  const score = source.rerank_score ?? 0;

  if (score >= 8) return "Strong";
  if (score >= 4) return "Good";
  return "Verified";
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-950">
            Verified Sources
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Used for this answer
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">
          {sources.length}
        </span>
      </div>

      <div className="space-y-3">
        {sources.length > 0 ? (
          sources.map((source, index) => (
            <div
              key={`${source.file_name}-${source.page_number}-${source.section_title}-${index}`}
              className="rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="line-clamp-1 text-sm font-extrabold leading-5 text-slate-800">
                  {source.file_name}
                </p>

                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  P{source.page_number}
                </span>
              </div>

              {source.section_title && (
                <p className="line-clamp-1 text-xs font-extrabold leading-5 text-blue-700">
                  {source.section_title}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-medium text-slate-400">
                  Source {index + 1}
                </span>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                  {getMatchLabel(source)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">
              Sources will appear here.
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
              Ask a question to see exact pages.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}