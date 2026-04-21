import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4'

const STORAGE_KEY = 'bagoly-souls-backlog'
const SORT_STORAGE_KEY = 'bagoly-souls-sort'

function LayeredPillLink({
  variant,
  href,
  children,
}: {
  variant: 'navbar' | 'hero'
  href: string
  children: string
}) {
  const isNavbar = variant === 'navbar'
  const cls =
    isNavbar
      ? 'relative z-0 inline-flex items-center justify-center rounded-full bg-black px-[29px] py-[11px] text-[14px] font-medium leading-none text-white no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/50'
      : 'relative z-0 inline-flex items-center justify-center rounded-full bg-white px-[29px] py-[11px] text-[14px] font-medium leading-none text-black no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/50'

  return (
    <div className="relative inline-flex rounded-full border-[0.6px] border-white">
      <span
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-[14px] w-[55%] max-w-[180px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-b from-white/80 to-transparent blur-[8px]"
        aria-hidden
      />
      <a href={href} className={cls}>
        {children}
      </a>
    </div>
  )
}

export type GameDlcEntry = {
  id: string
  label: string
  completed: boolean
}

export type GameCard = {
  id: string
  title: string
  subtitle: string
  tag?: string
  /** Borítókép: https URL vagy data URL (feltöltött kép) */
  coverUrl?: string
  /** Kijátszva / végigvittem */
  completed: boolean
  /** Opcionális DLC / kiegészítők — külön pipálhatók */
  dlc?: GameDlcEntry[]
}

/** Előre definiált DLC címkék (azonosító → név); a mentett pipák megmaradnak */
const DEFAULT_DLC_PRESETS: Record<string, { id: string; label: string }[]> = {
  'dark-souls-3': [
    { id: 'ds3-ashes', label: 'Ashes of Ariandel' },
    { id: 'ds3-ringed', label: 'The Ringed City' },
  ],
  'elden-ring': [{ id: 'er-sote', label: 'Shadow of the Erdtree' }],
  'skyrim-se': [
    { id: 'sk-anniversary-upgrade', label: 'Anniversary Upgrade' },
    { id: 'sk-creations', label: 'Special Edition — Creations' },
  ],
}

function attachDefaultDlc(game: GameCard): GameCard {
  const preset = DEFAULT_DLC_PRESETS[game.id]
  if (!preset?.length) return { ...game, dlc: undefined }
  const saved = game.dlc ?? []
  const merged: GameDlcEntry[] = preset.map((p) => {
    const s = saved.find((x) => x.id === p.id)
    return {
      id: p.id,
      label: p.label,
      completed: s?.completed ?? false,
    }
  })
  return { ...game, dlc: merged }
}

function parseDlcRaw(raw: unknown): GameDlcEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out: GameDlcEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const label = typeof o.label === 'string' ? o.label : ''
    if (!id || !label) continue
    out.push({ id, label, completed: Boolean(o.completed) })
  }
  return out.length ? out : undefined
}

export type ListSortMode = 'alpha' | 'year'

/** Alcímből (pl. „Kiadó · 2024”) — első 19xx/20xx év */
function parseReleaseYear(subtitle: string): number | null {
  const m = subtitle.match(/\b(19|20)\d{2}\b/)
  return m ? Number(m[0]) : null
}

function sortGames(list: GameCard[], mode: ListSortMode): GameCard[] {
  const copy = [...list]
  if (mode === 'alpha') {
    copy.sort((a, b) =>
      a.title.localeCompare(b.title, 'hu', { sensitivity: 'base' }),
    )
    return copy
  }
  copy.sort((a, b) => {
    const ya = parseReleaseYear(a.subtitle)
    const yb = parseReleaseYear(b.subtitle)
    const na = ya === null ? 1 : 0
    const nb = yb === null ? 1 : 0
    if (na !== nb) return na - nb
    if (ya !== null && yb !== null && ya !== yb) return ya - yb
    return a.title.localeCompare(b.title, 'hu', { sensitivity: 'base' })
  })
  return copy
}

