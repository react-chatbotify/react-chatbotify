import { useCallback } from "react";

import { getHistoryMessages, saveChatHistory, setHistoryMessages } from "../../services/ChatHistoryService";
import { createMessage } from "../../utils/messageBuilder";
import { useSettingsContext } from "../../context/SettingsContext";
import { useMessagesContext } from "../../context/MessagesContext";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useNotificationInternal } from "./useNotificationsInternal";
import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useAudioInternal } from "./useAudioInternal";
import { useChatWindowInternal } from "./useChatWindowInternal";
import { Message } from "../../types/Message";
import { RcbEvent } from "../../constants/RcbEvent";

/**
 * Internal custom hook for managing sending of messages.
 */
export const useMessagesInternal = () => {
	// handles settings
	const { settings } = useSettingsContext();

	// handles messages
	const { messages, setSyncedMessages, syncedMessagesRef } = useMessagesContext();

	// handles bot states
	const {
		setSyncedIsBotTyping,
		setUnreadCount,
		syncedIsScrollingRef,
		syncedIsChatWindowOpenRef,
	} = useBotStatesContext();

	// handles bot refs
	const { streamMessageMap, chatBodyRef, paramsInputRef } = useBotRefsContext();

	// handles chat window
	const { scrollToBottom, getIsChatBotVisible } = useChatWindowInternal();

	// handles rcb events
	const { dispatchRcbEvent } = useDispatchRcbEventInternal();

	// handles audio
	const { speakAudio } = useAudioInternal();

	// handles notification
	const { playNotificationSound } = useNotificationInternal();

	/**
	 * Saves chat history with event dispatching.
	 * 
	 * @param messages messages to save
	 */
	const handleSaveChatHistory = useCallback(async (messages: Message[]) => {
		if (settings.event?.rcbSaveChatHistory) {
			const event = await dispatchRcbEvent(RcbEvent.SAVE_CHAT_HISTORY, { messages });
			if (event.defaultPrevented) {
				return;
			}
			messages = event.data?.messages ?? messages;
		}

		await saveChatHistory(messages);
	}, [dispatchRcbEvent, settings.event?.rcbSaveChatHistory]);

	/**
	 * Handles post messages updates such as saving chat history, scrolling to bottom
	 * and playing notification sound.
	 * 
	 * Note: The isRepeatedStreamMessage variable is added specifically for repeated calls within streamMessage.
	 * This happens because streamMessage is oftentimes called in a loop to update messages quickly. Special handling
	 * needs to be done in this case to avoid issues such as users being unable to scroll away or notification sound
	 * spams. For other message inputs (e.g. injectMessage), handlePostMessageUpdate is only called once.
	 * 
	 * @param updatedMessages messages after update
	 * @param isRepeatedStreamMessage boolean indicating whether to update scroll position
	 */
	const handlePostMessagesUpdate = useCallback((updatedMessages: Message[], isRepeatedStreamMessage = false) => {
		handleSaveChatHistory(updatedMessages);

		// tracks if notification should be played
		let shouldNotify = true;

		// if messages are empty (i.e. fully cleared), nothing to do
		const lastMessage = updatedMessages[updatedMessages.length - 1];
		if (!lastMessage) {
			return;
		}

		// if latest message is sent by user, no need to notify
		const sender = lastMessage.sender.toUpperCase();
		if (sender === "USER") {
			shouldNotify = false;
		}

		// if chatbot is embedded and visible, no need to notify
		if (settings.general?.embedded && getIsChatBotVisible()) {
			shouldNotify = false;
		}

		// if chatbot is open and user is not scrolling or is repeated stream message, no need to notify
		if ((syncedIsChatWindowOpenRef.current && !syncedIsScrollingRef.current) || isRepeatedStreamMessage) {
			shouldNotify = false;
		}

		if (shouldNotify) {
			playNotificationSound();
		}

		if (
			!isRepeatedStreamMessage &&
			((sender !== "USER" && settings.chatWindow?.autoJumpToBottom) ||
				sender === "USER" || !syncedIsScrollingRef.current)
		) {
			// defer update to next event loop, handles edge case where messages are sent too fast
			// and the scrolling does not properly reach the bottom
			setTimeout(() => scrollToBottom(), 1);
		}
	}, [settings, chatBodyRef, syncedIsChatWindowOpenRef, syncedIsScrollingRef,
		playNotificationSound, scrollToBottom, getIsChatBotVisible]);

	/**
	 * Simulates the streaming of a message from the bot.
	 * 
	 * @param content message string to simulate stream for
	 * @param sender sender of the message, defaults to bot
	 * @param simulateStreamChunker function to override chunking of string for streaming simulation
	 */
	const simulateStreamMessage = useCallback(async (content: string,
		sender = "BOT", simulateStreamChunker: ((content: string) => Array<string>) | null = null
	): Promise<Message | null> => {
		if (typeof content !== "string") {
			throw new Error("Content must be of type string to simulate stream.");
		}

		// always convert to uppercase for checks
		sender = sender.toUpperCase();

		let message = createMessage(content, sender);
		if (settings.event?.rcbStartSimulateStreamMessage) {
			const event = await dispatchRcbEvent(
				RcbEvent.START_SIMULATE_STREAM_MESSAGE,
				{ message }
			);
			if (event.defaultPrevented) {
				return null;
			}
			simulateStreamChunker = event.data.simulateStreamChunker || simulateStreamChunker;
			message = event.data.message;
		}

		// stop bot typing when simulating stream
		setSyncedIsBotTyping(false);
		

		let streamSpeed = 30;
		if (sender === "BOT") {
			streamSpeed = settings.botBubble?.streamSpeed as number;
		} else {
			streamSpeed = settings.userBubble?.streamSpeed as number;
		}

		// set an initial empty message to be used for simulating streaming
		const placeholderMessage = { ...message, content: "" };
		setSyncedMessages(prev => [...prev, placeholderMessage]);
		handlePostMessagesUpdate(syncedMessagesRef.current);

		// initialize default message to empty with stream index position 0
		let streamMessage: string | string[] = message.content as string;
		if (simulateStreamChunker) {
			streamMessage = simulateStreamChunker(streamMessage as string);
		}
		let streamIndex = 0;
		const endStreamIndex = streamMessage.length;

		// speak audio if conditions are met
		if (message.sender.toUpperCase() === "BOT" &&
			(syncedIsChatWindowOpenRef.current || settings.general?.embedded)) {
			if (typeof message.content === "string" && message.content.trim() !== "") {
				speakAudio(message.content);
			}
		}

		const simulateStreamDoneTask: Promise<void> = new Promise((resolve) => {
			const intervalId = setInterval(() => {
				// consider streaming done once end index is reached or exceeded
				// when streaming is done, remove task and resolve the promise
				if (streamIndex >= endStreamIndex) {
					clearInterval(intervalId);
					resolve();
					return;
				}

				setSyncedMessages((prevMessages) => {
					const updatedMessages = [...prevMessages];
					for (let i = updatedMessages.length - 1; i >= 0; i--) {
						if (updatedMessages[i].id === placeholderMessage.id) {
							const character = streamMessage[streamIndex];
							if (character) {
								placeholderMessage.content += character;
								updatedMessages[i] = placeholderMessage;
							}
							streamIndex++;
							break;
						}
					}
					return updatedMessages;
				});
			}, streamSpeed);
		});

		// if user is scrolling or window is closed, add 1 to unread count
		if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
			setUnreadCount((prev) => prev + 1);
		}
		await simulateStreamDoneTask;
		handleSaveChatHistory(syncedMessagesRef.current);

		// handles stop stream message event
		if (settings.event?.rcbStopSimulateStreamMessage) {
			await dispatchRcbEvent(RcbEvent.STOP_SIMULATE_STREAM_MESSAGE, { message });
		}

		// update params.userInput if sender is user
		if (sender === "USER") {
			paramsInputRef.current = content;
		}
		return message;
	}, [settings, dispatchRcbEvent, handlePostMessagesUpdate, syncedMessagesRef, paramsInputRef,
		setSyncedIsBotTyping, setUnreadCount, syncedIsChatWindowOpenRef, speakAudio
	]);

	/**
	 * Injects a message at the end of the messages array.
	 * 
	 * @param content message content to inject
	 * @param sender sender of the message, defaults to bot
	 */
	const injectMessage = useCallback(async (content: string | JSX.Element,
		sender = "BOT"): Promise<Message | null> => {

		// always convert to uppercase for checks
		sender = sender.toUpperCase();
		
		let message = createMessage(content, sender);
		if (settings.event?.rcbPreInjectMessage) {
			const event = await dispatchRcbEvent(RcbEvent.PRE_INJECT_MESSAGE, { message });
			if (event.defaultPrevented) {
				return null;
			}
			message = event.data.message;
		}

		// speak audio if conditions are met
		if (message.sender.toUpperCase() === "BOT" &&
			(syncedIsChatWindowOpenRef.current || settings.general?.embedded)) {
			if (typeof message.content === "string" && message.content.trim() !== "") {
				speakAudio(message.content);
			}
		}

		// if user is scrolling or window is closed, add 1 to unread count
		if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
			setUnreadCount((prev) => prev + 1);
		}

		// handles post-message inject event
		if (settings.event?.rcbPostInjectMessage) {
			await dispatchRcbEvent(RcbEvent.POST_INJECT_MESSAGE, { message });
		}

		setSyncedMessages(prev => [...prev, message]);
		handlePostMessagesUpdate(syncedMessagesRef.current);

		// update params.userInput if sender is user
		if (sender === "USER" && typeof content === "string") {
			paramsInputRef.current = content;
		}
		return message;
	}, [settings, dispatchRcbEvent, handlePostMessagesUpdate, paramsInputRef,
		syncedMessagesRef, syncedIsChatWindowOpenRef, speakAudio, setUnreadCount
	]);

	/**
	 * Removes a message with the given id.
	 * 
	 * @param messageId id of message to remove
	 */
	const removeMessage = useCallback(async (messageId: string): Promise<Message | null> => {
		let message = syncedMessagesRef.current.find((m) => m.id === messageId);
		let historyMessages: Message[] | null = null;
		let isHistoryMessage = false;

		// if not found in current messages, check in history messages
		if (!message) {
			historyMessages = getHistoryMessages();
			message = historyMessages.find((m) => m.id === messageId);
			if (message) {
				isHistoryMessage = true;
			}
		}

		// nothing to remove if no such message at all
		if (!message) {
			return null;
		}

		// handles remove message event
		if (settings.event?.rcbRemoveMessage) {
			const event = await dispatchRcbEvent(RcbEvent.REMOVE_MESSAGE, { message });
			if (event.defaultPrevented) {
				return null;
			}
		}

		// if message removed is from history, update history messages
		if (isHistoryMessage) {
			if (historyMessages) {
				setHistoryMessages(historyMessages.filter((m) => m.id !== messageId));
			}
			return message;
		}

		setSyncedMessages(prev =>
			prev.filter(m => m.id !== messageId)
		);
		handlePostMessagesUpdate(syncedMessagesRef.current);
		setUnreadCount((prev) => Math.max(prev - 1, 0));
		return message;
	}, [dispatchRcbEvent, settings.event?.rcbRemoveMessage, handlePostMessagesUpdate,
		syncedMessagesRef, setUnreadCount, getHistoryMessages, setHistoryMessages
	]);

	/**
	 * Updates a message with the given id.
	 *
	 * @param messageId id of message to update
	 * @param newMessage new message to update to
	 */
	const updateMessage = useCallback(async (messageId: string, newMessage: Message): Promise<Message | null> => {
		let message = syncedMessagesRef.current.find((m) => m.id === messageId);
		let historyMessages: Message[] | null = null;
		let isHistoryMessage = false;

		// if not found in current messages, check in history messages
		if (!message) {
			historyMessages = getHistoryMessages();
			message = historyMessages.find((m) => m.id === messageId);
			if (message) {
				isHistoryMessage = true;
			}
		}

		// nothing to update if no such message at all
		if (!message) {
			return null;
		}

		// handles update message event
		if (settings.event?.rcbUpdateMessage) {
			const event = await dispatchRcbEvent(RcbEvent.UPDATE_MESSAGE, { message: newMessage });
			if (event.defaultPrevented) {
				return null;
			}
		}

		// if message updated is from history, update history messages
		if (isHistoryMessage) {
			if (historyMessages) {
				setHistoryMessages(historyMessages.map((m) => m.id === messageId ? newMessage : m));
			}
			return newMessage;
		}

		setSyncedMessages(prev =>
			prev.map(m => m.id === messageId ? newMessage : m)
		);
		handlePostMessagesUpdate(syncedMessagesRef.current);
		return newMessage;
	}, [dispatchRcbEvent, settings.event?.rcbUpdateMessage, handlePostMessagesUpdate,
		syncedMessagesRef, getHistoryMessages, setHistoryMessages
	]);

	/**
	 * Streams data into the last message at the end of the messages array with given type.
	 * 
	 * @param content message content to inject
	 * @param sender sender of the message, defaults to bot
	 */
	const streamMessage = useCallback(async (content: string | JSX.Element,
		sender = "BOT"): Promise<Message | null> => {

		// always convert to uppercase for checks
		sender = sender.toUpperCase();

		if (!streamMessageMap.current.has(sender)) {
			const message = createMessage(content, sender);

			// handles start stream message event
			if (settings.event?.rcbStartStreamMessage) {
				const event = await dispatchRcbEvent(RcbEvent.START_STREAM_MESSAGE, { message });
				if (event.defaultPrevented) {
					return null;
				}
			}

			setSyncedIsBotTyping(false);
			setSyncedMessages(prev => [...prev, message]);
			handlePostMessagesUpdate(syncedMessagesRef.current);
			streamMessageMap.current.set(sender, message.id);
			// if user is scrolling or window is closed, add 1 to unread count
			if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
				setUnreadCount((prev) => prev + 1);
			}
			return message;
		}

		const message = { ...createMessage(content, sender), id: streamMessageMap.current.get(sender)! };
		// handles chunk stream message event
		if (settings.event?.rcbChunkStreamMessage) {
			const event = await dispatchRcbEvent(RcbEvent.CHUNK_STREAM_MESSAGE, { message });
			if (event.defaultPrevented) {
				return null;
			}
		}
		setSyncedMessages(prev =>
			prev.map(m => m.id === message.id ? message : m)
		);
		handlePostMessagesUpdate(syncedMessagesRef.current, true);
		return message;
	}, [dispatchRcbEvent, settings.event, handlePostMessagesUpdate,
		syncedMessagesRef, setSyncedIsBotTyping, setUnreadCount, streamMessageMap
	]);

	/**
	 * Sets the streaming mode of the chatbot.
	 * 
	 * @param sender sender whose stream is being ended
	 * 
	 * Note: This is currently not critical to the functioning of `params.streamMessage` as the chatbot
	 * automatically sets stream mode to true, and defaults to setting stream mode to false whenever a path
	 * change is detected. This is however not ideal, because it results in lossy saving of chat history
	 * for stream messages (cannot detect end stream accurately) and introduces unnecessary logic handling.
	 * The matter of fact is that users know best when a stream ends so the ideal use case would be for users
	 * to call `endStreamMessage()` when they're done with `params.streamMessage`. In v3, this behavior will
	 * be made mandatory. Another key implication of not using `endStreamMessage` in v2 is that the stop stream
	 * message event will not be emitted, which may be problematic for logic (or plugins) that rely on this event.
	 */
	const endStreamMessage = useCallback(async (sender = "BOT"): Promise<boolean> => {
		// always convert to uppercase for checks
		sender = sender.toUpperCase();

		// nothing to end if not streaming
		if (!streamMessageMap.current.has(sender)) {
			return true;
		}
		const messageId = streamMessageMap.current.get(sender)!;

		// retrieves the message that the stream is ending on
		// retries 3 times, handles edge case where messages are streamed and ended instantaneously
		let message;
		for (let i = 0; i < 3; i++) {
			const msg = syncedMessagesRef.current.find((m) => m.id === messageId);
			if (msg) message = msg;
			await new Promise((res) => setTimeout(res, 20));
		}

		// handles stop stream message event
		if (settings.event?.rcbStopStreamMessage) {
			const event = await dispatchRcbEvent(RcbEvent.STOP_STREAM_MESSAGE, { message });
			if (event.defaultPrevented) {
				return false;
			}
		}

		// remove sender from streaming list and save messages
		streamMessageMap.current.delete(sender);
		handleSaveChatHistory(syncedMessagesRef.current);

		// update params.userInput if sender is user
		if (sender === "USER" && typeof message?.content === "string") {
			paramsInputRef.current = message.content;
		}
		return true;
	}, [dispatchRcbEvent, settings.event?.rcbStopStreamMessage, streamMessageMap, paramsInputRef]);

	/**
	 * Replaces (overwrites entirely) the current messages with the new messages.
	 * 
	 * @param newMessagesOrUpdater new messages array or a function that receives current messages
	 * and returns new messages
	 */
	const replaceMessages = useCallback((
		newMessagesOrUpdater: Array<Message> | ((currentMessages: Array<Message>) => Array<Message>)
	) => {
		const newMessages = typeof newMessagesOrUpdater === 'function' 
			? newMessagesOrUpdater(syncedMessagesRef.current) 
			: newMessagesOrUpdater;
		setSyncedMessages(newMessages);
		handlePostMessagesUpdate(newMessages);
	}, [handlePostMessagesUpdate, syncedMessagesRef])


	/**
	 * Gets messages based on optional sender, numMessages and offset fields.
	 * 
	 * @param sender sender of the message (if unspecified, defaults to fetching for all senders)
	 * @param numMessages number of messages to fetch (if unspecified, defaults to all messages from the sender)
	 * @param offset number of user messages to go back by (if unspecified, defaults to 0)
	 */
	const getMessages = useCallback(
		(sender?: string, numMessages?: number, offset: number = 0): Message[] | null => {
			const currentMessages = syncedMessagesRef.current;
			const senderUpper = sender ? sender.toUpperCase() : null;
			const foundMessages: Message[] = [];

			// track how many sender messages skipped to reach the offset
			let skip = offset;

			for (let index = currentMessages.length - 1; index >= 0; index--) {
				const message = currentMessages[index];
				if (!senderUpper || message?.sender?.toUpperCase() === senderUpper) {
					if (skip > 0) {
						skip--;
						continue;
					}

					// collect messages until numMessages is reached
					foundMessages.push(message);
					if (numMessages !== undefined && foundMessages.length === numMessages) {
						break;
					}
				}
			}

			return foundMessages.length > 0 ? foundMessages : null;
		},
		[syncedMessagesRef]
	);

	return {
		simulateStreamMessage,
		injectMessage,
		removeMessage,
		updateMessage,
		streamMessage,
		endStreamMessage,
		replaceMessages,
		getMessages,
		messages,
	};
};
