import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

// Altarhold home page. React + Tailwind CSS (v3), built by `npm run build` into assets/.
// Look: the game's "Bronze Reliquary" HUD palette (src/client/hud_skin.gd in the game repo).
// Fonts: Cinzel (headings, matches the logo), Silkscreen (pixel labels), Inter (body), from Google Fonts.
// Devlogs are listed on devlog/index.html, not here.

const DISCORD_URL = null; // Set to the invite link once the server exists.
// Windows only, no sign-up. The button links the newest installer (AltarholdSetup-*.exe) on the site repo's releases,
// else the newest launcher zip, else the newest game zip; alpha/download.html does the same.
const RELEASES_REPO = "icyrequiem/altarhold";
const DOWNLOAD_PAGE = "alpha/download.html";
const FALLBACK_DOWNLOAD = DOWNLOAD_PAGE;

// Pixel icons: one string per row; each letter is a palette colour, "." is empty.
const ICON_COLORS = { k: "#180e12", b: "#c49652", l: "#fad68c", d: "#785028", v: "#a070e0", w: "#f0d8ff", c: "#fff0cd", r: "#d0503c", g: "#58be46", s: "#8c8c9a" };
const ICONS = {
	relic: ["....kk....", "...kwvk...", "..kwvvvk..", ".kwvvvvvk.", "kwvvvvvvvk", ".kvvvvvdk.", "..kvvvdk..", "...kvdk...", "....kk....", ".........."],
	coin: ["..kkkkkk..", ".kllllllk.", "kllbbbblrk", "klbbbbbrlk", "klbbbbrblk", "klbbbrbblk", "klbbrbbblk", "klrbbbblk.", ".kllllllk.", "..kkkkkk.."],
	feet: ["...kk.....", "..kcck....", "..kcck....", "..kcck..kk", "..kcckkkck", "..kcccccck", "..kddddddk", "...kkkkkk.", "rrrrrrrrrr", ".........."],
	wall: ["kkkkkkkkkk", "kbbbkbbbbk", "kddkkddddk", "kkkkkkkkkk", "kbbbbkbbbk", "kddddkdddk", "kkkkkkkkkk", "kbbkbbbbbk", "kddkdddddk", "kkkkkkkkkk"],
	eye: [".........", "..kkkkk..", ".kcccccck", "kcckvkcck", "kcckkkcck", ".kcccccck", "..kkkkk..", "........."],
	sword: [".......kk", "......kck", ".....kck.", "....kck..", "kk.kck...", ".kkck....", "..kk.....", ".kdkk....", "kdk..k..."],
	paw: ["..kk..kk..", ".kgk..kgk.", ".kgk..kgk.", "..kk..kk..", "...kkkk...", "..kggggk..", ".kggggggk.", ".kggggggk.", "..kkkkkk..", ".........."],
};

