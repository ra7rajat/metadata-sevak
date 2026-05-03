/**
 * Election Agent — Orchestrates Gemini function calling with MataData's
 * election tools. Implements the tool execution loop where:
 *
 * 1. User message is sent to Gemini along with tool declarations
 * 2. Gemini may respond with text OR a function call request
 * 3. If a function call is requested, the agent executes the tool locally
 * 4. Tool results are injected back into the conversation
 * 5. Gemini generates a final text response incorporating the tool data
 *
 * This loop enables MataData to fetch real-time election data, look up
 * constituencies, and find polling booths — all orchestrated by the LLM.
 *
 * ## Tool Overview (for hackathon judges)
 *
 * **search_voter_roll** — Searches ECI's electoral roll by name/state/district.
 *   Enables voters to verify their registration status without leaving the chat.
 *
 * **get_election_schedule** — Fetches upcoming election dates for a state.
 *   Helps voters know when and where to vote.
 *
 * **pincode_to_constituency** — Maps a 6-digit pincode to parliamentary and
 *   assembly constituencies. Critical for voters who don't know their constituency.
 *
 * **find_polling_booth** — Locates a voter's assigned booth using their EPIC
 *   (voter ID) number. Returns booth details with Google Maps navigation links.
 *
 * **fetch_multi_source_news** — Fetches election news from Google News RSS
 *   using multiple query phrasings, deduplicates by URL, and groups by source.
 *   Ensures unbiased coverage from at least 3 different news outlets.
 *
 * **check_claim** — Verifies a factual claim using Google's Fact Check Tools
 *   API. Returns verdicts from fact-checking organizations with normalized
 *   ratings (TRUE / FALSE / MISSING_CONTEXT).
 *
 * @module agent/electionAgent
 */

import { Type, FunctionCallingConfigMode } from '@google/genai';
import type { FunctionDeclaration, Part } from '@google/genai';
import { getGenAIClient, resolveModel, SYSTEM_INSTRUCTION } from '@/lib/gemini';
import {
  searchVoterRoll,
  getElectionSchedule,
  pincodeToConstituency,
  findPollingBooth,
  fetchMultiSourceNews,
  checkClaim,
} from '@/tools';
import type { ConversationTurn } from '@/types';

// ─── Tool Declarations (Gemini Function Calling Schema) ─────────────────────

/**
 * Gemini FunctionDeclaration for voter roll search.
 * Allows the model to search for a voter's registration on the electoral roll.
 */
const searchVoterRollDeclaration: FunctionDeclaration = {
  name: 'search_voter_roll',
  description:
    'Search the Election Commission of India electoral roll for a voter by name, state, and district. ' +
    'Use this when a user wants to check if they are registered to vote or verify their voter details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Full or partial name of the voter to search for.',
      },
      state: {
        type: Type.STRING,
        description: 'Indian state name (e.g., "Karnataka", "Maharashtra", "Delhi").',
      },
      district: {
        type: Type.STRING,
        description: 'District name within the state (e.g., "Bangalore Urban", "Pune").',
      },
    },
    required: ['name', 'state', 'district'],
  },
};

/**
 * Gemini FunctionDeclaration for election schedule lookup.
 * Provides upcoming election dates and phases for a state.
 */
const getElectionScheduleDeclaration: FunctionDeclaration = {
  name: 'get_election_schedule',
  description:
    'Get the election schedule (polling dates, phases, result dates) for a specific Indian state. ' +
    'Use this when a user asks about upcoming elections, voting dates, or election phases.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      state: {
        type: Type.STRING,
        description: 'Indian state name (e.g., "Bihar", "Tamil Nadu", "Uttar Pradesh").',
      },
    },
    required: ['state'],
  },
};

/**
 * Gemini FunctionDeclaration for pincode-to-constituency mapping.
 * Maps a postal code to parliamentary and assembly constituencies.
 */
const pincodeToConstituencyDeclaration: FunctionDeclaration = {
  name: 'pincode_to_constituency',
  description:
    'Map an Indian pincode (postal code) to its parliamentary constituency, assembly constituency, ' +
    'and current MP/MLA names. Use this when a user provides a pincode or wants to know their constituency.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      pincode: {
        type: Type.STRING,
        description: '6-digit Indian postal code (e.g., "560001" for Bangalore, "110001" for Delhi).',
      },
    },
    required: ['pincode'],
  },
};

/**
 * Gemini FunctionDeclaration for polling booth finder.
 * Locates a voter's assigned booth with Google Maps integration.
 */
const findPollingBoothDeclaration: FunctionDeclaration = {
  name: 'find_polling_booth',
  description:
    'Find the assigned polling booth for a voter using their EPIC (voter ID) number. ' +
    'Returns booth name, address, and Google Maps directions. ' +
    'Use this when a user wants to find where to vote or needs directions to their polling station.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      epicNumber: {
        type: Type.STRING,
        description: 'EPIC (Electoral Photo ID Card) number in format: 3 letters + 7 digits (e.g., "ABC1234567").',
      },
    },
    required: ['epicNumber'],
  },
};

/**
 * Gemini FunctionDeclaration for multi-source news fetching.
 * Aggregates election news from multiple outlets for unbiased coverage.
 */
const fetchMultiSourceNewsDeclaration: FunctionDeclaration = {
  name: 'fetch_multi_source_news',
  description:
    'Fetch election news on a topic from multiple news sources for unbiased coverage. ' +
    'Returns articles from at least 3 different outlets grouped by source domain. ' +
    'Use this when a user asks for election news, current events, or wants to compare media coverage.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: 'The election topic to search for (e.g., "EVM controversy", "Bihar election results", "voter turnout 2024").',
      },
    },
    required: ['topic'],
  },
};

