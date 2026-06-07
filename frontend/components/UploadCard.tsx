import type { FolderItem } from "@/types";

type UploadCardProps = {
  folders: FolderItem[];
  selectedUploadFolderId: string;
  isUploading: boolean;
  onFolderChange: (folderId: string) => void;
  onUpload: (file: File | null) => void;
};

export default function UploadCard({
  folders,
  selectedUploadFolderId,
  isUploading,
  onFolderChange,
  onUpload,
}: UploadCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-extrabold text-white shadow-sm">
            ↑
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-950">
              Upload documents
            </h3>

            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Add PDFs, Word documents, Excel sheets, or CSV files. DocuMind
              indexes them for grounded answers with citations.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {["PDF", "DOCX", "XLSX", "CSV"].map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_145px] xl:w-[500px]">
          <select
            value={selectedUploadFolderId}
            onChange={(event) => onFolderChange(event.target.value)}
            className="h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">No folder</option>

            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

          <label className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700">
            {isUploading ? "Processing..." : "Choose file"}

            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.xlsm,.csv"
              className="hidden"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                onUpload(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">
          <p className="text-sm font-bold text-blue-700">
            Processing document...
          </p>
          <p className="mt-1 text-xs font-medium text-blue-600">
            Reading content, creating searchable sections, and building the AI
            index.
          </p>
        </div>
      )}
    </section>
  );
}