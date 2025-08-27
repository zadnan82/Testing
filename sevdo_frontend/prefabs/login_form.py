# sevdo_frontend/prefabs/login_form.py
def render_prefab(args, props):
    # Default values
    title = "Login to Your Account"
    email_label = props.get("emailLabel", "Email")
    password_label = props.get("passwordLabel", "Password")
    signin_text = props.get("buttonText", "Sign In")
    forgot_text = props.get("forgotText", "Forgot Password?")
    
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
                    # Replace button text if b() token is found
                    if node.token == "b" and node.args:
                        signin_text = node.args
                    # Replace title if h() token is found  
                    elif node.token == "h" and node.args:
                        title = node.args
        except Exception:
            # If parsing fails, just use args as the title
            title = args
            
    # Generate full form with customized parts
    return f"""<form className="max-w-md mx-auto p-6">
  <h1>{title}</h1>
  <div className="flex flex-col gap-4">
    <label className="block">
      <span className="mb-1 block">{email_label}</span>
      <input className="border rounded px-3 py-2 w-full" placeholder="Enter your email" />
    </label>
    <label className="block">
      <span className="mb-1 block">{password_label}</span>
      <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Enter your password" />
    </label>
    <div className="flex flex-row gap-2 mt-4">
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded">{signin_text}</button>
      <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded">{forgot_text}</button>
    </div>
  </div>
</form>"""

# Register with token "lf"
COMPONENT_TOKEN = "lf"
