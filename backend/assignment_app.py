from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
import shutil
from datetime import datetime
from grader import grade_assignment
import database as db

# RAG imports
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from web import search_and_extract, ask_gemini
from doc_processor import process_file_to_qdrant
import uuid

# ---------- Setup ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# RAG Configuration
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.QkqDWeojPDX6JdjsZb01D_xbuFwA5vXiHNjmapoidkg"
QDRANT_URL = "https://0896e0e6-4b50-438a-82db-09ba2ce1b1a8.us-east-1-1.aws.cloud.qdrant.io"
COLLECTION = "mini_project"
GOOGLE_API_KEY = "AIzaSyC-0QS0QPPfsB4xzR-ZkTWgsZVScn1i8ws"

# Initialize RAG components
try:
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
    embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    print("✅ RAG system initialized")
except Exception as e:
    print(f"⚠️ RAG initialization warning: {e}")
    qdrant_client = None
    embedding_model = None

# ---------- Models ----------
class AssignmentCreate(BaseModel):
    title: str
    question: str
    grading_rules: str
    deadline: str  # ISO format datetime
    teacher_email: str

class SubmissionCreate(BaseModel):
    assignment_id: str
    student_name: str
    student_email: str

# ---------- Assignment Endpoints ----------
@app.post("/api/assignments/create")
async def create_assignment(assignment: AssignmentCreate):
    """Teacher creates a new assignment"""
    assignment_data = assignment.dict()
    created = db.create_assignment(assignment_data)
    return {"success": True, "assignment": created}

@app.get("/api/assignments")
async def get_assignments():
    """Get all assignments"""
    assignments = db.get_all_assignments()
    
    # Update status based on deadline
    now = datetime.now()
    for assignment in assignments:
        deadline = datetime.fromisoformat(assignment['deadline'])
        if now > deadline and assignment['status'] == 'active':
            db.update_assignment_status(assignment['id'], 'closed')
            assignment['status'] = 'closed'
    
    return {"success": True, "assignments": assignments}

@app.get("/api/assignments/{assignment_id}")
async def get_assignment(assignment_id: str):
    """Get specific assignment"""
    assignment = db.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if deadline passed
    now = datetime.now()
    deadline = datetime.fromisoformat(assignment['deadline'])
    if now > deadline and assignment['status'] == 'active':
        db.update_assignment_status(assignment_id, 'closed')
        assignment['status'] = 'closed'
    
    return {"success": True, "assignment": assignment}

