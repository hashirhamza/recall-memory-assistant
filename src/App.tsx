import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type MainTab = "home" | "search" | "library" | "ask";
type Screen = MainTab | "details" | "save" | "success" | "welcome" | "profile";
type MemoryType = "Screenshots" | "Links" | "Notes" | "Documents";

type Memory = {
  id: number;
  type: MemoryType;
  title: string;
  source: string;
  date: string;
  tags: string[];
  note: string;
  image?: string;
  accent: string;
  collection: string;
  url?: string;
  createdAt: number;
};

const seededDemoIds = new Set([1, 2, 3, 4]);

const ignoredSearchWords = new Set(["a", "an", "the", "i", "my", "me", "that", "this", "saved"]);

function matchesMemory(memory: Memory, query: string) {
  const searchTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term && !ignoredSearchWords.has(term));

  if (!searchTerms.length) return true;
  const haystack = [
    memory.title,
    memory.source,
    memory.note,
    memory.type,
    memory.collection,
    ...memory.tags,
  ]
    .join(" ")
    .toLowerCase();
  return searchTerms.every((term) => haystack.includes(term));
}

function newestFirst(memories: Memory[]) {
  return [...memories].sort((a, b) => b.createdAt - a.createdAt);
}

const typeMeta: Record<MemoryType, { icon: IconName; label: string }> = {
  Screenshots: { icon: "image", label: "Screenshots" },
  Links: { icon: "link", label: "Links" },
  Notes: { icon: "note", label: "Notes" },
  Documents: { icon: "document", label: "Documents" },
};

type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bookmark"
  | "check"
  | "chevron"
  | "close"
  | "document"
  | "edit"
  | "home"
  | "image"
  | "layers"
  | "library"
  | "link"
  | "more"
  | "note"
  | "plus"
  | "search"
  | "spark"
  | "trash"
  | "upload"
  | "user";

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
    "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
    bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />,
    check: <path d="m5 12 4.2 4L19 6.5" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    document: (
      <>
        <path d="M7 3.5h7l4 4V20.5H7z" />
        <path d="M14 3.5v4h4M10 12h5M10 15.5h5" />
      </>
    ),
    edit: (
      <>
        <path d="m14.5 5.5 4 4M5 19l1-4 9.7-9.7a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L9 18z" />
        <path d="m13.5 7.5 4 4" />
      </>
    ),
    home: (
      <>
        <path d="m3.5 11 8.5-7 8.5 7" />
        <path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" />
      </>
    ),
    image: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m5.5 17 4.2-4 3.2 3 2.1-2 3.5 3" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    library: (
      <>
        <rect x="4" y="4" width="6" height="16" rx="2" />
        <rect x="13" y="4" width="7" height="16" rx="2" />
        <path d="M7 8v8M16.5 8v5" />
      </>
    ),
    link: (
      <>
        <path d="m9.5 14.5 5-5" />
        <path d="m7.5 16.5-1 1a3.5 3.5 0 0 1-5-5l3.3-3.3a3.5 3.5 0 0 1 5 0" />
        <path d="m16.5 7.5 1-1a3.5 3.5 0 0 1 5 5l-3.3 3.3a3.5 3.5 0 0 1-5 0" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    note: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4.5 4.5" />
      </>
    ),
    spark: (
      <path d="M12 2.8c.6 4.8 3.4 7.6 8.2 8.2-4.8.6-7.6 3.4-8.2 8.2-.6-4.8-3.4-7.6-8.2-8.2C8.6 10.4 11.4 7.6 12 2.8Z" />
    ),
    trash: (
      <>
        <path d="M4.5 7h15M9 3.5h6l1 3.5H8zM7 7l.8 13h8.4L17 7" />
        <path d="M10 10.5v6M14 10.5v6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m-4 4 4-4 4 4M5 14v5h14v-5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function RecallMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Recall logo">
      <rect width="40" height="40" rx="13" fill="url(#recall-gradient)" />
      <path
        d="M19.7 10.2c-4.4 0-7.8 3.3-7.8 7.5 0 1.2.3 2.3.8 3.3-1 .9-1.7 2.3-1.7 3.8 0 2.8 2.2 5 5 5 1.5 0 2.8-.6 3.7-1.7.9 1.1 2.2 1.7 3.7 1.7 2.8 0 5-2.2 5-5 0-1.5-.7-2.9-1.7-3.8.5-1 .8-2.1.8-3.3 0-4.2-3.4-7.5-7.8-7.5Z"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M19.7 10.5V28M14.8 17c2.4 0 4.9 1.3 4.9 3.9M24.8 16.2c-2.4 0-5.1 1.5-5.1 4.7"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M29.8 7.4c.2 1.7 1.2 2.7 2.9 2.9-1.7.2-2.7 1.2-2.9 2.9-.2-1.7-1.2-2.7-2.9-2.9 1.7-.2 2.7-1.2 2.9-2.9Z"
        fill="#F4CFFF"
      />
      <defs>
        <linearGradient
          id="recall-gradient"
          x1="4"
          y1="3"
          x2="36"
          y2="39"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8170F7" />
          <stop offset="1" stopColor="#5845D7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ProfileAvatar({ firstName, large = false }: { firstName: string; large?: boolean }) {
  return (
    <span className={`profile-avatar ${large ? "large" : ""}`} aria-hidden="true">
      {firstName ? firstName.charAt(0).toUpperCase() : <Icon name="user" size={large ? 27 : 17} />}
    </span>
  );
}

