import { renderHook, act } from "@testing-library/react";
import { useToastsInternal} from "../../../src/hooks/internal/useToastsInternal";
import { useToastsContext} from "../../../src/context/ToastsContext";
import { useSettingsContext} from "../../../src/context/SettingsContext";
import { useRcbEventInternal } from "../../../src/hooks/internal/useRcbEventInternal";
import { Toast} from "../../../src";
import { RcbEvent} from "../../../src/constants/RcbEvent";
import { generateSecureUUID} from "../../../src/utils/idGenerator";

jest.mock("../../../src/utils/idGenerator");
jest.mock("../../../src/context/ToastsContext");
jest.mock("../../../src/context/SettingsContext");
jest.mock("../../../src/hooks/internal/useRcbEventInternal");


describe("useToastsInternal hook", () => {
	(generateSecureUUID as jest.Mock).mockReturnValue("mock-toast-id");
	const toast: Toast = {
		id: generateSecureUUID(),
		content: "Test Toast",
		timeout: 3000
	};
	const mockSetToasts = jest.fn();
	const callRcbEventMock = jest.fn().mockReturnValue({ defaultPrevented: false, data: {toast}});


	beforeEach(() => {
		jest.clearAllMocks();
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts: [],
			setToasts: mockSetToasts,
		});

		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				toast: { maxCount: 3, forbidOnMax: false },
				event: { rcbShowToast: true, rcbDismissToast: true },
			},
		});

		(useRcbEventInternal as jest.Mock).mockReturnValue({
			callRcbEvent: callRcbEventMock,
		});
	});

	test("should add a new toast with showToast", () => {
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts: [],
			setToasts: mockSetToasts,
		});
		const { result } = renderHook(() => useToastsInternal());

		act(() => {
			result.current.showToast("Test Toast", 3000);
		});

		expect(mockSetToasts).toHaveBeenCalledWith(expect.any(Function));
		expect(callRcbEventMock).toHaveBeenCalledWith(RcbEvent.SHOW_TOAST, {
			toast: toast,
		});
	});


	test("should not add a new toast if maxCount is reached and forbidOnMax is true", async () => {
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts: [{id: "1"}, {id: "2"}, {id: "3"}],
			setToasts: mockSetToasts,
		});

		(generateSecureUUID as jest.Mock).mockReturnValue("mock-toast-id");

		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {toast: {maxCount: 3, forbidOnMax: true}},
		});

		const {result} = renderHook(() => useToastsInternal());

		const toastId = await act(async () => result.current.showToast("Test Toast Exceed"));

		expect(mockSetToasts).not.toHaveBeenCalled();
		expect(toastId).toBeNull();
	});

	test("should replace oldest toast if maxCount is reached and forbidOnMax is false", () => {
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts: [{ id: "1" }, { id: "2" }, { id: "3" }],
			setToasts: mockSetToasts,
		});
		const { result } = renderHook(() => useToastsInternal());

		act(() => {
			result.current.showToast("Test Toast Exceed", 2000);
		});

		expect(mockSetToasts).toHaveBeenCalledWith(expect.any(Function));
	});

	test("should remove a toast with dismissToast", () => {
		const toasts = [{ id: "1", content: "Toast 1" }, { id: "2", content: "Toast 2" }];
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts,
			setToasts: mockSetToasts,
		});

		const { result } = renderHook(() => useToastsInternal());

		act(() => {
			result.current.dismissToast("1");
		});

		expect(mockSetToasts).toHaveBeenCalledWith(expect.any(Function));
		expect(callRcbEventMock).toHaveBeenCalledWith(RcbEvent.DISMISS_TOAST, { toast: toasts[0] });
	});

	test("should prevent toast dismissal if RCB event is prevented", () => {
		callRcbEventMock.mockReturnValueOnce({ defaultPrevented: true });

		const toasts = [{ id: "1", content: "Toast 1" }];
		(useToastsContext as jest.Mock).mockReturnValue({
			toasts,
			setToasts: mockSetToasts,
		});

		const { result } = renderHook(() => useToastsInternal());

		act(() => {
			result.current.dismissToast("1");
		});

		expect(mockSetToasts).not.toHaveBeenCalled();
	});

	test("should replace all toasts with replaceToasts", () => {
		const { result } = renderHook(() => useToastsInternal());

		const newToasts: Array<Toast> = [{ id: "1", content: "New Toast" }];

		act(() => {
			result.current.replaceToasts(newToasts);
		});

		expect(mockSetToasts).toHaveBeenCalledWith(newToasts);
	});
});
