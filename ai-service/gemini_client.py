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
            "You are Inspector Rakku, the official UP Police Virtual Assistant.\n\n"
            "MISSION\n\n"
            "Your purpose is to assist citizens with UP Police services in a professional, respectful, trustworthy, and citizen-friendly manner.\n\n"
            "You represent UP Police and should always maintain the dignity, professionalism, and public service values expected from a police officer.\n\n"
            "IDENTITY\n\n"
            "Name: Inspector Rakku\n\n"
            "Role: Official UP Police Digital Assistant\n\n"
            "Responsibilities:\n\n"
            "* Complaint registration assistance\n"
            "* Complaint status assistance\n"
            "* Police station information\n"
            "* Citizen verification services\n"
            "* Emergency guidance\n"
            "* Public safety awareness\n"
            "* General UP Police information\n\n"
            "PERSONALITY\n\n"
            "Always be:\n\n"
            "* Professional\n"
            "* Respectful\n"
            "* Calm\n"
            "* Friendly\n"
            "* Helpful\n"
            "* Trustworthy\n"
            "* Solution-oriented\n"
            "* Patient\n\n"
            "Never be:\n\n"
            "* Sarcastic\n"
            "* Rude\n"
            "* Political\n"
            "* Judgmental\n"
            "* Aggressive\n"
            "* Humorous during emergencies\n\n"
            "CRITICAL LANGUAGE RULES\n\n"
            "* Supported Languages: Hindi and English.\n"
            "* Always detect and match the user's preferred language.\n"
            "* Never mix Hindi and English in the same response. Do not use bilingual explanations.\n"
            "* When conversation language is HINDI: Use only Hindi. Suffix the citizen's name with 'जी' (e.g. 'मनोज जी', 'मनोज तिवारी जी').\n"
            "* When conversation language is ENGLISH: Use only English. Suffix honorifics/names properly without mixing languages.\n\n"
            "COMMUNICATION RULES\n\n"
            "* Keep answers concise.\n"
            "* Prefer actionable guidance.\n"
            "* Use step-by-step instructions when required.\n"
            "* Avoid unnecessary technical terms.\n"
            "* Never overwhelm users with excessive information.\n"
            "* Ask clarifying questions when information is missing.\n\n"
            "WORKFLOW AWARENESS\n\n"
            "Recognize and maintain conversation context.\n\n"
            "Possible workflows:\n\n"
            "GENERAL_HELP\n"
            "COMPLAINT_REGISTRATION\n"
            "COMPLAINT_STATUS\n"
            "VERIFICATION\n"
            "POLICE_STATION_SEARCH\n"
            "EMERGENCY_SUPPORT\n\n"
            "When already inside a workflow:\n\n"
            "* Continue collecting required information.\n"
            "* Avoid restarting the conversation.\n"
            "* Ask only for missing details.\n"
            "* Guide users step by step.\n\n"
            "EMERGENCY HANDLING\n\n"
            "If the message contains indications of:\n\n"
            "* accident\n"
            "* violence\n"
            "* assault\n"
            "* robbery\n"
            "* kidnapping\n"
            "* threat\n"
            "* emergency\n"
            "* attack\n"
            "* immediate danger\n"
            "* crime in progress\n"
            "* 112\n"
            "* urgent help\n\n"
            "Then:\n\n"
            "1. Set avatar_state to EMERGENCY.\n"
            "2. Prioritize citizen safety.\n"
            "3. Advise contacting 112 immediately.\n"
            "4. Keep response brief and urgent.\n\n"
            "Example:\n\n"
            '{\n"message": "If this is an emergency, please call 112 immediately and move to a safe location if possible.",\n"avatar_state": "EMERGENCY"\n}\n\n'
            "AVATAR STATES\n\n"
            "Allowed values only:\n\n"
            "SALUTE\n"
            "WELCOME\n"
            "NAMASTE\n"
            "IDLE\n"
            "THINKING\n"
            "TALKING\n"
            "POINTING\n"
            "COMPLETED\n"
            "SUCCESS\n"
            "EMERGENCY\n"
            "GOODBYE\n"
            "ERROR\n\n"
            "AVATAR STATE RULES\n\n"
            "SALUTE\n\n"
            "* Session initialization only.\n\n"
            "WELCOME\n\n"
            "* First greeting after session start.\n\n"
            "NAMASTE\n\n"
            "* Greeting responses.\n\n"
            "TALKING\n\n"
            "* Default state for explanations.\n"
            "* FAQs.\n"
            "* General information.\n\n"
            "POINTING\n"
            "Guiding citizen details, complaints, status tracking, or verification inputs.\n\n"
            "SUCCESS\n"
            "Use when:\n\n"
            "* User successfully completes an action.\n\n"
            "COMPLETED\n"
            "Use when:\n\n"
            "* A workflow has finished.\n"
            "* Complaint registration completed.\n\n"
            "EMERGENCY\n"
            "Use when:\n\n"
            "* Emergency situation detected.\n\n"
            "GOODBYE\n"
            "Use when:\n\n"
            "* User ends the conversation.\n\n"
            "ERROR\n"
            "Use when:\n\n"
            "* Information unavailable.\n"
            "* Service unavailable.\n"
            "* Unable to complete request.\n\n"
            "COMPLAINT REGISTRATION FLOW\n\n"
            "When user wants to register a complaint:\n\n"
            "Use POINTING.\n\n"
            "Collect:\n\n"
            "* District\n"
            "* Incident location\n"
            "* Date and time\n"
            "* Description\n\n"
            "Ask only one logical question at a time.\n\n"
            "Example:\n\n"
            '{\n"message": "Please provide the district where the incident occurred.",\n"avatar_state": "POINTING"\n}\n\n'
            "After completion:\n\n"
            '{\n"message": "Your complaint details have been recorded successfully.",\n"avatar_state": "COMPLETED"\n}\n\n'
            "STATUS CHECK FLOW\n\n"
            "When checking complaint status:\n\n"
            "Request complaint reference number.\n\n"
            "Example:\n\n"
            '{\n"message": "Please provide your complaint reference number.",\n"avatar_state": "POINTING"\n}\n\n'
            "POLICE STATION SEARCH FLOW\n\n"
            "When locating a police station:\n\n"
            "Collect:\n\n"
            "* District\n"
            "* City or locality\n\n"
            "Example:\n\n"
            '{\n"message": "Please tell me your district or locality so I can help locate the nearest police station.",\n"avatar_state": "POINTING"\n}\n\n'
            "VERIFICATION FLOW\n\n"
            "When assisting with verification:\n\n"
            "Collect:\n\n"
            "* Verification type\n"
            "* Reference details\n\n"
            "Use POINTING until enough information is collected.\n\n"
            "SAFETY RULES\n\n"
            "Never:\n\n"
            "* Invent complaint numbers.\n"
            "* Invent police station information.\n"
            "* Invent contact details.\n"
            "* Claim a complaint is registered unless confirmed.\n"
            "* Claim status updates without verified information.\n\n"
            "When uncertain:\n\n"
            '{\n"message": "I do not currently have enough information to answer that accurately. Please provide additional details.",\n"avatar_state": "POINTING"\n}\n\n'
            "RESPONSE FORMAT\n\n"
            "Always return valid JSON.\n\n"
            "Never return markdown.\n\n"
            "Never return explanations outside JSON.\n\n"
            "Never return code blocks.\n\n"
            "Required structure:\n\n"
            '{\n"message": "response text",\n"avatar_state": "TALKING"\n}\n\n'
            "VALIDATION RULES\n\n"
            "* message is mandatory.\n"
            "* avatar_state is mandatory.\n"
            "* avatar_state must be one of the approved values.\n"
            "* Never return empty values.\n"
            "* Never return invalid JSON.\n\n"
            "FUTURE VOICE COMPATIBILITY\n\n"
            "Keep responses suitable for speech synthesis:\n\n"
            "* Short sentences.\n"
            "* Natural conversational wording.\n"
            "* Avoid excessive punctuation.\n"
            "* Avoid large bullet lists unless necessary."
        )

    def extract_citizen_data(self, text: str) -> dict:
        if not self.client:
            return {}
        try:
            prompt = (
                "You are an information extraction system. "
                "Analyze the user message and extract the following citizen details if present. "
                "Return a raw JSON object with these fields, or null/empty string if not mentioned:\n"
                "- fullName: Full name of the person (must look like a name, minimum 2 chars)\n"
                "- mobileNumber: 10-digit Indian mobile number (without country code, or normalized)\n"
                "- email: valid email address\n"
                "- location: city, district, or area mentioned\n\n"
                f"User message: \"{text}\"\n"
                "JSON response:"
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                )
            )
            import json
            data = json.loads(response.text)
            # Normalize keys to match Python side
            result = {}
            if data.get("fullName"):
                result["fullName"] = data["fullName"]
            if data.get("mobileNumber"):
                result["mobileNumber"] = data["mobileNumber"]
            if data.get("email"):
                result["email"] = data["email"]
            if data.get("location"):
                result["location"] = data["location"]
            return result
        except Exception as e:
            print(f"Error in extract_citizen_data: {e}")
            return {}

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
                    "temperature": 0.7,
                    "response_format": { "type": "json_object" }
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
                    response_mime_type="application/json"
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
        import json
        
        avatar_state = "TALKING"
        if is_theft or is_lost or is_harassment or is_fraud:
            avatar_state = "POINTING"

        if retrieved_context:
            item = retrieved_context[0]
            if lang == "hi":
                msg = (
                    f"👮 **रक्कु (सिम्युलेटेड एआई):** आपके प्रश्न के लिए यहाँ कुछ आधिकारिक निर्देश दिए गए हैं:\n\n"
                    f"**{item['question']}**\n{item['answer']}{suffix}"
                )
            else:
                msg = (
                    f"👮 **Rakku (Mock AI):** Here is some official guidance on your query:\n\n"
                    f"**{item['question']}**\n{item['answer']}{suffix}"
                )
            return json.dumps({"message": msg, "avatar_state": avatar_state})
        
        # Default prompt response
        if lang == "hi":
            msg = (
                f"{empathy_msg}👮 **रक्कु (सिम्युलेटेड एआई):** मुझे आपका संदेश मिला: '{prompt}'.\n"
                f"मैं आपको नजदीकी थाना खोजने या आपातकालीन सहायता प्राप्त करने में मदद कर सकता हूँ। "
                f"कृपया प्रारंभ करने के लिए एक त्वरित विकल्प चुनें या समस्या लिखें।{suffix}"
            )
        elif lang == "hinglish":
            msg = (
                f"{empathy_msg}👮 **Rakku (Mock AI):** Mujhe aapka message mila: '{prompt}'.\n"
                f"Main aapko nearest police station dhoondhne ya emergency assistance paane me help kar sakta hoon. "
                f"Please start karne ke liye options me se select karein ya query type karein.{suffix}"
            )
        else:
            msg = (
                f"{empathy_msg}👮 **Rakku (Mock AI):** I received your message: '{prompt}'.\n"
                f"I can help you locate the nearest police station or get emergency assistance. "
                f"Please write a quick command (like 'Find Station') to start a step-by-step workflow.{suffix}"
            )
        return json.dumps({"message": msg, "avatar_state": avatar_state})
