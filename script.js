/* ============================================================
   CP COMPANION — script.js
   All features: Navigation, Contests, CF Profile, LC Profile,
   Planner, Bookmarks, Notes, Daily Challenge, Dark Mode
   ============================================================ */

// ===== STATE =====
const STATE = {
  contests: [],
  bookmarks: JSON.parse(localStorage.getItem('cp_bookmarks') || '[]'),
  tasks: JSON.parse(localStorage.getItem('cp_tasks_' + todayKey()) || '[]'),
  notes: JSON.parse(localStorage.getItem('cp_notes') || '[]'),
  currentNote: null,
  cfData: JSON.parse(localStorage.getItem('cp_cf') || 'null'),
  lcData: JSON.parse(localStorage.getItem('cp_lc') || 'null'),
  currentChallenge: null,
  activeFilter: 'all',
  activeDiff: 'all',
  ratingChartInstance: null,
  countdownIntervals: [],
};

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

// ===== PROBLEM BANK (fetched from LeetCode via public API) =====
// PROBLEMS is populated dynamically; starts empty
let PROBLEMS = [];

// Normalize difficulty — alfa-leetcode-api returns "Easy"/"Medium"/"Hard" strings directly
function normalizeDifficulty(d) {
  if (typeof d === 'string') {
    const s = d.trim();
    if (s === 'Easy' || s === 'Medium' || s === 'Hard') return s;
    // Sometimes returns uppercase: "EASY" etc
    const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    if (cap === 'Easy' || cap === 'Medium' || cap === 'Hard') return cap;
  }
  // Fallback for numeric (legacy)
  return d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Hard';
}

// Fetch random LeetCode problems using alfa-leetcode-api (public CORS-friendly proxy)
async function fetchLCProblems(count = 60) {
  try {
    const total = 3300;
    const skip = Math.floor(Math.random() * (total - count));
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/problems?limit=${count}&skip=${skip}`);
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    // API wraps in { problemsetQuestionList: [...] }
    const raw = data.problemsetQuestionList || data.problems || data || [];
    const problems = raw.map((p, i) => ({
      id: p.frontendQuestionId || p.questionFrontendId || (skip + i + 1),
      name: p.title || p.questionTitle || 'Untitled',
      difficulty: normalizeDifficulty(p.difficulty),
      topic: (p.topicTags?.[0]?.name) || 'General',
      url: `https://leetcode.com/problems/${p.titleSlug || p.questionTitleSlug}/`,
      platform: 'LeetCode',
      desc: p.content
        ? p.content.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 160)
        : (p.title || ''),
    })).filter(p => p.name && p.name !== 'Untitled');
    return problems;
  } catch (e) {
    console.warn('LeetCode problems API failed:', e);
    return [];
  }
}

async function ensureProblems() {
  if (PROBLEMS.length > 0) return;
  PROBLEMS = await fetchLCProblems(50);
}

// ===== CONTEST DATA (Codeforces + LeetCode real APIs) =====

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseCFDivision(name) {
  const match = name.match(/Div\.\s*\d+/i);
  return match ? match[0] : '';
}

// Codeforces upcoming contests
async function fetchCFContests() {
  try {
    const res = await fetch('https://codeforces.com/api/contest.list?gym=false');
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.result
      .filter(c => c.phase === 'BEFORE')
      .slice(0, 15)
      .map(c => ({
        id: 'cf' + c.id,
        name: c.name,
        platform: 'codeforces',
        platformLabel: 'Codeforces',
        startTime: c.startTimeSeconds * 1000,
        duration: formatDuration(c.durationSeconds),
        url: `https://codeforces.com/contest/${c.id}`,
        division: parseCFDivision(c.name),
      }));
  } catch (e) {
    console.warn('CF API failed:', e);
    return [];
  }
}

