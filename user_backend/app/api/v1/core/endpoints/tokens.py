# user_backend/app/api/v1/endpoints/tokens.py
# ============================================================================

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, or_

from user_backend.app.api.v1.core.models import (
    Project,
    ProjectType,
    TokenCategory,
    TokenCombination,
    TokenComplexity,
    TokenDefinition,
    TokenUsage,
    User,
)
from user_backend.app.api.v1.core.schemas import (
    TokenAnalyticsSchema,
    TokenDefinitionOutSchema,
    TokenSearchSchema,
    TokenValidationResultSchema,
    TokenValidationSchema,
)
from user_backend.app.core.logging_config import StructuredLogger
from user_backend.app.core.security import get_current_active_user
from user_backend.app.db_setup import get_db

router = APIRouter(tags=["tokens"], prefix="/tokens")
logger = StructuredLogger(__name__)


@router.get("/", response_model=List[TokenDefinitionOutSchema])
async def list_tokens(
    category: Optional[TokenCategory] = None,
    complexity: Optional[TokenComplexity] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List all available tokens"""
    query = select(TokenDefinition).where(TokenDefinition.is_active)

    if category:
        query = query.where(TokenDefinition.category == category)
    if complexity:
        query = query.where(TokenDefinition.complexity == complexity)
    if search:
        query = query.where(
            or_(
                TokenDefinition.name.ilike(f"%{search}%"),
                TokenDefinition.description.ilike(f"%{search}%"),
                TokenDefinition.token.ilike(f"%{search}%"),
            )
        )

    query = (
        query.order_by(TokenDefinition.usage_count.desc()).limit(limit).offset(offset)
    )

    tokens = db.execute(query).scalars().all()
    return [TokenDefinitionOutSchema.model_validate(t) for t in tokens]


@router.get("/search", response_model=List[TokenDefinitionOutSchema])
async def search_tokens(
    search_params: TokenSearchSchema, db: Session = Depends(get_db)
):
    """Advanced token search"""
    query = select(TokenDefinition).where(TokenDefinition.is_active)

    if search_params.query:
        query = query.where(
            or_(
                TokenDefinition.name.ilike(f"%{search_params.query}%"),
                TokenDefinition.description.ilike(f"%{search_params.query}%"),
            )
        )

    if search_params.category:
        query = query.where(TokenDefinition.category == search_params.category)

    if search_params.complexity:
        query = query.where(TokenDefinition.complexity == search_params.complexity)

    tokens = (
        db.execute(
            query.order_by(TokenDefinition.usage_count.desc()).limit(
                search_params.limit
            )
        )
        .scalars()
        .all()
    )

    return [TokenDefinitionOutSchema.model_validate(t) for t in tokens]


@router.post("/validate", response_model=TokenValidationResultSchema)
async def validate_tokens(
    validation_data: TokenValidationSchema, db: Session = Depends(get_db)
):
    """Validate token combination"""
    tokens = validation_data.tokens

    # Get token definitions
    token_defs = (
        db.execute(select(TokenDefinition).where(TokenDefinition.token.in_(tokens)))
        .scalars()
        .all()
    )

    found_tokens = {t.token: t for t in token_defs}

    errors = []
    warnings = []
    suggestions = []
    missing_dependencies = []
    conflicts = []

    # Check if all tokens exist
    for token in tokens:
        if token not in found_tokens:
            errors.append(f"Token '{token}' does not exist")

    # Check dependencies and conflicts
    for token in tokens:
        if token in found_tokens:
            token_def = found_tokens[token]

            # Check dependencies
            for dep in token_def.dependencies:
                if dep not in tokens:
                    missing_dependencies.append(dep)
                    suggestions.append(
                        f"Consider adding '{dep}' as it's required by '{token}'"
                    )

            # Check conflicts
            for conflict in token_def.conflicts_with:
                if conflict in tokens:
                    conflicts.append(f"Token '{token}' conflicts with '{conflict}'")

    is_valid = len(errors) == 0 and len(conflicts) == 0

    return TokenValidationResultSchema(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        suggestions=suggestions,
        missing_dependencies=list(set(missing_dependencies)),
        conflicts=conflicts,
    )


@router.get("/suggest")
async def suggest_tokens(
    description: Optional[str] = None,
    existing_tokens: Optional[List[str]] = None,
    project_type: Optional[ProjectType] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """AI-powered token suggestions"""
    # TODO: Implement AI-based token suggestion
    # This could use OpenAI/LLM to analyze description and suggest tokens

    suggestions = []

    if description:
        # Basic keyword-based suggestions (enhance with AI)
        keywords_to_tokens = {
            "login": ["l"],
            "register": ["r"],
            "auth": ["l", "r", "o"],
            "user": ["m", "u"],
            "session": ["s", "t"],
            "logout": ["o"],
            "profile": ["m", "u"],
        }

        desc_lower = description.lower()
        for keyword, tokens in keywords_to_tokens.items():
            if keyword in desc_lower:
                suggestions.extend(tokens)

    # Get popular combinations for project type
    if project_type:
        popular = (
            db.execute(
                select(TokenCombination)
                .join(Project, Project.tokens.overlap(TokenCombination.tokens))
                .where(Project.project_type == project_type)
                .order_by(desc(TokenCombination.usage_count))
                .limit(5)
            )
            .scalars()
            .all()
        )

        for combo in popular:
            suggestions.extend(combo.tokens)

    # Remove duplicates and existing tokens
    suggestions = list(set(suggestions))
    if existing_tokens:
        suggestions = [t for t in suggestions if t not in existing_tokens]

    return {
        "suggested_tokens": suggestions[:10],  # Limit to top 10
        "reasoning": "Based on description keywords and popular combinations",
    }


@router.get("/analytics", response_model=List[TokenAnalyticsSchema])
async def get_token_analytics(limit: int = 20, db: Session = Depends(get_db)):
    """Get token usage analytics"""
    # TODO: Implement comprehensive token analytics
    # This would analyze usage patterns, success rates, etc.

    # Basic implementation - most used tokens
    token_usage = db.execute(
        select(TokenUsage.token, func.sum(TokenUsage.usage_count).label("total_usage"))
        .group_by(TokenUsage.token)
        .order_by(desc("total_usage"))
        .limit(limit)
    ).all()

    analytics = []
    for token, usage in token_usage:
        token_def = db.execute(
            select(TokenDefinition).where(TokenDefinition.token == token)
        ).scalar_one_or_none()

        if token_def:
            analytics.append(
                TokenAnalyticsSchema(
                    token=token,
                    name=token_def.name,
                    usage_count=usage,
                    success_rate=0.95,  # TODO: Calculate actual success rate
                    avg_generation_time=2.5,  # TODO: Calculate from generations
                    most_combined_with=[],  # TODO: Calculate from combinations
                )
            )

    return analytics
