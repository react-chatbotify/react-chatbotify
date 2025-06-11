import { renderHook, act } from "@testing-library/react";
import { expect } from "@jest/globals";

import { useChatWindowInternal } from "../../../src/hooks/internal/useChatWindowInternal";
import { useDispatchRcbEventInternal } from "../../../src/hooks/internal/useDispatchRcbEventInternal";
import { RcbEvent } from "../../../src/constants/RcbEvent";

import { TestChatBotProvider } from "../../__mocks__/TestChatBotContext";
import { MockDefaultSettings } from "../../__mocks__/constants";

// shared ref for mocking useBotRefsContext
let mockChatBodyRef: { current: HTMLDivElement | null } = { current: null };

// mock BotRefsContext but keep other exports
jest.mock("../../../src/context/BotRefsContext", () => {
	const actual = jest.requireActual("../../../src/context/BotRefsContext");
	return {
		...actual,
		useBotRefsContext: () => ({ chatBodyRef: mockChatBodyRef }),
	};
});

// mocks internal hooks and services
jest.mock("../../../src/hooks/internal/useDispatchRcbEventInternal");
const mockUseRcbEventInternal = useDispatchRcbEventInternal as jest.MockedFunction<typeof useDispatchRcbEventInternal>;

/**
 * Test for useChatWindowInternal hook.
 */
describe("useChatWindowInternal Hook", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockChatBodyRef = { current: null };
	});

	// initial values
	const initialChatWindowOpen = MockDefaultSettings.chatWindow?.defaultOpen;

	it("should toggle chat window correctly, change state and emit rcb-toggle-chat-window event", async () => {
		// mocks rcb event handler
		const dispatchRcbEventMock = jest.fn().mockReturnValue({ defaultPrevented: false });
		mockUseRcbEventInternal.mockReturnValue({
			dispatchRcbEvent: dispatchRcbEventMock,
		});

		// renders the hook within the TestChatBotProvider
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});

		// checks initial value
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);

		// simulates clicking the toggle action
		await act(async () => {
			await result.current.toggleChatWindow();
		});

		// checks if dispatchRcbEvent was called with rcb-toggle-chat-window and correct arguments
		expect(dispatchRcbEventMock).toHaveBeenCalledWith(RcbEvent.TOGGLE_CHAT_WINDOW, {
			currState: initialChatWindowOpen,
			newState: !initialChatWindowOpen,
		});

		// check if chat window state was updated
		expect(result.current.isChatWindowOpen).toBe(!initialChatWindowOpen);

		// simulates clicking the toggle action
		await act(async () => {
			await result.current.toggleChatWindow();
		});

		// checks if dispatchRcbEvent was called with rcb-toggle-chat-window and correct arguments
		expect(dispatchRcbEventMock).toHaveBeenCalledWith(RcbEvent.TOGGLE_CHAT_WINDOW, {
			currState: !initialChatWindowOpen,
			newState: initialChatWindowOpen,
		});

		// check if chat window state was updated
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);
	});

	it("should prevent toggling when event is defaultPrevented", async () => {
		// mocks rcb event handler
		const dispatchRcbEventMock = jest.fn().mockReturnValue({ defaultPrevented: true });
		mockUseRcbEventInternal.mockReturnValue({
			dispatchRcbEvent: dispatchRcbEventMock,
		});

		// renders the hook within the TestChatBotProvider
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});

		// checks initial value
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);

		// simulates clicking the toggle action
		await act(async () => {
			await result.current.toggleChatWindow();
		});

		// checks if dispatchRcbEvent was called with rcb-toggle-chat-window and correct arguments
		expect(dispatchRcbEventMock).toHaveBeenCalledWith(RcbEvent.TOGGLE_CHAT_WINDOW, {
			currState: initialChatWindowOpen,
			newState: !initialChatWindowOpen,
		});

		// checks if chat window state stayed the same
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);
	});

	it("should call toggleChatWindow with correct parameters to open and close the chat window", async () => {
		// mocks rcb event handler
		const dispatchRcbEventMock = jest.fn().mockReturnValue({ defaultPrevented: false });
		mockUseRcbEventInternal.mockReturnValue({
			dispatchRcbEvent: dispatchRcbEventMock,
		});

		// renders the hook within the TestChatBotProvider
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});

		// checks initial value
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);

		// opens the chat window
		await act(async () => {
			await result.current.toggleChatWindow(true);
		});

		// checks if dispatchRcbEvent was called with rcb-toggle-chat-window and correct arguments
		expect(dispatchRcbEventMock).toHaveBeenCalledWith(RcbEvent.TOGGLE_CHAT_WINDOW, {
			currState: initialChatWindowOpen,
			newState: !initialChatWindowOpen,
		});

		// checks if chat window state was updated
		expect(result.current.isChatWindowOpen).toBe(!initialChatWindowOpen);

		// closes the chat window
		await act(async () => {
			await result.current.toggleChatWindow(false);
		});

		// checks if dispatchRcbEvent was called with rcb-toggle-chat-window and correct arguments
		expect(dispatchRcbEventMock).toHaveBeenCalledWith(RcbEvent.TOGGLE_CHAT_WINDOW, {
			currState: result.current.isChatWindowOpen,
			newState: !result.current.isChatWindowOpen,
		});

		// checks if chat window state was updated
		expect(result.current.isChatWindowOpen).toBe(initialChatWindowOpen);
	});
});

