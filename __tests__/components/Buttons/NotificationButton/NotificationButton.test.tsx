import React from "react";

import { expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import NotificationButton from "../../../../src/components/Buttons/NotificationButton/NotificationButton";
import { DefaultSettings } from "../../../../src/constants/internal/DefaultSettings";

import { TestChatBotProvider } from "../../../__mocks__/TestChatBotContext"
import { notificationIcon, notificationIconDisabled } from "../../../__mocks__/fileMock";

/**
 * Helper function to render NotificationButton with different settings.
 *
 * @param disabled boolean indicating if notification is disabled
 * @param defaultToggledOn boolean idnicating if notification is toggled on by default
 */
const renderNotificationButton = (disabled: boolean, defaultToggledOn: boolean) => {
	const initialSettings = {
		notification: {
			disabled: disabled,
			defaultToggledOn: defaultToggledOn,
			icon: notificationIcon,
			iconDisabled: notificationIconDisabled
		}
	};
	return render(
		<TestChatBotProvider initialSettings={initialSettings}>
			<NotificationButton />
		</TestChatBotProvider>
	);
};

/**
 * Test for NotificationButton component.
 */
describe("NotificationButton Component", () => {
	it("renders with correct aria-label and initial state when defaultToggledOn is false and not disabled", () => {
		// settings used for this test to render notification button
		renderNotificationButton(false, false);

		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.notificationButton });
		const icon = screen.getByTestId("rcb-notification-icon");
		expect(button).toBeInTheDocument();

		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");
	});

	it("toggles notification state when clicked (initially off)", () => {
		// settings used for this test to render notification button
		renderNotificationButton(false, false);

		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.notificationButton });
		const icon = screen.getByTestId("rcb-notification-icon");
		expect(button).toBeInTheDocument();

		// checks initial state
		expect(icon).toHaveStyle("fill: #e8eaed");

		// clicks the button to toggle notification
		fireEvent.mouseDown(button);

		// checks new state
		expect(icon).toHaveStyle("fill: #fcec3d");
	});

	it("renders with notification toggled on initially and toggles to off when clicked", () => {
		// settings used for this test to render notification button
		renderNotificationButton(false, true);

		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.notificationButton });
		const icon = screen.getByTestId("rcb-notification-icon");
		expect(button).toBeInTheDocument();

		// checks initial state
		expect(icon).toHaveStyle("fill: #fcec3d");

		// clicks the button to toggle notification
		fireEvent.mouseDown(button);

		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");
	});

	it("toggles notification back to on after being toggled off", () => {
		// settings used for this test to render notification button
		renderNotificationButton(false, true);

		// retrieves button and icon
		const button = screen.getByRole("button", { name: DefaultSettings.ariaLabel?.notificationButton });
		const icon = screen.getByTestId("rcb-notification-icon");
		expect(button).toBeInTheDocument();

		// checks initial state
		expect(icon).toHaveStyle("fill: #fcec3d");

		// clicks the button to toggle notification
		fireEvent.mouseDown(button);

		// checks new state
		expect(icon).toHaveStyle("fill: #e8eaed");

		// checks new state
		fireEvent.mouseDown(button);
		expect(icon).toHaveStyle("fill: #fcec3d");
	});
});