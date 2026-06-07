import type { AskMode, DocumentItem, FolderItem } from "@/types";

type DocumentsListProps = {
  documents: DocumentItem[];
  folders: FolderItem[];
  isLoading: boolean;

  askMode: AskMode;
  selectedDocumentId: string;

  deletingDocumentId: string | null;
  movingDocumentId: string | null;

  onSelectDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string, fileName: string) => void;
  onMoveDocument: (documentId: string, folderId: string) => void;
};

function getFileType(fileName: string) {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

function getFileBadgeClass(type: string) {
  const styles: Record<string, string> = {
    PDF: "bg-red-50 text-red-700",
    DOCX: "bg-blue-50 text-blue-700",
    XLSX: "bg-emerald-50 text-emerald-700",
    XLSM: "bg-emerald-50 text-emerald-700",
    CSV: "bg-amber-50 text-amber-700",
  };

  return styles[type] || "bg-slate-100 text-slate-600";
}

export default function DocumentsList({
  documents,
  folders,
  isLoading,
  askMode,
  selectedDocumentId,
  deletingDocumentId,
  movingDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onMoveDocument,
}: DocumentsListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
            Document Library
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage indexed files and choose where to ask questions.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500">
          {documents.length} files
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-base font-extrabold text-slate-800">
            No documents yet
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
            Upload your first file to start asking grounded questions.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100">
          {documents.slice(0, 8).map((doc, index) => {
            const type = getFileType(doc.file_name);
            const isActive =
              selectedDocumentId === doc.id && askMode === "selected_document";
            const isMoving = movingDocumentId === doc.id;

            return (
              <div
                key={doc.id}
                className={`border-b border-slate-100 px-5 py-4 transition last:border-b-0 ${
                  isActive ? "bg-blue-50/60" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_180px_90px_80px_120px] lg:items-center">
                  <button
                    type="button"
                    onClick={() => onSelectDocument(doc.id)}
                    className="flex min-w-0 items-center gap-4 text-left"
                  >
                    <span
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold ${getFileBadgeClass(
                        type
                      )}`}
                    >
                      {type}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-800">
                        {doc.file_name}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Document {index + 1}
                      </p>
                    </div>
                  </button>

                  <div className="relative">
                    <select
                      value={doc.folder_id || ""}
                      disabled={isMoving}
                      onChange={(event) =>
                        onMoveDocument(doc.id, event.target.value)
                      }
                      title="Change document folder"
                      className={`h-10 w-full cursor-pointer appearance-none truncate rounded-full border px-4 pr-8 text-xs font-extrabold outline-none transition ${
                        doc.folder_id
                          ? "border-slate-100 bg-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <option value="">No folder</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      ⌄
                    </span>
                  </div>

                  <p className="text-sm font-extrabold text-slate-500">
                    {doc.total_pages} pages
                  </p>

                  <p className="text-sm font-extrabold text-slate-500">
                    {doc.total_chunks} sec.
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                    >
                      Ask
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id, doc.file_name)}
                      disabled={deletingDocumentId === doc.id}
                      className="rounded-2xl px-3 py-2.5 text-xs font-extrabold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingDocumentId === doc.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}