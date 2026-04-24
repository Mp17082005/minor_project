import google.generativeai as genai
from PIL import Image
import pymupdf as fitz
import docx
import os

GEMINI_API_KEY = "AIzaSyAdn9nI5gPKYP3mInFhvqT4-oTYl3Yr3T4"
genai.configure(api_key=GEMINI_API_KEY)

def extract_text_from_file(file_path):
    """Extract text from PDF, DOCX, or image files"""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text
    
    elif ext in ['.doc', '.docx']:
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    
    elif ext in ['.jpg', '.jpeg', '.png']:
        return None  # Will use image directly with Gemini
    
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def grade_assignment(file_path, question, grading_rules):
    """
    Grade an assignment using Gemini 2.5 Flash
    
    Args:
        file_path: Path to the student's assignment file
        question: The question/prompt given to students
        grading_rules: Teacher's grading criteria and rubric
    
    Returns:
        dict with score, feedback, and breakdown
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    # Create the grading prompt
    prompt = f"""You are an expert teacher grading a student's assignment. 

QUESTION/ASSIGNMENT PROMPT:
{question}

GRADING RULES AND RUBRIC:
{grading_rules}

INSTRUCTIONS:
1. Carefully read and analyze the student's submission
2. Grade according to the provided rubric
3. Provide a numerical score (if rubric specifies points)
4. Give detailed, constructive feedback
5. Break down the score by each criterion in the rubric

Please provide your response in the following format:

SCORE: [numerical score if applicable, or letter grade]

FEEDBACK:
[Overall feedback on the assignment]

DETAILED BREAKDOWN:
[Break down the score for each criterion mentioned in the rubric]

STRENGTHS:
[What the student did well]

AREAS FOR IMPROVEMENT:
[What could be improved]

Now, here is the STUDENT'S SUBMISSION:
"""

    try:
        # Handle image files
        if ext in ['.jpg', '.jpeg', '.png']:
            model = genai.GenerativeModel("gemini-2.5-flash")
            image = Image.open(file_path)
            response = model.generate_content([prompt, image])
            result_text = response.text
        
        # Handle text-based files
        else:
            student_text = extract_text_from_file(file_path)
            full_prompt = prompt + "\n" + student_text
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(full_prompt)
            result_text = response.text
        
        # Parse the response
        score = "N/A"
        if "SCORE:" in result_text:
            score_line = result_text.split("SCORE:")[1].split("\n")[0].strip()
            score = score_line
        
        return {
            "success": True,
            "score": score,
            "feedback": result_text,
            "breakdown": result_text
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Test the grader
    test_question = "Explain the process of photosynthesis"
    test_rules = """
    - Content accuracy (40 points)
    - Structure and organization (20 points)
    - Grammar and spelling (20 points)
    - Critical thinking (20 points)
    Total: 100 points
    """
    
    # You would need a test file to run this
    # result = grade_assignment("test_assignment.pdf", test_question, test_rules)
    # print(result)