// LeetCode upcoming contests via alfa-leetcode-api
async function fetchLCContests() {
  try {
    const res = await fetch('https://alfa-leetcode-api.onrender.com/contests/upcoming');
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    // Response: { contests: [ { title, titleSlug, startTime, duration, ... } ] }
    const list = data.contests || data.upcomingContests || data || [];
    return list.map((c, i) => {
      const startMs = (c.startTime || c.startTimeSeconds)
        ? (c.startTime > 1e10 ? c.startTime : c.startTime * 1000)
        : Date.now() + (i + 1) * 86400000;
      const durSec = c.duration || c.durationSeconds || 5400;
      return {
        id: 'lc_' + (c.titleSlug || i),
        name: c.title,
        platform: 'leetcode',
        platformLabel: 'LeetCode',
        startTime: startMs,
        duration: formatDuration(durSec),
        url: `https://leetcode.com/contest/${c.titleSlug || ''}`,
        division: '',
      };
    }).filter(c => c.name);
  } catch (e) {
    console.warn('LeetCode contests API failed:', e);
    return [];
  }
}

async function fetchContests() {
  const grid = document.getElementById('contestsGrid');
  if (grid) grid.innerHTML = '<div class="loading-pulse">Fetching live contests...</div>';

  const [cfContests, lcContests] = await Promise.all([
    fetchCFContests(),
    fetchLCContests(),
  ]);

  const all = [...cfContests, ...lcContests].sort((a, b) => a.startTime - b.startTime);
  return all;
}
// ===== NAVIGATION =====
function initNav() {
  document.querySelectorAll('.nav-item, .card-link, [data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const page = el.dataset.page;
      if (page) navigateTo(page);
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  closeSidebar();

  if (page === 'dashboard') renderDashboard();
  if (page === 'contests') renderContests();
  if (page === 'planner') renderPlanner();
  if (page === 'bookmarks') renderBookmarks();
  if (page === 'notes') renderNotes();
  if (page === 'challenge') renderChallenge();
}

// ===== CLOCK =====
function startClock() {
  function tick() {
    const now = new Date();
    const el = document.getElementById('currentTime');
    if (el) {
      el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  tick();
  setInterval(tick, 1000);
}

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('cp_theme') || 'dark';
  setTheme(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('themeToggleMobile').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('cp_theme', theme);
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  const mobileBtn = document.getElementById('themeToggleMobile');
  if (theme === 'dark') {
    if (icon) icon.textContent = '☀️';
    if (text) text.textContent = 'Light Mode';
    if (mobileBtn) mobileBtn.textContent = '☀️';
  } else {
    if (icon) icon.textContent = '🌙';
    if (text) text.textContent = 'Dark Mode';
    if (mobileBtn) mobileBtn.textContent = '🌙';
  }

  if (STATE.ratingChartInstance) {
    STATE.ratingChartInstance.options.scales.y.grid.color = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    STATE.ratingChartInstance.options.scales.x.grid.color = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    STATE.ratingChartInstance.update();
  }
}

// ===== MOBILE SIDEBAR =====
function initMobileSidebar() {
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  menuBtn.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ===== TOAST =====
function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== COUNTDOWN =====
function startCountdown(startTime, el) {
  let iv;
  function update() {
    const diff = startTime - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<div class="cd-unit"><span class="cd-val">🔴</span><span class="cd-label">Live</span></div>';
      // Clear this interval now that the contest has started
      clearInterval(iv);
      STATE.countdownIntervals = STATE.countdownIntervals.filter(i => i !== iv);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.innerHTML = `
      <div class="cd-unit"><span class="cd-val">${String(d).padStart(2, '0')}</span><span class="cd-label">Days</span></div>
      <div class="cd-unit"><span class="cd-val">${String(h).padStart(2, '0')}</span><span class="cd-label">Hrs</span></div>
      <div class="cd-unit"><span class="cd-val">${String(m).padStart(2, '0')}</span><span class="cd-label">Min</span></div>
      <div class="cd-unit"><span class="cd-val">${String(s).padStart(2, '0')}</span><span class="cd-label">Sec</span></div>
    `;
  }
  update();
  iv = setInterval(update, 1000);
  STATE.countdownIntervals.push(iv);
  return iv;
}

// Clear all countdown intervals
function clearCountdowns() {
  STATE.countdownIntervals.forEach(iv => clearInterval(iv));
  STATE.countdownIntervals = [];
}

// ===== PLATFORM CLASS =====
function platformClass(p) {
  return { codeforces: 'platform-cf', leetcode: 'platform-lc', atcoder: 'platform-ac', codechef: 'platform-cc' }[p] || 'platform-cc';
}

function platformEmoji(p) {
  return { codeforces: '⚔️', leetcode: '🧩', atcoder: '🌸', codechef: '🍴' }[p] || '🏆';
}

// ===== CONTEST CARD HTML =====
function contestCardHTML(c) {
  const isBookmarked = STATE.bookmarks.some(b => b.id === c.id);
  return `
    <div class="contest-card" data-id="${c.id}">
      <div class="contest-card-top">
        <div class="contest-platform ${platformClass(c.platform)}">
          ${platformEmoji(c.platform)} ${c.platformLabel}
        </div>
        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-id="${c.id}" title="${isBookmarked ? 'Remove bookmark' : 'Bookmark'}">
          ${isBookmarked ? '⭐' : '☆'}
        </button>
      </div>
      <div class="contest-name">${c.name}</div>
      <div class="countdown-display" id="cd-${c.id}">
        <div class="loading-pulse">Loading...</div>
      </div>
      <div class="contest-actions">
        <a href="${c.url}" target="_blank" class="btn-register">Register →</a>
        <button class="btn-note" data-contest="${c.name}">📝 Note</button>
      </div>
    </div>
  `;
}

// ===== CONTESTS PAGE =====
async function renderContests() {
  clearCountdowns();
  const grid = document.getElementById('contestsGrid');

  if (!STATE.contests.length) {
    grid.innerHTML = '<div class="loading-pulse">Fetching live contests...</div>';
    STATE.contests = await fetchContests();
  }

  let list = STATE.activeFilter === 'all' ? STATE.contests : STATE.contests.filter(c => c.platform === STATE.activeFilter);

  if (!list.length) {
    grid.innerHTML = '<div class="loading-pulse">No contests found for this filter.</div>';
    return;
  }

  grid.innerHTML = list.map(contestCardHTML).join('');

  // Start countdowns
  list.forEach(c => {
    const el = document.getElementById('cd-' + c.id);
    if (el) startCountdown(c.startTime, el);
  });

  // Bookmark buttons
  grid.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBookmark(btn.dataset.id);
      renderContests();
    });
  });

  // Note buttons
  grid.querySelectorAll('.btn-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const contestName = btn.dataset.contest;
      addNoteForContest(contestName);
    });
  });
}