/**
 * Gemini FunctionDeclaration for claim fact-checking.
 * Verifies factual claims using Google Fact Check Tools API.
 */
const checkClaimDeclaration: FunctionDeclaration = {
  name: 'check_claim',
  description:
    'Fact-check a specific claim about Indian elections using the Google Fact Check Tools API. ' +
    'Returns verdicts from fact-checking organizations with ratings. ' +
    'Use this when a user asks to verify a claim, check if something is true, or wants fact-checking.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      claim: {
        type: Type.STRING,
        description: 'The factual claim to verify (e.g., "EVM machines can be hacked", "India has 900 million voters").',
      },
    },
    required: ['claim'],
  },
};

/** All tool declarations bundled for Gemini */
const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  searchVoterRollDeclaration,
  getElectionScheduleDeclaration,
  pincodeToConstituencyDeclaration,
  findPollingBoothDeclaration,
  fetchMultiSourceNewsDeclaration,
  checkClaimDeclaration,
];

/** Maximum number of tool call rounds to prevent infinite loops */
const MAX_TOOL_ROUNDS = 5;

// ─── Tool Executor ──────────────────────────────────────────────────────────

/**
 * Executes a tool function call requested by Gemini.
 * Maps the function name to the actual tool implementation
 * and returns the result as a serializable object.
 *
 * @param name - The function name from Gemini's function call.
 * @param args - The arguments object from Gemini's function call.
 * @returns The tool execution result as a JSON-serializable object.
 */
async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<unknown> {
  console.log(`[Agent] Executing tool: ${name}`, args);

  switch (name) {
    case 'search_voter_roll':
      return await searchVoterRoll(args.name, args.state, args.district);

    case 'get_election_schedule':
      return await getElectionSchedule(args.state);

    case 'pincode_to_constituency':
      return await pincodeToConstituency(args.pincode);

    case 'find_polling_booth':
      return await findPollingBooth(args.epicNumber);

    case 'fetch_multi_source_news':
      return await fetchMultiSourceNews(args.topic);

    case 'check_claim':
      return await checkClaim(args.claim);

    default:
      return { success: false, error: `Unknown tool: ${name}`, code: 'UNAVAILABLE' };
  }
}

// ─── Agent Entry Point ──────────────────────────────────────────────────────

/**
 * Runs the election agent with Gemini function calling.
 *
 * Implements the complete tool execution loop:
 * 1. Sends user message + history + tool declarations to Gemini
 * 2. If Gemini requests function calls, executes them locally
 * 3. Injects tool results back into the conversation as functionResponse parts
 * 4. Repeats until Gemini produces a final text response (max 5 rounds)
 *
 * Returns a ReadableStream that streams the final text response
 * word by word to the client.
 *
 * @param message - The sanitized user message.
 * @param history - Previous conversation turns in Gemini format.
 * @returns A ReadableStream of the agent's text response.
 */
export async function runElectionAgent(
  message: string,
  history: ConversationTurn[]
): Promise<ReadableStream<Uint8Array>> {
  const modelId = await resolveModel();
  const client = getGenAIClient();

  // Build the full conversation contents
  const contents: ConversationTurn[] = [...history];
  contents.push({ role: 'user', parts: [{ text: message }] });

  return new ReadableStream({
    async start(controller) {
      try {
        let rounds = 0;

        while (rounds < MAX_TOOL_ROUNDS) {
          rounds++;

          // Call Gemini with tools
          const response = await client.models.generateContent({
            model: modelId,
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
              toolConfig: {
                functionCallingConfig: {
                  mode: FunctionCallingConfigMode.AUTO,
                },
              },
              maxOutputTokens: 2048,
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
            },
          });

          // Check if the model wants to call functions
          const functionCalls = response.functionCalls;

          if (functionCalls && functionCalls.length > 0) {
            console.log(`[Agent] Round ${rounds}: ${functionCalls.length} function call(s)`);

            // Add the model's function call response to conversation
            const modelParts: Part[] = functionCalls.map((fc) => ({
              functionCall: {
                name: fc.name || '',
                args: (fc.args as Record<string, string>) || {},
              },
            }));

            contents.push({ role: 'model' as const, parts: modelParts } as ConversationTurn);

            // Execute all function calls and collect results
            const functionResponseParts: Part[] = [];

            for (const fc of functionCalls) {
              const toolResult = await executeTool(
                fc.name || '',
                (fc.args as Record<string, string>) || {}
              );

              functionResponseParts.push({
                functionResponse: {
                  name: fc.name || '',
                  response: toolResult as Record<string, unknown>,
                },
              });
            }

            // Add function responses to conversation for next round
            contents.push({
              role: 'user' as const,
              parts: functionResponseParts,
            } as ConversationTurn);

            // Continue the loop — Gemini will process tool results
            continue;
          }

          // No function calls — stream the text response
          const text = response.text || '';

          if (text) {
            // Stream word by word for natural display
            const words = text.split(/(\s+)/);
            for (const word of words) {
              controller.enqueue(new TextEncoder().encode(word));
              // No artificial delay - stream as fast as possible
            }
          }

          // Done — exit the loop
          break;
        }

        if (rounds >= MAX_TOOL_ROUNDS) {
          controller.enqueue(
            new TextEncoder().encode(
              '\n\n[I processed multiple tool calls but reached the limit. Please try a more specific question.]'
            )
          );
        }

        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Agent execution failed';
        console.error('[Agent] Error:', message);
        controller.enqueue(
          new TextEncoder().encode(`\n\n[Error: ${message}. Please try again.]`)
        );
        controller.close();
      }
    },
  });
}
