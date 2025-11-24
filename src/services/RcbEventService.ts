import { EventDetail } from "../types/internal/events/EventDetail";
import { RcbBaseEvent } from "../types/internal/events/RcbBaseEvent";
import { RcbEvent } from "../constants/RcbEvent";

// tracks if an event is cancellable
const cancellableMap: Record<RcbEvent, boolean> = {
	[RcbEvent.START_SPEAK_AUDIO]: true,
	[RcbEvent.TOGGLE_AUDIO]: true,
	[RcbEvent.TOGGLE_VOICE]: true,
	[RcbEvent.TOGGLE_NOTIFICATIONS]: true,
	[RcbEvent.TOGGLE_CHAT_WINDOW]: true,
	[RcbEvent.PRE_INJECT_MESSAGE]: true,
	[RcbEvent.POST_INJECT_MESSAGE]: false,
	[RcbEvent.PRE_LOAD_CHATBOT]: true,
	[RcbEvent.POST_LOAD_CHATBOT]: false,
	[RcbEvent.START_SIMULATE_STREAM_MESSAGE]: true,
	[RcbEvent.STOP_SIMULATE_STREAM_MESSAGE]: false,
	[RcbEvent.START_STREAM_MESSAGE]: true,
	[RcbEvent.CHUNK_STREAM_MESSAGE]: true,
	[RcbEvent.STOP_STREAM_MESSAGE]: true,
	[RcbEvent.REMOVE_MESSAGE]: true,
	[RcbEvent.PRE_UPDATE_MESSAGE]: true,
	[RcbEvent.POST_UPDATE_MESSAGE]: false,
	[RcbEvent.SAVE_CHAT_HISTORY]: true,
	[RcbEvent.LOAD_CHAT_HISTORY]: true,
	[RcbEvent.CHANGE_PATH]: true,
	[RcbEvent.SHOW_TOAST]: true,
	[RcbEvent.DISMISS_TOAST]: true,
	[RcbEvent.USER_SUBMIT_TEXT]: true,
	[RcbEvent.USER_UPLOAD_FILE]: true,
	[RcbEvent.TEXT_AREA_CHANGE_VALUE]: true,
	[RcbEvent.PRE_PROCESS_BLOCK]: true,
	[RcbEvent.POST_PROCESS_BLOCK]: true,
}

/**
 * Emits a custom event with specified name, detail and data.
 *
 * @param eventName name of the event to emit
 * @param eventDetail additional data to include with the event.
 */
export const emitRcbEvent = async (eventName: RcbEvent,
	eventDetail: EventDetail, data: object): Promise<RcbBaseEvent> => {

	// Create a custom event with the provided name and detail
	const event: RcbBaseEvent = new CustomEvent(eventName, {
		detail: eventDetail,
		cancelable: cancellableMap[eventName],
	}) as RcbBaseEvent<typeof data, EventDetail>;

	event.data = data;
	event.promises = [];

	window.dispatchEvent(event);

	await Promise.all(event.promises);

	return event;
}