/** Steam / könyvtár screenshot alapján — 23 játék */
const DEFAULT_SOULS_BACKLOG: GameCard[] = [
  {
    id: 'assassins-creed-origins',
    title: "Assassin's Creed Origins",
    subtitle: 'Ubisoft Montreal · 2017',
    tag: 'Action adventure',
    coverUrl: 'https://cdn2.unrealengine.com/Diesel%2Fproductv2%2Fassassins-creed-origins%2Fdeluxe-edition%2FACH_UCS12002_EGST_BannerBundle_DLX_US_Store_Landscape_2560x1440-1920x1080-1cc5d95370b97e58bb64384448c5db24025701b3.jpg',
    completed: false,
  },
  {
    id: 'assassins-creed-shadows',
    title: "Assassin's Creed Shadows",
    subtitle: 'Ubisoft Quebec · 2025',
    tag: 'Action adventure',
    coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202412/2018/f5a4f3f89d83a53b6ce319816637fb358e4880b7505ee37d.jpg',
    completed: false,
  },
  {
    id: 'assassins-creed-valhalla',
    title: "Assassin's Creed Valhalla",
    subtitle: 'Ubisoft Montreal · 2020',
    tag: 'Action adventure',
    coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202008/0723/i2ICFMr0Ius6qtYYD9GNrY68.jpg',
    completed: false,
  },
  {
    id: 'black-myth-wukong',
    title: 'Black Myth: Wukong',
    subtitle: 'Game Science · 2024',
    tag: 'ARPG',
    coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/f40ef565c380c617020e559b4b4b089edd93ec09/capsule_616x353.jpg?t=1760601605',
    completed: false,
  },
  {
    id: 'clair-obscur-expedition-33',
    title: 'Clair Obscur: Expedition 33',
    subtitle: 'Sandfall Interactive · 2025',
    tag: 'JRPG',
    coverUrl: 'https://cdn1.epicgames.com/spt-assets/330dace5ffc74156987f91d454ac544b/project-w-1kt2x.jpg',
    completed: false,
  },
  {
    id: 'dark-souls-2-sotfs',
    title: 'Dark Souls II: Scholar of the First Sin',
    subtitle: 'FromSoftware · 2015',
    tag: 'Souls-like',
    coverUrl: 'https://sm.ign.com/t/ign_hu/blogroll/p/ps4-xbox-o/ps4-xbox-one-get-6-player-dark-souls-ii-scholar-of_p7j2.1280.jpg',
    completed: false,
  },
  {
    id: 'dark-souls-3',
    title: 'Dark Souls III',
    subtitle: 'FromSoftware · 2016',
    tag: 'Souls-like',
    coverUrl: 'https://image.api.playstation.com/cdn/EP0700/CUSA03365_00/OFMeAw2KhrdaEZAjW1f3tCIXbogkLpTC.png',
    completed: false,
  },
  {
    id: 'dark-souls-remastered',
    title: 'Dark Souls Remastered',
    subtitle: 'FromSoftware · 2018',
    tag: 'Souls-like',
    coverUrl: 'https://www.gameagent.hu/wp-content/uploads/2021/11/DarkSoulsRemastered.jpg',
    completed: false,
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring',
    subtitle: 'FromSoftware · 2022',
    tag: 'Souls-like',
    coverUrl: 'https://image.api.playstation.com/vulcan/img/rnd/202111/0506/hcFeWRVGHYK72uOw6Mn6f4Ms.jpg',
    completed: false,
  },
  {
    id: 'elden-ring-nightreign',
    title: 'Elden Ring: Nightreign',
    subtitle: 'FromSoftware · 2025',
    tag: 'Souls-like',
    coverUrl: 'https://i.ytimg.com/vi/Djtsw5k_DNc/maxresdefault.jpg',
    completed: false,
  },
  {
    id: 'far-cry-4',
    title: 'Far Cry 4',
    subtitle: 'Ubisoft Montreal · 2014',
    tag: 'Open world FPS',
    coverUrl: 'https://cdn2.unrealengine.com/Diesel%2Fproductv2%2Ffar-cry-4%2Fhome%2FFC4_STD_Store_Landscape_2580x1450-2580x1450-d1f404cc7a8404f24f511a0159d2874560e4b522.jpg',
    completed: false,
  },
  {
    id: 'far-cry-6',
    title: 'Far Cry 6',
    subtitle: 'Ubisoft Toronto · 2021',
    tag: 'Open world FPS',
    coverUrl: 'https://image.api.playstation.com/vulcan/img/rnd/202012/1523/6u46KPccsyVwHVmSVGnNHETI.jpg',
    completed: false,
  },
  {
    id: 'far-cry-primal',
    title: 'Far Cry Primal',
    subtitle: 'Ubisoft Montreal · 2016',
    tag: 'Open world FPS',
    coverUrl: 'https://cdn1.epicgames.com/larkspur/offer/FCP_UCS17665_Store_Landscape_2560x1440-2560x1440-7d928100112e95b33030b81c65e632d3.jpg?resize=1&w=480&h=270&quality=medium',
    completed: false,
  },
  {
    id: 'skyrim-se',
    title: 'The Elder Scrolls V: Skyrim — Special Edition',
    subtitle: 'Bethesda · 2016',
    tag: 'Open world RPG',
    coverUrl: 'https://assets-prd.ignimgs.com/2021/08/19/elder-scrolls-skyrim-button-2017-1629409446732.jpg',
    completed: false,
  },
  {
    id: 'first-berserker-khazan',
    title: 'The First Berserker: Khazan',
    subtitle: 'Neople · 2025',
    tag: 'ARPG',
    coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2680010/77f0471fc4cb000cdf1e0c4e1da2e047217195fa/capsule_616x353.jpg?t=1765255716',
    completed: false,
  },
  {
    id: 'ghost-of-tsushima-dc',
    title: "Ghost of Tsushima: Director's Cut",
    subtitle: 'Sucker Punch · 2021',
    tag: 'Action adventure',
    coverUrl: 'https://cdn1.epicgames.com/offer/6e6aa039c73347b885803de65ac5d3db/EGS_GhostofTsushima_SuckerPunchProductions_S1_2560x1440-c33a63e5da4518de6e32299bedf7efab',
    completed: false,
  },
  {
    id: 'hades',
    title: 'Hades',
    subtitle: 'Supergiant Games · 2020',
    tag: 'Roguelike',
    coverUrl: 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000033131/dbc8c55a21688b446a5c57711b726956483a14ef8c5ddb861f897c0595ccb6b5',
    completed: false,
  },
  {
    id: 'hades-2',
    title: 'Hades II',
    subtitle: 'Supergiant Games · 2025',
    tag: 'Roguelike',
    coverUrl: 'https://i.ytimg.com/vi_webp/MawBCULz4vE/maxresdefault.webp',
    completed: false,
  },
  {
    id: 'hollow-knight',
    title: 'Hollow Knight',
    subtitle: 'Team Cherry · 2017',
    tag: 'Metroidvania',
    coverUrl: 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000003208/4643fb058642335c523910f3a7910575f56372f612f7c0c9a497aaae978d3e51',
    completed: false,
  },
  {
    id: 'hollow-knight-silksong',
    title: 'Hollow Knight: Silksong',
    subtitle: 'Team Cherry',
    tag: 'Metroidvania',
    coverUrl: 'https://assets.nintendo.com/image/upload/q_auto:best/f_auto/dpr_2.0/store/software/switch2/70010000105851/8787627be7f26ae7984456ffd9af17bea845032cebbf59fe6eeb596dea6bb20e',
    completed: false,
  },
  {
    id: 'sekiro',
    title: 'Sekiro: Shadows Die Twice',
    subtitle: 'FromSoftware · 2019',
    tag: 'Action',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/814380/capsule_616x353.jpg?t=1762888662',
    completed: false,
  },
  {
    id: 'solo-leveling-arise-overdrive',
    title: 'Solo Leveling: Arise — Overdrive',
    subtitle: 'Netmarble',
    tag: 'ARPG',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2373990/076c85e9fccad9865b82d91e939f73a4a7314632/capsule_616x353.jpg?t=1773379045',
    completed: false,
  },
  {
    id: 'wuchang-fallen-feathers',
    title: 'Wuchang: Fallen Feathers',
    subtitle: 'Leenzee Games · 2025',
    tag: 'Souls-like',
    coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2277560/599d90f110b1f87e29b85d896f83783b961e9805/capsule_616x353.jpg?t=1770741955',
    completed: false,
  },
]

