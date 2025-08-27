#!/usr/bin/env python3
"""
Playground Server for Frontend DSL Compiler

This server provides a development environment for testing frontend applications
using the DSL compiler. It automatically watches for changes in input_files/
and recompiles them to JSX, then serves them as a web application.
"""

import os
import sys
import time
import json
import asyncio
import threading
from pathlib import Path
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.websockets import WebSocket, WebSocketDisconnect
import websockets
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add the parent directory to Python path to import frontend_compiler
sys.path.insert(0, str(Path(__file__).parent.parent))

from sevdo_frontend.frontend_compiler import dsl_to_jsx, load_prefabs

# Configuration
INPUT_DIR = Path(__file__).parent / "input_files"
OUTPUT_DIR = Path(__file__).parent / "output_files"
TEMPLATES_DIR = Path(__file__).parent / "templates"

# Ensure directories exist
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

# Global state for file watching
file_change_connections: List[WebSocket] = []
observer: Optional[Observer] = None

class FileChangeHandler(FileSystemEventHandler):
    """Handles file system events for input files."""

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.txt'):
            print(f"File changed: {event.src_path}")
            compile_file(Path(event.src_path))
            # Notify all connected clients
            asyncio.run(notify_clients())

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.txt'):
            print(f"File created: {event.src_path}")
            compile_file(Path(event.src_path))
            asyncio.run(notify_clients())

def compile_file(input_path: Path):
    """Compile a single DSL file to JSX."""
    try:
        # Read the DSL content
        dsl_content = input_path.read_text(encoding='utf-8')

        # Generate component name from filename (sanitize for JavaScript)
        base_name = input_path.stem
        # Replace spaces and special chars with underscores, capitalize each word
        component_name = ''.join(word.title() for word in base_name.replace(' ', '_').replace('-', '_').split('_') if word) + "Component"

        # Compile to JSX
        jsx_content = dsl_to_jsx(
            dsl_content,
            include_imports=True,
            component_name=component_name
        )

        # Write to output file
        output_path = OUTPUT_DIR / f"{input_path.stem}.jsx"
        output_path.write_text(jsx_content, encoding='utf-8')

        print(f"Compiled {input_path} -> {output_path}")
        return True

    except Exception as e:
        print(f"Error compiling {input_path}: {e}")
        return False

def compile_all_files():
    """Compile all DSL files in input directory."""
    compiled_count = 0
    for input_file in INPUT_DIR.glob("*.txt"):
        if compile_file(input_file):
            compiled_count += 1
    print(f"Compiled {compiled_count} files")
    return compiled_count

async def notify_clients():
    """Notify all connected WebSocket clients of file changes."""
    message = {"type": "files_changed", "timestamp": time.time()}
    disconnected = []

    for ws in file_change_connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(ws)

    # Remove disconnected clients
    for ws in disconnected:
        if ws in file_change_connections:
            file_change_connections.remove(ws)

def start_file_watcher():
    """Start the file system watcher."""
    global observer
    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, str(INPUT_DIR), recursive=False)
    observer.start()
    print(f"Started watching {INPUT_DIR}")

def stop_file_watcher():
    """Stop the file system watcher."""
    global observer
    if observer:
        observer.stop()
        observer.join()
        print("Stopped file watcher")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_prefabs()
    compile_all_files()
    start_file_watcher()
    yield
    # Shutdown
    stop_file_watcher()

# Create FastAPI app
app = FastAPI(lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory=str(OUTPUT_DIR)), name="static")

