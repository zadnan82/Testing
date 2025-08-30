import threading
from typing import List, Optional
import json
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import logging
import zipfile
import tempfile
from fastapi.responses import StreamingResponse
from user_backend.app.models import (
    Project,
    ProjectType,
    TokenCategory,
    User,
)
from user_backend.app.schemas import (
    ProjectOutSchema,
    ProjectTemplateOutSchema,
    TemplateUseSchema,
)
from user_backend.app.core.security import get_current_active_user
from user_backend.app.db_setup import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# Correct path: templates are in /app/templates within the container
TEMPLATES_DIR = Path("/app/templates")

logger.info(f"Templates directory: {TEMPLATES_DIR}")
logger.info(f"Templates directory exists: {TEMPLATES_DIR.exists()}")

if TEMPLATES_DIR.exists():
    logger.info(
        f"Templates found: {[d.name for d in TEMPLATES_DIR.iterdir() if d.is_dir()]}"
    )
else:
    logger.warning(f"Templates directory does not exist: {TEMPLATES_DIR}")


def get_template_metadata(template_dir: Path) -> Optional[dict]:
    """Read template metadata from template.json or infer from directory structure"""
    metadata_file = template_dir / "template.json"

    if metadata_file.exists():
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error(f"Error reading metadata file {metadata_file}: {e}")
            return None

    # Fallback: infer metadata from directory name and structure
    return {
        "id": template_dir.name,
        "name": template_dir.name.replace("_", " ").title(),
        "description": f"{template_dir.name.replace('_', ' ').title()} template",
        "project_type": "web_app",  # Default type
        "category": "utility",  # Default category
        "is_featured": False,
        "is_public": True,
        "usage_count": 0,
        "config": {},
        "tokens": [],
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00",
    }


