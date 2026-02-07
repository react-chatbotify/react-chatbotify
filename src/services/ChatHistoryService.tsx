import { createElement, isValidElement, Dispatch, ReactNode, CSSProperties, SetStateAction } from "react";
import ReactDOMServer from "react-dom/server";

import ChatHistoryLineBreak from "../components/ChatHistoryLineBreak/ChatHistoryLineBreak";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import { createMessage } from "../utils/messageBuilder";
import { Message } from "../types/Message";
import { Settings } from "../types/Settings";
import { Styles } from "../types/Styles";

// Chat history content is persisted to web storage and treated as untrusted input on load.
// When re-rendering stored HTML back into React elements, we must prevent DOM XSS by
// stripping scriptable tags/attributes and unsafe URL schemes.
const DISALLOWED_HTML_TAGS = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"link",
	"meta",
	"base",
	"style",
	"template",
]);

const URL_ATTRIBUTES = new Set([
	"href",
	"src",
	"srcset",
	"xlink:href",
	"action",
	"formaction",
	"poster",
]);

const SAFE_URL_SCHEMES = new Set([
	"http",
	"https",
	"mailto",
	"tel",
	"blob",
	"data",
]);

const isPossiblyUnsafeUrl = (value: string) => {
	// Remove ASCII control chars which can be used to obscure schemes.
	const normalized = value.trim().replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
	const lowered = normalized.toLowerCase();
	return lowered.startsWith("javascript:") || lowered.startsWith("vbscript:");
};

const sanitizeUrl = (value: string): string | null => {
	const normalized = value.trim().replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
	const lowered = normalized.toLowerCase();

	if (isPossiblyUnsafeUrl(lowered)) {
		return null;
	}

	// Allow relative URLs and fragments.
	if (
		lowered.startsWith("/") ||
		lowered.startsWith("./") ||
		lowered.startsWith("../") ||
		lowered.startsWith("#") ||
		lowered.startsWith("?")
	) {
		return normalized;
	}

	// If a scheme is present, ensure it's in the allowlist.
	const schemeMatch = lowered.match(/^([a-z][a-z0-9+.-]*):/);
	if (schemeMatch) {
		const scheme = schemeMatch[1];
		if (!SAFE_URL_SCHEMES.has(scheme)) {
			return null;
		}

		// Restrict data URLs to common media types used by this library.
		if (scheme === "data") {
			if (
				!(
					lowered.startsWith("data:image/") ||
					lowered.startsWith("data:audio/") ||
					lowered.startsWith("data:video/")
				)
			) {
				return null;
			}
		}
	}

	return normalized;
};

const sanitizeStyleText = (styleText: string): CSSProperties => {
	const styleProperties = styleText.split(";").filter(property => property.trim() !== "");
	const styleObject: { [key: string]: string } = {};

	styleProperties.forEach(property => {
		const [rawKey, rawValue] = property.split(":");
		if (!rawKey || rawValue == null) {
			return;
		}

		const key = rawKey.trim();
		const value = rawValue.trim();
		const valueLowered = value.replace(/\s+/g, "").toLowerCase();
		// Very small allowlist: drop values that could be used to execute code in older/quirky contexts.
		if (valueLowered.includes("expression(") || valueLowered.includes("javascript:")) {
			return;
		}

		const reactCompliantKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
		styleObject[reactCompliantKey] = value;
	});

	return styleObject as CSSProperties;
};


/**
 * Default sanitizer used when re-hydrating chat history content from web storage.
 *
 * Note: chat history content is treated as untrusted input on load. This sanitizer aims to
 * prevent DOM XSS by stripping scriptable tags/attributes and unsafe URL schemes.
 */
