import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { COUNTRIES } from "./countries.js";

// Altarhold home page. React + Tailwind CSS (v3), built by `npm run build` into assets/.
// Look: the game's "Bronze Reliquary" HUD palette (src/client/hud_skin.gd in the game repo).
// Fonts: Cinzel (headings, matches the logo), Silkscreen (pixel labels), Inter (body), from Google Fonts.
// Devlogs are listed on devlog/index.html, not here.

const DISCORD_URL = "https://discord.gg/JeTF9JJct";
const SOCIALS = [
	...(DISCORD_URL ? [{ name: "Discord", icon: "discord", href: DISCORD_URL }] : []),
	{ name: "YouTube", icon: "youtube", href: "https://www.youtube.com/@Altarhold" },
	{ name: "Facebook", icon: "facebook", href: "https://www.facebook.com/profile.php?id=61596326423029" },
];

// Registration makes the same account players sign in with in the game (Supabase Auth, the game's project).
// The publishable key is public by design; the database's row rules decide what it may do (see docs/accounts.md
// in the game repo). The sign-up metadata feeds the players row (username, country, age check); alpha_request
// and signup_source stay in auth.users only, for picking closed alpha testers.
const SUPABASE_URL = "https://aawqagljvcufrcclglwo.supabase.co";
const SUPABASE_KEY = "sb_publishable_U36MWIT1HASPgpKwyxWsWw_9PilPtUm";
const CONFIRMED_PAGE = "https://altarhold.com/account/confirmed.html";
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const MIN_PASSWORD = 8;
const MIN_AGE = 13;

// Whole years between a YYYY-MM-DD birthday and today, or NaN if it isn't a real date.
function ageOn(birthday, today = new Date()) {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || "");
	if (!m) return NaN;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const born = new Date(y, mo - 1, d);
	if (born.getFullYear() !== y || born.getMonth() !== mo - 1 || born.getDate() !== d) return NaN;
	let age = today.getFullYear() - y;
	if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) age -= 1;
	return age;
}

