# Google Services Integration Documentation

## Overview
MataData uses 7 Google services to deliver election information:

| Service | Purpose | Setup |
|---------|---------|-------|
| Gemini AI | Conversational chat agent with function calling | Enable Generative Language API, get API key |
| Google Maps Platform | Static maps + directions for polling booths | Enable Maps API, get Maps API key |
| Google Cloud Translation | Multilingual detection (10+ Indian languages) | Enable Translation API, service account |
| Google Cloud Logging | Error tracking and monitoring | Enable Logging API, service account |
| Google Cloud Memorystore | Persistent Redis cache for production | Create Redis instance in VPC |
| Google Fact Check Tools | Claim verification | Enable Fact Check API, no key needed |
| Google Custom Search Engine | Multi-source news aggregation | Create CSE, get Search API key + ID |

## Quota Limits
- Gemini: 15 RPM (free tier), 1000 RPM (paid)
- Translation: 500K chars/month (free), pay-as-you-go
- Maps: $200 free credit/month
- Fact Check: 100 queries/day (free)

## Fallback Logic (Phase6.3)
- Gemini failure → Show static FAQ from `src/lib/staticFaq.ts`
- Maps API failure → Show text-only address
- Translation failure → Fall back to regex Hindi detection
- Redis failure → Use in-memory NodeCache fallback
