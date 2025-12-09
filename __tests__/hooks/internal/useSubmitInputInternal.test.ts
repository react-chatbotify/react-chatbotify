import { renderHook, act } from "@testing-library/react";
import { expect } from "@jest/globals";
import { useSubmitInputInternal } from "../../../src/hooks/internal/useSubmitInputInternal";
import { RcbEvent } from "../../../src/constants/RcbEvent";
import { TestChatBotProvider } from "../../__mocks__/TestChatBotContext";

// Mock all dependencies
jest.mock("../../../src/hooks/internal/usePathsInternal", () => ({
	usePathsInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useMessagesInternal", () => ({
	useMessagesInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useDispatchRcbEventInternal", () => ({
	useDispatchRcbEventInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useVoiceInternal", () => ({
	useVoiceInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useTextAreaInternal", () => ({
	useTextAreaInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useChatWindowInternal", () => ({
	useChatWindowInternal: jest.fn(),
}));
jest.mock("../../../src/hooks/internal/useToastsInternal", () => ({
	useToastsInternal: jest.fn(),
}));
jest.mock("../../../src/context/BotStatesContext", () => ({
	useBotStatesContext: jest.fn(),
}));
jest.mock("../../../src/context/BotRefsContext", () => ({
	useBotRefsContext: jest.fn(),
}));
jest.mock("../../../src/context/SettingsContext", () => ({
	useSettingsContext: jest.fn(),
}));
jest.mock("../../../src/context/PathsContext", () => ({
	usePathsContext: jest.fn(),
}));
jest.mock("../../../src/services/BlockService/BlockService", () => ({
	postProcessBlock: jest.fn(),
}));
jest.mock("../../../src/services/BlockService/IsSensitiveProcessor", () => ({
	processIsSensitive: jest.fn(),
}));

