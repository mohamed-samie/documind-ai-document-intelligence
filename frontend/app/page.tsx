"use client";

import { useEffect, useMemo, useState } from "react";
import {
  askQuestion,
  createFolder,
  deleteDocument,
  deleteFolder,
  getConversation,
  getConversations,
  getDocuments,
  getFolders,
  moveDocumentToFolder,
  renameFolder,
  uploadDocument,
} from "@/lib/api";
import type {
  AskMode,
  ChatMessage,
  ConversationItem,
  DocumentItem,
  FolderItem,
  SourceItem,
} from "@/types";
import { SUPPORTED_FILE_EXTENSIONS } from "@/types";

import ChatPanel from "@/components/ChatPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import ConversationsPanel from "@/components/ConversationsPanel";
import DocumentsList from "@/components/DocumentsList";
import Sidebar from "@/components/Sidebar";
import SourcesPanel from "@/components/SourcesPanel";
import StatsGrid from "@/components/StatsGrid";
import ToastMessage from "@/components/ToastMessage";
import Topbar from "@/components/Topbar";
import UploadCard from "@/components/UploadCard";

type ConversationMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  sources: unknown;
  created_at: string;
};

type DeleteTarget =
  | { type: "document"; id: string; name: string }
  | { type: "folder"; id: string; name: string }
  | null;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSources(sources: unknown): SourceItem[] {
  if (!Array.isArray(sources)) return [];

  return sources
    .filter((source) => {
      return (
        typeof source === "object" &&
        source !== null &&
        "file_name" in source &&
        "page_number" in source
      );
    })
    .map((source) => {
      const item = source as {
        file_name: string;
        page_number: number;
        section_title?: string | null;
        chunk_index?: number | null;
        distance?: number | null;
        rerank_score?: number | null;
      };

      return {
        file_name: item.file_name,
        page_number: item.page_number,
        section_title: item.section_title || null,
        chunk_index: item.chunk_index ?? null,
        distance: item.distance ?? null,
        rerank_score: item.rerank_score ?? null,
      };
    });
}

function isSupportedFile(file: File) {
  return SUPPORTED_FILE_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );
}

function toChatMessages(messages: ConversationMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    sources: normalizeSources(message.sources),
    created_at: message.created_at,
  }));
}

