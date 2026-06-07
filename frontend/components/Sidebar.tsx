import type { AskMode, DocumentItem, FolderItem } from "@/types";

type SidebarProps = {
  folders: FolderItem[];
  documents: DocumentItem[];
  isLoading: boolean;

  askMode: AskMode;
  selectedFolderId: string;
  selectedDocumentId: string;

  isFolderFormOpen: boolean;
  newFolderName: string;
  isCreatingFolder: boolean;

  editingFolderId: string | null;
  editingFolderName: string;
  updatingFolderId: string | null;
  deletingFolderId: string | null;

  onToggleFolderForm: () => void;
  onNewFolderNameChange: (value: string) => void;
  onCreateFolder: () => void;

  onSelectFolder: (folderId: string) => void;
  onSelectDocument: (documentId: string) => void;

  onStartRenameFolder: (folderId: string, folderName: string) => void;
  onEditingFolderNameChange: (value: string) => void;
  onRenameFolder: (folderId: string) => void;
  onCancelRenameFolder: () => void;

  onDeleteFolder: (folderId: string, folderName: string) => void;
};

function getFileType(fileName: string) {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

export default function Sidebar({
  folders,
  documents,
  isLoading,
  askMode,
  selectedFolderId,
  selectedDocumentId,
  isFolderFormOpen,
  newFolderName,
  isCreatingFolder,
  editingFolderId,
  editingFolderName,
  updatingFolderId,
  deletingFolderId,
  onToggleFolderForm,
  onNewFolderNameChange,
  onCreateFolder,
  onSelectFolder,
  onSelectDocument,
  onStartRenameFolder,
  onEditingFolderNameChange,
  onRenameFolder,
  onCancelRenameFolder,
  onDeleteFolder,
}: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-[280px] shrink-0 bg-[#F8FAFC] px-5 py-6 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-extrabold text-white shadow-sm">
          D
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950">
            Docu<span className="text-blue-600">Mind</span>
          </h1>
          <p className="truncate text-xs font-semibold text-slate-400">
            Document intelligence
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
          Workspace
        </p>

        <p className="mt-2 text-sm font-extrabold text-slate-950">
          Demo Workspace
        </p>

        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          Ask indexed business files with verified citations.
        </p>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Folders
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Knowledge base
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleFolderForm}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-lg font-bold text-slate-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
            aria-label="Create folder"
          >
            +
          </button>
        </div>

        {isFolderFormOpen && (
          <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50/60 p-3">
            <input
              value={newFolderName}
              onChange={(event) => onNewFolderNameChange(event.target.value)}
              placeholder="Folder name"
              className="w-full rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onCreateFolder}
                disabled={isCreatingFolder}
                className="flex-1 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isCreatingFolder ? "Creating..." : "Create"}
              </button>

              <button
                type="button"
                onClick={onToggleFolderForm}
                className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-xs font-extrabold text-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <div className="rounded-3xl bg-white p-4 text-sm font-semibold text-slate-400 shadow-sm">
              Loading folders...
            </div>
          ) : folders.length > 0 ? (
            folders.map((folder) => {
              const isActive =
                askMode === "selected_folder" && selectedFolderId === folder.id;

              const isEditing = editingFolderId === folder.id;

              const folderDocuments = documents.filter(
                (doc) => doc.folder_id === folder.id
              );

              const shouldShowDocuments =
                selectedFolderId === folder.id && !isEditing;

              return (
                <div
                  key={folder.id}
                  className={`rounded-3xl border p-3 transition ${
                    isActive
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-transparent bg-[#F8FAFC] hover:border-slate-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {isEditing ? (
                    <div>
                      <input
                        value={editingFolderName}
                        onChange={(event) =>
                          onEditingFolderNameChange(event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onRenameFolder(folder.id)}
                          disabled={updatingFolderId === folder.id}
                          className="flex-1 rounded-xl bg-blue-600 px-2 py-1.5 text-xs font-extrabold text-white disabled:opacity-60"
                        >
                          {updatingFolderId === folder.id ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={onCancelRenameFolder}
                          className="rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-extrabold text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectFolder(folder.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-extrabold ${
                              isActive ? "text-blue-700" : "text-slate-800"
                            }`}
                          >
                            {folder.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {folder.documents_count} documents
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {folder.documents_count}
                        </span>
                      </button>

                      {shouldShowDocuments && (
                        <div className="mt-3 space-y-2 rounded-2xl bg-white p-2 shadow-sm">
                          {folderDocuments.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-bold text-slate-500">
                                No files in this folder.
                              </p>
                            </div>
                          ) : (
                            folderDocuments.map((doc) => {
                              const isDocActive = selectedDocumentId === doc.id;

                              return (
                                <div
                                  key={doc.id}
                                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition ${
                                    isDocActive
                                      ? "bg-blue-50"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onSelectDocument(doc.id)}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <p
                                      className={`truncate text-xs font-extrabold ${
                                        isDocActive
                                          ? "text-blue-700"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      {doc.file_name}
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                                      {getFileType(doc.file_name)} ·{" "}
                                      {doc.total_pages} pages
                                    </p>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onSelectDocument(doc.id)}
                                    className="shrink-0 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-slate-800"
                                  >
                                    Ask
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            onStartRenameFolder(folder.id, folder.name)
                          }
                          className="text-xs font-extrabold text-blue-600 transition hover:text-blue-700"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteFolder(folder.id, folder.name)}
                          disabled={deletingFolderId === folder.id}
                          className="text-xs font-extrabold text-red-500 transition hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingFolderId === folder.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-extrabold text-slate-700">
                No folders yet
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
                Create folders to organize documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}