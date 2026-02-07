from fastapi import FastAPI, HTTPException, File, UploadFile, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from groq import Groq
import logging
import os
import io
import uuid
import tempfile
from time import time
from dotenv import load_dotenv
from typing import Optional
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate


load_dotenv()

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- APP ----------------
app = FastAPI(
    title="JanSeva - Maharashtra Government Schemes Assistant",
    description="Multilingual AI assistant for active citizen schemes in Maharashtra | जनसेवा सहाय्यक",
    version="2.0.0"
)

# ---------------- CORS CONFIGURATION ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins like ["http://localhost:8080"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def force_options_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return Response(status_code=200, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        })
    return await call_next(request)

@app.options("/{path:path}")
async def options_handler(path: str):
    return {}

# ---------------- LANGUAGES ----------------
LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "mr": "Marathi (मराठी)"
}

# ---------------- MODELS ----------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    language: Optional[str] = None  # 'en', 'hi', 'mr' or auto-detect
    enable_tts: bool = False

    @field_validator("message")
    @classmethod
    def clean_message(cls, v):
        return v.strip()

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    conversation_id: str
    status: str = "success"
    audio_url: Optional[str] = None
    timestamp: float

class VoiceChatResponse(BaseModel):
    transcribed_text: str
    reply: str
    detected_language: str
    conversation_id: str
    status: str = "success"
    audio_url: Optional[str] = None
    timestamp: float

class SchemeInfo(BaseModel):
    id: int
    name: str
    name_marathi: str
    name_hindi: str
    category: str
    description: str
    eligibility: str
    benefits: str

# ---------------- AI INITIALIZATION ----------------
# Check if API key exists
if not os.getenv("GROQ_API_KEY"):
    logger.error("GROQ_API_KEY not found in environment variables!")
    raise ValueError("GROQ_API_KEY is required. Please set it in your .env file")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    max_tokens=800,
    timeout=30
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- CONVERSATION STORAGE ----------------
# In production, use Redis or a database
conversations = {}

# ---------------- ENHANCED PROMPTS ----------------
prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are **JanSeva Assistant (जनसेवा सहाय्यक)** — an official AI assistant for
**Maharashtra Government Schemes**.

==================================================
MANDATORY LANGUAGE CONTROL
==================================================
You MUST respond ONLY in the language specified below.

Target language code: {lang}

Language rules:
- en → Respond ONLY in English
- hi → Respond ONLY in Hindi (हिंदी) using Devanagari
- mr → Respond ONLY in Marathi (मराठी) using Devanagari
- NEVER mix languages
- NEVER switch language on your own
- Romanized Hindi/Marathi input is already normalized internally

==================================================
SCOPE (STRICT)
==================================================
Answer ONLY about:
- ACTIVE Maharashtra Government schemes
- Citizens: women, students, farmers, senior citizens, poor, disabled, youth
- State schemes + Central schemes applicable in Maharashtra

If user asks:
- About other states → politely redirect to Maharashtra
- About inactive/discontinued schemes → clearly say it is inactive
- General/non-scheme questions → redirect to scheme-related help

==================================================
ANSWER FORMAT (MANDATORY)
==================================================
Keep answers concise (3–6 lines).

Include:
• Scheme name (in target language)
• Eligibility criteria
• Key benefits
• How to apply (official portal / office)

Use bullet points where appropriate.
Avoid long paragraphs.

==================================================
TONE & STYLE
==================================================
- Respectful, government-official tone
- Helpful and citizen-friendly
- Use honorifics:
  - Hindi → आप
  - Marathi → तुम्ही
- Clear, simple language (for non-technical users)

==================================================
IMPORTANT BEHAVIOR
==================================================
- Do NOT hallucinate scheme details
- If unsure, say information is unavailable
- Prefer official portals (Mahadbt, department offices)
- Do NOT include emojis
- Do NOT include unnecessary explanations

==================================================
REFERENCE SCHEMES (EXAMPLES, NOT LIMIT)
==================================================
- माझी कन्या भाग्यश्री योजना / Majhi Kanya Bhagyashree Yojana
- लेक लाडकी योजना / Lek Ladki Yojana
- श्रावण बाल योजना / Shravan Bal Yojana
- महात्मा ज्योतिबा फुले जन आरोग्य योजना
- शेतकरी सन्मान निधी योजना
- प्रधानमंत्री आवास योजना
- स्वाधार गृह योजना

