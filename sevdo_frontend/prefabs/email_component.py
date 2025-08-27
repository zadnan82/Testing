# sevdo_frontend/prefabs/email_component.py
def render_prefab(args, props):
    # Default values
    title = props.get("title", "Compose Email")
    to_label = props.get("toLabel", "To")
    subject_label = props.get("subjectLabel", "Subject")
    message_label = props.get("messageLabel", "Message")
    send_text = props.get("sendText", "Send Email")
    draft_text = props.get("draftText", "Save Draft")
    
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
                    # Replace subject if s() token is found
                    elif node.token == "s" and node.args:
                        subject_label = node.args
        except Exception:
            # If parsing fails, just use args as the title
            title = args
            
    # Generate email composer with customized parts
    return f"""<div className="max-w-2xl mx-auto p-6 border rounded-lg bg-white">
  <h2 className="text-2xl font-bold mb-6">{title}</h2>
  <form className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-1">{to_label}</label>
      <input 
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        placeholder="recipient@example.com"
        type="email"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">{subject_label}</label>
      <input 
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        placeholder="Enter subject line"
        type="text"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">{message_label}</label>
      <textarea 
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-vertical" 
        placeholder="Write your message here..."
      ></textarea>
    </div>
    <div className="flex gap-3 pt-4">
      <button 
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
      >
        {send_text}
      </button>
      <button 
        type="button"
        className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg"
      >
        {draft_text}
      </button>
    </div>
  </form>
</div>"""

# Register with token "em"
COMPONENT_TOKEN = "em"