// Added tests for getIsChatBotVisible
describe("useChatWindowInternal Hook - getIsChatBotVisible", () => {

	beforeAll(() => {
		// Set the viewport size for testing
		Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
		Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockChatBodyRef = { current: document.createElement('div') };
	});

	it("should return false when chatBodyRef.current is null", () => {
		mockChatBodyRef.current = null;
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider // Still using provider for other context values
		});
		expect(result.current.getIsChatBotVisible()).toBe(false);
	});

	it("should return true when element is fully visible in the viewport", () => {
		// Ensure chatBodyRef.current is not null
		if (mockChatBodyRef.current) {
			mockChatBodyRef.current.getBoundingClientRect = jest.fn(() => ({
				top: 100,
				left: 100,
				bottom: 200,
				right: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({ top: 100, left: 100, bottom: 200, right: 200, width: 100, height: 100 }),
			}));
		}

		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});
		expect(result.current.getIsChatBotVisible()).toBe(true);
	});

	it("should return false when element's top is less than 0", () => {
		if (mockChatBodyRef.current) {
			mockChatBodyRef.current.getBoundingClientRect = jest.fn(() => ({
				top: -1,
				left: 100,
				bottom: 200,
				right: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({ top: -1, left: 100, bottom: 200, right: 200, width: 100, height: 100 }),
			}));
		}
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});
		expect(result.current.getIsChatBotVisible()).toBe(false);
	});

	it("should return false when element's left is less than 0", () => {
		if (mockChatBodyRef.current) {
			mockChatBodyRef.current.getBoundingClientRect = jest.fn(() => ({
				top: 100,
				left: -1,
				bottom: 200,
				right: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({ top: 100, left: -1, bottom: 200, right: 200, width: 100, height: 100 }),
			}));
		}
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});
		expect(result.current.getIsChatBotVisible()).toBe(false);
	});

	it("should return false when element's bottom exceeds window height", () => {
		if (mockChatBodyRef.current) {
			mockChatBodyRef.current.getBoundingClientRect = jest.fn(() => ({
				top: 100,
				left: 100,
				bottom: 800, // Exceeds window.innerHeight (768)
				right: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({ top: 100, left: 100, bottom: 800, right: 200, width: 100, height: 100 }),
			}));
		}
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});
		expect(result.current.getIsChatBotVisible()).toBe(false);
	});

	it("should return false when element's right exceeds window width", () => {
		if (mockChatBodyRef.current) {
			mockChatBodyRef.current.getBoundingClientRect = jest.fn(() => ({
				top: 100,
				left: 100,
				bottom: 200,
				right: 1100, // Exceeds window.innerWidth (1024)
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({ top: 100, left: 100, bottom: 200, right: 1100, width: 100, height: 100 }),
			}));
		}
		const { result } = renderHook(() => useChatWindowInternal(), {
			wrapper: TestChatBotProvider
		});
		expect(result.current.getIsChatBotVisible()).toBe(false);
	});
});
