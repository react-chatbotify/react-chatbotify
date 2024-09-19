import { Settings } from "../types/Settings";
import { Styles } from "../types/Styles";
import { Theme } from "../types/Theme";
import { ThemeCacheData } from "../types/internal/ThemeCacheData";

const DEFAULT_URL = import.meta.env?.VITE_THEME_BASE_CDN_URL;
const DEFAULT_EXPIRATION = import.meta.env?.VITE_THEME_DEFAULT_CACHE_EXPIRATION;
const CACHE_KEY_PREFIX = import.meta.env?.VITE_THEME_CACHE_KEY_PREFIX;

/**
 * Fetches the cached theme if it exist and checks for expiry.
 *
 * @param id id of the theme
 * @param version version of the theme
 * @param cacheDuration duration that the theme should be cached for
 */
export const getCachedTheme = (id: string, version: string, cacheDuration: number): ThemeCacheData | null => {
	const cachedTheme = localStorage.getItem(`${CACHE_KEY_PREFIX}_${id}_${version}`);

	// if unable to find theme, not cached so return null
	if (!cachedTheme) {
		return null;
	}

	try {
		const parsedCacheTheme: ThemeCacheData = JSON.parse(cachedTheme);
		const milliseconds = new Date().getTime();
		const currentTimeInSeconds = Math.floor(milliseconds / 1000);
		// if cache date + duration is greater than current time, then cache is still valid
		if (parsedCacheTheme.cacheDate + cacheDuration >= currentTimeInSeconds) {
			return parsedCacheTheme;
		}
		return null;
	} catch (error) {
		console.error(`Unable to fetch cache for ${id}`, error);
		return null;
	}
}

/**
 * Saves a theme to cache.
 *
 * @param id id of the theme
 * @param version version of the theme
 * @param settings settings to cache
 * @param inlineStyles inline styles to cache
 * @param cssStylesText css styles to cache
 */
export const setCachedTheme = (id: string, version: string, settings: Settings, inlineStyles: Styles,
	cssStylesText: string) => {

	const milliseconds = new Date().getTime();
	const currentTimeInSeconds = Math.floor(milliseconds / 1000);

	const themeCacheData: ThemeCacheData = {
		settings,
		inlineStyles,
		cssStylesText,
		cacheDate: currentTimeInSeconds
	};

	localStorage.setItem(`${CACHE_KEY_PREFIX}_${id}_${version}`, JSON.stringify(themeCacheData));
}

/**
 * Applies the css styles given the css styles text.
 *
 * @param id id of the theme
 * @param cssStylesText css styles to apply
 */
const applyCssStyles = async (id: string, cssStylesText: string) => {
	try {
		// append css styles provided
		const cssLinkElement = document.createElement("link");
		cssLinkElement.id = `rcb-theme-style-${id}`;
		cssLinkElement.rel = "stylesheet";
		cssLinkElement.href = `data:text/css;charset=utf-8,${encodeURIComponent(cssStylesText)}`;
		document.head.appendChild(cssLinkElement);
	} catch (error) {
		console.error(`Failed to apply styles.css for: ${id}`, error);
	}
}

/**
 * Fetches the theme version from meta.json file.
 *
 * @param id id of the theme
 * @param baseUrl base url to fetch meta file from
 */
const fetchThemeVersionFromMeta = async (id: string, baseUrl: string) => {
	const metadataUrl = `${baseUrl}/${id}/meta.json`;
	try {
		const response = await fetch(metadataUrl);
		if (!response.ok) {
			console.error(`Failed to fetch meta.json from ${metadataUrl}`);
			return null;
		}
		const metadata = await response.json();
		return metadata.version;
	} catch (error) {
		console.error(`Failed to fetch meta.json from ${metadataUrl}`, error);
		return null;
	}
}

/**
 * Processes information for a given theme and retrieves its settings via CDN.
 * 
 * @param theme theme to process and retrieve settings for
 */
export const processAndFetchThemeConfig = async (theme: Theme): Promise<{settings: Settings, styles: Styles}> => {
	const { id, version, baseUrl = DEFAULT_URL, cacheDuration = DEFAULT_EXPIRATION } = theme;
	const themeVersion = version ? version : await fetchThemeVersionFromMeta(id, baseUrl);

	// if still cannot get version even from meta.json, return
	if (!themeVersion) {
		console.error(`Unable to find version for theme: ${id}`);
		return {settings: {}, styles: {}};
	}

	// try to get non-expired theme cache for specified theme and version
	const cache = getCachedTheme(id, themeVersion, cacheDuration);
	if (cache) {
		await applyCssStyles(id, cache.cssStylesText);
		return { settings: cache.settings, styles: cache.inlineStyles }
	}

	// for no cache found, construct urls for styles.css, settings.json and settings.json
	const cssStylesUrl = `${baseUrl}/${id}/${themeVersion}/styles.css`;
	const settingsUrl = `${baseUrl}/${id}/${themeVersion}/settings.json`;
	const inlineStylesUrl = `${baseUrl}/${id}/${themeVersion}/styles.json`;

	// fetch and apply css styles
	let cssStylesText = "";
	const cssStylesResponse = await fetch(cssStylesUrl);
	if (cssStylesResponse.ok) {
		cssStylesText = await cssStylesResponse.text();
	} else {
		console.info(`Could not fetch styles.css from ${cssStylesUrl}`);
	}
	await applyCssStyles(id, cssStylesText);

	// fetch and return settings
	const settingsResponse = await fetch(settingsUrl);
	let settings = {};
	if (settingsResponse.ok) {
		settings = await settingsResponse.json();
	} else {
		console.info(`Could not fetch settings.json from ${settingsUrl}`);
	}

	// fetch and return styles
	const inlineStylesResponse = await fetch(inlineStylesUrl);
	let inlineStyles = {};
	if (inlineStylesResponse.ok) {
		inlineStyles = await inlineStylesResponse.json();
	} else {
		console.info(`Could not fetch styles.json from ${inlineStylesUrl}`);
	}

	setCachedTheme(id, themeVersion, settings, inlineStyles, cssStylesText);
	return {settings, styles: inlineStyles};
}
