import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

// Altarhold landing page. React + Tailwind CSS (v3), built by `npm run build` into assets/.
// Fonts: Oswald (display), Inter (body), JetBrains Mono (stats) from Google Fonts.

const DISCORD_URL = null; // Set to the invite link once the server exists; until then the button shows "coming soon".
const DEVLOG_BASE = "devlog/";
// Alpha download: no sign-up. The Windows button links the newest launcher zip published on the site repo's
// releases (or the newest game zip until a launcher is published); alpha/download.html has the same button.
const RELEASES_REPO = "icyrequiem/project-altar";
const FALLBACK_DOWNLOAD = `https://github.com/${RELEASES_REPO}/releases/download/v0.2.0-alpha/RelicProtocol-0.2.0-alpha-windows.zip`;

const PILLARS = [
	{
		tag: "01 / MOBILITY",
		title: "Zero Mobility",
		body: "Positioning is absolute. No blinks, no leaps. Fight your way out.",
		glyph: "M4 12h16M12 4v16",
	},
	{
		tag: "02 / GEOMETRY",
		title: "Physical Geometry",
		body: "Minions are solid walls. Trap your enemies in raw 5v5 warfare.",
		glyph: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
	},
	{
		tag: "03 / THE ALTAR",
		title: "The Altar Cage",
		body: "Walled, transparent arenas that limit snowballing leaders and block abilities from outside.",
		glyph: "M12 3l9 9-9 9-9-9z",
	},
];

const DEVLOGS = [
	{
		n: "008",
		date: "2026-10-31",
		title: "Kills, a bronze HUD and new heroes",
		summary: "Rewarding hero kills, a carved bronze HUD, a new hero select, starting attributes, and three more redrawn heroes.",
		href: DEVLOG_BASE + "008-kills-a-bronze-hud-and-new-heroes.html",
	},
	{
		n: "007",
		date: "2026-10-31",
		title: "Going pixel art",
		summary: "A new 32-bit-style look: sprite heroes in eight directions and a painted pixel map.",
		href: DEVLOG_BASE + "007-going-pixel-art.html",
	},
	{
		n: "006",
		date: "2026-10-31",
		title: "Sound, feel and the first alpha build",
		summary: "Sound for every hit, springier hero motion, a cheaper 5v5 server, and the first tester build.",
		href: DEVLOG_BASE + "006-sound-feel-and-the-first-alpha-build.html",
	},
	{
		n: "005",
		date: "2026-10-29",
		title: "The stickman look",
		summary: "All ten heroes as stickmen, a cartoon forest map, and an effect for every attack and skill.",
		href: DEVLOG_BASE + "005-the-stickman-look.html",
	},
	{
		n: "004",
		date: "2026-10-24",
		title: "First heroes in full art",
		summary: "Orin Ash and Kira Vex get real models, animations and ability effects.",
		href: DEVLOG_BASE + "004-first-heroes-in-full-art.html",
	},
	{
		n: "003",
		date: "2026-10-24",
		title: "Online play and relic arenas",
		summary: "Dedicated servers, walled relic arenas in the jungle, ten heroes, a real map, and the first hero model.",
		href: DEVLOG_BASE + "003-online-play-and-relic-arenas.html",
	},
	{
		n: "002",
		date: "2026-10-23",
		title: "Six heroes and fog of war",
		summary: "Hero select, five new heroes, and fog of war without wards.",
		href: DEVLOG_BASE + "002-six-heroes-and-fog-of-war.html",
	},
	{
		n: "001",
		date: "2026-10-22",
		title: "A MOBA with no shop",
		summary: "The idea behind the game, its two hard rules, and the first playable prototype.",
		href: DEVLOG_BASE + "001-a-moba-with-no-shop.html",
	},
];

// attributes: the hero's starting STR/AGI/INT points (primary is the largest); players add more on level-up.
// Leave an attribute as null to show the slot without a number.
// quote: a short line in the hero's own voice; null hides it.
// portrait: concept art (or an in-game render) with a transparent background; null shows the placeholder.
const SPOTLIGHT = [
	{
		name: "Orin Ash",
		role: "Mage",
		primary: "INT",
		attributes: { STR: 2, AGI: 3, INT: 5 },
		kit: ["Fireball", "Flame Wall", "Scorch", "Meteor"],
		quote: null,
		portrait: "img/orin_ash_concept.webp",
		accent: "from-orange-500/25",
	},
	{
		name: "Kira Vex",
		role: "Assassin",
		primary: "AGI",
		attributes: { STR: 3, AGI: 5, INT: 2 },
		kit: ["Shadow Bind", "Smoke Veil", "Crescent Slash", "Execute"],
		quote: null,
		portrait: "img/kira_vex_concept.webp",
		accent: "from-fuchsia-500/25",
	},
];

