import React from 'react';
import { expect } from "@jest/globals";
import { render, screen, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom/jest-globals";
import ChatBotButton from '../../../src/components/ChatBotButton/ChatBotButton'; 
import { TestChatBotProvider } from '../../__mocks__/TestChatBotContext';
import { DefaultSettings } from "../../../src/constants/internal/DefaultSettings";

// Helper function to render ChatBotButton within TestChatBotProvider
const renderChatBotButton = (initialStyles = {}) => {
	return render(
		<TestChatBotProvider
			initialSettings={DefaultSettings}
			initialStyles={initialStyles}
		>
			<ChatBotButton />
		</TestChatBotProvider>
	);
};

describe('ChatBotButton', () => {
	it('renders ChatBotButton correctly', () => {
		renderChatBotButton();
		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('uses default width and height when no custom chatButtonStyle is provided', () => {
		renderChatBotButton();
		const button = screen.getByRole('button');

		expect(button).toHaveStyle({
			width: "75px",
			height: "75px"
		});
	});

	it('applies custom chatButtonStyle width and height', () => {
		renderChatBotButton({
			chatButtonStyle: { width: "100px", height: "100px" }
		});

		const button = screen.getByRole('button');

		expect(button).toHaveStyle({
			width: "100px",
			height: "100px"
		});
	});

	// Mock visibility toggle function (assuming it's triggered by a button click)
	it('toggles visibility classes correctly based on internal function', () => {
		renderChatBotButton();
		const button = screen.getByRole('button');

		// Initially visible
		expect(button).toHaveClass('rcb-button-show');

		// Simulate state change or function that hides the button
		fireEvent.click(button);
		expect(button).toHaveClass('rcb-button-hide');
	});
});