@router.get("/", response_model=List[ProjectTemplateOutSchema])
async def list_templates(
    project_type: Optional[ProjectType] = Query(None),
    category: Optional[TokenCategory] = Query(None),
    featured_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List available project templates from filesystem directories"""
    templates = []

    logger.info(f"Listing templates from: {TEMPLATES_DIR}")

    if not TEMPLATES_DIR.exists():
        logger.error(f"Templates directory not found: {TEMPLATES_DIR}")
        # Return empty list instead of error for better UX
        return []

    # Read all template directories
    for template_dir in TEMPLATES_DIR.iterdir():
        if template_dir.is_dir() and not template_dir.name.startswith("."):
            try:
                metadata = get_template_metadata(template_dir)
                if metadata is None:
                    continue

                template = ProjectTemplateOutSchema(**metadata)

                # Apply filters
                if project_type and template.project_type != project_type:
                    continue
                if category and template.category != category:
                    continue
                if featured_only and not template.is_featured:
                    continue

                templates.append(template)

            except ValueError as e:
                logger.error(f"Error processing template {template_dir}: {e}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error with template {template_dir}: {e}")
                continue

    logger.info(f"Found {len(templates)} templates")

    # Sort by usage count (descending) and apply pagination
    templates.sort(key=lambda x: x.usage_count, reverse=True)

    # Apply pagination
    start_idx = offset
    end_idx = offset + limit
    return templates[start_idx:end_idx]


@router.get("/{template_name}/preview")
async def get_template_preview(template_name: str):
    """Get template preview with actual code files"""
    template_path = TEMPLATES_DIR / template_name

    if not template_path.exists() or not template_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found",
        )

    preview_data = {
        "template_name": template_name,
        "frontend": "",
        "backend": "",
        "files": {},
        "structure": [],
    }

    try:
        logger.info(f"Loading preview for template: {template_name}")

        # Get all files in the template directory
        for file_path in template_path.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(template_path)
                preview_data["structure"].append(str(relative_path))

                # Read text files (skip binary files)
                if file_path.suffix.lower() in [
                    ".js",
                    ".py",
                    ".html",
                    ".css",
                    ".json",
                    ".md",
                    ".txt",
                    ".pseudo",
                ]:
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                            preview_data["files"][str(relative_path)] = content

                            # Categorize main files
                            filename = file_path.name.lower()
                            relative_str = str(relative_path).lower()

                            # Frontend file detection
                            if (
                                filename
                                in ["app.js", "index.js", "main.js", "frontend.js"]
                                or "frontend" in filename
                                or "frontend" in relative_str
                            ):
                                if not preview_data["frontend"]:
                                    preview_data["frontend"] = (
                                        f"// File: {relative_path}\n{content}"
                                    )

                            # Backend file detection
                            elif (
                                filename
                                in ["server.js", "handlers.js", "backend.js", "api.js"]
                                or "backend" in filename
                                or "server" in filename
                                or "handler" in filename
                            ):
                                if not preview_data["backend"]:
                                    preview_data["backend"] = (
                                        f"// File: {relative_path}\n{content}"
                                    )
                    except UnicodeDecodeError:
                        logger.warning(f"Skipping binary file: {relative_path}")
                        continue
                    except Exception as file_error:
                        logger.error(
                            f"Error reading file {relative_path}: {file_error}"
                        )
                        continue

        # If no main files found, try to use any JavaScript files
        if not preview_data["frontend"]:
            js_files = [
                f
                for f in preview_data["files"].keys()
                if f.endswith(".js") and "server" not in f.lower()
            ]
            if js_files:
                first_js = js_files[0]
                preview_data["frontend"] = (
                    f"// File: {first_js}\n{preview_data['files'][first_js]}"
                )

        if not preview_data["backend"]:
            server_files = [
                f
                for f in preview_data["files"].keys()
                if any(
                    keyword in f.lower()
                    for keyword in ["server", "handler", "backend", "api"]
                )
            ]
            if server_files:
                first_server = server_files[0]
                preview_data["backend"] = (
                    f"// File: {first_server}\n{preview_data['files'][first_server]}"
                )

        # Add metadata
        preview_data["file_count"] = len(preview_data["files"])
        preview_data["has_frontend"] = bool(preview_data["frontend"])
        preview_data["has_backend"] = bool(preview_data["backend"])

        logger.info(
            f"Preview loaded for template {template_name}: {preview_data['file_count']} files, "
            f"frontend: {preview_data['has_frontend']}, backend: {preview_data['has_backend']}"
        )

        return preview_data

    except Exception as e:
        logger.error(f"Error loading template preview for {template_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load template preview: {str(e)}",
        )


@router.get("/{template_name}/files/{file_path:path}")
async def get_template_file(template_name: str, file_path: str):
    """Get a specific file from a template"""
    template_path = TEMPLATES_DIR / template_name
    file_full_path = template_path / file_path

    if not template_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found",
        )

    if not file_full_path.exists() or not file_full_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_path}' not found in template '{template_name}'",
        )

    # Security check: ensure file is within template directory
    try:
        file_full_path.resolve().relative_to(template_path.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: file outside template directory",
        )

    try:
        with open(file_full_path, "r", encoding="utf-8") as f:
            content = f.read()

        return {
            "template_name": template_name,
            "file_path": file_path,
            "content": content,
            "size": len(content),
            "extension": file_full_path.suffix,
        }
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File is not a text file"
        )
    except Exception as e:
        logger.error(
            f"Error reading file {file_path} from template {template_name}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}",
        )


@router.post("/{template_name}/use", response_model=ProjectOutSchema)
async def use_template(
    template_name: str,
    template_use: TemplateUseSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create project from template directory"""
    template_path = TEMPLATES_DIR / template_name

    if not template_path.exists() or not template_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found",
        )

    # Read template metadata
    metadata = get_template_metadata(template_path)
    if metadata is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Template metadata is invalid",
        )

    # Create project in database
    new_project = Project(
        name=template_use.project_name,
        description=template_use.project_description or metadata.get("description", ""),
        project_type=metadata.get("project_type", "web_app"),
        tokens=metadata.get("tokens", []).copy(),
        config=metadata.get("config", {}).copy(),
        user_id=current_user.id,
        template_source=template_name,  # Store which template was used
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return ProjectOutSchema.model_validate(new_project)


@router.get("/health")
async def templates_health_check():
    """Health check for templates endpoint"""
    template_info = []
    if TEMPLATES_DIR.exists():
        for template_dir in TEMPLATES_DIR.iterdir():
            if template_dir.is_dir():
                files = list(template_dir.glob("*"))
                template_info.append(
                    {
                        "name": template_dir.name,
                        "file_count": len(files),
                        "files": [f.name for f in files[:5]],  # Show first 5 files
                    }
                )

    return {
        "templates_directory": str(TEMPLATES_DIR),
        "directory_exists": TEMPLATES_DIR.exists(),
        "available_templates": [d.name for d in TEMPLATES_DIR.iterdir() if d.is_dir()]
        if TEMPLATES_DIR.exists()
        else [],
        "template_details": template_info,
    }


@router.get("/{template_name}/download")
async def download_template(template_name: str):
    """Download template as a ZIP file with all source files"""
    logger.info(f"Download request for template: {template_name}")

    template_path = TEMPLATES_DIR / template_name

    if not template_path.exists() or not template_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found",
        )

    # Define files and folders to exclude
    EXCLUDE_PATTERNS = {
        "node_modules",
        ".git",
        ".vscode",
        "__pycache__",
        ".pytest_cache",
        "venv",
        "env",
        ".env",
        "dist",
        "build",
        ".next",
        "coverage",
        ".coverage",
        ".DS_Store",
        "Thumbs.db",
        "*.log",
        "*.tmp",
        "*.cache",
    }

    def should_exclude(file_path: Path) -> bool:
        """Check if file should be excluded from download"""
        path_parts = file_path.parts

        # Check if any part of the path matches exclude patterns
        for part in path_parts:
            if part in EXCLUDE_PATTERNS:
                return True
            # Check for log files, cache files, etc.
            if (
                part.endswith(".log")
                or part.endswith(".cache")
                or part.endswith(".tmp")
            ):
                return True

        # Exclude very large files (> 10MB)
        try:
            if file_path.stat().st_size > 10 * 1024 * 1024:
                logger.warning(
                    f"Excluding large file: {file_path} ({file_path.stat().st_size} bytes)"
                )
                return True
        except:
            pass

        return False

    try:
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")

        with zipfile.ZipFile(temp_zip.name, "w", zipfile.ZIP_DEFLATED) as zipf:
            file_count = 0
            excluded_count = 0

            for file_path in template_path.rglob("*"):
                if file_path.is_file():
                    if should_exclude(file_path):
                        excluded_count += 1
                        continue

                    arc_name = file_path.relative_to(template_path)
                    zipf.write(file_path, arc_name)
                    file_count += 1

            logger.info(
                f"Created ZIP with {file_count} files, excluded {excluded_count} files"
            )

        def iter_file():
            try:
                with open(temp_zip.name, "rb") as file:
                    while chunk := file.read(8192):
                        yield chunk
            finally:
                try:
                    os.unlink(temp_zip.name)
                except:
                    pass

        return StreamingResponse(
            iter_file(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{template_name}-template.zip"'
            },
        )

    except Exception as e:
        logger.error(f"Error creating ZIP for template {template_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template download: {str(e)}",
        )


