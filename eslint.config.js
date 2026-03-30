import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
	{
		// Ignore patterns (replaces .eslintignore)
		ignores: ["node_modules/**", "dist/**"],
	},
	{
		// Apply these settings only to .ts and .tsx files
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,  // ECMAScript 2022
			sourceType: "module",
			parser: typescriptParser,  // Use the imported parser
		},
		plugins: {
			"@typescript-eslint": typescriptPlugin,
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
		},
		rules: {
			// TypeScript rules
			"@typescript-eslint/no-unused-vars": "error",
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			// Indentation and code style rules
			indent: ["error", "tab"],
			"react/jsx-indent": ["error", "tab"],
			"react/jsx-indent-props": ["error", "tab"],
			"max-len": ["error", { code: 120 }],
			// React hooks rules
			"react-hooks/rules-of-hooks": "error",
		},
	},
	{
		// Relaxed line-length for the dev playground entry (lots of JSX & string literals)
		files: ["**/App.tsx"],
		rules: {
			"max-len": ["warn", { code: 200 }],
		},
	},
];
