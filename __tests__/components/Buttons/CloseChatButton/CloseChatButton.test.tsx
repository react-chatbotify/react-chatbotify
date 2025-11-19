import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import CloseChatButton from "../../../../src/components/Buttons/CloseChatButton/CloseChatButton";
import { useChatWindowInternal } from "../../../../src/hooks/internal/useChatWindowInternal";
import { useSettingsContext } from "../../../../src/context/SettingsContext";
import { useStylesContext } from "../../../../src/context/StylesContext";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";

import { closeChatIcon } from "../../../__mocks__/fileMock";

// Mock the hooks used in the component
jest.mock("../../../../src/hooks/internal/useChatWindowInternal");
jest.mock("../../../../src/context/SettingsContext");
jest.mock("../../../../src/context/StylesContext");

/**
 * Test for CloseChatButton component.
 */
describe("CloseChatButton", () => {
	const toggleChatWindowMock = jest.fn();

	beforeEach(() => {
		// Mock the return value of useChatWindowInternal hook
		(useChatWindowInternal as jest.Mock).mockReturnValue({
			toggleChatWindow: toggleChatWindowMock,
		});

		// Mock the return value of useSettingsContext hook
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: { closeChatIcon },
				ariaLabel: { closeChatButton: DefaultSettings.ariaLabel?.closeChatButton },
			},
		});

		// Mock the return value of useStylesContext hook
		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				closeChatIconStyle: { color: "red" }, 
				closeChatButtonStyle: { backgroundColor: "gray" },
			},
		});
	});

	it("renders the CloseChatButton component", () => {
		// Render the CloseChatButton component
		render(<CloseChatButton />);

		// Get the button element by its role and name using default settings
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.closeChatButton });

		// Assert that the button is in the document
		expect(button).toBeInTheDocument();
	});

	it("displays the correct aria-label", () => {
		// Render the CloseChatButton component
		render(<CloseChatButton />);
		// Get the button element by its role and name using default settings
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.closeChatButton });

		// Assert that the button has the correct aria-label attribute
		expect(button).toHaveAttribute("aria-label", DefaultSettings.ariaLabel?.closeChatButton);
	});

	it("applies the correct background image to the close chat icon", () => {
		// Render the CloseChatButton component
		render(<CloseChatButton />);
		// Get the icon element by its data test id
		const icon = screen.getByTestId("rcb-close-chat-icon");

		// Check if the fill is set correctly
		expect(icon).toHaveStyle("fill: #e8eaed");
	});

	it("applies the default aria-label when none is provided in settings", () => {
		// Mock settings without ariaLabel.closeChatButton
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: { closeChatIcon: DefaultSettings.header?.closeChatIcon },
				ariaLabel: {},
			},
		});

		render(<CloseChatButton />);

		// Check if the aria-label falls back to "close chat"
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.closeChatButton });
		expect(button).toHaveAttribute("aria-label", DefaultSettings.ariaLabel?.closeChatButton);
	});

	it("applies the correct styles to the button and icon", () => {
		// Render the CloseChatButton component
		render(<CloseChatButton />);
		// Get the button element by its role
		const button = screen.getByRole("button");
		// Get the icon element by its data test id
		const icon = screen.getByTestId("rcb-close-chat-icon");

		// Assert that the button has the correct background color
		expect(button).toHaveStyle("background-color: gray");
		// Assert that the icon has the correct color
		expect(icon).toHaveStyle("color: red");
		// Assert that the icon has correct fill
		expect(icon).toHaveStyle("fill: #e8eaed");
	});

	it("calls toggleChatWindow(false) when the button is clicked", () => {
		// Render the CloseChatButton component
		render(<CloseChatButton />);
		// Get the button element by its role
		const button = screen.getByRole("button");
		// Fire the mouseDown event on the button
		fireEvent.mouseDown(button);
		// Assert that toggleChatWindowMock was called with false
		expect(toggleChatWindowMock).toHaveBeenCalledWith(false);
	});

	it("stops propagation of mouse down event", () => {
		// Render the component
		render(<CloseChatButton />);
		const button = screen.getByRole("button");

		// Spy on the stopPropagation method of the event
		const stopPropagationSpy = jest.spyOn(MouseEvent.prototype, "stopPropagation");

		// Fire the mouseDown event
		fireEvent.mouseDown(button);

		// Assert that stopPropagation was called
		expect(stopPropagationSpy).toHaveBeenCalled();

		// Clean up the spy
		stopPropagationSpy.mockRestore();
	});

	it("handles undefined settings.header gracefully", () => {
		// Mock settings with undefined header
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: undefined, // Simulate missing header
				ariaLabel: { closeChatButton: DefaultSettings.ariaLabel?.closeChatButton },
			},
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				closeChatIconStyle: { color: "red" },
				closeChatButtonStyle: { backgroundColor: "gray" },
			},
		});

		render(<CloseChatButton />);

		// Check that it renders without crashing
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.closeChatButton });
		expect(button).toBeInTheDocument();
	});

	it("handles undefined settings.ariaLabel gracefully", () => {
		// Mock settings without ariaLabel
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: { closeChatIcon: DefaultSettings.header?.closeChatIcon },
				ariaLabel: undefined, // Simulate missing ariaLabel
			},
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				closeChatIconStyle: { color: "red" },
				closeChatButtonStyle: { backgroundColor: "gray" },
			},
		});

		render(<CloseChatButton />);

		// Check that it falls back to the default aria-label
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.closeChatButton });
		expect(button).toHaveAttribute("aria-label", DefaultSettings.ariaLabel?.closeChatButton);
	});
});