function normalizeGame(raw: unknown): GameCard | null {
  if (!raw || typeof raw !== 'object') return null
  const g = raw as Record<string, unknown>
  const id = g.id
  if (typeof id !== 'string' || !id) return null
  const rawCover = g.coverUrl
  let coverUrl: string | undefined
  if (typeof rawCover === 'string' && rawCover.trim()) {
    const u = rawCover.trim()
    if (u.startsWith('data:image/') || u.startsWith('https://') || u.startsWith('http://')) {
      coverUrl = u
    }
  }

  const base: GameCard = {
    id,
    title: typeof g.title === 'string' ? g.title : '',
    subtitle: typeof g.subtitle === 'string' ? g.subtitle : '',
    tag: typeof g.tag === 'string' && g.tag ? g.tag : undefined,
    coverUrl,
    completed: Boolean(g.completed),
    dlc: parseDlcRaw(g.dlc),
  }
  return attachDefaultDlc(base)
}

/** Mentett lista + katalógus: új alapértelmezett játékok beszúrása, felhasználói sorok megmaradnak */
function mergeSavedWithCatalogDefaults(saved: GameCard[]): GameCard[] {
  const savedById = new Map(saved.map((g) => [g.id, g]))
  const catalogIds = new Set(DEFAULT_SOULS_BACKLOG.map((d) => d.id))
  const merged: GameCard[] = []
  for (const def of DEFAULT_SOULS_BACKLOG) {
    const existing = savedById.get(def.id)
    merged.push(existing ? attachDefaultDlc(existing) : attachDefaultDlc(def))
  }
  for (const g of saved) {
    if (!catalogIds.has(g.id)) merged.push(attachDefaultDlc(g))
  }
  return merged
}

