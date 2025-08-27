# sevdo_frontend/prefabs/chat_component.py
def render_prefab(args, props):
    # Default values
    title = props.get("title", "Chat")
    placeholder = props.get("placeholder", "Type your message...")
    send_text = props.get("sendText", "Send")
    chat_height = props.get("height", "400px")
    
    # Support for nested components 
    # If the args is a nested structure like "b(Custom Button Text)" 
    # we can extract and use those values
    if args:
        # Import parser when needed to avoid circular imports
        import sys
        import os
        # Get the parent directory path
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.append(parent_dir)
        # Import directly from the file
        from frontend_compiler import parse_dsl, _jsx_for_token
        try:
            # Try to parse args as DSL
            nodes = parse_dsl(args)
            if nodes:
                for node in nodes:
                    # Replace send button text if b() token is found
                    if node.token == "b" and node.args:
                        send_text = node.args
                    # Replace title if h() token is found  
                    elif node.token == "h" and node.args:
                        title = node.args
                    # Replace placeholder if p() token is found
                    elif node.token == "p" and node.args:
                        placeholder = node.args
        except Exception:
            # If parsing fails, just use args as the title
            title = args
            
    # Generate chat component with customized parts
    return f"""<div className="max-w-2xl mx-auto p-4 border rounded-lg">
  <h2 className="text-xl font-bold mb-4">{title}</h2>
  <div className="chat-container" style={{{{height: '{chat_height}'}}}}>
    <div className="chat-messages bg-gray-50 p-4 rounded-lg mb-4 overflow-y-auto" style={{{{height: 'calc({chat_height} - 100px)'}}}}>
      <div className="message mb-2">
        <div className="bg-blue-500 text-white p-2 rounded-lg max-w-xs">
          Hello! How can I help you today?
        </div>
      </div>
      <div className="message mb-2 flex justify-end">
        <div className="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
          Hi there! I'm looking for some information.
        </div>
      </div>
    </div>
    <div className="chat-input flex gap-2">
      <input 
        className="flex-1 border rounded-lg px-3 py-2" 
        placeholder="{placeholder}"
        type="text"
      />
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg">
        {send_text}
      </button>
    </div>
  </div>
</div>"""

# Register with token "ch"
COMPONENT_TOKEN = "ch"
