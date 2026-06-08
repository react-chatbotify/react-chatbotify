import { useCallback } from "react";

import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { RcbEvent } from "../../constants/RcbEvent";
import { stopVoiceRecording } from "../../services/VoiceService";

/**
 * Internal custom hook for managing chat window logic.
 */
export const useChatWindowInternal = () => {
	// handles settings
	const { settings } = useSettingsContext();

	// handles bot states
	const {
		isChatWindowOpen,
		setSyncedIsChatWindowOpen,
		viewportHeight,
		setViewportHeight,
		viewportWidth,
		setViewportWidth,
		setUnreadCount,
		setSyncedIsBotTyping,
		setSyncedIsScrolling,
		syncedIsBotTypingRef,
		setSyncedVoiceToggledOn,
		syncedIsChatWindowOpenRef,
	} = useBotStatesContext();

	const { chatBodyRef } = useBotRefsContext();

	// handles rcb events
	const { dispatchRcbEvent } = useDispatchRcbEventInternal();

	/**
	 * Checks if chatbot is visible (uses chatbot body as reference).
	 */
	const getIsChatBotVisible = useCallback(() => {
		if (!chatBodyRef.current) {
			return false;
		}

		const rect = chatBodyRef.current.getBoundingClientRect();
		const windowHeight = (window.innerHeight ?? document.documentElement.clientHeight);
		const windowWidth = (window.innerWidth ?? document.documentElement.clientWidth);

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= windowHeight &&
			rect.right <= windowWidth
		);
	}, [chatBodyRef]);

	/**
	 * Toggles chat window.
	 * 
	 * @param active boolean indicating desired state (if not specified, just flips existing state)
	 */
	const toggleChatWindow = useCallback(async (active?: boolean) => {
		// nothing to do if state is as desired
		if (active === syncedIsChatWindowOpenRef.current) {
			return;
		}

		// handles toggle chat window event
		if (settings.event?.rcbToggleChatWindow) {
			const event = await dispatchRcbEvent(
				RcbEvent.TOGGLE_CHAT_WINDOW,
				{
					currState: syncedIsChatWindowOpenRef.current,
					newState: !syncedIsChatWindowOpenRef.current
				}
			);
			if (event.defaultPrevented) {
				return;
			}
		}
		// stop voice recording when closing the chat window
		if (syncedIsChatWindowOpenRef.current) {
			stopVoiceRecording();
			setSyncedVoiceToggledOn(false);
		}

		setSyncedIsChatWindowOpen(prev => {
			// if currently false means opening so set unread count to 0
			if (!prev) {
				setUnreadCount(0);
			}
			return !prev;
		});
	}, [syncedIsChatWindowOpenRef]);

	/**
	 * Forces state for showing typing indicator.
	 * 
	 * @param active boolean indicating desired state (if not specified, just flips existing state)
	 */
	const toggleIsBotTyping = useCallback(async (active?: boolean) => {
		if (active === syncedIsBotTypingRef.current) {
			return
		}
		setSyncedIsBotTyping(prev => !prev);
	}, [syncedIsBotTypingRef])

	/**
	 * Helper function for custom scrolling.
	 */
	const easeInOutQuad = useCallback((t: number, b: number, c: number, d: number) => {
		t /= d / 2;
		if (t < 1) return c / 2 * t * t + b;
		t--;
		return -c / 2 * (t * (t - 2) - 1) + b;
	}, []);

	/**
     * Handles scrolling to the bottom of the chat window with specified duration.
	 * 
	 * @param duration time in milliseconds to get to bottom
     */
	const scrollToBottom = useCallback((duration: number = 0) => {
		if (!chatBodyRef.current) {
			return;
		}

		const end = chatBodyRef.current.scrollHeight - chatBodyRef.current.clientHeight;
		if (duration <= 0) {
			chatBodyRef.current.scrollTop = end;
			setSyncedIsScrolling(false);
			return;
		}

		const start = chatBodyRef.current.scrollTop;
		const change = end - start;
		const increment = 20;
		let currentTime = 0;
	
		const animateScroll = () => {
			if (!chatBodyRef.current) {
				return;
			}
			currentTime += increment;
			const val = easeInOutQuad(currentTime, start, change, duration);
			chatBodyRef.current.scrollTop = val;
			if (currentTime < duration) {
				requestAnimationFrame(animateScroll);
			} else {
				setSyncedIsScrolling(false);
			}
		}
		
		animateScroll();
	}, [chatBodyRef])

	return {
		isChatWindowOpen,
		setSyncedIsChatWindowOpen,
		toggleChatWindow,
		viewportHeight,
		setViewportHeight,
		viewportWidth,
		setViewportWidth,
		toggleIsBotTyping,
		scrollToBottom,
		getIsChatBotVisible,
	};
};