function initContestsPage() {
  document.getElementById('refreshContests').addEventListener('click', async () => {
    STATE.contests = [];
    STATE.contests = await fetchContests();
    renderContests();
    showToast('Contests refreshed!');
  });

  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeFilter = btn.dataset.filter;
      renderContests();
    });
  });
}

// ===== BOOKMARKS =====
function toggleBookmark(id) {
  const contest = STATE.contests.find(c => c.id === id);
  if (!contest) return;
  const idx = STATE.bookmarks.findIndex(b => b.id === id);
  if (idx >= 0) {
    STATE.bookmarks.splice(idx, 1);
    showToast('Bookmark removed');
  } else {
    STATE.bookmarks.push(contest);
    showToast('⭐ Contest bookmarked!');
  }
  localStorage.setItem('cp_bookmarks', JSON.stringify(STATE.bookmarks));
  updateDashboardStats();
}

function renderBookmarks() {
  clearCountdowns();
  const el = document.getElementById('bookmarksList');
  if (!STATE.bookmarks.length) {
    el.innerHTML = `
      <div class="empty-state card">
        <div class="empty-icon">⭐</div>
        <p>No bookmarks yet. Star contests from the Contests page!</p>
        <a href="#" class="btn-primary" data-page="contests">Browse Contests</a>
      </div>
    `;
    el.querySelector('[data-page]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('contests'); });
    return;
  }

  el.innerHTML = `<div class="bookmarks-grid">${STATE.bookmarks.map(contestCardHTML).join('')}</div>`;

  STATE.bookmarks.forEach(c => {
    const cdEl = document.getElementById('cd-' + c.id);
    if (cdEl) startCountdown(c.startTime, cdEl);
  });

  el.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBookmark(btn.dataset.id);
      renderBookmarks();
    });
  });
}

// ===== CODEFORCES =====
function initCFPage() {
  document.getElementById('fetchCF').addEventListener('click', fetchCFProfile);
  document.getElementById('cfHandle').addEventListener('keydown', e => { if (e.key === 'Enter') fetchCFProfile(); });

  if (STATE.cfData) {
    renderCFProfile(STATE.cfData.info, STATE.cfData.ratings);
  }
}

