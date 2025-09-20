import {
  saveChatHistory,
  setHistoryMessages,
  setHistoryStorageValues,
} from "../../src/services/ChatHistoryService";
import { Message } from "../../src/types/Message";

// Simple mock settings fulfilling only required chatHistory shape
const baseSettings: any = {
  chatHistory: {
    storageKey: "rcb-history-test",
    maxEntries: 30,
    disabled: false,
    storageType: "LOCAL_STORAGE",
  },
};

describe("ChatHistoryService removal persistence", () => {
  beforeEach(() => {
    // jsdom localStorage clear
    localStorage.clear();
    // initialize storage values
    setHistoryStorageValues(baseSettings);
    setHistoryMessages([] as Message[]);
  });

  const factory = (
    id: string,
    content: string,
    sender: string = "BOT"
  ): Message => ({
    id,
    content,
    sender,
    type: "string",
    timestamp: new Date().toUTCString(),
    tags: [],
  });

  it("removes deleted messages from persisted history", async () => {
    const messages: Message[] = [
      factory("1", "Hello"),
      factory("2", "World"),
      factory("3", "!"),
    ];

    await saveChatHistory(messages);
    expect(
      JSON.parse(localStorage.getItem("rcb-history-test") as string).length
    ).toBe(3);

    // simulate removal of message with id 2
    const afterRemoval = messages.filter((m) => m.id !== "2");
    await saveChatHistory(afterRemoval);

    const stored = JSON.parse(
      localStorage.getItem("rcb-history-test") as string
    ) as Message[];
    expect(stored.map((m) => m.id)).toEqual(["1", "3"]);
  });

  it(
    "does not reintroduce previously removed message when a new message with " +
      "same rendered HTML is added",
    async () => {
      const first = factory("1", "<b>Typing...</b>");
      await saveChatHistory([first]);
      let stored = JSON.parse(
        localStorage.getItem("rcb-history-test") as string
      ) as Message[];
      expect(stored.length).toBe(1);

      // remove message 1 (empty array)
      await saveChatHistory([]);
      stored = JSON.parse(
        localStorage.getItem("rcb-history-test") as string
      ) as Message[];
      expect(stored.length).toBe(0);

      // inject a NEW message with same HTML but different id
      const second = factory("2", "<b>Typing...</b>");
      await saveChatHistory([second]);
      stored = JSON.parse(
        localStorage.getItem("rcb-history-test") as string
      ) as Message[];
      expect(stored.map((m) => m.id)).toEqual(["2"]);
    }
  );
});
