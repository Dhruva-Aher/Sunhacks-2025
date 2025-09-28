import google.generativeai as genai
import os
import json
import re

# Configuration
GEMINI_API_KEY = ""  # Add your API key here or use environment variable

# Tool definitions for function calling (for instruction purposes)
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
    print(f"📧 Sending email to {to} with subject '{subject}'")
    print(f"Body: {body}")
    print("-" * 50)


def schedule_event(title, date, time):
    """Simulate scheduling a calendar event"""
    print(f"📅 Scheduling event '{title}' on {date} at {time}")
    print("-" * 50)


def list_available_models():
    """List available Gemini models"""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        models = genai.list_models()
        print("Available models:")
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name}")
        return True
    except Exception as e:
        print(f"Error listing models: {e}")
        return False


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
chat_session = None


def initialize_chat_session():
    """Initialize the Gemini chat session"""
    global chat_session

    try:
        # Configure the API
        genai.configure(api_key=GEMINI_API_KEY)

        # Create the model (try different model names if one fails)
        model_names = [
            'models/gemini-2.5-flash',  # Latest fast model
            'models/gemini-2.5-pro',  # Latest powerful model
            'models/gemini-2.0-flash',  # Stable 2.0 flash
            'models/gemini-flash-latest',  # Always latest flash
            'models/gemini-pro-latest'  # Always latest pro
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
            print("Could not initialize any Gemini model. Available models:")
            list_available_models()
            return False

        # Create system instruction for the chat
        system_instruction = """
You are an AI assistant that can help with emails and scheduling. You remember our entire conversation.

Available functions:
- send_email(to, subject, body): Send an email
- schedule_event(title, date, time): Schedule an event

When users want to send emails or schedule events, provide clear details. Otherwise, respond naturally and remember what we've discussed.
"""

        # Start the chat session with system instruction
        chat_session = model.start_chat(history=[])

        # Send the system instruction as the first message (optional)
        chat_session.send_message(system_instruction)

        return True

    except Exception as e:
        print(f"Error initializing chat session: {e}")
        return False


def process_gemini_response(user_input):
    """Process user input through Gemini chat session and handle function calls"""
    global chat_session

    try:
        # Initialize chat session if not already done
        if chat_session is None:
            if not initialize_chat_session():
                return

        # Send message to chat session (automatically maintains context)
        response = chat_session.send_message(user_input)

        # Check for function calls in the response
        functions_called = extract_function_calls(user_input + " " + response.text)

        if functions_called:
            for func_call in functions_called:
                fn_name = func_call["function"]
                fn_args = func_call["args"]

                print(f"🔧 Executing function: {fn_name}")

                if fn_name == "send_email":
                    send_email(**fn_args)
                elif fn_name == "schedule_event":
                    schedule_event(**fn_args)
        else:
            # Regular text response
            print("Gemini:", response.text)

    except Exception as e:
        print(f"Error processing request: {e}")
        if "API_KEY" in str(e):
            print("Make sure your GEMINI_API_KEY is set correctly.")
        else:
            print("This might be a connection or API issue.")
            # Reset chat session on error
            chat_session = None


def main():
    """Main chat loop"""
    print("Gemini Chatbot with Function Calling & Memory")
    print("Type 'quit' to exit, 'models' to list available models, 'reset' to clear conversation")
    print("-" * 50)

    # Check if API key is set
    if not GEMINI_API_KEY:
        print("⚠️  Warning: GEMINI_API_KEY is empty. Please set your API key.")
        print("You can set it in the code or use: export GEMINI_API_KEY='your-key-here'")
        print("Get your API key from: https://makersuite.google.com/")
        return

    # Initialize the chat session
    print("🔄 Initializing chat session...")
    if not initialize_chat_session():
        print("❌ Failed to initialize chat session")
        return

    print("✅ Chat session ready! I'll remember our conversation.")

    while True:
        try:
            user_input = input("\nUser: ").strip()

            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("Goodbye!")
                break

            if user_input.lower() == 'models':
                list_available_models()
                continue

            if user_input.lower() == 'reset':
                global chat_session
                chat_session = None
                print("🔄 Resetting conversation...")
                if initialize_chat_session():
                    print("✅ New conversation started!")
                else:
                    print("❌ Failed to reset conversation")
                continue

            if not user_input:
                continue

            process_gemini_response(user_input)

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    # Try to get API key from environment if not set
    if not GEMINI_API_KEY:
        GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

    main()
