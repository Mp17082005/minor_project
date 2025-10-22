import requests

API_URL = "http://127.0.0.1:8000"

def upload_file(file_path):
    with open(file_path, "rb") as f:
        files = {"file": (file_path, f)}
        response = requests.post(f"{API_URL}/upload/", files=files)
    print(response.json())

def ask_query(query, mode="notes"):
    params = {"query": query, "mode": mode}
    response = requests.get(f"{API_URL}/chat/", params=params)
    print(response.json())

if __name__ == "__main__":
    file_path = input("Enter path of PDF/DOCX/PPT file: ").strip()
    upload_file(file_path)

    while True:
        q = input("Ask a question (or 'exit'): ")
        if q.lower() == "exit":
            break
        mode = input("Choose mode ('notes' or 'web'): ").strip()
        ask_query(q, mode)
