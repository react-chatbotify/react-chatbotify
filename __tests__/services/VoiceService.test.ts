import {Settings} from "../../src/types/Settings";
import {RefObject} from "react";

// Mock functions
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockOnResult = jest.fn();
const mockOnEnd = jest.fn();
const mockMediaRecorderStart = jest.fn();
const mockMediaRecorderStop = jest.fn();
const mockGetUserMedia = jest.fn();

// Mock classes
class MockSpeechRecognition {
	lang = "";
	start = mockStart;
	stop = mockStop;
	onresult = mockOnResult;
	onend = mockOnEnd;
}

class MockMediaRecorder {
	state = "inactive";
	start = mockMediaRecorderStart;
	stop = mockMediaRecorderStop;
	ondataavailable = jest.fn();
}

// Helper functions
const createMockStream = () => {
	const mockTrackStop = jest.fn();
	return {
		getTracks: () => [{ stop: mockTrackStop }]
	};
};

const createMockInput = (value = "") => ({
	value,
	disabled: false,
	accept: "",
	align: "",
	alt: "",
	autocomplete: ""
});

const createDefaultSettings = (overrides: any = {}): Settings => ({
	voice: {
		language: "en-US",
		sendAsAudio: false,
		timeoutPeriod: 1000,
		autoSendPeriod: 500,
		autoSendDisabled: false,
		disabled: false,
		...overrides.voice
	},
	chatInput: {
		characterLimit: 10,
		blockSpam: true,
		...overrides.chatInput
	}
} as any);

const setupSpeechRecognitionWithInstance = () => {
	let recognitionInstance: any;
	const MockSpeechRecognitionWithInstance = class {
		lang = "";
		start = mockStart;
		stop = mockStop;
		onresult: any = null;
		onend: any = null;
		constructor() { recognitionInstance = this; }
	};

	(global as any).window.SpeechRecognition = MockSpeechRecognitionWithInstance;
	(global as any).window.webkitSpeechRecognition = MockSpeechRecognitionWithInstance;

	return { recognitionInstance: () => recognitionInstance };
};

const setupMediaRecorderWithInstance = () => {
	let mediaRecorderInstance: any;
	class TestMediaRecorder extends MockMediaRecorder {
		constructor() {
			super();
			mediaRecorderInstance = this;
		}
	}
	(global as any).window.MediaRecorder = TestMediaRecorder;

	return { mediaRecorderInstance: () => mediaRecorderInstance };
};

const simulateRecognitionResult = (recognitionInstance: any, transcript: string) => {
	const event = { results: [[{ transcript }]] };
	if (recognitionInstance?.onresult) {
		recognitionInstance.onresult(event);
	}
};

const getVoiceServiceFunctions = async () => {
	return await import("../../src/services/VoiceService");
};

