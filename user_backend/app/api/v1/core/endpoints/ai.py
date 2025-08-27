# user_backend/app/api/v1/endpoints/ai.py
# ============================================================================

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, logger, status, WebSocket
import json

from requests import Session
from sqlalchemy import select

from user_backend.app.api.v1.core.models import AIConversation, ProjectType, User
from user_backend.app.api.v1.core.schemas import (
    AIChatMessageSchema,
    AIChatResponseSchema,
    AIProjectFromDescriptionResultSchema,
    AIProjectFromDescriptionSchema,
)
from user_backend.app.core.security import get_current_active_user
from user_backend.app.db_setup import get_db

router = APIRouter(tags=["ai"], prefix="/ai")


@router.post(
    "/project-from-description", response_model=AIProjectFromDescriptionResultSchema
)
async def create_project_from_description(
    ai_request: AIProjectFromDescriptionSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Convert natural language description to project tokens"""
    # TODO: Implement AI integration (OpenAI, Claude, etc.)

    # Mock implementation for now
    description = ai_request.description.lower()

    # Simple keyword matching (replace with real AI)
    suggested_tokens = []
    if "login" in description or "auth" in description:
        suggested_tokens.extend(["l", "r", "o"])
    if "user" in description or "profile" in description:
        suggested_tokens.extend(["m", "u"])
    if "session" in description:
        suggested_tokens.extend(["s", "t"])
    if "admin" in description:
        suggested_tokens.extend(["a"])

    # Generate project name from description
    words = ai_request.description.split()[:3]
    suggested_name = " ".join(word.capitalize() for word in words) + " App"

    return AIProjectFromDescriptionResultSchema(
        suggested_name=suggested_name,
        suggested_description=ai_request.description,
        suggested_tokens=list(set(suggested_tokens)),
        confidence=0.85,
        reasoning="Generated based on keyword analysis of the description",
        project_type=ai_request.project_type or ProjectType.WEB_APP,
    )


@router.post("/chat", response_model=AIChatResponseSchema)
async def ai_chat(
    chat_request: AIChatMessageSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Chat with AI about project requirements"""
    # TODO: Implement AI chat integration

    # Find or create conversation
    conversation_id = chat_request.conversation_id
    if not conversation_id:
        conversation = AIConversation(
            user_id=current_user.id, project_id=chat_request.project_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        conversation_id = conversation.id
    else:
        conversation = db.execute(
            select(AIConversation).where(AIConversation.id == conversation_id)
        ).scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

    # Add user message to conversation
    conversation.messages.append(
        {
            "role": "user",
            "content": chat_request.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )

    # Generate AI response (mock for now)
    response_content = f"I understand you want to {chat_request.message.lower()}. "
    response_content += "Based on your requirements, I suggest using these tokens: "

    # Simple response generation
    suggested_tokens = []
    if "login" in chat_request.message.lower():
        suggested_tokens.extend(["l", "r"])
        response_content += "login (l) and register (r) for authentication."
    else:
        response_content += "Let me know more about your specific needs!"

    # Add AI response to conversation
    conversation.messages.append(
        {
            "role": "assistant",
            "content": response_content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "suggested_tokens": suggested_tokens,
        }
    )

    db.commit()

    return AIChatResponseSchema(
        response=response_content,
        suggestions=[
            "Tell me about user authentication",
            "What database features do you need?",
        ],
        suggested_tokens=suggested_tokens,
        conversation_id=conversation_id,
    )


@router.websocket("/ws/chat")
async def websocket_ai_chat(
    websocket: WebSocket, current_user: User = Depends(get_current_active_user)
):
    """WebSocket endpoint for real-time AI chat"""
    await websocket.accept()

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Process with AI (mock response)
            response = {
                "type": "ai_response",
                "content": f"AI response to: {message_data.get('message', '')}",
                "suggestions": ["suggestion1", "suggestion2"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            # Send response back
            await websocket.send_text(json.dumps(response))

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()