async function fetchCFProfile() {
  const handle = document.getElementById('cfHandle').value.trim();
  if (!handle) return;

  const btn = document.getElementById('fetchCF');
  btn.textContent = 'Loading...';
  btn.disabled = true;

  try {
    const [infoRes, ratingRes] = await Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
      fetch(`https://codeforces.com/api/user.rating?handle=${handle}`)
    ]);

    const infoData = await infoRes.json();
    const ratingData = await ratingRes.json();

    if (infoData.status !== 'OK') throw new Error('User not found');

    const info = infoData.result[0];
    const ratings = ratingData.status === 'OK' ? ratingData.result : [];

    STATE.cfData = { info, ratings };
    localStorage.setItem('cp_cf', JSON.stringify(STATE.cfData));

    renderCFProfile(info, ratings);
    updateDashboardQuickStats();
    document.getElementById('cfError').classList.add('hidden');
  } catch (err) {
    document.getElementById('cfProfile').classList.add('hidden');
    document.getElementById('cfError').classList.remove('hidden');
  }

  btn.textContent = 'Fetch Profile';
  btn.disabled = false;
}

function renderCFProfile(info, ratings) {
  document.getElementById('cfProfile').classList.remove('hidden');

  const initials = (info.firstName?.[0] || info.handle[0]).toUpperCase();
  document.getElementById('cfAvatar').textContent = initials;
  document.getElementById('cfName').textContent = (info.firstName || '') + ' ' + (info.lastName || '') + ' (@' + info.handle + ')';
  document.getElementById('cfRankBadge').textContent = info.rank || 'Unrated';
  document.getElementById('cfRating').textContent = info.rating || '—';
  document.getElementById('cfMaxRating').textContent = info.maxRating || '—';
  document.getElementById('cfContributions').textContent = info.contribution || 0;
  document.getElementById('cfFriends').textContent = info.friendOfCount || 0;

  // Color rank badge
  const badge = document.getElementById('cfRankBadge');
  const rankColors = {
    'legendary grandmaster': '#ff0000', 'international grandmaster': '#ff3333',
    'grandmaster': '#ff3333', 'international master': '#ffaa00',
    'master': '#ffaa00', 'candidate master': '#aa00aa',
    'expert': '#0000ff', 'specialist': '#03a89e',
    'pupil': '#008000', 'newbie': '#808080',
  };
  const color = rankColors[(info.rank || '').toLowerCase()] || '#6c63ff';
  badge.style.background = 'none';
  badge.style.border = `2px solid ${color}`;
  badge.style.color = color;
  badge.style['-webkit-text-fill-color'] = color;

  if (ratings.length > 0) {
    renderRatingChart(ratings);
  }
}

function renderRatingChart(ratings) {
  const ctx = document.getElementById('ratingChart');
  if (!ctx) return;

  if (STATE.ratingChartInstance) STATE.ratingChartInstance.destroy();

  const recent = ratings.slice(-20);
  const labels = recent.map(r => {
    const d = new Date(r.ratingUpdateTimeSeconds * 1000);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  });
  const data = recent.map(r => r.newRating);

  const isDark = document.documentElement.dataset.theme !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#8892b0' : '#4a5568';

  STATE.ratingChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Rating',
        data,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.08)',
        pointBackgroundColor: '#6c63ff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 10 } } },
      }
    }
  });
}

// ===== LEETCODE =====
function initLCPage() {
  document.getElementById('fetchLC').addEventListener('click', fetchLCProfile);
  document.getElementById('lcHandle').addEventListener('keydown', e => { if (e.key === 'Enter') fetchLCProfile(); });

  if (STATE.lcData) {
    renderLCProfile(STATE.lcData);
  }
}

