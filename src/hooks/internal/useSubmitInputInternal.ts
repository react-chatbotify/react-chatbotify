import { useCallback } from "react";

import { postProcessBlock } from "../../services/BlockService/BlockService";
import { processIsSensitive } from "../../services/BlockService/IsSensitiveProcessor";
import { usePathsInternal } from "./usePathsInternal";
import { useMessagesInternal } from "./useMessagesInternal";
import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useVoiceInternal } from "./useVoiceInternal";
import { useTextAreaInternal } from "./useTextAreaInternal";
import { useChatWindowInternal } from "./useChatWindowInternal";
import { useToastsInternal } from "./useToastsInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { Flow } from "../../types/Flow";
import { RcbEvent } from "../../constants/RcbEvent";
import { usePathsContext } from "../../context/PathsContext";

/**
 * Internal custom hook for managing user input submissions.
 */
export const useSubmitInputInternal = () => {
	// handles settings
	const { settings } = useSettingsContext();

	// handles messages
	const {
		endStreamMessage,
		injectMessage,
		removeMessage,
		simulateStreamMessage,
		streamMessage
	} = useMessagesInternal();

	// handles paths
	const { syncedPathsRef } = usePathsContext();
	const { getCurrPath, getPrevPath, goToPath, firePostProcessBlockEvent } = usePathsInternal();

	// handles bot states
	const {
		setSyncedTextAreaSensitiveMode,
		setSyncedTextAreaDisabled,
		setSyncedIsBotTyping,
		setBlockAllowsAttachment,
		setInputLength,
		syncedVoiceToggledOnRef,
		syncedTextAreaSensitiveModeRef,
	} = useBotStatesContext();

	// handles bot refs
	const { flowRef, inputRef, keepVoiceOnRef, paramsInputRef, timeoutIdRef } = useBotRefsContext();

	// handles toasts
	const { showToast, dismissToast } = useToastsInternal();

	// handles rcb events
	const { dispatchRcbEvent } = useDispatchRcbEventInternal();

	// handles voice
	const { syncVoice } = useVoiceInternal();

	// handles input text area
	const { setTextAreaValue } = useTextAreaInternal();

	// handles chat window
	const { toggleChatWindow } = useChatWindowInternal();

	/**
	 * Handles sending of user input to check if should send as plain text or sensitive info.
	 * 
	 * @param userInput input provided by the user
	 */
	const handleSendUserInput = useCallback(async (userInput: string) => {
		const currPath = getCurrPath();
		if (!currPath) {
			return;
		}

		const block = (flowRef.current as Flow)[currPath];
		if (!block) {
			return;
		}

		if (syncedTextAreaSensitiveModeRef.current) {
			if (settings?.sensitiveInput?.hideInUserBubble) {
				return;
			} else if (settings?.sensitiveInput?.maskInUserBubble) {
				if (settings.userBubble?.simulateStream) {
					await simulateStreamMessage(
						"*".repeat(settings.sensitiveInput?.asterisksCount as number ?? 10),
						"USER"
					);
				} else {
					await injectMessage("*".repeat(settings.sensitiveInput?.asterisksCount as number ?? 10), "USER");
				}
				return;
			}
		}

		if (settings.userBubble?.simulateStream) {
			await simulateStreamMessage(userInput, "USER");
		} else {
			await injectMessage(userInput, "USER");
		}
	}, [flowRef, getCurrPath, settings, injectMessage, simulateStreamMessage, syncedTextAreaSensitiveModeRef]);

	/**
	 * Handles action input from the user which includes text, files and emoji.
	 * 
	 * @param userInput input provided by the user
	 * @param sendUserInput boolean indicating if user input should be sent as a message into the chat window
	 */
	const handleActionInput = useCallback(async (userInput: string, sendUserInput = true) => {
		userInput = userInput.trim();
		if (userInput === "") {
			return;
		}

		// sends user message into chat body
		if (sendUserInput) {
			await handleSendUserInput(userInput);
		}

		// if transition attribute was used, clear timeout
		if (timeoutIdRef.current) {
			clearTimeout(timeoutIdRef.current);
		}

		// clears input field
		if (inputRef.current) {
			setTextAreaValue("");
			setInputLength(0);
		}

		// ***** start of postprocessing logic *****

		const currPath = getCurrPath();
		if (!currPath) {
			return;
		}

		let block = (flowRef.current as Flow)[currPath];
		// fire event and use final block (if applicable)
		// finalBlock is used because it's possible users update the block in the event
		const finalBlock = await firePostProcessBlockEvent(block);

		// if no final block means event was prevented, so just return
		if (!finalBlock) {
			return;
		}

		// disables text area if block spam is true
		if (settings.chatInput?.blockSpam) {
			setSyncedTextAreaDisabled(true);
		}

		// tracks if voice is to be kept on later
		keepVoiceOnRef.current = syncedVoiceToggledOnRef.current;
		syncVoice(false);
		
		// shows bot typing indicator
		setTimeout(() => {
			setSyncedIsBotTyping(true);
		}, 400);

		// after user sends input, set sensitive mode to false first (default)
		// will be overriden if next block also has isSensitive attribute
		setSyncedTextAreaSensitiveMode(false);

		setTimeout(async () => {
			const params = {prevPath: getPrevPath(), currPath: getCurrPath(), goToPath, setTextAreaValue,
				userInput: paramsInputRef.current, injectMessage, simulateStreamMessage, streamMessage,
				removeMessage, endStreamMessage, toggleChatWindow, showToast, dismissToast
			};
			const currNumPaths = syncedPathsRef.current.length;
			await postProcessBlock(finalBlock, params);
			// if same length, means post-processing did not path to a block and if so, reset to current block states
			if (syncedPathsRef.current.length === currNumPaths) {
				if ("chatDisabled" in block) {
					setSyncedTextAreaDisabled(!!block.chatDisabled);
				} else {
					setSyncedTextAreaDisabled(!!settings.chatInput?.disabled);
				}
				processIsSensitive(block, params, setSyncedTextAreaSensitiveMode);
				setBlockAllowsAttachment(typeof block.file === "function");
				syncVoice(keepVoiceOnRef.current);
				setSyncedIsBotTyping(false);
			}
		}, settings.chatInput?.botDelay);

		// ***** end of postprocessing logic *****

	}, [timeoutIdRef, settings.chatInput?.blockSpam, settings.chatInput?.botDelay, settings.chatInput?.disabled,
		keepVoiceOnRef, syncedVoiceToggledOnRef, syncVoice, handleSendUserInput, getPrevPath, getCurrPath, goToPath,
		injectMessage, simulateStreamMessage, streamMessage, removeMessage, endStreamMessage, toggleChatWindow,
		showToast, dismissToast, flowRef
	]);

	/**
	 * Handles submission of user input via enter key or send button.
	 * 
	 * @param inputText input to send, if not provided defaults to text area value
	 */
	const handleSubmitText = useCallback(async (inputText?: string, sendInChat = true) => {
		// if no user input provided, grab from text area
		inputText = inputText ?? inputRef.current?.value ?? "";

		// handles user send text event
		if (settings.event?.rcbUserSubmitText) {
			const event = await dispatchRcbEvent(RcbEvent.USER_SUBMIT_TEXT, {inputText, sendInChat});
			if (event.defaultPrevented) {
				return;
			}
		}
		
		const currPath = getCurrPath();
		if (!currPath) {
			return;
		}
		handleActionInput(inputText, sendInChat);
	}, [dispatchRcbEvent, getCurrPath, handleActionInput, inputRef, settings.event?.rcbUserSubmitText])

	return { handleSubmitText }
};
