/* ==============================================================================
   GRANDMA'S KITCHEN - SCRIPT.JS
   Beginner-friendly, well-commented frontend logic
   ============================================================================== */

/**
 * 1. CONFIGURATION & CONSTANTS
 * 
 * - PROXY_URL: The working ITP/IMA educational Replicate proxy (No API key needed!)
 * - FALLBACK_GLITCH_PROXY: The original Glitch proxy URL
 * - REPLICATE_API_URL: Direct Replicate endpoint (backup if user has their own token)
 */
const PROXY_URL = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
const FALLBACK_GLITCH_PROXY = "https://replicate-api-proxy.glitch.me/create_n_get/";
const REPLICATE_API_URL = "https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/predictions";

/**
 * 2. GRANDMA'S SYSTEM PROMPT
 * 
 * This gives the AI its warm, loving grandmother personality!
 * It instructs Llama 3 how to speak, what phrases to use, and how to comfort the user.
 */
const GRANDMA_SYSTEM_PROMPT = `You are Grandma in your cozy kitchen. You are a warm, loving, patient, and deeply caring grandmother who enjoys cooking home-cooked meals for her family.

Key Personality Traits:
- Speak naturally and affectionately, as if you are sitting right across the kitchen table from someone you love.
- Frequently and naturally use warm expressions such as:
  * "Oh honey!"
  * "Come, let's make something together."
  * "Have you eaten yet?"
  * "Don't worry sweetheart, cooking takes practice."
  * "Sit down, let Grandma pour you a warm cup of tea."
- You are very knowledgeable about traditional home cooking, comforting family recipes, and cooking techniques.
- When explaining recipes, break them down gently step-by-step with tips (like how food should smell, sizzle, or look).
- When someone says they feel lonely, sad, or homesick, respond with deep emotional warmth, reassurance, and comfort first rather than just listing dry advice.
- Avoid sounding like a sterile or robotic AI chatbot. Never say "As an AI..."
- Do not pretend to be the user's literal biological grandmother or claim to have real memories of their specific family members, but love and treat them with genuine grandma affection.`;

/**
 * 3. STATE MANAGEMENT
 * 
 * We keep track of the conversation history so Grandma remembers what we talked about!
 */
let conversationHistory = [];
let replicateApiToken = localStorage.getItem("grandma_replicate_token") || "";

// DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");
const speechBubble = document.getElementById("speech-bubble");
const bubbleText = document.getElementById("bubble-text");
const statusPill = document.getElementById("status-pill");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const characterCard = document.querySelector(".character-card");
const clearChatBtn = document.getElementById("clear-chat-btn");
const voiceToggleBtn = document.getElementById("voice-toggle-btn");
const voiceIcon = document.getElementById("voice-icon");
const voiceLabel = document.getElementById("voice-label");

// Voice Synthesis State
let isVoiceEnabled = true;
let synth = window.speechSynthesis;
let availableVoices = [];

// Token Modal Elements
const tokenModal = document.getElementById("token-modal");
const tokenInput = document.getElementById("token-input");
const saveTokenBtn = document.getElementById("save-token-btn");
const cancelTokenBtn = document.getElementById("cancel-token-btn");

/**
 * 4. INITIALIZATION
 */
window.addEventListener("DOMContentLoaded", () => {
  updateConnectionStatus();
  initVoiceEngine();
  setupEventListeners();
});

function initVoiceEngine() {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    if (voiceToggleBtn) voiceToggleBtn.style.display = "none";
    return;
  }

  // Load voices when available
  function loadVoices() {
    availableVoices = synth.getVoices();
  }

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Grandma's Spoken Voice Engine
 * Uses warm acoustic tuning (gentle pitch, comforting pace) and selects 
 * a gentle maternal/female voice (Google US English, Samantha, Natural, etc.)
 */
