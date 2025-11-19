// identifiers for rcb events provided by the chatbot
enum RcbEvent {
	// audio
	START_SPEAK_AUDIO = "rcb-start-speak-audio",
	TOGGLE_AUDIO = "rcb-toggle-audio",

	// notifications
	TOGGLE_NOTIFICATIONS = "rcb-toggle-notifications",

	// voice
	TOGGLE_VOICE = "rcb-toggle-voice",

	// chat window
	TOGGLE_CHAT_WINDOW = "rcb-toggle-chat-window",

	// messages
	PRE_INJECT_MESSAGE = "rcb-pre-inject-message",
	POST_INJECT_MESSAGE = "rcb-post-inject-message",
	START_SIMULATE_STREAM_MESSAGE = "rcb-start-simulate-stream-message",
	STOP_SIMULATE_STREAM_MESSAGE = "rcb-stop-simulate-stream-message",
	START_STREAM_MESSAGE = "rcb-start-stream-message",
	CHUNK_STREAM_MESSAGE = "rcb-chunk-stream-message",
	STOP_STREAM_MESSAGE = "rcb-stop-stream-message",
	REMOVE_MESSAGE = "rcb-remove-message",
	PRE_UPDATE_MESSAGE = "rcb-pre-update-message",
	POST_UPDATE_MESSAGE = "rcb-post-update-message",

	// chat history
	SAVE_CHAT_HISTORY = "rcb-save-chat-history",
	LOAD_CHAT_HISTORY = "rcb-load-chat-history",

	// path
	CHANGE_PATH = "rcb-change-path",

	// toast
	SHOW_TOAST = "rcb-show-toast",
	DISMISS_TOAST = "rcb-dismiss-toast",

	// user input submission
	USER_SUBMIT_TEXT = "rcb-user-submit-text",
	USER_UPLOAD_FILE = "rcb-user-upload-file",

	// text area value change
	TEXT_AREA_CHANGE_VALUE = "rcb-text-area-change-value",

	// chatbot loading
	PRE_LOAD_CHATBOT = "rcb-pre-load-chatbot",
	POST_LOAD_CHATBOT = "rcb-post-load-chatbot",

	// block processing
	PRE_PROCESS_BLOCK = "rcb-pre-process-block",
	POST_PROCESS_BLOCK = "rcb-post-process-block",
}

export { RcbEvent };
