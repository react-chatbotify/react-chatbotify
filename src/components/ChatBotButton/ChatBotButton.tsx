import { useState } from "react";

import { useChatWindowInternal } from "../../hooks/internal/useChatWindowInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useStylesContext } from "../../context/StylesContext";

import "./ChatBotButton.css";

/**
 * Toggles opening and closing of the chat window when general.embedded is false.
 */
const ChatBotButton = () => {
	// handles settings
	const { settings } = useSettingsContext();

	// handles styles
	const { styles } = useStylesContext();

	// handles bot states
	const { unreadCount } = useBotStatesContext();

	// handles chat window
	const { isChatWindowOpen, toggleChatWindow } = useChatWindowInternal();

	// tracks if chat button is hovered
	const [isHovered, setIsHovered] = useState<boolean>(false);

	// styles for chat button
	// const chatButtonStyle: React.CSSProperties = {
	// 	backgroundImage: `linear-gradient(to right, ${settings.general?.secondaryColor},
	// 		${settings.general?.primaryColor})`,
	// 	...styles.chatButtonStyle
	// };
	const chatButtonStyle: React.CSSProperties = {
		backgroundImage: `linear-gradient(to right, ${settings.general?.secondaryColor},
			${settings.general?.primaryColor})`,
		width: 75,
		height: 75,
		...styles.chatButtonStyle
	};

	// styles for hovered chat button
	const chatButtonHoveredStyle: React.CSSProperties = {
		transform: "scale(1.05)",
		...chatButtonStyle, // by default inherit the base style
		...styles.chatButtonHoveredStyle
	};

	// styles for chat icon
	const chatIconStyle: React.CSSProperties = {
		backgroundImage: `url(${settings.chatButton?.icon})`,
		fill: "#fff",
		width: 75,
		height: 75,
		...styles.chatIconStyle
	};

	/**
	 * Handles mouse enter event on chat message prompt.
	 */
	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	/**
	 * Handles mouse leave event on chat message prompt.
	 */
	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	/**
	 * Renders button depending on whether an svg component or image url is provided.
	 */
	const renderButton = () => {
		const IconComponent = settings.chatButton?.icon;
		if (!IconComponent || typeof IconComponent === "string") {
			return (
				<span
					className="rcb-toggle-icon"
					style={chatIconStyle}
				/>
			)
		}
		return (
			IconComponent &&
			<span className="rcb-toggle-icon">
				<IconComponent style={chatIconStyle}/>
			</span>
		)
	}
	
	return (
		<>
			{!settings.general?.embedded &&
				<div
					aria-label={settings.ariaLabel?.chatButton ?? "open chat"}
					role="button"
					style={isHovered ? chatButtonHoveredStyle : chatButtonStyle}
					className={`rcb-toggle-button ${isChatWindowOpen ? "rcb-button-hide" : "rcb-button-show"}`}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					onClick={() => toggleChatWindow(true)}
				>
					{renderButton()}
					{!settings.notification?.disabled && settings.notification?.showCount &&
						<span style={{...styles.notificationBadgeStyle}} className="rcb-badge">
							{unreadCount}
						</span>
					}
				</div>
			}
		</>
	);
};

export default ChatBotButton;
