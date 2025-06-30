import type { ManifestOptions } from "vite-plugin-pwa"

export const manifest: Partial<ManifestOptions> = {
	name: "Algorand xGov",
	short_name: "xGov",
	description:
		"A public goods funding protocol for the Algorand network",
	theme_color: "#2D2DF1",
	background_color: "#ffffff",
	display: "fullscreen",
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