
from tavily import TavilyClient
import re
import google.generativeai as genai
GEMINI_API_KEY = "AIzaSyC-0QS0QPPfsB4xzR-ZkTWgsZVScn1i8ws"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")
client = TavilyClient(api_key="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")

def search_and_extract(query: str, summarize: bool = True):
    # Step 1: Search
    search_results = client.search(query, search_depth="advanced", max_results=3)
    if not search_results or "results" not in search_results:
        return "No results found."

    # Take top result
    top_result = search_results["results"][0]
    url = top_result["url"]
    print(f"Top Result: {url}")

    # Step 2: Extract content
    extracted_content = client.extract([url])
    if not extracted_content or "results" not in extracted_content:
        return "Could not extract content."

    raw_text = extracted_content["results"][0]["raw_content"]

    # Step 3: Clean text (remove extra newlines, menus, etc.)
    cleaned_text = re.sub(r"\n{2,}", "\n", raw_text)  # collapse multiple newlines
    cleaned_text = re.sub(r"\[.*?\]", "", cleaned_text)  # remove wiki references like [1], [edit]

    if summarize:
        # quick summary: take first 5-6 sentences
        sentences = re.split(r"(?<=[.!?]) +", cleaned_text)
        summary = " ".join(sentences[:15])
        return summary.strip()
    else:
        # return first 2000 chars if no summarization
        return cleaned_text[:10000]

def ask_gemini(user_query, context_chunks):
    context = context_chunks
    print(context)
    prompt = f"""
generate a proper summary and explanation based on the context

Document:
{context}

Question: {user_query}

Answer:"""

    response = model.generate_content(prompt)
    return response.text


if __name__ == "__main__":
    query = "explain linked list"
    content = search_and_extract(query, summarize=True)
    ans=ask_gemini(query, content)
    print("\n--- Extracted & Cleaned ---\n")
    print(ans)
