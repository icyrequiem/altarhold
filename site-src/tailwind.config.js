// Colours follow the game's Bronze Reliquary HUD (src/client/hud_skin.gd in the game repo).
module.exports = {
	content: ["./landing.jsx"],
	theme: {
		extend: {
			fontFamily: {
				heading: ["Cinzel", "Georgia", "serif"],
				pixel: ["Silkscreen", "ui-monospace", "monospace"],
				body: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
			},
			colors: {
				ink: "#180e12",
				plaque: "#281a1e",
				wood: { DEFAULT: "#4e3228", light: "#6e4a36", dark: "#2e1c1c" },
				bronze: { DEFAULT: "#c49652", light: "#fad68c", dark: "#785028" },
				cream: "#fff0cd",
				gold: "#ffdc78",
				muted: "#c8b496",
				arena: { DEFAULT: "#462a5a", light: "#8c64aa", dark: "#281432", text: "#f0dcff" },
				violet: { light: "#c79cff" },
			},
		},
	},
};