==================================================
EXAMPLES
==================================================

User (mr): माझी कन्या भाग्यश्री योजना काय आहे?
Assistant (mr):
माझी कन्या भाग्यश्री योजना ही मुलींच्या कल्याणासाठीची योजना आहे.

• पात्रता: वार्षिक उत्पन्न ₹1 लाखांपेक्षा कमी
• लाभ: दोन मुलींसाठी ₹50,000 पर्यंत मदत
• अर्ज: महाडीबीटी पोर्टल किंवा महिला व बाल विकास कार्यालय

---

User (hi): महिलाओं के लिए कौन सी योजना है?
Assistant (hi):
महाराष्ट्र सरकार महिलाओं के लिए कई योजनाएँ चलाती है।

• लेक लाडकी योजना – आर्थिक सहायता
• पात्रता: पीला/नारंगी राशन कार्ड
• आवेदन: महिला एवं बाल विकास विभाग

---

User (en): How to apply for farmer schemes?
Assistant (en):
Farmers in Maharashtra can apply for the following schemes:

• Shetkari Sanman Nidhi – ₹6,000 per year
• Eligibility: Registered landholding farmers
• Apply via Mahakisan portal or agriculture office
"""),
    ("human", "{user_input}")
])

detect_prompt = ChatPromptTemplate.from_messages([
    ("system", """
Detect the language of the text. Reply with ONLY ONE WORD:
- english
- hindi  
- marathi