function speakGrandma(text) {
  if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

  // Cancel any previous speech
  synth.cancel();

  // Clean text of emojis or markdown asterisks so speech sounds natural
  const cleanSpeechText = text
    .replace(/[*_#~]/g, '')
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .trim();

  if (!cleanSpeechText) return;

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);

  // Pick the warmest, most natural female voice available on the device
  const preferredVoice = availableVoices.find(v => 
    v.lang.startsWith("en") && (
      v.name.includes("Natural") ||
      v.name.includes("Samantha") ||
      v.name.includes("Zira") ||
      v.name.includes("Google US English") ||
      v.name.includes("Victoria") ||
      v.name.includes("Female")
    )
  ) || availableVoices.find(v => v.lang.startsWith("en")) || null;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Pitch & Rate tuning for a cozy, patient, soothing Grandma cadence
  utterance.pitch = 1.05; // Gentle, maternal tone
  utterance.rate = 0.90;  // Relaxed, unhurried grandmother pace

  // Synchronize mouth and head animations with her speaking!
  utterance.onstart = () => {
    characterCard.classList.add("is-talking");
    if (voiceToggleBtn) voiceToggleBtn.classList.add("speaking");
  };

  utterance.onend = () => {
    characterCard.classList.remove("is-talking");
    if (voiceToggleBtn) voiceToggleBtn.classList.remove("speaking");
  };

  utterance.onerror = () => {
    characterCard.classList.remove("is-talking");
    if (voiceToggleBtn) voiceToggleBtn.classList.remove("speaking");
  };

  synth.speak(utterance);
}

function setupEventListeners() {
  // Chat submit form
  chatForm.addEventListener("submit", handleSendMessage);

  // Quick suggestion buttons
  document.querySelectorAll(".topic-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      userInput.value = btn.getAttribute("data-prompt");
      userInput.focus();
    });
  });

  // Clear chat
  clearChatBtn.addEventListener("click", () => {
    if (confirm("Start a new conversation with Grandma?")) {
      conversationHistory = [];
      chatMessages.innerHTML = `
        <div class="message grandma-msg">
          <div class="msg-avatar">👵</div>
          <div class="msg-bubble">
            <p>Oh honey! Welcome into my kitchen. Come sit down by the warm stove. Have you eaten anything yet today?</p>
            <p>Tell me what you're craving, or just tell me how your day went. Grandma is always here to listen and help you cook something delicious.</p>
            <span class="msg-time">Just now</span>
          </div>
        </div>
      `;
      setGrandmaMood("Welcome home, sweetheart! Sit down and let's make something good together.");
    }
  });

  // Status pill opens token modal to view or change token
  statusPill.addEventListener("click", () => {
    tokenInput.value = replicateApiToken;
    tokenModal.classList.add("open");
  });

  // Modal actions
  saveTokenBtn.addEventListener("click", () => {
    const entered = tokenInput.value.trim();
    if (entered) {
      replicateApiToken = entered;
      localStorage.setItem("grandma_replicate_token", entered);
      tokenModal.classList.remove("open");
      updateConnectionStatus();
      setGrandmaMood("Thank you honey! Grandma's stove is lit and ready to chat!");
    } else {
      alert("Please enter a valid Replicate API token (starts with r8_)");
    }
  });

  // Toggle Grandma's Voice on/off
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      isVoiceEnabled = !isVoiceEnabled;
      if (isVoiceEnabled) {
        voiceToggleBtn.classList.add("active");
        voiceIcon.textContent = "🔊";
        voiceLabel.textContent = "Grandma's Voice: ON";
        speakGrandma("I'm right here with you, sweetheart!");
      } else {
        voiceToggleBtn.classList.remove("active");
        voiceIcon.textContent = "🔇";
        voiceLabel.textContent = "Grandma's Voice: MUTED";
        if (synth) synth.cancel();
        characterCard.classList.remove("is-talking");
      }
    });
  }
}

/**
 * 5. SEND MESSAGE & API CALL FLOW
 */
async function handleSendMessage(e) {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // 1. Add User message to the chat screen
  appendMessage("user", text);
  userInput.value = "";
  userInput.disabled = true;

  // 2. Add to conversation history
  conversationHistory.push({ role: "user", content: text });

  // 3. Show typing indicator & start Grandma talking animation
  showTyping(true);
  setGrandmaMood("Let me think about that, honey...");

  try {
    // 4. Send request to the AI model
    const responseText = await callReplicateModel(conversationHistory);

    // 5. Add Grandma's response to the chat screen & history
    appendMessage("grandma", responseText);
    conversationHistory.push({ role: "assistant", content: responseText });

    // Update speech bubble with a brief warm snippet
    const snippet = responseText.length > 90 ? responseText.slice(0, 90) + "..." : responseText;
    setGrandmaMood(snippet);

    // 6. Speak out loud in Grandma's voice!
    speakGrandma(responseText);

  } catch (error) {
    console.error("Error talking to Grandma:", error);
    
    // Friendly error message
    let errorHelp = "Oh dear! My recipe card got a little smudged. ";
    if (error.message && error.message.includes("Token")) {
      errorHelp += "Grandma needs your Replicate API token to connect. Click the yellow pill at the top right to paste it in!";
      tokenModal.classList.add("open");
    } else {
      errorHelp += error.message || "Could not connect to the kitchen server. Please try again in a moment, honey!";
    }
    
    appendMessage("grandma", errorHelp);
    setGrandmaMood("Oh dear, let me wipe off my glasses and try that again.");
  } finally {
    showTyping(false);
    userInput.disabled = false;
    userInput.focus();
  }
}

/**
 * 6. REPLICATE MODEL CALL (Proxy with Direct Replicate Fallback)
 * 
 * Here is how communication works:
 * Step A: Try sending the request to the Glitch proxyUrl.
 * Step B: If the Glitch proxy is offline (Glitch shut down / 410 Gone),
 *         use direct Replicate API with the user's token.
 */
