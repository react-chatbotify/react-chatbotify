import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useMessagesInternal } from "../../../src/hooks/internal/useMessagesInternal";
import { useSettingsContext } from "../../../src/context/SettingsContext";
import { useMessagesContext } from "../../../src/context/MessagesContext";
import { useBotStatesContext } from "../../../src/context/BotStatesContext";
import { useBotRefsContext } from "../../../src/context/BotRefsContext";
import { useDispatchRcbEventInternal } from "../../../src/hooks/internal/useDispatchRcbEventInternal";
import { getHistoryMessages, setHistoryMessages, saveChatHistory } from "../../../src/services/ChatHistoryService";
import { RcbEvent } from "../../../src/constants/RcbEvent";
import { Message } from "../../../src/types/Message";

jest.mock("../../../src/context/SettingsContext");
jest.mock("../../../src/context/MessagesContext");
jest.mock("../../../src/context/BotStatesContext");
jest.mock("../../../src/context/BotRefsContext");
jest.mock("../../../src/hooks/internal/useDispatchRcbEventInternal");
jest.mock("../../../src/services/AudioService");
jest.mock("../../../src/services/ChatHistoryService");

describe("useMessagesInternal", () => {
	const setSyncedMessagesMock = jest.fn();
	const mockSetSyncedIsBotTyping = jest.fn();
	const mockSetUnreadCount = jest.fn();
	const mockCallRcbEvent = jest.fn();
	const mockStreamMessageMap = { current: new Map() };
	const mockMessages: Message[] = [];
	const mockMessagesSyncRef = { current: mockMessages };
	const mockSyncedIsScrollingRef = { current: false };
	const mockSyncedIsChatWindowOpenRef = { current: false };
	const mockSyncedNotificationsToggledOnRef = { current: false };
	const mockChatBodyRef = { current: null };
	const mockGetHistoryMessages = jest.fn();
	const mockSetHistoryMessages = jest.fn();
	const mockSaveChatHistory = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				botBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				userBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				event: {},
			},
		});

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: mockMessages,
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: mockMessagesSyncRef,
		});

		(useBotStatesContext as jest.Mock).mockReturnValue({
			audioToggledOn: false,
			isChatWindowOpen: true,
			setSyncedIsBotTyping: mockSetSyncedIsBotTyping,
			setUnreadCount: mockSetUnreadCount,
			syncedIsScrollingRef: mockSyncedIsScrollingRef,
			syncedIsChatWindowOpenRef: mockSyncedIsChatWindowOpenRef,
			syncedNotificationsToggledOnRef: mockSyncedNotificationsToggledOnRef,
		});

		(useBotRefsContext as jest.Mock).mockReturnValue({
			streamMessageMap: mockStreamMessageMap,
			chatBodyRef: mockChatBodyRef,
		});

		(useDispatchRcbEventInternal as jest.Mock).mockReturnValue({
			dispatchRcbEvent: mockCallRcbEvent,
		});

		(getHistoryMessages as jest.Mock).mockImplementation(mockGetHistoryMessages);
		(setHistoryMessages as jest.Mock).mockImplementation(mockSetHistoryMessages);
		(saveChatHistory as jest.Mock).mockImplementation(mockSaveChatHistory);
	});

	it("should return expected functions and values", () => {
		const { result } = renderHook(() => useMessagesInternal());

		expect(result.current).toHaveProperty("endStreamMessage");
		expect(result.current).toHaveProperty("injectMessage");
		expect(result.current).toHaveProperty("removeMessage");
		expect(result.current).toHaveProperty("updateMessage");
		expect(result.current).toHaveProperty("streamMessage");
		expect(result.current).toHaveProperty("messages");
		expect(result.current).toHaveProperty("replaceMessages");
	});

	it("should inject a message correctly", async () => {
		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			const message = await result.current.injectMessage("Test message", "BOT");
			expect(message).toBeTruthy();
		});

		expect(setSyncedMessagesMock).toHaveBeenCalledWith(expect.any(Function));
		expect(mockSetUnreadCount).toHaveBeenCalledWith(expect.any(Function));
	});

	it("should remove a message correctly", async () => {
		const mockMessageId = "test-id";
		const mockMessage: Message = {
			id: mockMessageId,
			content: "Test",
			sender: "BOT",
			type: "text",
			timestamp: String(Date.now()),
			tags: [],
		};

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: [mockMessage],
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: { current: [mockMessage] },
		});

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			const removed = await result.current.removeMessage(mockMessageId);
			expect(removed).toBe(mockMessage);
		});

		expect(setSyncedMessagesMock).toHaveBeenCalledWith(expect.any(Function));
		expect(mockSetUnreadCount).toHaveBeenCalledWith(expect.any(Function));
	});

	it("should remove a message from chat history when not present in current messages", async () => {
		const mockMessageId = "history-id";
		const historyMessage: Message = {
			id: mockMessageId,
			content: "History",
			sender: "BOT",
			type: "text",
			timestamp: String(Date.now()),
			tags: [],
		};

		mockGetHistoryMessages.mockReturnValue([historyMessage]);

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: [],
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: { current: [] },
		});

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			const removed = await result.current.removeMessage(mockMessageId);
			expect(removed).toBe(historyMessage);
		});

		expect(setSyncedMessagesMock).not.toHaveBeenCalled();
		expect(mockSetHistoryMessages).toHaveBeenCalledWith([]);
	});

	it("should update a message correctly and dispatch events", async () => {
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				event: { rcbPreUpdateMessage: true, rcbPostUpdateMessage: true },
			},
		});

		const mockMessageId = "test-id";
		const mockMessage: Message = {
			id: mockMessageId,
			content: "Test",
			sender: "BOT",
			type: "text",
			timestamp: String(Date.now()),
			tags: [],
		};

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: [mockMessage],
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: { current: [mockMessage] },
		});

		const { result } = renderHook(() => useMessagesInternal());

		const newMessage = { ...mockMessage, content: "Updated" };
		mockCallRcbEvent.mockResolvedValue({ defaultPrevented: false });
		await act(async () => {
			await result.current.updateMessage(mockMessageId, newMessage);
		});

		expect(mockCallRcbEvent).toHaveBeenCalledWith(RcbEvent.PRE_UPDATE_MESSAGE, { message: newMessage });
		expect(setSyncedMessagesMock).toHaveBeenCalledWith(expect.any(Function));
		expect(mockCallRcbEvent).toHaveBeenCalledWith(RcbEvent.POST_UPDATE_MESSAGE, { message: newMessage });
	});

	it("should stream a message correctly", async () => {
		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			const message = await result.current.streamMessage("Test stream", "BOT");
			expect(message).toBeTruthy();
		});

		expect(setSyncedMessagesMock).toHaveBeenCalledWith(expect.any(Function));
		expect(mockSetUnreadCount).toHaveBeenCalledWith(expect.any(Function));
		expect(mockStreamMessageMap.current.has("BOT")).toBeTruthy();
	});

	it("should end stream message correctly", async () => {
		const message: Message = {
			id: "test-id",
			content: "streaming...",
			sender: "BOT",
			type: "text",
			timestamp: String(Date.now()),
			tags: [],
		};

		mockStreamMessageMap.current.set("BOT", message.id);

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: [message],
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: { current: [message] },
		});

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			const success = await result.current.endStreamMessage("BOT");
			expect(success).toBeTruthy();
		});

		expect(mockStreamMessageMap.current.has("BOT")).toBeFalsy();
	});

	it("should emit save chat history event and skip saving when prevented", async () => {
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				botBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				userBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				event: { rcbSaveChatHistory: true },
			},
		});
		mockCallRcbEvent.mockResolvedValueOnce({ defaultPrevented: true });

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			await result.current.injectMessage("Test message", "BOT");
			await Promise.resolve();
		});

		expect(mockCallRcbEvent).toHaveBeenCalledWith(RcbEvent.SAVE_CHAT_HISTORY, {
			messages: expect.any(Array),
		});
		expect(mockSaveChatHistory).not.toHaveBeenCalled();
	});

	it("should allow save chat history event to override messages", async () => {
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				botBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				userBubble: { dangerouslySetInnerHtml: false, simulateStream: false },
				event: { rcbSaveChatHistory: true },
			},
		});
		const overriddenMessages: Message[] = [{
			id: "override",
			content: "custom",
			sender: "BOT",
			type: "text",
			timestamp: String(Date.now()),
			tags: [],
		}];
		mockCallRcbEvent.mockResolvedValueOnce({
			defaultPrevented: false,
			data: { messages: overriddenMessages },
		});

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			await result.current.injectMessage("Test message", "BOT");
			await Promise.resolve();
		});

		expect(mockSaveChatHistory).toHaveBeenCalledWith(overriddenMessages);
	});

	it("should replace messages with array correctly", async () => {
		const newMessages: Message[] = [
			{
				id: "msg-1",
				content: "New message 1",
				sender: "BOT",
				type: "text",
				timestamp: String(Date.now()),
			},
			{
				id: "msg-2",
				content: "New message 2",
				sender: "USER",
				type: "text",
				timestamp: String(Date.now()),
			},
		];

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			result.current.replaceMessages(newMessages);
		});

		expect(setSyncedMessagesMock).toHaveBeenCalledWith(newMessages);
	});

	it("should replace messages with callback function correctly", async () => {
		const existingMessages: Message[] = [
			{
				id: "existing-1",
				content: "Existing message",
				sender: "BOT",
				type: "text",
				timestamp: String(Date.now()),
			},
		];

		(useMessagesContext as jest.Mock).mockReturnValue({
			messages: existingMessages,
			setSyncedMessages: setSyncedMessagesMock,
			syncedMessagesRef: { current: existingMessages },
		});

		const { result } = renderHook(() => useMessagesInternal());

		await act(async () => {
			result.current.replaceMessages((currentMessages) => {
				return currentMessages.map(msg => ({
					...msg,
					content: msg.content + " - Updated",
				}));
			});
		});

		// The callback should use syncedMessagesRef.current, so it gets the existing messages
		expect(setSyncedMessagesMock).toHaveBeenCalledWith([
			{
				...existingMessages[0],
				content: "Existing message - Updated",
			},
		]);
	});
});
