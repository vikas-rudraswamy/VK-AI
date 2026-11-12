# VK AI Chatbot

A beginner-friendly AI chatbot with **separate frontend and backend applications**.

- Frontend: React + Vite
- Backend: Python + Flask
- AI: Google Gemini API
- Communication: HTTP JSON API

## 1. Requirements

Install:
- Python 3.10+
- Node.js LTS
- A Gemini API key from Google AI Studio

## 2. Open the project

Extract this ZIP. In PowerShell, change to the extracted folder, for example:

```powershell
cd "C:\ALL Projects\VK-AI"
```

Your structure should look like:

```text
VK-AI/
  backend/
  frontend/
```

## 3. Configure the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Paste your Gemini API key after `GEMINI_API_KEY=` and save the file. Keep this key private. Never put it in the frontend.

Start the backend:

```powershell
py app.py
```

It runs at `http://127.0.0.1:5000`.

Check `http://127.0.0.1:5000/api/health` in your browser. You should see a JSON status response.

## 4. Start the frontend

Open a **second PowerShell terminal**:

```powershell
cd "C:\ALL Projects\VK-AI\frontend"
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## 5. Troubleshooting

- If `requirements.txt` is not found, make sure your terminal is inside `backend`, not the project root.
- If `npm` is not recognized, install Node.js LTS and reopen PowerShell.
- If PowerShell blocks activation, run this once for the current terminal:
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
  Then activate `.venv` again.
- If the chatbot reports a missing API key, check `backend/.env`.
- Keep the backend terminal running while you use the frontend.

## Security notes

- The Gemini API key belongs only in `backend/.env`.
- `.env` is excluded from Git by `.gitignore`.
- Do not commit or share your API key.
