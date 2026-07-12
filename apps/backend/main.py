from fastapi import FastAPI, Depends, Header, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import httpx
import logging
import traceback
from io import BytesIO, StringIO
from pypdf import PdfReader
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load workspace env relative to this file location
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

from config import settings
from auth import get_current_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pandora-gateway")

def log_exception_details(e: Exception):
    tb = traceback.format_exc()
    exc_type = type(e).__name__
    exc_msg = str(e)
    status_code = getattr(e, "status_code", 500)
    
    response_body = None
    if hasattr(e, "response") and e.response is not None:
        try:
            response_body = e.response.text
            status_code = e.response.status_code
        except Exception:
            pass
            
    print("--- EXCEPTION DETECTED ---")
    print(f"Type: {exc_type}")
    print(f"Message: {exc_msg}")
    print(f"HTTP Status: {status_code}")
    if response_body:
        print(f"Fireworks Response Body: {response_body}")
    print(f"Traceback:\n{tb}")
    print("--------------------------")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 3: Validate Environment
    if not settings.FIREWORKS_API_KEY or settings.FIREWORKS_API_KEY.strip() == "":
        raise SystemExit("Missing environment variable: FIREWORKS_API_KEY")
    if not settings.FIREWORKS_MODEL or settings.FIREWORKS_MODEL.strip() == "":
        raise SystemExit("Missing environment variable: FIREWORKS_MODEL")
    if not settings.FIREWORKS_BASE_URL or settings.FIREWORKS_BASE_URL.strip() == "":
        raise SystemExit("Missing environment variable: FIREWORKS_BASE_URL")

    # Print success variables
    print("[OK] .env loaded")
    print(f"[OK] API key detected (only first 8 characters): {settings.FIREWORKS_API_KEY[:8]}...")
    print(f"[OK] Selected model: {settings.FIREWORKS_MODEL}")
    print(f"[OK] Base URL: {settings.FIREWORKS_BASE_URL}")

    # Check if we are running in unit testing mode to skip external network calls
    if os.getenv("TESTING") == "True":
        app.state.available_models = [
            "accounts/fireworks/models/llama-v3p1-70b-instruct",
            "accounts/fireworks/models/llama-v3p1-8b-instruct",
            "accounts/fireworks/models/deepseek-v3",
            "accounts/fireworks/models/mixtral-8x7b-instruct",
            "accounts/fireworks/models/qwen2p5-72b-instruct"
        ]
        yield
        return

    # Call Fireworks API to validate key and model
    logger.info("Validating Fireworks connection and configurations...")
    headers = {
        "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{settings.FIREWORKS_BASE_URL}/models", headers=headers)
            
            # Step 5: Validate API Key
            if response.status_code != 200:
                print("Fireworks Authentication Failed")
                print("Reason:")
                print(response.text)
                raise SystemExit("Startup aborted: Fireworks authentication validation failed.")
            
            # Step 6: Validate Model
            models_data = response.json().get("data", [])
            available_model_ids = [m.get("id") for m in models_data]
            
            # Save the raw list of available models to state
            app.state.available_models = available_model_ids
            
            if settings.FIREWORKS_MODEL not in available_model_ids:
                print("Configured model not found.")
                print("Available models:")
                for m_id in available_model_ids:
                    print(f"- {m_id}")
                raise SystemExit("Startup aborted: Configured model is not available.")
            
            logger.info("Connected to Fireworks and model is verified.")

    except Exception as e:
        if isinstance(e, SystemExit):
            raise
        log_exception_details(e)
        raise SystemExit(f"Startup aborted: Fireworks validation request failed: {str(e)}")

    yield

app = FastAPI(title="Pandora AI Gateway", version="1.0.0", lifespan=lifespan)

# Enable CORS for frontend workspace access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    log_exception_details(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server gateway error: {str(exc)}"}
    )

# Pydantic Schemas v2
class ChatMessageSchema(BaseModel):
    role: str = Field(..., description="Role of message author (user, assistant, system)")
    content: str = Field(..., description="Content text details")

class ChatRequest(BaseModel):
    messages: List[ChatMessageSchema]
    model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    json_mode: Optional[bool] = False

class VoiceRequest(BaseModel):
    text: str

class EvaluateRequest(BaseModel):
    prompt: str
    category: str = "custom"           # json | accuracy | efficiency | custom
    custom_validator: Optional[str] = None
    temperature: Optional[float] = 0.05
    max_tokens: Optional[int] = 256

class AuthLoginRequest(BaseModel):
    email: str
    password: str

# Endpoints
@app.get("/health")
@app.get("/api/health")
def get_health():
    return {"status": "healthy", "service": "pandora-backend"}

