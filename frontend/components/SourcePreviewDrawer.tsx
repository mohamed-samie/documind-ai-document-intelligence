import type { SourceItem } from "@/types";

type SourcePreviewDrawerProps = {
  source: SourceItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function SourcePreviewDrawer({
  source,
  isOpen,
  onClose,
}: SourcePreviewDrawerProps) {
  if (!isOpen || !source) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close source preview"
        className="absolute inset-0 bg-slate-950/30"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Source Preview
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {source.file_name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Page {source.page_number}
                {source.section_title ? ` · ${source.section_title}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="premium-scrollbar flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Relevant excerpt
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {source.content_preview ||
                "This source was used by the retrieval system. Add content_preview to the backend response to show the exact highlighted excerpt here."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">
              Verified citation
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">
              This answer was grounded in the selected document section instead
              of generated from general model knowledge.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
