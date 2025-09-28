from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
GEMINI_API_KEY = "AIzaSyALEJwaIWproXfvL5kjufbIRuTFhZCEryg"  # Your API key

# Tool definitions for function calling
available_functions = {
    "send_email": {
        "description": "Send an email to someone",
        "parameters": ["to", "subject", "body"]
    },
    "schedule_event": {
        "description": "Add an event to the calendar",
        "parameters": ["title", "date", "time"]
    }
}


# Function implementations
def send_email(to, subject, body):
    """Simulate sending an email"""
    return f"📧 Email sent to {to} with subject '{subject}'\nBody: {body}"


def schedule_event(title, date, time):
    """Simulate scheduling a calendar event"""
    return f"📅 Event '{title}' scheduled for {date} at {time}"


def extract_function_calls(text):
    """Extract function calls from Gemini's response text"""
    functions_called = []

    # Look for email-related commands
    email_patterns = [
        r"send.*?email.*?to\s+([^\s,]+).*?subject[:\s]+([^,\n]+).*?body[:\s]+(.*?)(?:\n|$)",
        r"email.*?([^\s,]+).*?about\s+(.*?)(?:\.|$)",
        r"write.*?email.*?to\s+([^\s,]+).*?(?:about\s+)?(.*?)(?:\.|$)"
    ]

    for pattern in email_patterns:
        matches = re.search(pattern, text.lower())
        if matches:
            if len(matches.groups()) == 3:
                to, subject, body = matches.groups()
                functions_called.append({
                    "function": "send_email",
                    "args": {
                        "to": to.strip(),
                        "subject": subject.strip(),
                        "body": body.strip()
                    }
                })
            elif len(matches.groups()) == 2:
                to, content = matches.groups()
                functions_called.append({
                    "function": "send_email",
                    "args": {
                        "to": to.strip(),
                        "subject": "Email from Assistant",
                        "body": content.strip()
                    }
                })

    # Look for scheduling commands
    schedule_patterns = [
        r"schedule.*?(?:meeting|event).*?['\"]([^'\"]+)['\"].*?on\s+([0-9-]+).*?at\s+([0-9:]+)",
        r"(?:add|create).*?event.*?['\"]([^'\"]+)['\"].*?([0-9-]+).*?([0-9:]+)",
        r"schedule.*?([^,\n]+).*?for\s+([0-9-]+).*?at\s+([0-9:]+)"
    ]

    for pattern in schedule_patterns:
        matches = re.search(pattern, text.lower())
        if matches:
            title, date, time = matches.groups()
            functions_called.append({
                "function": "schedule_event",
                "args": {
                    "title": title.strip(),
                    "date": date.strip(),
                    "time": time.strip()
                }
            })

    return functions_called


# Global chat session variable
chat_sessions = {}


def get_or_create_chat_session(session_id="default"):
    """Get or create a chat session for a user"""
    if session_id not in chat_sessions:
        try:
            genai.configure(api_key=GEMINI_API_KEY)

            # Try different model names
            model_names = [
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-pro'
            ]

            model = None
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    print(f"✅ Using model: {model_name}")
                    break
                except Exception as model_error:
                    print(f"Failed to load {model_name}: {model_error}")
                    continue

            if not model:
                raise Exception("Could not initialize any Gemini model")

            # System instruction
            system_instruction = """
You are a helpful AI assistant integrated into a task management app. You can help with:
- General conversations and questions
- Email composition and sending
- Event scheduling  
- Task management advice
- Productivity tips

When users want to send emails or schedule events, provide clear details. Otherwise, respond naturally and helpfully.

Keep responses concise but informative. Be friendly and professional.
"""

            chat_session = model.start_chat(history=[])
            chat_session.send_message(system_instruction)
            chat_sessions[session_id] = chat_session

        except Exception as e:
            print(f"Error creating chat session: {e}")
            return None

    return chat_sessions[session_id]


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        session_id = data.get('session_id', 'default')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Get chat session
        chat_session = get_or_create_chat_session(session_id)
        if not chat_session:
            return jsonify({'error': 'Failed to initialize AI chat session'}), 500

        # Send message to Gemini
        response = chat_session.send_message(user_message)
        ai_response = response.text

        # Check for function calls
        functions_called = extract_function_calls(user_message + " " + ai_response)
        function_outputs = []

        if functions_called:
            for func_call in functions_called:
                fn_name = func_call["function"]
                fn_args = func_call["args"]

                if fn_name == "send_email":
                    output = send_email(**fn_args)
                    function_outputs.append(output)
                elif fn_name == "schedule_event":
                    output = schedule_event(**fn_args)
                    function_outputs.append(output)

        # Combine AI response with function outputs
        final_response = ai_response
        if function_outputs:
            final_response += "\n\n" + "\n".join(function_outputs)

        return jsonify({
            'response': final_response,
            'functions_executed': len(functions_called)
        })

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/reset-chat', methods=['POST'])
def reset_chat():
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')

        if session_id in chat_sessions:
            del chat_sessions[session_id]

        return jsonify({'message': 'Chat session reset successfully'})
    except Exception as e:
        return jsonify({'error': f'Error resetting chat: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'Server is running', 'chat_sessions': len(chat_sessions)})


if __name__ == '__main__':
    print("🚀 Starting Flask server with Gemini AI integration...")
    print("🔧 Make sure your GEMINI_API_KEY is set correctly")
    print("🌐 Server will run on http://localhost:5000")
    print("📱 Make sure your React app can connect to this server")
    print("-" * 50)

    app.run(debug=True, host='0.0.0.0', port=5000)