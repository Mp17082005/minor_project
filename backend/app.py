# from fastapi import FastAPI, UploadFile, File, Query, Body
# import tempfile
# import os
# import uuid

# from qdrant_client import QdrantClient
# from qdrant_client.http import models
# from sentence_transformers import SentenceTransformer
# from tavily import TavilyClient
# from langchain.prompts import PromptTemplate
# from langchain_google_genai import ChatGoogleGenerativeAI
# from web import search_and_extract, ask_gemini

# from doc_processor import process_file_to_qdrant

# # ---------- Setup ----------
# app = FastAPI()

# from fastapi.middleware.cors import CORSMiddleware

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.QkqDWeojPDX6JdjsZb01D_xbuFwA5vXiHNjmapoidkg"
# QDRANT_URL = "https://0896e0e6-4b50-438a-82db-09ba2ce1b1a8.us-east-1-1.aws.cloud.qdrant.io"

# COLLECTION = "mini_project"
# GOOGLE_API_KEY = "AIzaSyC-0QS0QPPfsB4xzR-ZkTWgsZVScn1i8ws"

# qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
# embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
# tavily_client = TavilyClient(api_key="your_tavily_key")

# # ---------- Ensure collection & index ----------
# try:
#     qdrant_client.get_collection(COLLECTION)
# except Exception:
#     qdrant_client.create_collection(
#         collection_name=COLLECTION,
#         vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
#     )

# # ✅ Ensure payload index for doc_id
# try:
#     qdrant_client.create_payload_index(
#         collection_name=COLLECTION,
#         field_name="doc_id",
#         field_schema=models.PayloadSchemaType.KEYWORD,
#     )
#     print("✅ Payload index for 'doc_id' created")
# except Exception as e:
#     if "already exists" in str(e):
#         print("ℹ️ Payload index for 'doc_id' already exists, skipping.")
#     else:
#         raise e


# # ---------- Upload Endpoint ----------
# @app.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     # Generate unique doc_id for this file
#     doc_id = str(uuid.uuid4())

#     _, ext = os.path.splitext(file.filename)
#     with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     # Pass doc_id to processing
#     chunks_stored = process_file_to_qdrant(tmp_path, COLLECTION, doc_id)
#     os.unlink(tmp_path)

#     return {"success": True, "doc_id": doc_id, "chunks_stored": chunks_stored}


# # ---------- Chat Endpoint ----------
# @app.post("/chat/")
# def chat(data: dict = Body(...)):
#     """
#     Chat endpoint.
#     Expects JSON body:
#     {
#         "message": "...",
#         "mode": "notes" | "web" | "llm",
#         "doc_id": "..."
#     }
#     """
#     query = data.get("message")
#     mode = data.get("mode", "notes")
#     doc_id = data.get("doc_id")

#     if not query:
#         return {"success": False, "error": "Message (query) is required"}

#     if mode == "notes":
#         # Encode query
#         query_vec = embedding_model.encode([query]).tolist()[0]

#         # Restrict by doc_id if provided
#         search_filter = None
#         if doc_id:
#             search_filter = models.Filter(
#                 must=[
#                     models.FieldCondition(
#                         key="doc_id",
#                         match=models.MatchValue(value=doc_id),
#                     )
#                 ]
#             )

#         # Search in Qdrant
#         hits = qdrant_client.search(
#             collection_name=COLLECTION,
#             query_vector=query_vec,
#             query_filter=search_filter,
#             limit=4,
#         )
#         context = "\n".join([hit.payload["text"] for hit in hits]) if hits else ""

#         # Setup LLM
#         llm = ChatGoogleGenerativeAI(
#             model="gemini-2.5-flash",
#             google_api_key=GOOGLE_API_KEY,
#         )

#         # Prompt
#         qa_prompt = PromptTemplate(
#             template="""
# You are a helpful AI tutor for school students. 
# Answer the question strictly based on the provided context.  

# - If the answer is in the context, explain it clearly and simply.  
# - If the answer is not in the context, say: "I could not find the answer in the textbook."  
# - If possible, mention the page or source info.  

# Context:
# {context}

# Question:
# {question}

# Answer:""",
#             input_variables=["context", "question"],
#         )

#         final_prompt = qa_prompt.format(context=context, question=query)
#         answer = llm.invoke(final_prompt)

#         if hasattr(answer, "content"):
#             answer_text = answer.content
#         else:
#             answer_text = str(answer)
#         return {
#             "success": True,
#             "mode": mode,
#             "response": answer_text,
#             "context": context,
#             "doc_id": doc_id,
#         }

#     elif mode == "web":
#         # Search web and summarize
#         content = search_and_extract(query, summarize=True)
#         answer = ask_gemini(query, content)
#         return {
#             "success": True,
#             "mode": mode,
#             "response": str(answer),
#             "context": content,
#         }

#     elif mode == "llm":
#         llm = ChatGoogleGenerativeAI(
#             model="gemini-2.5-flash",
#             google_api_key=GOOGLE_API_KEY,
#         )
#         answer = llm.invoke(query)
#         answer_text = answer.content if hasattr(answer, "content") else str(answer)
#         return {"success": True, "mode": mode, "response": answer_text}

