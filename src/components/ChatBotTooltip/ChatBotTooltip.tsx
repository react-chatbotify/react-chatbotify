import { useState, useEffect } from "react";

import { useIsDesktopInternal } from "../../hooks/internal/useIsDesktopInternal";
import { useChatWindowInternal } from "../../hooks/internal/useChatWindowInternal";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useStylesContext } from "../../context/StylesContext";

import "./ChatBotTooltip.css";

/**
 * Shows tooltip beside the chat bot button to user.
 */
const ChatBotTooltip = () => {
	// handles platform
	const isDesktop = useIsDesktopInternal();

	// handles settings
	const { settings } = useSettingsContext();

	// handles styles
	const { styles } = useStylesContext();

	// handles bot refs
	const { chatBodyRef } = useBotRefsContext();

	// handles chat window
	const { isChatWindowOpen, toggleChatWindow } = useChatWindowInternal();

	// tracks whether to show tooltip
	const [showTooltip, setShowTooltip] = useState<boolean>(false);

	// tracks if tooltip was shown on start
	const [shownTooltipOnStart, setShownTooltipOnStart] = useState<boolean>(false);

	// tooltip offset
	const [tooltipOffset, setTooltipOffset] = useState<number>(0);

	// checks if tooltip should be shown
	useEffect(() => {
		const mode = settings.tooltip?.mode;
		if (mode === "ALWAYS") {
			if (isDesktop) {
				let offset;
				if (isChatWindowOpen) {
					offset = (chatBodyRef.current?.offsetWidth ?? 375) -
						(typeof styles.chatButtonStyle?.width === 'number'
							? styles.chatButtonStyle.width
							: 75)
				} else {
					offset = 0;
				}
				setTooltipOffset(offset);
				setShowTooltip(true);
			} else {
				if (isChatWindowOpen) {
					setShowTooltip(false);
				} else {
					setShowTooltip(true);
				}
			}
		} else if (mode === "NEVER") {
			setShowTooltip(false);
		} else if (mode === "START") {
			if (!shownTooltipOnStart) {
				setShownTooltipOnStart(true);
				setShowTooltip(true);
			} else {
				setShowTooltip(false);
			}
		} else if (mode === "CLOSE") {
			setShowTooltip(!isChatWindowOpen);
		}

	}, [
		isChatWindowOpen,
		isDesktop,
		styles.chatButtonStyle?.width,
		settings.tooltip?.mode,
	]);

	// styles for tooltip
	const tooltipStyle: React.CSSProperties = {
		transform: `translateX(-${tooltipOffset}px)`,
		right: (styles.chatButtonStyle?.width as number ?? 75) + 40,
		bottom: 30,
		backgroundColor: settings.general?.secondaryColor,
		color: "#fff",
		...styles.tooltipStyle
	};

	// styles for tooltip tail
	const tooltipTailStyle: React.CSSProperties = {
		borderColor: `transparent transparent transparent ${tooltipStyle.backgroundColor}`
	};
	
	return (
		<>
			{!settings.general?.embedded &&
				<div 
					data-testid="chat-tooltip"
					style={tooltipStyle}
					className={`rcb-chat-tooltip ${showTooltip ? "rcb-tooltip-show" : "rcb-tooltip-hide"}`}
					onClick={() => toggleChatWindow(true)}
				>
					<span>{settings.tooltip?.text}</span>
					<span className="rcb-chat-tooltip-tail" style={tooltipTailStyle}></span>
				</div>
			}
		</>
	);
};

export default ChatBotTooltip;
