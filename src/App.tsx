import { useState, useEffect, useCallback } from "react";

import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { Settings } from "./types/Settings";
import { Styles } from "./types/Styles";
import {
	streamGeminiResponse,
	isGeminiConfigured,
	clearConversationHistory,
	setSystemPrompt,
} from "./services/GeminiService";

import "./App.css";

// ── Voice config from .env ─────────────────────────────────────
const voiceNamesRaw = import.meta.env.VITE_VOICE_NAMES as string;
const voiceNames = voiceNamesRaw
	? voiceNamesRaw.split(",").map((v: string) => v.trim())
	: ["Google UK English Female", "Microsoft Zira - English (United States)", "Samantha", "Karen"];
const voiceRate = parseFloat((import.meta.env.VITE_VOICE_RATE as string) || "0.95");
const voiceVolume = parseFloat((import.meta.env.VITE_VOICE_VOLUME as string) || "1");
const voiceLanguage = (import.meta.env.VITE_VOICE_LANGUAGE as string) || "en-US";
const geminiConfigured = isGeminiConfigured();

// ── Config persistence keys ───────────────────────────────────
const CONFIG_KEY = "chatbotify-widget-config";

type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

type WidgetConfig = {
	botName: string;
	systemPrompt: string;
	position: WidgetPosition;
};

const DEFAULT_CONFIG: WidgetConfig = {
	botName: "ChatBotify AI",
	systemPrompt:
		(import.meta.env.VITE_AI_SYSTEM_PROMPT as string) ||
		"You are ChatBotify AI, a friendly, concise, and knowledgeable assistant. Be helpful and engaging.",
	position: "bottom-right",
};

// ── Load saved config ─────────────────────────────────────────
const loadConfig = (): WidgetConfig => {
	try {
		const raw = localStorage.getItem(CONFIG_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<WidgetConfig>;
			return { ...DEFAULT_CONFIG, ...parsed };
		}
	} catch {
		// ignore
	}
	return { ...DEFAULT_CONFIG };
};

// ── Position arrow helpers ────────────────────────────────────
const POSITION_OPTIONS: { value: WidgetPosition; label: string; icon: string }[] = [
	{ value: "bottom-right", label: "Bottom Right", icon: "↘" },
	{ value: "bottom-left", label: "Bottom Left", icon: "↙" },
	{ value: "top-right", label: "Top Right", icon: "↗" },
	{ value: "top-left", label: "Top Left", icon: "↖" },
];