async function callReplicateModel(history) {
  // Format conversation history for Llama 3
  // Llama 3 works best with a combined formatted prompt or prompt + system_prompt
  let formattedPrompt = "";
  history.forEach(msg => {
    if (msg.role === "user") {
      formattedPrompt += `User: ${msg.content}\n`;
    } else {
      formattedPrompt += `Grandma: ${msg.content}\n`;
    }
  });
  formattedPrompt += `Grandma:`;

  // Standard payload for Llama 3 8B Instruct on Replicate
  const payload = {
    input: {
      prompt: formattedPrompt,
      system_prompt: GRANDMA_SYSTEM_PROMPT,
      temperature: 0.75,
      max_tokens: 650,
      presence_penalty: 0.2
    }
  };

  // --- ATTEMPT 1: Try the requested Glitch Proxy ---
  try {
    console.log("Attempting to connect via Glitch Proxy:", PROXY_URL);
    const proxyController = new AbortController();
    const timeoutId = setTimeout(() => proxyController.abort(), 6000); // 6s timeout

    const proxyResponse = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/meta-llama-3-8b-instruct",
        input: payload.input
      }),
      signal: proxyController.signal
    });
    clearTimeout(timeoutId);

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log("Proxy response successful:", data);
      return parseModelOutput(data);
    } else {
      console.warn(`Glitch proxy responded with status ${proxyResponse.status}. Falling back to direct Replicate API.`);
    }
  } catch (proxyErr) {
    console.warn("Glitch proxy unreachable or timed out:", proxyErr.message);
  }

  // --- ATTEMPT 2: Fallback to Replicate API ---
  if (!replicateApiToken) {
    tokenModal.classList.add("open");
    throw new Error("Replicate API Token required. Please enter your token in the popup to chat with Grandma!");
  }

  console.log("Connecting directly to Replicate Llama 3 model...");
  
  // Create prediction on Replicate
  const replicateRes = await fetch(REPLICATE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateApiToken}`,
      "Content-Type": "application/json",
      "Prefer": "wait" // Replicate waits up to 60s to return the completed response directly
    },
    body: JSON.stringify(payload)
  });

  if (!replicateRes.ok) {
    const errText = await replicateRes.text();
    if (replicateRes.status === 401) {
      throw new Error("Invalid Replicate API Token. Please check your token and try again.");
    }
    throw new Error(`Replicate API returned status ${replicateRes.status}: ${errText}`);
  }

  let prediction = await replicateRes.json();
  console.log("Initial Replicate prediction:", prediction);

  // If status is not yet finished ("starting" or "processing"), poll until completed
  let pollAttempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    if (pollAttempts > 30) throw new Error("Grandma's recipe took too long to simmer. Please try again!");
    await new Promise(r => setTimeout(r, 1500)); // wait 1.5s
    
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: {
        "Authorization": `Bearer ${replicateApiToken}`
      }
    });
    if (pollRes.ok) {
      prediction = await pollRes.json();
    }
    pollAttempts++;
  }

  if (prediction.status === "failed") {
    throw new Error(`Model generation failed: ${prediction.error || "Unknown error"}`);
  }

  return parseModelOutput(prediction);
}

/**
 * Helper to parse Replicate's output (array of strings or single string)
 */
function parseModelOutput(data) {
  if (!data) return "Oh honey, I didn't quite catch that. Could you say it again?";

  // If the output is wrapped in an output field
  let output = data.output !== undefined ? data.output : data;

  if (Array.isArray(output)) {
    return output.join("").trim();
  } else if (typeof output === "string") {
    return output.trim();
  }
  return JSON.stringify(output);
}

/**
 * 7. UI HELPERS (Messages, Typing, Animations)
 */
function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender === "grandma" ? "grandma-msg" : "user-msg"}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Format paragraphs cleanly if text has newlines
  const formattedHtml = text
    .split("\n\n")
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  msgDiv.innerHTML = `
    <div class="msg-avatar">${sender === "grandma" ? "👵" : "👤"}</div>
    <div class="msg-bubble">
      ${formattedHtml}
      <span class="msg-time">${timeStr}</span>
    </div>
  `;

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping(show) {
  if (show) {
    typingIndicator.classList.add("active");
    characterCard.classList.add("is-talking");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    typingIndicator.classList.remove("active");
    characterCard.classList.remove("is-talking");
  }
}

function setGrandmaMood(text) {
  if (bubbleText) {
    bubbleText.textContent = `"${text}"`;
  }
}

function updateConnectionStatus() {
  statusDot.className = "status-indicator connected";
  statusText.textContent = "Grandma is Ready! (Connected)";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

