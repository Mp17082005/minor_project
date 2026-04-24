import json
import os
from datetime import datetime
from typing import List, Dict, Optional

# Simple JSON-based database for demo purposes
# In production, use PostgreSQL/MongoDB

DATA_DIR = "data"
ASSIGNMENTS_FILE = os.path.join(DATA_DIR, "assignments.json")
SUBMISSIONS_FILE = os.path.join(DATA_DIR, "submissions.json")
RESULTS_FILE = os.path.join(DATA_DIR, "results.json")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

def load_json(filepath: str) -> List[Dict]:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return []

def save_json(filepath: str, data: List[Dict]):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

# Assignment operations
def create_assignment(assignment_data: Dict) -> Dict:
    assignments = load_json(ASSIGNMENTS_FILE)
    assignment_data['id'] = str(len(assignments) + 1)
    assignment_data['created_at'] = datetime.now().isoformat()
    assignment_data['status'] = 'active'  # active, closed, graded
    assignments.append(assignment_data)
    save_json(ASSIGNMENTS_FILE, assignments)
    return assignment_data

def get_all_assignments() -> List[Dict]:
    return load_json(ASSIGNMENTS_FILE)

def get_assignment(assignment_id: str) -> Optional[Dict]:
    assignments = load_json(ASSIGNMENTS_FILE)
    for assignment in assignments:
        if assignment['id'] == assignment_id:
            return assignment
    return None

def update_assignment_status(assignment_id: str, status: str):
    assignments = load_json(ASSIGNMENTS_FILE)
    for assignment in assignments:
        if assignment['id'] == assignment_id:
            assignment['status'] = status
            break
    save_json(ASSIGNMENTS_FILE, assignments)

# Submission operations
def create_submission(submission_data: Dict) -> Dict:
    submissions = load_json(SUBMISSIONS_FILE)
    submission_data['id'] = str(len(submissions) + 1)
    submission_data['submitted_at'] = datetime.now().isoformat()
    submission_data['status'] = 'submitted'  # submitted, graded
    submissions.append(submission_data)
    save_json(SUBMISSIONS_FILE, submissions)
    return submission_data

def get_submissions_by_assignment(assignment_id: str) -> List[Dict]:
    submissions = load_json(SUBMISSIONS_FILE)
    return [s for s in submissions if s['assignment_id'] == assignment_id]

def get_submissions_by_student(student_email: str) -> List[Dict]:
    submissions = load_json(SUBMISSIONS_FILE)
    return [s for s in submissions if s['student_email'] == student_email]

def check_student_submitted(assignment_id: str, student_email: str) -> bool:
    submissions = load_json(SUBMISSIONS_FILE)
    for submission in submissions:
        if submission['assignment_id'] == assignment_id and submission['student_email'] == student_email:
            return True
    return False

# Result operations
def save_result(result_data: Dict) -> Dict:
    results = load_json(RESULTS_FILE)
    result_data['id'] = str(len(results) + 1)
    result_data['graded_at'] = datetime.now().isoformat()
    results.append(result_data)
    save_json(RESULTS_FILE, results)
    
    # Update submission status
    submissions = load_json(SUBMISSIONS_FILE)
    for submission in submissions:
        if submission['id'] == result_data['submission_id']:
            submission['status'] = 'graded'
            break
    save_json(SUBMISSIONS_FILE, submissions)
    
    return result_data

def get_result_by_submission(submission_id: str) -> Optional[Dict]:
    results = load_json(RESULTS_FILE)
    for result in results:
        if result['submission_id'] == submission_id:
            return result
    return None

def get_results_by_student(student_email: str) -> List[Dict]:
    results = load_json(RESULTS_FILE)
    return [r for r in results if r['student_email'] == student_email]
