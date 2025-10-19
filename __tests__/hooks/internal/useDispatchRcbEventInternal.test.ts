import { renderHook, act } from "@testing-library/react";

import { useDispatchRcbEventInternal } from "../../../src/hooks/internal/useDispatchRcbEventInternal";
import { RcbEvent } from "../../../src/constants/RcbEvent";

const emitRcbEventMock = jest.fn();
jest.mock("../../../src/services/RcbEventService", () => ({
  emitRcbEvent: (...args: any[]) => emitRcbEventMock(...args),
}));

let botIdRef = { current: "bot-1" } as { current: string | null };
let syncedPathsRef = { current: ["/home", "/chat"] } as { current: string[] };

jest.mock("../../../src/context/BotRefsContext", () => ({
  useBotRefsContext: () => ({ botIdRef }),
}));

jest.mock("../../../src/context/PathsContext", () => ({
  usePathsContext: () => ({ syncedPathsRef }),
}));

describe("useDispatchRcbEventInternal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    botIdRef = { current: "bot-1" };
    syncedPathsRef = { current: ["/home", "/chat"] };
  });

  it("should call emitRcbEvent with botId, currPath and prevPath and provided data", async () => {
    emitRcbEventMock.mockResolvedValue({ defaultPrevented: false });

    const { result } = renderHook(() => useDispatchRcbEventInternal());

    await act(async () => {
      const ret = await result.current.dispatchRcbEvent(
        RcbEvent.TOGGLE_CHAT_WINDOW,
        { foo: "bar" }
      );
      expect(ret).toBeDefined();
    });

    expect(emitRcbEventMock).toHaveBeenCalledTimes(1);
    const [eventName, detail, data] = emitRcbEventMock.mock.calls[0];
    expect(eventName).toBe(RcbEvent.TOGGLE_CHAT_WINDOW);
    expect(detail).toMatchObject({
      botId: "bot-1",
      currPath: "/chat",
      prevPath: "/home",
    });
    expect(data).toMatchObject({ foo: "bar" });
  });

  it("should handle empty paths array (null curr/prev paths)", async () => {
    syncedPathsRef = { current: [] };
    emitRcbEventMock.mockResolvedValue({});

    const { result } = renderHook(() => useDispatchRcbEventInternal());

    await act(async () => {
      await result.current.dispatchRcbEvent(RcbEvent.LOAD_CHAT_HISTORY, {});
    });

    expect(emitRcbEventMock).toHaveBeenCalledTimes(1);
    const [, detail] = emitRcbEventMock.mock.calls[0];
    expect(detail).toMatchObject({
      botId: "bot-1",
      currPath: null,
      prevPath: null,
    });
  });

  it("should use the latest botIdRef value", async () => {
    botIdRef = { current: "bot-2" };
    emitRcbEventMock.mockResolvedValue({});

    const { result } = renderHook(() => useDispatchRcbEventInternal());

    await act(async () => {
      await result.current.dispatchRcbEvent(RcbEvent.SHOW_TOAST, { msg: "hi" });
    });

    expect(emitRcbEventMock).toHaveBeenCalledTimes(1);
    const [, detail] = emitRcbEventMock.mock.calls[0];
    expect(detail.botId).toBe("bot-2");
  });
});