// ══════════════════════════════════════════════════════════════
// CONFIG PANEL COMPONENT
// ══════════════════════════════════════════════════════════════
const ConfigPanel = ({
	config,
	onSave,
	onClose,
}: {
	config: WidgetConfig;
	onSave: (cfg: WidgetConfig) => void;
	onClose: () => void;
}) => {
	const [draft, setDraft] = useState<WidgetConfig>({ ...config });

	const handleSave = () => {
		onSave(draft);
		onClose();
	};

	const handleReset = () => {
		setDraft({ ...DEFAULT_CONFIG });
	};

	return (
		<div className="config-overlay" onClick={onClose}>
			<div className="config-panel" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="config-header">
					<div className="config-header-left">
						<div className="config-header-icon">⚙️</div>
						<div>
							<div className="config-header-title">Widget Settings</div>
							<div className="config-header-subtitle">Customize your chatbot</div>
						</div>
					</div>
					<button className="config-close-btn" onClick={onClose}>
						✕
					</button>
				</div>

				{/* Body */}
				<div className="config-body">
					{/* Bot Name */}
					<div className="config-field">
						<label className="config-label">
							<span className="config-label-icon">🤖</span>
							Bot Name
						</label>
						<input
							type="text"
							className="config-input"
							value={draft.botName}
							onChange={(e) => setDraft({ ...draft, botName: e.target.value })}
							placeholder="e.g. Support Bot, Luna AI..."
							maxLength={40}
						/>
						<div className="config-hint">This name appears in the chat header and greeting message.</div>
					</div>

					{/* Knowledge / System Prompt */}
					<div className="config-field">
						<label className="config-label">
							<span className="config-label-icon">🧠</span>
							Knowledge / Instructions
						</label>
						<textarea
							className="config-textarea"
							value={draft.systemPrompt}
							onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
							placeholder="You are a helpful customer support agent for Acme Corp..."
							rows={5}
						/>
						<div className="config-hint">
							Define the AI&apos;s personality, knowledge, and behavior. Changes take effect on new
							messages.
						</div>
					</div>

					{/* Widget Position */}
					<div className="config-field">
						<label className="config-label">
							<span className="config-label-icon">📍</span>
							Widget Position
						</label>
						<div className="config-position-grid">
							{POSITION_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									className={`config-position-btn ${draft.position === opt.value ? "active" : ""}`}
									onClick={() => setDraft({ ...draft, position: opt.value })}
								>
									<span className="config-position-icon">{opt.icon}</span>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="config-footer">
					<button className="config-save-btn" onClick={handleSave}>
						💾 Save & Apply
					</button>
					<button className="config-reset-btn" onClick={handleReset}>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
};

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
function App() {
	const [config, setConfig] = useState<WidgetConfig>(loadConfig);
	const [showConfig, setShowConfig] = useState(false);
	const [chatKey, setChatKey] = useState(0); // force re-mount on config change

	// Apply system prompt on load and config changes
	useEffect(() => {
		setSystemPrompt(config.systemPrompt);
	}, [config.systemPrompt]);

	// Save config
	const handleSaveConfig = useCallback(
		(newConfig: WidgetConfig) => {
			setConfig(newConfig);
			localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
			setSystemPrompt(newConfig.systemPrompt);

			// If name or prompt changed, restart chat
			if (newConfig.botName !== config.botName || newConfig.systemPrompt !== config.systemPrompt) {
				clearConversationHistory();
				setChatKey((k) => k + 1);
			}
		},
		[config]
	);

	// ── Chatbot Flow ──────────────────────────────────────────────
	const flow: Flow = {
		start: {
			message: geminiConfigured
				? `Hi! I'm ${config.botName}, powered by Google Gemini. Ask me anything! 🚀`
				: "⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env and restart.",
			path: geminiConfigured ? "ai_loop" : "fallback",
		},
		ai_loop: {
			message: async (params: Params) => {
				const userInput = params.userInput?.trim();
				if (!userInput) return;

				await new Promise<void>((resolve) => {
					let fullResponse = "";
					streamGeminiResponse(
						userInput,
						(chunk) => {
							fullResponse += chunk;
						},
						async () => {
							if (fullResponse) {
								await params.injectMessage(fullResponse);
							}
							resolve();
						},
						async (err) => {
							await params.injectMessage(`⚠️ Error: ${err.message}`);
							resolve();
						}
					);
				});
				return undefined;
			},
			path: "ai_loop",
		},
		fallback: {
			message: "Static fallback mode. Add your Gemini API key in .env. You said: {{userInput}}",
			path: "fallback",
		},
	};

	// ── Settings — floating widget mode ───────────────────────────
	const settings: Settings = {
		general: {
			primaryColor: "#7c3aed",
			secondaryColor: "#4f46e5",
			fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
			showHeader: true,
			showFooter: true,
			showInputRow: true,
			embedded: false, // ← FLOATING mode
			flowStartTrigger: "ON_LOAD",
		},
		header: {
			title: (
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<span style={{ fontSize: 15, fontWeight: 700 }}>{config.botName}</span>
					<span
						style={{
							fontSize: 10,
							padding: "2px 7px",
							background: "rgba(124,58,237,0.25)",
							border: "1px solid rgba(124,58,237,0.5)",
							borderRadius: 10,
							color: "#9f67ff",
							fontWeight: 600,
							letterSpacing: "0.3px",
						}}
					>
						Gemini
					</span>
					<button
						className="config-gear-btn"
						onClick={(e) => {
							e.stopPropagation();
							setShowConfig(true);
						}}
						title="Widget Settings"
					>
						⚙️
					</button>
				</div>
			),
			showAvatar: true,
			buttons: ["notification_button", "audio_button", "close_chat_button"],
		},
		chatHistory: {
			disabled: false,
			maxEntries: 50,
			storageKey: "rcb-history",
			storageType: "LOCAL_STORAGE",
			viewChatHistoryButtonText: "Load Chat History ⟳",
			chatHistoryLineBreakText: "─── Previous Session ───",
			autoLoad: true,
		},
		chatInput: {
			disabled: false,
			allowNewline: false,
			enabledPlaceholderText: "Ask me anything...",
			disabledPlaceholderText: "AI is thinking...",
			showCharacterCount: true,
			characterLimit: 2000,
			botDelay: 500,
			blockSpam: true,
			sendOptionOutput: true,
			sendCheckboxOutput: true,
			buttons: ["voice_message_button", "send_message_button"],
		},
		chatWindow: {
			showScrollbar: false,
			showTypingIndicator: true,
			autoJumpToBottom: true,
			showMessagePrompt: true,
			messagePromptText: "New messages ↓",
			messagePromptOffset: 30,
			defaultOpen: false, // ← start collapsed
		},
		audio: {
			disabled: false,
			defaultToggledOn: false,
			language: voiceLanguage,
			voiceNames: voiceNames,
			rate: voiceRate,
			volume: voiceVolume,
		},
		voice: {
			disabled: false,
			defaultToggledOn: false,
			language: voiceLanguage,
			timeoutPeriod: 10000,
			autoSendDisabled: false,
			autoSendPeriod: 1500,
			sendAsAudio: false,
		},
		notification: {
			disabled: false,
			defaultToggledOn: true,
			volume: 0.2,
			showCount: true,
		},
		userBubble: {
			animate: true,
			showAvatar: true,
			simulateStream: false,
		},
		botBubble: {
			animate: true,
			showAvatar: true,
			simulateStream: false,
		},
		sensitiveInput: {
			asterisksCount: 8,
			maskInUserBubble: true,
		},
		emoji: {
			disabled: false,
		},
		fileAttachment: {
			disabled: false,
			multiple: true,
			accept: ".png,.jpg,.jpeg,.gif,.pdf,.txt",
			sendFileName: true,
			showMediaDisplay: true,
		},
		footer: {
			text: (
				<div
					style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
					onClick={() =>
						window.open("https://react-chatbotify.com", "_blank", "noopener,noreferrer")
					}
				>
					<span style={{ fontSize: 11, opacity: 0.6 }}>Powered by</span>
					<span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>React ChatBotify</span>
				</div>
			),
			buttons: ["file_attachment_button", "emoji_picker_button"],
		},
		toast: {
			maxCount: 3,
			forbidOnMax: false,
			dismissOnClick: true,
		},
		device: {
			desktopEnabled: true,
			mobileEnabled: true,
			applyMobileOptimizations: true,
		},
	};

	// ── Styles ────────────────────────────────────────────────────
	const styles: Styles = {
		chatWindowStyle: {
			backgroundColor: "#13161e",
			boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 60px rgba(124, 58, 237, 0.1)",
		},
		headerStyle: {
			background: "linear-gradient(135deg, #1a1d27 0%, #1e2030 100%)",
			borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
		},
		chatInputContainerStyle: {
			background: "#111318",
			borderTop: "1px solid rgba(255,255,255,0.08)",
			padding: "12px 16px",
		},
		chatInputAreaStyle: {
			background: "rgba(255,255,255,0.06)",
			border: "1px solid rgba(255,255,255,0.08)",
			borderRadius: 10,
			color: "#f0f0f5",
			fontSize: 14,
			padding: "10px 14px",
		},
		userBubbleStyle: {
			background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
			color: "#fff",
			borderRadius: "16px 16px 4px 16px",
			fontSize: 14,
			padding: "10px 14px",
			boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
		},
		botBubbleStyle: {
			background: "rgba(255,255,255,0.05)",
			border: "1px solid rgba(255,255,255,0.08)",
			color: "#f0f0f5",
			borderRadius: "16px 16px 16px 4px",
			fontSize: 14,
			padding: "10px 14px",
		},
		footerStyle: {
			background: "#111318",
			borderTop: "1px solid rgba(255,255,255,0.05)",
			padding: "8px 16px",
		},
		sendButtonStyle: {
			background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
			borderRadius: 8,
			width: 36,
			height: 36,
		},
		chatHistoryButtonStyle: {
			border: "1px solid rgba(124,58,237,0.3)",
			background: "rgba(124,58,237,0.1)",
			color: "#9f67ff",
			borderRadius: 8,
			fontSize: 12,
			padding: "6px 14px",
		},
		chatHistoryButtonHoveredStyle: {
			background: "rgba(124,58,237,0.2)",
			borderColor: "rgba(124,58,237,0.6)",
		},
	};

	return (
		<>
			{/* ── Demo Host Page (simulates a real webpage) ── */}
			<div className="demo-host-page">
				<div className="demo-content">
					<div className="demo-badge">
						<span className="demo-badge-dot" />
						ChatBotify Widget Demo
					</div>

					<h1 className="demo-title">
						Embed AI Chat on{" "}
						<span className="demo-title-gradient">Any Website</span>
					</h1>

					<p className="demo-subtitle">
						A powerful, customizable chatbot widget powered by Google Gemini.
						Click the chat bubble in the corner to start a conversation, or tap
						the ⚙️ gear icon to configure.
					</p>

					<div className="demo-cards">
						<div className="demo-card">
							<span className="demo-card-icon">🎨</span>
							<div className="demo-card-title">Customizable Name</div>
							<div className="demo-card-desc">
								Set a custom name for your bot — perfect for branding.
							</div>
						</div>
						<div className="demo-card">
							<span className="demo-card-icon">🧠</span>
							<div className="demo-card-title">Custom Knowledge</div>
							<div className="demo-card-desc">
								Define the AI&apos;s personality, tone, and domain expertise.
							</div>
						</div>
						<div className="demo-card">
							<span className="demo-card-icon">📍</span>
							<div className="demo-card-title">Flexible Position</div>
							<div className="demo-card-desc">
								Place the widget in any corner of your webpage.
							</div>
						</div>
					</div>

					<div className="demo-hint">
						<span className="demo-hint-icon">💡</span>
						<span>
							Click the <strong>chat bubble</strong> in the {config.position.replace("-", " ")} corner to
							start chatting, or press <strong>⚙️</strong> in the header to customize.
						</span>
					</div>
				</div>
			</div>

			{/* ── Floating Chat Widget ── */}
			<div className={`widget-wrapper pos-${config.position}`}>
				<ChatBot
					key={chatKey}
					id="chatbot-widget"
					flow={flow}
					settings={settings}
					styles={styles}
				/>
			</div>

			{/* ── Config Panel Overlay ── */}
			{showConfig && (
				<ConfigPanel config={config} onSave={handleSaveConfig} onClose={() => setShowConfig(false)} />
			)}
		</>
	);
}

export default App;