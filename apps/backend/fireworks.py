import json
import httpx
import logging
from typing import List, Dict, AsyncGenerator, Optional
from fastapi import HTTPException
from config import settings

logger = logging.getLogger("pandora-gateway")

async def generate_chat_stream(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    top_p: float = 0.9,
    max_tokens: int = 2048,
    system_prompt: Optional[str] = None,
    json_mode: bool = False,
    model: Optional[str] = None
) -> AsyncGenerator[str, None]:
    payload_messages = []
    if system_prompt:
        payload_messages.append({"role": "system", "content": system_prompt})
    payload_messages.extend(messages)

    chosen_model = model or settings.FIREWORKS_MODEL
    if not chosen_model:
        raise HTTPException(status_code=400, detail="Fireworks model is not selected or configured.")

    headers = {
        "Authorization": f"Bearer {settings.FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": chosen_model,
        "messages": payload_messages,
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens,
        "stream": True
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", "https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload) as response:
            if response.status_code != 200:
                error_bytes = await response.aread()
                error_msg = error_bytes.decode('utf-8', errors='ignore')
                logger.error(f"Fireworks API error status={response.status_code} response={error_msg}")
                raise HTTPException(status_code=response.status_code, detail=f"Fireworks API error: {error_msg}")

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
                                yield content
                    except json.JSONDecodeError:
                        continue
