# DocuMind — AI Document Intelligence Platform

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![RAG](https://img.shields.io/badge/RAG-Multi--Document-purple)
![Status](https://img.shields.io/badge/Status-Portfolio%20Project-green)

DocuMind is a full-stack multi-document RAG platform that allows users to upload PDFs, Word documents, Excel sheets, and CSV files, organize them into folders, and ask natural-language questions with grounded answers and verified source citations.

Built as a business-focused AI document intelligence product for document-heavy workflows such as reports, contracts, spreadsheets, internal files, and knowledge bases.

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

Business teams often store important knowledge across scattered files. Searching manually is slow, repetitive, and error-prone, especially when users need answers across multiple documents.

DocuMind turns uploaded files into a searchable knowledge base and lets users ask questions in natural language while keeping answers trustworthy through source citations.

---

## Key Features

- Upload and index PDF, DOCX, XLSX, XLSM, and CSV files
- Parse, chunk, embed, retrieve, rerank, and generate grounded answers
- Ask questions across all documents, a selected document, or a selected folder
- Organize documents into folders and move files between folders
- View verified sources used to generate each answer
- Continue previous conversations with conversation history
- Clean SaaS-style dashboard built for business users
- Markdown table rendering for structured answers

---

## Architecture

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

Simplified system flow:

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

**Frontend:** Next.js, TypeScript, React, Tailwind CSS  
**Backend:** Python, FastAPI, PostgreSQL / Supabase  
**AI / RAG:** Embeddings, Hybrid Search, Reranking, LLM Answer Generation, Source Citations

---

## Project Structure

```text
DocuMind/
├── backend/
│   ├── app/
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
│       ├── homepage.png
│       ├── chat-with-citations.png
│       └── folder-retrieval-mode.png
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Running Locally

### Backend

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

### Frontend

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

Create a local `.env` file from the example:

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

Real values should stay only in:

```text
backend/.env
```

---

## Engineering Highlights

- Built a complete RAG pipeline from file upload to grounded answer generation
- Designed retrieval modes for all documents, selected documents, and selected folders
- Added source citations to improve trust and reduce hallucination risk
- Built folder-based document organization for business workflows
- Separated frontend and backend concerns for maintainability and scalability
- Designed a SaaS-style UI suitable for document-heavy business use cases

---

## Future Improvements

- OCR support for scanned PDFs
- Streaming LLM responses
- Source highlighting inside document previews
- Authentication and team workspaces
- Dockerized deployment and CI/CD
- Export answers to PDF or DOCX

---

## Author

**Mohamed Abdel-Samie**  
CS & AI Student @ Assiut University  
AI Engineer Intern @ e& Egypt  

Focused on building production-oriented AI applications, LLM-powered tools, RAG workflows, and practical ML systems.

---

## License

This project is intended for portfolio and educational purposes.  
For commercial use, please contact the author.