function AppHeader({
  onHome,
  onProfile,
  firstName,
}: {
  onHome: () => void;
  onProfile: () => void;
  firstName: string;
}) {
  return (
    <header className="brand-header">
      <button className="brand-lockup" onClick={onHome} aria-label="Go to home">
        <RecallMark />
        <span>Recall</span>
      </button>
      <button className="profile-avatar-button" onClick={onProfile} aria-label="Open My Profile">
        <ProfileAvatar firstName={firstName} />
      </button>
    </header>
  );
}

function TypeArtwork({ type }: { type: MemoryType }) {
  if (type === "Screenshots") {
    return (
      <div className="screenshot-art" aria-hidden="true">
        <Icon name="image" size={28} />
        <span>SCREENSHOT</span>
      </div>
    );
  }
  if (type === "Links") {
    return (
      <div className="recipe-art" aria-hidden="true">
        <div className="recipe-plate">
          <i />
          <i />
          <i />
        </div>
        <span>SAVED LINK</span>
      </div>
    );
  }
  if (type === "Notes") {
    return (
      <div className="note-art" aria-hidden="true">
        <span>PERSONAL NOTE</span>
        <i />
        <i />
        <i className="short" />
      </div>
    );
  }
  return (
    <div className="document-art" aria-hidden="true">
      <div className="doc-page">
        <b>DOCUMENT</b>
        <span>SAVED FILE</span>
        <i />
        <i />
      </div>
    </div>
  );
}

function MemoryCard({ memory, onOpen }: { memory: Memory; onOpen: (memory: Memory) => void }) {
  return (
    <button className="memory-card" onClick={() => onOpen(memory)}>
      <div className="memory-thumb" style={{ background: memory.accent }}>
        {memory.image ? (
          <img src={memory.image} alt={memory.title} />
        ) : (
          <TypeArtwork type={memory.type} />
        )}
        <span className="memory-type-icon">
          <Icon name={typeMeta[memory.type].icon} size={14} />
        </span>
      </div>
      <div className="memory-copy">
        <span className="eyebrow">{memory.type.slice(0, -1)}</span>
        <h3>{memory.title}</h3>
        <p>{memory.source}</p>
        <span className="memory-date">{memory.date}</span>
      </div>
      <span className="card-arrow">
        <Icon name="chevron" size={18} />
      </span>
    </button>
  );
}

function BottomNav({
  active,
  onNavigate,
  onAdd,
}: {
  active: MainTab;
  onNavigate: (tab: MainTab) => void;
  onAdd: () => void;
}) {
  const tabs: Array<{ id: MainTab; label: string; icon: IconName }> = [
    { id: "home", label: "Home", icon: "home" },
    { id: "search", label: "Search", icon: "search" },
    { id: "library", label: "Library", icon: "library" },
    { id: "ask", label: "Ask", icon: "spark" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {tabs.slice(0, 2).map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${active === tab.id ? "active" : ""}`}
          onClick={() => onNavigate(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
        >
          <Icon name={tab.icon} size={21} />
          <span>{tab.label}</span>
        </button>
      ))}
      <button className="nav-add" onClick={onAdd} aria-label="Create a new memory">
        <Icon name="plus" size={25} />
      </button>
      {tabs.slice(2).map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${active === tab.id ? "active" : ""}`}
          onClick={() => onNavigate(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
        >
          <Icon name={tab.icon} size={21} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

type MainNavigationProps = {
  onNavigate: (tab: MainTab) => void;
  onAdd: () => void;
};

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function WelcomeScreen({
  onComplete,
  onSkip,
}: {
  onComplete: (name: string) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const trimmedName = name.trim().replace(/\s+/g, " ");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (trimmedName) onComplete(trimmedName);
  }

  return (
    <div className="screen onboarding-screen">
      <main className="onboarding-main">
        <div className="welcome-brand">
          <RecallMark size={48} />
          <span>Recall</span>
        </div>
        <div className="onboarding-copy">
          <h1>Welcome to Recall</h1>
          <p>Your second memory. Let’s make it yours.</p>
        </div>
        <form onSubmit={submit} className="onboarding-form">
          <label>
            <span>What should we call you?</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your first name"
              autoComplete="given-name"
              autoFocus
            />
          </label>
          <button className="primary-button" type="submit" disabled={!trimmedName}>
            Get started
            <Icon name="arrow-right" size={18} />
          </button>
          <button className="onboarding-skip" type="button" onClick={onSkip}>
            Skip for now
          </button>
        </form>
      </main>
      <p className="onboarding-footer">No account needed. Your name stays on this device.</p>
    </div>
  );
}

function ProfileScreen({
  firstName,
  onBack,
  onSave,
}: {
  firstName: string;
  onBack: () => void;
  onSave: (name: string) => void;
}) {
  const [draft, setDraft] = useState(firstName);
  const [saved, setSaved] = useState(false);
  const trimmedDraft = draft.trim().replace(/\s+/g, " ");
  const canSave = Boolean(trimmedDraft) && trimmedDraft !== firstName;

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2200);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave(trimmedDraft);
    setDraft(trimmedDraft);
    setSaved(true);
  }

  return (
    <div className="screen profile-screen">
      <header className="sub-header profile-header">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <Icon name="arrow-left" />
        </button>
        <span>My Profile</span>
        <span />
      </header>
      <main className="profile-main">
        <div className="profile-identity">
          <ProfileAvatar firstName={firstName} large />
          <h1>{firstName || "Your profile"}</h1>
          <p>Your personal memory space</p>
        </div>
        <form className="profile-form" onSubmit={submit}>
          <label className="form-field">
            <span>First name</span>
            <div className="input-wrap">
              <input
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSaved(false);
                }}
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
              <Icon name="edit" size={17} />
            </div>
          </label>
          <button className="primary-button" type="submit" disabled={!canSave}>
            Save changes
          </button>
          {saved && (
            <p className="profile-success" role="status">
              <Icon name="check" size={14} />
              Changes saved
            </p>
          )}
        </form>
      </main>
    </div>
  );
}

function HomeScreen({
  memories,
  firstName,
  onOpen,
  onNavigate,
  onAdd,
  onLibrary,
  onSearch,
  onProfile,
}: {
  memories: Memory[];
  firstName: string;
  onOpen: (memory: Memory) => void;
  onLibrary: (filter: MemoryType | "All") => void;
  onSearch: (query?: string) => void;
  onProfile: () => void;
} & MainNavigationProps) {
  const recentMemories = useMemo(() => newestFirst(memories).slice(0, 5), [memories]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = getTimeGreeting(now);

  return (
    <div className="screen home-screen">
      <AppHeader
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onProfile={onProfile}
        firstName={firstName}
      />
      <main>
        <section className="welcome">
          <p className="welcome-kicker">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1>
            What would you like
            <br />
            to <span>recall?</span>
          </h1>
          <button className="search-box home-search-trigger" onClick={() => onSearch("")}>
            <div className="search-icon-wrap">
              <Icon name="spark" size={20} />
            </div>
            <span>What are you trying to remember?</span>
            <Icon name="chevron" size={18} />
          </button>
          <p className="search-hint">
            <Icon name="spark" size={12} />
            Try “blue shoes”, “recipe I saved”, or “travel document”
          </p>
        </section>

        <section className="category-section">
          <div className="section-heading">
            <h2>Browse your memory</h2>
          </div>
          <div className="categories">
            {(Object.keys(typeMeta) as MemoryType[]).map((type) => (
              <button key={type} className="category-card" onClick={() => onLibrary(type)}>
                <span className={`category-icon category-${type.toLowerCase()}`}>
                  <Icon name={typeMeta[type].icon} size={21} />
                </span>
                <strong>{type}</strong>
                <small>{memories.filter((memory) => memory.type === type).length}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="recent-section">
          {recentMemories.length > 0 && (
            <div className="section-heading">
              <div>
                <h2>Recent saves</h2>
                <p>Your five newest memories</p>
              </div>
              <button onClick={() => onLibrary("All")}>See all</button>
            </div>
          )}
          <div className="memory-list">
            {recentMemories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} onOpen={onOpen} />
            ))}
            {!recentMemories.length && (
              <div className="empty-state home-empty">
                <div>
                  <Icon name="bookmark" size={27} />
                </div>
                <h3>Your memory starts here</h3>
                <p>
                  Save your first screenshot, link, note, or document to find it whenever you need
                  it.
                </p>
                <small>Tap + below to save your first memory.</small>
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav active="home" onNavigate={onNavigate} onAdd={onAdd} />
    </div>
  );
}

function LibraryScreen({
  memories,
  initialFilter,
  onOpen,
  onNavigate,
  onAdd,
}: {
  memories: Memory[];
  initialFilter: MemoryType | "All";
  onOpen: (memory: Memory) => void;
} & MainNavigationProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryType | "All">(initialFilter);

  useEffect(() => setFilter(initialFilter), [initialFilter]);

  const results = useMemo(
    () =>
      newestFirst(memories).filter(
        (memory) => (filter === "All" || memory.type === filter) && matchesMemory(memory, query),
      ),
    [filter, memories, query],
  );

  const emptyTitle = query.trim()
    ? "No matching memories found."
    : filter === "All"
      ? "No memories saved yet"
      : `No ${filter.toLowerCase()} saved yet.`;

  return (
    <div className="screen tab-screen library-screen">
      <main className="tab-main">
        <header className="tab-header">
          <span className="tab-kicker">RECALL</span>
          <h1>My Library</h1>
          <p>Everything you’ve saved, all in one place.</p>
        </header>

        <div className="library-search">
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your memories..."
            aria-label="Search your library"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear library search">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        <div className="filter-row" aria-label="Memory categories">
          {(["All", ...Object.keys(typeMeta)] as Array<MemoryType | "All">).map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="library-results">
          <div className="results-heading">
            <h2>{filter === "All" ? "All memories" : filter}</h2>
            <span>
              {results.length} {results.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="memory-list">
            {results.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} onOpen={onOpen} />
            ))}
            {!results.length && (
              <div className="empty-state library-empty">
                <div>
                  <Icon
                    name={query ? "search" : filter === "All" ? "library" : typeMeta[filter].icon}
                    size={26}
                  />
                </div>
                <h3>{emptyTitle}</h3>
                <p>
                  {query
                    ? "Try another phrase or clear your search."
                    : filter === "All"
                      ? "Your saved screenshots, links, notes, and documents will appear here."
                      : `Your saved ${filter.toLowerCase()} will appear here.`}
                </p>
                {query && <button onClick={() => setQuery("")}>Clear search</button>}
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav active="library" onNavigate={onNavigate} onAdd={onAdd} />
    </div>
  );
}

function SearchScreen({
  memories,
  initialQuery,
  onOpen,
  onNavigate,
  onAdd,
}: {
  memories: Memory[];
  initialQuery: string;
  onOpen: (memory: Memory) => void;
} & MainNavigationProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [initialQuery]);

  const results = useMemo(
    () =>
      query.trim() ? newestFirst(memories).filter((memory) => matchesMemory(memory, query)) : [],
    [memories, query],
  );

  const examples = ["blue shoes", "recipe I saved", "travel document"];

  return (
    <div className="screen tab-screen search-screen">
      <main className="tab-main search-main">
        <header className="tab-header search-header">
          <span className="mini-spark">
            <Icon name="spark" size={17} />
          </span>
          <h1>Search your memory</h1>
          <p>Describe what you remember. Search runs locally across your saved content.</p>
        </header>

        <div className="full-search-box">
          <Icon name="search" size={22} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What are you trying to remember?"
            aria-label="Search all memories"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="close" size={17} />
            </button>
          )}
        </div>

        {!memories.length ? (
          <section className="search-no-memories">
            <div className="empty-state">
              <div>
                <Icon name="bookmark" size={27} />
              </div>
              <h3>Your memories will become searchable</h3>
              <p>
                Save your first memory, then return here to find it by title, note, tag, or source.
              </p>
              <small>Use the + button below to add a memory.</small>
            </div>
          </section>
        ) : !query.trim() ? (
          <section className="search-examples">
            <span>TRY ASKING</span>
            <div>
              {examples.map((example) => (
                <button key={example} onClick={() => setQuery(example)}>
                  <Icon name="spark" size={13} />
                  {example}
                </button>
              ))}
            </div>
            <div className="search-illustration">
              <RecallMark size={54} />
              <h2>Your memories, easy to find.</h2>
              <p>Search titles, notes, tags, sources, and collections.</p>
            </div>
          </section>
        ) : (
          <section className="search-results">
            <div className="results-heading">
              <h2>Best matches</h2>
              <span>{results.length} found</span>
            </div>
            <div className="memory-list">
              {results.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} onOpen={onOpen} />
              ))}
              {!results.length && (
                <div className="empty-state">
                  <div>
                    <Icon name="search" size={26} />
                  </div>
                  <h3>No matching memories found.</h3>
                  <p>Try fewer words or search for a title, tag, or source.</p>
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <BottomNav active="search" onNavigate={onNavigate} onAdd={onAdd} />
    </div>
  );
}

function AskScreen({ onNavigate, onAdd }: MainNavigationProps) {
  return (
    <div className="screen tab-screen ask-screen">
      <main className="ask-main">
        <div className="ask-illustration" aria-hidden="true">
          <div className="ask-orbit orbit-one" />
          <div className="ask-orbit orbit-two" />
          <RecallMark size={72} />
          <i>
            <Icon name="spark" size={18} />
          </i>
        </div>
        <span className="tab-kicker">COMING SOON</span>
        <h1>Ask Recall</h1>
        <p>Your personal memory assistant is coming soon.</p>
        <small>No AI service is connected in this prototype.</small>
      </main>
      <BottomNav active="ask" onNavigate={onNavigate} onAdd={onAdd} />
    </div>
  );
}

function DetailsScreen({
  memory,
  onBack,
  onDelete,
  onUpdate,
}: {
  memory: Memory;
  onBack: () => void;
  onDelete: (id: number) => void;
  onUpdate: (memory: Memory) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(memory.title);
  const [collection, setCollection] = useState(memory.collection);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideTap(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDeleteOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideTap);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideTap);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function openSource() {
    if (memory.url) {
      window.open(memory.url, "_blank", "noopener,noreferrer");
      return;
    }
    setEditing(true);
  }

  return (
    <div className="screen detail-screen">
      <header className="sub-header">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <Icon name="arrow-left" />
        </button>
        <span>Memory</span>
        <div className="memory-menu-wrap" ref={menuRef}>
          <button
            className="icon-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="More memory options"
            aria-expanded={menuOpen}
          >
            <Icon name="more" />
          </button>
          {menuOpen && (
            <div className="memory-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Icon name="trash" size={17} />
                Delete memory
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="detail-main">
        <div className="hero-image">
          {memory.image ? (
            <img src={memory.image} alt={memory.title} />
          ) : (
            <TypeArtwork type={memory.type} />
          )}
          <span className="source-pill">
            <Icon name={typeMeta[memory.type].icon} size={14} />
            {memory.type.slice(0, -1)}
          </span>
        </div>

        <section className="detail-content">
          <div className="detail-heading">
            <p className="eyebrow">Saved {memory.date.toLowerCase()}</p>
            {editing ? (
              <input
                className="detail-title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            ) : (
              <h1>{title}</h1>
            )}
            <button className="source-link" type="button" onClick={openSource}>
              {memory.source}
              <Icon name="arrow-right" size={14} />
            </button>
          </div>

          <div className="insight-card">
            <div className="insight-title">
              <span>
                <Icon name="spark" size={15} />
              </span>
              <strong>Recall summary</strong>
              <small>SIMULATED</small>
            </div>
            <p>{memory.note}</p>
          </div>

          <div className="detail-block">
            <div className="block-label">
              <span>Descriptive tags</span>
              <small>Suggested locally</small>
            </div>
            <div className="tags">
              {memory.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="detail-block">
            <span className="field-label">Collection</span>
            {editing ? (
              <select value={collection} onChange={(event) => setCollection(event.target.value)}>
                <option>Wishlist</option>
                <option>Recipes</option>
                <option>Personal</option>
                <option>Inspiration</option>
                <option>Work</option>
                <option>Japan 2025</option>
              </select>
            ) : (
              <div className="collection-row">
                <span className="collection-dot" />
                <div>
                  <strong>{collection}</strong>
                  <small>12 memories</small>
                </div>
                <Icon name="chevron" size={17} />
              </div>
            )}
          </div>
        </section>
      </main>
      <div className="detail-actions">
        <button
          className="secondary-button"
          onClick={() => {
            if (editing) {
              onUpdate({
                ...memory,
                title: title.trim() || memory.title,
                collection,
              });
              setEditing(false);
            } else {
              setEditing(true);
            }
          }}
        >
          <Icon name={editing ? "check" : "edit"} size={18} />
          {editing ? "Done editing" : "Organize & edit"}
        </button>
        <button
          className="round-action"
          onClick={openSource}
          aria-label={memory.url ? "Open original source" : "Edit memory"}
        >
          <Icon name="arrow-right" size={20} />
        </button>
      </div>
      {deleteOpen && (
        <div className="delete-modal-backdrop" role="presentation">
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <div className="delete-modal-icon">
              <Icon name="trash" size={22} />
            </div>
            <h2 id="delete-title">Delete this memory?</h2>
            <p id="delete-description">
              This memory will be permanently deleted. This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button type="button" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={() => onDelete(memory.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const saveAccents: Record<MemoryType, string> = {
  Screenshots: "#dfe9f5",
  Links: "#efe2c9",
  Notes: "#f1e3c9",
  Documents: "#e8e0ef",
};

function SaveScreen({ onBack, onSave }: { onBack: () => void; onSave: (memory: Memory) => void }) {
  const [type, setType] = useState<MemoryType>("Screenshots");
  const [title, setTitle] = useState("");
  const [collection, setCollection] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function chooseType(nextType: MemoryType) {
    setType(nextType);
    setTitle("");
    setCollection("");
    setPreview("");
    setFileName("");
    setUrl("");
    setNote("");
    setTags([]);
    setTagDraft("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function addTag() {
    const nextTag = tagDraft.trim();
    if (!nextTag || tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) return;
    setTags((current) => [...current, nextTag]);
    setTagDraft("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    const uniqueId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const trimmedUrl = url.trim();
    onSave({
      id: uniqueId,
      type,
      title: title.trim(),
      source: type === "Links" ? trimmedUrl : type === "Notes" ? "Personal note" : fileName,
      date: "Just now",
      tags,
      note:
        type === "Notes"
          ? note.trim()
          : type === "Links"
            ? `Saved link to ${trimmedUrl}`
            : `${type === "Screenshots" ? "Screenshot" : "Document"} uploaded as ${fileName}.`,
      image: type === "Screenshots" ? preview : undefined,
      accent: saveAccents[type],
      collection: collection || "Unfiled",
      url: type === "Links" ? trimmedUrl : undefined,
      createdAt: Date.now(),
    });
  }

  const isValid =
    Boolean(title.trim()) &&
    ((type === "Screenshots" && Boolean(fileName && preview)) ||
      (type === "Links" && Boolean(url.trim())) ||
      (type === "Notes" && Boolean(note.trim())) ||
      (type === "Documents" && Boolean(fileName)));

  return (
    <div className="screen save-screen">
      <header className="sub-header">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <Icon name="arrow-left" />
        </button>
        <span>Save a memory</span>
        <button className="text-button" onClick={onBack}>
          Cancel
        </button>
      </header>
      <main className="save-main">
        <div className="save-intro">
          <span className="mini-spark">
            <Icon name="spark" size={17} />
          </span>
          <h1>What are we remembering?</h1>
          <p>Add anything now. Recall will help you find it when you need it.</p>
        </div>

        <div className="type-switcher" aria-label="Memory type">
          {(Object.keys(typeMeta) as MemoryType[]).map((item) => (
            <button
              key={item}
              type="button"
              className={type === item ? "active" : ""}
              onClick={() => chooseType(item)}
            >
              <Icon name={typeMeta[item].icon} size={18} />
              <span>{item.slice(0, -1)}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {(type === "Screenshots" || type === "Documents") && (
            <section
              className={`upload-card ${type === "Documents" ? "document-upload" : ""} ${!fileName ? "empty-upload-card" : ""}`}
            >
              <input
                ref={fileRef}
                hidden
                type="file"
                accept={type === "Screenshots" ? "image/*" : ".pdf,.doc,.docx"}
                onChange={handleFile}
              />
              <div className="upload-preview">
                {!fileName ? (
                  <div className="upload-placeholder">
                    <Icon name="upload" size={23} />
                    <small>{type === "Screenshots" ? "Add image" : "Add document"}</small>
                  </div>
                ) : type === "Screenshots" ? (
                  <img src={preview} alt="Preview of memory to save" />
                ) : (
                  <TypeArtwork type="Documents" />
                )}
                {fileName && (
                  <span>
                    <Icon name="check" size={14} /> Ready
                  </span>
                )}
              </div>
              <div className="upload-copy">
                <strong>
                  {fileName ||
                    (type === "Screenshots" ? "Upload a screenshot" : "Upload a document")}
                </strong>
                <span>
                  {fileName
                    ? `${type === "Screenshots" ? "Image" : "Document"} · Ready to save`
                    : type === "Screenshots"
                      ? "PNG, JPG, or WEBP"
                      : "PDF, DOC, or DOCX"}
                </span>
                <button type="button" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={16} />
                  {fileName ? "Replace" : type === "Screenshots" ? "Choose image" : "Choose file"}
                </button>
              </div>
            </section>
          )}

          {type === "Links" && (
            <label className="form-field contextual-field">
              <span>Link URL</span>
              <div className="input-wrap">
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Paste a link"
                  required
                />
                <Icon name="link" size={17} />
              </div>
            </label>
          )}

          {type === "Notes" && (
            <label className="form-field contextual-field">
              <span>Note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Write your note..."
                required
              />
            </label>
          )}

          <div className="suggested-note">
            <Icon name="spark" size={14} />
            <span>
              Simulated AI suggestions for this prototype. No external service is connected.
            </span>
          </div>

          <label className="form-field">
            <span>Title</span>
            <div className="input-wrap">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={type === "Notes" ? "Give your note a title" : "Add a title"}
                required
              />
              <Icon name="edit" size={17} />
            </div>
          </label>

          <div className="form-field">
            <span>Tags</span>
            <div className="tags editable-tags">
              {tags.map((tag) => (
                <span key={tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                    aria-label={`Remove ${tag} tag`}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-editor">
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag"
              />
              <button type="button" onClick={addTag} disabled={!tagDraft.trim()}>
                <Icon name="plus" size={14} /> Add
              </button>
            </div>
          </div>

          <label className="form-field">
            <span>Collection</span>
            <div className="select-wrap">
              <span className="collection-dot" />
              <select value={collection} onChange={(event) => setCollection(event.target.value)}>
                <option value="">Choose a collection (optional)</option>
                <option>Wishlist</option>
                <option>Recipes</option>
                <option>Personal</option>
                <option>Inspiration</option>
                <option>Work</option>
                <option>Japan 2025</option>
              </select>
              <Icon name="chevron" size={17} />
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={!isValid}>
            <Icon name="spark" size={18} />
            Save to memory
          </button>
        </form>
      </main>
    </div>
  );
}

function SuccessScreen({
  memory,
  onView,
  onHome,
}: {
  memory: Memory;
  onView: () => void;
  onHome: () => void;
}) {
  return (
    <div className="screen success-screen">
      <div className="success-ambient ambient-one" />
      <div className="success-ambient ambient-two" />
      <header className="success-header">
        <button className="brand-lockup" onClick={onHome}>
          <RecallMark size={34} />
          <span>Recall</span>
        </button>
      </header>
      <main>
        <div className="success-mark">
          <div className="success-ring ring-one" />
          <div className="success-ring ring-two" />
          <div className="success-check">
            <Icon name="check" size={33} strokeWidth={2.2} />
          </div>
          <i className="spark-one">
            <Icon name="spark" size={17} />
          </i>
          <i className="spark-two">
            <Icon name="spark" size={12} />
          </i>
        </div>
        <p className="success-kicker">MEMORY ADDED</p>
        <h1>Saved to your memory.</h1>
        <p className="success-subtitle">
          It’s safe here. Search naturally whenever you need to find it again.
        </p>

        <section className="saved-summary">
          <div className="summary-thumb">
            {memory.image ? <img src={memory.image} alt="" /> : <TypeArtwork type={memory.type} />}
          </div>
          <div className="summary-copy">
            <span>{memory.type.slice(0, -1)}</span>
            <strong>{memory.title}</strong>
            <small>
              <span className="collection-dot" /> {memory.collection} · Just now
            </small>
          </div>
          <div className="summary-status">
            <Icon name="check" size={13} />
          </div>
        </section>

        <div className="success-actions">
          <button className="primary-button" onClick={onView}>
            View memory
            <Icon name="arrow-right" size={18} />
          </button>
          <button className="home-link" onClick={onHome}>
            Back to home
          </button>
        </div>
      </main>
      <p className="privacy-note">Private by design · Your memories stay yours</p>
    </div>
  );
}

const deletedMemoryStorageKey = "recall-deleted-memory-ids";
const profileNameStorageKey = "recall-profile-first-name";
const onboardingStorageKey = "recall-onboarding-complete";

function readDeletedMemoryIds() {
  if (typeof window === "undefined") return [] as number[];
  try {
    const storedIds = JSON.parse(window.localStorage.getItem(deletedMemoryStorageKey) || "[]");
    return Array.isArray(storedIds)
      ? storedIds.filter((id): id is number => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

function readProfileName() {
  if (typeof window === "undefined") return "";
  try {
    return (window.localStorage.getItem(profileNameStorageKey) || "").trim();
  } catch {
    return "";
  }
}

function hasCompletedOnboarding() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(onboardingStorageKey) === "true";
  } catch {
    return false;
  }
}

function removeLegacySeedRecords() {
  if (typeof window === "undefined") return;
  for (const key of ["recall-saved-memories", "recall-memory-overrides"]) {
    try {
      const records = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (!Array.isArray(records)) continue;
      const userRecords = records.filter(
        (record: { id?: number }) => typeof record.id !== "number" || !seededDemoIds.has(record.id),
      );
      if (userRecords.length !== records.length) {
        window.localStorage.setItem(key, JSON.stringify(userRecords));
      }
    } catch {
      // Malformed or unavailable storage is left untouched.
    }
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    hasCompletedOnboarding() ? "home" : "welcome",
  );
  const [lastMainTab, setLastMainTab] = useState<MainTab>("home");
  const [profileReturnTab, setProfileReturnTab] = useState<MainTab>("home");
  const [firstName, setFirstName] = useState(readProfileName);
  const [libraryFilter, setLibraryFilter] = useState<MemoryType | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveSession, setSaveSession] = useState(0);
  const [deletedMemoryIds, setDeletedMemoryIds] = useState<number[]>(readDeletedMemoryIds);
  const [toast, setToast] = useState("");
  const [memories, setMemories] = useState<Memory[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const deletedIds = readDeletedMemoryIds();
      const saved = JSON.parse(window.localStorage.getItem("recall-saved-memories") || "[]");
      const storedMemories = Array.isArray(saved)
        ? saved
            .filter((memory: Memory) => !seededDemoIds.has(memory.id))
            .map((memory: Memory, index: number) => ({
              ...memory,
              collection: memory.collection || "Personal",
              createdAt:
                memory.createdAt ||
                (memory.id > 100_000_000_000_000
                  ? Math.floor(memory.id / 1000)
                  : memory.id > 1_000_000_000_000
                    ? memory.id
                    : Date.now() - index),
            }))
        : [];
      return newestFirst(storedMemories).filter((memory) => !deletedIds.includes(memory.id));
    } catch {
      return [];
    }
  });
  const [selected, setSelected] = useState<Memory | null>(null);

  useEffect(() => {
    removeLegacySeedRecords();
  }, []);

  useEffect(() => {
    const userMemories = memories.filter((memory) => !seededDemoIds.has(memory.id));
    try {
      window.localStorage.setItem("recall-saved-memories", JSON.stringify(userMemories));
    } catch {
      try {
        const storageSafeMemories = userMemories.map((memory) => ({
          ...memory,
          image: memory.image?.startsWith("data:") ? undefined : memory.image,
        }));
        window.localStorage.setItem("recall-saved-memories", JSON.stringify(storageSafeMemories));
      } catch {
        // Local persistence is progressive enhancement; in-memory saving still works.
      }
    }
  }, [memories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(deletedMemoryStorageKey, JSON.stringify(deletedMemoryIds));
    } catch {
      // Deletion still applies to the current session if persistence is unavailable.
    }
  }, [deletedMemoryIds]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function navigate(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeOnboarding(name?: string) {
    const cleanedName = name?.trim().replace(/\s+/g, " ") || "";
    const resolvedName = cleanedName || readProfileName();
    try {
      if (cleanedName) {
        window.localStorage.setItem(profileNameStorageKey, cleanedName);
      }
      window.localStorage.setItem(onboardingStorageKey, "true");
    } catch {
      // Personalization remains available for the current session.
    }
    setFirstName(resolvedName);
    setLastMainTab("home");
    navigate("home");
  }

  function openProfile() {
    setProfileReturnTab(lastMainTab);
    navigate("profile");
  }

  function saveProfile(name: string) {
    const cleanedName = name.trim().replace(/\s+/g, " ");
    if (!cleanedName) return;
    try {
      window.localStorage.setItem(profileNameStorageKey, cleanedName);
    } catch {
      // Profile changes remain available for the current session.
    }
    setFirstName(cleanedName);
  }

  function navigateTab(tab: MainTab) {
    setLastMainTab(tab);
    if (tab === "library") setLibraryFilter("All");
    if (tab === "search") setSearchQuery("");
    navigate(tab);
  }

  function openLibrary(filter: MemoryType | "All") {
    setLibraryFilter(filter);
    setLastMainTab("library");
    navigate("library");
  }

  function openSearch(query = "") {
    setSearchQuery(query);
    setLastMainTab("search");
    navigate("search");
  }

  function openMemory(memory: Memory, from: MainTab) {
    setSelected(memory);
    setLastMainTab(from);
    navigate("details");
  }

  function saveMemory(memory: Memory) {
    setMemories((current) => newestFirst([memory, ...current]));
    setSelected(memory);
    navigate("success");
  }

  function updateMemory(updatedMemory: Memory) {
    setMemories((current) =>
      current.map((memory) => (memory.id === updatedMemory.id ? updatedMemory : memory)),
    );
    setSelected(updatedMemory);
  }

  function startNewMemory() {
    if (["home", "search", "library", "ask"].includes(screen)) {
      setLastMainTab(screen as MainTab);
    }
    setSaveSession((current) => current + 1);
    navigate("save");
  }

  function deleteMemory(id: number) {
    setMemories((current) => current.filter((memory) => memory.id !== id));
    setDeletedMemoryIds((current) => (current.includes(id) ? current : [...current, id]));
    setToast("Memory deleted");
    setLastMainTab("home");
    navigate("home");
  }

  return (
    <div className="app-shell">
      <div className="desktop-brand">
        <RecallMark size={52} />
        <h1>Recall</h1>
        <p>Your second memory.</p>
      </div>
      <div className="device-frame">
        {screen === "welcome" && (
          <WelcomeScreen
            onComplete={(name) => completeOnboarding(name)}
            onSkip={() => completeOnboarding()}
          />
        )}
        {screen === "home" && (
          <HomeScreen
            memories={memories}
            firstName={firstName}
            onOpen={(memory) => openMemory(memory, "home")}
            onNavigate={navigateTab}
            onAdd={startNewMemory}
            onLibrary={openLibrary}
            onSearch={openSearch}
            onProfile={openProfile}
          />
        )}
        {screen === "search" && (
          <SearchScreen
            memories={memories}
            initialQuery={searchQuery}
            onOpen={(memory) => openMemory(memory, "search")}
            onNavigate={navigateTab}
            onAdd={startNewMemory}
          />
        )}
        {screen === "library" && (
          <LibraryScreen
            memories={memories}
            initialFilter={libraryFilter}
            onOpen={(memory) => openMemory(memory, "library")}
            onNavigate={navigateTab}
            onAdd={startNewMemory}
          />
        )}
        {screen === "ask" && <AskScreen onNavigate={navigateTab} onAdd={startNewMemory} />}
        {screen === "profile" && (
          <ProfileScreen
            firstName={firstName}
            onBack={() => navigate(profileReturnTab)}
            onSave={saveProfile}
          />
        )}
        {screen === "details" && selected && (
          <DetailsScreen
            memory={selected}
            onBack={() => navigate(lastMainTab)}
            onDelete={deleteMemory}
            onUpdate={updateMemory}
          />
        )}
        {screen === "save" && (
          <SaveScreen key={saveSession} onBack={() => navigate(lastMainTab)} onSave={saveMemory} />
        )}
        {screen === "success" && selected && (
          <SuccessScreen
            memory={selected}
            onView={() => navigate("details")}
            onHome={() => {
              setLastMainTab("home");
              navigate("home");
            }}
          />
        )}
        {toast && (
          <div className="app-toast" role="status">
            <span>
              <Icon name="check" size={14} />
            </span>
            {toast}
          </div>
        )}
      </div>
      <p className="desktop-caption">A calmer place for everything worth remembering.</p>
    </div>
  );
}
