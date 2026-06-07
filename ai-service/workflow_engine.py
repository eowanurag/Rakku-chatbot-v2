import random
import re
from datetime import datetime

def validate_name(name: str) -> bool:
    if not name or len(name.strip()) < 2:
        return False
    if not bool(re.match(r"^[a-zA-Z\s'-]+$", name.strip())):
        return False
    parts = name.strip().split()
    return len(parts) >= 2 and all(len(p) >= 1 for p in parts)

def normalize_mobile(mobile: str) -> str | None:
    if not mobile:
        return None
    clean = re.sub(r"\s+", "", mobile)
    clean = re.sub(r"[-()]", "", clean)
    if clean.startswith("+91") and len(clean) == 13:
        clean = clean[3:]
    elif clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]
    elif clean.startswith("0") and len(clean) == 11:
        clean = clean[1:]
    if re.match(r"^\d{10}$", clean):
        return clean
    return None

def validate_mobile(mobile: str) -> bool:
    norm = normalize_mobile(mobile)
    if not norm:
        return False
    return bool(re.match(r"^[6-9]\d{9}$", norm))

def validate_date(date_str: str, reject_future=True) -> bool:
    if not date_str:
        return False
    trimmed = date_str.strip()
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", trimmed)
    if not match:
        return False
    day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
    if month < 1 or month > 12:
        return False
    if day < 1 or day > 31:
        return False
    if month in [4, 6, 9, 11] and day > 30:
        return False
    if month == 2:
        is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
        if day > (29 if is_leap else 28):
            return False
    if reject_future:
        try:
            parsed = datetime(year, month, day)
            if parsed > datetime.now():
                return False
        except:
            return False
    else:
        try:
            datetime(year, month, day)
        except:
            return False
    return True

def validate_consistency(city: str, text: str) -> bool:
    if not city or not text:
        return True
    city_lower = city.lower().strip()
    text_lower = text.lower()
    major_cities = ["lucknow", "kanpur", "noida", "ghaziabad", "varanasi", "prayagraj", "agra", "delhi", "mumbai"]
    for other in major_cities:
        if other != city_lower and other in text_lower:
            return False
    return True


class WorkflowSession:
    def __init__(self):
        self.workflow = None  # 'complaint', 'verification', 'certificate', 'event', 'tracking'
        self.step = 0
        self.data = {}
        self.language = "en"  # "en", "hi", "hinglish"
        self.language_selected = False
        
        # Citizen Profile Fields
        self.citizenId = None
        self.fullName = ""
        self.mobileNumber = ""
        self.email = ""
        self.city = ""
        self.district = ""
        self.state_name = "Uttar Pradesh"
        self.latitude = None
        self.longitude = None
        self.isConfirmed = False

    def to_dict(self) -> dict:
        return {
            "workflow": self.workflow,
            "step": str(self.step),
            "data": self.data,
            "language": self.language,
            "languageSelected": self.language_selected,
            "citizen": {
                "id": self.citizenId,
                "fullName": self.fullName,
                "mobileNumber": self.mobileNumber,
                "email": self.email,
                "city": self.city,
                "district": self.district,
                "state": self.state_name,
                "latitude": self.latitude,
                "longitude": self.longitude,
                "isConfirmed": self.isConfirmed,
            }
        }

    def from_dict(self, d: dict):
        if not d:
            return
        self.workflow = d.get("workflow")
        step_val = d.get("step", 0)
        try:
            self.step = int(step_val) if str(step_val).isdigit() or step_val == 'REVIEW' else step_val
        except:
            self.step = step_val
        self.data = d.get("data", {})
        self.language = d.get("language", "en")
        self.language_selected = d.get("languageSelected", False)
        
        cit = d.get("citizen", {})
        self.citizenId = cit.get("id")
        self.fullName = cit.get("fullName", "")
        self.mobileNumber = cit.get("mobileNumber", "")
        self.email = cit.get("email", "")
        self.city = cit.get("city", "")
        self.district = cit.get("district", "")
        self.state_name = cit.get("state", "Uttar Pradesh")
        self.latitude = cit.get("latitude")
        self.longitude = cit.get("longitude")
        self.isConfirmed = cit.get("isConfirmed", False)


