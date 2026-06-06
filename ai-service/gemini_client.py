import os
from google import genai
from google.genai import types

class GeminiClient:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model_name = "gemini-2.5-flash"
        self.client = None
        
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                print("Gemini client initialized successfully.")
            except Exception as e:
                print(f"Error initializing Gemini Client: {e}")
        else:
            print("Warning: GEMINI_API_KEY environment variable not found. Running in mock AI mode.")

        self.system_instruction = (
            "You are Rakku, a Digital Police Assistant for Uttar Pradesh Police Citizen Services.\n"
            "Your tone is polite, helpful, and professional, like a disciplined police officer.\n\n"
            "Responsibilities:\n"
            "- Help citizens discover services and understand procedures.\n"
            "- Guide citizens through digital citizen services (Complaints, Verifications, Certificates, Permissions).\n"
            "- Ask only one follow-up question at a time when gathering details.\n"
            "- Explain government procedures clearly in simple words.\n"
            "- Support and respond in English, Hindi, or Hinglish, depending on the user's input.\n\n"
            "Strict Constraints:\n"
            "- NEVER give legal advice (e.g. interpreting sections of IPC, recommending lawyer actions).\n"
            "- NEVER investigate crimes or pretend to be active field officers.\n"
            "- NEVER predict police decisions or FIR outcomes.\n"
            "- NEVER claim to access official confidential police databases or criminal records.\n"
            "- Always specify that you are an AI-powered assistant and your responses are simulated for prototype testing.\n\n"
            "Emergency Notice:\n"
            "If the user mentions an ongoing crime, active threat to life, physical assault, fire, or danger:\n"
            "Respond immediately with: 'This appears to be an emergency. Please contact UP Police emergency services immediately by dialing 112.'"
        )

    def generate_response(self, prompt: str, retrieved_context: list, chat_history: list = None) -> str:
        # Construct RAG context string
        context_str = ""
        if retrieved_context:
            context_str = "\n\nRelevant Police Procedures / FAQ Information:\n" + "\n".join(
                [f"Category: {item['category']}\nQ: {item['question']}\nA: {item['answer']}" for item in retrieved_context]
            )

        full_prompt = f"{prompt}{context_str}"

        # If no client is available, run a mock response
        if not self.client:
            return self._mock_ai_response(prompt, retrieved_context)

        try:
            # Format chat history into Gemini Types Content
            contents = []
            if chat_history:
                for h in chat_history:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=h.get("message", ""))]
                        )
                    )
            
            # Append current query
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=full_prompt)]
                )
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    temperature=0.7,
                )
            )
            return response.text
        except Exception as e:
            print(f"Gemini generation error: {e}")
            return self._mock_ai_response(prompt, retrieved_context)

    def _mock_ai_response(self, prompt: str, retrieved_context: list) -> str:
        # Return retrieved knowledge base details if available
        if retrieved_context:
            item = retrieved_context[0]
            return (
                f"👮 **Rakku (Mock AI):** Here is some official guidance on your query:\n\n"
                f"**{item['question']}**\n{item['answer']}\n\n"
                f"*Note: Running in offline/mock mode because GEMINI_API_KEY is not configured.*"
            )
        
        return (
            f"👮 **Rakku (Mock AI):** I received your message: '{prompt}'.\n"
            f"I can help you file complaints, complete verifications, character certificates, or permissions. "
            f"Please write a quick command (like 'File Complaint') to start a step-by-step workflow.\n\n"
            f"*Note: Gemini API key is missing. Running in local mock mode.*"
        )