function PixelIcon({ name, size = 40 }) {
	const rows = ICONS[name];
	const w = Math.max(...rows.map((r) => r.length));
	return (
		<svg viewBox={`0 0 ${w} ${rows.length}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" className="shrink-0">
			{rows.flatMap((row, y) =>
				[...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={ICON_COLORS[ch]} />)),
			)}
		</svg>
	);
}

// A bronze-framed panel with notched pixel corners.
function Panel({ className = "", inner = "", tone = "plaque", children }) {
	const fill = tone === "arena" ? "bg-arena-dark" : tone === "wood" ? "bg-wood-dark" : "bg-plaque";
	return (
		<div className={`notch bg-bronze p-[3px] ${className}`}>
			<div className={`notch-inner h-full ${fill} shadow-[inset_0_3px_0_rgba(250,214,140,0.12),inset_0_-3px_0_rgba(0,0,0,0.35)] ${inner}`}>{children}</div>
		</div>
	);
}

function PixelButton({ href, children, tone = "gold", className = "" }) {
	const tones = {
		gold: "bg-gold text-ink hover:bg-bronze-light",
		ghost: "bg-plaque text-cream hover:bg-wood",
	};
	return (
		<a href={href} className={`notch inline-block bg-ink p-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${className}`}>
			<span className={`notch-inner block px-6 py-3 font-pixel text-sm uppercase tracking-wider shadow-[inset_0_-4px_0_rgba(0,0,0,0.3),inset_0_3px_0_rgba(255,255,255,0.35)] transition ${tones[tone]}`}>
				{children}
			</span>
		</a>
	);
}

function SectionTitle({ kicker, title, id, children }) {
	return (
		<div className="max-w-3xl">
			<p className="font-pixel text-xs uppercase tracking-[0.2em] text-violet-light">{kicker}</p>
			<h2 id={id} className="mt-3 font-heading text-3xl font-bold uppercase tracking-wide text-gold sm:text-5xl [text-wrap:balance]">{title}</h2>
			{children && <p className="mt-4 text-lg text-muted">{children}</p>}
		</div>
	);
}

// The newest published Windows installer, else launcher zip, else game zip, from the site repo's releases.
function useWindowsDownload() {
	const [download, setDownload] = useState({ url: FALLBACK_DOWNLOAD, version: null });
	useEffect(() => {
		const find = (releases, prefix, suffix = "-windows.zip") => {
			for (const release of releases) {
				if (release.draft || !/^v\d/.test(release.tag_name)) continue;
				const asset = (release.assets || []).find((a) => a.name.startsWith(prefix) && a.name.endsWith(suffix) && /\d/.test(a.name.charAt(prefix.length)));
				if (asset) return { url: asset.browser_download_url, version: release.tag_name.slice(1) };
			}
			return null;
		};
		fetch(`https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=20`)
			.then((response) => (response.ok ? response.json() : []))
			.then((releases) => {
				if (!Array.isArray(releases)) return;
				const found = find(releases, "AltarholdSetup-", ".exe") ?? find(releases, "AltarholdLauncher-") ?? find(releases, "Altarhold-");
				if (found) setDownload(found);
			})
			.catch(() => {});
	}, []);
	return download;
}

function Nav({ download }) {
	const links = [
		["#mechanics", "Mechanics"],
		["#pixel-art", "Pixel art"],
		["#heroes", "Heroes"],
		["devlog/", "Devlog"],
	];
	return (
		<header className="sticky top-0 z-30 border-b-[3px] border-bronze-dark bg-ink/90 backdrop-blur">
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
				<a href="./" className="flex shrink-0 items-center gap-3" aria-label="Altarhold home">
					<img src="img/logo/altarhold-emblem.svg" alt="" width="36" height="36" className="h-9 w-9 sm:hidden" />
					<img src="img/logo/altarhold-wordmark.svg" alt="Altarhold" width="170" height="32" className="hidden h-7 w-auto sm:block" />
				</a>
				<div className="flex items-center gap-4 sm:gap-6">
					<ul className="hidden items-center gap-6 md:flex">
						{links.map(([href, label]) => (
							<li key={href}>
								<a href={href} className="font-pixel text-xs uppercase tracking-wider text-muted hover:text-gold">{label}</a>
							</li>
						))}
					</ul>
					<PixelButton href={download.url} className="[&>span]:px-4 [&>span]:py-2 [&>span]:text-xs">Download</PixelButton>
				</div>
			</nav>
		</header>
	);
}

function Hero({ download }) {
	return (
		<section className="relative isolate overflow-hidden border-b-[3px] border-bronze-dark">
			<img src="img/shots/hero-backdrop.webp" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(24,14,18,0.55),rgba(24,14,18,0.92)_70%)]" />
			<div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />
			<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
				<div>
					<img src="img/logo/altarhold-logo.svg" alt="Altarhold" width="440" height="215" className="h-auto w-64 drop-shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:w-96" />
					<p className="mt-8 font-pixel text-xs uppercase tracking-[0.2em] text-violet-light">5v5 MOBA · Pixel art · Free alpha</p>
					<h1 className="mt-3 font-heading text-4xl font-bold uppercase leading-tight text-cream sm:text-6xl [text-wrap:balance]">
						No shop. No dashes. <span className="text-gold">Hold the altar.</span>
					</h1>
					<p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
						Grow through levels and relics instead of gold, and win fights on positioning, because nobody can blink out of one.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-4">
						<PixelButton href={download.url}>Download for Windows</PixelButton>
						<PixelButton href="#mechanics" tone="ghost">How it plays</PixelButton>
					</div>
					<p className="mt-4 font-pixel text-[11px] uppercase tracking-wider text-muted/80">
						Free · No sign-up{download.version ? ` · Build ${download.version}` : ""}
					</p>
				</div>
				<div className="hidden justify-center lg:flex">
					<Panel tone="arena" className="w-[22rem]" inner="relative flex aspect-square items-end justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_70%,#8c64aa66,transparent_60%)]">
						<img src="img/anim/orin_ash-run-8dir.webp" alt="Orin Ash, a fire mage, running in all eight directions" width="192" height="224" className="pixelated mb-6 h-[19rem] w-auto" />
						<span className="absolute left-4 top-4 font-pixel text-[10px] uppercase tracking-widest text-arena-text">Orin Ash · 8 directions</span>
					</Panel>
				</div>
			</div>
		</section>
	);
}

const MECHANICS = [
	{
		icon: "coin",
		title: "No gold. No shop.",
		body: "Minions, jungle monsters and enemy heroes give experience, not gold. Every level hands you points to put into Strength, Agility or Intelligence, and points in your hero's primary attribute hit harder with basic attacks. You build your hero, not an inventory.",
	},
	{
		icon: "feet",
		title: "No blinks, dashes or stealth",
		body: "No hero or relic can blink, dash, leap or turn invisible. You get out of a bad fight with footwork, or not at all. The only teleport is a channelled recall to base.",
	},
	{
		icon: "wall",
		title: "Solid minions",
		body: "Units don't walk through each other. Block a minion wave, body-block a chase, or get trapped against your own creeps if you play careless.",
	},
	{
		icon: "eye",
		title: "Fog of war, no wards",
		body: "You see what your team's heroes, minions and towers see, and jungle walls block sight. There are no wards to buy, so vision means being there.",
	},
	{
		icon: "sword",
		title: "Kills that count",
		body: "Hero kills pay extra experience, with more for first blood, shutdowns and multi-kills. Everyone who helped gets a share, wherever they are on the map.",
	},
	{
		icon: "paw",
		title: "A jungle for experience",
		body: "Four jungle quadrants of wolves, raptors, toads, crabs and bigger brutes. Camps give experience only, no buffs, and they leash back home if you drag them away.",
	},
];

const ARENA_STEPS = [
	["Announced", "A warning goes out before an arena opens in the top or bottom river pit, with how many heroes each team may send."],
	["Weighted", "The team holding more relics gets fewer places, so a lead is harder to stretch."],
	["Walled", "A barrier lets in only the heroes with a place, and no attack or ability crosses it."],
	["Captured", "Hold the majority in the centre to fill the capture; a tie resets it. The arena shatters and the winning team's lowest-level hero takes the relic."],
];

function Mechanics() {
	return (
		<section id="mechanics" aria-labelledby="mechanics-title" className="scroll-mt-20 py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionTitle kicker="How it plays" title="A MOBA built on positioning" id="mechanics-title">
					Three lanes, a river, four jungle quadrants and five heroes a side. Everything else was rethought.
				</SectionTitle>

				<Panel tone="arena" className="mt-12" inner="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
					<figure className="relative">
						<img src="img/shots/relic-arena.webp" alt="A relic arena on a stone dais in the river, ringed by a violet barrier, with heroes fighting inside" width="960" height="540" className="h-full w-full object-cover" loading="lazy" />
					</figure>
					<div className="p-6 sm:p-8">
						<div className="flex items-center gap-4">
							<PixelIcon name="relic" size={44} />
							<div>
								<p className="font-pixel text-[11px] uppercase tracking-widest text-arena-text/80">Project Altar</p>
								<h3 className="font-heading text-2xl font-bold uppercase text-arena-text sm:text-3xl">Relic arenas</h3>
							</div>
						</div>
						<p className="mt-4 text-cream/90">
							Relics are the only items in the game, and you win them in a walled arena instead of buying them.
						</p>
						<ol className="mt-6 grid gap-4">
							{ARENA_STEPS.map(([title, body], i) => (
								<li key={title} className="flex gap-4">
									<span className="font-pixel text-sm text-violet-light">{String(i + 1).padStart(2, "0")}</span>
									<span>
										<span className="block font-pixel text-xs uppercase tracking-wider text-arena-text">{title}</span>
										<span className="mt-1 block text-sm text-cream/80">{body}</span>
									</span>
								</li>
							))}
						</ol>
						<p className="mt-6 border-t-2 border-arena-light/30 pt-4 text-sm text-cream/80">
							Relics grow stronger with their holder's level and stay with you when you die, but every relic you hold slows the experience you earn. Nobody snowballs for free.
						</p>
					</div>
				</Panel>

				<ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{MECHANICS.map((m) => (
						<li key={m.title}>
							<Panel className="h-full" inner="p-6">
								<PixelIcon name={m.icon} size={40} />
								<h3 className="mt-4 font-heading text-xl font-bold uppercase text-gold">{m.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
							</Panel>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

const SHOTS = [
	{ src: "img/shots/river-teamfight.webp", caption: "Teamfight in the river", alt: "Ten pixel-art heroes clashing in a river crossing between two lanes" },
	{ src: "img/shots/lane-skirmish.webp", caption: "Lane skirmish under a tower", alt: "Heroes trading spells near a blue tower while minion waves meet in the lane" },
	{ src: "img/shots/tower-push.webp", caption: "Tower push", alt: "A group of heroes pushing past a ruined tower on a dirt lane" },
	{ src: "img/shots/turret-fight.webp", caption: "Fight at the outer tower", alt: "Heroes fighting around a tower plinth in the lane, with minions approaching from the forest" },
];

const ART_POINTS = [
	["Eight directions", "Every hero is drawn facing eight ways, with idle, run, attack, cast and death animations."],
	["A cast for every skill", "Remade heroes get their own animation for each of their four skills, plus pixel-art spell effects."],
	["A painted map", "Grass, dirt lanes, the river and the jungle floor are painted in limited palettes with dithering, and the camera moves in whole pixels so nothing shimmers."],
	["Bronze and wood", "The HUD, hero select and launcher are carved wood and bronze, drawn as chunky pixel art."],
];

function Lightbox({ shot, onClose }) {
	useEffect(() => {
		if (!shot) return undefined;
		const onKey = (e) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [shot, onClose]);
	if (!shot) return null;
	return (
		<div role="dialog" aria-modal="true" aria-label={shot.caption} className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4" onClick={onClose}>
			<figure className="w-full max-w-5xl">
				<Panel>
					<img src={shot.src} alt={shot.alt} className="w-full" />
				</Panel>
				<figcaption className="mt-3 flex items-center justify-between gap-4 font-pixel text-xs uppercase tracking-wider text-cream">
					<span>{shot.caption}</span>
					<button type="button" onClick={onClose} className="text-gold hover:text-bronze-light">Close ✕</button>
				</figcaption>
			</figure>
		</div>
	);
}

function PixelArt() {
	const [open, setOpen] = useState(null);
	return (
		<section id="pixel-art" aria-labelledby="art-title" className="scroll-mt-20 border-y-[3px] border-bronze-dark bg-wood-dark/60 py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionTitle kicker="Pixel art" title="Every frame drawn to be read at a glance" id="art-title">
					Altarhold's look is inspired by the lush 32-bit console RPGs: painted backgrounds, chunky outlines and sprites that move like they mean it.
				</SectionTitle>

				<div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
					<ul className="grid content-start gap-4">
						{ART_POINTS.map(([title, body]) => (
							<li key={title}>
								<Panel tone="wood" inner="p-5">
									<h3 className="font-pixel text-sm uppercase tracking-wider text-gold">{title}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
								</Panel>
							</li>
						))}
					</ul>
					<div className="grid grid-cols-2 content-start gap-3 sm:gap-4">
						{SHOTS.map((s) => (
							<figure key={s.src} className="min-w-0">
								<button type="button" onClick={() => setOpen(s)} className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold" aria-label={`Enlarge: ${s.caption}`}>
									<Panel inner="overflow-hidden">
										<img src={s.src} alt={s.alt} width="960" height="540" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
									</Panel>
								</button>
								<figcaption className="mt-2 font-pixel text-[11px] uppercase tracking-wider text-muted">{s.caption}</figcaption>
							</figure>
						))}
					</div>
				</div>

				<Panel className="mt-10" inner="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
					<div className="flex items-end justify-center gap-1 overflow-hidden sm:gap-3">
						{ROSTER.slice(0, 10).map((h) => (
							<img key={h.id} src={`img/anim/${h.id}-idle.webp`} alt="" width="96" height="112" className="pixelated h-16 w-auto sm:h-24" loading="lazy" />
						))}
					</div>
					<a href="#heroes" className="shrink-0 font-pixel text-xs uppercase tracking-wider text-gold hover:text-bronze-light">Meet the heroes →</a>
				</Panel>
			</div>
			<Lightbox shot={open} onClose={() => setOpen(null)} />
		</section>
	);
}

// Starting attribute points from the game's hero data (data/heroes/*.tres, starting_str/agi/int).
const ROSTER = [
	{ id: "bastion_grael", name: "Bastion Grael", role: "Tank", primary: "STR", attributes: { STR: 5, AGI: 2, INT: 3 }, passive: "Stoneskin", kit: ["Shield Bash", "Bulwark", "Taunt Slam", "Fortress"] },
	{ id: "haldor_quakeborn", name: "Haldor Quakeborn", role: "Tank", primary: "STR", attributes: { STR: 5, AGI: 3, INT: 2 }, passive: "Aftershock", kit: ["Fault Line", "Stone Stride", "Seismic Grip", "Mountain's Fall"] },
	{ id: "rhea_ironfang", name: "Rhea Ironfang", role: "Fighter", primary: "STR", attributes: { STR: 5, AGI: 4, INT: 1 }, passive: "Bloodlust", kit: ["Rend", "Roar", "Ground Slam", "Primal Form"] },
	{ id: "kira_vex", name: "Kira Vex", role: "Assassin", primary: "AGI", attributes: { STR: 3, AGI: 5, INT: 2 }, passive: "Backstab", kit: ["Shadow Bind", "Smoke Veil", "Crescent Slash", "Execute"] },
	{ id: "lyra_thorn", name: "Lyra Thorn", role: "Marksman", primary: "AGI", attributes: { STR: 2, AGI: 5, INT: 3 }, passive: "Hunter's Rhythm", kit: ["Piercing Arrow", "Volley", "Snare Trap", "Hunter's Mark"] },
	{ id: "juno_galecaller", name: "Juno Galecaller", role: "Mage", primary: "AGI", attributes: { STR: 2, AGI: 5, INT: 3 }, passive: "Static Charge", kit: ["Arc Bolt", "Tailwind", "Gale Burst", "Eye of the Storm"] },
	{ id: "orin_ash", name: "Orin Ash", role: "Mage", primary: "INT", attributes: { STR: 2, AGI: 3, INT: 5 }, passive: "Burn", kit: ["Fireball", "Flame Wall", "Scorch", "Meteor"] },
	{ id: "nyra_frostweave", name: "Nyra Frostweave", role: "Mage", primary: "INT", attributes: { STR: 2, AGI: 3, INT: 5 }, passive: "Frostbite", kit: ["Ice Shard", "Rime Ring", "Cold Snap", "Absolute Zero"] },
	{ id: "maro_tidecaller", name: "Maro Tidecaller", role: "Support", primary: "INT", attributes: { STR: 3, AGI: 2, INT: 5 }, passive: "Ebb and Flow", kit: ["Tide Orb", "Bubble", "Undertow", "Tsunami"] },
	{ id: "sela_dawnsong", name: "Sela Dawnsong", role: "Support", primary: "INT", attributes: { STR: 3, AGI: 2, INT: 5 }, passive: "Morning Light", kit: ["Sunlance", "Anthem", "Dazzle", "Sanctuary"] },
];
const ATTRIBUTE_MAX = 5;
const ATTRIBUTE_COLORS = { STR: "bg-[#d0503c]", AGI: "bg-[#58be46]", INT: "bg-[#4678e6]" };
const ATTRIBUTE_NAMES = { STR: "Strength", AGI: "Agility", INT: "Intelligence" };
const MOVES = [
	["idle", "Idle"],
	["attack", "Attack"],
	["cast", "Cast"],
];

function AttributeRow({ label, value, primary }) {
	return (
		<div className="grid grid-cols-[2.75rem_minmax(0,1fr)_1rem] items-center gap-3">
			<span className={`font-pixel text-xs ${primary ? "text-gold" : "text-muted"}`}>{label}</span>
			<span className="flex gap-1" aria-hidden="true">
				{Array.from({ length: ATTRIBUTE_MAX }, (_, i) => (
					<span key={i} className={`h-3 flex-1 ${i < value ? ATTRIBUTE_COLORS[label] : "bg-ink/70"} shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]`} />
				))}
			</span>
			<span className="text-right font-pixel text-xs text-cream">{value}</span>
		</div>
	);
}

function Heroes() {
	const [selected, setSelected] = useState(ROSTER[6]);
	const [move, setMove] = useState("idle");
	const pick = (hero) => {
		setSelected(hero);
		setMove("idle");
	};
	return (
		<section id="heroes" aria-labelledby="heroes-title" className="scroll-mt-20 py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionTitle kicker="The roster" title="Ten heroes, no items to hide behind" id="heroes-title">
					Each hero has a primary attribute, a passive and four abilities. They start with a few attribute points weighted toward their primary, and every level adds more for you to spend.
				</SectionTitle>

				<div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
					<Panel tone="arena" inner="relative flex min-h-[22rem] flex-col items-center justify-end overflow-hidden bg-[radial-gradient(circle_at_50%_75%,#8c64aa55,transparent_60%)] p-6">
						<span className="absolute left-4 top-4 font-pixel text-[10px] uppercase tracking-widest text-arena-text/80">{selected.role} · {selected.primary}</span>
						<img key={`${selected.id}-${move}`} src={`img/anim/${selected.id}-${move}.webp`} alt={`${selected.name}, ${move} animation`} width="192" height="224" className="pixelated h-72 w-auto" />
						<div className="mt-4 flex gap-2" role="group" aria-label="Animation">
							{MOVES.map(([id, label]) => (
								<button
									key={id}
									type="button"
									onClick={() => setMove(id)}
									aria-pressed={move === id}
									className={`border-2 px-3 py-1 font-pixel text-[11px] uppercase tracking-wider ${move === id ? "border-gold bg-gold text-ink" : "border-arena-light/60 text-arena-text hover:border-gold"}`}
								>
									{label}
								</button>
							))}
						</div>
					</Panel>
					<Panel inner="p-6 sm:p-8">
						<h3 className="font-heading text-3xl font-bold uppercase text-gold sm:text-4xl">{selected.name}</h3>
						<p className="mt-1 font-pixel text-xs uppercase tracking-wider text-violet-light">
							{selected.role} · Primary {ATTRIBUTE_NAMES[selected.primary]}
						</p>
						<div className="mt-6">
							<p className="font-pixel text-[11px] uppercase tracking-widest text-muted">Starting attributes</p>
							<div className="mt-3 grid gap-2" aria-label={`Starting attributes: Strength ${selected.attributes.STR}, Agility ${selected.attributes.AGI}, Intelligence ${selected.attributes.INT}`}>
								{Object.entries(selected.attributes).map(([k, v]) => (
									<AttributeRow key={k} label={k} value={v} primary={k === selected.primary} />
								))}
							</div>
						</div>
						<div className="mt-6">
							<p className="font-pixel text-[11px] uppercase tracking-widest text-muted">Abilities</p>
							<ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
								<li className="flex items-center gap-3 border-2 border-bronze-dark bg-ink/40 px-3 py-2 text-sm text-cream">
									<span className="font-pixel text-xs text-violet-light">P</span> {selected.passive}
								</li>
								{selected.kit.map((a, i) => (
									<li key={a} className="flex items-center gap-3 border-2 border-bronze-dark bg-ink/40 px-3 py-2 text-sm text-cream">
										<span className="font-pixel text-xs text-gold">{"QWER"[i]}</span> {a}
									</li>
								))}
							</ul>
						</div>
					</Panel>
				</div>

				<ul className="mt-6 grid grid-cols-5 gap-2 sm:gap-3 md:grid-cols-10" aria-label="Choose a hero">
					{ROSTER.map((h) => (
						<li key={h.id}>
							<button
								type="button"
								onClick={() => pick(h)}
								aria-pressed={selected.id === h.id}
								aria-label={h.name}
								className={`notch block w-full p-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selected.id === h.id ? "bg-gold" : "bg-bronze-dark hover:bg-bronze"}`}
							>
								<span className="notch-inner flex aspect-[6/7] items-end justify-center bg-plaque">
									<img src={`img/sprites/${h.id}.webp`} alt="" width="96" height="112" className="pixelated h-full w-auto" loading="lazy" />
								</span>
							</button>
							<span className="mt-1 block truncate text-center font-pixel text-[9px] uppercase text-muted sm:text-[10px]">{h.name.split(" ")[0]}</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

const STEPS = [
	["Download", "Get the installer for Windows. No account or sign-up needed."],
	["Install", "Run AltarholdSetup.exe. It adds Altarhold to your Desktop and Start menu, and the launcher downloads and updates the game."],
	["Play", "Press Play online, pick a hero and ready up. Bots fill empty seats, so there's always a match."],
];

function Download({ download }) {
	return (
		<section id="download" aria-labelledby="download-title" className="scroll-mt-20 border-t-[3px] border-bronze-dark bg-[radial-gradient(ellipse_at_50%_0%,#462a5a,transparent_70%)] py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
					<div>
						<SectionTitle kicker="Play the alpha" title="Help us break it before anyone else does" id="download-title">
							The alpha is small and rough: bots in empty seats, unfinished heroes and frequent updates. Play online 5v5 on our server and shape the game before it opens up.
						</SectionTitle>
						<ol className="mt-8 grid gap-3">
							{STEPS.map(([title, body], i) => (
								<li key={title} className="flex gap-4">
									<span className="font-pixel text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
									<span>
										<span className="block font-pixel text-xs uppercase tracking-wider text-cream">{title}</span>
										<span className="mt-1 block text-sm text-muted">{body}</span>
									</span>
								</li>
							))}
						</ol>
					</div>
					<Panel tone="wood" inner="flex flex-col items-center gap-5 p-8 text-center">
						<img src="img/logo/altarhold-emblem.svg" alt="" width="96" height="96" className="h-24 w-24" />
						<p className="font-heading text-2xl font-bold uppercase text-gold">Altarhold alpha</p>
						<PixelButton href={download.url}>Download for Windows</PixelButton>
						<p className="max-w-sm text-xs leading-relaxed text-muted">
							Free{download.version ? ` · build ${download.version}` : ""}. Needs 64-bit Windows 10 or 11. The alpha isn't code-signed yet, so Windows may say it protected your PC: click More info, then Run anyway.
						</p>
						<a href={DOWNLOAD_PAGE} className="font-pixel text-[11px] uppercase tracking-wider text-gold hover:text-bronze-light">Install help and controls →</a>
					</Panel>
				</div>
			</div>
		</section>
	);
}

function Footer({ download }) {
	return (
		<footer className="border-t-[3px] border-bronze-dark bg-ink py-10">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="flex items-center gap-3">
					<img src="img/logo/altarhold-emblem.svg" alt="" width="32" height="32" className="h-8 w-8" />
					<p className="text-sm text-muted">
						© 2026 Ynairally. A solo indie project. Every <a href="devlog/" className="text-gold hover:text-bronze-light">devlog</a> is dated and backed by a published hash of the game's source.
					</p>
				</div>
				<ul className="flex flex-wrap gap-x-6 gap-y-2 font-pixel text-xs uppercase tracking-wider">
					<li><a href="devlog/" className="text-muted hover:text-gold">Devlog</a></li>
					<li><a href="timeline.html" className="text-muted hover:text-gold">Timeline</a></li>
					<li><a href={download.url} className="text-muted hover:text-gold">Download</a></li>
					{DISCORD_URL && <li><a href={DISCORD_URL} className="text-muted hover:text-gold">Discord</a></li>}
				</ul>
			</div>
		</footer>
	);
}

function App() {
	const download = useWindowsDownload();
	return (
		<div className="min-h-screen bg-ink font-body text-cream antialiased">
			<a href="#mechanics" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
			<Nav download={download} />
			<main>
				<Hero download={download} />
				<Mechanics />
				<PixelArt />
				<Heroes />
				<Download download={download} />
			</main>
			<Footer download={download} />
		</div>
	);
}

createRoot(document.getElementById("root")).render(<App />);
