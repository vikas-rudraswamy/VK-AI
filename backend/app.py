
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# --------------------------------
# ENVIRONMENT CONFIGURATION
# --------------------------------

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# --------------------------------
# FLASK INITIALIZATION
# --------------------------------

app = Flask(__name__)

# Allow local and deployed React frontend
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", "")
]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                origin for origin in allowed_origins if origin
            ]
        }
    }
)

# --------------------------------
# GEMINI INITIALIZATION
# --------------------------------

client = (
    genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(
            api_version="v1beta"
        )
    )
    if API_KEY else None
)

# --------------------------------
# HEALTH CHECK
# --------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "VK AI backend is running"
    }), 200


# --------------------------------
# CHAT API
# --------------------------------

@app.route("/api/chat", methods=["POST"])
def chat():

    try:
        # Check API key
        if not API_KEY or not client:
            return jsonify({
                "error": "Gemini API key is not configured on the server."
            }), 500

        # Read request data
        data = request.get_json(silent=True) or {}

        message = data.get("message", "").strip()
        history = data.get("history", [])

        if not message:
            return jsonify({
                "error": "Please enter a message."
            }), 400

        # Prepare conversation history
        contents = []

        for item in history:
            role = item.get("role")
            text = item.get("text", "")

            if role in ["user", "model"] and text:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text)]
                    )
                )

        # Add current message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)]
            )
        )

        # Generate Gemini response
        response = client.models.generate_content(
            model=MODEL,
            contents=contents
        )

        reply = response.text

        if not reply:
            return jsonify({
                "error": "Gemini returned an empty response."
            }), 502

        return jsonify({
            "reply": reply
        }), 200

    except Exception as e:
        app.logger.exception("Gemini API error")

        return jsonify({
            "error": str(e)
        }), 502


# --------------------------------
# START LOCAL DEVELOPMENT SERVER
# --------------------------------

if __name__ == "__main__":

    print("================================")
    print("          VK AI BACKEND")
    print("================================")
    print("Server: http://127.0.0.1:5000")
    print("Health: http://127.0.0.1:5000/api/health")
    print("================================")

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=False
    )
