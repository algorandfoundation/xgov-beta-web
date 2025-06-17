import type { ManifestOptions } from "vite-plugin-pwa"

export const manifest: Partial<ManifestOptions> = {
	name: "Algorand xGov",
	short_name: "xGov",
	description:
		"A public goods funding protocol for the Algorand network",
	theme_color: "#2D2DF1",
	background_color: "#ffffff",
	display: "fullscreen",
	icons: [
		{
			src: "/favicon.svg",
			sizes: "192x192",
			type: "image/png"
		},
		{
			src: "/favicon.svg",
			sizes: "512x512",
			type: "image/png"
		},
		{
			src: "/favicon.svg",
			sizes: "512x512",
			type: "image/png",
			purpose: "any maskable"
		}
	]
}