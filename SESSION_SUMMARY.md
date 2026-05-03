# MataData (मतदाता) - Election AI Assistant

## Session Summary - May 2026

### Project Overview
- **Purpose**: AI-powered election assistant for Indian voters
- **Tech Stack**: Next.js 16, TypeScript, TailwindCSS, Gemini API
- **Target**: Hackathon submission (target: 99/100)

---

## Completed Work

### Phases 0-7 (Rating: 87→97)
| Parameter | Before | After | Notes |
|-----------|--------|-------|-------|
| Code Quality | 88 | 94 | README rewrite, ErrorBoundary, dynamic imports, debounce |
| Security | 90 | 94 | getEnvVar refactor, rate limiting, CSP/HSTS |
| Efficiency | 87 | 93 | Streaming fix, compression, prefetch |
| Testing | 82 | 83 | 114 tests, Playwright config, 65% coverage |
| Accessibility | 89 | 93 | Replaced `<img>` with `<next/image>` |
| Google Services | 95 | 97 | Translation API, Cloud Logging, Redis cache |
| Problem Statement | 92 | 97 | Skippable OnboardingWizard, bookmark feature |

### Phase 8 - Bug Fixes
- Fixed News page not showing content (source grouping by sourceName instead of domain)
- Added Google favicon domain to next.config.ts images config
- Fixed snippet parsing (HTML entity decoding for `&nbsp;`, `&lt;`, `&gt;`)

### Model Configuration
```typescript
// src/types/index.ts
export const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',  // Primary (10M TPM - highest!)
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemma-4-26b',            // Fallback
  'gemma-4-31b',            // Fallback
] as const;
```

---

## API Endpoints

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 200 ✓ |
| `/booth` | GET | 200 ✓ |
| `/voter-check` | GET | 200 ✓ |
| `/news` | GET | 200 ✓ |
| `/guide` | GET | 200 ✓ |
| `/bookmarks` | GET | 200 ✓ |
| `/api/news` | GET | 200 ✓ |
| `/api/chat` | POST | 405 (needs body) |

---

## Known Issues

1. **Gemini API Quota**: Free tier limited to 20 requests/day for gemini-2.5-flash
   - Fix: Use gemini-3.1-flash-lite (10M TPM)
   
2. **News Summary**: Rate limited on AI comparison feature
   - Uses cached data when 429 encountered

3. **Voice Mode**: Uses browser Speech Recognition API (free, works)
   - Gemini Live integration available but unused (risky on free tier)

---

## Testing

```bash
npm test        # 114 tests passing
npm run lint   # 0 errors, 5 warnings
```

---

## Running the Project

```bash
cd election-assistant
npm run dev    # Start dev server on :3000
```

---

## Key Files

- `src/components/ChatInterface.tsx` - Main chat UI with voice support
- `src/components/OnboardingWizard.tsx` - 3-step skippable wizard
- `src/components/sections/NewsSection.tsx` - Multi-source news display
- `src/tools/newsAggregator.ts` - Google News RSS parser
- `src/lib/gemini.ts` - Gemini client with auto-fallback
- `src/middleware.ts` - Rate limiting & security headers

---

## Environment Variables

```
GOOGLE_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Next Steps (If Resumed)

1. Add voice mode tests
2. Complete Gemini Live integration (needs paid tier)
3. Add more E2E tests with Playwright
4. Deploy to Cloud Run
5. Upload to GitHub