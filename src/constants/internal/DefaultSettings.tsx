import { Settings } from "../../types/Settings";
import { Button } from "../Button";

import actionDisabledIcon from "../../assets/action_disabled_icon.svg";
import botAvatar from "../../assets/bot_avatar.svg";
import userAvatar from "../../assets/user_avatar.svg";
import ChatIcon from "../../assets/chat_icon.svg?react";
import FileAttachmentIcon from '../../assets/file_attachment_icon.svg?react';
import NotificationIcon from '../../assets/notification_icon.svg?react';
import NotificationIconDisabled from '../../assets/notification_icon_disabled.svg?react';
import CloseChatIcon from '../../assets/close_chat_icon.svg?react';
import SendButtonIcon from '../../assets/send_icon.svg?react';
import VoiceIcon from '../../assets/voice_icon.svg?react';
import VoiceIconDisabled from '../../assets/voice_icon_disabled.svg?react';
import EmojiIcon from '../../assets/emoji_icon.svg?react';
import AudioIcon from '../../assets/audio_icon.svg?react';
import AudioIconDisabled from '../../assets/audio_icon_disabled.svg?react';
import notificationSound from "../../assets/notification_sound.wav";

// default settings provided to the bot
export const DefaultSettings: Settings = {
	general: {
		primaryColor: "#42b0c5",
		secondaryColor: "#491d8d",
		fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', " +
			"'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', " +
			"sans-serif",
		showHeader: true,
		showFooter: true,
		showInputRow: true,
		actionDisabledIcon: actionDisabledIcon,
		embedded: false,
		flowStartTrigger: "ON_LOAD",
	},
	tooltip: {
		mode: "CLOSE",
		text: "Talk to me! 😊",
	},
	chatButton: {
		icon: ChatIcon,
	},
	header: {
		title: (
			<div style={{cursor: "pointer", margin: 0, fontSize: 20, fontWeight: "bold"}} onClick={
				() => window.open("https://github.com/tjtanjin/", "_blank", "noopener,noreferrer")
			}>
				Tan Jin
			</div>
		),
		showAvatar: true,
		avatar: botAvatar,
		buttons: [Button.NOTIFICATION_BUTTON, Button.AUDIO_BUTTON, Button.CLOSE_CHAT_BUTTON],
		closeChatIcon: CloseChatIcon,
	},
	notification: {
		disabled: false,
		defaultToggledOn: true,
		volume: 0.2,
		icon: NotificationIcon,
		iconDisabled: NotificationIconDisabled,
		sound: notificationSound,
		showCount: true,
	},
	audio: {
		disabled: true,
		defaultToggledOn: false,
		language: "en-US",
		voiceNames: ["Microsoft David - English (United States)", "Alex (English - United States)"],
		rate: 1,
		volume: 1,
		icon: AudioIcon,
		iconDisabled: AudioIconDisabled,
	},
	chatHistory: {
		disabled: false,
		maxEntries: 30,
		storageKey: "rcb-history",
		storageType: "LOCAL_STORAGE",
		viewChatHistoryButtonText: "Load Chat History ⟳",
		chatHistoryLineBreakText: "----- Previous Chat History -----",
		autoLoad: false,
	},
	chatInput: {
		disabled: false,
		allowNewline: false,
		enabledPlaceholderText: "Type your message...",
		disabledPlaceholderText: "",
		showCharacterCount: false,
		characterLimit: -1,
		botDelay: 1000,
		sendButtonIcon: SendButtonIcon,
		blockSpam: true,
		sendOptionOutput: true,
		sendCheckboxOutput: true,
		buttons: [Button.VOICE_MESSAGE_BUTTON, Button.SEND_MESSAGE_BUTTON]
	},
	chatWindow: {
		showScrollbar: false,
		showTypingIndicator: true,
		autoJumpToBottom: false,
		showMessagePrompt: true,
		messagePromptText: "New Messages ↓",
		messagePromptOffset: 30,
		defaultOpen: false,
	},
	sensitiveInput: {
		maskInTextArea: true,
		maskInUserBubble: true,
		asterisksCount: 10,
		hideInUserBubble: false,
	},
	userBubble: {
		animate: true,
		showAvatar: false,
		avatar: userAvatar,
		simulateStream: false,
		streamSpeed: 30,
	},
	botBubble: {
		animate: true,
		showAvatar: false,
		avatar: botAvatar,
		simulateStream: false,
		streamSpeed: 30,
	},
	voice: {
		disabled: true,
		defaultToggledOn: false,
		language: "en-US",
		timeoutPeriod: 10000,
		autoSendDisabled: false,
		autoSendPeriod: 1000,
		sendAsAudio: false,
		icon: VoiceIcon,
		iconDisabled: VoiceIconDisabled,
	},
	footer: {
		text: (
			<div style={{cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", columnGap: 3}} 
				onClick={() => window.open("https://react-chatbotify.com", "_blank", "noopener,noreferrer")}
			>
				<span key={0}>Powered By </span>
				<div
					key={1}
					style={{
						borderRadius: "50%",
						width: 14,
						height: 14,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						background: "linear-gradient(to right, #42b0c5, #491d8d)",
					}}
				>
					<ChatIcon style={{ width: "80%", height: "80%", fill: "#fff" }} />
				</div>
				<span key={2} style={{fontWeight: "bold"}}> React ChatBotify</span>
			</div>
		),
		buttons: [Button.FILE_ATTACHMENT_BUTTON, Button.EMOJI_PICKER_BUTTON]
	},
	fileAttachment: {
		disabled: false,
		multiple: true,
		accept: ".png",
		icon: FileAttachmentIcon,
		iconDisabled: FileAttachmentIcon,
		sendFileName: true,
		showMediaDisplay: false,
	},
	emoji: {
		disabled: false,
		icon: EmojiIcon,
		iconDisabled: EmojiIcon,
		list: ["😀", "😃", "😄", "😅", "😊", "😌", "😇", "🙃", "🤣", "😍", "🥰", "🥳", "🎉", "🎈", "🚀", "⭐️"]
	},
	toast: {
		maxCount: 3,
		forbidOnMax: false,
		dismissOnClick: true,
	},
	event: {
		rcbPreInjectMessage: false,
		rcbPostInjectMessage: false,
		rcbStartSimulateStreamMessage: false,
		rcbStopSimulateStreamMessage: false,
		rcbStartStreamMessage: false,
		rcbChunkStreamMessage: false,
		rcbStopStreamMessage: false,
		rcbRemoveMessage: false,
		rcbLoadChatHistory: false,
		rcbToggleChatWindow: false,
		rcbStartSpeakAudio: false,
		rcbToggleAudio: false,
		rcbToggleNotifications: false,
		rcbToggleVoice: false,
		rcbChangePath: false,
		rcbShowToast: false,
		rcbDismissToast: false,
		rcbUserSubmitText: false,
		rcbUserUploadFile: false,
		rcbTextAreaChangeValue: false,
		rcbPreLoadChatBot: false,
		rcbPostLoadChatBot: false,
		rcbPreProcessBlock: false,
		rcbPostProcessBlock: false,
	},
	ariaLabel: {
		chatButton: "open chat",
		audioButton: "toggle audio",
		closeChatButton: "close chat",
		emojiButton: "emoji picker",
		fileAttachmentButton: "upload file",
		notificationButton: "toggle notifications",
		sendButton: "send message",
		voiceButton: "toggle voice",
		inputTextArea: "input text area",
	},
	device: {
		desktopEnabled: true,
		mobileEnabled: true,
		applyMobileOptimizations: true,
	}
}
