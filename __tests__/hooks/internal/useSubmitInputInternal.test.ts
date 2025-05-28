import { renderHook, act } from "@testing-library/react";
import { expect } from "@jest/globals";

import { useSubmitInputInternal } from "../../../src/hooks/internal/useSubmitInputInternal";
import { useRcbEventInternal } from "../../../src/hooks/internal/useRcbEventInternal";
import { RcbEvent } from "../../../src/constants/RcbEvent";

import { TestChatBotProvider } from "../../__mocks__/TestChatBotContext";

// mocks internal hooks
jest.mock("../../../src/hooks/internal/useRcbEventInternal");
const mockUseRcbEventInternal = useRcbEventInternal as jest.MockedFunction<typeof useRcbEventInternal>;

/**
 * Test for useAudioInternal hook.
 */
describe("useSubmitInputInternal Hook", () => {
    let callRcbEventMock: jest.Mock<any, any, any>;

    beforeEach(() => {
		jest.clearAllMocks();

        // mocks rcb event handler
		callRcbEventMock = jest.fn().mockReturnValue({ defaultPrevented: false });
		mockUseRcbEventInternal.mockReturnValue({
			callRcbEvent: callRcbEventMock,
		});
	});

    // Test to ensure initial values (handleSubmitText) are returned correctly from the hook
    it("should return initial values from context", () => {
        const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});

        expect(result.current.handleSubmitText).toEqual(expect.any(Function));
    });

    it("should submit input text to rcb event handler", () => {
        const params = { inputText: 'some test', sendInChat: true };
        const { result } = renderHook(() => useSubmitInputInternal(), {
			wrapper: TestChatBotProvider,
		});

        // simulates submitting text
		act(() => {
			result.current.handleSubmitText(params.inputText, params.sendInChat);
		});

        // checks if callRcbEvent was called with rcb-user-submit-text and correct arguments
		expect(callRcbEventMock).toHaveBeenCalledWith(RcbEvent.USER_SUBMIT_TEXT, params);
    });
});