function loadGames(): GameCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed
          .map(normalizeGame)
          .filter((g): g is GameCard => g !== null)
        if (normalized.length > 0)
          return mergeSavedWithCatalogDefaults(normalized)
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SOULS_BACKLOG.map(attachDefaultDlc)
}

function loadSortMode(): ListSortMode {
  try {
    const v = localStorage.getItem(SORT_STORAGE_KEY)
    if (v === 'alpha' || v === 'year') return v
  } catch {
    /* ignore */
  }
  return 'alpha'
}

function titleInitials(title: string) {
  const words = title
    .replace(/[^a-zA-ZÀ-ÿ0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length >= 2) {
    return (words[0]![0] + words[1]![0]).toUpperCase()
  }
  return words[0]?.slice(0, 2).toUpperCase() ?? '?'
}

/** Kisebb data URL a localStorage limit miatt */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxW = 560
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w < 1 || h < 1) {
        reject(new Error('invalid image'))
        return
      }
      if (w > maxW) {
        h = (h * maxW) / w
        w = maxW
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w)
      canvas.height = Math.round(h)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}

const inputClass =
  'mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white placeholder:text-white/35 outline-none ring-white/20 focus:border-white/30 focus:ring-1'

/** Sima DLC-panel magasság (grid 0fr → 1fr) */
const dlcExpandGridClass = (open: boolean) =>
  `grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none ${
    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
  }`

