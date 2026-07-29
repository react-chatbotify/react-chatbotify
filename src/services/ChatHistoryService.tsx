import { createElement, isValidElement, Dispatch, ReactNode, CSSProperties, SetStateAction } from "react";
import ReactDOMServer from "react-dom/server";

import ChatHistoryLineBreak from "../components/ChatHistoryLineBreak/ChatHistoryLineBreak";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import { createMessage } from "../utils/messageBuilder";
import { Message } from "../types/Message";
import { Settings } from "../types/Settings";
import { Styles } from "../types/Styles";

// variables used to track history, updated when settings.chatHistory value changes
let storage: Storage;
let historyLoaded = false;
let historyStorageKey = "rcb-history";
let historyMaxEntries = 30;
let historyDisabled = false;
let historyMessages: Message[] = [];

/**
 * Updates the messages array with a new message appended at the end and saves chat history if enabled.
 * 
 * @param messages messages containing current conversation with the bot
 */
const saveChatHistory = async (messages: Message[]) => {
	if (historyDisabled || !storage) {
		return;
	}
	
	const messagesToSave: Message[] = [];

	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];

		// skip past system messages
		if (message.sender.toUpperCase() === "SYSTEM") {
			continue;
		}

		if (message.content !== "") {
			messagesToSave.unshift(message);
		}

		if (messagesToSave.length === historyMaxEntries) {
			break;
		}
	}

	let parsedMessages: Message[] = messagesToSave.map(parseMessageToString);
	if (!historyLoaded && parsedMessages.length < historyMaxEntries) {
		const difference = historyMaxEntries - parsedMessages.length;
		parsedMessages = [...historyMessages.slice(-difference), ...parsedMessages]
	}

	updateHistoryMessages(parsedMessages);
}

/**
 * Parses chat history.
 * 
 * @param historyStorageKey key used to identify chat history stored in local storage
 */
