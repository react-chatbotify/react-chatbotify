import React from "react";
import "@testing-library/jest-dom"; 
import { render, screen, fireEvent } from "@testing-library/react";
import ChatBotTooltip from "../../../src/components/ChatBotTooltip/ChatBotTooltip";
import { useIsDesktopInternal } from "../../../src/hooks/internal/useIsDesktopInternal";
import { useChatWindowInternal } from "../../../src/hooks/internal/useChatWindowInternal";
import { useSettingsContext } from "../../../src/context/SettingsContext";
import { useStylesContext } from "../../../src/context/StylesContext";

// Mock the contexts and hooks
jest.mock("../../../src/hooks/internal/useIsDesktopInternal");
jest.mock("../../../src/hooks/internal/useChatWindowInternal");
jest.mock("../../../src/context/SettingsContext");
jest.mock("../../../src/context/StylesContext");

describe("ChatBotTooltip Component", () => {
	// Set up default mock return values before each test
	beforeEach(() => {
		(useIsDesktopInternal as jest.Mock).mockReturnValue(true); 
		(useChatWindowInternal as jest.Mock).mockReturnValue({
			isChatWindowOpen: false,
			toggleChatWindow: jest.fn(), 
		});
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				general: { primaryColor: "blue", secondaryColor: "#000", embedded: false },
				tooltip: { text: "Chatbot Tooltip" }, 
			},
		});
		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				chatButtonStyle: { width: 75 },
				chatWindowStyle: { width: 375 },
				tooltipStyle: {}, 
			},
		});
	}); 

	// Clear all mocks after each test case to avoid test interference
	afterEach(() => {
		jest.clearAllMocks();
	});

	// Test: Render the tooltip when mode is "ALWAYS" and on desktop
	it('renders tooltip when mode is "ALWAYS" and isDesktop is true', () => {
		// Mock the context to return settings with mode "ALWAYS"
		(useSettingsContext as jest.Mock).mockReturnValueOnce({
			settings: {
				tooltip: { mode: "ALWAYS", text: "Chatbot Tooltip" },
			},
		});

		// Render the component and ensure the tooltip is shown
		render(<ChatBotTooltip />);
		const tooltip = screen.getByTestId("chat-tooltip");
		expect(tooltip).toBeInTheDocument(); 
		expect(tooltip).toHaveClass("rcb-tooltip-show"); 
	});

	// Test: Ensure the tooltip is hidden when mode is "NEVER"
	it('hides tooltip when mode is "NEVER"', () => {
		// Mock the context to return settings with mode "NEVER"
		(useSettingsContext as jest.Mock).mockReturnValueOnce({
			settings: {
				tooltip: { mode: "NEVER", text: "Chatbot Tooltip" },
			},
		});

		// Render the component and ensure the tooltip is rendered but hidden
		render(<ChatBotTooltip />);
		const tooltip = screen.getByTestId("chat-tooltip");
		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveClass("rcb-tooltip-hide");
	});

	// Test: Show the tooltip when mode is "START" (when component is rendered for the first time)
	it('shows tooltip when mode is "START" and shownTooltipOnStart is false', () => {
		// Mock the context to return settings with mode "START"
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				tooltip: { mode: "START", text: "Chatbot Tooltip" },
			},
		});

		// Render the component and ensure the tooltip is shown
		const { rerender } = render(<ChatBotTooltip />);
		const tooltip = screen.getByTestId("chat-tooltip");
		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveClass("rcb-tooltip-show");

		// Simulate the user opening the chat window, which should hide the tooltip
		(useChatWindowInternal as jest.Mock).mockReturnValue({
			isChatWindowOpen: true,
			toggleChatWindow: jest.fn(),
		});
		rerender(<ChatBotTooltip />);
		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveClass("rcb-tooltip-hide");

		// Simulate the user closing the chat window, the tooltip should remain hidden.
		(useChatWindowInternal as jest.Mock).mockReturnValue({
			isChatWindowOpen: false,
			toggleChatWindow: jest.fn(),
		});
		rerender(<ChatBotTooltip />);
		expect(tooltip).toHaveClass("rcb-tooltip-hide");
	});

	// Test: Ensure the tooltip shows when mode is "CLOSE"
	it('shows tooltip when mode is "CLOSE"', () => {
		// Mock the context to return settings with mode "CLOSE"
		(useSettingsContext as jest.Mock).mockReturnValueOnce({
			settings: {
				tooltip: { mode: "CLOSE", text: "Chatbot Tooltip" },
			},
		});

		// Render the component and ensure the tooltip is shown
		render(<ChatBotTooltip />);
		const tooltip = screen.getByText("Chatbot Tooltip");
		expect(tooltip).toBeInTheDocument();
	});

	// Test: Ensure clicking the tooltip calls the toggleChatWindow function
	it("calls toggleChatWindow function when tooltip is clicked", () => {
		// Mock the function that opens the chat
		const mockOpenChat = jest.fn();
		(useChatWindowInternal as jest.Mock).mockReturnValue({
			isChatWindowOpen: false,
			toggleChatWindow: mockOpenChat,
		});

		// Render the component, simulate click event and verify that toggleChatWindow is called
		render(<ChatBotTooltip />);
		const tooltip = screen.getByText("Chatbot Tooltip");
		fireEvent.click(tooltip); 
		expect(mockOpenChat).toHaveBeenCalledWith(true); 
	});
});