// Pixel icons: one string per row; each letter is a palette colour, "." is empty.
const ICON_COLORS = { k: "#180e12", b: "#c49652", l: "#fad68c", d: "#785028", v: "#a070e0", w: "#f0d8ff", c: "#fff0cd", r: "#d0503c", g: "#58be46", s: "#8c8c9a", y: "#ff0033", f: "#1877f2", x: "#ffffff", p: "#5865f2" };
const ICONS = {
	relic: ["....kk....", "...kwvk...", "..kwvvvk..", ".kwvvvvvk.", "kwvvvvvvvk", ".kvvvvvdk.", "..kvvvdk..", "...kvdk...", "....kk....", ".........."],
	coin: ["..kkkkkk..", ".kllllllk.", "kllbbbblrk", "klbbbbbrlk", "klbbbbrblk", "klbbbrbblk", "klbbrbbblk", "klrbbbblk.", ".kllllllk.", "..kkkkkk.."],
	feet: ["...kk.....", "..kcck....", "..kcck....", "..kcck..kk", "..kcckkkck", "..kcccccck", "..kddddddk", "...kkkkkk.", "rrrrrrrrrr", ".........."],
	wall: ["kkkkkkkkkk", "kbbbkbbbbk", "kddkkddddk", "kkkkkkkkkk", "kbbbbkbbbk", "kddddkdddk", "kkkkkkkkkk", "kbbkbbbbbk", "kddkdddddk", "kkkkkkkkkk"],
	eye: [".........", "..kkkkk..", ".kcccccck", "kcckvkcck", "kcckkkcck", ".kcccccck", "..kkkkk..", "........."],
	sword: [".......kk", "......kck", ".....kck.", "....kck..", "kk.kck...", ".kkck....", "..kk.....", ".kdkk....", "kdk..k..."],
	youtube: [".yyyyyyyy.", "yyyyyyyyyy", "yyyyxyyyyy", "yyyyxxyyyy", "yyyyxxxyyy", "yyyyxxyyyy", "yyyyxyyyyy", "yyyyyyyyyy", ".yyyyyyyy."],
	facebook: [".ffffffff.", "ffffffxxff", "fffffxxfff", "fffffxffff", "fffxxxxxff", "fffffxffff", "fffffxffff", "fffffxffff", "fffffxffff", ".ffffxfff."],
	discord: [".pp....pp.", "pppppppppp", "pppppppppp", "ppxxppxxpp", "ppxxppxxpp", "pppppppppp", "ppxppppxpp", "pppxxxxppp", ".pp....pp.", ".........."],
	cliff: ["..........", "......kkk.", ".....kgggk", "....kggggk", "...kdddddk", "kkkkdbdbdk", "kgggdddddk", "kdbdbdbdbk", "kddddddddk", "kkkkkkkkkk"],
	combo: ["....kk....", "...kllk...", "kkkkllkkkk", "kllllllllk", ".kllllllk.", "..kllllk..", ".kllkkllk.", ".klk..klk.", "kkk....kkk", ".........."],
	fountain: ["....kk....", "...kwwk...", "..kw..wk..", "....kk....", "...kvvk...", "kkkkvvkkkk", "kvvvvvvvvk", ".kbbbbbbk.", ".kddddddk.", "..kkkkkk.."],
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

// Pixel icon links to our YouTube channel and Facebook page.
function SocialLinks({ size = 24, labels = false, className = "" }) {
	return (
		<ul className={`flex items-center gap-3 ${className}`}>
			{SOCIALS.map(({ name, icon, href }) => (
				<li key={name}>
					<a href={href} target="_blank" rel="noopener" aria-label={`Altarhold on ${name}`} title={`Altarhold on ${name}`} className="flex items-center gap-2 font-pixel text-xs uppercase tracking-wider text-muted transition hover:text-gold [&>svg]:hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
						<PixelIcon name={icon} size={size} />
						{labels && <span>{name}</span>}
					</a>
				</li>
			))}
		</ul>
	);
}

function Nav() {
	const links = [
		["#teaser", "Teaser"],
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
					<SocialLinks size={22} className="hidden sm:flex" />
					<PixelButton href="#register" className="[&>span]:px-4 [&>span]:py-2 [&>span]:text-xs">Register</PixelButton>
				</div>
			</nav>
		</header>
	);
}

function Hero() {
	return (
		<section className="relative isolate overflow-hidden border-b-[3px] border-bronze-dark">
			<img src="img/shots/hero-backdrop.webp" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(24,14,18,0.55),rgba(24,14,18,0.92)_70%)]" />
			<div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink to-transparent" />
			<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
				<div>
					<img src="img/logo/altarhold-logo.svg" alt="Altarhold" width="440" height="215" className="h-auto w-64 drop-shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:w-96" />
					<p className="mt-8 font-pixel text-xs uppercase tracking-[0.2em] text-violet-light">5v5 MOBA · Pixel art · Closed alpha</p>
					<h1 className="mt-3 font-heading text-4xl font-bold uppercase leading-tight text-cream sm:text-6xl [text-wrap:balance]">
						No shop. No gold. <span className="text-gold">Hold the altar.</span>
					</h1>
					<p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
						Grow through levels and relics instead of gold, and win fights on positioning, because nobody can blink out of one.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-4">
						<PixelButton href="#register">Register for the alpha</PixelButton>
						<PixelButton href="#teaser" tone="ghost">Watch the teaser</PixelButton>
						{DISCORD_URL && <PixelButton href={DISCORD_URL} tone="ghost">Join our Discord</PixelButton>}
					</div>
					<p className="mt-4 font-pixel text-[11px] uppercase tracking-wider text-muted/80">
						Free · Windows · Closed alpha testing
					</p>
					<div className="mt-6 flex flex-wrap items-center gap-4">
						<span className="font-pixel text-[11px] uppercase tracking-wider text-violet-light">Follow</span>
						<SocialLinks size={26} labels className="gap-5" />
					</div>
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

function Teaser() {
	return (
		<section id="teaser" aria-labelledby="teaser-title" className="scroll-mt-20 pt-20 sm:pt-28">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<p className="font-pixel text-xs uppercase tracking-[0.2em] text-violet-light">Teaser</p>
				<h2 id="teaser-title" className="mt-3 font-heading text-3xl font-bold uppercase tracking-wide text-gold sm:text-5xl">See it in motion</h2>
				<Panel className="mt-8" inner="bg-ink">
					<video controls playsInline preload="none" poster="video/altarhold-home-poster-v3.webp" className="block aspect-video w-full bg-ink">
						<source src="video/altarhold-home-v3.mp4" type="video/mp4" />
						Your browser can't play this video. <a href="video/altarhold-home-v3.mp4" className="text-gold">Download the video</a>.
					</video>
				</Panel>
			</div>
		</section>
	);
}

const MECHANICS = [
	{
		icon: "coin",
		title: "No gold. No shop.",
		body: "Minions, jungle monsters and enemy heroes give experience, not gold. Every level hands you points for Strength (health, armor, regeneration), Agility (attack speed, move speed, shorter cooldowns) or Intelligence (mana, magic resist, and ability power that boosts every ability's damage, heals and shields). Points in your hero's primary attribute also hit harder with basic attacks. You build your hero, not an inventory.",
	},
	{
		icon: "feet",
		title: "No blinks, dashes or stealth",
		body: "No hero or relic can blink, dash, leap or turn invisible. You get out of a bad fight with footwork, or not at all. The only teleport is a channelled recall to base.",
	},
	{
		icon: "wall",
		title: "Solid minions",
		body: "Minions block heroes. You can slip past the edge of a wave, but a packed wave or a well-placed body still stops a chase, and some heroes raise golems that block just the same.",
	},
	{
		icon: "combo",
		title: "Team combos",
		body: "When two or more heroes take turns landing abilities on the same enemy hero, each hit after the first deals 3% more, up to 20%. Keep the chain going or it breaks after a few seconds, so a coordinated team hits harder than five solo players.",
	},
	{
		icon: "eye",
		title: "Fog of war, no wards",
		body: "You see what your team's heroes, minions and towers see, and jungle walls block sight. There are no wards to buy, so vision means being there.",
	},
	{
		icon: "cliff",
		title: "High ground",
		body: "Each base sits on a raised plateau the lanes climb by ramps. From below you can't see up onto it, and basic attacks fired uphill can miss, so pushing a base takes nerve.",
	},
	{
		icon: "sword",
		title: "Kills that count",
		body: "Hero kills pay extra experience, with more for first blood, shutdowns and multi-kills. Everyone who helped gets a share, wherever they are on the map.",
	},
	{
		icon: "paw",
		title: "A jungle for experience",
		body: "Four jungle quadrants of wolves, raptors, toads, rock golems, ember brutes and grove wardens, with crabs in the river. Camps give experience only, no buffs, and they leash back home if you drag them away.",
	},
	{
		icon: "fountain",
		title: "A fountain that bites",
		body: "Your fountain heals you, and it shoots any enemy hero who dives in, each shot harder than the last. A dive there is possible, but only for a few seconds.",
	},
];

const ARENA_STEPS = [
	["Announced", "A minute before an arena opens in the top or bottom river pit, both teams learn where it is and how many heroes each may send."],
	["Weighted", "The team holding more relics gets fewer places, so a lead is harder to stretch."],
	["Walled", "A barrier lets in only the heroes with a place, and no attack or ability crosses it. The fight inside stays inside."],
	["Captured", "Outnumber the enemy in the centre circle and it fills with your team's colour; an even count resets it. When it is full the arena shatters and your team's highest-level hero takes the relic."],
];

// The relics in the game (data/relics/*.tres): their attribute points and their stat bonus at level 1.
// The stat bonus grows with the holder's level (RelicData.level_multiplier: +5% of the level-1 bonus per
// level above 1, Rules.RELIC_SCALING_PER_LEVEL); the attribute points never change.
// Icons are the game's own (PixelRelics), rendered at 4x into img/relics/.
const RELIC_SCALING_PER_LEVEL = 0.05;
const RELIC_LEVELS = [1, 5, 10, 15, 20];
// Share of XP lost, by relics held (Rules.RELIC_XP_PENALTY).
const RELIC_XP_PENALTY = [0, 16, 36, 65];

const relicMultiplier = (level) => 1 + RELIC_SCALING_PER_LEVEL * (level - 1);
// Rounds to at most `digits` decimals and drops trailing zeros.
const trim = (n, digits) => String(Number(n.toFixed(digits)));

const RELICS = [
	{ id: "ember_heart", name: "Ember Heart", attr: "STR", base: 1.6, stat: "health regen/s", fmt: (v) => `+${trim(v, 2)}` },
	{ id: "iron_bark", name: "Iron Bark", attr: "STR", base: 20, stat: "armor", fmt: (v) => `+${trim(v, 0)}` },
	{ id: "giants_horn", name: "Giant's Horn", attr: "STR", base: 150, stat: "max health", fmt: (v) => `+${trim(v, 0)}` },
	{ id: "wolf_fang", name: "Wolf Fang", attr: "STR", base: 10, stat: "attack damage", fmt: (v) => `+${trim(v, 1)}` },
	{ id: "hawk_eye", name: "Hawk Eye", attr: "AGI", base: 10, stat: "critical chance", fmt: (v) => `+${trim(v, 1)}%` },
	{ id: "executioners_edge", name: "Executioner's Edge", attr: "AGI", base: 40, stat: "critical damage", fmt: (v) => `+${trim(v, 0)}%` },
	{ id: "gale_feather", name: "Gale Feather", attr: "AGI", base: 5, stat: "move speed", fmt: (v) => `+${trim(v, 2)}%` },
	{ id: "quicksilver_drop", name: "Quicksilver Drop", attr: "AGI", base: 12, stat: "attack speed", fmt: (v) => `+${trim(v, 1)}%` },
	{ id: "swiftsand_glass", name: "Swiftsand Glass", attr: "AGI", base: 8, stat: "shorter cooldowns", fmt: (v) => `${trim(v, 1)}%` },
	{ id: "arcane_core", name: "Arcane Core", attr: "INT", base: 8, stat: "ability power", fmt: (v) => `+${trim(v, 1)}%` },
	{ id: "warding_stone", name: "Warding Stone", attr: "INT", base: 20, stat: "magic resist", fmt: (v) => `+${trim(v, 0)}` },
	{ id: "starwell_phial", name: "Starwell Phial", attr: "INT", base: 150, stat: "max mana", fmt: (v) => `+${trim(v, 0)}` },
	{ id: "tidal_shell", name: "Tidal Shell", attr: "INT", base: 1, stat: "mana regen/s", fmt: (v) => `+${trim(v, 2)}` },
];

const relicBonus = (r, level) => r.fmt(r.base * relicMultiplier(level));
const relicSummary = (r, level = 1) => `+2 ${r.attr}, ${relicBonus(r, level)} ${r.stat}`;

// A hover (or focus, or tap) tip above its trigger, or above the nearest positioned parent when
// `anchored` is false (for small triggers near a screen edge). `children` is the trigger.
function Tip({ tip, label, className = "", anchored = true, children }) {
	return (
		<span tabIndex={0} aria-label={label} className={`group ${anchored ? "relative" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${className}`}>
			{children}
			<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 max-w-[80vw] -translate-x-1/2 border-2 border-bronze bg-ink p-3 text-left text-sm shadow-[0_6px_0_rgba(0,0,0,0.45)] group-hover:block group-focus:block">
				{tip}
			</span>
		</span>
	);
}

// Every relic's stat bonus at a spread of holder levels.
function RelicProgression() {
	return (
		<Panel className="mt-8" inner="p-6 sm:p-8">
			<p className="font-pixel text-[11px] uppercase tracking-widest text-gold">Relic progression</p>
			<h3 className="mt-1 font-heading text-2xl font-bold uppercase text-cream sm:text-3xl">A relic grows with its holder</h3>
			<p className="mt-3 max-w-3xl text-sm text-cream/80">
				Each relic gives two attribute points that never change, plus a stat bonus that grows by 5% of its starting value with every level its holder gains. At level 20 that bonus is almost double what it was at level 1. Hand a relic to a teammate and it takes on their level at once.
			</p>
			<div className="mt-5 overflow-x-auto">
				<table className="w-full min-w-[34rem] border-collapse text-left text-sm">
					<caption className="sr-only">Relic stat bonus by holder level</caption>
					<thead>
						<tr className="border-b-2 border-bronze/60 font-pixel text-[10px] uppercase tracking-wider text-cream/70">
							<th scope="col" className="py-2 pr-3 font-normal">Relic</th>
							<th scope="col" className="py-2 pr-3 font-normal">Bonus</th>
							{RELIC_LEVELS.map((lv) => (
								<th key={lv} scope="col" className="px-2 py-2 text-right font-normal">Lv {lv}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{RELICS.map((r) => (
							<tr key={r.id} className="border-b border-bronze/25">
								<th scope="row" className="py-1.5 pr-3 font-normal">
									<span className="flex items-center gap-2">
										<img src={`img/relics/${r.id}.webp`} alt="" width="160" height="160" className="pixelated h-7 w-7" loading="lazy" />
										<span className="font-bold text-cream">{r.name}</span>
									</span>
								</th>
								<td className="py-1.5 pr-3 text-cream/70">+2 {r.attr}, {r.stat}</td>
								{RELIC_LEVELS.map((lv) => (
									<td key={lv} className={`px-2 py-1.5 text-right tabular-nums ${lv === 20 ? "font-bold text-gold" : "text-cream"}`}>{relicBonus(r, lv)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="mt-3 text-xs text-cream/60">Cooldown cuts from relics and AGI together stop at half.</p>
		</Panel>
	);
}

function Mechanics() {
	return (
		<section id="mechanics" aria-labelledby="mechanics-title" className="scroll-mt-20 py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionTitle kicker="How it plays" title="A MOBA built on positioning" id="mechanics-title">
					Three lanes, a river, four jungle quadrants and five heroes a side. Everything else was rethought.
				</SectionTitle>

				<Panel tone="arena" className="mt-12" inner="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
					<figure className="relative">
						<img src="img/shots/relic-arena-capture.webp" alt="Heroes fighting inside a relic arena in the river while the blue team's colour fills the capture circle round the altar" width="1120" height="1260" className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full" loading="lazy" />
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
							Relics are the only items in the game. You don't buy them: you win them in a walled arena in the river.
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
							Relics grow stronger with their holder's level and stay with you when you die. A hero carries up to three and can hand one to a teammate standing close by. But every relic you hold cuts the experience you earn, a little for the first and a lot for the third. Nobody snowballs for free.
						</p>
						<dl className="mt-4 grid grid-cols-4 gap-1 text-center" aria-label="Experience lost by relics held">
							{RELIC_XP_PENALTY.map((cut, held) => (
								<div key={held} className="border-2 border-arena-light/30 px-1 py-2">
									<dt className="font-pixel text-[9px] uppercase tracking-wider text-arena-text/80">{held} {held === 1 ? "relic" : "relics"}</dt>
									<dd className="mt-1 font-heading text-lg font-bold text-cream">{cut === 0 ? "Full XP" : `−${cut}% XP`}</dd>
								</div>
							))}
						</dl>
						<div className="mt-5">
							<p className="font-pixel text-[11px] uppercase tracking-widest text-arena-text/80">Relics to fight for</p>
							<ul className="relative mt-3 grid max-w-md grid-cols-5 gap-1 sm:grid-cols-7" aria-label="Relics">
								{RELICS.map((r) => (
									<li key={r.id}>
										<Tip
											label={`${r.name}: ${relicSummary(r, 1)} at level 1, rising to ${relicBonus(r, 20)} ${r.stat} at level 20`}
											className="block"
											anchored={false}
											tip={
												<>
													<span className="block font-heading text-base font-bold uppercase text-gold">{r.name}</span>
													<span className="mt-1 block text-cream/80">+2 {r.attr} · {r.stat}</span>
													<span className="mt-2 grid grid-cols-5 gap-1 text-center">
														{RELIC_LEVELS.map((lv) => (
															<span key={lv} className="block border border-bronze/50 px-1 py-1">
																<span className="block font-pixel text-[9px] uppercase text-cream/60">Lv {lv}</span>
																<span className="block text-xs font-bold text-cream">{relicBonus(r, lv)}</span>
															</span>
														))}
													</span>
												</>
											}
										>
											<img src={`img/relics/${r.id}.webp`} alt="" width="160" height="160" className="pixelated w-full transition hover:brightness-125" loading="lazy" />
										</Tip>
									</li>
								))}
							</ul>
							<p className="mt-2 text-xs text-cream/60">Hover a relic to see it grow with its holder's level. More relics join as the game grows.</p>
						</div>
					</div>
				</Panel>

				<RelicProgression />

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
	{ src: "img/shots/river-teamfight.webp", caption: "Trapped at the river", alt: "Heroes caught inside a ring of golden spikes on the riverbank, while others wait in the lane below" },
	{ src: "img/shots/lane-skirmish.webp", caption: "Lane skirmish under a tower", alt: "Heroes trading spells near a blue tower while minion waves meet in the lane" },
	{ src: "img/shots/tower-push.webp", caption: "Tower push", alt: "A group of heroes pushing past a ruined tower on a dirt lane" },
	{ src: "img/shots/turret-fight.webp", caption: "Fight at the outer tower", alt: "Heroes fighting around a tower plinth in the lane, with minions approaching from the forest" },
];

const ART_POINTS = [
	["Eight directions", "Every hero is drawn facing eight ways, with idle, run, attack, cast and death animations."],
	["A cast for every skill", "Every hero is modelled in 3D and baked to pixel art, with its own animation for each of its four skills and pixel-art spell effects."],
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
						{ROSTER.filter((_, i) => i % 2 === 0).map((h) => (
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

// Generated from the game's hero data (data/heroes/*.tres and data/abilities/*.tres): starting
// attributes, and for each skill its in-game description plus rank 1 to max numbers (damage, heal,
// shield, cooldown, mana). `forms` are the skills a transformation swaps in. `frame` is the animation
// size in sprite pixels where it is not 96x112 (heroes whose long weapons need wider sheets).
const ROSTER = [
	{"id": "bastion_grael", "name": "Bastion Grael", "role": "Tank", "primary": "STR", "attributes": {"STR": 5, "AGI": 2, "INT": 3}, "kit": [{"key": "P", "name": "Stoneskin", "text": "After taking 20% of his max health within 3 s, Bastion gains a shield of 40 + 10% max health for 3 s. 12 s cooldown."}, {"key": "Q", "name": "Shield Bash", "text": "Slam the shield forward, stunning enemies in front for 1 s.", "stats": ["60–200 physical damage + 4% of max health", "Cooldown 10–8 s", "Mana 50–70"]}, {"key": "W", "name": "Bulwark", "text": "Shield Bastion and allied heroes within 6 m for 3 s.", "stats": ["Shield 60–180", "Cooldown 16–12 s", "Mana 60–80"]}, {"key": "E", "name": "Taunt Slam", "text": "Strike the ground. Enemies within 3.5 m take damage and are taunted: for 1.25 s they can only attack Bastion.", "stats": ["50–170 magic damage + 3% of max health", "Cooldown 14–10 s", "Mana 70–90"]}, {"key": "R", "name": "Fortress", "text": "Raise a stone ring where Bastion stands. For 5 s, allies inside take 30% less damage.", "stats": ["Cooldown 100–70 s", "Mana 100"]}]},
	{"id": "haldor_quakeborn", "name": "Haldor Quakeborn", "role": "Tank", "primary": "STR", "attributes": {"STR": 5, "AGI": 3, "INT": 2}, "kit": [{"key": "P", "name": "Aftershock", "text": "Every 7 s, Haldor's next basic attack on a hero or minion cracks the ground under it: enemies within 2 m take 30 + 3% of his max health as magic damage and are slowed by 20% for 1.5 s."}, {"key": "Q", "name": "Fault Line", "text": "Split the ground in a 9 m line ahead. After 0.5 s, enemies on it take damage and are slowed by 40% for 1.5 s.", "stats": ["60–180 magic damage + 4% of max health", "Cooldown 9–7 s", "Mana 55–75"]}, {"key": "W", "name": "Stone Stride", "text": "Shake off enemy slows and stuns. For 3 s Haldor is unstoppable (nothing can stun, slow, root, taunt or move him) and walks 25% faster. He still takes damage.", "stats": ["Cooldown 18–14 s", "Mana 60"]}, {"key": "E", "name": "Seismic Grip", "text": "Haldor clenches the earth. After 0.35 s, enemies within 4.5 m take damage and are dragged 2.5 m towards him.", "stats": ["50–150 magic damage + 3% of max health", "Cooldown 13–9 s", "Mana 65–85"]}, {"key": "R", "name": "Mountain's Fall", "text": "Haldor raises his fists and brings them down. After 0.9 s, enemies within 5 m take heavy damage and are knocked up for 1.25 s.", "stats": ["150–350 magic damage + 6% of max health", "Cooldown 110–80 s", "Mana 100"]}]},
	{"id": "gorran_bellwarden", "name": "Gorran Bellwarden", "role": "Tank", "primary": "STR", "attributes": {"STR": 5, "AGI": 2, "INT": 3}, "kit": [{"key": "P", "name": "Deep Toll", "text": "Toll, Chain of Vows and Great Bell Ring enemy heroes for 6 s. The 2nd Ring silences them for 1.25 s (no abilities, attacks still work); then that hero cannot be Rung for 8 s."}, {"key": "Q", "name": "Toll", "text": "Strike the bell. Enemies in a 5 m cone take damage and are slowed by 25% for 1.5 s.", "stats": ["60–200 magic damage + 4% of max health", "Cooldown 8–6 s", "Mana 50–70"]}, {"key": "W", "name": "Bell Ward", "text": "Set a small bell at a point for 5 s. Allied heroes within 4 m take 15% less damage; enemies there are slowed by 15%.", "stats": ["Cooldown 16–12 s", "Mana 60–80"]}, {"key": "E", "name": "Chain of Vows", "text": "Throw a chain 9 m. The first enemy hero hit takes damage and is chained to Gorran for 3 s: if they get more than 6 m from him they are dragged 3 m back and stunned for 0.75 s, and the chain breaks.", "stats": ["40–140 magic damage + 3% of max health", "Cooldown 14–10 s", "Mana 60–80"]}, {"key": "R", "name": "Great Bell", "text": "Drop a giant bell on a point. After 0.6 s enemies within 2 m take damage; then a 3.5 m ring stands for 3 s that enemies cannot walk across either way. Allies walk through it.", "stats": ["150–300 magic damage + 5% of max health", "Cooldown 110–80 s", "Mana 100"]}]},
	{"id": "rhea_ironfang", "name": "Rhea Ironfang", "role": "Fighter", "primary": "STR", "attributes": {"STR": 5, "AGI": 4, "INT": 1}, "kit": [{"key": "P", "name": "Bloodlust", "text": "Each enemy Rhea's abilities hit heals her for 12 + 1.5% of her max health."}, {"key": "Q", "name": "Rend", "text": "Claw in front of Rhea. Enemies hit bleed for 12 magic damage per second for 3 s, stacking up to 3 times.", "stats": ["50–170 physical damage + 70% of attack damage", "Cooldown 8–6 s", "Mana 40–60"]}, {"key": "W", "name": "Roar", "text": "Roar. Enemies within 5 m take damage and are slowed by 35% for 2 s.", "stats": ["30–110 magic damage + 2% of max health", "Cooldown 14–10 s", "Mana 60"]}, {"key": "E", "name": "Ground Slam", "text": "Slam the ground at a point. Enemies within 2.2 m take damage and are knocked up for 0.75 s.", "stats": ["70–230 physical damage + 60% of attack damage", "Cooldown 15–11 s", "Mana 70"]}, {"key": "R", "name": "Primal Form", "text": "Become the beast for 10 s: 30% harder attacks, 15% faster, 15% less damage taken, and Q, W and E become Maul, Howl and Savage Slam.", "stats": ["Cooldown 100–70 s", "Mana 100"], "forms": [{"key": "Q", "name": "Maul", "text": "Beast form. A wider, harder claw that adds two Bleed stacks.", "stats": ["80–260 physical damage + 90% of attack damage", "Cooldown 6–4 s", "Mana 30–50"]}, {"key": "W", "name": "Howl", "text": "Beast form. Enemies within 6 m take damage and are slowed by 50% for 2 s.", "stats": ["50–150 magic damage + 3% of max health", "Cooldown 12–8 s", "Mana 50"]}, {"key": "E", "name": "Savage Slam", "text": "Beast form. A bigger slam: enemies within 3 m are knocked up for 1 s.", "stats": ["100–300 physical damage + 80% of attack damage", "Cooldown 13–9 s", "Mana 60"]}]}]},
	{"id": "varga_thornhide", "name": "Varga Thornhide", "role": "Fighter", "primary": "STR", "attributes": {"STR": 5, "AGI": 3, "INT": 2}, "kit": [{"key": "P", "name": "Bramblehide", "text": "Melee basic attacks from heroes and creeps on Varga deal 15% of their damage back to the attacker as magic damage."}, {"key": "Q", "name": "Gore", "text": "Swipe her tusks in front. Enemies hit take damage and are tossed 1.5 m out to the side.", "stats": ["60–200 physical damage + 70% of attack damage", "Cooldown 8–6 s", "Mana 40–60"]}, {"key": "W", "name": "Dig In", "text": "Dig in for 2 s: Varga cannot move but still attacks and casts, takes 30% less damage, and enemies within 3 m are slowed by 25%.", "stats": ["Cooldown 16–12 s", "Mana 50"]}, {"key": "E", "name": "Trample", "text": "For 3 s Varga walks 25% faster and through minions, creeps and summons instead of being blocked. Each enemy unit she walks through takes damage once. Heroes still block her.", "stats": ["30–90 physical damage + 30% of attack damage", "Cooldown 18–14 s", "Mana 60"]}, {"key": "R", "name": "Hog Wild", "text": "For 8 s her basic attacks cleave a 2.5 m arc for 60% damage, heal her for 8% of the damage dealt (half from minions and creeps), and slows do not affect her.", "stats": ["Cooldown 100–70 s", "Mana 100"]}], "frame": [128, 144]},
	{"id": "ilka_spearwind", "name": "Ilka Spearwind", "role": "Fighter", "primary": "AGI", "attributes": {"STR": 3, "AGI": 5, "INT": 2}, "kit": [{"key": "P", "name": "Reach", "text": "Ilka's basic attacks landed from more than 2 m away deal 20% more damage and slow by 15% for 1 s."}, {"key": "Q", "name": "Impale", "text": "Thrust 5 m ahead. The first enemy hit takes damage and is rooted for 0.75 s.", "stats": ["60–200 physical damage + 80% of attack damage", "Cooldown 9–7 s", "Mana 45–65"]}, {"key": "W", "name": "Set the Pike", "text": "Brace for 2 s, standing still. The first enemy hero in front of Ilka (4 m) takes heavy damage and is stunned for 1 s, and the brace ends.", "stats": ["80–260 physical damage + 100% of attack damage", "Cooldown 18–14 s", "Mana 60"]}, {"key": "E", "name": "Sweep", "text": "Sweep the pike all round. Enemies within 3 m take damage and are knocked 2 m away.", "stats": ["40–140 physical damage + 50% of attack damage", "Cooldown 12–9 s", "Mana 50–70"]}, {"key": "R", "name": "Hundred Thrusts", "text": "Channel for 2 s, thrusting into a 6 m cone 8 times. Each hit slows by 8% more, up to 40%. Stuns, pushes and new orders end it.", "stats": ["20–40 physical damage + 20% of attack damage per hit", "Cooldown 90–60 s", "Mana 100"]}], "frame": [128, 144]},
	{"id": "sefa_twinmoon", "name": "Sefa Twinmoon", "role": "Fighter", "primary": "AGI", "attributes": {"STR": 3, "AGI": 5, "INT": 2}, "kit": [{"key": "P", "name": "Moon Rhythm", "text": "A basic attack on a different unit than Sefa's last one gives her 6% more attack speed for 4 s, stacking 5 times (30%)."}, {"key": "Q", "name": "Waxing Throw", "text": "Throw a ring-blade 8 m. It passes through enemies and flies back to wherever Sefa stands, hitting again. A unit hit both ways takes half damage on the return.", "stats": ["45–145 physical damage + 60% of attack damage", "Cooldown 7–5 s", "Mana 40–60"]}, {"key": "W", "name": "Eclipse Spin", "text": "Spin for 1.5 s, hitting enemies within 3 m three times. While spinning she takes 30% less damage from basic attacks and walks at 80% speed.", "stats": ["25–85 physical damage + 30% of attack damage per hit", "Cooldown 12–9 s", "Mana 50–70"]}, {"key": "E", "name": "Crescent Pin", "text": "Hurl a blade 9 m. The first enemy hit takes damage and is pinned for 1.5 s: it cannot move more than 2.5 m from where it was hit.", "stats": ["50–170 physical damage + 50% of attack damage", "Cooldown 14–10 s", "Mana 60"]}, {"key": "R", "name": "Full Moon", "text": "For 6 s both blades orbit Sefa, hitting each enemy within 3 m every 0.5 s. Each hit cuts that enemy's armor by 4% for 4 s, up to 20%.", "stats": ["20–40 physical damage + 20% of attack damage per hit", "Cooldown 90–60 s", "Mana 100"]}]},
	{"id": "kira_vex", "name": "Kira Vex", "role": "Assassin", "primary": "AGI", "attributes": {"STR": 3, "AGI": 5, "INT": 2}, "kit": [{"key": "P", "name": "Backstab", "text": "Kira's attacks and abilities deal 25% more damage to enemies facing away from her."}, {"key": "Q", "name": "Shadow Bind", "text": "Throw a shadow tether. The first enemy hit takes damage and is slowed by 45% for 2.5 s.", "stats": ["50–170 physical damage + 50% of attack damage", "Cooldown 10–8 s", "Mana 50–70"]}, {"key": "W", "name": "Smoke Veil", "text": "Fill an area with smoke for 4 s. Enemies inside miss their basic attacks. It hides nothing: everyone still sees everyone.", "stats": ["Cooldown 18–14 s", "Mana 70"]}, {"key": "E", "name": "Crescent Slash", "text": "Slash in a wide arc in front of Kira.", "stats": ["55–195 physical damage + 80% of attack damage", "Cooldown 7–5 s", "Mana 40–60"]}, {"key": "R", "name": "Execute", "text": "Strike the first enemy within 5 m. Damage rises with the target's missing health, up to double.", "stats": ["150–350 physical damage + 100% of attack damage", "Cooldown 80–50 s", "Mana 100"]}]},
	{"id": "corvin_ashfeather", "name": "Corvin Ashfeather", "role": "Assassin", "primary": "AGI", "attributes": {"STR": 2, "AGI": 5, "INT": 3}, "kit": [{"key": "P", "name": "Carrion Sense", "text": "Enemy heroes below 30% health within 15 m of Corvin are shown through fog to his team."}, {"key": "Q", "name": "Feather Knives", "text": "Throw three knives in a 25 degree fan, each stopping at the first enemy hit. A unit hit by all three takes 50% more from the third.", "stats": ["40–140 physical damage + 60% of attack damage", "Cooldown 7–5 s", "Mana 45–65"]}, {"key": "W", "name": "Murder of Crows", "text": "Send crows at an enemy hero for 4 s. They show it through fog to his team and peck it for magic damage every second, and Corvin walks 25% faster meanwhile.", "stats": ["Cooldown 16–12 s", "Mana 60"]}, {"key": "E", "name": "Crow's Snare", "text": "Curse an enemy hero for 3 s. If they walk 3 m from where they were cursed they take damage and are rooted for 1.5 s, and the curse ends. Standing still is safe.", "stats": ["50–170 physical damage + 50% of attack damage", "Cooldown 14–10 s", "Mana 60–80"]}, {"key": "R", "name": "Last Rites", "text": "Mark an enemy hero for 5 s. A quarter of the damage his team deals them is dealt again when the mark ends. If they die marked, Feather Knives and Murder of Crows come off cooldown.", "stats": ["Cooldown 90–60 s", "Mana 100"]}]},
	{"id": "morwen_hexthread", "name": "Morwen Hexthread", "role": "Assassin", "primary": "INT", "attributes": {"STR": 2, "AGI": 3, "INT": 5}, "kit": [{"key": "P", "name": "Stitches", "text": "Each of Morwen's ability hits sews a Stitch into an enemy hero, up to 3, for 6 s."}, {"key": "Q", "name": "Needle Spray", "text": "Fling needles in a narrow 6 m cone for magic damage.", "stats": ["60–200 magic damage", "Cooldown 7–5 s", "Mana 50–70"]}, {"key": "W", "name": "Poppet", "text": "Throw a doll to a point. It stands for 4 s with 150 + 25 per level health. The first enemy hero within 3 m is bound to it and Stitched; then half the damage Morwen's team deals the doll is dealt to that hero as magic damage. Enemies can break it.", "stats": ["Cooldown 16–12 s", "Mana 70"]}, {"key": "E", "name": "Marionette", "text": "Tug the strings on an enemy hero: for 1 s they are Charmed and walk towards Morwen, unable to attack or cast.", "stats": ["40–120 magic damage", "Cooldown 16–12 s", "Mana 70"]}, {"key": "R", "name": "Cut the Thread", "text": "Snip every Stitch on an enemy hero for heavy magic damage, plus 8% of their missing health per Stitch. Removes the Stitches.", "stats": ["150–300 magic damage", "Cooldown 80–50 s", "Mana 100"]}]},
	{"id": "lyra_thorn", "name": "Lyra Thorn", "role": "Marksman", "primary": "AGI", "attributes": {"STR": 2, "AGI": 5, "INT": 3}, "kit": [{"key": "P", "name": "Hunter's Rhythm", "text": "Every 4th basic attack is a critical hit."}, {"key": "Q", "name": "Piercing Arrow", "text": "Loose an arrow that passes through every enemy in a line. Scales with attack damage.", "stats": ["50–170 physical damage + 100% of attack damage", "Cooldown 8–6 s", "Mana 45–65"]}, {"key": "W", "name": "Volley", "text": "Fire a spread of arrows in a cone in front of Lyra.", "stats": ["40–140 physical damage + 60% of attack damage", "Cooldown 10–8 s", "Mana 60–80"]}, {"key": "E", "name": "Snare Trap", "text": "Set a visible trap that arms after 0.6 s and lasts 30 s. The first enemy to step in takes damage and is rooted for 1.5 s.", "stats": ["30–110 magic damage", "Cooldown 18–10 s", "Mana 50"]}, {"key": "R", "name": "Hunter's Mark", "text": "After a 0.6 s draw, fire a long-range shot that hits the first enemy in its path for heavy damage.", "stats": ["200–440 physical damage + 120% of attack damage", "Cooldown 80–60 s", "Mana 100"]}]},
	{"id": "fen_mirelight", "name": "Fen Mirelight", "role": "Marksman", "primary": "AGI", "attributes": {"STR": 2, "AGI": 5, "INT": 3}, "kit": [{"key": "P", "name": "Bog Venom", "text": "Fen's basic attacks add a Venom stack for 4 s, up to 4: 5 magic damage per second and 10% less healing received per stack (40% at 4)."}, {"key": "Q", "name": "Wisp Arrow", "text": "An arrow that damages the first enemy hit and adds a Venom stack. A wisp stays where it hit (or where it fell) and lights a 6 m circle through the fog for 8 s.", "stats": ["60–200 physical damage + 90% of attack damage", "Cooldown 9–7 s", "Mana 50–70"]}, {"key": "W", "name": "Swamp Gas", "text": "A 3 m cloud of marsh gas for 3 s. Enemies inside are slowed by 25% and take poison damage every 0.5 s.", "stats": ["10–34 magic damage + 10% of attack damage per hit", "Cooldown 14–10 s", "Mana 60–80"]}, {"key": "E", "name": "Lantern Toss", "text": "Toss his lantern 8 m to the first allied hero in its path: +25% attack speed and +4 m sight for 5 s. If it reaches no ally, Fen keeps it for half the bonus.", "stats": ["Cooldown 18–14 s", "Mana 50"]}, {"key": "R", "name": "Will-o'-Wisp Hunt", "text": "Release 6 wisps that seek the enemy heroes within 12 m, spread across them, at most 3 on one hero. Each wisp deals damage and adds a Venom stack.", "stats": ["50–100 magic damage + 30% of attack damage", "Cooldown 90–60 s", "Mana 100"]}]},
	{"id": "bramm_stonesling", "name": "Bramm Stonesling", "role": "Marksman", "primary": "STR", "attributes": {"STR": 5, "AGI": 2, "INT": 3}, "kit": [{"key": "P", "name": "Heavy Shot", "text": "Bramm's basic attacks on heroes, minions and creeps splash: other enemies within 1.5 m take 40% of the damage. Attacks on towers do not splash."}, {"key": "Q", "name": "Skipping Stone", "text": "Skip a stone three times along a 10 m line. Each bounce damages enemies within 1.5 m; nobody is hit twice.", "stats": ["50–170 physical damage + 70% of attack damage", "Cooldown 8–6 s", "Mana 45–65"]}, {"key": "W", "name": "Pebble Hail", "text": "After 0.8 s, gravel rains on a 2.5 m area: enemies there take damage and are slowed by 30% for 1.5 s.", "stats": ["60–180 physical damage + 50% of attack damage", "Cooldown 12–9 s", "Mana 60–80"]}, {"key": "E", "name": "Plant Feet", "text": "Plant his feet for 4 s: Bramm cannot move, but his basic attacks reach 2 m further against heroes, minions and creeps (not towers) and he has 20% more armor.", "stats": ["Cooldown 16–12 s", "Mana 40"]}, {"key": "R", "name": "Rolling Boulder", "text": "Roll a huge boulder 14 m. Minions and creeps it hits take damage and are shoved 2.5 m aside; it stops at the first enemy hero, who takes damage and is stunned for 1 s.", "stats": ["150–350 physical damage + 100% of attack damage", "Cooldown 100–70 s", "Mana 100"]}]},
	{"id": "juno_galecaller", "name": "Juno Galecaller", "role": "Mage", "primary": "AGI", "attributes": {"STR": 2, "AGI": 5, "INT": 3}, "kit": [{"key": "P", "name": "Static Charge", "text": "Every 5 s, Juno's next basic attack on a hero or minion discharges: 30 magic damage plus 30% of her attack damage, and a 25% slow for 1 s."}, {"key": "Q", "name": "Arc Bolt", "text": "Hurl a bolt of lightning that passes through every enemy in a line. Scales with attack damage.", "stats": ["55–175 magic damage + 50% of attack damage", "Cooldown 7–5 s", "Mana 45–65"]}, {"key": "W", "name": "Tailwind", "text": "The wind at her back: for 3 s Juno moves 30% faster and her basic attacks hit 20% harder.", "stats": ["Cooldown 16–12 s", "Mana 50"]}, {"key": "E", "name": "Gale Burst", "text": "A blast of wind in front of Juno damages enemies and knocks them 3 m back.", "stats": ["40–120 magic damage", "Cooldown 15–11 s", "Mana 60–80"]}, {"key": "R", "name": "Eye of the Storm", "text": "Call a storm over the target point for 4 s. Lightning strikes enemies inside every 0.5 s, damaging them and slowing them by 20%.", "stats": ["30–60 magic damage + 10% of attack damage per hit", "Cooldown 90–70 s", "Mana 100–150"]}]},
	{"id": "orin_ash", "name": "Orin Ash", "role": "Mage", "primary": "INT", "attributes": {"STR": 2, "AGI": 3, "INT": 5}, "kit": [{"key": "P", "name": "Burn", "text": "Every ability hit adds a stack of Burn: 6 magic damage per second per stack for 3 s, up to 5 stacks."}, {"key": "Q", "name": "Fireball", "text": "Hurl a fireball that hits the first enemy in its path.", "stats": ["70–230 magic damage", "Cooldown 7–5 s", "Mana 50–70"]}, {"key": "W", "name": "Flame Wall", "text": "Raise a wall of fire across the target point. Enemies inside burn and are slowed by 30%.", "stats": ["12–36 magic damage per hit", "Cooldown 16–12 s", "Mana 70–90"]}, {"key": "E", "name": "Scorch", "text": "Breathe flame in a cone in front of Orin.", "stats": ["60–200 magic damage", "Cooldown 9–7 s", "Mana 60–80"]}, {"key": "R", "name": "Meteor", "text": "Call down a meteor. After 1.2 s it smashes the target area.", "stats": ["250–500 magic damage", "Cooldown 90–60 s", "Mana 100–150"]}]},
	{"id": "nyra_frostweave", "name": "Nyra Frostweave", "role": "Mage", "primary": "INT", "attributes": {"STR": 2, "AGI": 3, "INT": 5}, "kit": [{"key": "P", "name": "Frostbite", "text": "Each enemy Nyra's abilities hit gains a stack of Chill (15% slow for 3 s). The third stack freezes it solid: stunned for 1.25 s."}, {"key": "Q", "name": "Ice Shard", "text": "Fire a shard of ice that damages the first enemy hit.", "stats": ["70–210 magic damage", "Cooldown 6.5–4.5 s", "Mana 50–70"]}, {"key": "W", "name": "Rime Ring", "text": "Frost gathers at the target point for 0.8 s, then bursts: enemies inside take damage and are rooted for 1 s.", "stats": ["60–180 magic damage", "Cooldown 14–10 s", "Mana 70–90"]}, {"key": "E", "name": "Cold Snap", "text": "Breathe a cone of cold. Enemies in front take damage and are slowed by 35% for 2 s.", "stats": ["50–150 magic damage", "Cooldown 10–8 s", "Mana 60–80"]}, {"key": "R", "name": "Absolute Zero", "text": "After 1.2 s, the air at the target point freezes. Enemies inside take heavy damage and gain two extra Chill stacks, so Frostbite freezes them.", "stats": ["200–400 magic damage", "Cooldown 100–70 s", "Mana 100–150"]}]},
	{"id": "odalys_kilnwright", "name": "Odalys Kilnwright", "role": "Mage", "primary": "INT", "attributes": {"STR": 2, "AGI": 3, "INT": 5}, "kit": [{"key": "P", "name": "Fired Clay", "text": "Her golems are solid and block heroes the way minions do. When a golem is destroyed or burst, it cracks for 40 + 4 per level magic damage within 2 m."}, {"key": "Q", "name": "Clay Shot", "text": "Throw a lump of hot clay 10 m. It passes through her own golems, damages the first enemy hit and slows it by 20% for 1.5 s.", "stats": ["65–205 magic damage", "Cooldown 7–5 s", "Mana 50–70"]}, {"key": "W", "name": "Shape Golem", "text": "Raise a golem at a point for 6 s, up to 2 at once (a 3rd replaces the oldest). It does not move, taunts enemy minions and creeps within 4 m, and slaps enemies within 1.5 m every second.", "stats": ["Cooldown 10–7 s", "Mana 60"]}, {"key": "E", "name": "Kiln Blast", "text": "Every golem of hers within 15 m bursts. Enemies within 2.5 m of a golem take magic damage and are knocked 2 m away from it; an enemy caught by two bursts takes half from the second.", "stats": ["60–200 magic damage", "Cooldown 12–8 s", "Mana 60–80"]}, {"key": "R", "name": "Colossus", "text": "Raise one huge golem for 10 s. It walks where Odalys moves or attack-moves, is solid, and slams every 2 s, damaging enemies within 2.5 m and slowing them by 20% for 1 s. Kiln Blast does not burst it.", "stats": ["Cooldown 110–80 s", "Mana 100–150"]}]},
	{"id": "maro_tidecaller", "name": "Maro Tidecaller", "role": "Support", "primary": "INT", "attributes": {"STR": 3, "AGI": 2, "INT": 5}, "kit": [{"key": "P", "name": "Ebb and Flow", "text": "Every heal Maro casts gives him 25% of the health restored as mana."}, {"key": "Q", "name": "Tide Orb", "text": "Throw an orb of water. It heals the first allied hero it reaches, or damages the first enemy.", "stats": ["60–200 magic damage", "Heals 50–150", "Cooldown 8–6 s", "Mana 60–80"]}, {"key": "W", "name": "Bubble", "text": "Wrap allied heroes at the target point (Maro too) in a bubble: a 2.5 s shield, and enemy stuns, slows and burns are washed off.", "stats": ["Shield 60–180", "Cooldown 15–11 s", "Mana 70–90"]}, {"key": "E", "name": "Undertow", "text": "Cast a current that drags the first enemy hit 4 m towards Maro.", "stats": ["50–170 magic damage", "Cooldown 16–12 s", "Mana 70"]}, {"key": "R", "name": "Tsunami", "text": "Send a 4 m wide wave 10 m forward. Enemies hit take damage, are knocked back 4 m and slowed by 40% for 2 s.", "stats": ["150–300 magic damage", "Cooldown 110–80 s", "Mana 120"]}]},
	{"id": "sela_dawnsong", "name": "Sela Dawnsong", "role": "Support", "primary": "INT", "attributes": {"STR": 3, "AGI": 2, "INT": 5}, "kit": [{"key": "P", "name": "Morning Light", "text": "Whenever Sela heals someone, she moves 20% faster for 1.5 s."}, {"key": "Q", "name": "Sunlance", "text": "A spear of light lances ahead. Enemies on it take damage; allied heroes on it (not Sela) are healed.", "stats": ["60–180 magic damage", "Heals 40–120", "Cooldown 8–6 s", "Mana 60–80"]}, {"key": "W", "name": "Anthem", "text": "Sing out. Allied heroes within 6 m (Sela too) are healed and move 30% faster for 2 s.", "stats": ["Heals 30–90", "Cooldown 16–12 s", "Mana 70–90"]}, {"key": "E", "name": "Dazzle", "text": "A flash of sunlight at the target point. Enemies inside take damage and are blinded for 1.5 s: their basic attacks miss.", "stats": ["40–120 magic damage", "Cooldown 14–10 s", "Mana 60–80"]}, {"key": "R", "name": "Sanctuary", "text": "Bless the ground at the target point for 4 s. Allied heroes inside are healed every 0.5 s and take 25% less damage.", "stats": ["Heals 20–40 per pulse", "Cooldown 120–80 s", "Mana 100–150"]}]},
	{"id": "tobren_anvilheart", "name": "Tobren Anvilheart", "role": "Support", "primary": "STR", "attributes": {"STR": 5, "AGI": 2, "INT": 3}, "kit": [{"key": "P", "name": "Bodyguard", "text": "Allied heroes within 4 m of Tobren (not Tobren himself) take 6% less damage."}, {"key": "Q", "name": "Temper", "text": "Strike the first hero in a 7 m line. An ally gets 20% more armor and 15% more attack damage for 4 s; an enemy takes damage and is slowed by 30% for 1.5 s.", "stats": ["50–170 physical damage + 4% of max health", "Cooldown 9–7 s", "Mana 50–70"]}, {"key": "W", "name": "Anvil Drop", "text": "After 0.6 s an anvil lands on a 1.5 m area. Enemies under it take damage and are stunned for 1 s.", "stats": ["70–230 physical damage + 4% of max health", "Cooldown 14–10 s", "Mana 70"]}, {"key": "E", "name": "Hot Rivet", "text": "Rivet himself to the first allied hero in a 7 m line for 4 s (it breaks beyond 10 m). Tobren takes 30% of the damage they take in their place, through his own armor and magic resist.", "stats": ["Cooldown 18–14 s", "Mana 60"]}, {"key": "R", "name": "Forge Oath", "text": "For 6 s, allied heroes within 7 m (Tobren too) deal 15% more damage, and their basic attacks set the target burning.", "stats": ["Cooldown 100–70 s", "Mana 100"]}]},
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

function SkillTip({ skill }) {
	return (
		<>
			<span className="block font-pixel text-[10px] uppercase tracking-widest text-violet-light">{skill.key === "P" ? "Passive" : `${skill.key} ability`}</span>
			<span className="block font-heading text-base font-bold uppercase text-gold">{skill.name}</span>
			<span className="mt-1 block leading-snug text-cream/90">{skill.text}</span>
			{skill.stats && (
				<span className="mt-2 block border-t border-bronze-dark pt-2 text-xs text-muted">
					{skill.stats.map((line) => (
						<span key={line} className="block">{line}</span>
					))}
				</span>
			)}
			{skill.forms && (
				<span className="mt-2 block border-t border-bronze-dark pt-2 text-xs text-cream/80">
					{skill.forms.map((f) => (
						<span key={f.name} className="mt-1 block">
							<span className="font-pixel text-gold">{f.key}</span> <span className="font-bold">{f.name}:</span> {f.text}
						</span>
					))}
				</span>
			)}
		</>
	);
}

function Heroes() {
	const [selected, setSelected] = useState(ROSTER.find((h) => h.id === "orin_ash"));
	const [move, setMove] = useState("idle");
	// Every sprite pixel is the same size on screen, so taller frames are drawn taller.
	const [frameW, frameH] = selected.frame ?? [96, 112];
	const pick = (hero) => {
		setSelected(hero);
		setMove("idle");
	};
	return (
		<section id="heroes" aria-labelledby="heroes-title" className="scroll-mt-20 py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<SectionTitle kicker="The roster" title="Twenty heroes, no items to hide behind" id="heroes-title">
					Each hero has a primary attribute, a passive and four abilities. They start with a few attribute points weighted toward their primary, and every level adds more for you to spend.
				</SectionTitle>

				<div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
					<Panel tone="arena" inner="relative flex min-h-[30rem] flex-col items-center justify-end overflow-hidden bg-[radial-gradient(circle_at_50%_75%,#8c64aa55,transparent_60%)] p-6">
						<span className="absolute left-4 top-4 font-pixel text-[10px] uppercase tracking-widest text-arena-text/80">{selected.role} · {selected.primary}</span>
						<img key={`${selected.id}-${move}`} src={`img/anim/${selected.id}-${move}.webp`} alt={`${selected.name}, ${move} animation`} width={frameW * 2} height={frameH * 2} style={{ height: `${(18 * frameH) / 112}rem` }} className="pixelated w-auto" />
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
								{selected.kit.map((a) => (
									<li key={a.key}>
										<Tip label={`${a.key === "P" ? "Passive" : a.key}: ${a.name}. ${a.text}`} className="block" tip={<SkillTip skill={a} />}>
											<span className="flex items-center gap-3 border-2 border-bronze-dark bg-ink/40 px-3 py-2 text-sm text-cream transition hover:border-gold">
												<span className={`font-pixel text-xs ${a.key === "P" ? "text-violet-light" : "text-gold"}`}>{a.key}</span> {a.name}
												<span className="ml-auto font-pixel text-[10px] text-muted" aria-hidden="true">?</span>
											</span>
										</Tip>
									</li>
								))}
							</ul>
							<p className="mt-2 text-xs text-muted">Hover or tap a skill for what it does. Numbers run from rank 1 to max rank.</p>
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

// The country to preselect, from the browser's language (en-SG -> SG), if it is in the list.
function guessCountry() {
	const languages = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language];
	for (const tag of languages) {
		const region = (tag || "").split("-")[1]?.toUpperCase();
		if (region && COUNTRIES.some(([code]) => code === region)) return region;
	}
	return "";
}

async function supabase(path, body) {
	const response = await fetch(`${SUPABASE_URL}${path}`, {
		method: "POST",
		headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await response.json().catch(() => null);
	return { ok: response.ok, status: response.status, data };
}

// Same checks as the game's sign-up form (AccountClient.sign_up_problem).
function formProblem(form) {
	if (!form.email.includes("@")) return "Enter your email address.";
	if (form.password.length < MIN_PASSWORD) return `Use a password of at least ${MIN_PASSWORD} characters.`;
	if (!USERNAME_RE.test(form.username.trim())) return "Pick a username of 3 to 16 letters, digits or _.";
	if (!form.country) return "Pick your country.";
	const age = ageOn(form.birthday);
	if (Number.isNaN(age) || age > 120) return "Enter your birthday.";
	if (age < 0) return "Your birthday can't be in the future.";
	if (age < MIN_AGE) return `You must be ${MIN_AGE} or older to make an account.`;
	return "";
}

function friendlyError(answer) {
	const text = `${answer.data?.msg ?? answer.data?.message ?? answer.data?.error_description ?? ""}`.toLowerCase();
	if (text.includes("database error")) return "That username is taken.";
	if (text.includes("already registered") || text.includes("already been registered")) return "That email already has an account. Sign in from the game, or use another email.";
	if (text.includes("password")) return answer.data?.msg ?? "That password isn't allowed. Try a longer one.";
	const code = `${answer.data?.error_code ?? ""}`;
	if (text.includes("not authorized")) return "We can't send confirmation emails to that address yet. Please try again later.";
	if (text.includes("after") && text.includes("seconds")) return "Please wait a minute before trying again with this email.";
	if (code === "over_email_send_rate_limit" || text.includes("email rate limit")) return "We can't send confirmation emails right now because too many went out in the last hour. Please try again later.";
	if (code === "over_request_rate_limit" || answer.status === 429) return "Too many tries from your connection. Wait a few minutes and try again.";
	return "Something went wrong. Try again in a minute.";
}

const FIELD = "w-full border-2 border-bronze-dark bg-ink px-3 py-2 text-cream placeholder:text-muted/50 focus:border-gold focus:outline-none";
const LABEL = "block font-pixel text-[11px] uppercase tracking-wider text-muted";

function RegisterForm() {
	const [form, setForm] = useState({ email: "", password: "", username: "", country: guessCountry(), birthday: "", alpha: true });
	const [state, setState] = useState({ status: "idle", message: "" });
	const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

	const submit = async (e) => {
		e.preventDefault();
		const problem = formProblem(form);
		if (problem) return setState({ status: "error", message: problem });
		setState({ status: "sending", message: "" });
		try {
			const username = form.username.trim();
			const free = await supabase("/rest/v1/rpc/username_available", { name: username });
			if (free.ok && free.data === false) return setState({ status: "error", message: "That username is taken." });
			const answer = await supabase(`/auth/v1/signup?redirect_to=${encodeURIComponent(CONFIRMED_PAGE)}`, {
				email: form.email.trim(),
				password: form.password,
				data: { display_name: username, username, country: form.country, age_confirmed: true, birthday: form.birthday, alpha_request: form.alpha, signup_source: "website" },
			});
			if (!answer.ok) return setState({ status: "error", message: friendlyError(answer) });
			setState({ status: "done", message: form.email.trim() });
		} catch {
			setState({ status: "error", message: "Couldn't reach the account server. Check your connection and try again." });
		}
	};

	if (state.status === "done") {
		return (
			<div className="flex flex-col items-center gap-4 p-8 text-center" role="status">
				<img src="img/anim/orin_ash-cast.webp" alt="" width="192" height="224" className="pixelated h-40 w-auto" />
				<p className="font-heading text-2xl font-bold uppercase text-gold">Check your email</p>
				<p className="max-w-sm text-sm text-cream/90">
					We sent a link to <strong className="text-cream">{state.message}</strong>. Open it to confirm your account.
					{form.alpha ? " You're on the closed alpha list, and we'll email you when your invite is ready." : ""}
				</p>
				<p className="max-w-sm text-xs text-muted">The same account signs you in to the game, keeps your match history and earns your rank.</p>
			</div>
		);
	}

	return (
		<form onSubmit={submit} noValidate className="grid gap-4 p-6 sm:p-8">
			<p className="font-heading text-2xl font-bold uppercase text-gold">Create your account</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="sm:col-span-2">
					<span className={LABEL}>Email</span>
					<input type="email" autoComplete="email" required value={form.email} onChange={set("email")} className={`${FIELD} mt-1`} />
				</label>
				<label>
					<span className={LABEL}>Username</span>
					<input type="text" autoComplete="username" required minLength={3} maxLength={16} pattern="[A-Za-z0-9_]{3,16}" value={form.username} onChange={set("username")} className={`${FIELD} mt-1`} aria-describedby="username-hint" />
					<span id="username-hint" className="mt-1 block text-xs text-muted/80">3-16 letters, digits or _. You can't change it later.</span>
				</label>
				<label>
					<span className={LABEL}>Password</span>
					<input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={form.password} onChange={set("password")} className={`${FIELD} mt-1`} aria-describedby="password-hint" />
					<span id="password-hint" className="mt-1 block text-xs text-muted/80">At least {MIN_PASSWORD} characters.</span>
				</label>
				<label>
					<span className={LABEL}>Birthday</span>
					<input type="date" autoComplete="bday" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.birthday} onChange={set("birthday")} className={`${FIELD} mt-1 [color-scheme:dark]`} aria-describedby="birthday-hint" />
					<span id="birthday-hint" className="mt-1 block text-xs text-muted/80">You must be {MIN_AGE} or older. Kept private.</span>
				</label>
				<label>
					<span className={LABEL}>Country</span>
					<select required value={form.country} onChange={set("country")} className={`${FIELD} mt-1`}>
						<option value="">Pick your country</option>
						{COUNTRIES.map(([code, name]) => (
							<option key={code} value={code}>{name}</option>
						))}
					</select>
				</label>
			</div>
			<label className="flex items-start gap-3 text-sm text-cream/90">
				<input type="checkbox" checked={form.alpha} onChange={set("alpha")} className="mt-1 h-4 w-4 accent-[#ffdc78]" />
				<span>Sign me up for the closed alpha. I play on a Windows PC and I'm happy to report bugs.</span>
			</label>
			{state.status === "error" && (
				<p role="alert" className="border-2 border-[#d0503c] bg-[#d0503c]/15 px-3 py-2 text-sm text-cream">{state.message}</p>
			)}
			<button type="submit" disabled={state.status === "sending"} className="notch mt-2 justify-self-start bg-ink p-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60">
				<span className="notch-inner block bg-gold px-6 py-3 font-pixel text-sm uppercase tracking-wider text-ink shadow-[inset_0_-4px_0_rgba(0,0,0,0.3),inset_0_3px_0_rgba(255,255,255,0.35)] hover:bg-bronze-light">
					{state.status === "sending" ? "Creating account…" : "Create account"}
				</span>
			</button>
			<p className="text-xs text-muted">We only use your email to sign you in and to send your alpha invite. Your birthday stays private. Your username and country are public on leaderboards. See our <a href="privacy.html" className="text-gold hover:text-bronze-light">privacy policy</a>.</p>
		</form>
	);
}

const STEPS = [
	["Register", "Create your Altarhold account here. It's the same account you sign in with in the game."],
	["Confirm", "Open the link we email you to confirm your address."],
	["Get your invite", "Closed alpha testers are picked in waves. We'll email you the download when it's your turn."],
];

function Register() {
	return (
		<section id="register" aria-labelledby="register-title" className="scroll-mt-20 border-t-[3px] border-bronze-dark bg-[radial-gradient(ellipse_at_50%_0%,#462a5a,transparent_70%)] py-20 sm:py-28">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
					<div>
						<SectionTitle kicker="Closed alpha" title="Register to play" id="register-title">
							The alpha is small and rough: unfinished heroes, rough edges and frequent updates. Register an account to join the closed alpha, play online 5v5 on our server and shape the game before it opens up.
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
					<Panel tone="wood">
						<RegisterForm />
					</Panel>
				</div>
			</div>
		</section>
	);
}

function Footer() {
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
					<li><a href="#register" className="text-muted hover:text-gold">Register</a></li>
					<li><a href="privacy.html" className="text-muted hover:text-gold">Privacy</a></li>
					<li><a href="ai.html" className="text-muted hover:text-gold">AI use</a></li>
				</ul>
				<SocialLinks size={28} />
			</div>
		</footer>
	);
}

function App() {
	return (
		<div className="min-h-screen bg-ink font-body text-cream antialiased">
			<a href="#mechanics" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
			<Nav />
			<main>
				<Hero />
				<Teaser />
				<Mechanics />
				<PixelArt />
				<Heroes />
				<Register />
			</main>
			<Footer />
		</div>
	);
}

createRoot(document.getElementById("root")).render(<App />);
