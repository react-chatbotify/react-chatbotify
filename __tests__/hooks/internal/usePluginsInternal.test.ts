import { renderHook } from "@testing-library/react";
import { usePluginsInternal } from "../../../src/hooks/internal/usePluginsInternal";
import { Settings } from "../../../src/types/Settings";
import { useSettingsInternal } from "../../../src/hooks/internal/useSettingsInternal";
import { useStylesInternal } from "../../../src/hooks/internal/useStylesInternal";

jest.mock("../../../src/hooks/internal/useSettingsInternal");
jest.mock("../../../src/hooks/internal/useStylesInternal");

describe("usePluginsInternal", () => {
	const updateSettingsMock = jest.fn();
	const updateStylesMock = jest.fn();
	const mockSettings: Settings = { general: { primaryColor: "red" } };
	const mockStyles = {};
	const mockPlugins = [
		() => ({
			name: "plugin1",
			settings: { general: { primaryColor: "blue" } },
			styles: { tooltipStyle: { color: "green" } },
		}),
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(useSettingsInternal as jest.Mock).mockReturnValue({
			settings: mockSettings,
			replaceSettings: jest.fn(),
			updateSettings: updateSettingsMock,
		});
		(useStylesInternal as jest.Mock).mockReturnValue({
			styles: mockStyles,
			replaceStyles: jest.fn(),
			updateStyles: updateStylesMock,
		});
	});

	it("should call updateSettings and updateStyles methods with correct values, when plugins are used", () => {
		renderHook(() => usePluginsInternal(mockPlugins));

		expect(updateSettingsMock).toHaveBeenCalledWith({
			general: { primaryColor: "blue" },
		});
		expect(updateStylesMock).toHaveBeenCalledWith({
			tooltipStyle: { color: "green" },
		});
	});

	it("should call updateSettings and updateStyles methods with empty values, when no plugins are used", () => {
		renderHook(() => usePluginsInternal([]));

		expect(updateSettingsMock).toHaveBeenCalledWith({});
		expect(updateStylesMock).toHaveBeenCalledWith({});
	});
});