describe("useSubmitInputInternal", () => {
	let mocks: any;

	beforeEach(() => {
		jest.clearAllMocks();
		// Setup all mocks and default returns
		mocks = {
			settings: {
				settings: {
					event: {},
					chatInput: { botDelay: 400 },
					sensitiveInput: {},
					userBubble: {},
				},
			},
			messages: {
				endStreamMessage: jest.fn(),
				injectMessage: jest.fn(),
				removeMessage: jest.fn(),
				simulateStreamMessage: jest.fn(),
				streamMessage: jest.fn(),
			},
			paths: {
				getCurrPath: jest.fn(() => "block1"),
				getPrevPath: jest.fn(() => "block0"),
				goToPath: jest.fn(),
				firePostProcessBlockEvent: jest.fn(async (block) => block),
			},
			states: {
				setSyncedTextAreaSensitiveMode: jest.fn(),
				setSyncedTextAreaDisabled: jest.fn(),
				setSyncedIsBotTyping: jest.fn(),
				setBlockAllowsAttachment: jest.fn(),
				setInputLength: jest.fn(),
				syncedVoiceToggledOnRef: { current: false },
				syncedTextAreaSensitiveModeRef: { current: false },
			},
			refs: {
				flowRef: { current: { block1: { id: "block1" } } },
				inputRef: { current: { value: "inputRefValue" } },
				keepVoiceOnRef: { current: false },
				paramsInputRef: { current: "paramsInput" },
				timeoutIdRef: { current: null },
			},
			toasts: {
				showToast: jest.fn(),
				dismissToast: jest.fn(),
			},
			dispatch: {
				dispatchRcbEvent: jest.fn(async () => ({ defaultPrevented: false })),
			},
			voice: {
				syncVoice: jest.fn(),
			},
			textArea: {
				setTextAreaValue: jest.fn(),
			},
			chatWindow: {
				toggleChatWindow: jest.fn(),
			},
			pathsContext: {
				syncedPathsRef: { current: ["block1"] },
			},
		};

		require("../../../src/context/SettingsContext")
			.useSettingsContext
			.mockReturnValue(mocks.settings);
		require("../../../src/hooks/internal/useMessagesInternal")
			.useMessagesInternal
			.mockReturnValue(mocks.messages);
		require("../../../src/context/PathsContext")
			.usePathsContext
			.mockReturnValue(mocks.pathsContext);
		require("../../../src/hooks/internal/usePathsInternal")
			.usePathsInternal
			.mockReturnValue(mocks.paths);
		require("../../../src/context/BotStatesContext")
			.useBotStatesContext
			.mockReturnValue(mocks.states);
		require("../../../src/context/BotRefsContext")
			.useBotRefsContext
			.mockReturnValue(mocks.refs);
		require("../../../src/hooks/internal/useToastsInternal")
			.useToastsInternal
			.mockReturnValue(mocks.toasts);
		require("../../../src/hooks/internal/useDispatchRcbEventInternal")
			.useDispatchRcbEventInternal
			.mockReturnValue(mocks.dispatch);
		require("../../../src/hooks/internal/useVoiceInternal")
			.useVoiceInternal
			.mockReturnValue(mocks.voice);
		require("../../../src/hooks/internal/useTextAreaInternal")
			.useTextAreaInternal
			.mockReturnValue(mocks.textArea);
		require("../../../src/hooks/internal/useChatWindowInternal")
			.useChatWindowInternal
			.mockReturnValue(mocks.chatWindow);
		require("../../../src/services/BlockService/BlockService")
			.postProcessBlock
			.mockResolvedValue(undefined);
		require("../../../src/services/BlockService/IsSensitiveProcessor")
			.processIsSensitive
			.mockReturnValue(undefined);
	});

	it("should call injectMessage with inputRef value if no inputText is provided", async () => {
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText();
		});
		expect(mocks.messages.injectMessage).toHaveBeenCalledWith("inputRefValue", "USER");
	});

	it("should call dispatchRcbEvent if rcbUserSubmitText is enabled", async () => {
		mocks.settings.settings.event.rcbUserSubmitText = true;
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("hello");
		});
		expect(mocks.dispatch.dispatchRcbEvent).toHaveBeenCalledWith(
			RcbEvent.USER_SUBMIT_TEXT,
			{ inputText: "hello", sendInChat: true }
		);
	});

	it("should not proceed if dispatchRcbEvent prevents default", async () => {
		mocks.settings.settings.event.rcbUserSubmitText = true;
		mocks.dispatch.dispatchRcbEvent.mockResolvedValueOnce({ defaultPrevented: true });
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("hello");
		});
		expect(mocks.messages.injectMessage).not.toHaveBeenCalled();
	});

	it("should not proceed if getCurrPath returns falsy", async () => {
		mocks.paths.getCurrPath.mockReturnValueOnce(null);
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("hello");
		});
		expect(mocks.messages.injectMessage).not.toHaveBeenCalled();
	});

	it("should trim input and not proceed if empty", async () => {
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("   ");
		});
		expect(mocks.messages.injectMessage).not.toHaveBeenCalled();
	});

	it("should clear input field and set input length", async () => {
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("hello");
		});
		expect(mocks.textArea.setTextAreaValue).toHaveBeenCalledWith("");
		expect(mocks.states.setInputLength).toHaveBeenCalledWith(0);
	});

	it("should call simulateStreamMessage if simulateStream is true", async () => {
		mocks.settings.settings.userBubble.simulateStream = true;
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("hello");
		});
		expect(mocks.messages.simulateStreamMessage).toHaveBeenCalledWith("hello", "USER");
	});

	it("should handle sensitive input: hideInUserBubble", async () => {
		mocks.states.syncedTextAreaSensitiveModeRef.current = true;
		mocks.settings.settings.sensitiveInput.hideInUserBubble = true;
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("secret");
		});
		expect(mocks.messages.injectMessage).not.toHaveBeenCalled();
		expect(mocks.messages.simulateStreamMessage).not.toHaveBeenCalled();
	});

	it("should handle sensitive input: maskInUserBubble with simulateStream", async () => {
		mocks.states.syncedTextAreaSensitiveModeRef.current = true;
		mocks.settings.settings.sensitiveInput.maskInUserBubble = true;
		mocks.settings.settings.sensitiveInput.asterisksCount = 5;
		mocks.settings.settings.userBubble.simulateStream = true;
		const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});
		await act(async () => {
			await result.current.handleSubmitText("secret");
		});
		expect(mocks.messages.simulateStreamMessage).toHaveBeenCalledWith("*****", "USER");
	});
});