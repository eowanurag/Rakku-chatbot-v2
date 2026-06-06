import random
import re

class WorkflowSession:
    def __init__(self):
        self.workflow = None  # 'complaint', 'verification', 'certificate', 'event', 'tracking'
        self.step = 0
        self.data = {}
        self.language = "en"  # "en", "hi", "hinglish"

class WorkflowEngine:
    def __init__(self):
        self.sessions = {}
        
        # Define fields to collect for each workflow
        self.workflow_fields = {
            "complaint": [
                {"name": "complaint_type", "label": "Complaint Type (e.g. Lost Mobile, Lost Document, Cyber Fraud)", "suggestions": ["Lost Mobile / Theft", "Lost Document", "Cyber Fraud"]},
                {"name": "incident_details", "label": "Incident Details (date, time, location, description)", "suggestions": []}
            ],
            "verification": [
                {"name": "verification_type", "label": "Verification Type (Tenant, PG, Domestic Help, Employee)", "suggestions": ["Tenant Verification", "PG Verification", "Domestic Help Verification", "Employee Verification"]},
                {"name": "name", "label": "Full Name of the candidate being verified", "suggestions": []},
                {"name": "address", "label": "Address of the rented property / Landlord address", "suggestions": []},
                {"name": "mobile", "label": "Mobile number of the candidate", "suggestions": []},
                {"name": "property_details", "label": "Property Details (flat number, block, city)", "suggestions": []}
            ],
            "certificate": [
                {"name": "name", "label": "Full Name of the applicant", "suggestions": []},
                {"name": "address", "label": "Permanent Address", "suggestions": []},
                {"name": "district", "label": "District in Uttar Pradesh", "suggestions": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi"]},
                {"name": "purpose", "label": "Purpose of the Character Certificate (e.g. job, visa)", "suggestions": []}
            ],
            "event": [
                {"name": "event_type", "label": "Request Type (Event Permission, Procession Request, Protest Request, Film Shooting Request)", "suggestions": ["Event Permission", "Procession Request", "Protest Request", "Film Shooting Request"]},
                {"name": "event_name", "label": "Name of the Event / Procession", "suggestions": []},
                {"name": "location", "label": "Location or Route map details", "suggestions": []},
                {"name": "date", "label": "Date of the Event (DD/MM/YYYY)", "suggestions": []},
                {"name": "expected_attendance", "label": "Expected Attendance (number)", "suggestions": []}
            ],
            "tracking": [
                {"name": "reference_number", "label": "Application Reference Number (e.g., UP-CMP-2026-001245)", "suggestions": []}
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
            "killing", "ongoing crime", "stolen vehicle", "fire", "accident", "मदद", "खतरा", "हमला", "आग"
        ]
        return any(word in clean_text for word in emergency_words)

    def detect_language(self, text: str) -> str:
        clean = text.lower()
        if any(w in clean for w in ["hindi", "हिन्दी", "हिंदी", "किये", "रहा"]):
            return "hi"
        elif any(w in clean for w in ["karna hai", "karna", "chahiye", "hai"]):
            return "hinglish"
        return "en"

    def process_message(self, message: str, session_id: str):
        session = self.get_session(session_id)
        clean_msg = message.strip().lower()

        # Update language preference
        lang_detected = self.detect_language(message)
        if lang_detected != "en" and session.language == "en":
            session.language = lang_detected

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
                "suggestions": ["File Complaint", "Tenant Verification", "Character Certificate", "Event Permission"]
            }

        # Check for active workflow
        if not session.workflow:
            # Detect starting new workflow
            if any(w in clean_msg for w in ["complaint", "stolen", "report", "shikayat", "शिकायत"]):
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
            
            # If we are at step > 0, the current message is the answer to the previous step's field
            if session.step > 0:
                prev_field_name = fields[session.step - 1]["name"]
                session.data[prev_field_name] = message

            # Check if there is another field to collect
            if session.step < len(fields):
                next_field = fields[session.step]
                session.step += 1
                
                # Format request for the field
                response_txt = self._format_question(session.workflow, next_field["label"], session.language)
                return {
                    "intercepted": True,
                    "response": response_txt,
                    "suggestions": next_field["suggestions"]
                }
            else:
                # All fields collected! Finish and return mock number
                return self._finalize_workflow(session)

        return {"intercepted": False}

    def _format_question(self, workflow: str, field_label: str, language: str) -> str:
        workflow_titles = {
            "complaint": {"en": "Complaint Form", "hi": "शिकायत प्रपत्र", "hinglish": "Complaint Form"},
            "verification": {"en": "Verification Form", "hi": "सत्यापन प्रपत्र", "hinglish": "Verification Form"},
            "certificate": {"en": "Character Certificate", "hi": "चरित्र प्रमाण पत्र", "hinglish": "Character Certificate"},
            "event": {"en": "Event Permission", "hi": "कार्यक्रम अनुमति", "hinglish": "Event Permission"},
            "tracking": {"en": "Tracking Utility", "hi": "ट्रैकिंग उपयोगिता", "hinglish": "Tracking Utility"}
        }
        
        prefix = {
            "en": f"📋 [{workflow_titles[workflow]['en']}] Please provide the following details:\n👉 ",
            "hi": f"📋 [{workflow_titles[workflow]['hi']}] कृपया निम्नलिखित जानकारी प्रदान करें:\n👉 ",
            "hinglish": f"📋 [{workflow_titles[workflow]['hinglish']}] Please enter details:\n👉 "
        }
        return f"{prefix[language]}{field_label}"

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
        
        if workflow == "complaint":
            ref_num = f"UP-CMP-{year}-{random_id}"
            resp = {
                "en": f"✅ **Complaint Drafted Successfully!**\nYour mock complaint reference number is: `{ref_num}`.\n\n*Summary:*\n- **Type:** {data.get('complaint_type')}\n- **Incident:** {data.get('incident_details')}\n\nYou can track this application in the tracking menu.",
                "hi": f"✅ **शिकायत सफलतापूर्वक दर्ज!**\nआपका संदर्भ संख्या (Reference Number) है: `{ref_num}`.\n\n*विवरण:*\n- **प्रकार:** {data.get('complaint_type')}\n- **घटना:** {data.get('incident_details')}",
                "hinglish": f"✅ **Complaint register ho gayi!**\nAapka reference number hai: `{ref_num}`.\n\n*Summary:*\n- **Type:** {data.get('complaint_type')}\n- **Incident:** {data.get('incident_details')}"
            }
        elif workflow == "verification":
            ref_num = f"UP-VER-{year}-{random_id}"
            resp = {
                "en": f"✅ **Verification Application Submitted!**\nYour mock Application Number is: `{ref_num}`.\n\n*Summary:*\n- **Service:** {data.get('verification_type')}\n- **Name:** {data.get('name')}\n- **Property Address:** {data.get('address')}",
                "hi": f"✅ **सत्यापन आवेदन सबमिट किया गया!**\nआपका संदर्भ संख्या है: `{ref_num}`.\n\n*विवरण:*\n- **प्रकार:** {data.get('verification_type')}\n- **नाम:** {data.get('name')}\n- **पता:** {data.get('address')}",
                "hinglish": f"✅ **Verification request submit ho gayi hai!**\nAapka Application Number: `{ref_num}`.\n\n*Summary:*\n- **Service:** {data.get('verification_type')}\n- **Name:** {data.get('name')}\n- **Address:** {data.get('address')}"
            }
        elif workflow == "certificate":
            ref_num = f"UP-CER-{year}-{random_id}"
            resp = {
                "en": f"✅ **Character Certificate Requested!**\nYour mock Application Number is: `{ref_num}`.\n\n*Summary:*\n- **Applicant:** {data.get('name')}\n- **District:** {data.get('district')}\n- **Purpose:** {data.get('purpose')}",
                "hi": f"✅ **चरित्र प्रमाण पत्र आवेदन दायर!**\nआपका संदर्भ संख्या है: `{ref_num}`.\n\n*विवरण:*\n- **आवेदक:** {data.get('name')}\n- **ज़िला:** {data.get('district')}",
                "hinglish": f"✅ **Character certificate request submit ho gayi!**\nAapka application number: `{ref_num}`."
            }
        elif workflow == "event":
            ref_num = f"UP-EVP-{year}-{random_id}"
            resp = {
                "en": f"✅ **Event Permission Lodged!**\nYour mock Application Reference Number is: `{ref_num}`.\n\n*Summary:*\n- **Request Type:** {data.get('event_type')}\n- **Name:** {data.get('event_name')}\n- **Location:** {data.get('location')}\n- **Date:** {data.get('date')}",
                "hi": f"✅ **आयोजन अनुमति आवेदन दर्ज!**\nआपका संदर्भ संख्या है: `{ref_num}`.\n\n*विवरण:*\n- **प्रकार:** {data.get('event_type')}\n- **नाम:** {data.get('event_name')}\n- **स्थान:** {data.get('location')}",
                "hinglish": f"✅ **Event Permission submit ho gaya!**\nAapka reference number: `{ref_num}`."
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
            "suggestions": ["Track Application", "New Request", "File Complaint"]
        }
