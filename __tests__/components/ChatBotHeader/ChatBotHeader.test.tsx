import React from "react";

import { expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";

import ChatBotHeader  from "../../../src/components/ChatBotHeader/ChatBotHeader"

import { useSettingsContext } from "../../../src/context/SettingsContext";
import { useStylesContext } from "../../../src/context/StylesContext";
import { useButtonInternal } from "../../../src/hooks/internal/useButtonsInternal";
import { botAvatar } from "../../__mocks__/fileMock";

jest.mock("../../../src/context/SettingsContext");
jest.mock("../../../src/context/StylesContext");
jest.mock("../../../src/hooks/internal/useButtonsInternal")

describe("ChatBotHeader Component", () => {
	
	beforeEach(() => {
		const mockHeaderButtons = [
			<button key="mock-button-1" role="button">Mock Button 1</button>,
			<button key="mock-button-2" role="button">Mock Button 2</button>
		];

		(useButtonInternal as jest.Mock).mockReturnValue({
			headerButtons: mockHeaderButtons,
		});

		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: {
					avatar: botAvatar,
					showAvatar: true,
					title: "Mock Title"
				}
			},
		});

		(useStylesContext as jest.Mock).mockReturnValue({
			styles: {
				headerStyle: {
					background: 'black',
					color: 'white',
				}
			}
		});
	});

	// this test strictly checks the div layout to ensure that the styles are being applied correctly
	it("renders header with correct div layout, styles, mocked buttons with avatar when showAvatar is true", () => {
		render(<ChatBotHeader buttons={useButtonInternal().headerButtons}/>);

		// First, get the header text by title, then get the header container and avatar
		// There is no other way to directly get the header container based on the current component structure
		// We can modify the component to add a ref or use data-testid to get the header container
		const headerText = screen.getByText("Mock Title");
		const headerContainer = headerText
			.parentNode?.parentNode?.parentNode?.querySelector(".rcb-chat-header-container");
		const avatar = headerContainer?.querySelector(".rcb-bot-avatar");

		// check if the elements are in the document
		expect(headerText).toBeInTheDocument();
		expect(headerContainer).toBeInTheDocument();
		expect(avatar).toBeInTheDocument();

		// check header container class and style
		expect(headerContainer).toHaveClass("rcb-chat-header-container");
		expect(headerContainer).toHaveStyle({
			background: 'black',
			color: 'white',
		});

		// check avatar icon and class
		expect(avatar).toHaveClass("rcb-bot-avatar");
		expect(avatar).toHaveStyle({
			backgroundImage: `url(${botAvatar})`,
		});

		// get all header buttons
		const headerButtons = screen.getAllByRole("button");

		// make sure there are two buttons as expected
		expect(headerButtons).toHaveLength(2);

		// check header buttons to make sure they are in the document and have the correct text
		expect(headerButtons[0]).toBeInTheDocument();
		expect(headerButtons[1]).toBeInTheDocument();
		expect(headerButtons[0]).toHaveTextContent("Mock Button 1");
		expect(headerButtons[1]).toHaveTextContent("Mock Button 2");
	});

	it("renders header with correct div layout, styles, mocked buttons without avatar when showAvatar is false", () => {
		(useSettingsContext as jest.Mock).mockReturnValue({
			settings: {
				header: {
					showAvatar: false,
					title: "Mock Title"
				}
			},
		});
		render(<ChatBotHeader buttons={useButtonInternal().headerButtons}/>);

		// First, get the header text by title, then get the header container and avatar
		// There is no other way to directly get the header container based on the current component structure
		// We can modify the component to add a ref or use data-testid to get the header container
		const headerText = screen.getByText("Mock Title");
		const headerContainer = headerText
			.parentNode?.parentNode?.parentNode?.querySelector(".rcb-chat-header-container");
		const avatar = headerContainer?.querySelector(".rcb-bot-avatar");

		// check if the elements are in the document
		expect(headerText).toBeInTheDocument();
		expect(headerContainer).toBeInTheDocument();

		// check to make sure the avatar is not in the document
		expect(avatar).not.toBeInTheDocument();

		// check header container class and style
		expect(headerContainer).toHaveClass("rcb-chat-header-container");
		expect(headerContainer).toHaveStyle({
			background: 'black',
			color: 'white',
		});

		// get all header buttons
		const headerButtons = screen.getAllByRole("button");

		// make sure there are two buttons as expected
		expect(headerButtons).toHaveLength(2);

		// check header buttons to make sure they are in the document and have the correct text
		expect(headerButtons[0]).toBeInTheDocument();
		expect(headerButtons[1]).toBeInTheDocument();
		expect(headerButtons[0]).toHaveTextContent("Mock Button 1");
		expect(headerButtons[1]).toHaveTextContent("Mock Button 2");
	});
});