export default function Home() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );

  const [askMode, setAskMode] = useState<AskMode>("all_documents");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const [selectedUploadFolderId, setSelectedUploadFolderId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [updatingFolderId, setUpdatingFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );
  const [movingDocumentId, setMovingDocumentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => sum + doc.total_chunks, 0);
  }, [documents]);

  const shouldShowHero = !isLoading && documents.length === 0;

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      const [documentsData, foldersData, conversationsData] =
        await Promise.all([getDocuments(), getFolders(), getConversations()]);

      setDocuments(documentsData.documents);
      setFolders(foldersData.folders);
      setConversations(conversationsData.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setSources([]);
    setQuestion("");
    setSuccessMessage("New chat started.");
  }

  function handleSelectDocument(documentId: string) {
    setAskMode("selected_document");
    setSelectedDocumentId(documentId);

    const document = documents.find((doc) => doc.id === documentId);
    if (document?.folder_id) {
      setSelectedFolderId(document.folder_id);
    }
  }

  async function handleLoadConversation(conversationId: string) {
    try {
      setIsLoadingConversation(true);
      setError(null);
      setSuccessMessage(null);

      const conversation = await getConversation(conversationId);
      const conversationMessages =
        conversation.messages as ConversationMessage[];

      const normalizedMessages = toChatMessages(conversationMessages);

      const lastAssistantMessage = [...normalizedMessages]
        .reverse()
        .find((message) => message.role === "assistant");

      setActiveConversationId(conversationId);
      setMessages(normalizedMessages);
      setQuestion("");
      setSources(lastAssistantMessage?.sources || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversation."
      );
    } finally {
      setIsLoadingConversation(false);
    }
  }

  async function handleCreateFolder() {
    const folderName = newFolderName.trim();

    if (!folderName) {
      setError("Please enter a folder name.");
      return;
    }

    try {
      setIsCreatingFolder(true);
      setError(null);
      setSuccessMessage(null);

      await createFolder(folderName);

      setSuccessMessage("Folder created successfully.");
      setNewFolderName("");
      setIsFolderFormOpen(false);

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder.");
    } finally {
      setIsCreatingFolder(false);
    }
  }

  async function handleRenameFolder(folderId: string) {
    const folderName = editingFolderName.trim();

    if (!folderName) {
      setError("Please enter a folder name.");
      return;
    }

    try {
      setUpdatingFolderId(folderId);
      setError(null);
      setSuccessMessage(null);

      await renameFolder({ folderId, name: folderName });

      setSuccessMessage("Folder renamed successfully.");
      setEditingFolderId(null);
      setEditingFolderName("");

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename folder.");
    } finally {
      setUpdatingFolderId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.type === "folder") {
      try {
        setDeletingFolderId(deleteTarget.id);
        setError(null);
        setSuccessMessage(null);

        await deleteFolder(deleteTarget.id);

        if (selectedFolderId === deleteTarget.id) {
          setSelectedFolderId("");
          if (askMode === "selected_folder") setAskMode("all_documents");
        }

        if (selectedUploadFolderId === deleteTarget.id) {
          setSelectedUploadFolderId("");
        }

        setSuccessMessage("Folder deleted successfully.");
        setDeleteTarget(null);
        await loadDashboardData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete folder.");
      } finally {
        setDeletingFolderId(null);
      }

      return;
    }

    try {
      setDeletingDocumentId(deleteTarget.id);
      setError(null);
      setSuccessMessage(null);

      await deleteDocument(deleteTarget.id);

      setSuccessMessage("Document deleted successfully.");
      setDeleteTarget(null);

      if (selectedDocumentId === deleteTarget.id) {
        setSelectedDocumentId("");
        if (askMode === "selected_document") setAskMode("all_documents");
      }

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleAsk() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (askMode === "selected_document" && !selectedDocumentId) {
      setError("Please select a document first.");
      return;
    }

    if (askMode === "selected_folder" && !selectedFolderId) {
      setError("Please select a folder first.");
      return;
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmedQuestion,
    };

    const pendingAssistantId = makeId();

    const pendingAssistantMessage: ChatMessage = {
      id: pendingAssistantId,
      role: "assistant",
      content: "Thinking through your documents...",
      isPending: true,
    };

    try {
      setIsAsking(true);
      setError(null);
      setSuccessMessage(null);
      setSources([]);
      setQuestion("");

      setMessages((current) => [
        ...current,
        userMessage,
        pendingAssistantMessage,
      ]);

      const response = await askQuestion({
        question: trimmedQuestion,
        top_k: 5,
        document_id:
          askMode === "selected_document" ? selectedDocumentId : null,
        folder_id: askMode === "selected_folder" ? selectedFolderId : null,
        conversation_id: activeConversationId,
      });

      const responseSources = normalizeSources(response.sources);

      setActiveConversationId(response.conversation_id);
      setSources(responseSources);

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingAssistantId
            ? {
                id: makeId(),
                role: "assistant",
                content: response.answer,
                sources: responseSources,
              }
            : message
        )
      );

      const conversationsData = await getConversations();
      setConversations(conversationsData.conversations);
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message.id !== pendingAssistantId)
      );

      setError(err instanceof Error ? err.message : "Failed to get answer.");
    } finally {
      setIsAsking(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return;

    if (!isSupportedFile(file)) {
      setError("Supported formats: PDF, Word, Excel, and CSV.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);

      await uploadDocument({
        file,
        folderId: selectedUploadFolderId || null,
      });

      setSuccessMessage("Document uploaded and indexed successfully.");

      try {
        await loadDashboardData();
      } catch {
        setSuccessMessage(
          "Document uploaded successfully. Refresh the page if it does not appear immediately."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleMoveDocument(documentId: string, folderId: string) {
    try {
      setMovingDocumentId(documentId);
      setError(null);
      setSuccessMessage(null);

      await moveDocumentToFolder({
        documentId,
        folderId: folderId || null,
      });

      if (selectedDocumentId === documentId && folderId) {
        setSelectedFolderId(folderId);
      }

      setSuccessMessage("Document folder updated successfully.");
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move document.");
    } finally {
      setMovingDocumentId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {error && (
        <ToastMessage
          type="error"
          message={error}
          topClassName="top-4"
          onClose={() => setError(null)}
        />
      )}

      {successMessage && (
        <ToastMessage
          type="success"
          message={successMessage}
          topClassName="top-16"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        isLoading={Boolean(deletingDocumentId || deletingFolderId)}
        title={
          deleteTarget?.type === "folder"
            ? `Delete “${deleteTarget.name}”?`
            : `Delete “${deleteTarget?.name || "document"}”?`
        }
        description={
          deleteTarget?.type === "folder"
            ? "The folder will be removed. Documents inside it will stay available and become uncategorized."
            : "This will remove the document and its indexed sections from the knowledge base."
        }
        confirmLabel={
          deleteTarget?.type === "folder" ? "Delete folder" : "Delete document"
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <div className="flex min-h-screen">
        <Sidebar
          folders={folders}
          documents={documents}
          isLoading={isLoading}
          askMode={askMode}
          selectedFolderId={selectedFolderId}
          selectedDocumentId={selectedDocumentId}
          isFolderFormOpen={isFolderFormOpen}
          newFolderName={newFolderName}
          isCreatingFolder={isCreatingFolder}
          editingFolderId={editingFolderId}
          editingFolderName={editingFolderName}
          updatingFolderId={updatingFolderId}
          deletingFolderId={deletingFolderId}
          onToggleFolderForm={() =>
            setIsFolderFormOpen((current) => !current)
          }
          onNewFolderNameChange={setNewFolderName}
          onCreateFolder={handleCreateFolder}
          onSelectFolder={(folderId) => {
            setAskMode("selected_folder");
            setSelectedFolderId(folderId);
          }}
          onSelectDocument={handleSelectDocument}
          onStartRenameFolder={(folderId, folderName) => {
            setEditingFolderId(folderId);
            setEditingFolderName(folderName);
          }}
          onEditingFolderNameChange={setEditingFolderName}
          onRenameFolder={handleRenameFolder}
          onCancelRenameFolder={() => {
            setEditingFolderId(null);
            setEditingFolderName("");
          }}
          onDeleteFolder={(folderId, folderName) => {
            setDeleteTarget({ type: "folder", id: folderId, name: folderName });
          }}
        />

        <section className="min-w-0 flex-1">
          <Topbar onNewChat={handleNewChat} />

          <div className="grid grid-cols-1 gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_310px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-5">
              {shouldShowHero && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-2 text-sm font-extrabold text-blue-600">
                    AI Document Workspace
                  </p>

                  <h2 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950">
                    Ask your business documents with verified citations.
                  </h2>

                  <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">
                    Upload contracts, reports, spreadsheets, and internal
                    files. Get clear answers grounded in exact pages and
                    sections.
                  </p>
                </section>
              )}

              <UploadCard
                folders={folders}
                selectedUploadFolderId={selectedUploadFolderId}
                isUploading={isUploading}
                onFolderChange={setSelectedUploadFolderId}
                onUpload={handleUpload}
              />

              <ChatPanel
                documents={documents}
                folders={folders}
                question={question}
                messages={messages}
                askMode={askMode}
                selectedDocumentId={selectedDocumentId}
                selectedFolderId={selectedFolderId}
                activeConversationId={activeConversationId}
                isAsking={isAsking}
                isLoadingConversation={isLoadingConversation}
                onQuestionChange={setQuestion}
                onAskModeChange={setAskMode}
                onSelectedDocumentChange={setSelectedDocumentId}
                onSelectedFolderChange={setSelectedFolderId}
                onAsk={handleAsk}
              />

              <DocumentsList
                documents={documents}
                folders={folders}
                isLoading={isLoading}
                askMode={askMode}
                selectedDocumentId={selectedDocumentId}
                deletingDocumentId={deletingDocumentId}
                movingDocumentId={movingDocumentId}
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={(documentId, fileName) => {
                  setDeleteTarget({
                    type: "document",
                    id: documentId,
                    name: fileName,
                  });
                }}
                onMoveDocument={handleMoveDocument}
              />

              <StatsGrid
                isLoading={isLoading}
                totalDocuments={documents.length}
                totalFolders={folders.length}
                totalConversations={conversations.length}
                totalChunks={totalChunks}
              />
            </div>

            <aside className="hidden min-w-0 space-y-5 xl:block">
              <SourcesPanel sources={sources} />

              <ConversationsPanel
                conversations={conversations}
                isLoading={isLoading}
                activeConversationId={activeConversationId}
                onLoadConversation={handleLoadConversation}
              />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}