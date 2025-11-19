import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import VoiceButton from "../../../../src/components/Buttons/VoiceButton/VoiceButton";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";
import { useTextAreaInternal } from "../../../../src/hooks/internal/useTextAreaInternal";
import { TestChatBotProvider } from "../../../__mocks__/TestChatBotContext";
import { voiceIcon, voiceIconDisabled } from "../../../__mocks__/fileMock";

jest.mock("../../../../src/hooks/internal/useTextAreaInternal");

/**
 * Helper function to render VoiceButton with different settings.
 *
 * @param disabled boolean indicating if voice option is disabled
 * @param defaultToggledOn boolean indicating if voice option is toggled on by default
 */
const renderVoiceButton = (disabled: boolean, defaultToggledOn: boolean) => {
	const initialSettings = {
		voice: {
			disabled: disabled,
			defaultToggledOn: defaultToggledOn,
			icon: voiceIcon,
			iconDisabled: voiceIconDisabled,
		},
	};
	return render(
		<TestChatBotProvider initialSettings={initialSettings}>
			<VoiceButton />
		</TestChatBotProvider>
	);
};

/**
 * Tests for VoiceButton component.
 */

describe("VoiceButton Component", () => {
	const voiceIconTestId = "rcb-voice-icon";

	beforeEach(() => {
		(useTextAreaInternal as jest.Mock).mockReturnValue({
			textAreaDisabled: false,
		});
	});

	it("renders with aria-label and initial state when defaultToggledOn is false and not disabled", () => {
		renderVoiceButton(false, false);

		const button = screen.getByRole("button", {
			name: DefaultSettings.ariaLabel?.voiceButton,
		});
		const icon = screen.getByTestId(voiceIconTestId);

		expect(button).toBeInTheDocument();

		expect(icon).toHaveStyle("fill: #9aa0a6");
		expect(icon.style.backgroundImage).toBe(`url(${voiceIconDisabled})`);
	});

	it("toggles voice state when clicked (initially off)", () => {
		renderVoiceButton(false, false);

		const button = screen.getByRole("button", {
			name: DefaultSettings.ariaLabel?.voiceButton,
		});
		const icon = screen.getByTestId(voiceIconTestId);

		expect(icon.style.backgroundImage).toBe(`url(${voiceIconDisabled})`);

		fireEvent.mouseDown(button);

		expect(icon.style.backgroundImage).toBe(`url(${voiceIcon})`);
	});

	it("renders with voice toggled on initially and toggles to off when clicked", () => {
		renderVoiceButton(false, true);

		const button = screen.getByRole("button", {
			name: DefaultSettings.ariaLabel?.voiceButton,
		});
		const icon = screen.getByTestId(voiceIconTestId);
		expect(icon.style.backgroundImage).toBe(`url(${voiceIcon})`);

		fireEvent.mouseDown(button);

		expect(icon.style.backgroundImage).toBe(`url(${voiceIconDisabled})`);
	});

	it("toggles notification back to on after being toggled off", () => {
		renderVoiceButton(false, true);

		const button = screen.getByRole("button", {
			name: DefaultSettings.ariaLabel?.voiceButton,
		});
		const icon = screen.getByTestId(voiceIconTestId);
		expect(icon.style.backgroundImage).toBe(`url(${voiceIcon})`);

		fireEvent.mouseDown(button);

		expect(icon.style.backgroundImage).toBe(`url(${voiceIconDisabled})`);

		fireEvent.mouseDown(button);

		expect(icon.style.backgroundImage).toBe(`url(${voiceIcon})`);
	});
});
