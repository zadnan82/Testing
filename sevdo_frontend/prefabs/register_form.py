# sevdo_frontend/prefabs/register_form.py
def render_prefab(args, props):
    # Default values
    title = "Create Your Account"
    name_label = props.get("nameLabel", "Full Name")
    email_label = props.get("emailLabel", "Email")
    password_label = props.get("passwordLabel", "Password")
    confirm_password_label = props.get("confirmPasswordLabel", "Confirm Password")
    register_text = props.get("buttonText", "Register")
    login_text = props.get("loginText", "Already have an account? Login")
    
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
                        register_text = node.args
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
      <span className="mb-1 block">{name_label}</span>
      <input className="border rounded px-3 py-2 w-full" placeholder="Enter your full name" />
    </label>
    <label className="block">
      <span className="mb-1 block">{email_label}</span>
      <input className="border rounded px-3 py-2 w-full" type="email" placeholder="Enter your email" />
    </label>
    <label className="block">
      <span className="mb-1 block">{password_label}</span>
      <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Enter your password" />
    </label>
    <label className="block">
      <span className="mb-1 block">{confirm_password_label}</span>
      <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Confirm your password" />
    </label>
    <div className="flex flex-col gap-2 mt-4">
      <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded">{register_text}</button>
      <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded text-sm">{login_text}</button>
    </div>
  </div>
</form>"""

# Register with token "rf"
COMPONENT_TOKEN = "rf"