@router.get("/{template_name}/download-advanced")
async def download_template_advanced(
    template_name: str,
    include_docs: bool = Query(True, description="Include documentation files"),
    include_config: bool = Query(True, description="Include configuration files"),
    format: str = Query("zip", description="Download format (zip, tar)"),
):
    """Advanced template download with customizable options"""
    template_path = TEMPLATES_DIR / template_name

    if not template_path.exists() or not template_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found",
        )

    try:
        # Create a temporary file
        if format.lower() == "tar":
            import tarfile

            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")

            with tarfile.open(temp_file.name, "w:gz") as tar:
                for file_path in template_path.rglob("*"):
                    if file_path.is_file():
                        # Apply filters
                        should_include = True

                        if not include_docs and file_path.suffix.lower() in [
                            ".md",
                            ".txt",
                            ".rst",
                        ]:
                            should_include = False

                        if not include_config and file_path.name.lower() in [
                            "config.json",
                            ".env",
                            "settings.py",
                        ]:
                            should_include = False

                        if should_include:
                            arc_name = file_path.relative_to(template_path)
                            tar.add(file_path, arcname=arc_name)

            media_type = "application/gzip"
            filename = f"{template_name}-template.tar.gz"

        else:  # Default to ZIP
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")

            with zipfile.ZipFile(temp_file.name, "w", zipfile.ZIP_DEFLATED) as zipf:
                for file_path in template_path.rglob("*"):
                    if file_path.is_file():
                        # Apply filters
                        should_include = True

                        if not include_docs and file_path.suffix.lower() in [
                            ".md",
                            ".txt",
                            ".rst",
                        ]:
                            should_include = False

                        if not include_config and file_path.name.lower() in [
                            "config.json",
                            ".env",
                            "settings.py",
                        ]:
                            should_include = False

                        if should_include:
                            arc_name = file_path.relative_to(template_path)
                            zipf.write(file_path, arc_name)

            media_type = "application/zip"
            filename = f"{template_name}-template.zip"

        # Create streaming response
        def iter_file():
            with open(temp_file.name, "rb") as file:
                yield from file

        # Cleanup function
        def cleanup():
            try:
                import os

                os.unlink(temp_file.name)
            except:
                pass

        response = StreamingResponse(
            iter_file(),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(os.path.getsize(temp_file.name)),
            },
        )

        # Schedule cleanup
        import threading

        threading.Timer(1.0, cleanup).start()

        logger.info(f"Advanced template {template_name} downloaded as {format}")
        return response

    except Exception as e:
        logger.error(f"Error creating {format} for template {template_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template download: {str(e)}",
        )


# Add this to the health check endpoint to show download capabilities
@router.get("/download-info")
async def get_download_info():
    """Get information about template download capabilities"""
    return {
        "supported_formats": ["zip", "tar"],
        "features": {
            "basic_download": "Download entire template as ZIP",
            "advanced_download": "Download with filtering options",
            "streaming": "Efficient streaming for large templates",
        },
        "endpoints": {
            "basic": "/api/v1/templates/{template_name}/download",
            "advanced": "/api/v1/templates/{template_name}/download-advanced",
        },
    }
