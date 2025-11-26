import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { MutableRefObject, useRef, useState } from "react";
import { useChatBotContext, ChatBotProviderContextType } from "../../src/context/ChatBotContext";
import ChatBotProvider from "../../src/context/ChatBotContext";
import { parseConfig } from "../../src/utils/configParser";
import { Flow } from "../../src/types/Flow";
import { Settings } from "../../src/types/Settings";
import { Styles } from "../../src/types/Styles";
import { useFlow } from "../../src/hooks/useFlow";

// Define a type for the mock return value
type ParseConfig = {
    cssStylesText: string;
    settings: Settings;
    inlineStyles: Styles;
};

// Mock the parseConfig function
jest.mock('../../src/utils/configParser', () => ({
	parseConfig: jest.fn(),
	deepClone: jest.fn(),
}));

describe("ChatBotContext", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders null when isDomLoaded is false", () => {
		// Define the test component
		const TestComponent = () => {
			const [isDomLoaded, setIsDomLoaded] = useState<boolean>(true);

			React.useEffect(() => {
				act(() => {
					setIsDomLoaded(false)
				});
			},[]);

			return isDomLoaded ? <div data-testid="child">Child Content</div> : null;
		};

		// Render the test component
		render(
			<ChatBotProvider>
				<TestComponent />
			</ChatBotProvider>
		);

		// Expect the div not to be rendered since isDomLoaded is false
		const childElement = screen.queryByTestId("child");
		expect(childElement).toBeNull();
	});

	it("renders children when isDomLoaded is true", () => {
		render(
			<ChatBotProvider>
				<div data-testid="child">Child Content</div>
			</ChatBotProvider>
		);

		// Expect the div to be rendered since isDomLoaded is true
		const childElement = screen.queryByTestId("child");
		expect(childElement).not.toBeNull();
	});

	it("updates botIdRef, botFlowRef, botSettings, and botStyles when loadConfig is called", async () => {
		// Define a mock configuration object that simulates the parsed result from the parseConfig function
		const mockParsedConfig : ParseConfig = {
			cssStylesText: "body { background-color: #000; }",
			settings: {
				general: { fontFamily: "Arial" },
			} as Settings,
			inlineStyles: {
				backgroundColor: "#000",
			} as Styles,
		};

		(parseConfig as jest.MockedFunction<typeof parseConfig>).mockResolvedValue(mockParsedConfig);

		// Define the test component
		const TestComponent = () => {
			const contextValue = useChatBotContext(); 
			const { loadConfig } = contextValue ?? {};
			const styleRootRef = useRef<HTMLStyleElement | null>(null);

			React.useEffect(() => {
				if (loadConfig) {
					loadConfig(
						"test-bot-id",
						{ start: { content: "Hello" } },
						{ general: { fontFamily: "Arial" } } as Settings,
						{ backgroundColor: "#000" } as Styles,
						undefined,
						styleRootRef as MutableRefObject<HTMLStyleElement | null>
					);
				}
			}, [loadConfig]);

			return <style ref={styleRootRef} data-testid="style-root" />;
		};

		// Render the test component
		render(
			<ChatBotProvider>
				<TestComponent />
			</ChatBotProvider>
		);

		// Expect that parseConfig was called with the right parameters
		expect(parseConfig).toHaveBeenCalledWith(
			"test-bot-id",
			{ general: { fontFamily: "Arial" } },
			{ backgroundColor: "#000" },
			undefined
		);

		// Wait for the style element to be updated with the CSS text
		await waitFor(() => {
			const styleRoot = screen.getByTestId("style-root");
			expect(styleRoot.textContent).toBe(mockParsedConfig.cssStylesText);
		});
	});
      
      
	it("exposes the loadConfig function through ChatBotContext", () => {
		// Define the test component
		let contextValue: ChatBotProviderContextType | undefined;
		const TestComponent = () => {
			contextValue = useChatBotContext();
			return null;
		};

		// Render the test component
		render(
			<ChatBotProvider>
				<TestComponent />
			</ChatBotProvider>
		);

		// Expect that the loadConfig function is defined
		expect(contextValue?.loadConfig).toBeInstanceOf(Function);
	});

	it("re-renders components when flow is updated", async () => {
		const FlowDisplay = () => {
			const { getFlow } = useFlow();
			const flow = getFlow();
			// @ts-ignore
			return <div data-testid="flow-display">{flow.start.content}</div>;
		};

		const TestComponent = () => {
			const contextValue = useChatBotContext();
			const { loadConfig } = contextValue ?? {};
			const styleRootRef = useRef<HTMLStyleElement | null>(null);

			React.useEffect(() => {
				if (loadConfig) {
					loadConfig(
						"test-bot-id",
						{ start: { content: "Initial" } },
						{},
						{},
						undefined,
						styleRootRef as MutableRefObject<HTMLStyleElement | null>
					);

					setTimeout(() => {
						loadConfig(
							"test-bot-id",
							{ start: { content: "Updated" } },
							{},
							{},
							undefined,
							styleRootRef as MutableRefObject<HTMLStyleElement | null>
						);
					}, 100);
				}
			}, [loadConfig]);

			return <FlowDisplay />;
		};

		render(
			<ChatBotProvider>
				<TestComponent />
			</ChatBotProvider>
		);

		expect(screen.getByTestId("flow-display")).toHaveTextContent("Initial");
		await waitFor(() => {
			expect(screen.getByTestId("flow-display")).toHaveTextContent("Updated");
		});
	});
});