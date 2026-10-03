# Exam Prep Companion

A RAG-powered study assistant and AI assignment grader. Upload your notes, ask questions against them, and let the model grade submissions against a rubric you define.

Built as a single system with two sides: a **student** side that answers questions from uploaded material, and a **teacher** side that creates assignments and auto-grades what students submit.

---

## What it does

**Student side**
- Upload PDF, DOCX or PPTX study material
- Ask questions and choose where the answer comes from:
  - `notes` — semantic search over your own uploaded documents
  - `web` — live search and extraction via Tavily, then summarised
  - `llm` — straight to Gemini with no retrieval
- Submit assignments and view graded results with feedback

**Teacher side**
- Create assignments with a question prompt and a grading rubric
- View all submissions per assignment
- Trigger AI grading across a whole batch — returns a score, written feedback and a per-criterion breakdown
- Handles text documents and image submissions (handwritten work goes straight to Gemini vision)

---

## How the RAG pipeline works

```
Upload  ──►  Text extraction      PyMuPDF (PDF) / python-docx / python-pptx
         ──►  Chunking            RecursiveCharacterTextSplitter, 800 chars / 150 overlap
         ──►  Embedding           BAAI/bge-small-en-v1.5  (384-dim)
         ──►  Upsert to Qdrant    tagged with a per-document doc_id
Question ──►  Embed query
         ──►  Filtered search     doc_id filter so answers stay scoped to one document
         ──►  Prompt Gemini 2.5 Flash with retrieved chunks
```

Each uploaded file gets a UUID `doc_id` and a keyword payload index in Qdrant, so a question about one document never pulls context from another.

---

## Stack

| Layer | Tech |
|---|---|
| API | FastAPI (async), Uvicorn |
| Vector DB | Qdrant Cloud, cosine distance |
| Embeddings | `BAAI/bge-small-en-v1.5` via sentence-transformers |
| LLM | Google Gemini 2.5 Flash |
| Chunking / prompts | LangChain |
| Web retrieval | Tavily search + extract |
| Document parsing | PyMuPDF, python-docx, python-pptx |
| Frontend | React 18, React Router, Axios |

---

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/upload` | Ingest a document, returns `doc_id` and chunk count |
| `POST` | `/chat/` | Ask a question — body takes `message`, `mode`, `doc_id` |
| `POST` | `/api/assignments/create` | Create an assignment with a rubric |
| `GET` | `/api/assignments` | List assignments |
| `GET` | `/api/assignments/{id}/submissions` | Submissions for one assignment |
| `POST` | `/api/submissions/submit` | Student submits work |
| `POST` | `/api/grade/assignment/{id}` | Batch-grade every submission |
| `GET` | `/api/results/student/{email}` | A student's graded results |

---

## Running it

**Backend**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env     # fill in your keys
uvicorn app:app --reload --port 8000
```

Required environment variables:

```
GOOGLE_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
TAVILY_API_KEY=
```

**Frontend**

```bash
cd frontend
npm install
npm start
```

Runs on `localhost:3000`, talks to the API on `localhost:8000`.

---

## Project layout

```
backend/
├── app.py              # main API — upload + chat + grading
├── assignment_app.py   # assignment and submission endpoints
├── teacher_app.py      # standalone grading service
├── doc_processor.py    # extraction, chunking, Qdrant upsert
├── grader.py           # Gemini rubric grading (text + vision)
├── web.py              # Tavily search, extract, summarise
└── database.py         # JSON persistence layer

frontend/src/pages/
├── Home.js               # upload + how it works
├── Chat.js               # document / web / LLM chat
├── StudentDashboard.js   # assignments and results
├── TeacherDashboard.js   # create and manage assignments
└── TeacherAssignments.js # submissions and batch grading
```

---

## Notes

Persistence is a JSON store (`database.py`) — deliberately simple for the project scope. For production this swaps to PostgreSQL or MongoDB without touching the API surface.