async function fetchLCProfile() {
  const handle = document.getElementById('lcHandle').value.trim();
  if (!handle) return;

  const btn = document.getElementById('fetchLC');
  btn.textContent = 'Loading...';
  btn.disabled = true;

  // Normalize response from any API into a common shape
  function normalize(d) {
    return {
      totalSolved: d.totalSolved ?? d.solvedProblem ?? 0,
      easySolved: d.easySolved ?? d.easySolvedProblem ?? 0,
      mediumSolved: d.mediumSolved ?? d.mediumSolvedProblem ?? 0,
      hardSolved: d.hardSolved ?? d.hardSolvedProblem ?? 0,
      totalQuestions: d.totalQuestions ?? 0,
      ranking: d.ranking ?? d.ranking ?? null,
      acceptanceRate: d.acceptanceRate ?? null,
      contestRating: d.contestRating ?? null,
      globalRanking: d.globalRanking ?? d.ranking ?? null,
      attendedContestsCount: d.attendedContestsCount ?? null,
    };
  }

  // API 1 — tashif.codes (primary, actively maintained Flask app)
  async function tryTashif() {
    const r = await fetch(`https://leetcode-stats.tashif.codes/${handle}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (d.status !== 'success' || (!d.totalSolved && d.totalSolved !== 0)) throw new Error('bad response');
    return normalize(d);
  }

  // API 2 — leetcode-api vercel (FastAPI wrapper, recent project)
  async function tryVercel() {
    const r = await fetch(`https://leetcode-api-pied.vercel.app/${handle}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (!d.totalSolved && !d.solvedProblem) throw new Error('bad response');
    return normalize(d);
  }

  // API 3 — leetcode-stats-api.herokuapp.com (original, sometimes works)
  async function tryHeroku() {
    const r = await fetch(`https://leetcode-stats-api.herokuapp.com/${handle}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (d.status === 'error' || (!d.totalSolved && d.totalSolved !== 0)) throw new Error('bad response');
    return normalize(d);
  }

  let mapped = null;
  const attempts = [tryTashif, tryVercel, tryHeroku];
  for (const attempt of attempts) {
    try {
      mapped = await attempt();
      break;
    } catch {
      // try next
    }
  }

  if (mapped) {
    STATE.lcData = mapped;
    localStorage.setItem('cp_lc', JSON.stringify(mapped));
    renderLCProfile(mapped);
    document.getElementById('lcError').classList.add('hidden');
    document.getElementById('lcProfile').classList.remove('hidden');
    updateDashboardQuickStats();
  } else {
    document.getElementById('lcProfile').classList.add('hidden');
    document.getElementById('lcError').textContent =
      'Could not fetch profile. LeetCode community APIs can be flaky — try again in a moment, or check that your username is correct.';
    document.getElementById('lcError').classList.remove('hidden');
  }

  btn.textContent = 'Fetch Profile';
  btn.disabled = false;
}

function renderLCProfile(data) {
  document.getElementById('lcProfile').classList.remove('hidden');
  document.getElementById('lcEasy').textContent = data.easySolved ?? '—';
  document.getElementById('lcMedium').textContent = data.mediumSolved ?? '—';
  document.getElementById('lcHard').textContent = data.hardSolved ?? '—';
  document.getElementById('lcTotal').textContent = data.totalSolved ?? '—';
  document.getElementById('lcContestRating').textContent = data.contestRating ? Math.round(data.contestRating) : '—';
  document.getElementById('lcGlobalRank').textContent = data.globalRanking ? '#' + data.globalRanking.toLocaleString() : '—';
  document.getElementById('lcContestsAttended').textContent = data.attendedContestsCount ?? '—';
}

// ===== DAILY PLANNER =====
function initPlannerPage() {
  document.getElementById('addTask').addEventListener('click', addTask);
  document.getElementById('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
}

function addTask() {
  const input = document.getElementById('taskInput');
  const cat = document.getElementById('taskCategory').value;
  const text = input.value.trim();
  if (!text) return;

  const task = { id: Date.now(), text, cat, done: false };
  STATE.tasks.push(task);
  saveTasks();
  renderPlanner();
  input.value = '';
  input.focus();
}

function saveTasks() {
  localStorage.setItem('cp_tasks_' + todayKey(), JSON.stringify(STATE.tasks));
  updateDashboardStats();
}

function clearCompleted() {
  STATE.tasks = STATE.tasks.filter(t => !t.done);
  saveTasks();
  renderPlanner();
  showToast('Completed tasks cleared!');
}

function renderPlanner() {
  const date = new Date();
  document.getElementById('plannerDate').textContent = date.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const list = document.getElementById('taskList');
  const done = STATE.tasks.filter(t => t.done).length;
  const total = STATE.tasks.length;

  document.getElementById('progressText').textContent = `${done} / ${total} completed`;
  document.getElementById('progressBar').style.width = total ? (done / total * 100) + '%' : '0%';

  if (!total) {
    list.innerHTML = '<div class="empty-state">No goals yet. Add one above! 🚀</div>';
    return;
  }

  list.innerHTML = STATE.tasks.map(t => `
    <div class="task-item" data-id="${t.id}">
      <div class="task-check ${t.done ? 'checked' : ''}" data-toggle="${t.id}"></div>
      <span class="task-text ${t.done ? 'done' : ''}">${t.text}</span>
      <span class="task-cat cat-${t.cat}">${t.cat.toUpperCase()}</span>
      <button class="task-del" data-del="${t.id}">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.toggle);
      const task = STATE.tasks.find(t => t.id === id);
      if (task) { task.done = !task.done; saveTasks(); renderPlanner(); }
    });
  });

  list.querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.del);
      STATE.tasks = STATE.tasks.filter(t => t.id !== id);
      saveTasks();
      renderPlanner();
    });
  });
}