#     else:
#         return {"success": False, "error": "Invalid mode"}
# import uvicorn

# if __name__ == '__main__':
#     # Start Uvicorn when running this file directly.
#     # Use reload=True for development; remove in production.
#     uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)


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

QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6NGI5NTRlOGItMTdjYi00NzQ2LTljNGItNjJjOWM0ZjYyODk3In0.3zchyzDoy7utjld9BHBVn-syeshksqCGjNw6KjDKosk"
QDRANT_URL = "https://56b2f68b-519a-45f8-8094-ec683f625b26.eu-central-1-0.aws.cloud.qdrant.io:6333"

COLLECTION = "notesync"
GOOGLE_API_KEY = "AIzaSyC-0QS0QPPfsB4xzR-ZkTWgsZVScn1i8ws"

qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
tavily_client = TavilyClient(api_key="your_tavily_key")

# ---------- Ensure collection & index ----------
try:
    qdrant_client.get_collection(COLLECTION)
    print("✅ Qdrant collection found")
except Exception as e:
    print(f"⚠️ Qdrant collection not found, attempting to create: {e}")
    try:
        qdrant_client.create_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        )
        print("✅ Qdrant collection created")
    except Exception as create_error:
        print(f"⚠️ Could not create Qdrant collection: {create_error}")
        print("⚠️ Student features (RAG) may not work, but teacher grading will work fine")

# Ensure payload index for doc_id
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
        print(f"⚠️ Could not create payload index: {e}")


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

    # ===============================
    # MODE 1: RAG from uploaded notes
    # ===============================
    if mode == "notes":
        query_vec = embedding_model.encode([query]).tolist()[0]

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

        hits = qdrant_client.search(
            collection_name=COLLECTION,
            query_vector=query_vec,
            query_filter=search_filter,
            limit=4,
        )
        context = "\n".join([hit.payload["text"] for hit in hits]) if hits else ""

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
        )

        qa_prompt = PromptTemplate(
            template="""
You are a helpful AI tutor for school students. 
Answer the question strictly based on the provided context.  

- If the answer is in the context, explain it clearly and simply.  
- If the answer is not in the context, say: "I could not find the answer in the textbook."  

Context:
{context}

Question:
{question}

Answer:
""",
            input_variables=["context", "question"],
        )

        final_prompt = qa_prompt.format(context=context, question=query)
        answer = llm.invoke(final_prompt)

        answer_text = answer.content if hasattr(answer, "content") else str(answer)
        return {
            "success": True,
            "mode": mode,
            "response": answer_text,
            "context": context,
            "doc_id": doc_id,
        }

    # ===============================
    # MODE 2: WEB + NOTES HYBRID RAG
    # ===============================
    elif mode == "web":
        # --- Step 1: Retrieve embeddings from Qdrant ---
        query_vec = embedding_model.encode([query]).tolist()[0]

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

        hits = qdrant_client.search(
            collection_name=COLLECTION,
            query_vector=query_vec,
            query_filter=search_filter,
            limit=4,
        )

        qdrant_context = "\n".join([hit.payload["text"] for hit in hits]) if hits else ""

        # --- Step 2: Web Search ---
        web_content = search_and_extract(query, summarize=True)

        # --- Step 3: Combine both ---
        combined_context = f"""
=================== NOTES (From Uploaded Documents) ===================
{qdrant_context}

=========================== WEB RESULTS ===============================
{web_content}
"""

        # --- Step 4: Generate Hybrid Answer ---
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
        )

        prompt = f"""
You are a helpful and smart AI tutor. 
Use both the student's uploaded notes and the internet to answer the question accurately.

Rules:
- If the textbook contains the answer, prioritize that.
- Otherwise rely on the web results.
- If neither provides relevant info, say:
  "I could not find the answer in notes or on the web."

Combined Context:
{combined_context}

Question:
{query}

Answer:
"""

        answer = llm.invoke(prompt)
        answer_text = answer.content if hasattr(answer, "content") else str(answer)

        return {
            "success": True,
            "mode": mode,
            "response": answer_text,
            "context_notes": qdrant_context,
            "context_web": web_content,
        }

    # ===============================
    # MODE 3: Pure LLM (No Context)
    # ===============================
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


# ---------- Grade Assignment Endpoint ----------
from grader import grade_assignment
from fastapi import Form

@app.post("/grade-assignment")
async def grade_assignment_endpoint(
    file: UploadFile = File(...),
    grading_rules: str = Form(...),
    question: str = Form(...)
):
    """
    Grade a student assignment using Gemini AI
    Expects:
    - file: Student's assignment (PDF, DOCX, or image)
    - grading_rules: Teacher's grading criteria
    - question: The assignment question/prompt
    """
    _, ext = os.path.splitext(file.filename)
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = grade_assignment(tmp_path, question, grading_rules)
        # Wait a bit before deleting on Windows
        import time
        time.sleep(0.5)
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return result
    except Exception as e:
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return {"success": False, "error": str(e)}


# ---------- Uvicorn Runner ----------
import uvicorn

if __name__ == '__main__':
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
