import random
import re

class WorkflowSession:
    def __init__(self):
        self.workflow = None  # 'complaint', 'verification', 'certificate', 'event', 'tracking'
        self.step = 0
        self.data = {}
        self.language = "en"  # "en", "hi", "hinglish"
        self.language_selected = False

class WorkflowEngine:
    def __init__(self):
        self.sessions = {}
        
        # Define fields to collect for each workflow
        self.workflow_fields = {
            "complaint": [
                {"name": "complaint_type", "label": "Complaint Type / शिकायत का प्रकार", "suggestions": ["Lost Mobile / Theft", "Lost Document", "Simple Harassment", "Cyber Fraud / Financial Loss"]},
                {"name": "incident_location", "label": "Incident Location / घटना का स्थान", "suggestions": []},
                {"name": "incident_time", "label": "Incident Date & Time / घटना का दिनांक और समय", "suggestions": []},
                {"name": "incident_description", "label": "Incident Description / घटना का विवरण", "suggestions": []}
            ],
            "verification": [
                {"name": "verification_type", "label": "Verification Type / सत्यापन का प्रकार", "suggestions": ["Tenant Verification", "PG Verification", "Domestic Help Verification", "Employee Verification"]},
                {"name": "name", "label": "Full Name / पूरा नाम", "suggestions": []},
                {"name": "address", "label": "Permanent Address / स्थायी पता", "suggestions": []},
                {"name": "mobile", "label": "Mobile Number / मोबाइल नंबर", "suggestions": []},
                {"name": "property_details", "label": "Property Details (flat number, block, city) / संपत्ति का विवरण", "suggestions": []}
            ],
            "certificate": [
                {"name": "name", "label": "Full Name / पूरा नाम", "suggestions": []},
                {"name": "address", "label": "Permanent Address / स्थायी पता", "suggestions": []},
                {"name": "district", "label": "District in Uttar Pradesh / उत्तर प्रदेश का ज़िला", "suggestions": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Prayagraj"]},
                {"name": "purpose", "label": "Purpose of the Certificate / प्रमाण पत्र का उद्देश्य", "suggestions": []}
            ],
            "event": [
                {"name": "event_type", "label": "Request Type / अनुरोध का प्रकार", "suggestions": ["Event Permission", "Procession Request", "Protest Request", "Film Shooting Request"]},
                {"name": "event_name", "label": "Event Name / कार्यक्रम का नाम", "suggestions": []},
                {"name": "location", "label": "Location or Route / स्थान या मार्ग", "suggestions": []},
                {"name": "date", "label": "Date (DD/MM/YYYY) / तिथि (दिन/माह/वर्ष)", "suggestions": []},
                {"name": "expected_attendance", "label": "Expected Attendance / संभावित उपस्थिति संख्या", "suggestions": []}
            ],
            "tracking": [
                {"name": "reference_number", "label": "Application Reference Number / आवेदन संदर्भ संख्या (e.g. UP-CMP-2026-123456)", "suggestions": []}
            ]
        }

    def get_session(self, session_id: str) -> WorkflowSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = WorkflowSession()
        return self.sessions[session_id]

    def check_emergency(self, text: str) -> bool:
        clean_text = text.lower()
        emergency_words = [
            "danger", "assault", "threat", "life", "weapon", "murder", "burglar", "attack", "emergency", 
            "killing", "ongoing crime", "stolen vehicle", "fire", "accident", "मदद", "खतरा", "हमला", "आग",
            "ongoing attack", "kidnapping", "burglary in progress", "immediate danger", "violence",
            "suicide", "self-harm", "injured", "अपहरण", "हत्या", "हिंसा", "धमकी", "आत्महत्या", "दुर्घटना", "घायल"
        ]
        return any(word in clean_text for word in emergency_words)

    def detect_language(self, text: str) -> str:
        clean = text.lower()
        if re.search(r'[\u0900-\u097F]', clean) or any(w in clean for w in ["hindi", "हिन्दी", "हिंदी", "किये", "रहा"]):
            return "hi"
        elif any(w in clean for w in ["karna hai", "karna", "chahiye", "hai", "chori", "gum", "kho", "shikayat"]):
            return "hinglish"
        return "en"

    def get_empathy_message(self, message: str, lang: str) -> str:
        clean_msg = message.lower()
        
        is_theft = any(w in clean_msg for w in ['stolen', 'theft', 'steal', 'chori', 'चोरी', 'चोर'])
        is_lost = any(w in clean_msg for w in ['lost', 'missing', 'gum', 'kho', 'खोया', 'खो', 'गुम'])
        is_harassment = any(w in clean_msg for w in ['harass', 'harassment', 'teasing', 'threat', 'trolling', 'pareshan', 'dhamki', 'उत्पीड़न', 'परेशान', 'धमकी'])
        is_fraud = any(w in clean_msg for w in ['fraud', 'scam', 'cheated', 'dhokha', 'cyber', 'धोखा', 'धोखाधड़ी', 'साइबर'])
        is_distress = any(w in clean_msg for w in ['distress', 'trouble', 'scared', 'worried', 'stressed', 'afraid', 'upset', 'तनाव', 'परेशान'])

        item_en, item_hi, item_hinglish = "property", "सामान", "property"
        if any(w in clean_msg for w in ['phone', 'mobile', 'device', 'फ़ोन', 'मोबाइल', 'फोन']):
            item_en, item_hi, item_hinglish = "phone", "मोबाइल", "phone"
        elif any(w in clean_msg for w in ['wallet', 'purse', 'money', 'cash', 'बटुआ', 'पर्स']):
            item_en, item_hi, item_hinglish = "wallet", "बटुआ / पर्स", "wallet"
        elif any(w in clean_msg for w in ['document', 'passport', 'card', 'aadhar', 'pan', 'दस्तावेज़']):
            item_en, item_hi, item_hinglish = "document", "दस्तावेज़", "document"

        if is_theft:
            services_info = {
                "en": "\n\n*Recommended Services:*\n- [🚔 File Complaint](option:🚔 File a Complaint)\n- [📱 Lost Article Report](option:Lost Article Report)\n- [📍 Nearest Police Station](option:nearest police station)\n\n",
                "hi": "\n\n*अनुशंसित सेवाएं:*\n- [🚔 शिकायत दर्ज करें](option:🚔 File a Complaint)\n- [📱 खोई हुई वस्तु रिपोर्ट](option:Lost Article Report)\n- [📍 निकटतम पुलिस स्टेशन](option:nearest police station)\n\n",
                "hinglish": "\n\n*Recommended Services:*\n- [🚔 File Complaint](option:🚔 File a Complaint)\n- [📱 Lost Article Report](option:Lost Article Report)\n- [📍 Nearest Police Station](option:nearest police station)\n\n"
            }
            if lang == "en":
                return f"I'm sorry to hear that your {item_en} was stolen.{services_info['en']}I'll help guide you through the complaint process.\n\n"
            elif lang == "hi":
                return f"मुझे यह सुनकर दुख हुआ कि आपका {item_hi} चोरी हो गया है।{services_info['hi']}मैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n"
            else:
                return f"I'm sorry to hear that aapka {item_hinglish} chori ho gaya hai.{services_info['hinglish']}Main complaint process mein aapki madad karunga.\n\n"
        
        if is_lost:
            if lang == "en":
                return "I'm sorry that happened.\n\nI'll help you understand the next steps.\n\n"
            elif lang == "hi":
                return "मुझे खेद है कि ऐसा हुआ।\n\nमैं आपको अगले कदम समझने में मदद करूँगा।\n\n"
            else:
                return "I'm sorry that happened.\n\nMain aapko next steps samajhne mein madad karunga.\n\n"

        if is_harassment:
            if lang == "en":
                return "I'm sorry to hear you're experiencing harassment. Your safety and peace of mind are important.\n\nI'll help guide you through the complaint process.\n\n"
            elif lang == "hi":
                return "मुझे यह सुनकर खेद है कि आप उत्पीड़न का सामना कर रहे हैं। आपकी सुरक्षा और मानसिक शांति अत्यंत महत्वपूर्ण हैं।\n\nमैं शिकायत प्रक्रिया में आपका मार्गदर्शन करूँगा।\n\n"
            else:
                return "I'm sorry to hear you're facing harassment. Aapki safety kafi important hai.\n\nMain complaint process mein aapki madad karunga.\n\n"

        if is_fraud:
            if lang == "en":
                return "I'm sorry to hear that you have been defrauded. Financial scams can be extremely stressful.\n\nI'll help guide you through the complaint process.\n\n"
            elif lang == "hi":
                return "मुझे दुख है कि आपके साथ धोखाधड़ी हुई है। वित्तीय धोखाधड़ी बेहद तनावपूर्ण हो सकती है।\n\nमैं शिकायत प्रक्रिया में आपकी सहायता करूँगा।\n\n"
            else:
                return "I'm sorry to hear that aapke sath fraud hua hai. Financial scams kafi stressful ho sakte hain.\n\nMain complaint process mein aapki madad karunga.\n\n"

        if is_distress:
            if lang == "en":
                return "I understand this is a very difficult and stressful situation. Please remain calm, I am here to assist you.\n\n"
            elif lang == "hi":
                return "मैं समझ सकता हूँ कि यह एक कठिन और तनावपूर्ण स्थिति है। कृपया शांत रहें, मैं यहाँ आपकी सहायता के लिए हूँ।\n\n"
            else:
                return "Main samajh sakta hoon ki yeh kafi difficult aur stressful situation hai. Please tension na lein, main aapki madad ke liye yahan hoon.\n\n"

        return ""

    def check_smart_helpline(self, message: str, lang: str) -> dict | None:
        clean = message.lower()
        
        # Cyber Fraud
        if any(w in clean for w in ["scam", "scammed", "fraud", "cheated", "धोखा", "धोखाधड़ी", "साइबर", "fraud online", "online scam"]):
            response_msgs = {
                "en": "I'm sorry this happened.\n\nYou should immediately contact:\n\n📞 **Cyber Crime Helpline:** **1930**\n\nWould you also like guidance on filing a complaint?",
                "hi": "मुझे खेद है कि ऐसा हुआ।\n\nआपको तुरंत संपर्क करना चाहिए:\n\n📞 **साइबर अपराध हेल्पलाइन:** **1930**\n\nक्या आप शिकायत दर्ज करने के लिए मार्गदर्शन भी चाहते हैं?",
                "hinglish": "I'm sorry this happened.\n\nAapko immediately contact karna chahiye:\n\n📞 **Cyber Crime Helpline:** **1930**\n\nKya aap complaint file karne ke liye guidance chahte hain?"
            }
            return {
                "intercepted": True,
                "response": response_msgs[lang],
                "suggestions": ["File Complaint", "Nearest Police Station", "Emergency Contacts"]
            }
            
        # Women Safety
        if any(w in clean for w in ["threatening me", "husband is threatening", "domestic violence", "harassment at home", "उत्पीड़न", "घरेलू हिंसा", "धमकी", "threaten", "husband threatening"]):
            response_msgs = {
                "en": "I'm sorry you're experiencing this.\n\nFor immediate assistance:\n\n📞 **Women Power Line:** **1090**\n\n📞 **Emergency Services:** **112**\n\nWould you like help locating the nearest police station?",
                "hi": "मुझे खेद है कि आप इसका सामना कर रही हैं।\n\nतत्काल सहायता के लिए:\n\n📞 **महिला पावर लाइन:** **1090**\n\n📞 **आपातकालीन सेवाएं:** **112**\n\nक्या आप निकटतम पुलिस स्टेशन का पता लगाने में सहायता चाहते हैं?",
                "hinglish": "I'm sorry you're experiencing this.\n\nImmediate help ke liye:\n\n📞 **Women Power Line:** **1090**\n\n📞 **Emergency Services:** **112**\n\nKya aap nearest police station locate karne me help chahte hain?"
            }
            return {
                "intercepted": True,
                "response": response_msgs[lang],
                "suggestions": ["Nearest Police Station", "File Complaint", "Emergency Contacts"]
            }

        # Child Safety
        if any(w in clean for w in ["child is missing", "missing child", "kid kidnapped", "lost child", "खोया बच्चा", "बच्चा गायब"]):
            response_msgs = {
                "en": "⚠️ This requires immediate police attention.\n\nPlease contact:\n\n📞 **Emergency Services:** **112**\n\n📞 **Child Helpline:** **1098**\n\nWould you like me to help locate the nearest police station?",
                "hi": "⚠️ इसके लिए तत्काल पुलिस ध्यान देने की आवश्यकता है।\n\nकृपया संपर्क करें:\n\n📞 **आपातकालीन सेवाएं:** **112**\n\n📞 **चाइल्ड हेल्पलाइन:** **1098**\n\nक्या आप चाहते हैं कि मैं निकटतम पुलिस स्टेशन का पता लगाने में मदद करूँ?",
                "hinglish": "⚠️ Iske liye immediate police attention ki jarurat hai.\n\nPlease contact karein:\n\n📞 **Emergency Services:** **112**\n\n📞 **Child Helpline:** **1098**\n\nKya aap nearest police station locate karne me help chahte hain?"
            }
            return {
                "intercepted": True,
                "response": response_msgs[lang],
                "suggestions": ["Nearest Police Station", "File Complaint", "Emergency Contacts"]
            }

        # Medical Emergency
        if any(w in clean for w in ["injured", "bleeding", "accident", "hospital", "घायल", "दुर्घटना", "अस्पताल"]):
            response_msgs = {
                "en": "⚠️ Please contact:\n\n📞 **Ambulance:** **108**\n\n📞 **Emergency Services:** **112**",
                "hi": "⚠️ कृपया संपर्क करें:\n\n📞 **एम्बुलेंस:** **108**\n\n📞 **आपातकालीन सेवाएं:** **112**",
                "hinglish": "⚠️ Please contact karein:\n\n📞 **Ambulance:** **108**\n\n📞 **Emergency Services:** **112**"
            }
            return {
                "intercepted": True,
                "response": response_msgs[lang],
                "suggestions": ["Emergency Contacts", "Nearest Police Station"]
            }
            
        return None

    def process_message(self, message: str, session_id: str):
        session = self.get_session(session_id)
        clean_msg = message.strip().lower()

        # Check if language is selected yet
        if not getattr(session, "language_selected", False):
            matched_lang = False
            if "english" in clean_msg or "option:english" in clean_msg:
                session.language = "en"
                session.language_selected = True
                matched_lang = True
            elif any(w in clean_msg for w in ["हिंदी", "hindi", "हिन्दी"]) or "option:हिंदी" in clean_msg or "option:हिंदी (hindi)" in clean_msg:
                session.language = "hi"
                session.language_selected = True
                matched_lang = True
            elif "hinglish" in clean_msg or "option:hinglish" in clean_msg:
                session.language = "hinglish"
                session.language_selected = True
                matched_lang = True

            if matched_lang:
                selection_responses = {
                    "en": "Hello and welcome.\n\nHow can I assist you today?",
                    "hi": "नमस्ते।\n\nमैं आपकी सहायता के लिए उपलब्ध हूँ।\n\nआज मैं आपकी किस प्रकार सहायता कर सकता हूँ?",
                    "hinglish": "Namaste.\n\nMain aapki madad ke liye yahan hoon.\n\nAaj aapko kis cheez mein madad chahiye?"
                }
                return {
                    "intercepted": True,
                    "response": selection_responses[session.language],
                    "suggestions": ["File Complaint", "Tenant Verification", "Character Certificate", "Event Permission", "Track Application"]
                }
            
            # Check if it is a free-text message starting any workflow
            starts_workflow = any(w in clean_msg for w in ["complaint", "stolen", "report", "shikayat", "शिकायत", "lost", "wallet", "pocket", "chori", "चोरी", "गुम", "kho", "खोया", "खो", "fraud", "dhokha", "धोखा", "harass", "उत्पीड़न"]) or \
                              any(w in clean_msg for w in ["tenant", "verification", "satyapan", "rent", "किरायेदार", "सत्यापन"]) or \
                              any(w in clean_msg for w in ["character", "certificate", "charitra", "चरित्र", "प्रमाण"]) or \
                              any(w in clean_msg for w in ["event", "permission", "protest", "procession", "shooting", "आयोजन", "अनुमति"]) or \
                              any(w in clean_msg for w in ["track", "status", "check status", "pata karein", "स्थिति"])
            
            if starts_workflow:
                session.language = self.detect_language(clean_msg)
                session.language_selected = True
            else:
                # If not selected yet and message didn't start a workflow, show onboarding welcome message
                welcome_msg = (
                    "👮 Welcome to Rakku\n\n"
                    "I'm your Digital Police Assistant.\n\n"
                    "I can help you with:\n\n"
                    "🚔 [Filing a Complaint](option:🚔 File a Complaint)\n"
                    "🏠 [Tenant Verification](option:🏠 Tenant Verification)\n"
                    "📜 [Character Certificate](option:📜 Character Certificate)\n"
                    "🎭 [Event Permission](option:🎭 Event Permission)\n"
                    "🔍 [Application Tracking](option:🔍 Track Application)\n\n"
                    "Please choose your preferred language:\n\n"
                    "• [English](option:English)\n"
                    "• [हिंदी](option:हिंदी)\n"
                    "• [Hinglish](option:Hinglish)\n\n"
                    "You can also simply tell me what you need help with.\n\n"
                    "Examples:\n\n"
                    "\"My phone was stolen\"\n\n"
                    "\"मुझे चरित्र प्रमाण पत्र चाहिए\"\n\n"
                    "\"Tenant verification karna hai\""
                )
                return {
                    "intercepted": True,
                    "response": welcome_msg,
                    "suggestions": ["English", "हिंदी", "Hinglish"]
                }

        # Check for cancel command
        if clean_msg in ["cancel", "radd", "रद्द", "exit", "stop"]:
            session.workflow = None
            session.step = 0
            session.data = {}
            response = {
                "en": "Current operation cancelled. How else can I help you?",
                "hi": "वर्तमान अनुरोध रद्द कर दिया गया है। मैं आपकी और क्या सहायता कर सकता हूँ?",
                "hinglish": "Operation cancel kar diya gaya hai. Main aapki aur kya help kar sakta hoon?"
            }
            return {
                "intercepted": True,
                "response": response[session.language],
                "suggestions": ["File Complaint", "Tenant Verification", "Character Certificate", "Event Permission", "Track Application"]
            }

        # Check for smart helpline situations
        helpline_intercept = self.check_smart_helpline(message, session.language)
        if helpline_intercept:
            session.workflow = None
            session.step = 0
            session.data = {}
            return helpline_intercept

        # Check for active workflow
        if not session.workflow:
            # Detect starting new workflow
            if any(w in clean_msg for w in ["complaint", "stolen", "report", "shikayat", "शिकायत", "lost", "wallet"]):
                session.workflow = "complaint"
                session.step = 0
                session.data = {}
            elif any(w in clean_msg for w in ["tenant", "verification", "satyapan", "rent", "किरायेदार", "सत्यापन"]):
                session.workflow = "verification"
                session.step = 0
                session.data = {}
            elif any(w in clean_msg for w in ["character", "certificate", "charitra", "चरित्र", "प्रमाण"]):
                session.workflow = "certificate"
                session.step = 0
                session.data = {}
            elif any(w in clean_msg for w in ["event", "permission", "protest", "procession", "shooting", "आयोजन", "अनुमति"]):
                session.workflow = "event"
                session.step = 0
                session.data = {}
            elif any(w in clean_msg for w in ["track", "status", "check status", "pata karein", "स्थिति"]):
                session.workflow = "tracking"
                session.step = 0
                session.data = {}

        # If we have an active workflow, feed the message to the slot filling process
        if session.workflow:
            fields = self.workflow_fields[session.workflow]
            
            # If we are at step 0 (just started), check if we can auto-detect first fields and handle empathy
            empathy_prepend = ""
            if session.step == 0:
                empathy_prepend = self.get_empathy_message(message, session.language)
                
                # Dynamic recommendations for Tenant Verification
                if session.workflow == "verification":
                    rec_services = {
                        "en": "*Recommended Services:*\n- [🏠 Tenant Verification](option:🏠 Tenant Verification)\n- [🔍 Application Tracking](option:🔍 Track Application)\n\n",
                        "hi": "*अनुशंसित सेवाएं:*\n- [🏠 किरायेदार सत्यापन](option:🏠 Tenant Verification)\n- [🔍 आवेदन ट्रैकिंग](option:🔍 Track Application)\n\n",
                        "hinglish": "*Recommended Services:*\n- [🏠 Tenant Verification](option:🏠 Tenant Verification)\n- [🔍 Application Tracking](option:🔍 Track Application)\n\n"
                    }
                    empathy_prepend = rec_services[session.language] + empathy_prepend
                
                # Special auto-detection for complaint type
                if session.workflow == "complaint":
                    auto_type = None
                    if any(w in clean_msg for w in ["phone", "mobile", "stolen", "theft", "chori", "फ़ोन", "मोबाइल", "फोन", "चोरी", "चोर"]):
                        auto_type = "Lost Mobile / Theft"
                    elif any(w in clean_msg for w in ["document", "wallet", "passport", "aadhar", "card", "दस्तावेज़", "कागजात", "गुम", "खोया", "बटुआ", "पर्स"]):
                        auto_type = "Lost Document"
                    elif any(w in clean_msg for w in ["harass", "teasing", "threat", "उत्पीड़न", "परेशान", "धमकी", "pareshan", "dhamki"]):
                        auto_type = "Simple Harassment"
                    elif any(w in clean_msg for w in ["fraud", "scam", "cyber", "dhokha", "धोखा", "धोखाधड़ी", "पैसा", "पैसे"]):
                        auto_type = "Cyber Fraud / Financial Loss"
                    
                    if auto_type:
                        session.data["complaint_type"] = auto_type
                        session.step = 1  # Already got type, next we ask location (index 1)

            # If we are at step > 0, the current message is the answer to the previous step's field
            if session.step > 0:
                prev_field_name = fields[session.step - 1]["name"]
                session.data[prev_field_name] = message
                
                # Check for empathy when they respond to a question if not shown already
                if not session.data.get("empathy_shown"):
                    empathy_msg = self.get_empathy_message(message, session.language)
                    if empathy_msg:
                        empathy_prepend = empathy_msg
                        session.data["empathy_shown"] = True

            # Check if there is another field to collect
            if session.step < len(fields):
                next_field = fields[session.step]
                session.step += 1
                
                # Format request for the field
                response_txt = self._format_question(session.workflow, next_field, session.language, session.step)
                return {
                    "intercepted": True,
                    "response": empathy_prepend + response_txt,
                    "suggestions": next_field["suggestions"]
                }
            else:
                # All fields collected! Finish and return mock number
                res = self._finalize_workflow(session)
                res["response"] = empathy_prepend + res["response"]
                return res

        return {"intercepted": False}

    def _format_question(self, workflow: str, field: dict, language: str, step: int) -> str:
        # Context-aware transition words
        transitions = {
            "en": ["Let's start with your details.", "Thank you. ", "Got it. ", "Perfect. ", "Thank you. "],
            "hi": ["आइए आपकी जानकारी से शुरू करते हैं।", "धन्यवाद। ", "ठीक है। ", "बहुत बढ़िया। ", "धन्यवाद। "],
            "hinglish": ["Aapki details se shuru karte hain.", "Thank you. ", "Got it. ", "Perfect. ", "Thank you. "]
        }
        
        prefix_phrase = ""
        if step > 1:
            idx = min(step - 1, len(transitions[language]) - 1)
            prefix_phrase = transitions[language][idx]

        # Conversational formulations
        field_questions = {
            "complaint": {
                "complaint_type": {
                    "en": "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)",
                    "hi": "कृपया **शिकायत का प्रकार** चुनें:\n\n- [मोबाइल चोरी / गुम होना](option:Lost Mobile / Theft)\n- [खोया हुआ दस्तावेज़](option:Lost Document)\n- [सामान्य उत्पीड़न](option:Simple Harassment)\n- [साइबर धोखाधड़ी](option:Cyber Fraud / Financial Loss)",
                    "hinglish": "Please select the **Complaint Type**:\n\n- [Lost Mobile / Theft](option:Lost Mobile / Theft)\n- [Lost Document](option:Lost Document)\n- [Simple Harassment](option:Simple Harassment)\n- [Cyber Fraud / Financial Loss](option:Cyber Fraud / Financial Loss)"
                },
                "incident_location": {
                    "en": "Could you please tell me where the incident occurred?",
                    "hi": "क्या आप कृपया बता सकते हैं कि घटना कहाँ हुई थी?",
                    "hinglish": "Kya aap please bata sakte hain ki incident kahan hua tha?"
                },
                "incident_time": {
                    "en": "Could you tell me when did the incident occur (date and time)?",
                    "hi": "क्या आप बता सकते हैं कि घटना कब (दिनांक और समय) हुई थी?",
                    "hinglish": "Kya aap bata sakte hain ki incident kab (date aur time) hua?"
                },
                "incident_description": {
                    "en": "Could you briefly describe what happened?",
                    "hi": "क्या आप संक्षेप में बता सकते हैं कि क्या हुआ था?",
                    "hinglish": "Kya aap short mein describe kar sakte hain ki kya hua tha?"
                }
            },
            "verification": {
                "verification_type": {
                    "en": "Please select the **Verification Type**:\n\n- [Tenant Verification](option:Tenant Verification)\n- [PG Verification](option:PG Verification)\n- [Domestic Help Verification](option:Domestic Help Verification)\n- [Employee Verification](option:Employee Verification)",
                    "hi": "कृपया **सत्यापन का प्रकार** चुनें:\n\n- [किरायेदार सत्यापन](option:Tenant Verification)\n- [पीजी सत्यापन](option:PG Verification)\n- [घरेलू सहायक सत्यापन](option:Domestic Help Verification)\n- [कर्मचारी सत्यापन](option:Employee Verification)",
                    "hinglish": "Please select the **Verification Type**:\n\n- [Tenant Verification](option:Tenant Verification)\n- [PG Verification](option:PG Verification)\n- [Domestic Help Verification](option:Domestic Help Verification)\n- [Employee Verification](option:Employee Verification)"
                },
                "name": {
                    "en": "What is the full name of the candidate being verified?",
                    "hi": "सत्यापित किए जाने वाले व्यक्ति का पूरा नाम क्या है?",
                    "hinglish": "Satyapit hone wale candidate ka full name kya hai?"
                },
                "address": {
                    "en": "What is their permanent address?",
                    "hi": "उनका स्थायी पता क्या है?",
                    "hinglish": "Unka permanent address kya hai?"
                },
                "mobile": {
                    "en": "Could you please share their mobile number?",
                    "hi": "क्या आप कृपया उनका मोबाइल नंबर साझा कर सकते हैं?",
                    "hinglish": "Kya aap unka mobile number share karenge?"
                },
                "property_details": {
                    "en": "Could you provide the property details (flat number, block, city) where they will reside?",
                    "hi": "क्या आप संपत्ति का विवरण (जैसे फ्लैट नंबर, ब्लॉक और शहर) दे सकते हैं जहाँ वे रहेंगे?",
                    "hinglish": "Kya aap property details (flat number, block, city) batayenge jahan wo rahenge?"
                }
            },
            "certificate": {
                "name": {
                    "en": "What is your full name?",
                    "hi": "आपका पूरा नाम क्या है?",
                    "hinglish": "Aapka full name kya hai?"
                },
                "address": {
                    "en": "What is your permanent address?",
                    "hi": "आपका स्थायी पता क्या है?",
                    "hinglish": "Aapka permanent address kya hai?"
                },
                "district": {
                    "en": "Which district in Uttar Pradesh are you applying from?",
                    "hi": "आप उत्तर प्रदेश के किस ज़िले से आवेदन कर रहे हैं?",
                    "hinglish": "Aap Uttar Pradesh ke kis district se apply kar rahe hain?"
                },
                "purpose": {
                    "en": "What is the purpose of this certificate?",
                    "hi": "इस प्रमाण पत्र का उद्देश्य क्या है?",
                    "hinglish": "Is certificate ka purpose kya hai?"
                }
            },
            "event": {
                "event_type": {
                    "en": "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)",
                    "hi": "कृपया **अनुरोध का प्रकार** चुनें:\n\n- [कार्यक्रम अनुमति](option:Event Permission)\n- [जुलूस अनुमति](option:Procession Request)\n- [विरोध प्रदर्शन](option:Protest Request)\n- [फिल्म शूटिंग](option:Film Shooting Request)",
                    "hinglish": "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)"
                },
                "event_name": {
                    "en": "What is the name of your event?",
                    "hi": "आपके कार्यक्रम का नाम क्या है?",
                    "hinglish": "Aapke event ka naam kya hai?"
                },
                "location": {
                    "en": "Could you also tell me where the event will take place (location or route)?",
                    "hi": "क्या आप बता सकते हैं कि कार्यक्रम कहाँ (स्थान या मार्ग) आयोजित होगा?",
                    "hinglish": "Event kahan (location/route) hone wala hai?"
                },
                "date": {
                    "en": "On what date is the event scheduled (DD/MM/YYYY)?",
                    "hi": "कार्यक्रम किस तिथि (DD/MM/YYYY) को निर्धारित है?",
                    "hinglish": "Event किस date (DD/MM/YYYY) ko hone wala hai?"
                },
                "expected_attendance": {
                    "en": "Could you tell me what the expected attendance number is?",
                    "hi": "क्या आप बता सकते हैं कि कार्यक्रम में संभावित उपस्थिति संख्या कितनी है?",
                    "hinglish": "Event mein expected attendance kitni hai?"
                }
            },
            "tracking": {
                "reference_number": {
                    "en": "Please provide your Application Reference Number for tracking (e.g. UP-CMP-2026-123456):",
                    "hi": "कृपया ट्रैकिंग के लिए अपनी आवेदन संदर्भ संख्या प्रदान करें (उदा. UP-CMP-2026-123456):",
                    "hinglish": "Please track karne ke liye apna Application Reference Number batayein (jaise UP-CMP-2026-123456):"
                }
            }
        }

        # Lookup conversational question
        f_name = field["name"]
        q_text = field_questions.get(workflow, {}).get(f_name, {}).get(language, field["label"])
        
        # If suggestions exist, append clickable options list in markdown format (only if not type selector which has them inline)
        if field.get("suggestions") and not f_name.endswith("_type"):
            options_text = "\n\nSelect option / विकल्प चुनें:\n"
            for sug in field["suggestions"]:
                options_text += f"- [{sug}](option:{sug})\n"
            q_text += options_text

        return f"{prefix_phrase}{q_text}"

    def _finalize_workflow(self, session: WorkflowSession) -> dict:
        workflow = session.workflow
        data = session.data
        lang = session.language
        
        # Clear state
        session.workflow = None
        session.step = 0
        session.data = {}
        
        year = 2026
        random_id = random.randint(100000, 999999)
        db_action = None
        
        if workflow == "complaint":
            ref_num = f"UP-CMP-{year}-{random_id}"
            details = f"Location: {data.get('incident_location')} | Time: {data.get('incident_time')} | Desc: {data.get('incident_description')}"
            db_action = {
                "type": "complaint",
                "data": {
                    "type": data.get("complaint_type"),
                    "details": details,
                    "refNum": ref_num
                }
            }
            resp = {
                "en": f"✅ Your request has been recorded successfully.\n\nReference Number:\n{ref_num}\n\nPlease save this number for future tracking.\n\nIs there anything else I can help you with today?",
                "hi": f"✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।\n\nसंदर्भ संख्या:\n{ref_num}\n\nकृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।\n\nक्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?",
                "hinglish": f"✅ Aapka request successfully record ho gaya hai.\n\nReference Number:\n{ref_num}\n\nPlease future tracking ke liye is number ko save kar lein.\n\nIs there anything else I can help you with today?"
            }
        elif workflow == "verification":
            ref_num = f"UP-VER-{year}-{random_id}"
            db_action = {
                "type": "verification",
                "data": {
                    "type": data.get("verification_type"),
                    "name": data.get("name"),
                    "address": data.get("address"),
                    "mobile": data.get("mobile"),
                    "propertyDetails": data.get("property_details") or data.get("address"),
                    "refNum": ref_num
                }
            }
            resp = {
                "en": f"✅ Your request has been recorded successfully.\n\nReference Number:\n{ref_num}\n\nPlease save this number for future tracking.\n\nIs there anything else I can help you with today?",
                "hi": f"✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।\n\nसंदर्भ संख्या:\n{ref_num}\n\nकृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।\n\nक्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?",
                "hinglish": f"✅ Aapka request successfully record ho gaya hai.\n\nReference Number:\n{ref_num}\n\nPlease future tracking ke liye is number ko save kar lein.\n\nIs there anything else I can help you with today?"
            }
        elif workflow == "certificate":
            ref_num = f"UP-CER-{year}-{random_id}"
            db_action = {
                "type": "certificate",
                "data": {
                    "name": data.get("name"),
                    "address": data.get("address"),
                    "district": data.get("district"),
                    "purpose": data.get("purpose"),
                    "refNum": ref_num
                }
            }
            resp = {
                "en": f"✅ Your request has been recorded successfully.\n\nReference Number:\n{ref_num}\n\nPlease save this number for future tracking.\n\nIs there anything else I can help you with today?",
                "hi": f"✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।\n\nसंदर्भ संख्या:\n{ref_num}\n\nकृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।\n\nक्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?",
                "hinglish": f"✅ Aapka request successfully record ho gaya hai.\n\nReference Number:\n{ref_num}\n\nPlease future tracking ke liye is number ko save kar lein.\n\nIs there anything else I can help you with today?"
            }
        elif workflow == "event":
            ref_num = f"UP-EVP-{year}-{random_id}"
            db_action = {
                "type": "event",
                "data": {
                    "type": data.get("event_type"),
                    "name": data.get("event_name"),
                    "location": data.get("location"),
                    "date": data.get("date"),
                    "attendance": int(data.get("expected_attendance")) if str(data.get("expected_attendance")).isdigit() else 100,
                    "refNum": ref_num
                }
            }
            resp = {
                "en": f"✅ Your request has been recorded successfully.\n\nReference Number:\n{ref_num}\n\nPlease save this number for future tracking.\n\nIs there anything else I can help you with today?",
                "hi": f"✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।\n\nसंदर्भ संख्या:\n{ref_num}\n\nकृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।\n\nक्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?",
                "hinglish": f"✅ Aapka request successfully record ho gaya hai.\n\nReference Number:\n{ref_num}\n\nPlease future tracking ke liye is number ko save kar lein.\n\nIs there anything else I can help you with today?"
            }
        elif workflow == "tracking":
            ref_num = data.get("reference_number", "").upper()
            # Simulate status
            statuses = ["Submitted", "Under Review", "Pending Verification", "Approved", "Rejected"]
            status = statuses[hash(ref_num) % len(statuses)]
            resp = {
                "en": f"🔍 **Application Status for `{ref_num}`:**\n\n- **Status:** **{status}**\n- **Details:** Simulated status for Rakku prototype.",
                "hi": f"🔍 **आवेदन स्थिति `{ref_num}`:**\n\n- **स्थिति:** **{status}**",
                "hinglish": f"🔍 **Application status for `{ref_num}`:**\n\n- **Status:** **{status}**"
            }
 
        return {
            "intercepted": True,
            "response": resp[lang],
            "suggestions": ["Track Application", "New Request", "File Complaint"],
            "db_action": db_action
        }