// ===== NOTES =====
function initNotesPage() {
  document.getElementById('newNote').addEventListener('click', createNewNote);
}

function createNewNote() {
  const note = { id: Date.now(), title: 'New Note', body: '', created: Date.now() };
  STATE.notes.unshift(note);
  saveNotes();
  renderNotes();
  openNote(note.id);
}

function saveNotes() {
  localStorage.setItem('cp_notes', JSON.stringify(STATE.notes));
  updateDashboardStats();
}

function openNote(id) {
  STATE.currentNote = id;
  const note = STATE.notes.find(n => n.id === id);
  if (!note) return;

  document.querySelectorAll('.note-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === id);
  });

  const editor = document.getElementById('noteEditor');
  editor.innerHTML = `
    <div class="note-edit-area">
      <input type="text" class="note-title-input" value="${note.title}" placeholder="Note title..." id="noteTitle" />
      <textarea class="note-body-input" placeholder="Write your thoughts, algorithms, approaches..." id="noteBody">${note.body}</textarea>
      <div class="note-actions">
        <button class="btn-danger" id="deleteNote">🗑 Delete</button>
        <button class="btn-save" id="saveNote">💾 Save</button>
      </div>
    </div>
  `;

  document.getElementById('saveNote').addEventListener('click', () => {
    note.title = document.getElementById('noteTitle').value || 'Untitled';
    note.body = document.getElementById('noteBody').value;
    saveNotes();
    renderNotes();
    openNote(id);
    showToast('Note saved!');
  });

  document.getElementById('deleteNote').addEventListener('click', () => {
    STATE.notes = STATE.notes.filter(n => n.id !== id);
    STATE.currentNote = null;
    saveNotes();
    renderNotes();
    document.getElementById('noteEditor').innerHTML = '<div class="editor-placeholder">Select a note or create a new one</div>';
  });

  // Auto-save on type
  let autoSaveTimer;
  document.getElementById('noteBody').addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      note.title = document.getElementById('noteTitle')?.value || 'Untitled';
      note.body = document.getElementById('noteBody')?.value || '';
      saveNotes();
    }, 1000);
  });
}

function addNoteForContest(contestName) {
  const note = { id: Date.now(), title: `Notes: ${contestName}`, body: '', created: Date.now() };
  STATE.notes.unshift(note);
  saveNotes();
  navigateTo('notes');
  setTimeout(() => openNote(note.id), 100);
  showToast('📝 Note created for contest!');
}

function renderNotes() {
  const list = document.getElementById('notesList');
  if (!STATE.notes.length) {
    list.innerHTML = '<div class="empty-state">No notes yet. Create one! 📝</div>';
    return;
  }

  list.innerHTML = STATE.notes.map(n => `
    <div class="note-item ${STATE.currentNote === n.id ? 'active' : ''}" data-id="${n.id}">
      <div class="note-item-title">${n.title || 'Untitled'}</div>
      <div class="note-item-preview">${n.body ? n.body.slice(0, 60) + '...' : 'Empty note'}</div>
    </div>
  `).join('');

  list.querySelectorAll('.note-item').forEach(el => {
    el.addEventListener('click', () => openNote(parseInt(el.dataset.id)));
  });
}

// ===== DAILY CHALLENGE =====
function initChallengePage() {
  document.getElementById('newChallenge').addEventListener('click', async () => {
    // Clear today's saved challenge so a fresh one is picked
    localStorage.removeItem('cp_challenge_' + todayKey());
    await pickRandomChallenge();
  });

  document.querySelectorAll('.filter-btn[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-diff]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeDiff = btn.dataset.diff;
      renderProblemBank();
    });
  });
}

