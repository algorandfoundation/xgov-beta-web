import type { ManifestOptions } from "vite-plugin-pwa"

export const manifest: Partial<ManifestOptions> = {
	name: "Algorand xGov",
	short_name: "xGov",
	description:
		"A public goods funding protocol for the Algorand network",
	theme_color: "#FFFFFF",
	background_color: "#FFFFFF",
	display: "standalone",
	start_url: "/",
	scope: "/",
	icons: [
		{
			src: "/favicon.svg",
			sizes: "192x192",
			type: "image/svg+xml"
		},
		{
			src: "/favicon.svg",
			sizes: "512x512",
			type: "image/svg+xml"
		},
		{
			src: "/favicon.svg",
			sizes: "512x512",
			type: "image/svg+xml",
			purpose: "any maskable"
		}
	]
}

// Theme colors for dynamic PWA theme
export const THEME_COLORS = {
	light: "#FFFFFF",
	dark: "#001324"   // algo-black
} as const