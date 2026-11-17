# 👵 Grandma's Kitchen – Interactive AI Companion

A cozy, warm, and nostalgic interactive AI website where users can chat with Grandma across the kitchen table. Ask for home-cooked recipes, get step-by-step cooking techniques, or find comfort when you are feeling homesick.

---

## 🌟 Features

- **Cozy Kitchen Environment**: Warm lighting, kitchen shelves, steaming soup pot animation, and nostalgic wooden styling.
- **Illustrated Grandma Character**: Custom SVG illustration with subtle breathing, blinking eyes, and speaking animations.
- **Character-Based Recipe Book Chat**: Parchment-styled recipe journal chat interface with typing indicators and smooth scrolling.
- **Powered by Meta Llama 3 8B Instruct**: Powered by Meta's open-source conversational LLM on [Replicate](https://replicate.com/meta/meta-llama-3-8b-instruct).
- **Grandma Personality System Prompt**: Speaks with genuine maternal warmth ("Oh honey!", "Have you eaten yet?"), gives sensory cooking tips, and comforts homesick users.
- **Multi-turn Memory**: Maintains conversation context so Grandma remembers previous questions and ingredients.

---

## 🚀 How to Run Locally

You can open and run Grandma's Kitchen directly in any web browser without needing to install complicated software:

### Method 1: Direct File Open
Simply double-click `index.html` (or drag it into Chrome/Edge).

### Method 2: With Local Web Server
If you'd like to run it through a local HTTP server:
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Then visit: `http://localhost:8000/grandmas-kitchen/`

---

## 🔑 Replicate API Token Setup

To allow Grandma to generate responses:
1. Get a free API token from [Replicate API Tokens](https://replicate.com/account/api-tokens).
2. When you open Grandma's Kitchen, click the **amber/red pill** in the top right header (or it will automatically ask you when you send your first message).
3. Paste your token (starts with `r8_...`).
4. It is saved securely in your browser's local storage and is ready to chat!

