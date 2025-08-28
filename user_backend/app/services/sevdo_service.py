# user_backend/app/services/sevdo_service.py - UPDATED VERSION

import httpx
import tempfile
import os
from pathlib import Path
from typing import List, Dict, Any
from user_backend.app.core.logging_config import StructuredLogger

logger = StructuredLogger(__name__)


class SevdoIntegrationService:
    """Service to integrate SEVDO code generation with user backend"""

    def __init__(self):
        # Use Docker service names as defaults
        self.sevdo_backend_url = os.getenv(
            "SEVDO_BACKEND_URL", "http://sevdo-backend:8001"
        )
        self.sevdo_frontend_url = os.getenv(
            "SEVDO_FRONTEND_URL", "http://sevdo-frontend:8002"
        )
        self.timeout = 60.0

    async def generate_backend_code(
        self, tokens: List[str], include_imports: bool = True
    ):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.sevdo_backend_url}/api/translate/to-s-direct",  # Use direct endpoint
                    json={
                        "tokens": tokens,  # Send tokens directly
                        "include_imports": include_imports,
                        "use_cache": True,
                    },
                    timeout=self.timeout,
                )
                response.raise_for_status()

                result = response.json()
                return {
                    "success": True,
                    "code": result["generated_code"],
                    "tokens": tokens,
                    "metadata": result,
                }
        except Exception as e:
            logger.error(f"Backend generation failed: {str(e)}")
            return {"success": False, "error": str(e)}

    async def generate_frontend_code(
        self,
        dsl_content: str,
        include_imports: bool = True,
        component_name: str = "GeneratedComponent",
    ) -> Dict[str, Any]:
        """Generate frontend code using SEVDO frontend service - UPDATED"""

        try:
            async with httpx.AsyncClient() as client:
                # 🚀 NEW: Use direct DSL endpoint (no files needed)
                logger.info(f"Generating frontend with DSL: {dsl_content[:100]}...")

                response = await client.post(
                    f"{self.sevdo_frontend_url}/api/fe-translate/to-s-direct",
                    json={
                        "dsl_content": dsl_content,
                        "include_imports": include_imports,
                        "component_name": component_name,
                        "use_cache": True,
                    },
                    timeout=self.timeout,
                )
                response.raise_for_status()

                result = response.json()

                if result.get("success"):
                    logger.info("✅ Frontend generated successfully")
                    return {
                        "success": True,
                        "code": result["code"],
                        "component_name": component_name,
                        "metadata": result,
                    }
                else:
                    raise Exception(f"Frontend service returned error: {result}")

        except httpx.RequestError as e:
            logger.error(f"SEVDO frontend request failed: {str(e)}")
            return {
                "success": False,
                "error": f"Frontend service error: {str(e)}",
            }
        except Exception as e:
            logger.error(f"Frontend generation failed: {str(e)}")
            return {"success": False, "error": str(e)}

    async def generate_full_project(
        self,
        project_name: str,
        backend_tokens: List[str],
        frontend_dsl: str = None,
        include_imports: bool = True,
    ) -> Dict[str, Any]:
        """Generate both backend and frontend code for a complete project"""

        results = {
            "project_name": project_name,
            "backend": None,
            "frontend": None,
            "success": False,
            "errors": [],
        }

        # Generate backend code
        logger.info(f"🔧 Generating backend for project: {project_name}")
        backend_result = await self.generate_backend_code(
            backend_tokens, include_imports
        )
        results["backend"] = backend_result

        if not backend_result.get("success"):
            results["errors"].append(
                f"Backend: {backend_result.get('error', 'Unknown error')}"
            )

        # Generate frontend code if DSL provided
        if frontend_dsl and frontend_dsl.strip():
            logger.info(f"🎨 Generating frontend for project: {project_name}")
            frontend_result = await self.generate_frontend_code(
                frontend_dsl,
                include_imports,
                f"{project_name.replace(' ', '')}Component",
            )
            results["frontend"] = frontend_result

            if not frontend_result.get("success"):
                results["errors"].append(
                    f"Frontend: {frontend_result.get('error', 'Unknown error')}"
                )
        else:
            logger.info("⚠️ No frontend DSL provided, skipping frontend generation")

        # Determine overall success
        results["success"] = (
            results["backend"] and results["backend"].get("success", False)
        ) or (results["frontend"] and results["frontend"].get("success", False))

        if results["success"]:
            logger.info(f"🎉 Project {project_name} generated successfully!")
        else:
            logger.warning(
                f"⚠️ Project {project_name} completed with errors: {results['errors']}"
            )

        return results


# Create singleton instance
sevdo_service = SevdoIntegrationService()
