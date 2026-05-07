import React from "react";

import { expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import BotMessage from "../../src/components/ChatBotBody/BotMessage/BotMessage";
import { Message } from "../../src";

import { TestChatBotProvider } from "../__mocks__/TestChatBotContext";

const message = (content: Message["content"], contentWrapper?: Message["contentWrapper"]): Message => ({
	id: "1",
	content,
	contentWrapper,
	sender: "bot",
	type: "string",
	timestamp: "2026-05-07T00:00:00.000Z"
});

const renderBotMessage = (
	content: Message["content"],
	isNewSender = true,
	settings = {},
	styles = {}
) => render(
	<TestChatBotProvider initialSettings={settings} initialStyles={styles}>
		<BotMessage message={message(content)} isNewSender={isNewSender} />
	</TestChatBotProvider>
);

describe("BotMessage Component", () => {
	it("renders a string message with bot bubble styles", () => {
		renderBotMessage("Hello from bot", true, {
			general: { secondaryColor: "#6e48aa" },
			botBubble: { animate: true, showAvatar: false }
		});

		const bubble = screen.getByText("Hello from bot");
		expect(bubble).toBeInTheDocument();
		expect(bubble).toHaveClass("rcb-bot-message", "rcb-bot-message-entry");
		expect(bubble).toHaveStyle({ backgroundColor: "#6e48aa", color: "#fff", maxWidth: "70%" });
	});

	it("shows avatar for a new sender and offsets repeated sender messages", () => {
		const settings = {
			botBubble: { showAvatar: true, avatar: "bot-avatar.png" }
		};

		const { container, rerender } = render(
			<TestChatBotProvider initialSettings={settings}>
				<BotMessage message={message("First bot message")} isNewSender={true} />
			</TestChatBotProvider>
		);

		expect(container.querySelector(".rcb-message-bot-avatar")).toHaveStyle({
			backgroundImage: 'url("bot-avatar.png")'
		});

		rerender(
			<TestChatBotProvider initialSettings={settings}>
				<BotMessage message={message("Next bot message")} isNewSender={false} />
			</TestChatBotProvider>
		);

		expect(container.querySelector(".rcb-message-bot-avatar")).not.toBeInTheDocument();
		expect(screen.getByText("Next bot message")).toHaveClass("rcb-bot-message-offset");
	});

	it("renders JSX content without adding the bot bubble wrapper", () => {
		renderBotMessage(<div data-testid="custom-content">Custom content</div>);

		const content = screen.getByTestId("custom-content");
		expect(content).toHaveTextContent("Custom content");
		expect(content).not.toHaveClass("rcb-bot-message");
	});

	it("applies a content wrapper and custom bubble styles", () => {
		const Wrapper = ({ children }: { children: React.ReactNode }) => (
			<div data-testid="content-wrapper">{children}</div>
		);

		render(
			<TestChatBotProvider initialStyles={{ botBubbleStyle: { borderRadius: "20px" } }}>
				<BotMessage message={message("Wrapped bot message", Wrapper)} isNewSender={true} />
			</TestChatBotProvider>
		);

		const wrapper = screen.getByTestId("content-wrapper");
		const bubble = screen.getByText("Wrapped bot message").closest(".rcb-bot-message");

		expect(wrapper).toContainElement(screen.getByText("Wrapped bot message"));
		expect(bubble).toHaveStyle({ borderRadius: "20px" });
	});
});
