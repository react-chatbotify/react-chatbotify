import { GoogleGenerativeAI, Content } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const modelName = (import.meta.env.VITE_AI_MODEL as string) || "gemini-2.0-flash";
const defaultSystemPrompt =
	(import.meta.env.VITE_AI_SYSTEM_PROMPT as string) ||
	"You are ChatBotify AI, a friendly, concise, and knowledgeable assistant.";

// Dynamic system prompt — can be updated at runtime via setSystemPrompt()
let currentSystemPrompt = defaultSystemPrompt;

let genAI: GoogleGenerativeAI | null = null;

// In-memory conversation history for multi-turn context
let conversationHistory: Content[] = [];

/**
 * Checks if the Gemini API key is configured.
 */
export const isGeminiConfigured = (): boolean => {
	return !!apiKey && apiKey !== "your_actual_key_here";
};

/**
 * Initializes the Gemini client (lazy singleton).
 */
const getClient = (): GoogleGenerativeAI => {
	if (!genAI) {
		genAI = new GoogleGenerativeAI(apiKey);
	}
	return genAI;
};

/**
 * Updates the system prompt at runtime. Takes effect on the next message.
 */
export const setSystemPrompt = (prompt: string): void => {
	currentSystemPrompt = prompt || defaultSystemPrompt;
};

/**
 * Gets the current system prompt.
 */
export const getSystemPrompt = (): string => {
	return currentSystemPrompt;
};

/**
 * Clears the in-memory conversation history (used for "New Chat" sessions).
 */
export const clearConversationHistory = (): void => {
	conversationHistory = [];
};

/**
 * Sends a user message to Gemini and streams the response back chunk by chunk.
 * Calls `onChunk` for each text piece and `onDone` when the stream completes.
 *
 * @param userMessage - The user's latest message text.
 * @param onChunk - Callback invoked for every streamed text chunk.
 * @param onDone - Callback invoked when streaming is complete.
 * @param onError - Callback invoked if an error occurs.
 */
export const streamGeminiResponse = async (
	userMessage: string,
	onChunk: (chunk: string) => void,
	onDone: () => void,
	onError: (error: Error) => void
): Promise<void> => {
	if (!isGeminiConfigured()) {
		onError(new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."));
		return;
	}

	try {
		const client = getClient();
		const model = client.getGenerativeModel({
			model: modelName,
			systemInstruction: currentSystemPrompt,
		});

		// Start streaming chat with existing history (user message sent separately)
		const chat = model.startChat({
			history: [...conversationHistory],
		});

		const result = await chat.sendMessageStream(userMessage);

		let fullResponse = "";
		for await (const chunk of result.stream) {
			const chunkText = chunk.text();
			if (chunkText) {
				fullResponse += chunkText;
				onChunk(chunkText);
			}
		}

		// Only add both turns to history after successful stream completion
		conversationHistory.push({
			role: "user",
			parts: [{ text: userMessage }],
		});
		conversationHistory.push({
			role: "model",
			parts: [{ text: fullResponse }],
		});

		onDone();
	} catch (err) {
		// No rollback needed — user message was never pushed on failure
		onError(err instanceof Error ? err : new Error(String(err)));
	}
};

/**
 * Gets the current conversation turn count (useful for UI stats).
 */
export const getConversationTurns = (): number => {
	return Math.floor(conversationHistory.length / 2);
};
