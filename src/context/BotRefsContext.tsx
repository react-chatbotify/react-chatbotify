import React, { createContext, MutableRefObject, RefObject, useContext, useRef } from "react";

import { Flow } from "../types/Flow";

/**
 * Creates the useBotRefsContext() hook to manage common refs.
 */
type BotRefsContextType = {
	botIdRef: React.RefObject<string>;
	flow: Flow;
	flowRef: React.MutableRefObject<Flow>;
	setSyncedFlow: (value: React.SetStateAction<Flow>) => void;
	inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
	prevInputRef: React.MutableRefObject<string>;
	timeoutIdRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
	streamMessageMap: React.MutableRefObject<Map<string, string>>;
	chatBodyRef: React.RefObject<HTMLDivElement | null>;
	paramsInputRef: React.MutableRefObject<string>;
	keepVoiceOnRef: React.MutableRefObject<boolean>;
	audioContextRef: React.MutableRefObject<AudioContext | null>;
	audioBufferRef: React.MutableRefObject<AudioBuffer | null>;
	gainNodeRef: React.MutableRefObject<AudioNode | null>;
};
const BotRefsContext = createContext<BotRefsContextType>({} as BotRefsContextType);
const useBotRefsContext = () => useContext(BotRefsContext);

/**
 * Creates provider to wrap the chatbot container.
 */
const BotRefsProvider = ({
	children,
	botIdRef,
	flow,
	flowRef,
	setSyncedFlow,
}: {
	children: React.ReactNode;
	botIdRef: RefObject<string>;
	flow: Flow;
	flowRef: MutableRefObject<Flow>;
	setSyncedFlow: (value: React.SetStateAction<Flow>) => void;
}) => {
	const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
	const prevInputRef = useRef<string>("");
	const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const streamMessageMap = useRef<Map<string, string>>(new Map());
	const chatBodyRef = useRef<HTMLDivElement | null>(null);
	const paramsInputRef = useRef<string>("");
	const keepVoiceOnRef = useRef<boolean>(false);
	const audioContextRef = useRef<AudioContext | null>(null);
	const audioBufferRef = useRef<AudioBuffer | null>(null);
	const gainNodeRef = useRef<AudioNode | null>(null);

	return (
		<BotRefsContext.Provider value={{
			botIdRef,
			flow,
			flowRef,
			setSyncedFlow,
			inputRef,
			timeoutIdRef,
			streamMessageMap,
			chatBodyRef,
			paramsInputRef,
			keepVoiceOnRef,
			audioContextRef,
			audioBufferRef,
			gainNodeRef,
			prevInputRef
		}}>
			{children}
		</BotRefsContext.Provider>
	);
};

export { useBotRefsContext, BotRefsProvider };
