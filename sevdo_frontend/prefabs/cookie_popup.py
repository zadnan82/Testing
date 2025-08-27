# sevdo_frontend/prefabs/cookie_popup.py
def render_prefab(args, props):
    # Default values
    title = props.get("title", "We use cookies")
    message = props.get(
        "message",
        "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.",
    )
    accept_text = props.get("acceptText", "Accept All")
    reject_text = props.get("rejectText", "Reject")
    settings_text = props.get("settingsText", "Cookie Settings")
    position = props.get("position", "bottom")  # bottom, top
    style = props.get("style", "banner")  # banner, modal

    # Support for nested components
    if args:
        import sys
        import os

        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.append(parent_dir)
        from frontend_compiler import parse_dsl, _jsx_for_token

        try:
            nodes = parse_dsl(args)
            if nodes:
                for node in nodes:
                    if node.token == "h" and node.args:
                        title = node.args
                    elif node.token == "t" and node.args:
                        message = node.args
                    elif node.token == "b" and node.args:
                        accept_text = node.args
        except Exception:
            title = args if args else title

    # Position classes
    position_class = "bottom-0" if position == "bottom" else "top-0"

    # Style variants
    if style == "modal":
        return f"""<div id="cookie-popup" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full shadow-xl">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 mb-6 text-sm">{message}</p>
    <div className="flex flex-col sm:flex-row gap-3">
      <button 
        onClick={{() => document.getElementById('cookie-popup').remove()}}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {accept_text}
      </button>
      <button 
        onClick={{() => document.getElementById('cookie-popup').remove()}}
        className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {reject_text}
      </button>
      <button 
        onClick={{() => console.log('Cookie settings clicked')}}
        className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {settings_text}
      </button>
    </div>
  </div>
</div>"""

    # Banner style (default)
    return f"""<div id="cookie-popup" className="fixed {position_class} left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex-1">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
    <div className="flex flex-wrap gap-3 flex-shrink-0">
      <button 
        onClick={{() => document.getElementById('cookie-popup').remove()}}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {accept_text}
      </button>
      <button 
        onClick={{() => document.getElementById('cookie-popup').remove()}}
        className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {reject_text}
      </button>
      <button 
        onClick={{() => console.log('Cookie settings clicked')}}
        className="border border-gray-500 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
      >
        {settings_text}
      </button>
    </div>
  </div>
</div>"""


# Register with token "co"
COMPONENT_TOKEN = "co"
