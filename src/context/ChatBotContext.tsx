import { createContext, MutableRefObject, useContext, useEffect, useRef, useState } from "react";

import { deepClone, parseConfig } from "../utils/configParser";
import { BotRefsProvider } from "./BotRefsContext";
import { BotStatesProvider } from "./BotStatesContext";
import { MessagesProvider } from "./MessagesContext";
import { PathsProvider } from "./PathsContext";
import { SettingsProvider } from "./SettingsContext";
import { StylesProvider } from "./StylesContext";
import { ToastsProvider } from "./ToastsContext";
import { useSyncedRefState } from "../hooks/internal/useSyncedRefState";
import { Flow } from "../types/Flow";
import { Settings } from "../types/Settings";
import { Styles } from "../types/Styles";
import { Theme } from "../types/Theme";

export type ChatBotProviderContextType = {
	loadConfig: (id: string, flow: Flow, settings: Settings, styles: Styles,
		themes: Theme | Theme[] | undefined,
		styleRootRef: MutableRefObject<HTMLStyleElement | null>) => Promise<void>;
};
// Create a context to detect whether ChatBotProvider is present
const ChatBotContext = createContext<ChatBotProviderContextType | undefined>(undefined);
export const useChatBotContext = () => {
	return useContext(ChatBotContext);
};

const ChatBotProvider = ({
	children
}: {
	children: React.ReactNode;
}) => {
	// handles bot id ref
	const botIdRef = useRef<string>("");

	// handles bot flow
	const [botFlow, setSyncedBotFlow, syncedBotFlowRef] = useSyncedRefState<Flow>({});

	// handles bot settings
	const [botSettings, setSyncedBotSettings, syncedBotSettingsRef] = useSyncedRefState<Settings>({});
	const userProvidedSettingsRef = useRef<Settings>({});

	// handles bot styles
	const [botStyles, setSyncedBotStyles, syncedBotStylesRef] = useSyncedRefState<Styles>({});
	const userProvidedStylesRef = useRef<Styles>({});

	// handles DOM loaded event to ensure chatbot is loaded after DOM is ready (necessary for SSR support)
	const [isDomLoaded, setIsDomLoaded] = useState<boolean>(false);

	useEffect(() => {
		setIsDomLoaded(true);
	}, []);

	/**
	 * Loads configurations for the chatbot and applies css styles.
	 *
	 * @param botId id of the chatbot
	 * @param flow conversation flow for the bot
	 * @param settings settings to setup the bot
	 * @param styles styles to apply to the bot
	 * @param themes themes to apply to the bot
	 * @param styleRootRef ref to the style container
	 */
	const loadConfig = async (
		botId: string,
		flow: Flow,
		settings: Settings,
		styles: Styles,
		themes: Theme | Theme[] | undefined,
		styleRootRef: MutableRefObject<HTMLStyleElement | null>,
	) => {
		botIdRef.current = botId;
		setSyncedBotFlow(flow);
		userProvidedSettingsRef.current = deepClone(settings ?? {});
		userProvidedStylesRef.current = deepClone(styles ?? {});
		const combinedConfig = await parseConfig(botId, settings, styles, themes);

		// applies css styles directly to chatbot
		if (styleRootRef.current) {
			styleRootRef.current.textContent = combinedConfig.cssStylesText;
		}
		// applies combined bot settings and styles
		setSyncedBotSettings(combinedConfig.settings);
		setSyncedBotStyles(combinedConfig.inlineStyles);
	};

	if (!isDomLoaded) {
		return null;
	}

	return (
		<div style={{ fontFamily: botSettings.general?.fontFamily }}>
			<ChatBotContext.Provider value={{ loadConfig }}>
				<SettingsProvider
					settings={botSettings}
					setSyncedSettings={setSyncedBotSettings}
					syncedSettingsRef={syncedBotSettingsRef}
					userProvidedSettingsRef={userProvidedSettingsRef}
				>
					<StylesProvider
						styles={botStyles}
						setSyncedStyles={setSyncedBotStyles}
						syncedStylesRef={syncedBotStylesRef}
						userProvidedStylesRef={userProvidedStylesRef}
					>
						<ToastsProvider>
							<BotRefsProvider
								botIdRef={botIdRef}
								flow={botFlow}
								flowRef={syncedBotFlowRef}
								setSyncedFlow={setSyncedBotFlow}
							>
								<PathsProvider>
									<BotStatesProvider settings={botSettings}>
										<MessagesProvider>{children}</MessagesProvider>
									</BotStatesProvider>
								</PathsProvider>
							</BotRefsProvider>
						</ToastsProvider>
					</StylesProvider>
				</SettingsProvider>
			</ChatBotContext.Provider>
		</div>
	);
};

export default ChatBotProvider;