class WorkflowEngine:
    def __init__(self):
        self.sessions = {}
        
        # Define fields to collect for each workflow
        self.workflow_fields = {
            "complaint": [
                {"name": "complaint_type", "label": "Complaint Type / शिकायत का प्रकार", "suggestions": ["Lost Mobile / Theft", "Lost Document", "Simple Harassment", "Cyber Fraud / Financial Loss"]},
                {"name": "incident_location", "label": "Incident Location / घटना का स्थान", "suggestions": []},
                {"name": "incident_time", "label": "Incident Date (DD/MM/YYYY) / घटना का दिनांक", "suggestions": []},
                {"name": "incident_description", "label": "Incident Description / घटना का विवरण", "suggestions": []}
            ],
            "verification": [
                {"name": "verification_type", "label": "Verification Type / सत्यापन का प्रकार", "suggestions": ["Tenant Verification", "PG Verification", "Domestic Help Verification", "Employee Verification"]},
                {"name": "name", "label": "Candidate Full Name / उम्मीदवार का पूरा नाम", "suggestions": []},
                {"name": "address", "label": "Permanent Address / स्थायी पता", "suggestions": []},
                {"name": "mobile", "label": "Mobile Number / मोबाइल नंबर", "suggestions": []},
                {"name": "property_details", "label": "Property Details (flat number, block, city) / संपत्ति का विवरण", "suggestions": []}
            ],
            "certificate": [
                {"name": "name", "label": "Full Name / पूरा नाम", "suggestions": []},
                {"name": "address", "label": "Permanent Address / स्थायी पता", "suggestions": []},
                {"name": "district", "label": "District in Uttar Pradesh / उत्तर प्रदेश का ज़िला", "suggestions": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Prayagraj"]},
                {"name": "purpose", "label": "Purpose of the Certificate / प्रमाण पत्र का उद्देश्य", "suggestions": ["Job Application", "Passport", "Visa", "Higher Education", "Government Service"]}
            ],
            "event": [
                {"name": "event_type", "label": "Request Type / अनुरोध का प्रकार", "suggestions": ["Event Permission", "Procession Request", "Protest Request", "Film Shooting Request"]},
                {"name": "event_name", "label": "Event Name / कार्यक्रम का नाम", "suggestions": []},
                {"name": "location", "label": "Location or Route / स्थान या मार्ग", "suggestions": []},
                {"name": "date", "label": "Date (DD/MM/YYYY) / तिथि", "suggestions": []},
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

    def load_or_create_session(self, session_id: str, state_dict: dict | None) -> WorkflowSession:
        session = self.get_session(session_id)
        if state_dict:
            session.from_dict(state_dict)
        return session

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
        return ""

    def check_smart_helpline(self, message: str, lang: str) -> dict | None:
        clean = message.lower()
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
        return None

    def handle_profile_correction(self, session: WorkflowSession, message: str) -> bool:
        clean_msg = message.strip().lower()

        # Mobile correction
        phone_matches = re.findall(r"(?:mobile|number|phone|change mobile to|change number to)\s+(?:is\s+)?((?:\+91[\s-]?)?[6-9]\d{9}|\b[6-9]\d{9}\b)", message, re.IGNORECASE)
        if phone_matches:
            norm = normalize_mobile(phone_matches[0])
            if norm and validate_mobile(norm):
                session.mobileNumber = norm
                return True

        # Name correction
        name_matches = re.search(r"(?:name is|change name to|my name is)\s+([a-zA-Z\s'-]+)", message, re.IGNORECASE)
        if name_matches and name_matches.group(1):
            potential_name = name_matches.group(1).strip()
            if validate_name(potential_name):
                session.fullName = potential_name
                return True

        # Location correction
        loc_matches = re.search(r"(?:live in|change location to|change my location to)\s+([a-zA-Z\s'-]+)", message, re.IGNORECASE)
        if loc_matches and loc_matches.group(1):
            potential_loc = loc_matches.group(1).strip()
            if len(potential_loc) >= 3:
                session.city = potential_loc
                session.district = potential_loc
                return True

        return False

    def render_confirmation_card(self, session: WorkflowSession) -> dict:
        confirm_card = (
            f"👮 **Please review your details:**\n\n"
            f"* **Name:** {session.fullName}\n"
            f"* **Mobile Number:** {session.mobileNumber}\n"
            f"* **Location:** {session.city or session.district or 'Lucknow'}, {session.state_name}\n\n"
            f"Is everything correct?\n\n"
            f"- [Confirm Details](option:Confirm Details)\n"
            f"- [Modify Details](option:Modify Details)"
        )
        return {
            "intercepted": True,
            "response": confirm_card,
            "suggestions": ["Confirm Details", "Modify Details"]
        }

    def process_message(self, message: str, session_id: str, gemini_client=None) -> dict:
        session = self.get_session(session_id)
        clean_msg = message.strip().lower()

        # Emergency check
        if self.check_emergency(message):
            session.workflow = None
            session.step = 0
            session.data = {}
            lang = session.language
            return {
                "intercepted": True,
                "response": "⚠️ **EMERGENCY NOTICE:** This appears to be an emergency. Please contact UP Police emergency services immediately by dialing **112**.",
                "suggestions": ["File Complaint", "Track Status"]
            }

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
                return {
                    "intercepted": True,
                    "response": "Hello and welcome.\n\nHow can I assist you today?",
                    "suggestions": ["File Complaint", "Tenant Verification", "Character Certificate", "Event Permission", "Track Application"]
                }
            
            starts_workflow = self.detect_workflow_intent(clean_msg)
            if starts_workflow:
                session.language = self.detect_language(clean_msg)
                session.language_selected = True
            else:
                welcome_msg = (
                    "👮 Welcome to Rakku\n\n"
                    "I'm your Digital Police Assistant.\n\n"
                    "Please choose your preferred language:\n\n"
                    "• [English](option:English)\n"
                    "• [हिंदी](option:हिंदी)\n"
                    "• [Hinglish](option:Hinglish)"
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
            return {
                "intercepted": True,
                "response": "Current operation cancelled. How else can I help you?",
                "suggestions": ["File Complaint", "Tenant Verification", "Character Certificate", "Event Permission", "Track Application"]
            }

        # Detect starting new workflow
        if not session.workflow:
            detected_wf = self.detect_workflow_intent(clean_msg)
            if detected_wf:
                session.workflow = detected_wf
                session.step = 0
                session.data = {}

        if not session.workflow:
            return {"intercepted": False}

        # Enforce Citizen Verification first (except for tracking)
        if not session.isConfirmed and session.workflow != "tracking":
            return self.run_citizen_verification_flow(message, session, gemini_client)

        # Pre-Submission Review screen step mapping
        if str(session.step) == "REVIEW":
            if clean_msg in ["yes", "submit", "confirm", "option:yes", "option:submit application", "option:confirm details"]:
                res = self._finalize_workflow(session)
                return res
            elif clean_msg in ["no", "modify", "option:no", "option:modify details"]:
                session.step = 0
                fields = self.workflow_fields[session.workflow]
                next_field = fields[0]
                session.step = 1
                return {
                    "intercepted": True,
                    "response": "Understood. Let's restart the form. Please select or enter the details again.\n\n" + self._format_question(session.workflow, next_field, session.language, 1),
                    "suggestions": next_field["suggestions"]
                }

        # Main active workflow logic
        fields = self.workflow_fields[session.workflow]
        
        # Auto-detect fields on start
        if session.step == 0:
            if session.workflow == "complaint":
                auto_type = None
                if any(w in clean_msg for w in ["phone", "mobile", "stolen", "theft", "chori", "फ़ोन", "मोबाइल", "फोन", "चोरी", "चोर"]):
                    auto_type = "Lost Mobile / Theft"
                elif any(w in clean_msg for w in ["document", "wallet", "passport", "aadhar", "card"]):
                    auto_type = "Lost Document"
                
                if auto_type:
                    session.data["complaint_type"] = auto_type
                    session.step = 1

        # Enforce step validations before moving forward
        if session.step > 0:
            prev_field_name = fields[session.step - 1]["name"]
            
            # Run field validation on message input
            is_valid = self.validate_workflow_field(session.workflow, prev_field_name, message, session)
            if not is_valid:
                # Validation failed! Return error and keep step unchanged
                error_msg = self.get_workflow_field_error_msg(session.workflow, prev_field_name, session.language)
                return {
                    "intercepted": True,
                    "response": error_msg,
                    "suggestions": fields[session.step - 1].get("suggestions", [])
                }
            
            # Save valid data
            session.data[prev_field_name] = message

        # Prompt next field or transition to Review Screen
        if session.step < len(fields):
            next_field = fields[session.step]
            session.step += 1
            response_txt = self._format_question(session.workflow, next_field, session.language, session.step)
            return {
                "intercepted": True,
                "response": response_txt,
                "suggestions": next_field["suggestions"]
            }
        else:
            # We collected all fields. Enforce Rejection Prevention Layer consistency and completeness checks!
            session.step = "REVIEW"
            return self.render_presubmission_review_screen(session)

    def detect_workflow_intent(self, clean_msg: str) -> str | None:
        if any(w in clean_msg for w in ["complaint", "stolen", "report", "shikayat", "शिकायत", "lost", "wallet"]):
            return "complaint"
        if any(w in clean_msg for w in ["tenant", "verification", "satyapan", "rent", "किरायेदार", "सत्यापन"]):
            return "verification"
        if any(w in clean_msg for w in ["character", "certificate", "charitra", "चरित्र", "प्रमाण"]):
            return "certificate"
        if any(w in clean_msg for w in ["event", "permission", "protest", "procession", "shooting", "आयोजन", "अनुमति"]):
            return "event"
        if any(w in clean_msg for w in ["track", "status", "check status", "pata karein", "स्थिति"]):
            return "tracking"
        return None

    def validate_workflow_field(self, workflow: str, field_name: str, value: str, session: WorkflowSession) -> bool:
        if workflow == "complaint":
            if field_name == "incident_time":
                return validate_date(value, reject_future=True)
            if field_name == "incident_description":
                # Check consistency between citizen city and report details
                return validate_consistency(session.city, value)
        elif workflow == "verification":
            if field_name == "name":
                return validate_name(value)
            if field_name == "mobile":
                return validate_mobile(value)
        elif workflow == "certificate":
            if field_name == "name":
                return validate_name(value)
            if field_name == "purpose":
                # Ensure it is a valid purpose
                return value.strip() in ["Job Application", "Passport", "Visa", "Higher Education", "Government Service"]
        elif workflow == "event":
            if field_name == "date":
                return validate_date(value, reject_future=False)
            if field_name == "expected_attendance":
                return value.strip().isdigit()
        return True

    def get_workflow_field_error_msg(self, workflow: str, field_name: str, lang: str) -> str:
        errors = {
            "complaint": {
                "incident_time": "⚠️ The date appears invalid or in the future.\n\nPlease provide a valid date in DD/MM/YYYY format:\nExample: 15/07/2026",
                "incident_description": "⚠️ I noticed a location contradiction in your details relative to your registered location. Please verify and confirm details again."
            },
            "verification": {
                "name": "⚠️ For official records, please enter the full name (at least a first name and a last name).\n\nExample:\nRahul Kumar",
                "mobile": "⚠️ The mobile number appears incomplete.\n\nPlease provide a valid 10-digit Indian mobile number.\n\nExample:\n9876543210"
            },
            "certificate": {
                "name": "⚠️ For official records, please enter the full name (at least a first name and a last name).\n\nExample:\nRahul Kumar",
                "purpose": "⚠️ Could you please select a valid purpose?\n\nExamples:\n• Job Application\n• Passport\n• Visa\n• Higher Education\n• Government Service"
            },
            "event": {
                "date": "⚠️ Please provide a valid date in DD/MM/YYYY format:\nExample: 15/08/2026",
                "expected_attendance": "⚠️ Please enter a valid number for expected attendance:\nExample: 500"
            }
        }
        return errors.get(workflow, {}).get(field_name, "⚠️ Invalid input. Please check and enter again:")

    def render_presubmission_review_screen(self, session: WorkflowSession) -> dict:
        review_data = ""
        checklist = ""
        
        if session.workflow == "complaint":
            review_data = (
                f"District: **{session.city or 'Lucknow'}**\n"
                f"Complaint Type: **{session.data.get('complaint_type')}**\n"
                f"Incident Location: **{session.data.get('incident_location')}**\n"
                f"Incident Date: **{session.data.get('incident_time')}**\n"
                f"Description: **{session.data.get('incident_description')}**"
            )
            checklist = (
                "✓ Name Valid\n"
                "✓ Mobile Number Valid\n"
                "✓ Location Valid\n"
                "✓ Complaint Details Complete\n"
                "✓ Ready for Submission"
            )
        elif session.workflow == "verification":
            review_data = (
                f"Verification Type: **{session.data.get('verification_type')}**\n"
                f"Candidate Name: **{session.data.get('name')}**\n"
                f"Candidate Mobile: **{session.data.get('mobile')}**\n"
                f"Candidate Address: **{session.data.get('address')}**\n"
                f"Property Details: **{session.data.get('property_details')}**"
            )
            checklist = (
                "✓ Candidate Name Valid\n"
                "✓ Candidate Mobile Valid\n"
                "✓ Property Address Valid\n"
                "✓ Verification Details Complete\n"
                "✓ Ready for Submission"
            )
        elif session.workflow == "certificate":
            review_data = (
                f"Applicant Name: **{session.data.get('name')}**\n"
                f"Applicant Address: **{session.data.get('address')}**\n"
                f"District: **{session.data.get('district')}**\n"
                f"Purpose: **{session.data.get('purpose')}**"
            )
            checklist = (
                "✓ Applicant Name Valid\n"
                "✓ District Valid\n"
                "✓ Purpose Valid\n"
                "✓ Character Certificate Details Complete\n"
                "✓ Ready for Submission"
            )
        elif session.workflow == "event":
            review_data = (
                f"Request Type: **{session.data.get('event_type')}**\n"
                f"Event Name: **{session.data.get('event_name')}**\n"
                f"Location: **{session.data.get('location')}**\n"
                f"Date: **{session.data.get('date')}**\n"
                f"Attendance: **{session.data.get('expected_attendance')}**"
            )
            checklist = (
                "✓ Event Name Valid\n"
                "✓ Date Valid\n"
                "✓ Expected Attendance Valid\n"
                "✓ Event Permission Details Complete\n"
                "✓ Ready for Submission"
            )

        review_screen = (
            f"👮 **Please review your application.**\n\n"
            f"Name: **{session.fullName}**\n"
            f"Mobile: **{session.mobileNumber}**\n"
            f"{review_data}\n\n"
            f"**Validation Status**\n\n"
            f"{checklist}\n\n"
            f"Would you like to submit this application?\n\n"
            f"- [Submit Application](option:Submit Application)\n"
            f"- [Modify Details](option:Modify Details)"
        )
        return {
            "intercepted": True,
            "response": review_screen,
            "suggestions": ["Submit Application", "Modify Details"]
        }

    def run_citizen_verification_flow(self, message: str, session: WorkflowSession, gemini_client=None) -> dict:
        clean_msg = message.strip().lower()

        if gemini_client:
            extracted = gemini_client.extract_citizen_data(message)
            if extracted.get("fullName") and not session.fullName:
                session.fullName = extracted["fullName"]
            if extracted.get("mobileNumber") and not session.mobileNumber:
                session.mobileNumber = extracted["mobileNumber"]
            if extracted.get("email") and not session.email:
                session.email = extracted["email"]
            if extracted.get("location") and not session.city:
                session.city = extracted["location"]
                session.district = extracted["location"]

        phone_matches = re.findall(r"(?:\+91[\s-]?)?[6-9]\d{9}|\b[6-9]\d{9}\b", message)
        if phone_matches and not session.mobileNumber:
            norm = normalize_mobile(phone_matches[0])
            if norm and validate_mobile(norm):
                session.mobileNumber = norm

        # Check corrections
        is_corr = self.handle_profile_correction(session, message)
        if is_corr:
            session.step = "CONFIRM_PROFILE"
            return self.render_confirmation_card(session)

        # State Machine steps
        step_str = str(session.step)
        if step_str == "IDENTIFY_NAME":
            if validate_name(message):
                session.fullName = message.strip()
            else:
                return {
                    "intercepted": True,
                    "response": "👮 For official records, please enter your full name.\n\nExample:\nRahul Kumar\nRahul Verma",
                    "suggestions": []
                }
        elif step_str == "IDENTIFY_MOBILE":
            if validate_mobile(message):
                session.mobileNumber = normalize_mobile(message)
            else:
                return {
                    "intercepted": True,
                    "response": "👮 The mobile number appears incomplete.\n\nPlease provide a valid 10-digit Indian mobile number.\n\nExample:\n9876543210",
                    "suggestions": []
                }
        elif step_str == "IDENTIFY_LOCATION":
            if len(message.strip()) >= 3:
                session.city = message.strip()
                session.district = message.strip()
            else:
                return {
                    "intercepted": True,
                    "response": "👮 I couldn't understand that location. Please tell me your city, district, or area:",
                    "suggestions": []
                }
        elif step_str == "CONFIRM_PROFILE":
            if clean_msg in ["yes", "correct", "confirm details", "option:yes", "option:confirm details"]:
                session.isConfirmed = True
                
                db_action = {
                    "type": "citizen",
                    "data": {
                        "fullName": session.fullName,
                        "mobileNumber": session.mobileNumber,
                        "email": session.email or None,
                        "city": session.city or None,
                        "district": session.district or None,
                        "state": session.state_name,
                        "latitude": session.latitude,
                        "longitude": session.longitude,
                        "isConfirmed": True
                    }
                }

                success_txt = (
                    f"✓ Profile verified.\n\n"
                    f"Thank you, {session.fullName}.\n"
                    f"Let's continue with your request."
                )

                # Initialize main active workflow step
                session.step = 0
                fields = self.workflow_fields[session.workflow]
                next_field = fields[0]
                session.step = 1
                q_text = self._format_question(session.workflow, next_field, session.language, 1)

                return {
                    "intercepted": True,
                    "response": success_txt + "\n\n" + q_text,
                    "suggestions": next_field["suggestions"],
                    "db_action": db_action
                }

        # Check for missing inputs
        if not session.fullName:
            session.step = "IDENTIFY_NAME"
            return {
                "intercepted": True,
                "response": "Before we begin, may I know your full name?",
                "suggestions": []
            }

        if not session.mobileNumber:
            session.step = "IDENTIFY_MOBILE"
            return {
                "intercepted": True,
                "response": f"Thank you, {session.fullName}.\n\nCould you please share your mobile number?",
                "suggestions": []
            }

        if not session.city and not session.district:
            if session.latitude and session.longitude:
                session.city = "Lucknow"
                session.district = "Lucknow"
            else:
                session.step = "IDENTIFY_LOCATION"
                return {
                    "intercepted": True,
                    "response": "I couldn't determine your location automatically.\n\nCould you please tell me your city, district, or area?",
                    "suggestions": []
                }

        session.step = "CONFIRM_PROFILE"
        return self.render_confirmation_card(session)

    def _format_question(self, workflow: str, field: dict, language: str, step: int) -> str:
        transitions = {
            "en": ["Let's start with your details.", "Thank you. ", "Got it. ", "Perfect. ", "Thank you. "],
            "hi": ["आइए आपकी जानकारी से शुरू करते हैं।", "धन्यवाद। ", "ठीक है। ", "बहुत बढ़िया। ", "धन्यवाद। "],
            "hinglish": ["Aapki details se shuru karte hain.", "Thank you. ", "Got it. ", "Perfect. ", "Thank you. "]
        }
        prefix_phrase = ""
        if step > 1:
            idx = min(step - 1, len(transitions[language]) - 1)
            prefix_phrase = transitions[language][idx]

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
                    "en": "Could you tell me when did the incident occur (date in DD/MM/YYYY)?",
                    "hi": "क्या आप बता सकते हैं कि घटना कब (दिनांक DD/MM/YYYY) हुई थी?",
                    "hinglish": "Kya aap bata sakte hain ki incident kab (date DD/MM/YYYY) hua?"
                },
                "incident_description": {
                    "en": "Could you briefly describe what happened?",
                    "hi": "क्या आप संक्षेप में बता सकते हैं कि क्या हुआ था?",
                    "hinglish": "Kya aap short mein describe kar sakte hain ki kya हुआ था?"
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
                    "en": "What is the purpose of this certificate?\n\n- [Job Application](option:Job Application)\n- [Passport](option:Passport)\n- [Visa](option:Visa)\n- [Higher Education](option:Higher Education)\n- [Government Service](option:Government Service)",
                    "hi": "इस प्रमाण पत्र का उद्देश्य क्या है?\n\n- [Job Application](option:Job Application)\n- [Passport](option:Passport)\n- [Visa](option:Visa)",
                    "hinglish": "Is certificate ka purpose kya hai?\n\n- [Job Application](option:Job Application)\n- [Passport](option:Passport)\n- [Visa](option:Visa)"
                }
            },
            "event": {
                "event_type": {
                    "en": "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)",
                    "hi": "कृपया **अनुरोध का प्रकार** चुनें:\n\n- [कार्यक्रम अनुमति](option:Event Permission)\n- [जुलूस अनुमति](option:Procession Request)\n- [विरोध प्रदर्शन](option:Protest Request)\n- [फिल्म शूटिंग](option:Film Shooting Request)",
                    "hinglish": "Please select the **Request Type**:\n\n- [Event Permission](option:Event Permission)\n- [Procession Request](option:Procession Request)\n- [Protest Request](option:Protest Request)\n- [Film Shooting Request](option:Film Shooting Request)"
                },
                "event_name": {
                    "en": "What is the name of your event?\nExample: Independence Day Cultural Program",
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
                    "en": "Could you tell me what the expected attendance number is?\nExample: 500",
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

        f_name = field["name"]
        q_text = field_questions.get(workflow, {}).get(f_name, {}).get(language, field["label"])
        
        if field.get("suggestions") and not f_name.endswith("_type") and f_name != "purpose":
            options_text = "\n\nSelect option / विकल्प चुनें:\n"
            for sug in field["suggestions"]:
                options_text += f"- [{sug}](option:{sug})\n"
            q_text += options_text

        return f"{prefix_phrase}{q_text}"

    def _finalize_workflow(self, session: WorkflowSession) -> dict:
        workflow = session.workflow
        data = session.data
        lang = session.language
        citizen_id = session.citizenId or "default-citizen-id"
        
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
                    "refNum": ref_num,
                    "citizenId": citizen_id
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
                    "refNum": ref_num,
                    "citizenId": citizen_id
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
                    "refNum": ref_num,
                    "citizenId": citizen_id
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
                    "refNum": ref_num,
                    "citizenId": citizen_id
                }
            }
            resp = {
                "en": f"✅ Your request has been recorded successfully.\n\nReference Number:\n{ref_num}\n\nPlease save this number for future tracking.\n\nIs there anything else I can help you with today?",
                "hi": f"✅ आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।\n\nसंदर्भ संख्या:\n{ref_num}\n\nकृपया भविष्य में ट्रैकिंग के लिए इस नंबर को सुरक्षित रखें।\n\nक्या मैं आज आपकी किसी और चीज़ में सहायता कर सकता हूँ?",
                "hinglish": f"✅ Aapka request successfully record ho gaya hai.\n\nReference Number:\n{ref_num}\n\nPlease future tracking ke liye is number ko save kar lein.\n\nIs there anything else I can help you with today?"
            }
        elif workflow == "tracking":
            ref_num = data.get("reference_number", "").upper()
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
