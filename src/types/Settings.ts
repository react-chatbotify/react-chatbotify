/**
 * Defines the settings for the chat bot.
 */
export type Settings = {
	// configurations
	general?: {
		primaryColor?: string;
		secondaryColor?: string;
		fontFamily?: string;
		showHeader?: boolean;
		showFooter?: boolean;
		showInputRow?: boolean;
		actionDisabledIcon?: string;
		embedded?: boolean;
		flowStartTrigger?: string;
	},
	tooltip?: {
		mode?: string;
		text?: string;
	},
	chatButton?: {
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
	},
	header?: {
		title?: string | JSX.Element;
		showAvatar?: boolean;
		avatar?: string;
		buttons?: Array<JSX.Element | string>;
		closeChatIcon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
	},
	notification?: {
		disabled?: boolean;
		defaultToggledOn?: boolean;
		volume?: number;
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		iconDisabled?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		sound?: string;
		showCount?: boolean;
	},
	audio?: {
		disabled?: boolean;
		defaultToggledOn?: boolean;
		language?: string;
		voiceNames?: string[];
		rate?: number;
		volume?: number;
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		iconDisabled?: string | React.FC<React.SVGProps<SVGSVGElement>>;
	},
	chatHistory?: {
		disabled?: boolean;
		maxEntries?: number;
		storageKey?: string;
		storageType?: string;
		viewChatHistoryButtonText?: string;
		chatHistoryLineBreakText?: string;
		autoLoad?: boolean;
	},
	chatInput?: {
		disabled?: boolean;
		allowNewline?: boolean;
		enabledPlaceholderText?: string;
		disabledPlaceholderText?: string;
		showCharacterCount?: boolean;
		characterLimit?: number;
		botDelay?: number;
		sendButtonIcon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		blockSpam?: boolean;
		sendOptionOutput?: boolean;
		sendCheckboxOutput?: boolean;
		buttons?: Array<JSX.Element | string>;
	},
	chatWindow?: {
		showScrollbar?: boolean;
		showTypingIndicator?: boolean;
		autoJumpToBottom?: boolean;
		showMessagePrompt?: boolean;
		messagePromptText?: string;
		messagePromptOffset?: number;
		defaultOpen?: boolean;
	},
	sensitiveInput?: {
		maskInTextArea?: boolean;
		maskInUserBubble?: boolean;
		asterisksCount?: number;
		hideInUserBubble?: boolean;
	},
	userBubble?: {
		animate?: boolean;
		showAvatar?: boolean;
		avatar?: string;
		simulateStream?: boolean;
		streamSpeed? :number;
	},
	botBubble?: {
		animate?: boolean;
		showAvatar?: boolean;
		avatar?: string;
		simulateStream?: boolean;
		streamSpeed? :number;
	},
	voice?: {
		disabled?: boolean;
		defaultToggledOn?: boolean;
		language?: string;
		timeoutPeriod?: number;
		autoSendDisabled?: boolean;
		autoSendPeriod?: number;
		sendAsAudio?: boolean;
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		iconDisabled?: string | React.FC<React.SVGProps<SVGSVGElement>>;
	},
	footer?: {
		text?: string | JSX.Element;
		buttons?: Array<JSX.Element | string>;
	},
	fileAttachment?: {
		disabled?: boolean;
		multiple?: boolean;
		accept?: string;
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		iconDisabled?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		sendFileName?: boolean;
		showMediaDisplay?: boolean;
	}
	emoji?: {
		disabled?: boolean;
		icon?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		iconDisabled?: string | React.FC<React.SVGProps<SVGSVGElement>>;
		list?: string[] ;
	},
	toast?: {
		maxCount?: number;
		forbidOnMax?: boolean;
		dismissOnClick?: boolean;
	},
	event?: {
		rcbPreInjectMessage?: boolean;
		rcbPostInjectMessage?: boolean;
		rcbStartSimulateStreamMessage?: boolean;
		rcbStopSimulateStreamMessage?: boolean;
		rcbStartStreamMessage?: boolean;
		rcbChunkStreamMessage?: boolean;
		rcbStopStreamMessage?: boolean;
		rcbRemoveMessage?: boolean;
		rcbPreUpdateMessage?: boolean;
		rcbPostUpdateMessage?: boolean;
		rcbSaveChatHistory?: boolean;
		rcbLoadChatHistory?: boolean;
		rcbToggleChatWindow?: boolean;
		rcbStartSpeakAudio?: boolean;
		rcbToggleAudio?: boolean;
		rcbToggleNotifications?: boolean;
		rcbToggleVoice?: boolean;
		rcbChangePath?: boolean;
		rcbShowToast?: boolean;
		rcbDismissToast?: boolean;
		rcbUserSubmitText?: boolean;
		rcbUserUploadFile?: boolean;
		rcbTextAreaChangeValue?: boolean;
		rcbPreLoadChatBot?: boolean;
		rcbPostLoadChatBot?: boolean;
		rcbPreProcessBlock?: boolean;
		rcbPostProcessBlock?: boolean;
	},
	ariaLabel?: {
		chatButton?: string;
		audioButton?: string;
		closeChatButton?: string;
		emojiButton?: string;
		fileAttachmentButton?: string;
		notificationButton?: string;
		sendButton?: string;
		voiceButton?: string;
		inputTextArea?: string;
	},
	device?: {
		desktopEnabled?: boolean;
		mobileEnabled?: boolean;
		applyMobileOptimizations?: boolean;
	}
}
