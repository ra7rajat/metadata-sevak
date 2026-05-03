# MataData (मतदाता) — AI-Powered Indian Election Assistant
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/) [![Gemini](https://img.shields.io/badge/Gemini-AI-orange)](https://deepmind.google/technologies/gemini/) [![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4)](https://cloud.google.com/)

MataData is an interactive AI assistant that helps Indian voters understand the election process, timelines, and steps in a simple, multilingual way. Built for the [Hackathon Name] hackathon.

## Problem Alignment
Aligned with the problem statement: *Create an assistant that helps users understand the election process, timelines, and steps in an interactive and easy-to-follow way.* MataData delivers:
- Multilingual (Hindi + 10+ Indian languages) chat/voice interface
- Real-time tools: Voter registration check, polling booth finder with Google Maps, election schedule lookup, fact-checking, news aggregation
- Interactive onboarding wizard, election timeline visualization, bookmarking features

## Setup
1. Clone the repo: `git clone https://github.com/your-username/election-assistant.git`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   GOOGLE_API_KEY=your_google_cse_key
   GOOGLE_CSE_ID=your_custom_search_id
   MAPS_API_KEY=your_google_maps_key
   GCP_PROJECT_ID=your_google_cloud_project_id
   GOOGLE_APPLICATION_CREDENTIALS=path_to_gcp_service_account.json
   ```
4. Run dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Google Services Used
| Service | Purpose |
|---------|---------|
| Gemini AI | Conversational chat agent with tool calling |
| Google Maps Platform | Static maps and directions for polling booths |
| Google Cloud Translation | Multilingual language detection and translation |
| Google Cloud Logging | Error tracking and monitoring |
| Google Cloud Memorystore (Redis) | Persistent caching for production |
| Google Fact Check Tools | Claim verification |
| Google Custom Search Engine | Multi-source news aggregation |

## Scripts
- `npm run dev`: Start development server
- `npm run build`: Production build
- `npm run test`: Run unit/component tests
- `npm run test:coverage`: Run tests with coverage report
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type check

## Architecture
- **App Router**: Next.js 16 app directory structure
- **Agent**: Gemini-powered election agent with function calling for real-time tools
- **Tools**: ECI data scraping, polling booth lookup, news aggregation, fact-checking
- **UI**: React 19 components with Tailwind CSS, accessibility-first design
- **Testing**: Jest + React Testing Library + Playwright E2E + axe-core accessibility

## Hackathon Submission
- Demo video: [Link]
- Architecture diagram: [Link]
- Live deployment: [Google Cloud Run URL]
