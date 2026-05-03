# LinkedIn Post for MataData (PromptWars Submission)

---

**Option 1 - Short & Punchy:**

🚀 Just built an AI election assistant in 2 weeks using Google Antigravity

Meet MataData (मतदाता) - helps Indian voters find their polling booth, check voter registration, get unbiased news, and understand the election process.

All in Hindi & English.

The best part? Zero API key issues in production thanks to Google Secret Manager. Deployed on Cloud Run in Mumbai (asia-south1).

What I learned:
- Vibe coding with AI is real ⚡
- Next.js + Gemini is a powerful combo
- Never hardcode secrets (learned this the hard way)

Try it: https://matadata-210255996729.asia-south1.run.app

#BuildWithAI #PromptWars #GoogleCloud #Hack2Skill

---

**Option 2 - Journey Style:**

🎯 2 weeks ago, I knew nothing about building production apps. Today, I deployed one.

Here's my #BuildInPublic journey with PromptWars:

**The Problem:** 
250 million Indian voters struggle to find polling booths, verify registration, and get reliable election info. Most don't speak English.

**The Solution:**
MataData (मतदाता) - an AI-powered election assistant that:
- Finds your polling booth from EPIC number
- Checks voter registration status
- Shows multi-source election news (no bias)
- Answers election questions in Hindi/English
- Has a voting guide with candidate info

**Tech Stack:**
- Next.js 16 + TypeScript
- Gemini AI (with auto-fallback)
- Google Cloud Run + Secret Manager
- Translation API for bilingual support

**Challenges faced:**
- RSS parsing was returning HTML instead of text 😅
- Rate limiting on free tier hit me hard
- News sources were grouped wrong (all showed as "Google News")

**What worked:**
- Caching at 3 levels (in-memory, Redis-ready, API response)
- Dynamic imports for heavy components
- Error boundaries everywhere

Live app: https://matadata-210255996729.asia-south1.run.app

Code: https://github.com/ra7rajat/metadata-sevak

Thankful to Google for Developers & Hack2Skill for this opportunity. #PromptWars #VibeCoding

---

**Option 3 - Minimal Hook:**

I built an AI assistant that helps 250M+ Indian voters 🗳️

No, it's not another chatbot.

MataData (मतदाता) actually:
✅ Finds your exact polling booth location
✅ Verifies if you're registered to vote
✅ Shows election news from 13+ sources (no propaganda)
✅ Works in Hindi AND English

Try it yourself: https://matadata-210255996729.asia-south1.run.app

Built with @Google Antigravity + Cloud Run in 2 weeks.

#AI #Elections #India #BuildWithAI