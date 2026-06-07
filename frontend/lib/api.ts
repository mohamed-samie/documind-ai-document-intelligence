import type {
  AskQuestionPayload,
  AskQuestionResponse,
  ConversationResponse,
  ConversationsResponse,
  DocumentsResponse,
  FoldersResponse,
  UploadDocumentPayload,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseError(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg)
        .filter(Boolean)
        .join(", ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch {
    // Ignore JSON parsing errors and fallback below.
  }

  return `Request failed with status ${response.status}`;
}

async function request<T>(endpoint: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  let body: BodyInit | undefined;

  if (isFormData) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getDocuments() {
  return request<DocumentsResponse>("/documents");
}

export function getFolders() {
  return request<FoldersResponse>("/folders");
}

export function createFolder(name: string) {
  return request("/folders", {
    method: "POST",
    body: { name },
  });
}

export function renameFolder({
  folderId,
  name,
}: {
  folderId: string;
  name: string;
}) {
  return request(`/folders/${folderId}`, {
    method: "PATCH",
    body: { name },
  });
}

export function deleteFolder(folderId: string) {
  return request(`/folders/${folderId}`, {
    method: "DELETE",
  });
}

export function uploadDocument({ file, folderId }: UploadDocumentPayload) {
  const formData = new FormData();
  formData.append("file", file);

  if (folderId) {
    formData.append("folder_id", folderId);
  }

  return request("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export function moveDocumentToFolder({
  documentId,
  folderId,
}: {
  documentId: string;
  folderId: string | null;
}) {
  return request(`/documents/${documentId}/folder`, {
    method: "PATCH",
    body: { folder_id: folderId },
  });
}

export function deleteDocument(documentId: string) {
  return request(`/documents/${documentId}`, {
    method: "DELETE",
  });
}

export function getConversations() {
  return request<ConversationsResponse>("/conversations");
}

export function getConversation(conversationId: string) {
  return request<ConversationResponse>(`/conversations/${conversationId}`);
}

export function askQuestion(payload: AskQuestionPayload) {
  return request<AskQuestionResponse>("/chat/ask", {
    method: "POST",
    body: payload,
  });
}
