import { Settings } from "../types/Settings";

/**
 * Handles reading out of messages sent by the bot.
 * 
 * @param message message to read out
 * @param language language to listen for
 * @param voiceNames list of voice names to use
 * @param rate speech rate
 * @param volume play volume
 */
export const speak = (message: string, language: string, voiceNames: string[], rate: number, volume: number) => {
	if (!window.SpeechSynthesisUtterance) {
		console.info("Speech Synthesis API is not supported in this environment.");
		return;
	}

	const utterance = new window.SpeechSynthesisUtterance();
	utterance.text = message;
	utterance.lang = language;
	utterance.rate = rate;
	utterance.volume = volume;

	let voiceIdentified = false;
	for (const voiceName of voiceNames) {
		const matchedVoice = window.speechSynthesis.getVoices().find((voice) => voice.name === voiceName);
		if(matchedVoice){
			utterance.voice = matchedVoice;
			window.speechSynthesis.speak(utterance);
			voiceIdentified = true;
			break;
		}
	}
	
	// if cannot find voice, use default
	if (!voiceIdentified) {
		window.speechSynthesis.speak(utterance);
	}
}

/**
 * Handles logic for reading out a bot message.
 * 
 * @param settings settings provided to the bot
 * @param textToRead text to read out
 */
export const processAudio = (settings: Settings, textToRead: string) => {
	speak(textToRead, settings.audio?.language as string, settings.audio?.voiceNames as string[],
		settings.audio?.rate as number, settings.audio?.volume as number);
}
