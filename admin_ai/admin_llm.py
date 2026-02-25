import google.generativeai as genai

# Paste your AI Studio API key inside quotes
genai.configure(api_key="AIzaSyCwjyK7bBgPRfCeKUy9so_GpIVWBlQfc7E")

model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content(
    "Give 3 insights for admin dashboard about waste collection data."
)

print("\nADMIN AI INSIGHT:\n")
print(response.text)
