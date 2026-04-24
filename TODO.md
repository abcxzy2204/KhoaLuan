# Server Fixed & AI Simplified ✅

**Completed:**
- Created `backend/controllers/aiController.js` (fixed import error)
- Killed port conflicts, server runs `http://localhost:5000`
- MySQL ✅ connected, admin user created (admin@example.com/admin123)
- **Simplified aiAssistant.js to single API key**: Uses `API_KEY_CHATBOT` or `GEMINI_API_KEY` for both chat & descriptions

**Updated env.example:**
- Single `GEMINI_API_KEY=your-key-here`

**Setup:**
1. `cp backend/env.example backend/.env`
2. Add your Gemini API key: `GEMINI_API_KEY=AIza...` (or `API_KEY_CHATBOT=AIza...`)
3. Restart server: Ctrl+C, `node backend/server.js`

**Test AI Chat (no key → fallback msg):**
```
curl -X POST http://localhost:5000/api/ai/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Xin chào\"}"
```

**Full stack:** `npm run dev` (frontend + backend)