describe("VoiceService", () => {
	let settings: Settings;
	let toggleVoice: jest.Mock;
	let triggerSendVoiceInput: jest.Mock;
	let setTextAreaValue: jest.Mock;
	let setInputLength: jest.Mock;
	let audioChunksRef: { current: any[] };
	let inputRef: RefObject<HTMLInputElement>;

	// Store original global objects for restoration
	let originalWindow: any;
	let originalNavigator: any;

	// Voice service functions - will be loaded dynamically
	let startVoiceRecording: any;
	let stopVoiceRecording: any;
	let syncVoiceWithChatInput: any;

	beforeAll(() => {
		// Snapshot original globals
		originalWindow = (global as any).window ? { ...(global as any).window } : undefined;
		originalNavigator = (global as any).navigator ? { ...(global as any).navigator } : undefined;

		// Initialize clean global environment
		if (!(global as any).window) {
			(global as any).window = {};
		}
		if (!(global as any).navigator) {
			(global as any).navigator = {};
		}

		// Set up base mocks that should persist across tests
		(global as any).navigator.mediaDevices = {
			getUserMedia: mockGetUserMedia
		};
	});

	afterAll(() => {
		// Restore original globals
		if (originalWindow) {
			(global as any).window = originalWindow;
		} else {
			delete (global as any).window;
		}

		if (originalNavigator) {
			(global as any).navigator = originalNavigator;
		} else {
			delete (global as any).navigator;
		}
	});

	beforeEach(async () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		jest.resetModules();

		// Dynamically import VoiceService functions after module reset
		const voiceService = await import("../../src/services/VoiceService");
		startVoiceRecording = voiceService.startVoiceRecording;
		stopVoiceRecording = voiceService.stopVoiceRecording;
		syncVoiceWithChatInput = voiceService.syncVoiceWithChatInput;

		// Set up clean mocks for each test
		(global as any).window.SpeechRecognition = MockSpeechRecognition;
		(global as any).window.webkitSpeechRecognition = MockSpeechRecognition;
		(global as any).window.MediaRecorder = MockMediaRecorder;

		settings = createDefaultSettings();
		toggleVoice = jest.fn().mockResolvedValue(undefined);
		triggerSendVoiceInput = jest.fn();
		setTextAreaValue = jest.fn();
		setInputLength = jest.fn();
		audioChunksRef = { current: [] };
		inputRef = { current: createMockInput() } as unknown as RefObject<HTMLInputElement>;
	});

	afterEach(() => {
		jest.useRealTimers();

		// Clean up any test-specific modifications to globals
		(global as any).window.SpeechRecognition = MockSpeechRecognition;
		(global as any).window.webkitSpeechRecognition = MockSpeechRecognition;
		(global as any).window.MediaRecorder = MockMediaRecorder;
	});

	describe("startVoiceRecording", () => {
		it.each([
			{
				sendAsAudio: false,
				description: "should start speech recognition and set language when sendAsAudio is false"
			},
			{
				sendAsAudio: true,
				description: "should start media recorder when sendAsAudio is true"
			}
		])("$description", async ({ sendAsAudio }) => {
			let recognitionInstanceGetter: any;

			if (!sendAsAudio) {
				const setup = setupSpeechRecognitionWithInstance();
				recognitionInstanceGetter = setup.recognitionInstance;
			} else {
				settings = createDefaultSettings({ voice: { sendAsAudio: true } });
				mockGetUserMedia.mockResolvedValue(createMockStream());
			}

			await startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			if (sendAsAudio) {
				expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
			} else {
				expect(mockStart).toHaveBeenCalled();
				expect(recognitionInstanceGetter().lang).toBe("en-US");
			}
		});

		it("should not start recognition if not available", () => {
			(global as any).window.SpeechRecognition = undefined;
			(global as any).window.webkitSpeechRecognition = undefined;

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			expect(mockStart).not.toHaveBeenCalled();

			// Restore
			(global as any).window.SpeechRecognition = MockSpeechRecognition;
			(global as any).window.webkitSpeechRecognition = MockSpeechRecognition;
		});

		it("should handle timeout and call toggleVoice", () => {
			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			jest.runAllTimers();
			expect(toggleVoice).toHaveBeenCalled();
		});

		it("should not start inactivity timer when timeoutPeriod is 0", async () => {
			settings = createDefaultSettings({ voice: { timeoutPeriod: 0 } });
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			simulateRecognitionResult(recognitionInstance(), "test");
			jest.runAllTimers();
			expect(toggleVoice).not.toHaveBeenCalled();
		});
	});

	describe("stopVoiceRecording", () => {
		it("should stop voice recording", () => {
			stopVoiceRecording();
			expect(mockStop).toHaveBeenCalled();
			expect(mockMediaRecorderStop).not.toHaveBeenCalled();
		});

		it("should stop media recorder if active", async () => {
			settings = createDefaultSettings({ voice: { sendAsAudio: true } });
			const mockStream = createMockStream();
			mockGetUserMedia.mockResolvedValue(mockStream);

			class RecordingMediaRecorder extends MockMediaRecorder {
				onstop: any = null;

				constructor() {
					super();
					this.state = "recording";
					// Override the stop mock to include our custom behavior
					this.stop = jest.fn().mockImplementation(() => {
						mockMediaRecorderStop();
						// Simulate the onstop event which is where tracks are actually stopped
						if (this.onstop) {
							this.onstop();
						}
					});
				}
			}
			(global as any).window.MediaRecorder = RecordingMediaRecorder;

			await startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			stopVoiceRecording();
			expect(mockMediaRecorderStop).toHaveBeenCalled();
			expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();

			(global as any).window.MediaRecorder = MockMediaRecorder;
		});
	});

	describe("syncVoiceWithChatInput", () => {
		it.each([
			[true, "should start recognition when keepVoiceOn is true"],
			[false, "should stop recognition when keepVoiceOn is false"]
		])("%s - %s", (keepVoiceOn) => {
			syncVoiceWithChatInput(keepVoiceOn, settings);

			if (keepVoiceOn) {
				expect(mockStart).toHaveBeenCalled();
			} else {
				expect(mockStop).toHaveBeenCalled();
			}
		});

		it("should not sync if voice is disabled or blockSpam is false", () => {
			settings = createDefaultSettings({ voice: { disabled: true } });
			syncVoiceWithChatInput(true, settings);
			expect(mockStart).not.toHaveBeenCalled();

			settings = createDefaultSettings({
				voice: { disabled: false },
				chatInput: { blockSpam: false }
			});
			syncVoiceWithChatInput(true, settings);
			expect(mockStart).not.toHaveBeenCalled();
		});

		it("should sync voice with chat input for audio recording mode", async () => {
			settings = createDefaultSettings({ voice: { sendAsAudio: true } });
			mockGetUserMedia.mockResolvedValue(createMockStream());

			const voiceService = await getVoiceServiceFunctions();

			await voiceService.startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			voiceService.stopVoiceRecording();

			mockGetUserMedia.mockClear();
			mockMediaRecorderStart.mockClear();

			voiceService.syncVoiceWithChatInput(true, settings);

			expect(mockMediaRecorderStart).toHaveBeenCalled();
			expect(mockGetUserMedia).not.toHaveBeenCalledTimes(2);
		}, 10000);
	});

	describe("Speech Recognition Events", () => {
		it("should handle autoSend timer and call triggerSendVoiceInput", async () => {
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			simulateRecognitionResult(recognitionInstance(), "test");
			jest.runAllTimers();

			expect(triggerSendVoiceInput).toHaveBeenCalled();
		});

		it("should respect character limit in onresult", async () => {
			inputRef = { current: createMockInput("12345") } as unknown as RefObject<HTMLInputElement>;
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			simulateRecognitionResult(recognitionInstance(), "67890abcde");

			expect(setTextAreaValue).toHaveBeenCalledWith("1234567890");
		});

		it("should not set autoSend timer when autoSendDisabled is true", async () => {
			settings = createDefaultSettings({ voice: { autoSendDisabled: true } });
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			simulateRecognitionResult(recognitionInstance(), "test");
			jest.runAllTimers();
			expect(triggerSendVoiceInput).not.toHaveBeenCalled();
		});

		it("should clear timers in onend when toggleOn is false", async () => {
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const voiceService = await getVoiceServiceFunctions();

			voiceService.startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			voiceService.stopVoiceRecording();

			if (recognitionInstance()?.onend) {
				recognitionInstance().onend();
			}

			expect(mockStart).toHaveBeenCalledTimes(1);
		});

		it("should handle onend when toggleOn is true and restart recognition", async () => {
			const { recognitionInstance } = setupSpeechRecognitionWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			if (recognitionInstance()?.onend) {
				recognitionInstance().onend();
			}

			expect(mockStart).toHaveBeenCalledTimes(2);
		});
	});

	describe("MediaRecorder Events", () => {
		it("should handle MediaRecorder ondataavailable event", async () => {
			settings = createDefaultSettings({ voice: { sendAsAudio: true } });
			mockGetUserMedia.mockResolvedValue(createMockStream());
			const { mediaRecorderInstance } = setupMediaRecorderWithInstance();
			const { startVoiceRecording } = await getVoiceServiceFunctions();

			await startVoiceRecording(
				settings,
				toggleVoice,
				triggerSendVoiceInput,
				setTextAreaValue,
				setInputLength,
				audioChunksRef,
				inputRef
			);

			const mockData = new Blob(['audio data']);
			if (mediaRecorderInstance()?.ondataavailable) {
				mediaRecorderInstance().ondataavailable({ data: mockData });
			}

			expect(audioChunksRef.current).toContain(mockData);
		});
	});
});
