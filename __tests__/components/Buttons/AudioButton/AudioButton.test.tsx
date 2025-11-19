import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import AudioButton from "../../../../src/components/Buttons/AudioButton/AudioButton";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";

import { TestChatBotProvider } from "../../../__mocks__/TestChatBotContext";
import { audioIcon, audioIconDisabled } from "../../../__mocks__/fileMock";

/**
 * Helper function to render AudioButton with different settings.
 *
 * @param disabled boolean indicating if audio is disabled
 * @param defaultToggledOn boolean idnicating if audio is toggled on by default
 */
const renderAudioButton = (disabled: boolean, defaultToggledOn: boolean) => {
	const initialSettings = {
		audio: {
			disabled: disabled,
			defaultToggledOn: defaultToggledOn,
			icon: audioIcon,
			iconDisabled: audioIconDisabled
		}
	};
	return render(
		<TestChatBotProvider initialSettings={initialSettings}>
			<AudioButton />
		</TestChatBotProvider>
	);
};

/**
 * Test for AudioButton component.
 */
describe("AudioButton Component", () => {
	it("renders with correct aria-label and initial state when defaultToggledOn is false and not disabled", () => {
		// settings used for this test to render audio button
		renderAudioButton(false, false);
	
		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.audioButton });
		const icon = screen.getByTestId("rcb-audio-icon");
		expect(button).toBeInTheDocument();
	
		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");
	});
	
	it("toggles audio state when clicked (initially off)", () => {
		// settings used for this test to render audio button
		renderAudioButton(false, false);
	
		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.audioButton });
		const icon = screen.getByTestId("rcb-audio-icon");
		expect(button).toBeInTheDocument();
	
		// checks initial state
		expect(icon).toHaveStyle("fill: #e8eaed");
	
		// clicks the button to toggle audio
		fireEvent.mouseDown(button);
	
		// checks new state
		expect(icon).toHaveStyle("fill: #fcec3d");
	});
	
	it("renders with audio toggled on initially and toggles to off when clicked", () => {
		// settings used for this test to render audio button
		renderAudioButton(false, true);
	
		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.audioButton });
		const icon = screen.getByTestId("rcb-audio-icon");
		expect(button).toBeInTheDocument();
	
		// checks initial state
		expect(icon).toHaveStyle("fill: #fcec3d");
	
		// clicks the button to toggle audio
		fireEvent.mouseDown(button);
	
		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");
	});
	
	it("toggles audio back to on after being toggled off", () => {
		// settings used for this test to render audio button
		renderAudioButton(false, true);
	
		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.audioButton });
		const icon = screen.getByTestId("rcb-audio-icon");
		expect(button).toBeInTheDocument();
	
		// checks initial state
		expect(icon).toHaveStyle("fill: #fcec3d");
	
		// clicks the button to toggle audio
		fireEvent.mouseDown(button);

		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");
	
		// checks new state
		fireEvent.mouseDown(button);
		expect(icon).toHaveStyle("fill: #fcec3d");
	});
});