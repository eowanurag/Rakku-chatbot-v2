import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from rag_engine import RAGEngine
from workflow_engine import WorkflowEngine
from gemini_client import GeminiClient

load_dotenv()

app = FastAPI(
    title="Rakku - AI Digital Police Assistant Service",
    description="FastAPI service executing workflows and RAG-based Gemini QA.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
rag_engine = RAGEngine()
workflow_engine = WorkflowEngine()
gemini_client = GeminiClient()

class ChatRequest(BaseModel):
    message: str
    session_id: str
    latitude: float | None = None
    longitude: float | None = None
    state: dict | None = None

class ChatResponse(BaseModel):
    response: str
    suggestions: list[str] = []
    db_action: dict | list[dict] | None = None
    state: dict | None = None

@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(req: ChatRequest):
    try:
        message = req.message
        session_id = req.session_id
        
        # Load state
        session = workflow_engine.load_or_create_session(session_id, req.state)
        if req.latitude is not None:
            session.latitude = req.latitude
        if req.longitude is not None:
            session.longitude = req.longitude

        # 1. Emergency Checks (Intercept immediately)
        if workflow_engine.check_emergency(message):
            session.workflow = None
            session.step = 0
            session.data = {}
            lang = session.language
            
            emergency_msgs = {
                "en": "⚠️ **EMERGENCY NOTICE:** This appears to be an emergency. Please contact UP Police emergency services immediately by dialing **112**.",
                "hi": "⚠️ **आपातकालीन सूचना:** यह एक आपातकालीन स्थिति लगती है। कृपया तुरंत **112** डायल करके उत्तर प्रदेश पुलिस आपातकालीन सेवाओं से संपर्क करें।",
                "hinglish": "⚠️ **EMERGENCY:** Yeh emergency situation lag rahi hai. Please immediate help ke liye UP Police ko **112** dial karke contact karein."
            }
            
            return ChatResponse(
                response=emergency_msgs.get(lang, emergency_msgs["en"]),
                suggestions=["File Complaint", "Track Status"],
                state=session.to_dict()
            )
            
        # 2. Workflow engine slot filling check
        wf_res = workflow_engine.process_message(message, session_id, gemini_client)
        if wf_res["intercepted"]:
            return ChatResponse(
                response=wf_res["response"],
                suggestions=wf_res.get("suggestions", []),
                db_action=wf_res.get("db_action", None),
                state=session.to_dict()
            )
            
        # 3. Retrieve relevant context from Knowledge Base
        retrieved_context = rag_engine.retrieve(message, top_k=2)
        
        # 4. Generate Gemini response
        response_text = gemini_client.generate_response(
            prompt=message,
            retrieved_context=retrieved_context,
            language=session.language
        )
        
        # Determine dynamic suggestions based on context
        suggestions = ["File Complaint", "Tenant Verification", "Character Certificate", "Track Application"]
        if retrieved_context:
            cat = retrieved_context[0]["category"]
            if cat == "Postmortem Report Request":
                suggestions = ["Ask about Postmortem", "File Complaint", "Main Dashboard"]
            elif cat == "Character Certificate":
                suggestions = ["Character Certificate", "Track Application", "Main Dashboard"]
            elif cat == "Tenant Verification":
                suggestions = ["Tenant Verification", "PG Verification", "Main Dashboard"]
        
        return ChatResponse(
            response=response_text,
            suggestions=suggestions,
            state=session.to_dict()
        )
        
    except Exception as e:
        print(f"Error in chat_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "gemini_enabled": gemini_client.client is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