function GameCardItem({
  game,
  editMode,
  index,
  animateModeChange,
  onChange,
  onDelete,
}: {
  game: GameCard
  editMode: boolean
  index: number
  animateModeChange: boolean
  onChange: (patch: Partial<GameCard>) => void
  onDelete: () => void
}) {
  const initials = titleInitials(game.title)
  const modeAnimClass = animateModeChange ? 'animate-card-mode-enter' : ''
  const modeAnimStyle: CSSProperties | undefined = animateModeChange
    ? { animationDelay: `${index * 38}ms` }
    : undefined

  const [dlcOpen, setDlcOpen] = useState(false)

  const toggleDlc = (dlcId: string) => {
    if (!game.dlc?.length) return
    onChange({
      dlc: game.dlc.map((d) =>
        d.id === dlcId ? { ...d, completed: !d.completed } : d,
      ),
    })
  }

  const hasDlc = Boolean(game.dlc?.length)
  const dlcDoneCount = game.dlc?.filter((d) => d.completed).length ?? 0
  const dlcTotal = game.dlc?.length ?? 0

  if (editMode) {
    return (
      <article
        key="edit"
        style={modeAnimStyle}
        className={`flex flex-col rounded-2xl border border-amber-500/30 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] ${modeAnimClass}`}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[13px] font-semibold tracking-tight text-white/80"
            aria-hidden
          >
            {initials}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg border border-red-400/40 px-2.5 py-1.5 text-[12px] font-medium text-red-300/90 transition hover:bg-red-500/15"
          >
            Törlés
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange({ completed: !game.completed })}
          className={`mb-4 w-full rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-300 ease-out ${
            game.completed
              ? 'border-emerald-500/40 bg-emerald-950/35 text-emerald-100/95'
              : 'border-white/18 bg-white/[0.06] text-white/75 hover:border-white/28 hover:bg-white/[0.09]'
          }`}
        >
          {game.completed ? '✓ Kijátszva' : '○ Még hátra — kattints ide a váltáshoz'}
        </button>

        {hasDlc ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-amber-500/25 bg-amber-950/15">
            <button
              type="button"
              aria-expanded={dlcOpen}
              onClick={() => setDlcOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-amber-950/25"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/85">
                + DLC
                <span className="ml-2 font-medium tabular-nums text-amber-100/50">
                  {dlcDoneCount}/{dlcTotal}
                </span>
              </span>
              <svg
                aria-hidden
                className={`size-4 shrink-0 text-amber-200/70 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none ${
                  dlcOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div className={dlcExpandGridClass(dlcOpen)}>
              <div
                className={`min-h-0 overflow-hidden ${dlcOpen ? '' : 'pointer-events-none'}`}
                aria-hidden={!dlcOpen}
              >
                <ul className="space-y-0.5 border-t border-amber-500/20 px-3 pb-3 pt-2">
                  {game.dlc!.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        aria-pressed={d.completed}
                        onClick={() => toggleDlc(d.id)}
                        className={`w-full rounded-md px-1.5 py-2 text-left text-[13px] font-medium transition ${
                          d.completed ?
                            'text-white/45 line-through decoration-white/30'
                          : 'text-white/85 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-white/12 bg-black/25 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
            Borítókép
          </p>
          {game.coverUrl ? (
            <div className="relative mt-2 overflow-hidden rounded-lg border border-white/15">
              <img
                src={game.coverUrl}
                alt=""
                className="max-h-40 w-full object-cover"
              />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-md border border-white/25 bg-black/70 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm hover:bg-black/90"
                onClick={() => onChange({ coverUrl: undefined })}
              >
                Kép törlése
              </button>
            </div>
          ) : null}
          <label className="mt-2 block text-[11px] font-medium text-white/45">
            Kép URL (https vagy más link)
            <input
              className={inputClass}
              value={
                game.coverUrl?.startsWith('data:') ? '' : (game.coverUrl ?? '')
              }
              onChange={(e) => {
                const v = e.target.value.trim()
                onChange({ coverUrl: v ? v : undefined })
              }}
              placeholder="https://…"
            />
          </label>
          <div className="mt-2">
            <input
              id={`cover-file-${game.id}`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f?.type.startsWith('image/')) return
                try {
                  const dataUrl = await fileToCompressedDataUrl(f)
                  onChange({ coverUrl: dataUrl })
                } catch {
                  window.alert('Nem sikerült beolvasni a képet.')
                }
              }}
            />
            <label
              htmlFor={`cover-file-${game.id}`}
              className="inline-flex cursor-pointer rounded-lg border border-white/20 bg-white/[0.08] px-3 py-2 text-[13px] font-medium text-white/85 transition hover:border-white/35 hover:bg-white/[0.12]"
            >
              Kép feltöltése fájlból
            </label>
            <p className="mt-1 text-[11px] text-white/35">
              A feltöltött képet a böngésző tömöríti és elmenti (max. ~560px széles).
            </p>
          </div>
        </div>

        <label className="text-[11px] font-medium uppercase tracking-wide text-white/45">
          Cím
          <input
            className={inputClass}
            value={game.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Játék címe"
          />
        </label>
        <label className="mt-3 text-[11px] font-medium uppercase tracking-wide text-white/45">
          Alcím / kiadó
          <input
            className={inputClass}
            value={game.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Pl. FromSoftware · 2022"
          />
        </label>
        <label className="mt-3 text-[11px] font-medium uppercase tracking-wide text-white/45">
          Címke (opcionális)
          <input
            className={inputClass}
            value={game.tag ?? ''}
            onChange={(e) => onChange({ tag: e.target.value || undefined })}
            placeholder="Pl. Souls-like"
          />
        </label>
      </article>
    )
  }

  const toggleCompleted = () => onChange({ completed: !game.completed })

  const mainAria =
    game.dlc?.length ?
      `${game.title}: fő játék ${game.completed ? 'kijátszva' : 'hátralévő'}. A DLC-k külön jelölhetők a kártyán.`
    : game.completed ?
      `${game.title}: kijátszva. Kattints a hátralévőnek jelöléshez.`
    : `${game.title}: hátralévő. Kattints a kijátszottnak jelöléshez.`

  /** DLC lenyitva: csak a kártya zöld kerete / emerald háttere / borító — ne a cím stílusa */
  const useCompletedGreenChrome = game.completed && !(hasDlc && dlcOpen)

  const mainHitClass = `flex cursor-pointer flex-col overflow-hidden p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] outline-none backdrop-blur-sm [transition:transform_200ms_cubic-bezier(0.25,0.85,0.35,1),box-shadow_480ms_cubic-bezier(0.33,1,0.68,1),background-color_480ms_cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 active:translate-y-0 active:scale-[0.985] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${
    hasDlc ? 'rounded-t-2xl' : 'rounded-2xl'
  } ${
    useCompletedGreenChrome
      ? 'bg-emerald-950/25'
      : 'bg-white/[0.04] hover:bg-white/[0.07]'
  }`

  return (
    <article
      key="view"
      style={modeAnimStyle}
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-[0_4px_28px_-14px_rgba(0,0,0,0.55)] outline-none transition-[border-color,box-shadow] duration-300 ease-out focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-black/50 ${
        hasDlc && dlcOpen ?
          'focus-within:ring-white/25'
        : 'focus-within:ring-emerald-400/50'
      } ${modeAnimClass} ${
        useCompletedGreenChrome
          ? 'border-emerald-500/45 shadow-[0_10px_40px_-12px_rgba(16,185,129,0.35)]'
          : 'border-white/10 hover:border-white/22'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={game.completed}
        aria-label={mainAria}
        onClick={toggleCompleted}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleCompleted()
          }
        }}
        className={mainHitClass}
      >
        {game.coverUrl ? (
          <div className="relative -mx-6 -mt-6 mb-4 aspect-[2/3] w-[calc(100%+3rem)] max-h-[min(280px,42vh)] overflow-hidden rounded-t-2xl border-b border-white/10 sm:max-h-[min(320px,38vh)]">
            <img
              src={game.coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={`h-full w-full object-cover transition-[opacity,filter] duration-500 ${
                useCompletedGreenChrome ? 'opacity-50 saturate-[0.65]' : ''
              }`}
            />
            <div className="absolute right-2 top-2 flex max-w-[min(100%,12rem)] flex-col items-end gap-1.5">
              {game.tag ? (
                <span className="rounded-full border border-black/40 bg-black/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/95 backdrop-blur-sm">
                  {game.tag}
                </span>
              ) : null}
              {hasDlc ? (
                <span className="rounded-full border border-amber-400/40 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100/95 backdrop-blur-sm">
                  + DLC
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold tracking-tight transition-colors duration-500 ${
                useCompletedGreenChrome ? 'bg-emerald-500/25 text-emerald-100/95' : 'bg-white/10 text-white'
              }`}
              aria-hidden
            >
              {initials || '?'}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {game.tag ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/60 transition-opacity duration-500">
                  {game.tag}
                </span>
              ) : null}
              {hasDlc ? (
                <span className="rounded-full border border-amber-400/35 bg-amber-950/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100/90">
                  + DLC
                </span>
              ) : null}
            </div>
          </div>
        )}
        <h3
          className={`text-[18px] font-semibold leading-snug transition-[color,text-decoration-color] duration-500 ${
            game.completed ?
              'text-white/45 line-through decoration-white/40'
            : 'text-white'
          }`}
        >
          {game.title}
        </h3>
        <p
          className={`mt-1 text-[13px] font-medium transition-colors duration-500 ${
            game.completed ? 'text-white/40' : 'text-white/55'
          }`}
        >
          {game.subtitle}
        </p>
      </div>

      {hasDlc ? (
        <div className="flex flex-col" role="group" aria-label="DLC állapot">
          <button
            type="button"
            aria-expanded={dlcOpen}
            onClick={() => setDlcOpen((o) => !o)}
            className={`flex w-full items-center justify-between gap-2 border-t border-white/10 bg-black/20 px-4 py-2.5 text-left transition hover:bg-white/[0.04] sm:px-5 ${
              dlcOpen ? '' : 'rounded-b-2xl'
            }`}
          >
            <span className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/85">
                + DLC
              </span>
              <span className="text-[12px] tabular-nums text-white/40">
                {dlcDoneCount}/{dlcTotal}
              </span>
            </span>
            <svg
              aria-hidden
              className={`size-4 shrink-0 text-white/45 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none ${
                dlcOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div className={dlcExpandGridClass(dlcOpen)}>
            <div
              className={`min-h-0 overflow-hidden ${dlcOpen ? '' : 'pointer-events-none'}`}
              aria-hidden={!dlcOpen}
            >
              <div className="rounded-b-2xl border-t border-white/5 bg-black/25 px-4 pb-3 pt-1 sm:px-5">
                <ul className="space-y-0.5">
                  {game.dlc!.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        aria-pressed={d.completed}
                        onClick={() => toggleDlc(d.id)}
                        className={`w-full rounded-md px-1.5 py-2 text-left text-[12px] font-medium transition ${
                          d.completed ?
                            'text-white/45 line-through decoration-white/30'
                          : 'text-white/85 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default function App() {
  const [games, setGames] = useState<GameCard[]>(() => loadGames())
  const [sortMode, setSortMode] = useState<ListSortMode>(loadSortMode)
  const [editMode, setEditMode] = useState(false)
  /** Első betöltésnél ne animáljon a lista; „Lista szerkesztése” után igen. */
  const [listAnimEnabled, setListAnimEnabled] = useState(false)

  const [listRef] = useAutoAnimate({
    duration: 520,
    easing: 'cubic-bezier(0.16, 1, 0.32, 1)',
  })

  const sortedGames = useMemo(
    () => sortGames(games, sortMode),
    [games, sortMode],
  )

  const completedCount = useMemo(
    () => games.filter((g) => g.completed).length,
    [games],
  )
  const totalCount = games.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
    } catch {
      /* ignore */
    }
  }, [games])

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, sortMode)
    } catch {
      /* ignore */
    }
  }, [sortMode])

  const patchGameById = (id: string, patch: Partial<GameCard>) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    )
  }

  const removeGameById = (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id))
  }

  const addGame = () => {
    setGames((prev) => [
      ...prev,
      {
        id: `game-${Date.now()}`,
        title: 'Új játék',
        subtitle: '',
        tag: '',
        completed: false,
      },
    ])
  }

  const resetList = () => {
    if (
      window.confirm(
        'Visszaállítod a lista alapértelmezett tartalmát? A jelenlegi szerkesztéseid elvesznek.',
      )
    ) {
      setGames([...DEFAULT_SOULS_BACKLOG].map(attachDefaultDlc))
    }
  }

  return (
    <div className="min-h-dvh bg-black font-sans text-white">
      <video
        className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      <div className="fixed inset-0 z-[1] bg-black/50" aria-hidden />

      <div className="relative z-10">
        <div className="flex min-h-dvh flex-col">
          <nav className="flex shrink-0 items-center justify-end gap-4 px-5 py-5 md:px-[120px]">
            <div className="inline-flex shrink-0 items-center gap-2 rounded-[20px] border border-white/20 bg-white/10 px-3 py-2">
              <span
                className="size-1 shrink-0 rounded-full bg-white"
                aria-hidden
              />
              <p className="text-[13px] font-medium leading-snug">
                <span className="text-white/60">created by:</span>
                <span className="text-white"> Detix</span>
              </p>
            </div>
          </nav>

          <div className="flex flex-1 flex-col items-center px-5 pt-[200px] pb-[102px] md:px-8 md:pt-[280px]">
            <div className="flex w-full max-w-[680px] flex-col items-center">
              <h1
                className="max-w-[613px] bg-clip-text text-center text-[36px] font-medium leading-[1.28] text-transparent md:text-[56px]"
                style={{
                  backgroundImage:
                    'linear-gradient(144.5deg, #ffffff 28%, rgba(0,0,0,0) 115%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                Bagoly
              </h1>

              <div className="mt-10">
                <LayeredPillLink variant="hero" href="#souls-lista">
                  A LISTA
                </LayeredPillLink>
              </div>
            </div>
          </div>
        </div>

        <div
          id="souls-lista"
          className="scroll-mt-24 px-5 pb-20 pt-2 md:px-[120px] md:pb-28 md:pt-4"
        >
          <div className="mx-auto mb-6 flex max-w-[1200px] flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Lista rendezése"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Rendezés
              </span>
              <div className="relative inline-flex rounded-full border border-white/15 bg-white/[0.04] p-[3px]">
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-[3px] left-[3px] top-[3px] w-[calc((100%-6px)/2)] rounded-full bg-white/18 shadow-[0_1px_8px_rgba(0,0,0,0.18)] transition-[transform] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
                  style={{
                    transform:
                      sortMode === 'year' ? 'translateX(100%)' : 'none',
                  }}
                />
                <button
                  type="button"
                  role="radio"
                  aria-checked={sortMode === 'alpha'}
                  onClick={() => setSortMode('alpha')}
                  className={`relative z-10 min-w-[4.75rem] flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                    sortMode === 'alpha'
                      ? 'text-white'
                      : 'text-white/55 hover:text-white/88'
                  }`}
                >
                  A–Z
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={sortMode === 'year'}
                  onClick={() => setSortMode('year')}
                  className={`relative z-10 min-w-[4.75rem] flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                    sortMode === 'year'
                      ? 'text-white'
                      : 'text-white/55 hover:text-white/88'
                  }`}
                >
                  Megjelenés
                </button>
              </div>
            </div>

            <div
              key={listAnimEnabled ? (editMode ? 'toolbar-edit' : 'toolbar-view') : 'toolbar-initial'}
              className={`flex flex-wrap items-center justify-end gap-2 sm:gap-3 ${listAnimEnabled ? 'animate-toolbar-mode-enter' : ''}`}
            >
              {editMode ? (
                <>
                  <button
                    type="button"
                    onClick={addGame}
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/15"
                  >
                    + Új elem
                  </button>
                  <button
                    type="button"
                    onClick={resetList}
                    className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Alapértelmezés
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="rounded-full border border-white/40 bg-white px-4 py-2 text-[13px] font-medium text-black transition hover:bg-white/90"
                  >
                    Kész
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setListAnimEnabled(true)
                    setEditMode(true)
                  }}
                  className="rounded-full border border-white/30 bg-white/5 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/12"
                >
                  Lista szerkesztése
                </button>
              )}
            </div>
          </div>

          <div
            className="mx-auto mb-5 flex max-w-[1200px] flex-col gap-2.5 sm:mb-6"
            role="status"
            aria-live="polite"
            aria-label={`Kijátszva: ${completedCount} a ${totalCount} játékból`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-[12px] font-medium uppercase tracking-wide text-white/40">
                Haladás
              </span>
              <span className="tabular-nums text-[14px] text-white/85">
                <span className="font-semibold text-emerald-300/95">
                  {completedCount}
                </span>
                <span className="text-white/35"> / </span>
                <span className="text-white/60">{totalCount}</span>
                <span className="ml-1.5 text-[13px] font-normal text-white/45">
                  kijátszva
                </span>
              </span>
            </div>
            <div
              className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-valuenow={completedCount}
              aria-label="Kijátszott játékok aránya"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600/90 to-emerald-400/85 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <ul
            ref={listRef}
            className="mx-auto grid max-w-[1200px] list-none grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            aria-label="Souls-like backlog lista"
          >
            {sortedGames.map((game, index) => (
              <li
                key={game.id}
                className="transform-gpu isolate [backface-visibility:hidden]"
              >
                <GameCardItem
                  game={game}
                  editMode={editMode}
                  index={index}
                  animateModeChange={listAnimEnabled}
                  onChange={(patch) => patchGameById(game.id, patch)}
                  onDelete={() => removeGameById(game.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