@app.get("/ready")
@app.get("/api/ready")
def get_ready():
    return {"status": "ready"}

@app.get("/version")
@app.get("/api/version")
def get_version():
    return {"version": "1.0.0"}

@app.get("/api/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@app.get("/api/models")
def get_models():
    available = getattr(app.state, "available_models", [])
    if not available:
        return [{"id": settings.FIREWORKS_MODEL, "label": "Selected Model"}]
        
    models_list = []
    for m_id in available:
        basename = m_id.split("/")[-1]
        label = basename.replace("-", " ").title()
        if "kimi" in label.lower():
            label = "Kimi K2.6"
        elif "deepseek" in label.lower():
            label = "DeepSeek V4 Pro"
        elif "glm" in label.lower():
            label = label.replace("Glm", "GLM")
        elif "flux" in label.lower():
            label = "Flux 1 Schnell"
        
        models_list.append({"id": m_id, "label": label})
    return models_list

@app.post("/api/auth/login")
def auth_login(body: AuthLoginRequest):
    return {"status": "success", "session": "mock-session-token", "user": {"email": body.email}}

@app.post("/api/auth/signup")
def auth_signup(body: AuthLoginRequest):
    return {"status": "success", "user": {"email": body.email}}

@app.post("/api/auth/logout")
def auth_logout():
    return {"status": "success"}

@app.post("/api/chat")
async def chat_non_stream(body: ChatRequest, user: dict = Depends(get_current_user)):
    import time
    start_time = time.perf_counter()
    logger.info("Incoming request to /api/chat")

    payload_messages = []
    if body.system_prompt:
        payload_messages.append({"role": "system", "content": body.system_prompt})
    payload_messages.extend([{"role": m.role, "content": m.content} for m in body.messages])

    # Resolve model strictly based on settings and override rules
    chosen_model = settings.FIREWORKS_MODEL
    if os.getenv("ALLOW_MODEL_OVERRIDE") == "True" and body.model:
        chosen_model = body.model

    # Pre-request print and validation checks
    configured_model = settings.FIREWORKS_MODEL
    actual_model = chosen_model
    print(f"Configured model: {configured_model}")
    print(f"Actual request model: {actual_model}")
    if configured_model != actual_model:
        raise HTTPException(status_code=400, detail="Configured model and actual request model differ.")

    if not chosen_model:
        raise HTTPException(status_code=400, detail="Fireworks model is not configured.")

    logger.info(f"Selected model: {chosen_model}")
    prompt = payload_messages[-1]["content"] if payload_messages else ""
    logger.info(f"Prompt: {prompt}")

    headers = {
        "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }

    temperature = body.temperature if body.temperature is not None else settings.TEMPERATURE
    top_p = body.top_p if body.top_p is not None else settings.TOP_P
    max_tokens = body.max_tokens if body.max_tokens is not None else settings.MAX_TOKENS

    payload = {
        "model": chosen_model,
        "messages": payload_messages,
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens,
        "stream": False
    }

    if body.json_mode:
        payload["response_format"] = {"type": "json_object"}

    logger.info(f"Fireworks request: {json.dumps(payload)}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
            if response.status_code != 200:
                req = client.build_request("POST", f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
                exc = httpx.HTTPStatusError(f"Fireworks error status {response.status_code}", request=req, response=response)
                log_exception_details(exc)
                raise HTTPException(status_code=response.status_code, detail=f"Fireworks API error: {response.text}")
            
            resp_json = response.json()
            logger.info(f"Fireworks response: {json.dumps(resp_json)}")
            
            latency = round((time.perf_counter() - start_time) * 1000)
            usage = resp_json.get("usage", {})
            total_tokens = usage.get("total_tokens", len(resp_json.get("choices", [{}])[0].get("message", {}).get("content", "").split()) + 5)
            
            logger.info(f"Total tokens: {total_tokens}")
            logger.info(f"Latency: {latency} ms")
            return resp_json
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            log_exception_details(e)
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(body: ChatRequest, user: dict = Depends(get_current_user)):
    import time
    start_time = time.perf_counter()
    print("Request received")
    logger.info("Request received")

    payload_messages = []
    if body.system_prompt:
        payload_messages.append({"role": "system", "content": body.system_prompt})
    payload_messages.extend([{"role": m.role, "content": m.content} for m in body.messages])

    # Resolve model strictly based on settings and override rules
    chosen_model = settings.FIREWORKS_MODEL
    if os.getenv("ALLOW_MODEL_OVERRIDE") == "True" and body.model:
        chosen_model = body.model

    # Pre-request print and validation checks
    configured_model = settings.FIREWORKS_MODEL
    actual_model = chosen_model
    print(f"Configured model: {configured_model}")
    print(f"Actual request model: {actual_model}")
    if configured_model != actual_model:
        raise HTTPException(status_code=400, detail="Configured model and actual request model differ.")

    if not chosen_model:
        raise HTTPException(status_code=400, detail="Fireworks model is not configured.")

    logger.info(f"Selected model: {chosen_model}")
    prompt = payload_messages[-1]["content"] if payload_messages else ""
    logger.info(f"Prompt: {prompt}")

    headers = {
        "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }

    temperature = body.temperature if body.temperature is not None else settings.TEMPERATURE
    top_p = body.top_p if body.top_p is not None else settings.TOP_P
    max_tokens = body.max_tokens if body.max_tokens is not None else settings.MAX_TOKENS

    payload = {
        "model": chosen_model,
        "messages": payload_messages,
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens,
        "stream": True
    }

    if body.json_mode:
        payload["response_format"] = {"type": "json_object"}

    logger.info(f"Fireworks request: {json.dumps(payload)}")

    async def event_generator(response, client_to_close):
        accumulated = ""
        first_chunk = True
        try:
            logger.info("Streaming started")
            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data:"):
                    data_content = line[5:].strip()
                    if data_content == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_content)
                        choices = data_json.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content") or delta.get("reasoning_content") or ""
                            if content:
                                if first_chunk:
                                    print("Received first chunk")
                                    logger.info("Received first chunk")
                                    first_chunk = False
                                print(f"Received token: {repr(content)}")
                                logger.info(f"Received token: {repr(content)}")
                                accumulated += content
                                print(f"Yielded token to frontend: {repr(content)}")
                                logger.info(f"Yielded token to frontend: {repr(content)}")
                                yield content
                    except json.JSONDecodeError:
                        continue
            
            print("Stream finished")
            logger.info("Stream finished")
            latency = round((time.perf_counter() - start_time) * 1000)
            total_tokens = len(accumulated.split()) + 5
            logger.info(f"Total tokens: {total_tokens}")
            logger.info(f"Latency: {latency} ms")
        except Exception as e:
            log_exception_details(e)
            raise
        finally:
            await response.aclose()
            await client_to_close.aclose()
            print("Connection closed")
            logger.info("Connection closed")

    client = httpx.AsyncClient(timeout=30.0)
    try:
        print("Sending request to Fireworks")
        logger.info("Sending request to Fireworks")
        req = client.build_request("POST", f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
        response = await client.send(req, stream=True)
        print("Fireworks connected")
        logger.info("Fireworks connected")
        
        if response.status_code != 200:
            error_bytes = await response.aread()
            error_msg = error_bytes.decode('utf-8', errors='ignore')
            await client.aclose()
            exc = httpx.HTTPStatusError(f"Fireworks error status {response.status_code}", request=req, response=response)
            log_exception_details(exc)
            raise HTTPException(status_code=response.status_code, detail=f"Fireworks API error: {error_msg}")
        
        return StreamingResponse(event_generator(response, client), media_type="text/event-stream")
    except Exception as e:
        await client.aclose()
        if isinstance(e, HTTPException):
            raise
        log_exception_details(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate(body: EvaluateRequest, user: dict = Depends(get_current_user)):
    import time
    import json as json_lib
    start = time.perf_counter()

    messages = [{"role": "user", "content": body.prompt}]
    
    # Resolve model strictly based on settings
    chosen_model = settings.FIREWORKS_MODEL
    configured_model = settings.FIREWORKS_MODEL
    actual_model = chosen_model
    print(f"Configured model: {configured_model}")
    print(f"Actual request model: {actual_model}")
    if configured_model != actual_model:
        raise HTTPException(status_code=400, detail="Configured model and actual request model differ.")

    headers = {
        "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": chosen_model,
        "messages": messages,
        "temperature": body.temperature,
        "max_tokens": body.max_tokens,
        "stream": False
    }
    if body.category == "json":
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
            if resp.status_code != 200:
                req = client.build_request("POST", f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
                exc = httpx.HTTPStatusError(f"Fireworks error status {resp.status_code}", request=req, response=resp)
                log_exception_details(exc)
                raise HTTPException(status_code=resp.status_code, detail=f"Fireworks API error: {resp.text}")
            response_text = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        log_exception_details(e)
        raise HTTPException(status_code=500, detail=str(e))

    latency_ms = round((time.perf_counter() - start) * 1000)
    token_count = len(response_text.split()) + 5

    # Validate output by category
    status = "fail"
    error_msg = None
    try:
        if body.category == "json":
            json_lib.loads(response_text)
            status = "pass"
        elif body.category == "efficiency":
            status = "pass" if len(response_text) < 60 else "fail"
            if status == "fail":
                error_msg = f"Output too long: {len(response_text)} chars (limit: 60)"
        elif body.custom_validator:
            status = "pass" if body.custom_validator.lower() in response_text.lower() else "fail"
            if status == "fail":
                error_msg = f"Expected '{body.custom_validator}' not found in output"
        else:
            status = "pass" if response_text else "fail"
    except Exception as e:
        status = "fail"
        error_msg = str(e)

    return {
        "status": status,
        "output": response_text,
        "latency_ms": latency_ms,
        "token_count": token_count,
        "error_msg": error_msg,
    }

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(file_bytes)) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = []
            for elem in tree.findall('.//w:t', namespaces):
                if elem.text:
                    texts.append(elem.text)
            return " ".join(texts)
    except Exception as e:
        return f"DOCX parsing error: {str(e)}"

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n".join(text_parts)
    except Exception as e:
        return f"PDF parsing error: {str(e)}"

def extract_text_from_csv(file_bytes: bytes) -> str:
    try:
        text = file_bytes.decode('utf-8', errors='ignore')
        f = StringIO(text)
        reader = csv.reader(f)
        rows = [", ".join(row) for row in reader]
        return "\n".join(rows)
    except Exception as e:
        return f"CSV parsing error: {str(e)}"

def extract_text_from_json(file_bytes: bytes) -> str:
    try:
        data = json.loads(file_bytes.decode('utf-8', errors='ignore'))
        return json.dumps(data, indent=2)
    except Exception as e:
        return f"JSON parsing error: {str(e)}"

def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"TXT parsing error: {str(e)}"

@app.post("/api/upload")
@app.post("/api/chat/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    try:
        filename = file.filename or "unknown"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        
        allowed_exts = {"pdf", "docx", "txt", "csv", "json", "md", "markdown", "png", "jpg", "jpeg", "gif", "webp", "bmp"}
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            
        file_bytes = await file.read()
        
        # Max size check: 10MB
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

        # Save to local uploads directory
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        
        if ext == "pdf":
            content = extract_text_from_pdf(file_bytes)
        elif ext == "docx":
            content = extract_text_from_docx(file_bytes)
        elif ext == "csv":
            content = extract_text_from_csv(file_bytes)
        elif ext == "json":
            content = extract_text_from_json(file_bytes)
        elif ext in ["md", "markdown"]:
            content = file_bytes.decode('utf-8', errors='ignore')
        elif ext in ["png", "jpg", "jpeg", "gif", "webp", "bmp"]:
            content = f"[Uploaded Image File: {filename} ({len(file_bytes)} bytes)]"
        else:
            content = extract_text_from_txt(file_bytes)

        summary = "No content available to summarize."
        
        if ext in ["png", "jpg", "jpeg", "gif", "webp", "bmp"]:
            summary = f"Image file '{filename}' was successfully uploaded and registered in storage."
        elif content.strip() and not content.startswith("PDF parsing error") and not content.startswith("DOCX parsing error"):
            truncated_content = content[:2000]
            summary_messages = [
                {"role": "system", "content": "You are a helpful document assistant. Write a short, highly professional 2-sentence summary of the following document content."},
                {"role": "user", "content": f"Document content:\n{truncated_content}"}
            ]
            
            try:
                headers = {
                    "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                chosen_model = settings.FIREWORKS_MODEL
                configured_model = settings.FIREWORKS_MODEL
                actual_model = chosen_model
                print(f"Configured model: {configured_model}")
                print(f"Actual request model: {actual_model}")
                if configured_model != actual_model:
                    raise HTTPException(status_code=400, detail="Configured model and actual request model differ.")

                payload = {
                    "model": chosen_model,
                    "messages": summary_messages,
                    "temperature": 0.3,
                    "max_tokens": 150,
                    "stream": False
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        summary = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    else:
                        req = client.build_request("POST", f"{settings.FIREWORKS_BASE_URL}/chat/completions", headers=headers, json=payload)
                        exc = httpx.HTTPStatusError(f"Fireworks error status {resp.status_code}", request=req, response=resp)
                        log_exception_details(exc)
                        summary = f"Summary generation failed (status {resp.status_code}): {resp.text}"
            except Exception as e:
                log_exception_details(e)
                summary = f"Summary generation failed: {str(e)}"
        
        return {
            "filename": filename,
            "size": len(file_bytes),
            "content": content,
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
