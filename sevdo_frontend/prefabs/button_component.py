# sevdo_frontend/prefabs/button_component.py

def render_prefab(args, props):
    # Default values
    text = props.get("text", props.get("label", "Click"))
    href = props.get("href")
    on_click = props.get("onClick")
    size = props.get("size", "md")  # sm | md | lg
    variant = props.get("variant", "primary")  # primary | secondary | danger
    extra_class = props.get("class", "")

    # Support for nested components
    # If the args is a nested structure like "t(Custom Text)" or "b(Custom Text)"
    # we can extract and use those values
    if args:
        # Import parser when needed to avoid circular imports
        import sys
        import os
        # Get the parent directory path
        parent_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.append(parent_dir)
        # Import directly from the file
        from frontend_compiler import parse_dsl
        try:
            # Try to parse args as DSL
            nodes = parse_dsl(args)
            if nodes:
                for node in nodes:
                    # Prefer explicit text from tokens
                    if node.token in ("b", "t", "h") and node.args:
                        text = node.args
        except Exception:
            # If parsing fails, just use args as the text
            text = args

    # Size-based classes
    if size == "sm":
        size_classes = "px-3 py-1.5 text-sm"
    elif size == "lg":
        size_classes = "px-5 py-3 text-base"
    else:
        size_classes = "px-4 py-2 text-sm"

    if variant == "secondary":
        palette = "bg-gray-500 hover:bg-gray-600 text-white"
    elif variant == "danger":
        palette = "bg-red-600 hover:bg-red-700 text-white"
    else:
        palette = "bg-blue-600 hover:bg-blue-700 text-white"

    base_classes = f"{palette} font-medium rounded"
    class_name = f"{base_classes} {size_classes}"
    if extra_class:
        class_name = f"{class_name} {extra_class}"

    handler = f" onClick={{{on_click}}}" if on_click else ""

    if href:
        return f"""<a className="{class_name}" href="{href}"{handler}>{text}</a>"""
    return f"""<button className="{class_name}"{handler}>{text}</button>"""


# Register with token "b" to override the built-in button
COMPONENT_TOKEN = "b"


# b(Save){variant=secondary, size=lg}
# b(Delete){variant=danger, onClick=handleDelete}
# b(Learn more){variant=primary, href=/docs, size=sm}