const parseHistoryMessages = (historyStorageKey: string) => {
	if (historyStorageKey != null) {
		try {
			return JSON.parse(historyStorageKey);
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Retrieves history messages.
 */
const getHistoryMessages = () => {
	return historyMessages;
}

/**
 * Sets history messages.
 * 
 * @param messages chat history messages to set
 */
const setHistoryMessages = (messages: Message[]) => {
	updateHistoryMessages(messages);
	historyMessages = messages;
}

/**
 * Updates history messages.
 * 
 * @param messages chat history messages to update
 */
const updateHistoryMessages = (messages: Message[]) => {
	if (!storage) {
		return;
	}
	storage.setItem(historyStorageKey, JSON.stringify(messages));
}

/**
 * Clears existing history messages.
 */
const clearHistoryMessages = () => {
	if (!storage) {
		return;
	}
	storage.removeItem(historyStorageKey);
}

/**
 * Sets the currently used history storage key.
 * 
 * @param settings options provided to the bot
 */
const setHistoryStorageValues = (settings: Settings) => {
	if (settings.chatHistory?.storageType?.toUpperCase() === "SESSION_STORAGE") {
		storage = sessionStorage;
	} else {
		storage = localStorage;
	}
	historyStorageKey = settings.chatHistory?.storageKey as string;
	historyMaxEntries = settings.chatHistory?.maxEntries as number;
	historyDisabled = settings.chatHistory?.disabled as boolean;
	historyMessages = parseHistoryMessages(storage.getItem(historyStorageKey) as string);
}

/**
 * Parses message into string for chat history storage.
 * 
 * @param message message to parse
 */
const parseMessageToString = (message: Message) => {
	if (isValidElement(message.content)) {
		const clonedMessage = structuredClone({
			id: message.id,
			content: ReactDOMServer.renderToString(message.content),
			type: message.type,
			sender: message.sender.toUpperCase(),
			timestamp: message.timestamp,
			tags: message.tags,
		});
		return clonedMessage;
	}

	return message;
}

/**
 * Loads chat history into the chat window for user view.
 *
 * @param settings settings provided to the bot
 * @param styles styles provided to the bot
 * @param chatHistory chat history to show
 * @param setSyncedMessages sync ref and state setter for messages
 * @param syncedMessagesRef live ref of current messages array
 * @param chatBodyRef reference to the chat body
 * @param chatScrollHeight current chat scroll height
 * @param setIsLoadingChatHistory setter for whether chat history is loading
 * @param setHasChatHistoryLoaded setter for indicating if chat history is loaded
 */
const loadChatHistory = (
	settings: Settings,
	styles: Styles,
	chatHistory: Message[],
	setSyncedMessages: Dispatch<SetStateAction<Message[]>>,
	syncedMessagesRef: React.MutableRefObject<Message[]>,
	chatBodyRef: React.RefObject<HTMLDivElement | null>,
	chatScrollHeight: number,
	setIsLoadingChatHistory: Dispatch<boolean>,
	setHasChatHistoryLoaded: Dispatch<boolean>
) => {
	historyLoaded = true;
	if (chatHistory != null) {
		try {
			// insert loader
			const loaderMessage = createMessage(<LoadingSpinner/>, "SYSTEM");
			const base = syncedMessagesRef.current.slice(1);
			setSyncedMessages([loaderMessage, ...base]);

			const parsedMessages = chatHistory.map((message) => {
				if (message.type === "object") {
					const element = renderHTML(message.content as string, settings, styles);
					return { ...message, content: element };
				}
				return message;
			}) as Message[];

			setTimeout(() => {
				const rest = syncedMessagesRef.current.slice(1);

				// if autoload, line break is invisible
				let lineBreakMessage = settings.chatHistory?.autoLoad
					? createMessage(<></>, "SYSTEM")
					: createMessage(<ChatHistoryLineBreak/>, "SYSTEM");
				setSyncedMessages([...parsedMessages, lineBreakMessage, ...rest]);
				setHasChatHistoryLoaded(true);
			}, 500);

			// slight delay afterwards to maintain scroll position
			setTimeout(() => {
				if (!chatBodyRef.current) {
					return;
				}
				const { scrollHeight } = chatBodyRef.current;
				const diff = scrollHeight - chatScrollHeight;
				chatBodyRef.current.scrollTop += diff;
				setIsLoadingChatHistory(false);
			}, 510);
		} catch {
			// remove chat history on error (to address corrupted storage values)
			storage.removeItem(settings.chatHistory?.storageKey as string);
		}
	}
};

/**
 * Renders html string to a react node.
 * 
 * @param html string to render
 * @param settings options provided to the bot
 */
const renderHTML = (html: string, settings: Settings, styles: Styles): ReactNode[] => {
	const parser = new DOMParser();
	const parsedHtml = parser.parseFromString(html, "text/html");
	const nodes = Array.from(parsedHtml.body.childNodes);
  
	const renderNodes: ReactNode[] = nodes.map((node, index) => {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent;
		} else {
			const tagName = (node as Element).tagName.toLowerCase();
			let attributes = Array.from((node as Element).attributes).reduce((acc, attr) => {
				const attributeNameLower = attr.name.toLowerCase();
				if (attributeNameLower === "style") {
					const styleProperties = attr.value.split(";").filter(property => property.trim() !== "");
					const styleObject: { [key: string]: string } = {};
					styleProperties.forEach(property => {
						const [key, value] = property.split(":").map(part => part.trim());
						const reactCompliantKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
						styleObject[reactCompliantKey] = value;
					});
					acc[attributeNameLower] = styleObject;
				} else if ((tagName === "audio" || tagName === "video")
					&& attributeNameLower === "controls" && attr.value === "") {
					acc[attributeNameLower] = "true";
				} else {
					acc[attr.name] = attr.value;
				}
				return acc;
			}, {} as { [key: string]: string | CSSProperties });

			// if have class property, repopulate styles and rename to className instead
			if (Object.prototype.hasOwnProperty.call(attributes, "class")) {
				const classList = (node as Element).classList;
				attributes["className"] = classList.toString();
				delete attributes["class"];
				if (settings.botBubble?.showAvatar) {
					attributes = addStyleToContainers(classList, attributes);
				}
				attributes = addStyleToOptions(classList, attributes, settings, styles);
				attributes = addStyleToCheckboxRows(classList, attributes, settings, styles);
				attributes = addStyleToCheckboxNextButton(classList, attributes, settings, styles);
				attributes = addStyleToMediaDisplayContainer(classList, attributes, settings, styles);
			}

			const voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link",
				"meta", "source", "track", "wbr"];
			if (voidElements.includes(tagName)) {
				// void elements must not have children
				return createElement(tagName, { key: index, ...attributes });
			} else {
				const children = renderHTML((node as Element).innerHTML, settings, styles);
				return createElement(tagName, { key: index, ...attributes }, ...children);
			}
		}
	});
  
	return renderNodes;
};


/**
 * Add styles (that were lost when saving to history) to options container/checkbox container.
 * 
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 */
const addStyleToContainers = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties}) => {
	if (classList.contains("rcb-options-container") || classList.contains("rcb-checkbox-container")) {
		attributes["className"] = `${classList.toString()} rcb-options-offset`;
	}
	return attributes;
}