async function pickRandomChallenge(problem) {
  await ensureProblems();
  const pool = problem ? [problem] : PROBLEMS;
  if (!pool.length) return;
  const p = pool[Math.floor(Math.random() * pool.length)];
  STATE.currentChallenge = p;
  renderChallengeCard(p);
  renderProblemBank();
  localStorage.setItem('cp_challenge_' + todayKey(), JSON.stringify(p));
}

async function renderChallenge() {
  await ensureProblems();
  const saved = localStorage.getItem('cp_challenge_' + todayKey());
  if (saved) {
    STATE.currentChallenge = JSON.parse(saved);
    renderChallengeCard(STATE.currentChallenge);
  } else {
    await pickRandomChallenge();
  }
  renderProblemBank();
}

function renderChallengeCard(p) {
  const card = document.getElementById('challengeCard');
  card.innerHTML = `
    <div class="challenge-header">
      <div class="challenge-title">${p.name}</div>
      <div class="diff-badge diff-${p.difficulty}">${p.difficulty}</div>
    </div>
    <div class="challenge-meta">
      <span class="meta-tag">📂 ${p.topic}</span>
      <span class="meta-tag">🌐 ${p.platform}</span>
    </div>
    <div class="challenge-desc">${p.desc}</div>
    <a href="${p.url}" target="_blank" class="btn-open">Open Problem →</a>
  `;
}

function renderProblemBank() {
  const bank = document.getElementById('problemBank');
  if (!PROBLEMS.length) {
    bank.innerHTML = '<div class="loading-pulse">Loading problems...</div>';
    return;
  }
  const list = STATE.activeDiff === 'all' ? PROBLEMS : PROBLEMS.filter(p => p.difficulty === STATE.activeDiff);
  bank.innerHTML = list.map(p => `
    <div class="problem-item ${STATE.currentChallenge?.id === p.id ? 'active-problem' : ''}" data-pid="${p.id}">
      <div class="prob-diff-dot dot-${p.difficulty}"></div>
      <div class="prob-name">${p.name}</div>
      <div class="prob-tag">${p.topic}</div>
    </div>
  `).join('');

  bank.querySelectorAll('.problem-item').forEach(el => {
    el.addEventListener('click', () => {
      const pid = el.dataset.pid;
      const prob = PROBLEMS.find(p => String(p.id) === String(pid));
      if (prob) {
        STATE.currentChallenge = prob;
        renderChallengeCard(prob);
        localStorage.setItem('cp_challenge_' + todayKey(), JSON.stringify(prob));
        renderProblemBank();
      }
    });
  });
}

// ===== DASHBOARD =====
async function renderDashboard() {
  if (!STATE.contests.length) {
    STATE.contests = await fetchContests();
  }

  updateDashboardStats();
  renderDashNextContest();
  renderDashGoals();
  await renderDashChallenge();
  updateDashboardQuickStats();
}

function updateDashboardStats() {
  document.getElementById('upcomingCount').textContent = STATE.contests.length;
  document.getElementById('bookmarkCount').textContent = STATE.bookmarks.length;
  document.getElementById('notesCount').textContent = STATE.notes.length;
  const done = STATE.tasks.filter(t => t.done).length;
  document.getElementById('solvedToday').textContent = STATE.tasks.length ? `${done}/${STATE.tasks.length}` : '0';
}

function renderDashNextContest() {
  const el = document.getElementById('dashNextContest');
  clearCountdowns();
  if (!STATE.contests.length) { el.innerHTML = '<div class="loading-pulse">No contests found</div>'; return; }
  const next = STATE.contests[0];
  el.innerHTML = `
    <div style="margin-bottom:10px;">
      <div class="contest-platform ${platformClass(next.platform)}" style="display:inline-flex;margin-bottom:8px;">${platformEmoji(next.platform)} ${next.platformLabel}</div>
      <div style="font-weight:700;font-size:15px;margin-bottom:12px;">${next.name}</div>
      <div class="countdown-display" id="cd-dash"></div>
    </div>
    <a href="${next.url}" target="_blank" class="btn-register" style="display:inline-block;text-decoration:none;">Register →</a>
  `;
  const cdEl = document.getElementById('cd-dash');
  if (cdEl) startCountdown(next.startTime, cdEl);
}

