export type AskMode = "all_documents" | "selected_document" | "selected_folder";

export const SUPPORTED_FILE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".xlsm",
  ".csv",
] as const;

export type DocumentItem = {
  id: string;
  user_id?: string;
  file_name: string;
  file_type?: string | null;
  total_pages: number;
  total_chunks: number;
  folder_id?: string | null;
  folder_name?: string | null;
  created_at?: string;
};

export type FolderItem = {
  id: string;
  user_id?: string;
  name: string;
  documents_count: number;
  created_at?: string;
};

export type SourceItem = {
  file_name: string;
  page_number: number;
  section_title?: string | null;
  chunk_index?: number | null;
  distance?: number | null;
  rerank_score?: number | null;
  content_preview?: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  created_at?: string;
  isPending?: boolean;
};

export type ConversationItem = {
  id: string;
  user_id?: string;
  title: string;
  messages_count: number;
  created_at: string;
  updated_at?: string;
};

export type AskQuestionPayload = {
  question: string;
  top_k?: number;
  document_id?: string | null;
  folder_id?: string | null;
  conversation_id?: string | null;
};

export type AskQuestionResponse = {
  answer: string;
  conversation_id: string;
  sources: SourceItem[];
};

export type DocumentsResponse = {
  documents_count: number;
  documents: DocumentItem[];
};

export type FoldersResponse = {
  folders_count: number;
  folders: FolderItem[];
};

export type ConversationsResponse = {
  conversations_count: number;
  conversations: ConversationItem[];
};

export type ConversationMessageResponse = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  sources: unknown;
  created_at: string;
};

export type ConversationResponse = {
  conversation: ConversationItem;
  messages: ConversationMessageResponse[];
};

export type UploadDocumentPayload = {
  file: File;
  folderId?: string | null;
};