function GlassButton({ href, children, tone = "glass" }) {
	const tones = {
		glass: "border-cyan-300/40 bg-white/5 text-cyan-50 hover:bg-cyan-300/10 hover:border-cyan-200/70",
		crimson: "border-rose-400/60 bg-rose-600/25 text-rose-50 hover:bg-rose-600/40 hover:border-rose-300",
	};
	return (
		<a
			href={href}
			className={`inline-flex items-center gap-3 border px-6 py-3 font-display text-sm uppercase tracking-[0.2em] backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${tones[tone]}`}
		>
			{children}
			<span aria-hidden="true">→</span>
		</a>
	);
}

function Glass({ className = "", children }) {
	return (
		<div className={`relative border border-cyan-200/20 bg-slate-900/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}>
			{children}
		</div>
	);
}

function Hero() {
	return (
		<section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
			<img src="img/logo/altarhold-logo.svg" alt="" aria-hidden="true" width="420" height="190" className="mb-10 w-64 max-w-full drop-shadow-[0_0_40px_rgba(199,156,255,0.25)] sm:w-96" />
			<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">5v5 · Godot · In development</p>
			<h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl [text-wrap:balance]">
				No dashes.<br />No shops.<br />
				<span className="text-cyan-300">Pure spatial brutality.</span>
			</h1>
			<p className="mt-8 max-w-2xl text-lg text-slate-300 sm:text-xl">
				Enter Altarhold: a 5v5 tactical arena where minion geometry and spatial control dictate survival.
			</p>
			<div className="mt-10 flex flex-wrap gap-4">
				<GlassButton href="#alpha">Download for Windows</GlassButton>
				<GlassButton href="#heroes">View Heroes</GlassButton>
				{DISCORD_URL ? (
					<GlassButton href={DISCORD_URL} tone="crimson">Join the Discord</GlassButton>
				) : (
					<span className="inline-flex items-center gap-3 border border-rose-400/40 bg-rose-600/10 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-rose-100/70 backdrop-blur-md">
						Discord · coming soon
					</span>
				)}
			</div>
		</section>
	);
}

const ALPHA_STEPS = [
	{ n: "01", title: "Download", body: "Get the Windows launcher. No account or sign-up needed." },
	{ n: "02", title: "Install", body: "Unzip it somewhere you can write to, like your Desktop, and run AltarholdLauncher.exe. It installs and updates the game." },
	{ n: "03", title: "Play and report", body: "Press Play, fight bots or other players on our server, then tell us what broke." },
];

const DOWNLOAD_PAGE = "alpha/download.html";

// The newest published Windows launcher zip, else the newest game zip, from the site repo's releases.
function useWindowsDownload() {
	const [download, setDownload] = useState({ url: FALLBACK_DOWNLOAD, launcher: false });
	useEffect(() => {
		const find = (releases, prefix) => {
			for (const release of releases) {
				if (release.draft || !/^v\d/.test(release.tag_name)) continue;
				const asset = (release.assets || []).find((a) => a.name.startsWith(prefix) && a.name.endsWith("-windows.zip") && /\d/.test(a.name.charAt(prefix.length)));
				if (asset) return asset.browser_download_url;
			}
			return null;
		};
		fetch(`https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=20`)
			.then((response) => (response.ok ? response.json() : []))
			.then((releases) => {
				if (!Array.isArray(releases)) return;
				const launcher = find(releases, "AltarholdLauncher-");
				const game = find(releases, "Altarhold-") ?? find(releases, "RelicProtocol-");
				if (launcher || game) setDownload({ url: launcher ?? game, launcher: Boolean(launcher) });
			})
			.catch(() => {});
	}, []);
	return download;
}

function AlphaTest() {
	const download = useWindowsDownload();
	return (
		<section id="alpha" aria-labelledby="alpha-title" className="py-16 scroll-mt-8">
			<div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
				<h2 id="alpha-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">Play the alpha</h2>
				<span className="font-mono text-xs uppercase tracking-widest text-cyan-300/80">Windows · Free</span>
			</div>
			<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<div>
					<p className="font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl [text-wrap:balance]">
						Help us break it before anyone else does.
					</p>
					<p className="mt-4 text-slate-300">
						The alpha is small and rough: work-in-progress art, bots in empty seats and frequent updates. Download it, play
						online 5v5 matches on our server and shape the game before it opens up.
					</p>
					<ol className="mt-8 grid gap-3">
						{ALPHA_STEPS.map((step) => (
							<li key={step.n}>
								<Glass className="flex gap-4 p-4">
									<span className="font-mono text-sm text-cyan-300">{step.n}</span>
									<span>
										<span className="block font-display text-sm uppercase tracking-[0.2em] text-white">{step.title}</span>
										<span className="mt-1 block text-sm text-slate-400">{step.body}</span>
									</span>
								</Glass>
							</li>
						))}
					</ol>
				</div>
				<Glass className="flex min-h-[22rem] flex-col items-center justify-center gap-5 p-8 text-center">
					<span className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">Alpha build</span>
					<span className="font-display text-3xl font-bold uppercase text-white sm:text-4xl">{download.launcher ? "Altarhold Launcher" : "Altarhold"}</span>
					<a
						href={download.url}
						className="inline-flex items-center gap-3 border border-cyan-300/70 bg-cyan-300/15 px-8 py-4 font-display text-base uppercase tracking-[0.2em] text-cyan-50 transition hover:bg-cyan-300/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
					>
						Download for Windows
					</a>
					<p className="max-w-sm font-mono text-xs leading-relaxed text-slate-500">
						Needs 64-bit Windows 10 or 11 and a graphics card from the last ten years. The alpha is not code-signed yet, so
						Windows may say it protected your PC: click More info, then Run anyway.
					</p>
					<a href={DOWNLOAD_PAGE} className="font-mono text-xs text-cyan-300 hover:text-cyan-200">Install steps and controls</a>
				</Glass>
			</div>
		</section>
	);
}

function Pillars() {
	return (
		<section aria-labelledby="pillars-title" className="py-16">
			<h2 id="pillars-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">Core pillars</h2>
			<div className="mt-8 grid gap-6 md:grid-cols-3">
				{PILLARS.map((p) => (
					<Glass key={p.title} className="p-6">
						<div className="flex items-center justify-between">
							<span className="font-mono text-xs text-cyan-300/70">{p.tag}</span>
							<svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
								<path d={p.glyph} />
							</svg>
						</div>
						<h3 className="mt-6 font-display text-2xl font-bold uppercase text-white">{p.title}</h3>
						<p className="mt-3 text-slate-300">{p.body}</p>
					</Glass>
				))}
			</div>
		</section>
	);
}

const SHOTS = [
	{ src: "img/pixel-teamfight.webp", caption: "Teamfight", alt: "Pixel-art heroes clashing in a lane by the river, with golden spell effects" },
	{ src: "img/pixel-tower.webp", caption: "Tower push", alt: "Heroes and minions fighting around a blue stone tower on a dirt lane" },
	{ src: "img/pixel-relic-arena.webp", caption: "Relic arena", alt: "A relic arena on a stone dais in the river, ringed by a purple barrier" },
];

function InGame() {
	return (
		<section aria-labelledby="ingame-title" className="py-16">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<h2 id="ingame-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">In the game today</h2>
				<span className="font-mono text-xs text-slate-500">Pre-release build</span>
			</div>
			<Glass className="mt-8 p-4 sm:p-6">
				<img src="img/pixel-roster.webp" alt="The ten heroes as pixel-art sprites" className="w-full max-w-full [image-rendering:pixelated]" loading="lazy" />
			</Glass>
			<div className="mt-6 grid gap-6 md:grid-cols-3">
				{SHOTS.map((s) => (
					<figure key={s.src} className="min-w-0">
						<Glass className="overflow-hidden">
							<img src={s.src} alt={s.alt} className="aspect-video w-full max-w-full object-cover" loading="lazy" />
						</Glass>
						<figcaption className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-400">{s.caption}</figcaption>
					</figure>
				))}
			</div>
		</section>
	);
}

function AttributeCell({ label, value, primary }) {
	return (
		<div className={`border px-3 py-3 text-center ${primary ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10 bg-white/[0.03]"}`}>
			<div className={`font-mono text-xs tracking-widest ${primary ? "text-cyan-200" : "text-slate-400"}`}>{label}</div>
			<div className="mt-1 font-mono text-2xl tabular-nums text-white">{value ?? "—"}</div>
			{primary && <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-300">Primary</div>}
		</div>
	);
}

function HeroCard({ hero }) {
	const initials = hero.name.split(" ").map((w) => w[0]).join("");
	return (
		<Glass className="grid overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
			<div className={`relative aspect-[4/5] max-w-full bg-gradient-to-b ${hero.accent ?? "from-slate-800"} via-slate-900 to-black md:aspect-auto md:min-h-[26rem]`}>
				{hero.portrait ? (
					<>
						<img src={hero.portrait} alt={`${hero.name} concept art`} className="absolute inset-0 h-full w-full object-contain p-4" loading="lazy" />
						<span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-slate-400">Concept art</span>
					</>
				) : (
					<div className="absolute inset-0 grid place-items-center">
						<div className="grid h-40 w-40 place-items-center border border-cyan-200/30 rotate-45">
							<span className="-rotate-45 font-display text-5xl font-bold text-cyan-100/80">{initials}</span>
						</div>
						<span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">Portrait placeholder</span>
					</div>
				)}
			</div>
			<div className="min-w-0 p-6 sm:p-8">
				<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">{hero.role} · {hero.primary}</p>
				<h3 className="mt-2 font-display text-4xl font-bold uppercase text-white">{hero.name}</h3>
				<div className="mt-6 grid grid-cols-3 gap-3">
					{Object.entries(hero.attributes).map(([k, v]) => (
						<AttributeCell key={k} label={k} value={v} primary={k === hero.primary} />
					))}
				</div>
				<ul className="mt-6 flex flex-wrap gap-2">
					{hero.kit.map((a, i) => (
						<li key={a} className="border border-white/10 px-3 py-1 font-mono text-xs text-slate-300">
							<span className="text-cyan-300">{"QWER"[i]}</span> {a}
						</li>
					))}
				</ul>
				{hero.quote && <blockquote className="mt-8 border-l-2 border-rose-500/70 pl-4 italic text-slate-300">“{hero.quote}”</blockquote>}
			</div>
		</Glass>
	);
}

// The full roster with starting attribute points, from the game's hero data. sprite: front-facing idle frame.
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

function AttributeBar({ label, value, primary }) {
	return (
		<div className="grid grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-2 font-mono text-xs">
			<span className={primary ? "text-cyan-200" : "text-slate-400"}>{label}</span>
			<span className="flex gap-1" aria-hidden="true">
				{Array.from({ length: ATTRIBUTE_MAX }, (_, i) => (
					<span key={i} className={`h-2 flex-1 ${i < value ? (primary ? "bg-cyan-300" : "bg-slate-300/70") : "bg-white/10"}`} />
				))}
			</span>
			<span className="text-right tabular-nums text-white">{value}</span>
		</div>
	);
}

function RosterCard({ hero }) {
	return (
		<Glass className="flex min-w-0 gap-4 p-4">
			<img src={`img/sprites/${hero.id}.webp`} alt={`${hero.name} sprite`} width="96" height="112" className="h-28 w-24 shrink-0 [image-rendering:pixelated]" loading="lazy" />
			<div className="min-w-0 flex-1">
				<p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">{hero.role} · {hero.primary}</p>
				<h3 className="mt-1 font-display text-xl font-bold uppercase text-white">{hero.name}</h3>
				<div className="mt-3 grid gap-1.5" aria-label={`Starting attributes: STR ${hero.attributes.STR}, AGI ${hero.attributes.AGI}, INT ${hero.attributes.INT}`}>
					{Object.entries(hero.attributes).map(([k, v]) => (
						<AttributeBar key={k} label={k} value={v} primary={k === hero.primary} />
					))}
				</div>
				<p className="mt-3 text-xs leading-relaxed text-slate-400">
					<span className="text-slate-300">Passive:</span> {hero.passive} · {hero.kit.join(" · ")}
				</p>
			</div>
		</Glass>
	);
}

function Roster() {
	return (
		<section id="roster" aria-labelledby="roster-title" className="py-16 scroll-mt-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<h2 id="roster-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">The roster</h2>
				<span className="font-mono text-xs text-slate-500">Starting attributes · primary is highest</span>
			</div>
			<p className="mt-4 max-w-2xl text-slate-300">Every hero starts with a few points in Strength, Agility and Intelligence, weighted toward their primary attribute. Each level adds more points that you spend however you like.</p>
			<div className="mt-8 grid gap-4 md:grid-cols-2">
				{ROSTER.map((h) => (
					<RosterCard key={h.id} hero={h} />
				))}
			</div>
		</section>
	);
}

function Spotlight() {
	return (
		<section id="heroes" aria-labelledby="heroes-title" className="py-16 scroll-mt-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<h2 id="heroes-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">Hero spotlight</h2>
				<span className="font-mono text-xs text-slate-500">10 heroes in the roster</span>
			</div>
			<div className="mt-8 grid gap-8">
				{SPOTLIGHT.map((h) => (
					<HeroCard key={h.name} hero={h} />
				))}
			</div>
		</section>
	);
}

function Devlogs() {
	return (
		<section aria-labelledby="devlog-title" className="py-16">
			<h2 id="devlog-title" className="font-display text-sm uppercase tracking-[0.3em] text-slate-400">Devlog</h2>
			<ol className="mt-8 grid gap-4">
				{DEVLOGS.map((d) => (
					<li key={d.n}>
						<a href={d.href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
							<Glass className="grid gap-2 p-5 transition group-hover:border-cyan-200/50 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
								<div className="font-mono text-xs text-slate-400">
									<div className="text-cyan-300">#{d.n}</div>
									<time dateTime={d.date}>{d.date}</time>
								</div>
								<div className="min-w-0">
									<h3 className="font-display text-xl font-bold uppercase text-white group-hover:text-cyan-200">{d.title}</h3>
									<p className="mt-1 text-slate-300">{d.summary}</p>
								</div>
							</Glass>
						</a>
					</li>
				))}
			</ol>
		</section>
	);
}

function AltarholdLanding() {
	return (
		<div className="relative min-h-full overflow-hidden bg-[#070a0d] font-body text-slate-200">
			{/* Structural grid overlay */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[0.07]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(103,232,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,1) 1px, transparent 1px)",
					backgroundSize: "48px 48px",
				}}
			/>
			{/* Jungle glow */}
			<div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-emerald-900/30 blur-3xl" />
			<div aria-hidden="true" className="pointer-events-none absolute top-[40rem] left-[-15%] h-[30rem] w-[30rem] rounded-full bg-cyan-900/20 blur-3xl" />

			<div className="relative mx-auto max-w-6xl px-4 sm:px-8">
				<header className="flex items-center justify-between py-6">
					<a href="./" className="block shrink-0"><img src="img/logo/altarhold-emblem.svg" alt="Altarhold" width="36" height="40" className="h-10 w-auto sm:hidden" /><img src="img/logo/altarhold-wordmark.svg" alt="Altarhold" width="210" height="40" className="hidden h-10 w-auto sm:block" /></a>
					<nav className="flex gap-6 font-mono text-xs uppercase tracking-widest text-slate-400">
						<a href="#alpha" className="hover:text-cyan-200">Alpha</a>
						<a href="#heroes" className="hover:text-cyan-200">Heroes</a>
						<a href="#devlog-title" className="hover:text-cyan-200">Devlog</a>
						<a href="timeline.html" className="hover:text-cyan-200">Timeline</a>
					</nav>
				</header>
				<Hero />
				<Pillars />
				<InGame />
				<AlphaTest />
				<Spotlight />
				<Roster />
				<Devlogs />
				<footer className="border-t border-white/10 py-10 font-mono text-xs text-slate-500">
					© 2026 Ynairally · Every devlog is dated and backed by a published hash of the game's source. See the <a href="timeline.html" className="text-cyan-300 hover:text-cyan-200">timeline</a>.
				</footer>
			</div>
		</div>
	);
}

createRoot(document.getElementById("root")).render(<AltarholdLanding />);
