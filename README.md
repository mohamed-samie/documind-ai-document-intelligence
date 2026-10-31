# Lecta AI

AI-powered study assessment platform that generates professor-style exams from real lecture files and previous exams.

Lecta AI is built to solve a common problem for university students: most AI study tools generate generic questions that are not grounded in the actual lecture content or the professor's exam style.

Instead of producing random quizzes, Lecta AI analyzes lecture files, retrieves relevant lecture sections, generates structured exam questions, lets students solve them in-browser, grades their answers, explains mistakes, and maps weak areas to revision topics.

## Core Workflow

1. Upload lecture files
2. Parse and process lecture content
3. Chunk and embed lecture sections
4. Retrieve relevant content using RAG
5. Generate professor-style exam questions
6. Solve the exam inside the platform
7. Grade answers and provide feedback
8. Map weak areas to revision topics

## Features

- Lecture-based question generation
- Professor-style exam generation
- Previous-exam style matching (upload a past exam to mirror its question style)
- RAG-based content grounding
- Schema-constrained LLM outputs
- In-browser exam solving experience
- Automated grading and feedback
- Weak-area revision mapping
- Async exam generation pipeline

## Tech Stack

**Frontend:** Next.js, TypeScript  
**Backend:** FastAPI  
**Async Processing:** Celery, Redis  
**Vector Search:** Sentence-Transformers embeddings + cosine similarity  
**LLM / AI:** LangChain, Groq (Llama 3.3 70B), Pydantic-validated outputs  
**Database:** PostgreSQL / Supabase  
**Containers:** Docker Compose (API, Celery worker, Redis)  
**Deployment:** Vercel

## Architecture

Student uploads lecture files  
↓  
Lecture parsing and preprocessing  
↓  
Text chunking and embeddings  
↓  
Embeddings stored with each chunk (cosine similarity search)  
↓  
RAG retrieval over lecture content  
↓  
LLM generates structured exam questions  
↓  
Student solves exam in browser  
↓  
LLM-assisted grading and feedback  
↓  
Revision topics are generated

## Why This Project Matters

Most AI quiz generators rely on generic LLM knowledge. Lecta AI focuses on grounded assessment generation using the actual lecture material and previous exam style.

The goal is to help students practice in a way that is closer to how their professor actually tests.

## Current Status

The MVP includes the core full exam flow and UI foundation.

Planned improvements:

- More advanced grading rubrics
- Better lecture parsing for PDFs and slides
- Student performance dashboard
- More detailed revision recommendations
- Background job monitoring

## Demo Video

[Watch the demo](https://youtu.be/K0oL6rwVgNU?si=2eyWtiRRzcWAS7On)

## Author

Mohamed Abdel-Samie  
AI Engineer & Computer Science student building LLM-powered applications, ML pipelines, and full-stack AI products.
