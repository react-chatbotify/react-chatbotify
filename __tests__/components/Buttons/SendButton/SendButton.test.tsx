import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import SendButton from "../../../../src/components/Buttons/SendButton/SendButton";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";
import { useSettingsContext } from "../../../../src/context/SettingsContext";
import { useBotStatesContext } from "../../../../src/context/BotStatesContext";
import { useSubmitInputInternal } from "../../../../src/hooks/internal/useSubmitInputInternal";
import { useStylesContext } from "../../../../src/context/StylesContext";
import { DefaultStyles } from "../../../../src/constants/internal/DefaultStyles";

import { sendIcon } from "../../../__mocks__/fileMock";

jest.mock("../../../../src/context/SettingsContext");
jest.mock("../../../../src/context/BotStatesContext");
jest.mock("../../../../src/hooks/internal/useSubmitInputInternal");
jest.mock("../../../../src/context/StylesContext");

/**
 * Test for SendButton component.
 */
describe("SendButton Component", () => {
	beforeEach(() => {
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				general: {
					primaryColor: DefaultSettings.general?.primaryColor,
					secondaryColor: DefaultSettings.general?.secondaryColor,
				},
				ariaLabel: { sendButton: DefaultSettings.ariaLabel?.sendButton },
				chatInput: {
					sendButtonIcon: sendIcon
				}
			}
		});

		// disable textArea as default
		(useBotStatesContext as jest.Mock).mockReturnValue({
			textAreaDisabled: true
		});

		(useSubmitInputInternal as jest.Mock).mockReturnValue({
			handleSubmitText: jest.fn()
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {}
		});
	});


	it("renders with correct aria-label and changes color on hover when textArea is enabled", () => {
		// enable textArea
		(useBotStatesContext as jest.Mock).mockReturnValue({
			textAreaDisabled: false
		});

		render(<SendButton />);

		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Check color when button is enabled
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.primaryColor}`);

		// Simulate hover
		fireEvent.mouseEnter(button);

		// Check hover color
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.secondaryColor}`);

		// Simulate mouse leave
		fireEvent.mouseLeave(button);

		// Check initial color after mouse leave
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.primaryColor}`);
	});

	it("renders default aria-label and default style color while textArea is enabled", () => {
		// remove provided settings
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {}
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: DefaultStyles
		});

		// enable textArea
		(useBotStatesContext as jest.Mock).mockReturnValue({
			textAreaDisabled: false
		});

		render(<SendButton />);

		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Check color when button is enabled
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonStyle?.backgroundColor}`);

		// Simulate hover
		fireEvent.mouseEnter(button);

		// Check hover color
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonHoveredStyle?.backgroundColor}`);

		// Simulate mouse leave
		fireEvent.mouseLeave(button);

		// Check initial color after mouse leave
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonStyle?.backgroundColor}`);
	});

	it("renders with disabled default style color and doesn't change color on hover when textArea is disabled", () => {
		// remove provided settings
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {}
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: DefaultStyles
		});

		render(<SendButton />);

		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Check color when button is disabled
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonDisabledStyle?.backgroundColor}`);

		// Check cursor style when button is disabled
		expect(button).toHaveStyle(`cursor: url("undefined"), auto`);

		// Simulate hover (should not change color when textArea is disabled)
		fireEvent.mouseEnter(button);

		// Check color when button is disabled and hovered
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonDisabledStyle?.backgroundColor}`);

		// Simulate mouse leave
		fireEvent.mouseLeave(button);

		// Check color after mouse leave
		expect(button).toHaveStyle(`backgroundColor: ${DefaultStyles.sendButtonDisabledStyle?.backgroundColor}`);

	});

	it("renders with default disabled style and doesn't change color on hover when textArea is disabled", () => {
		render(<SendButton />);

		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Check color when button is disabled
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.primaryColor}`);

		// Check cursor style when button is disabled
		expect(button).toHaveStyle(`cursor: url("undefined"), auto`);

		// Simulate hover (should not change color when textArea is disabled)
		fireEvent.mouseEnter(button);

		// Check color when button is disabled and hovered
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.primaryColor}`);

		// Simulate mouse leave
		fireEvent.mouseLeave(button);

		// Check color after mouse leave
		expect(button).toHaveStyle(`backgroundColor: ${DefaultSettings.general?.primaryColor}`);

	});

	it('calls handleSubmitText on mouse down when textArea is enabled', async () => {
		// enable textArea
		(useBotStatesContext as jest.Mock).mockReturnValue({
			textAreaDisabled: false
		});

		const mockHandleSubmitText = jest.fn();
		(useSubmitInputInternal as jest.Mock).mockReturnValue({ 
			handleSubmitText: mockHandleSubmitText 
		});

		render(<SendButton />);

		const button = screen.getByRole('button', { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Simulate mouse down
		fireEvent.mouseDown(button);

		// Check if the function was called once
		expect(mockHandleSubmitText).toHaveBeenCalledTimes(1);
	});

	it('does not call handleSubmitText on mouse down when textArea is disabled', async () => {
		const mockHandleSubmitText = jest.fn();
		(useSubmitInputInternal as jest.Mock).mockReturnValue({ 
			handleSubmitText: mockHandleSubmitText 
		});

		render(<SendButton />);

		const button = screen.getByRole('button', { name: DefaultSettings.ariaLabel?.sendButton });
		const icon = screen.getByTestId("rcb-send-icon");

		expect(button).toBeInTheDocument();
		expect(icon).toBeInTheDocument();

		// Simulate mouse down
		fireEvent.mouseDown(button);

		// Check to make sure the function was not called
		expect(mockHandleSubmitText).not.toHaveBeenCalled();
	});
});