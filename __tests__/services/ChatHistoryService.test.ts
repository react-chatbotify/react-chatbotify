import {
	saveChatHistory,
	loadChatHistory,
	getHistoryMessages,
	setHistoryMessages,
	clearHistoryMessages,
	setHistoryStorageValues,
} from "../../src/services/ChatHistoryService";
import { Message } from "../../src/types/Message";
import { Settings } from "../../src/types/Settings";
import { Dispatch } from "react";

jest.useFakeTimers();

describe("ChatHistoryService", () => {

	const mockMessage: Message = {
		id: "1",
		sender: "USER",
		content: "Hello good sir!",
		type: "text",
		timestamp: "2021-01-01T00:00:00Z",
		tags: [],
	};

	const mockSettings = (storageType: string): Settings => ({
		chatHistory: {
			storageType: storageType,
			storageKey: "rcb-history",
			maxEntries: 30,
			disabled: false,
			autoLoad: false,
		},
	});

	// Setup
	beforeAll(() => {
		global.Storage.prototype.setItem = jest.fn();
		global.Storage.prototype.getItem = jest.fn();
		global.Storage.prototype.removeItem = jest.fn();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// teardown
	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe.each([
		["LOCAL_STORAGE", localStorage],
		["SESSION_STORAGE", sessionStorage],
	])("saveChatHistory in %s", (storageType, storage) => {
		it("should not save history if disabled", async () => {
			const settings = {
				...mockSettings(storageType),
				chatHistory: { ...mockSettings(storageType).chatHistory, disabled: true },
			};

			setHistoryStorageValues(settings);
			await saveChatHistory([mockMessage]);
			expect(storage.setItem).not.toHaveBeenCalled();
		});

		it("should save history if not disabled", async () => {
			setHistoryStorageValues(mockSettings(storageType));
			await saveChatHistory([mockMessage]);

			expect(storage.setItem).toHaveBeenCalled();
		});

		it("should handle empty message array without errors", async () => {
			setHistoryStorageValues(mockSettings(storageType));
			await saveChatHistory([]);
			expect(storage.setItem).toHaveBeenCalled();
		});

		it("should limit the number of messages saved according to maxEntries", async () => {
			const maxEntriesSettings = {
				...mockSettings(storageType),
				chatHistory: {
					...mockSettings(storageType).chatHistory,
					maxEntries: 1
				},
			};
			setHistoryStorageValues(maxEntriesSettings);

			const extraMessage = { ...mockMessage, id: "2" };
			await saveChatHistory([mockMessage, extraMessage]);

			const savedData = JSON.parse((localStorage.setItem as jest.Mock).mock.calls[0][1]);
			expect(savedData).toHaveLength(1);
			expect(savedData[0].id).toBe("2");
		});
	});

	describe.each([
		["LOCAL_STORAGE", localStorage],
		["SESSION_STORAGE", sessionStorage],
	])("loadChatHistory", (storageType, storage) => {
		it("should load history and display messages", () => {
			const dispatch = jest.fn();
			const syncedMessagesRef = { current: [mockMessage] };
			const setIsLoadingChatHistory = jest.fn();
			const setHasChatHistoryLoaded = jest.fn();

			// Mock the div element for chatBodyRef
			const divElement = document.createElement("div");
			Object.defineProperty(divElement, "scrollHeight", { value: 1000 });
			divElement.scrollTop = 500;

			const chatBodyRef = {
				current: divElement
			};

			loadChatHistory(
				mockSettings(storageType),
				{},
				[mockMessage],
				dispatch,
				syncedMessagesRef,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory,
				setHasChatHistoryLoaded
			);

			jest.runAllTimers();

			expect(dispatch).toHaveBeenCalled();
			expect(setIsLoadingChatHistory).toHaveBeenCalledWith(false);
			expect(setHasChatHistoryLoaded).toHaveBeenCalledWith(true);
		});

		it("should preserve nested elements when restoring history", () => {
			const dispatch = jest.fn();
			const syncedMessagesRef = { current: [] };
			const setIsLoadingChatHistory = jest.fn();
			const setHasChatHistoryLoaded = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };
			const tableMessage: Message = {
				...mockMessage,
				content: "<table><thead><tr><th>Feature</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>",
				type: "object",
			};

			loadChatHistory(
				mockSettings(storageType),
				{},
				[tableMessage],
				dispatch,
				syncedMessagesRef,
				chatBodyRef,
				0,
				setIsLoadingChatHistory,
				setHasChatHistoryLoaded
			);

			jest.runAllTimers();

			const restoredMessages = dispatch.mock.calls.at(-1)[0] as Message[];
			const restoredTable = (restoredMessages[0].content as ReactElement[])[0];
			const [restoredHead, restoredBody] = Children.toArray(restoredTable.props.children) as ReactElement[];

			expect(restoredTable.type).toBe("table");
			expect(restoredHead.type).toBe("thead");
			expect(restoredBody.type).toBe("tbody");
			expect((Children.toArray(restoredBody.props.children)[0] as ReactElement).type).toBe("tr");
		});

		it("should handle corrupted data by clearing it from storage", () => {
			storage.setItem("rcb-history", "not_json_format");

			const dispatch = jest.fn();
			const syncedMessagesRef = { current: [] };
			const setIsLoadingChatHistory = jest.fn();
			const setHasChatHistoryLoaded = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };

			expect(() =>
				loadChatHistory(
					mockSettings(storageType),
					{},
					[],
					dispatch,
					syncedMessagesRef,
					chatBodyRef,
					1000,
					setIsLoadingChatHistory,
					setHasChatHistoryLoaded
				)
			).not.toThrow();
		});

		it("does not do anything if chat history is null", () => {
			const dispatch = jest.fn();
			const syncedMessagesRef = { current: [] };
			const setIsLoadingChatHistory = jest.fn();
			const setHasChatHistoryLoaded = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };

			loadChatHistory(
				mockSettings(storageType),
				{},
				null as unknown as Message[],
				dispatch,
				syncedMessagesRef,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory,
				setHasChatHistoryLoaded
			);

			expect(dispatch).not.toHaveBeenCalled();
		});

		it("handles errors gracefully and removes chat history on error", () => {
			const dispatch = () => { throw new Error("Error setting messages"); };
			const syncedMessagesRef = { current: [] };
			const setIsLoadingChatHistory = jest.fn();
			const setHasChatHistoryLoaded = jest.fn();
			const chatBodyRef = { current: document.createElement("div") };

			loadChatHistory(
				mockSettings(storageType),
				{},
				[],
				dispatch as Dispatch<any>,
				syncedMessagesRef,
				chatBodyRef,
				1000,
				setIsLoadingChatHistory,
				setHasChatHistoryLoaded,
			);

			expect(storage.removeItem).toHaveBeenCalledWith(mockSettings(storageType).chatHistory?.storageKey);
		});
	});

	describe("clearHistoryMessages", () => {
		it("should clear history messages", () => {
			clearHistoryMessages();

			expect(localStorage.removeItem).toHaveBeenCalledWith("rcb-history");
			expect(sessionStorage.removeItem).toHaveBeenCalledWith("rcb-history");
		});
	});

	describe("setHistoryStorageValues", () => {
		it.each([
			["LOCAL_STORAGE", localStorage],
			["SESSION_STORAGE", sessionStorage],
		])("should set storage values correctly in %s", (storageType, storage) => {
			setHistoryStorageValues(mockSettings(storageType));

			expect(storage.getItem).toHaveBeenCalledWith("rcb-history");
		});

		it("should handle invalid storage type by defaulting to local storage", () => {
			const invalidSettings = {
				...mockSettings,
				chatHistory: {
					...mockSettings("INVALID_TYPE").chatHistory
				}
			};

			setHistoryStorageValues(invalidSettings);

			expect(localStorage.getItem).toHaveBeenCalledWith("rcb-history");
		});
	});

	describe("getHistoryMessages", () => {
		it("should retrieve history messages", () => {
			setHistoryStorageValues(mockSettings("LOCAL_STORAGE"));
			setHistoryStorageValues(mockSettings("SESSION_STORAGE"));

			const historyMessages = getHistoryMessages();
			expect(historyMessages).toEqual([]);
		});
	});

	describe.each([
		["LOCAL_STORAGE", localStorage],
		["SESSION_STORAGE", sessionStorage],
	])("setHistoryMessages in %s", (storageType, storage) => {
		it("should set history messages", () => {
			setHistoryStorageValues(mockSettings(storageType));
			setHistoryMessages([mockMessage]);

			expect(storage.setItem).toHaveBeenCalledWith(
				"rcb-history",
				JSON.stringify([mockMessage])
			);
		});
	});
});
