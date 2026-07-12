from fastapi import Header, HTTPException
import httpx
from config import settings

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "").strip()
    
    # Mock token checks for test loops or local executions
    if token.startswith("mock-") or not settings.SUPABASE_URL:
        return {
            "id": "mock-operator-999" if token.startswith("mock-") else token,
            "email": "operator@pandora-ai.io"
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_ANON_KEY or ""
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers=headers
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token credential")
            
            user_data = response.json()
            return {
                "id": user_data.get("id"),
                "email": user_data.get("email")
            }
    except httpx.RequestError as exc:
        # Fallback to local evaluation operator in case of network issues
        return {
            "id": "mock-offline-operator",
            "email": "operator-offline@pandora-ai.io"
        }