const defaultChatHistorySanitizer = (html: string): string => {
	const parser = new DOMParser();
	const parsedHtml = parser.parseFromString(html, "text/html");

	const sanitizeNode = (node: Node) => {
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const element = node as Element;
		const tagName = element.tagName.toLowerCase();
		if (DISALLOWED_HTML_TAGS.has(tagName)) {
			element.remove();
			return;
		}

		// Sanitize attributes.
		for (const attr of Array.from(element.attributes)) {
			const attributeName = attr.name.toLowerCase();

			// Strip inline event handlers (e.g. onerror, onclick).
			if (attributeName.startsWith("on")) {
				element.removeAttribute(attr.name);
				continue;
			}

			// Drop srcset entirely to avoid parsing multiple URLs and to keep sanitization simple.
			if (attributeName === "srcset") {
				element.removeAttribute(attr.name);
				continue;
			}

			if (URL_ATTRIBUTES.has(attributeName)) {
				const sanitized = sanitizeUrl(attr.value);
				if (sanitized === null) {
					element.removeAttribute(attr.name);
				} else {
					element.setAttribute(attr.name, sanitized);
				}
			}
		}

		// Prevent reverse-tabnabbing if a malicious link is present in stored content.
		if (tagName === "a" && element.getAttribute("target") === "_blank") {
			const existingRel = element.getAttribute("rel") ?? "";
			const relTokens = new Set(existingRel.split(/\s+/).filter(Boolean));
			relTokens.add("noopener");
			relTokens.add("noreferrer");
			element.setAttribute("rel", Array.from(relTokens).join(" "));
		}

		// Sanitize children after current node is cleaned up.
		for (const child of Array.from(element.childNodes)) {
			sanitizeNode(child);
		}
	};

	for (const node of Array.from(parsedHtml.body.childNodes)) {
		sanitizeNode(node);
	}

	return parsedHtml.body.innerHTML;
};

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
					const html = typeof message.content === "string" ? message.content : "";
					const sanitizer = settings.chatHistorySanitizer ?? defaultChatHistorySanitizer;
					let sanitizedHtml = html;
					try {
						sanitizedHtml = sanitizer(html);
						if (typeof sanitizedHtml !== "string") {
							sanitizedHtml = "";
						}
					} catch {
						sanitizedHtml = defaultChatHistorySanitizer(html);
					}

					const element = renderHTML(sanitizedHtml, settings, styles);
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

	const renderDomNodes = (childNodes: ChildNode[]): ReactNode[] => {
		return childNodes.map((node, index) => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent;
			}

			// Ignore non-element nodes (e.g. comments).
			if (node.nodeType !== Node.ELEMENT_NODE) {
				return null;
			}

			const element = node as Element;
			const tagName = element.tagName.toLowerCase();
			if (DISALLOWED_HTML_TAGS.has(tagName)) {
				return null;
			}

			let attributes = Array.from(element.attributes).reduce((acc, attr) => {
				const attributeName = attr.name.toLowerCase();

				// Strip inline event handlers (e.g. onerror, onclick).
				if (attributeName.startsWith("on")) {
					return acc;
				}


				if (attributeName === "style") {
					acc[attributeName] = sanitizeStyleText(attr.value);
					return acc;
				}


				if ((tagName === "audio" || tagName === "video") && attributeName === "controls" && attr.value === "") {
					acc[attributeName] = true;
					return acc;
				}

				acc[attributeName] = attr.value;
				return acc;
			}, {} as { [key: string]: string | CSSProperties | boolean });

			// If have class property, repopulate styles and rename to className instead.
			if (Object.prototype.hasOwnProperty.call(attributes, "class")) {
				const classList = element.classList;
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

			// Prevent reverse-tabnabbing if a malicious link is present in stored content.
			if (tagName === "a" && attributes["target"] === "_blank") {
				const existingRel = typeof attributes["rel"] === "string" ? attributes["rel"] : "";
				const relTokens = new Set(existingRel.split(/\s+/).filter(Boolean));
				relTokens.add("noopener");
				relTokens.add("noreferrer");
				attributes["rel"] = Array.from(relTokens).join(" ");
			}

			const voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link",
				"meta", "source", "track", "wbr"];
			if (voidElements.includes(tagName)) {
				// Void elements must not have children.
				return createElement(tagName, { key: index, ...attributes });
			}

			const children = renderDomNodes(Array.from(element.childNodes));
			return createElement(tagName, { key: index, ...attributes }, ...children);
		});
	};

	return renderDomNodes(nodes);
};


/**
 * Add styles (that were lost when saving to history) to options container/checkbox container.
 * 
 * @param classList array of classes the element has
 * @param attributes current attributes the element has
 */
const addStyleToContainers = (
	classList: DOMTokenList,
	attributes: { [key: string]: string | CSSProperties | boolean }
) => {
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
const addStyleToOptions = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties | boolean},
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
const addStyleToCheckboxRows = (classList: DOMTokenList, attributes: {[key: string]: string | CSSProperties | boolean},
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
const addStyleToCheckboxNextButton = (
	classList: DOMTokenList,
	attributes: { [key: string]: string | CSSProperties | boolean },
	settings: Settings,
	styles: Styles
) => {
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
const addStyleToMediaDisplayContainer = (
	classList: DOMTokenList,
	attributes: { [key: string]: string | CSSProperties | boolean },
	settings: Settings,
	styles: Styles
) => {
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