/**
 * Add styles (that were lost when saving to history) to options.
 * 
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 * @param settings options provided to the bot
 */
const addStyleToOptions = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties},
	settings: Settings, styles: Styles) => {
	if (classList.contains("rcb-options")) {
		attributes["style"] = {
			...(attributes["style"] as CSSProperties),
			color: styles.botOptionStyle?.color ?? settings.general?.primaryColor,
			borderColor: styles.botOptionStyle?.color ?? settings.general?.primaryColor,
			cursor: `url("${settings.general?.actionDisabledIcon}"), auto`,
			...styles.botOptionStyle
		}
	}
	return attributes;
}

/**
 * Add styles (that were lost when saving to history) to checkbox rows.
 * 
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 * @param settings options provided to the bot
 */
const addStyleToCheckboxRows = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties},
	settings: Settings, styles: Styles) => {
	if (classList.contains("rcb-checkbox-row-container")) {
		attributes["style"] = {
			...(attributes["style"] as CSSProperties),
			color: styles.botCheckboxRowStyle?.color ?? settings.general?.primaryColor,
			borderColor: styles.botCheckboxRowStyle?.color ?? settings.general?.primaryColor,
			cursor: `url("${settings.general?.actionDisabledIcon}"), auto`,
			...styles.botCheckboxRowStyle
		}
	}
	return attributes;
}

/**
 * Add styles (that were lost when saving to history) to checkbox next button.
 * 
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 * @param settings options provided to the bot
 */
const addStyleToCheckboxNextButton = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties},
	settings: Settings, styles: Styles) => {
	if (classList.contains("rcb-checkbox-next-button")) {
		attributes["style"] = {
			...(attributes["style"] as CSSProperties),
			color: styles.botCheckboxNextStyle?.color ?? settings.general?.primaryColor,
			borderColor: styles.botCheckboxNextStyle?.color ?? settings.general?.primaryColor,
			cursor: `url("${settings.general?.actionDisabledIcon}"), auto`,
			...styles.botCheckboxNextStyle
		}
	}
	return attributes;
}

/**
 * Add styles (that were lost when saving to history) to options.
 *
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 * @param settings options provided to the bot
 */
const addStyleToMediaDisplayContainer = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties},
	settings: Settings, styles: Styles) => {
	if (classList.contains("rcb-media-display-image-container")
		|| classList.contains("rcb-media-display-video-container")) {
		attributes["style"] = {
			...(attributes["style"] as CSSProperties),
			backgroundColor: settings.general?.primaryColor,
			maxWidth: settings.userBubble?.showAvatar ? "65%" : "70%",
			...styles.mediaDisplayContainerStyle
		}
	}
	return attributes;
}

export {
	saveChatHistory,
	loadChatHistory,
	getHistoryMessages,
	setHistoryMessages,
	clearHistoryMessages,
	setHistoryStorageValues
}