Detection hints:
- English: "what", "how", "scheme", "benefit"
- Hindi: "kya", "kaise", "yojana", "labh", क्या, कैसे
- Marathi: "kay", "kasa", "yojana", "aahe", काय, कसा
"""),
    ("human", "{text}")
])

chain = prompt | llm
detect_chain = detect_prompt | llm


def transliterate_if_roman(text: str) -> str:
    try:
        converted = transliterate(text, sanscript.HK, sanscript.DEVANAGARI)

        return converted if converted != text else text
    except Exception:
        return text

# ---------------- HELPER FUNCTIONS #
# ---------------- HELPER FUNCTIONS #

def is_devanagari(text: str) -> bool:
    return any('\u0900' <= ch <= '\u097F' for ch in text)


def fast_detect_language(text: str) -> str:
    # Devanagari detection
    if any('\u0900' <= ch <= '\u097F' for ch in text):
        # Simple Hindi vs Marathi heuristic
        if any(word in text for word in ["आहे", "काय", "साठी", "मिळते"]):
            return "mr"
        return "hi"

    # Romanized hints
    text_l = text.lower()
    if any(w in text_l for w in ["aahe", "kay", "sathi", "milte"]):
        return "mr"
    if any(w in text_l for w in ["kya", "kaise", "liye", "yojana"]):
        return "hi"

    return "en"


# ----------------#
def detect_language(text: str, preferred_lang: Optional[str] = None) -> str:
    if preferred_lang in ["en", "hi", "mr"]:
        return preferred_lang
    return fast_detect_language(text)

async def text_to_speech(text: str, lang: str) -> bytes:
    try:
        from gtts import gTTS
        import io

        # Sanitize text for TTS
        text = sanitize_for_tts(text, lang)

        # Map languages to gTTS codes
        language_map = {
            "en": "en",
            "hi": "hi",
            "mr": "mr"
        }

        tts_lang = language_map.get(lang, "en")

        # Generate TTS
        tts = gTTS(text=text, lang=tts_lang, slow=False)
        
        # Save to bytes
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.getvalue()

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="Text-to-speech failed")
import re

def sanitize_for_tts(text: str, lang: str) -> str:
    # Currency
    if lang in ["hi", "mr"]:
        text = text.replace("₹", "रुपये ")
    else:
        text = text.replace("₹", "rupees ")

    # Remove bullets & special dashes
    text = re.sub(r"[•●▪–—]", " ", text)

    # Remove emojis & unsupported symbols
    text = re.sub(r"[^\w\s.,]", " ", text)

    # Normalize spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()

async def transcribe_audio(audio: UploadFile) -> str:
    """Transcribe audio using Groq Whisper"""
    try:
        content = await audio.read()
        suffix = os.path.splitext(audio.filename)[1] or ".webm"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            path = tmp.name
        
        try:
            with open(path, "rb") as f:
                transcription = groq_client.audio.transcriptions.create(
                    file=(audio.filename, f.read()),
                    model="whisper-large-v3-turbo",
                    response_format="text",
                    language="auto"  # Auto-detect language
                )
            return transcription
        finally:
            os.remove(path)
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Audio transcription failed")

# ---------------- AUDIO CACHE ----------------
audio_cache = {}  # audio_id -> (bytes, timestamp)
AUDIO_TTL = 300  # 5 minutes

def cleanup_audio_cache():
    """Remove expired audio files from cache"""
    current_time = time()
    expired = [aid for aid, (_, ts) in audio_cache.items() if current_time - ts > AUDIO_TTL]
    for aid in expired:
        del audio_cache[aid]

# ---------------- API ROUTES ----------------
@app.get("/")
def root():
    return {
        "service": "JanSeva - Maharashtra Government Schemes Assistant",
        "version": "2.0.0",
        "languages": LANGUAGE_MAP,
        "scope": "Active citizen schemes in Maharashtra",
        "endpoints": {
            "health": "/health",
            "text_chat": "/chat",
            "voice_chat": "/chat/voice",
            "schemes_list": "/schemes"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JanSeva Assistant",
        "timestamp": time()
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Text-based chat endpoint"""
    try:
        # Detect language
        lang = detect_language(req.message, req.language)

        if lang in ["hi", "mr"] and not is_devanagari(req.message):
            processed_text = transliterate_if_roman(req.message)
        else:
            processed_text = req.message

        
        # Generate conversation ID if not provided
        conv_id = req.conversation_id or str(uuid.uuid4())
        
        # Get or create conversation history
        if conv_id not in conversations:
            conversations[conv_id] = []
        
        # Add user message to history
        conversations[conv_id].append({
            "role": "user",
            "content": req.message
        })
        
        # Get AI response
        result = chain.invoke({
        "user_input": processed_text,
        "lang": lang
        })

        reply = result.content.strip()
        
        # Add assistant response to history
        conversations[conv_id].append({
            "role": "assistant",
            "content": reply
        })
        
        # Generate audio if requested
        audio_url = None
        if req.enable_tts:
            cleanup_audio_cache()  # Clean old audio files
            audio_id = str(uuid.uuid4())
            audio_cache[audio_id] = (await text_to_speech(reply, lang), time())
            audio_url = f"/audio/{audio_id}"
        
        return ChatResponse(
            reply=reply,
            detected_language=lang,
            conversation_id=conv_id,
            audio_url=audio_url,
            timestamp=time()
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/chat/voice", response_model=VoiceChatResponse)
async def chat_voice(
    audio: UploadFile = File(...),
    conversation_id: Optional[str] = None,
    enable_tts: bool = True
):
    """Voice-based chat endpoint"""
    try:
        # Transcribe audio to text
        transcribed_text = await transcribe_audio(audio)
        logger.info(f"Transcribed: {transcribed_text}")
        
        # Detect language from transcription
        # Detect language from RAW transcription
        lang = detect_language(transcribed_text)

        if lang in ["hi", "mr"] and not is_devanagari(transcribed_text):
            processed_text = transliterate_if_roman(transcribed_text)
        else:
            processed_text = transcribed_text


        # Generate conversation ID if not provided
        conv_id = conversation_id or str(uuid.uuid4())
        
        # Get or create conversation history
        if conv_id not in conversations:
            conversations[conv_id] = []
        
        # Add to conversation
        conversations[conv_id].append({
            "role": "user",
            "content": transcribed_text
        })
        
        # Get AI response
        result = chain.invoke({
        "user_input": processed_text,
        "lang": lang
        })
        reply = result.content.strip()
        
        conversations[conv_id].append({
            "role": "assistant",
            "content": reply
        })
        
        # Generate audio response
        audio_url = None
        if enable_tts:
            cleanup_audio_cache()
            audio_id = str(uuid.uuid4())
            audio_cache[audio_id] = (await text_to_speech(reply, lang), time())
            audio_url = f"/audio/{audio_id}"
        
        return VoiceChatResponse(
            transcribed_text=transcribed_text,
            reply=reply,
            detected_language=lang,
            conversation_id=conv_id,
            audio_url=audio_url,
            timestamp=time()
        )
    
    except Exception as e:
        logger.error(f"Voice chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

@app.get("/audio/{audio_id}")
async def get_audio(audio_id: str):
    """Retrieve generated audio file"""
    if audio_id not in audio_cache:
        raise HTTPException(status_code=404, detail="Audio not found or expired")
    
    audio_bytes, ts = audio_cache[audio_id]
    
    # Check if audio has expired
    if time() - ts > AUDIO_TTL:
        del audio_cache[audio_id]
        raise HTTPException(status_code=404, detail="Audio expired")
    
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"inline; filename=audio_{audio_id}.mp3"
        }
    )

