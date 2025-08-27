# user_backend/app/api/v1/endpoints/templates.py
# ============================================================================

from typing import List, Optional
from requests import Session
from sqlalchemy import desc, select
from fastapi import APIRouter, Depends, HTTPException, status

from user_backend.app.api.v1.core.models import (
    Project,
    ProjectTemplate,
    ProjectType,
    TokenCategory,
    User,
)
from user_backend.app.api.v1.core.schemas import (
    ProjectOutSchema,
    ProjectTemplateOutSchema,
    TemplateUseSchema,
)
from user_backend.app.core.security import get_current_active_user
from user_backend.app.db_setup import get_db


router = APIRouter(tags=["templates"], prefix="/templates")


@router.get("/", response_model=List[ProjectTemplateOutSchema])
async def list_templates(
    project_type: Optional[ProjectType] = None,
    category: Optional[TokenCategory] = None,
    featured_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List available project templates"""
    query = select(ProjectTemplate).where(ProjectTemplate.is_public)

    if project_type:
        query = query.where(ProjectTemplate.project_type == project_type)
    if featured_only:
        query = query.where(ProjectTemplate.is_featured)

    query = (
        query.order_by(desc(ProjectTemplate.usage_count)).limit(limit).offset(offset)
    )

    templates = db.execute(query).scalars().all()
    return [ProjectTemplateOutSchema.model_validate(t) for t in templates]


@router.get("/popular", response_model=List[ProjectTemplateOutSchema])
async def get_popular_templates(limit: int = 10, db: Session = Depends(get_db)):
    """Get most popular templates"""
    templates = (
        db.execute(
            select(ProjectTemplate)
            .where(ProjectTemplate.is_public)
            .order_by(desc(ProjectTemplate.usage_count))
            .limit(limit)
        )
        .scalars()
        .all()
    )

    return [ProjectTemplateOutSchema.model_validate(t) for t in templates]


@router.post("/{template_id}/use", response_model=ProjectOutSchema)
async def use_template(
    template_id: int,
    template_use: TemplateUseSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create project from template"""
    template = db.execute(
        select(ProjectTemplate).where(ProjectTemplate.id == template_id)
    ).scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    # Create project from template
    project_config = template.config.copy()
    if template_use.customize_config:
        project_config.update(template_use.customize_config)

    new_project = Project(
        name=template_use.project_name,
        description=template_use.project_description or template.description,
        project_type=template.project_type,
        tokens=template.tokens.copy(),
        config=project_config,
        user_id=current_user.id,
    )

    db.add(new_project)

    # Increment template usage
    template.usage_count += 1

    db.commit()
    db.refresh(new_project)

    return ProjectOutSchema.model_validate(new_project)
