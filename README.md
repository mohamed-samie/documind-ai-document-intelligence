# DocuMind — AI Document Intelligence Platform

DocuMind is a full-stack multi-document RAG System that allows users to upload PDFs, Word documents, Excel sheets, and CSV files, organize them into folders, and ask natural-language questions with grounded answers and verified source citations.

Built as a production-oriented AI application for document-heavy businesses such as accounting offices, legal teams, real estate agencies, and internal operations teams.

---

## Preview

### Dashboard

A clean SaaS-style workspace for uploading documents, managing folders, asking questions, and reviewing verified sources.

![DocuMind Dashboard](docs/screenshots/homepage.png)

### Chat with Verified Citations

DocuMind generates structured answers grounded in uploaded documents, including comparison tables and source-backed responses.

![Chat with Verified Citations](docs/screenshots/chat-with-citations.png)

### Folder-Based Retrieval

Users can ask questions inside a selected folder and view the documents inside that folder directly from the sidebar.

![Folder-Based Retrieval](docs/screenshots/folder-retrieval-mode.png)

---

## Why DocuMind?

Business teams often store critical information across multiple files: contracts, reports, spreadsheets, proposals, policies, and internal documents.

Searching these files manually is slow, repetitive, and error-prone, especially when users need answers across several documents at once.

DocuMind solves this by turning uploaded files into a searchable knowledge base and allowing users to ask questions in natural language while preserving trust through source citations.

---

## Key Features

- Upload and index PDF, DOCX, XLSX, XLSM, and CSV files
- Parse uploaded documents and extract searchable text
- Split documents into retrievable chunks
- Generate embeddings for semantic search
- Retrieve relevant chunks across all documents
- Ask questions inside a selected document
- Ask questions inside a selected folder
- Rerank retrieved results before answer generation
- Generate grounded LLM answers with source citations
- Organize documents into folders
- Move documents between folders directly from the document library
- Open folders from the sidebar and view their documents
- Continue previous conversations using conversation history
- View verified sources used to generate each answer
- Use a polished SaaS-style dashboard built for business users

---

## Demo Use Cases

DocuMind is designed for document-heavy workflows where users need reliable answers from private files.

Example use cases:

- Summarize internal business documents
- Compare reports, contracts, or lecture files
- Find risks, obligations, and key clauses
- Ask questions across all uploaded documents
- Ask questions inside a selected document
- Ask questions inside a selected folder
- Search internal knowledge bases using natural language
- Extract important information from reports and spreadsheets

Example questions:

```text
Summarize this document.
Compare agile and plan-driven models.
What are the key risks mentioned in this report?
Find the obligations in this contract.
Where are the requirements misunderstood?
What are the most important sections in this file?
```

---

## System Workflow

```text
Upload Document
      ↓
Parse Text
      ↓
Chunk Content
      ↓
Generate Embeddings
      ↓
Store Document Chunks
      ↓
Retrieve Relevant Chunks
      ↓
Rerank Results
      ↓
Generate Grounded Answer
      ↓
Show Verified Sources
```

---

## Architecture

```text
Frontend: Next.js + TypeScript + Tailwind CSS
        |
        v
Backend: FastAPI
        |
        v
Document Pipeline:
Upload → Parse → Chunk → Embed → Store → Retrieve → Rerank → Generate Answer
        |
        v
Answer with citations and source references
```

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- SaaS-style dashboard UI
- Component-based frontend architecture

### Backend

- Python
- FastAPI
- Document parsing
- Chunking pipeline
- Embedding generation
- Hybrid retrieval
- Reranking
- LLM answer generation

### AI / RAG

- Retrieval-Augmented Generation
- Embeddings
- Multi-document search
- Folder-scoped retrieval
- Selected-document retrieval
- Source-grounded responses
- Citation-based answer validation

### Storage / Infrastructure

- PostgreSQL / Supabase
- REST APIs
- Environment-based configuration

---

## Project Structure

```text
DocuMind/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── chat-with-citations.png
│       └── folder-retrieval-mode.png
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/mohamed-samie/documind-ai-document-intelligence.git
cd documind-ai-document-intelligence
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend runs on:

```text
http://127.0.0.1:8000
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

## Environment Variables

Create a real `.env` file locally using the example file:

```bash
cp backend/.env.example backend/.env
```

Example:

```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
DATABASE_URL=your_database_url_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Never commit real API keys or database credentials.

The real values should stay only in:

```text
backend/.env
```

The `.env.example` file should contain placeholders only.

---

## Main Product Screens

### Dashboard

The dashboard gives users a clear overview of their workspace, upload area, document folders, verified sources, and recent conversations.

### Upload Documents

Users can upload PDFs, Word documents, Excel sheets, and CSV files. Uploaded documents are parsed, chunked, embedded, and indexed for retrieval.

### Ask Your Documents

Users can ask questions across:

- All documents
- A selected document
- A selected folder

### Verified Sources

The source panel shows the exact documents, pages, and sections used to generate the answer.

### Document Library

Users can view uploaded documents, move files between folders, ask a selected document, and delete files.

### Folder Sidebar

Users can create folders, rename folders, delete folders, open a folder, and view the documents inside it.

---

## What Makes This Project Strong

DocuMind is not just a basic chatbot. It demonstrates a complete AI product workflow:

- Real document ingestion
- Multi-format file parsing
- Chunking strategy
- Embedding-based retrieval
- Hybrid search
- Reranking
- LLM response generation
- Source citations
- Conversation history
- Folder-based knowledge organization
- Business-focused UI/UX

This makes it suitable as a portfolio project for AI Engineer, LLM Apps, RAG Systems, and Full-Stack AI roles.

---

## What I Learned

- How to build a full-stack RAG system from document upload to answer generation
- How to design retrieval flows for all-documents, selected-document, and selected-folder modes
- How to structure a FastAPI backend for AI document workflows
- How to build a polished SaaS-style frontend using Next.js and TypeScript
- How to improve trust in LLM answers using source citations
- How to design document organization features for business users
- How to handle conversation state, sources, and user workflows in a real product interface

---

## Future Improvements

- OCR support for scanned PDFs
- Streaming LLM responses
- Source highlighting inside document previews
- Advanced document preview drawer
- Authentication and team workspaces
- Role-based access control
- Dockerized deployment
- CI/CD pipeline
- Usage analytics dashboard
- Export answers to PDF or DOCX
- Workspace sharing for teams

---

## Repository Best Practices Applied

- Clean project structure
- Separate frontend and backend folders
- Environment variables stored outside Git
- `.env.example` used for safe configuration sharing
- Professional README documentation
- Feature-focused commit messages
- Branch-based documentation workflow

---

## Author

**Mohamed Abdel-Samie**

CS & AI Student @ Assiut University  
AI Engineer Intern @ e& Egypt

Focused on building production-oriented AI applications, LLM-powered tools, RAG workflows, and practical ML systems.

---

## License

This project is currently intended for portfolio and educational purposes.