function renderDashGoals() {
  const el = document.getElementById('dashGoals');
  if (!STATE.tasks.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No goals today. <a href="#" style="color:var(--accent);text-decoration:none;" data-page="planner">Add some →</a></div>';
    el.querySelector('[data-page]')?.addEventListener('click', e => { e.preventDefault(); navigateTo('planner'); });
    return;
  }
  const recent = STATE.tasks.slice(0, 4);
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${recent.map(t => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:14px;">${t.done ? '✅' : '⬜'}</span>
          <span style="font-size:13px;${t.done ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${t.text}</span>
          <span class="task-cat cat-${t.cat}" style="margin-left:auto;">${t.cat.toUpperCase()}</span>
        </div>
      `).join('')}
      ${STATE.tasks.length > 4 ? `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding-top:4px;">+${STATE.tasks.length - 4} more goals</div>` : ''}
    </div>
  `;
}

async function renderDashChallenge() {
  const el = document.getElementById('dashChallenge');
  el.innerHTML = '<div class="loading-pulse">Loading challenge...</div>';

  await ensureProblems();
  const saved = localStorage.getItem('cp_challenge_' + todayKey());
  let p = saved ? JSON.parse(saved) : null;
  if (!p && PROBLEMS.length) {
    p = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
    localStorage.setItem('cp_challenge_' + todayKey(), JSON.stringify(p));
  }
  if (!p) { el.innerHTML = '<div class="loading-pulse">No challenge available.</div>'; return; }

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:700;font-size:15px;">${p.name}</div>
        <div class="diff-badge diff-${p.difficulty}">${p.difficulty}</div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);">${(p.desc || '').slice(0, 100)}...</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="${p.url}" target="_blank" class="btn-register" style="flex:1;min-width:100px;text-decoration:none;text-align:center;">Open →</a>
      </div>
    </div>
  `;
}

function updateDashboardQuickStats() {
  const el = document.getElementById('dashProfile');
  const cf = STATE.cfData?.info;
  const lc = STATE.lcData;

  if (!cf && !lc) {
    el.innerHTML = `
      <div class="quick-profile-empty">
        <p>Set up your profiles to see stats here</p>
        <div class="quick-profile-btns">
          <a href="#" class="btn-small" data-page="codeforces">Codeforces</a>
          <a href="#" class="btn-small" data-page="leetcode">LeetCode</a>
        </div>
      </div>
    `;
    el.querySelectorAll('[data-page]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); navigateTo(a.dataset.page); });
    });
    return;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:14px;">';
  if (cf) {
    html += `
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--cf-blue);margin-bottom:8px;">⚔️ Codeforces</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <div class="pstat"><div class="pstat-val">${cf.rating || '—'}</div><div class="pstat-label">Rating</div></div>
          <div class="pstat"><div class="pstat-val">${cf.maxRating || '—'}</div><div class="pstat-label">Max</div></div>
          <div class="pstat"><div class="pstat-val" style="font-size:14px;">${cf.rank || '—'}</div><div class="pstat-label">Rank</div></div>
        </div>
      </div>
    `;
  }
  if (lc) {
    html += `
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f5a623;margin-bottom:8px;">🧩 LeetCode</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <div class="pstat"><div class="pstat-val" style="color:var(--easy)">${lc.easySolved ?? '—'}</div><div class="pstat-label">Easy</div></div>
          <div class="pstat"><div class="pstat-val" style="color:var(--medium)">${lc.mediumSolved ?? '—'}</div><div class="pstat-label">Medium</div></div>
          <div class="pstat"><div class="pstat-val" style="color:var(--hard)">${lc.hardSolved ?? '—'}</div><div class="pstat-label">Hard</div></div>
        </div>
      </div>
    `;
  }
  html += '</div>';
  el.innerHTML = html;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Init all features
  initNav();
  initTheme();
  initMobileSidebar();
  startClock();
  initContestsPage();
  initCFPage();
  initLCPage();
  initPlannerPage();
  initNotesPage();
  initChallengePage();

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = `${greeting}, Coder 👋`;

  // Fetch real contests then render dashboard
  STATE.contests = await fetchContests();
  renderDashboard();
});