@app.get("/schemes")
async def get_schemes():
    """Get list of popular Maharashtra government schemes"""
    schemes = [
        {
            "id": 1,
            "name": "Majhi Kanya Bhagyashree Yojana",
            "name_marathi": "माझी कन्या भाग्यश्री योजना",
            "name_hindi": "माझी कन्या भाग्यश्री योजना",
            "category": "women_child",
            "description": "Financial assistance for families with girl children",
            "eligibility": "Annual income less than ₹1 lakh",
            "benefits": "Up to ₹50,000 for two girl children"
        },
        {
            "id": 2,
            "name": "Shravan Bal Yojana",
            "name_marathi": "श्रावण बाल योजना",
            "name_hindi": "श्रावण बाल योजना",
            "category": "senior_citizens",
            "description": "Monthly financial assistance for senior citizens",
            "eligibility": "Age 65+, below poverty line",
            "benefits": "₹600 per month"
        },
        {
            "id": 3,
            "name": "Lek Ladki Yojana",
            "name_marathi": "लेक लाडकी योजना",
            "name_hindi": "लेक लाडकी योजना",
            "category": "women_child",
            "description": "Financial support for girls from yellow and orange ration card families",
            "eligibility": "Yellow/Orange ration card holders",
            "benefits": "Financial aid at different life stages up to ₹75,000"
        },
        {
            "id": 4,
            "name": "Mahatma Jyotiba Phule Jan Arogya Yojana",
            "name_marathi": "महात्मा ज्योतिबा फुले जन आरोग्य योजना",
            "name_hindi": "महात्मा ज्योतिबा फुले जन आरोग्य योजना",
            "category": "health",
            "description": "Health insurance scheme for families",
            "eligibility": "Yellow and orange ration card holders",
            "benefits": "Free treatment up to ₹1.5 lakh per family per year"
        },
        {
            "id": 5,
            "name": "Pradhan Mantri Awas Yojana",
            "name_marathi": "प्रधानमंत्री आवास योजना",
            "name_hindi": "प्रधानमंत्री आवास योजना",
            "category": "housing",
            "description": "Affordable housing scheme",
            "eligibility": "Economically weaker sections without pucca house",
            "benefits": "Subsidy for home construction/purchase"
        },
        {
            "id": 6,
            "name": "Shetkari Sanman Nidhi Yojana",
            "name_marathi": "शेतकरी सन्मान निधी योजना",
            "name_hindi": "शेतकरी सन्मान निधी योजना",
            "category": "agriculture",
            "description": "Financial assistance for farmers",
            "eligibility": "Registered farmers with land records",
            "benefits": "₹6,000 per year in installments"
        }
    ]
    
    return {"schemes": schemes, "total": len(schemes)}

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Retrieve conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id],
        "message_count": len(conversations[conversation_id])
    }

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    del conversations[conversation_id]
    return {"message": "Conversation deleted successfully"}

# ---------------- STARTUP/SHUTDOWN EVENTS ----------------
@app.on_event("startup")
async def startup_event():
    logger.info("JanSeva Assistant API starting up...")
    logger.info(f"Groq API Key configured: {bool(os.getenv('GROQ_API_KEY'))}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("JanSeva Assistant API shutting down...")
    audio_cache.clear()
    conversations.clear()

# ---------------- RUN ----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )