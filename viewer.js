const searchInput = document.getElementById("search");
const sectionFilter = document.getElementById("section-filter");
const purposeEl = document.getElementById("purpose");
const statsEl = document.getElementById("stats");
const overviewEl = document.getElementById("overview");

const sequenceEl = document.getElementById("sequence");
const heuristicsSectionEl = document.getElementById("heuristics");
const heuristicsSummaryEl = document.getElementById("heuristics-summary");
const heuristicDetailEl = document.getElementById("heuristic-detail");
const heuristicsCaptionEl = document.getElementById("heuristics-caption");
const antiPatternsEl = document.getElementById("anti-patterns");

const heuristicPickerControlEl = document.getElementById("heuristic-picker-control");
const heuristicSelectEl = document.getElementById("heuristic-select");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));

const heuristicSummaryTemplate = document.getElementById("heuristic-summary-template");
const antiPatternTemplate = document.getElementById("anti-pattern-template");

let model = null;
let viewMode = "summary";
let selectedHeuristicId = null;

function containsAny(value, query) {
  if (!query) return true;
  return String(value).toLowerCase().includes(query);
}

function normalizeHashId() {
  return decodeURIComponent(window.location.hash.replace(/^#/, "").trim()).toUpperCase();
}

function setViewMode(nextMode) {
  viewMode = nextMode;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewMode);
  });
}

function syncHash() {
  const base = `${window.location.pathname}${window.location.search}`;
  const nextUrl = viewMode === "detail" && selectedHeuristicId ? `${base}#${selectedHeuristicId}` : base;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (currentUrl !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function createEmptyState(message) {
  const card = document.createElement("article");
  card.className = "card empty-state";

  const text = document.createElement("p");
  text.className = "muted";
  text.textContent = message;

  card.appendChild(text);
  return card;
}

function metaPill(label, value) {
  const pill = document.createElement("div");
  pill.className = "meta-pill";

  const tag = document.createElement("span");
  tag.textContent = label;

  const copy = document.createElement("span");
  copy.className = "meta-copy";
  copy.textContent = value;

  pill.append(tag, copy);
  return pill;
}

function block(title, items) {
  const wrap = document.createElement("article");
  wrap.className = "card detail-section";

  const heading = document.createElement("h4");
  heading.className = "section-title";
  heading.textContent = title;

  const list = document.createElement("ul");
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }

  wrap.append(heading, list);
  return wrap;
}

function heuristicSearchText(heuristic) {
  return [
    heuristic.id,
    heuristic.name,
    heuristic.summary,
    ...(heuristic.why_it_matters || []),
    ...(heuristic.signals_of_good_use || []),
    ...(heuristic.failure_modes || []),
    ...(heuristic.agent_instruction_pattern || []),
    ...(heuristic.human_review_questions || []),
    ...(heuristic.when_it_breaks || []),
  ]
    .join(" ")
    .toLowerCase();
}

function antiPatternSearchText(item) {
  return `${item.name} ${item.description}`.toLowerCase();
}

function filteredHeuristics(query) {
  return model.heuristics.filter((heuristic) => containsAny(heuristicSearchText(heuristic), query));
}

function ensureSelectedHeuristic(list) {
  if (!list.length) {
    selectedHeuristicId = null;
    return null;
  }

  if (!selectedHeuristicId || !list.some((heuristic) => heuristic.id === selectedHeuristicId)) {
    selectedHeuristicId = list[0].id;
  }

  return list.find((heuristic) => heuristic.id === selectedHeuristicId) || list[0];
}

function populateHeuristicPicker(list) {
  heuristicSelectEl.innerHTML = "";

  for (const heuristic of list) {
    const option = document.createElement("option");
    option.value = heuristic.id;
    option.textContent = `${heuristic.id} - ${heuristic.name}`;
    heuristicSelectEl.appendChild(option);
  }

  if (selectedHeuristicId) {
    heuristicSelectEl.value = selectedHeuristicId;
  }
}

function renderOverview() {
  overviewEl.innerHTML = "";

  const principle = model.top_level_principle;
  const compactSummary = model.compact_agent_facing_summary;

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = principle.name;

  const title = document.createElement("h2");
  title.textContent = compactSummary.mission;

  const summary = document.createElement("p");
  summary.className = "overview-summary";
  summary.textContent = principle.summary;

  const list = document.createElement("ol");
  list.className = "overview-list";
  for (const item of compactSummary.rules_of_thumb || []) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }

  overviewEl.append(eyebrow, title, summary, list);
}

function renderHeuristicSummaryList(list) {
  heuristicsSummaryEl.innerHTML = "";
  heuristicsSummaryEl.classList.remove("hidden");
  heuristicDetailEl.classList.add("hidden");

  if (!list.length) {
    heuristicsSummaryEl.appendChild(createEmptyState("No heuristics match the current search."));
    return;
  }

  for (const heuristic of list) {
    const node = heuristicSummaryTemplate.content.cloneNode(true);
    node.querySelector(".badge").textContent = heuristic.id;
    node.querySelector("h3").textContent = heuristic.name;
    node.querySelector(".summary").textContent = heuristic.summary;

    const meta = node.querySelector(".summary-meta");
    if (heuristic.why_it_matters?.[0]) {
      meta.appendChild(metaPill("Why", heuristic.why_it_matters[0]));
    }
    if (heuristic.failure_modes?.[0]) {
      meta.appendChild(metaPill("Risk", heuristic.failure_modes[0]));
    }

    node.querySelector(".open-detail").addEventListener("click", () => {
      selectedHeuristicId = heuristic.id;
      setViewMode("detail");
      render();
      heuristicsSectionEl.scrollIntoView({ block: "start" });
    });

    heuristicsSummaryEl.appendChild(node);
  }
}

function renderHeuristicDetail(list) {
  heuristicDetailEl.innerHTML = "";
  heuristicsSummaryEl.classList.add("hidden");
  heuristicDetailEl.classList.remove("hidden");

  if (!list.length) {
    heuristicDetailEl.appendChild(createEmptyState("No heuristics match the current search."));
    return;
  }

  const heuristic = ensureSelectedHeuristic(list);
  const selectedIndex = list.findIndex((item) => item.id === heuristic.id);

  const hero = document.createElement("article");
  hero.className = "detail-hero";

  const top = document.createElement("div");
  top.className = "detail-top";

  const titleWrap = document.createElement("div");
  titleWrap.className = "card-head";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = heuristic.id;

  const title = document.createElement("h3");
  title.className = "detail-title";
  title.textContent = heuristic.name;

  titleWrap.append(badge, title);

  const toolbar = document.createElement("div");
  toolbar.className = "detail-toolbar";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "nav-button";
  previous.textContent = "Previous";
  previous.disabled = selectedIndex <= 0;
  previous.addEventListener("click", () => {
    if (selectedIndex <= 0) return;
    selectedHeuristicId = list[selectedIndex - 1].id;
    render();
  });

  const position = document.createElement("span");
  position.className = "muted";
  position.textContent = `${selectedIndex + 1} of ${list.length}`;

  const next = document.createElement("button");
  next.type = "button";
  next.className = "nav-button";
  next.textContent = "Next";
  next.disabled = selectedIndex >= list.length - 1;
  next.addEventListener("click", () => {
    if (selectedIndex >= list.length - 1) return;
    selectedHeuristicId = list[selectedIndex + 1].id;
    render();
  });

  toolbar.append(previous, position, next);

  const summary = document.createElement("p");
  summary.className = "detail-summary";
  summary.textContent = heuristic.summary;

  const intro = document.createElement("p");
  intro.className = "detail-intro";
  intro.textContent =
    "Each section stays isolated so you can scan rationale, signals, risks, and review prompts without wading through the rest of the catalog.";

  top.append(titleWrap, toolbar);
  hero.append(top, summary, intro);

  const grid = document.createElement("div");
  grid.className = "detail-grid";
  grid.append(
    block("Why It Matters", heuristic.why_it_matters),
    block("Signals of Good Use", heuristic.signals_of_good_use),
    block("Failure Modes", heuristic.failure_modes),
    block("Agent Instruction Pattern", heuristic.agent_instruction_pattern),
    block("Human Review Questions", heuristic.human_review_questions),
    block("When It Breaks", heuristic.when_it_breaks)
  );

  heuristicDetailEl.append(hero, grid);
}

function renderHeuristics(query, selectedSection) {
  if (selectedSection !== "all" && selectedSection !== "heuristics") {
    heuristicsSectionEl.classList.add("hidden");
    heuristicPickerControlEl.classList.add("hidden");
    return 0;
  }

  heuristicsSectionEl.classList.remove("hidden");
  const list = filteredHeuristics(query);

  if (viewMode === "detail") {
    ensureSelectedHeuristic(list);
    populateHeuristicPicker(list);
    heuristicPickerControlEl.classList.toggle("hidden", !list.length);
    renderHeuristicDetail(list);
    heuristicsCaptionEl.textContent = list.length
      ? `Focused on ${selectedHeuristicId}. Search narrows the picker and the Previous/Next controls.`
      : "No matching heuristic is available to focus.";
  } else {
    heuristicPickerControlEl.classList.add("hidden");
    renderHeuristicSummaryList(list);
    heuristicsCaptionEl.textContent = list.length
      ? `${list.length} matching heuristics. Open any card for the full rubric.`
      : "No heuristics match the current search.";
  }

  return list.length;
}

function renderSequence(query, selectedSection) {
  sequenceEl.innerHTML = "";

  if (selectedSection !== "all" && selectedSection !== "sequence") {
    sequenceEl.classList.add("hidden");
    return 0;
  }

  const items = model.recommended_operating_sequence || [];
  const filtered = items.filter((item) => containsAny(item, query));

  if (!filtered.length) {
    sequenceEl.classList.toggle("hidden", selectedSection !== "sequence");
    if (selectedSection === "sequence") {
      sequenceEl.appendChild(createEmptyState("No sequence steps match the current search."));
    }
    return 0;
  }

  sequenceEl.classList.remove("hidden");

  const card = document.createElement("article");
  card.className = "card panel-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "section-kicker";
  eyebrow.textContent = "Operating Sequence";

  const title = document.createElement("h3");
  title.className = "panel-title";
  title.textContent = "Recommended run order";

  const intro = document.createElement("p");
  intro.className = "muted";
  intro.textContent = "This stays compact so the full workflow fits in one scan rather than a long narrative block.";

  const list = document.createElement("ol");
  list.className = "sequence-list";
  for (const item of filtered) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }

  card.append(eyebrow, title, intro, list);
  sequenceEl.appendChild(card);
  return filtered.length;
}

function renderAntiPatterns(query, selectedSection) {
  antiPatternsEl.innerHTML = "";

  if (selectedSection !== "all" && selectedSection !== "anti_patterns") {
    antiPatternsEl.classList.add("hidden");
    return 0;
  }

  antiPatternsEl.classList.remove("hidden");

  const list = (model.anti_patterns || []).filter((item) =>
    containsAny(antiPatternSearchText(item), query)
  );

  const wrapper = document.createElement("article");
  wrapper.className = "card panel-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "section-kicker";
  eyebrow.textContent = "Anti-Patterns";

  const title = document.createElement("h3");
  title.className = "panel-title";
  title.textContent = "Failure shapes to watch for";

  const intro = document.createElement("p");
  intro.className = "muted";
  intro.textContent = "Short descriptions make this a quick review checklist rather than another wall of text.";

  wrapper.append(eyebrow, title, intro);

  if (!list.length) {
    wrapper.appendChild(createEmptyState("No anti-patterns match the current search."));
    antiPatternsEl.appendChild(wrapper);
    return 0;
  }

  const grid = document.createElement("div");
  grid.className = "anti-pattern-grid";

  for (const antiPattern of list) {
    const node = antiPatternTemplate.content.cloneNode(true);
    node.querySelector("h3").textContent = antiPattern.name;
    node.querySelector("p").textContent = antiPattern.description;
    grid.appendChild(node);
  }

  wrapper.appendChild(grid);
  antiPatternsEl.appendChild(wrapper);
  return list.length;
}

function render() {
  if (!model) return;

  const query = searchInput.value.trim().toLowerCase();
  const selectedSection = sectionFilter.value;

  const heuristicCount = renderHeuristics(query, selectedSection);
  const sequenceCount = renderSequence(query, selectedSection);
  const antiPatternCount = renderAntiPatterns(query, selectedSection);

  syncHash();

  const modeLabel = viewMode === "detail" && selectedHeuristicId
    ? `detail view on ${selectedHeuristicId}`
    : "summary list";

  statsEl.textContent = `${heuristicCount} heuristics in ${modeLabel}, ${antiPatternCount} anti-patterns, ${sequenceCount} sequence steps shown.`;
}

function bindEvents() {
  searchInput.addEventListener("input", render);
  sectionFilter.addEventListener("change", render);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setViewMode(button.dataset.view);
      if (!selectedHeuristicId && model?.heuristics?.length) {
        selectedHeuristicId = model.heuristics[0].id;
      }
      render();
    });
  });

  heuristicSelectEl.addEventListener("change", () => {
    selectedHeuristicId = heuristicSelectEl.value;
    setViewMode("detail");
    render();
  });

  window.addEventListener("hashchange", () => {
    const hashId = normalizeHashId();
    if (hashId && model.heuristics.some((heuristic) => heuristic.id === hashId)) {
      selectedHeuristicId = hashId;
      setViewMode("detail");
      render();
    }
  });
}

async function init() {
  try {
    const response = await fetch("./heuristics.json");
    if (!response.ok) {
      throw new Error(`Failed to load heuristics.json (${response.status})`);
    }
    model = await response.json();
  } catch (error) {
    purposeEl.textContent = `Unable to load data: ${error.message}. Start a local server (for example: python3 -m http.server).`;
    statsEl.textContent = "No data available.";
    return;
  }

  const hashId = normalizeHashId();
  if (hashId && model.heuristics.some((heuristic) => heuristic.id === hashId)) {
    selectedHeuristicId = hashId;
    setViewMode("detail");
  } else {
    selectedHeuristicId = model.heuristics[0]?.id || null;
    setViewMode(viewMode);
  }

  purposeEl.textContent = model.purpose;
  renderOverview();
  bindEvents();
  render();
}

init();
