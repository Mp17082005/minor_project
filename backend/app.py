from fastapi import FastAPI, UploadFile, File, Query, Body
import tempfile
import os
import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer
from tavily import TavilyClient
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from web import search_and_extract, ask_gemini

from doc_processor import process_file_to_qdrant

# ---------- Setup ----------
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.5hqNxJ5Lr9KCqmgjCIjA4THBoPw1n_UYaJ3AQTJWNRc"
QDRANT_URL = "https://0896e0e6-4b50-438a-82db-09ba2ce1b1a8.us-east-1-1.aws.cloud.qdrant.io"

COLLECTION = "notes_collection_cloud"
GOOGLE_API_KEY = "AIzaSyC-0QS0QPPfsB4xzR-ZkTWgsZVScn1i8ws"

qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
tavily_client = TavilyClient(api_key="your_tavily_key")

# ---------- Ensure collection & index ----------
try:
    qdrant_client.get_collection(COLLECTION)
except Exception:
    qdrant_client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    )

# ✅ Ensure payload index for doc_id
try:
    qdrant_client.create_payload_index(
        collection_name=COLLECTION,
        field_name="doc_id",
        field_schema=models.PayloadSchemaType.KEYWORD,
    )
    print("✅ Payload index for 'doc_id' created")
except Exception as e:
    if "already exists" in str(e):
        print("ℹ️ Payload index for 'doc_id' already exists, skipping.")
    else:
        raise e


# ---------- Upload Endpoint ----------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Generate unique doc_id for this file
    doc_id = str(uuid.uuid4())

    _, ext = os.path.splitext(file.filename)
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Pass doc_id to processing
    chunks_stored = process_file_to_qdrant(tmp_path, COLLECTION, doc_id)
    os.unlink(tmp_path)

    return {"success": True, "doc_id": doc_id, "chunks_stored": chunks_stored}


# ---------- Chat Endpoint ----------
@app.post("/chat/")
def chat(data: dict = Body(...)):
    """
    Chat endpoint.
    Expects JSON body:
    {
        "message": "...",
        "mode": "notes" | "web" | "llm",
        "doc_id": "..."
    }
    """
    query = data.get("message")
    mode = data.get("mode", "notes")
    doc_id = data.get("doc_id")

    if not query:
        return {"success": False, "error": "Message (query) is required"}

    if mode == "notes":
        # Encode query
        query_vec = embedding_model.encode([query]).tolist()[0]

        # Restrict by doc_id if provided
        search_filter = None
        if doc_id:
            search_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="doc_id",
                        match=models.MatchValue(value=doc_id),
                    )
                ]
            )

        # Search in Qdrant
        hits = qdrant_client.search(
            collection_name=COLLECTION,
            query_vector=query_vec,
            query_filter=search_filter,
            limit=4,
        )
        context = "\n".join([hit.payload["text"] for hit in hits]) if hits else ""

        # Setup LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
        )

        # Prompt
        qa_prompt = PromptTemplate(
            template="""
You are a helpful AI tutor for school students. 
Answer the question strictly based on the provided context.  

- If the answer is in the context, explain it clearly and simply.  
- If the answer is not in the context, say: "I could not find the answer in the textbook."  
- If possible, mention the page or source info.  

Context:
{context}

Question:
{question}

Answer:""",
            input_variables=["context", "question"],
        )

        final_prompt = qa_prompt.format(context=context, question=query)
        answer = llm.invoke(final_prompt)

        if hasattr(answer, "content"):
            answer_text = answer.content
        else:
            answer_text = str(answer)
        return {
            "success": True,
            "mode": mode,
            "response": answer_text,
            "context": context,
            "doc_id": doc_id,
        }

    elif mode == "web":
        # Search web and summarize
        content = search_and_extract(query, summarize=True)
        answer = ask_gemini(query, content)
        return {
            "success": True,
            "mode": mode,
            "response": str(answer),
            "context": content,
        }

    elif mode == "llm":
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
        )
        answer = llm.invoke(query)
        answer_text = answer.content if hasattr(answer, "content") else str(answer)
        return {"success": True, "mode": mode, "response": answer_text}

    else:
        return {"success": False, "error": "Invalid mode"}
import uvicorn

if __name__ == '__main__':
    # Start Uvicorn when running this file directly.
    # Use reload=True for development; remove in production.
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