@app.get("/api/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: str):
    """Get all submissions for an assignment"""
    submissions = db.get_submissions_by_assignment(assignment_id)
    
    # Add results if graded
    for submission in submissions:
        result = db.get_result_by_submission(submission['id'])
        if result:
            submission['result'] = result
    
    return {"success": True, "submissions": submissions}

# ---------- Submission Endpoints ----------
@app.post("/api/submissions/submit")
async def submit_assignment(
    assignment_id: str = Form(...),
    student_name: str = Form(...),
    student_email: str = Form(...),
    file: UploadFile = File(...)
):
    """Student submits an assignment"""
    
    # Check if assignment exists
    assignment = db.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check deadline
    now = datetime.now()
    deadline = datetime.fromisoformat(assignment['deadline'])
    if now > deadline:
        raise HTTPException(status_code=400, detail="Assignment deadline has passed")
    
    # Check if student already submitted
    if db.check_student_submitted(assignment_id, student_email):
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{assignment_id}_{student_email}{file_ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create submission record
    submission_data = {
        "assignment_id": assignment_id,
        "student_name": student_name,
        "student_email": student_email,
        "file_path": file_path,
        "file_name": file.filename
    }
    
    submission = db.create_submission(submission_data)
    
    return {"success": True, "submission": submission}

@app.get("/api/submissions/student/{student_email}")
async def get_student_submissions(student_email: str):
    """Get all submissions by a student"""
    submissions = db.get_submissions_by_student(student_email)
    
    # Add assignment details and results
    for submission in submissions:
        assignment = db.get_assignment(submission['assignment_id'])
        submission['assignment'] = assignment
        
        result = db.get_result_by_submission(submission['id'])
        if result:
            submission['result'] = result
    
    return {"success": True, "submissions": submissions}

# ---------- Grading Endpoints ----------
@app.post("/grade-assignment")
async def grade_single_assignment(
    file: UploadFile = File(...),
    grading_rules: str = Form(...),
    question: str = Form(...)
):
    """
    Grade a single assignment using Gemini 2.5 Flash (for Teacher Dashboard)
    """
    print(f"Received grading request for file: {file.filename}")
    
    _, ext = os.path.splitext(file.filename)
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        print(f"Processing file: {tmp_path}")
        result = grade_assignment(tmp_path, question, grading_rules)
        print(f"Grading complete: {result}")
        
        # Wait a bit before deleting on Windows
        import time
        time.sleep(0.5)
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return result
    except Exception as e:
        print(f"Error during grading: {str(e)}")
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return {"success": False, "error": str(e)}

@app.post("/api/grade/assignment/{assignment_id}")
async def grade_all_submissions(assignment_id: str):
    """Grade all submissions for an assignment"""
    
    assignment = db.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    submissions = db.get_submissions_by_assignment(assignment_id)
    
    if not submissions:
        raise HTTPException(status_code=400, detail="No submissions to grade")
    
    results = []
    
    for submission in submissions:
        # Skip if already graded
        existing_result = db.get_result_by_submission(submission['id'])
        if existing_result:
            results.append(existing_result)
            continue
        
        # Grade the submission
        try:
            grading_result = grade_assignment(
                submission['file_path'],
                assignment['question'],
                assignment['grading_rules']
            )
            
            if grading_result['success']:
                result_data = {
                    "submission_id": submission['id'],
                    "assignment_id": assignment_id,
                    "student_name": submission['student_name'],
                    "student_email": submission['student_email'],
                    "score": grading_result['score'],
                    "feedback": grading_result['feedback']
                }
                
                result = db.save_result(result_data)
                results.append(result)
        except Exception as e:
            print(f"Error grading submission {submission['id']}: {str(e)}")
            continue
    
    # Update assignment status
    db.update_assignment_status(assignment_id, 'graded')
    
    return {"success": True, "results": results, "total_graded": len(results)}

@app.get("/api/results/student/{student_email}")
async def get_student_results(student_email: str):
    """Get all results for a student"""
    results = db.get_results_by_student(student_email)
    
    # Add assignment details
    for result in results:
        assignment = db.get_assignment(result['assignment_id'])
        result['assignment'] = assignment
    
    return {"success": True, "results": results}

@app.get("/")
def read_root():
    return {"message": "Assignment Management API - Powered by Gemini 2.5 Flash"}

# ---------- Student Document Upload (for RAG/Chat) ----------
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document for student to chat with (original functionality)
    This is separate from assignment submissions
    """
    try:
        # Generate unique doc_id for this file
        import uuid
        doc_id = str(uuid.uuid4())
        
        # Save file temporarily
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"doc_{doc_id}{file_ext}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Here you would process the file for RAG if needed
        # For now, just return success with doc_id
        
        return {
            "success": True,
            "doc_id": doc_id,
            "message": "Document uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Chat Endpoint (for student document Q&A) ----------
@app.post("/chat")
async def chat(data: dict):
    """
    Chat with uploaded documents (original student feature)
    """
    try:
        query = data.get("message")
        mode = data.get("mode", "llm")
        doc_id = data.get("doc_id")
        
        if not query:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # For now, return a simple response
        # You can integrate with your RAG system here
        return {
            "success": True,
            "mode": mode,
            "response": f"This is a placeholder response for: {query}. Full RAG integration can be added here.",
            "doc_id": doc_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Grade Assignment Endpoint (Teacher Dashboard) ----------
@app.post("/grade-assignment")
async def grade_single_assignment(
    file: UploadFile = File(...),
    grading_rules: str = Form(...),
    question: str = Form(...)
):
    """
    Grade a single assignment (Teacher Dashboard feature)
    """
    print(f"Received grading request for file: {file.filename}")
    
    file_ext = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        print(f"Processing file: {tmp_path}")
        result = grade_assignment(tmp_path, question, grading_rules)
        print(f"Grading complete: {result}")
        
        # Wait a bit before deleting on Windows
        import time
        time.sleep(0.5)
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return result
    except Exception as e:
        print(f"Error during grading: {str(e)}")
        try:
            os.unlink(tmp_path)
        except:
            pass  # Ignore deletion errors
        return {"success": False, "error": str(e)}

# ---------- Uvicorn Runner ----------
import uvicorn

if __name__ == '__main__':
    print("Starting Assignment Management API on http://127.0.0.1:8000")
    print("Using Gemini 2.5 Flash model for grading")
    uvicorn.run("assignment_app:app", host="127.0.0.1", port=8000, reload=True)
