# user_backend/app/services/sevdo_service.py
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
                    f"{self.sevdo_backend_url}/api/translate/to-s-direct",  # Use new endpoint
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
            return {"success": False, "error": str(e)}

    async def generate_frontend_code(
        self,
        dsl_content: str,
        include_imports: bool = True,
        component_name: str = "GeneratedComponent",
    ) -> Dict[str, Any]:
        """Generate frontend code using SEVDO frontend service"""

        with tempfile.TemporaryDirectory() as temp_dir:
            input_file = Path(temp_dir) / "input.txt"
            output_file = Path(temp_dir) / "output.jsx"

            # Write DSL content to input file
            input_file.write_text(dsl_content)

            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"{self.sevdo_frontend_url}/api/fe-translate/to-s",
                        json={
                            "input_path": str(input_file),
                            "output_path": str(output_file),
                            "include_imports": include_imports,
                            "component_name": component_name,
                            "use_cache": True,
                        },
                        timeout=self.timeout,
                    )
                    response.raise_for_status()

                    if output_file.exists():
                        generated_code = output_file.read_text()

                        return {
                            "success": True,
                            "code": generated_code,
                            "component_name": component_name,
                            "metadata": response.json(),
                        }
                    else:
                        raise Exception("Generated file not found")

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
        }

        # Generate backend code
        backend_result = await self.generate_backend_code(
            backend_tokens, include_imports
        )
        results["backend"] = backend_result

        # Generate frontend code if DSL provided
        if frontend_dsl:
            frontend_result = await self.generate_frontend_code(
                frontend_dsl, include_imports, f"{project_name}Component"
            )
            results["frontend"] = frontend_result

        # Determine overall success
        results["success"] = backend_result.get("success", False)
        if frontend_dsl:
            results["success"] = results["success"] and results["frontend"].get(
                "success", False
            )

        return results


# Create singleton instance
sevdo_service = SevdoIntegrationService()
