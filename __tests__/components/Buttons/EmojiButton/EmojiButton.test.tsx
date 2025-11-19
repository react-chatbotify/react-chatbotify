import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import EmojiButton from "../../../../src/components/Buttons/EmojiButton/EmojiButton";
import { useTextAreaInternal } from "../../../../src/hooks/internal/useTextAreaInternal";
import { useBotStatesContext } from "../../../../src/context/BotStatesContext";
import { useBotRefsContext } from "../../../../src/context/BotRefsContext";
import { useSettingsContext } from "../../../../src/context/SettingsContext";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";
import { useStylesContext } from "../../../../src/context/StylesContext";
import { actionDisabledIcon, emojiIcon } from "../../../__mocks__/fileMock";
jest.mock("../../../../src/context/BotStatesContext");
jest.mock("../../../../src/context/BotRefsContext");
jest.mock("../../../../src/context/SettingsContext");
jest.mock("../../../../src/hooks/internal/useTextAreaInternal");
jest.mock("../../../../src/context/StylesContext");

describe("EmojiButton component", () => {
	const mockInputRef = { current: document.createElement("input") };
	const mockSyncedTextAreaDisabledRef = { current: false };
	mockInputRef.current.value = "";

	const mockSetTextAreaValue = jest.fn();

	beforeEach(() => {
		(useTextAreaInternal as jest.Mock).mockReturnValue({
			textAreaDisabled: false,
			setTextAreaValue: mockSetTextAreaValue
		});
		(useBotStatesContext as jest.Mock).mockReturnValue({
			syncedTextAreaDisabledRef: mockSyncedTextAreaDisabledRef,
		});
		(useBotRefsContext as jest.Mock).mockReturnValue({
			inputRef: mockInputRef
		});
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				general: {
					primaryColor: DefaultSettings.general?.primaryColor,
					secondaryColor: DefaultSettings.general?.secondaryColor,
					actionDisabledIcon: actionDisabledIcon
				},
				ariaLabel: {
					emojiButton: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker"
				},
				emoji: {
					disabled: false,
					icon: emojiIcon,
					list: DefaultSettings.emoji?.list ?? ["😀"]
				}
			}
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				emojiButtonStyle: {},
				emojiButtonDisabledStyle: {},
				emojiIconStyle: {},
				emojiIconDisabledStyle: {}
			}
		});
	});

	it("renders EmojiButton correctly and displays emoji popup on click", () => {
		render(<EmojiButton />);
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });
		const icon = button.querySelector("span");

		// check if the emoji button is in the document
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("rcb-emoji-button-enabled");
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveClass("rcb-emoji-icon-enabled");

		// click the emoji button to open the popup
		fireEvent.mouseDown(button);

		// check if the emoji popup is in the document
		const popup = screen.getByText(DefaultSettings.emoji?.list?.[0] ?? "😀").closest("div");
		expect(popup).toBeInTheDocument();

		// select the first emoji in the popup and check if it is in the document
		const emoji = popup?.querySelector("span");
		expect(emoji).toBeInTheDocument();
		expect(emoji).toHaveClass("rcb-emoji");
	});

	it("dismisses emoji popup when clicking outside", () => {
		render(<EmojiButton />);
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });

		// click the emoji button to open the popup
		fireEvent.mouseDown(button);

		// click outside the popup to close the emoji popup
		fireEvent.mouseDown(document.body);

		// check if the emoji popup is dismissed
		const popup = screen.queryByText(DefaultSettings.emoji?.list?.[0] ?? "😀")?.closest("div");
		expect(popup).toBeUndefined();
	});

	it("dismisses emoji popup when clicking the emoji button again", () => {
		render(<EmojiButton />);
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });

		// click the emoji button to open the popup
		fireEvent.mouseDown(button);

		// check if the emoji popup is in the document
		let popup = screen.queryByText(DefaultSettings.emoji?.list?.[0] ?? "😀")?.closest("div");
		expect(popup).toBeInTheDocument();

		// click the emoji button again to close the popup
		fireEvent.mouseDown(button);

		// check if the emoji popup is dismissed
		popup = screen.queryByText(DefaultSettings.emoji?.list?.[0] ?? "😀")?.closest("div");
		expect(popup).toBeUndefined();
	});


	it("selecting emoji and displays it in the text area", () => {
		// allow jest to control useTimeout
		jest.useFakeTimers();

		render(<EmojiButton />);
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });

		// click the emoji button to open the popup
		fireEvent.mouseDown(button);

		// check if the emoji popup is in the document
		const emoji = screen.getByText(DefaultSettings.emoji?.list?.[0] ?? "😀")

		// click the emoji to select it
		fireEvent.mouseDown(emoji);

		// let setTimeout inside handleEmojiClick to run
		jest.runAllTimers();

		// check if the emoji is selected
		expect(mockSetTextAreaValue).toHaveBeenCalledWith(DefaultSettings.emoji?.list?.[0] ?? "😀");
	});

	it("emoji button is disabled when text area is disabled", () => {
		// mock the text area to be disabled
		(useTextAreaInternal as jest.Mock).mockReturnValue({
			textAreaDisabled: true,
		});
		(useBotStatesContext as jest.Mock).mockReturnValue({
			syncedTextAreaDisabledRef: { current: true },
		});


		render(<EmojiButton />);

		// check if the emoji button is disabled when the text area is disabled
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });
		expect(button).toHaveClass("rcb-emoji-button-disabled");

		fireEvent.mouseDown(button);

		// check if the emoji popup is not in the document
		const popup = screen.queryByText(DefaultSettings.emoji?.list?.[0] ?? "😀")?.closest("div");
		expect(popup).toBeUndefined();
	});

	it("updates popupRef when window is resized", () => {
		render(<EmojiButton />);
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.emojiButton ?? "emoji picker" });

		// Open the emoji popup
		fireEvent.mouseDown(button);

		const popup = screen.queryByText(DefaultSettings.emoji?.list?.[0] ?? "😀")?.closest("div");
		expect(popup).toBeInTheDocument();

		// Simulate window resize
		fireEvent.resize(window);

		expect(popup).toHaveAttribute("style");
	})
});
