import os
from google import genai
from google.genai import types

class GeminiClient:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        
        # Auto-detect if GEMINI_API_KEY is actually an OpenAI key
        if self.api_key and (self.api_key.startswith("sk-") or "proj-" in self.api_key):
            self.openai_key = self.api_key
            self.api_key = None

        self.model_name = "gemini-2.5-flash"
        self.client = None
        
        if self.openai_key:
            print("OpenAI GPT client initialized successfully.")
        elif self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                print("Gemini client initialized successfully.")
            except Exception as e:
                print(f"Error initializing Gemini Client: {e}")
        else:
            print("Warning: Neither GEMINI_API_KEY nor OPENAI_API_KEY found. Running in mock AI mode.")

        self.system_instruction = (
            "You are Rakku, a Digital Police Assistant.\n"
            "Your role is to help citizens access police services and understand procedures.\n\n"
            "Always:\n"
            "- Greet users warmly\n"
            "- Be respectful and professional\n"
            "- Acknowledge concerns\n"
            "- Show appropriate empathy\n"
            "- Ask one question at a time\n"
            "- Use simple language\n"
            "- Encourage users after successful completion\n"
            "- Recommend appropriate services\n"
            "- Offer helplines when relevant\n"
            "- Offer police station lookup when useful\n\n"
            "Never:\n"
            "- Give legal advice\n"
            "- Predict outcomes\n"
            "- Investigate crimes\n"
            "- Access confidential records\n"
            "- Sound robotic\n"
            "- Use excessive government terminology\n\n"
            "If you cannot help directly or answer confidently:\n"
            "Instead of saying 'I don't know' or similar, use the exact phrase: 'I may not have enough information to answer that accurately.'\n"
            "Then, provide:\n"
            "- A relevant helpline (e.g. 112 for general/emergency, 1090 for women safety, 1930 for cyber fraud, 1098 for kids)\n"
            "- Suggest the nearest police station option\n"
            "- Suggest an appropriate next action (like filing a formal complaint or physical verification)\n\n"
            "You are a citizen assistance officer, not a law enforcement decision maker."
        )

    def generate_response(self, prompt: str, retrieved_context: list, chat_history: list = None, language: str = "en") -> str:
        # Construct RAG context string
        context_str = ""
        if retrieved_context:
            context_str = "\n\nRelevant Police Procedures / FAQ Information:\n" + "\n".join(
                [f"Category: {item['category']}\nQ: {item['question']}\nA: {item['answer']}" for item in retrieved_context]
            )

        full_prompt = f"{prompt}{context_str}"

        # If no client/key is available, run a mock response
        if not self.openai_key and not self.client:
            return self._mock_ai_response(prompt, retrieved_context, language=language)

        system_instruction = self.system_instruction
        if language == "hi":
            system_instruction += "\n\nCRITICAL: The user's preferred language is Hindi. You MUST respond in Hindi (हिंदी) and use Hindi script."
        elif language == "hinglish":
            system_instruction += "\n\nCRITICAL: The user's preferred language is Hinglish. You MUST respond in Hinglish (Hindi written in Roman script)."

        if self.openai_key:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                contents = [{"role": "system", "content": system_instruction}]
                if chat_history:
                    for h in chat_history:
                        role = "user" if h.get("role") == "user" else "assistant"
                        contents.append({"role": role, "content": h.get("message", "")})
                contents.append({"role": "user", "content": full_prompt})

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": contents,
                    "temperature": 0.7
                }
                res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=15)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
                else:
                    error_msg = f"OpenAI API Error {res.status_code}: {res.text}"
                    print(error_msg)
                    return self._mock_ai_response(prompt, retrieved_context, error_message=error_msg, language=language)
            except Exception as e:
                print(f"OpenAI connection error: {e}")
                return self._mock_ai_response(prompt, retrieved_context, error_message=str(e), language=language)

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

            system_instruction = self.system_instruction
            if language == "hi":
                system_instruction += "\n\nCRITICAL: The user's preferred language is Hindi. You MUST respond in Hindi (हिंदी) and use Hindi script."
            elif language == "hinglish":
                system_instruction += "\n\nCRITICAL: The user's preferred language is Hinglish. You MUST respond in Hinglish (Hindi written in Roman script)."

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )
            )
            return response.text
        except Exception as e:
            print(f"Gemini generation error: {e}")
            return self._mock_ai_response(prompt, retrieved_context, error_message=str(e), language=language)

    def _mock_ai_response(self, prompt: str, retrieved_context: list, error_message: str = None, language: str = None) -> str:
        # Determine language
        clean_prompt = prompt.lower()
        import re
        lang = language if language else "en"
        if re.search(r'[\u0900-\u097F]', clean_prompt) or any(w in clean_prompt for w in ["hindi", "हिन्दी", "हिंदी", "किये", "रहा", "चाहिए"]):
            lang = "hi"
        elif any(w in clean_prompt for w in ["karna hai", "karna", "chahiye", "hai", "chori", "gum"]):
            lang = "hinglish"

        # Check for empathy triggers
        empathy_msg = ""
        is_theft = any(w in clean_prompt for w in ['stolen', 'theft', 'steal', 'chori', 'चोरी', 'चोर'])
        is_lost = any(w in clean_prompt for w in ['lost', 'missing', 'gum', 'kho', 'खोया', 'खो', 'गुम'])
        is_harassment = any(w in clean_prompt for w in ['harass', 'harassment', 'teasing', 'threat', 'trolling', 'pareshan', 'dhamki', 'उत्पीड़न', 'परेशान', 'धमकी'])
        is_fraud = any(w in clean_prompt for w in ['fraud', 'scam', 'cheated', 'dhokha', 'cyber', 'धोखा', 'धोखाधड़ी', 'साइबर'])

        item_en, item_hi, item_hinglish = "property", "सामान", "property"
        if any(w in clean_prompt for w in ['phone', 'mobile', 'device', 'फ़ोन', 'मोबाइल', 'फोन']):
            item_en, item_hi, item_hinglish = "phone", "मोबाइल", "phone"
        elif any(w in clean_prompt for w in ['wallet', 'purse', 'money', 'cash', 'बटुआ', 'पर्स']):
            item_en, item_hi, item_hinglish = "wallet", "बटुआ / पर्स", "wallet"
        elif any(w in clean_prompt for w in ['document', 'passport', 'card', 'aadhar', 'pan', 'दस्तावेज़']):
            item_en, item_hi, item_hinglish = "document", "दस्तावेज़", "document"

        if is_theft:
            if lang == "hi":
                empathy_msg = f"मुझे यह सुनकर दुख हुआ कि आपका {item_hi} चोरी हो गया है। मैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n"
            elif lang == "hinglish":
                empathy_msg = f"I'm sorry to hear that aapka {item_hinglish} chori ho gaya hai. Main complaint process mein aapki madad karunga.\n\n"
            else:
                empathy_msg = f"I'm sorry to hear that your {item_en} was stolen. I'll help guide you through the complaint process.\n\n"
        elif is_lost:
            if lang == "hi":
                empathy_msg = "मुझे खेद है कि ऐसा हुआ। मैं आपको अगले कदम समझने में मदद करूँगा।\n\n"
            elif lang == "hinglish":
                empathy_msg = "I'm sorry that happened. Main aapko next steps samajhne mein madad karunga.\n\n"
            else:
                empathy_msg = "I'm sorry that happened. I'll help you understand the next steps.\n\n"
        elif is_harassment:
            if lang == "hi":
                empathy_msg = "मुझे यह सुनकर खेद है कि आप उत्पीड़न का सामना कर रहे हैं। आपकी सुरक्षा और मानसिक शांति अत्यंत महत्वपूर्ण हैं। मैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n"
            elif lang == "hinglish":
                empathy_msg = "I'm sorry to hear you're facing harassment. Aapki safety kafi important hai. Main complaint process mein aapki madad karunga.\n\n"
            else:
                empathy_msg = "I'm sorry to hear you're experiencing harassment. Your safety and peace of mind are important. I'll help guide you through the complaint process.\n\n"
        elif is_fraud:
            if lang == "hi":
                empathy_msg = "मुझे दुख है कि आपके साथ धोखाधड़ी हुई है। वित्तीय धोखाधड़ी बेहद तनावपूर्ण हो सकती है। मैं शिकायत प्रक्रिया में आपकी सहायता करूँगा।\n\n"
            elif lang == "hinglish":
                empathy_msg = "I'm sorry to hear that aapke sath fraud hua hai. Financial scams kafi stressful ho sakte hain. Main complaint process mein aapki madad karunga.\n\n"
            else:
                empathy_msg = "I'm sorry to hear that you have been defrauded. Financial scams can be extremely stressful. I'll help guide you through the complaint process.\n\n"

        # Suffix
        if error_message:
            suffix = f"\n\n*Note: Running in offline mock mode because Gemini API returned an error: {error_message}*"
        elif not self.api_key:
            suffix = f"\n\n*Note: Gemini API key is missing. Running in local mock mode.*"
        else:
            suffix = f"\n\n*Note: Running in local mock mode.*"

        # Return retrieved knowledge base details if available
        if retrieved_context:
            item = retrieved_context[0]
            if lang == "hi":
                return (
                    f"👮 **रक्कु (सिम्युलेटेड एआई):** आपके प्रश्न के लिए यहाँ कुछ आधिकारिक निर्देश दिए गए हैं:\n\n"
                    f"**{item['question']}**\n{item['answer']}{suffix}"
                )
            return (
                f"👮 **Rakku (Mock AI):** Here is some official guidance on your query:\n\n"
                f"**{item['question']}**\n{item['answer']}{suffix}"
            )
        
        # Default prompt response
        if lang == "hi":
            return (
                f"{empathy_msg}👮 **रक्कु (सिम्युलेटेड एआई):** मुझे आपका संदेश मिला: '{prompt}'.\n"
                f"मैं आपको शिकायत दर्ज करने, किरायेदार सत्यापन पूरा करने, चरित्र प्रमाण पत्र या अनुमति आवेदनों में मदद कर सकता हूँ। "
                f"कृपया प्रारंभ करने के लिए एक त्वरित विकल्प चुनें या समस्या लिखें।{suffix}"
            )
        elif lang == "hinglish":
            return (
                f"{empathy_msg}👮 **Rakku (Mock AI):** Mujhe aapka message mila: '{prompt}'.\n"
                f"Main aapko complaint file karne, tenant verification, character certificate ya permissions me help kar sakta hoon. "
                f"Please start karne ke liye options me se select karein ya query type karein.{suffix}"
            )
        else:
            return (
                f"{empathy_msg}👮 **Rakku (Mock AI):** I received your message: '{prompt}'.\n"
                f"I can help you file complaints, complete verifications, character certificates, or permissions. "
                f"Please write a quick command (like 'File Complaint') to start a step-by-step workflow.{suffix}"
            )
