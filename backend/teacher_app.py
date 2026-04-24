from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from grader import grade_assignment

# ---------- Setup ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Grade Assignment Endpoint ----------
@app.post("/grade-assignment")
async def grade_assignment_endpoint(
    file: UploadFile = File(...),
    grading_rules: str = Form(...),
    question: str = Form(...)
):
    """
    Grade a student assignment using Gemini 2.5 Flash
    Expects:
    - file: Student's assignment (PDF, DOCX, or image)
    - grading_rules: Teacher's grading criteria
    - question: The assignment question/prompt
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

@app.get("/")
def read_root():
    return {"message": "Teacher Grading API - Powered by Gemini 2.5 Flash"}

# ---------- Uvicorn Runner ----------
import uvicorn

if __name__ == '__main__':
    print("Starting Teacher Grading API on http://127.0.0.1:8000")
    print("Using Gemini 2.5 Flash model")
    uvicorn.run("teacher_app:app", host="127.0.0.1", port=8000, reload=True)