# Setup templates
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main playground interface."""
    # Get list of available files
    input_files = []
    for f in INPUT_DIR.glob("*.txt"):
        output_file = OUTPUT_DIR / f"{f.stem}.jsx"
        input_files.append({
            "name": f.stem,
            "input_path": str(f),
            "output_path": str(output_file),
            "exists": output_file.exists(),
            "last_modified": f.stat().st_mtime if f.exists() else 0
        })

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "input_files": input_files,
            "input_dir": str(INPUT_DIR),
            "output_dir": str(OUTPUT_DIR)
        }
    )

@app.get("/files")
async def list_files():
    """API endpoint to list all input and output files."""
    input_files = []
    output_files = []

    for f in INPUT_DIR.glob("*.txt"):
        output_file = OUTPUT_DIR / f"{f.stem}.jsx"
        input_files.append({
            "name": f.stem,
            "path": str(f),
            "last_modified": f.stat().st_mtime,
            "has_output": output_file.exists()
        })

    for f in OUTPUT_DIR.glob("*.jsx"):
        output_files.append({
            "name": f.stem,
            "path": str(f),
            "last_modified": f.stat().st_mtime
        })

    return {
        "input_files": input_files,
        "output_files": output_files
    }

@app.post("/compile/{filename}")
async def compile_single_file(filename: str):
    """API endpoint to manually compile a specific file."""
    input_path = INPUT_DIR / f"{filename}.txt"
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    success = compile_file(input_path)
    if success:
        await notify_clients()
        return {"success": True, "message": f"Compiled {filename}"}
    else:
        raise HTTPException(status_code=500, detail="Compilation failed")

@app.post("/compile-all")
async def compile_all():
    """API endpoint to compile all files."""
    count = compile_all_files()
    await notify_clients()
    return {"success": True, "message": f"Compiled {count} files"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time file change notifications."""
    await websocket.accept()
    file_change_connections.append(websocket)

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in file_change_connections:
            file_change_connections.remove(websocket)

@app.get("/view/{filename}")
async def view_component(filename: str):
    """Serve a specific compiled component."""
    jsx_file = OUTPUT_DIR / f"{filename}.jsx"
    if not jsx_file.exists():
        raise HTTPException(status_code=404, detail="Component not found")

    jsx_content = jsx_file.read_text(encoding='utf-8')
    
    # Extract just the JSX return content
    import re
    return_match = re.search(r'return \((.*?)\);', jsx_content, re.DOTALL)
    jsx_body = return_match.group(1).strip() if return_match else '<div>Error parsing component</div>'

    # Create a simple HTML wrapper for the JSX component
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{filename} - Playground</title>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .component-container {{
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
        </style>
    </head>
    <body>
        <div class="component-container">
            <h2>{filename} Component</h2>
            <div id="root"></div>
        </div>

        <script type="text/babel">
            // Define the component with extracted JSX
            function MyComponent() {{
                return (
                    {jsx_body}
                );
            }}

            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<MyComponent />);
        </script>
    </body>
    </html>
    """

    return HTMLResponse(html_content)

def create_default_files():
    """Create some default example files if the input directory is empty."""
    if list(INPUT_DIR.glob("*.txt")):
        return  # Don't create if files already exist

    examples = {
        "hello_world.txt": """h(Hello World)
t(This is a simple example of the frontend DSL)
b(Say Hello, onClick=alert('Hello!'))""",

        "form_example.txt": """f(
h(Contact Form)
i(Your Name, label=Name)
i(your.email@example.com, label=Email)
sel(home,work, label=Department, home,work)
b(Submit Form, onClick=alert('Form submitted!'))
)""",

        "layout_example.txt": """c(class=gap-6)
h(Main Layout)
c(class=gap-4)
t(This is a nested container example)
b(Button 1)
b(Button 2)
c(class=gap-2)
t(Sub section)
i(Enter text here)
sel(option1,option2,option3)
""",

        "image_example.txt": """c(class=gap-4 items-center)
h(Image Gallery)
img(https://via.placeholder.com/300x200?text=Sample+Image, alt=Sample Image)
t(This is an example of using images in the DSL)
b(View More Images)
"""
    }

    for filename, content in examples.items():
        file_path = INPUT_DIR / filename
        file_path.write_text(content, encoding='utf-8')
        print(f"Created example file: {filename}")

if __name__ == "__main__":
    # Create default example files if needed
    create_default_files()

    # Start the server
    print("Starting Playground Server...")
    print(f"Input files: {INPUT_DIR}")
    print(f"Output files: {OUTPUT_DIR}")
    print("Open http://localhost:8000 in your browser")

    uvicorn.run(
        "playground_server:app",
        host="localhost",
        port=8000,
        reload=False,  # We handle reloading ourselves
        log_level="info"
    )

