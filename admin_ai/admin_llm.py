import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('VITE_GEMINI_API_KEY'))

model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content(
    "Give 3 insights for admin dashboard about waste collection data."
)

print("\nADMIN AI INSIGHT:\n")
print(response.text)
