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

// ===== PROBLEM BANK =====
const PROBLEMS = [
  { id: 1, name: "Two Sum", difficulty: "Easy", topic: "Array", url: "https://leetcode.com/problems/two-sum/", platform: "LeetCode", desc: "Given an array of integers and a target, return indices of the two numbers that add up to the target." },
  { id: 2, name: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Array", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", platform: "LeetCode", desc: "Find the maximum profit you can achieve by buying and selling a stock on different days." },
  { id: 3, name: "Climbing Stairs", difficulty: "Easy", topic: "DP", url: "https://leetcode.com/problems/climbing-stairs/", platform: "LeetCode", desc: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps." },
  { id: 4, name: "Maximum Subarray", difficulty: "Medium", topic: "DP", url: "https://leetcode.com/problems/maximum-subarray/", platform: "LeetCode", desc: "Find the contiguous subarray with the largest sum (Kadane's Algorithm)." },
  { id: 5, name: "Longest Palindromic Substring", difficulty: "Medium", topic: "DP", url: "https://leetcode.com/problems/longest-palindromic-substring/", platform: "LeetCode", desc: "Given a string, return the longest palindromic substring." },
  { id: 6, name: "Container With Most Water", difficulty: "Medium", topic: "Two Pointers", url: "https://leetcode.com/problems/container-with-most-water/", platform: "LeetCode", desc: "Find two lines that together with x-axis forms a container that contains the most water." },
  { id: 7, name: "Merge k Sorted Lists", difficulty: "Hard", topic: "Linked List", url: "https://leetcode.com/problems/merge-k-sorted-lists/", platform: "LeetCode", desc: "Merge k sorted linked lists and return it as one sorted list." },
  { id: 8, name: "Trapping Rain Water", difficulty: "Hard", topic: "Two Pointers", url: "https://leetcode.com/problems/trapping-rain-water/", platform: "LeetCode", desc: "Given n non-negative integers representing an elevation map, compute how much water it can trap after raining." },
  { id: 9, name: "Valid Parentheses", difficulty: "Easy", topic: "Stack", url: "https://leetcode.com/problems/valid-parentheses/", platform: "LeetCode", desc: "Given a string containing just '(', ')', '{', '}', '[', ']', determine if the input string is valid." },
  { id: 10, name: "Coin Change", difficulty: "Medium", topic: "DP", url: "https://leetcode.com/problems/coin-change/", platform: "LeetCode", desc: "Given coins of certain denominations, find the fewest number of coins needed to make up the amount." },
  { id: 11, name: "Word Break", difficulty: "Medium", topic: "DP", url: "https://leetcode.com/problems/word-break/", platform: "LeetCode", desc: "Given a string and a dictionary, determine if the string can be segmented into valid words." },
  { id: 12, name: "Number of Islands", difficulty: "Medium", topic: "DFS/BFS", url: "https://leetcode.com/problems/number-of-islands/", platform: "LeetCode", desc: "Given a 2D grid map of 1s (land) and 0s (water), count the number of islands." },
  { id: 13, name: "Find Median from Data Stream", difficulty: "Hard", topic: "Heap", url: "https://leetcode.com/problems/find-median-from-data-stream/", platform: "LeetCode", desc: "Design a data structure that supports adding integers from a data stream and finding the median." },
  { id: 14, name: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "BFS", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", platform: "LeetCode", desc: "Given a binary tree, return the level order traversal of its nodes' values." },
  { id: 15, name: "LRU Cache", difficulty: "Medium", topic: "Design", url: "https://leetcode.com/problems/lru-cache/", platform: "LeetCode", desc: "Design a data structure that follows the Least Recently Used (LRU) cache constraint." },
  { id: 16, name: "Reverse Linked List", difficulty: "Easy", topic: "Linked List", url: "https://leetcode.com/problems/reverse-linked-list/", platform: "LeetCode", desc: "Reverse a singly linked list." },
  { id: 17, name: "Product of Array Except Self", difficulty: "Medium", topic: "Array", url: "https://leetcode.com/problems/product-of-array-except-self/", platform: "LeetCode", desc: "Return an array such that each element is the product of all elements except itself." },
  { id: 18, name: "Edit Distance", difficulty: "Hard", topic: "DP", url: "https://leetcode.com/problems/edit-distance/", platform: "LeetCode", desc: "Given two words, find the minimum number of operations to convert one to the other." },
  { id: 19, name: "Search in Rotated Sorted Array", difficulty: "Medium", topic: "Binary Search", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", platform: "LeetCode", desc: "Search for a target in a rotated sorted array in O(log n) time." },
  { id: 20, name: "Minimum Window Substring", difficulty: "Hard", topic: "Sliding Window", url: "https://leetcode.com/problems/minimum-window-substring/", platform: "LeetCode", desc: "Find the minimum window substring that contains all characters of pattern T." },
];

// ===== MOCK CONTEST DATA =====
function generateContests() {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;
  return [
    {
      id: 'cf1', name: 'Codeforces Round 1030 (Div. 2)', platform: 'codeforces', platformLabel: 'Codeforces',
      startTime: now + 2 * day + 5 * hour, duration: '2h', url: 'https://codeforces.com/contests',
      division: 'Div. 2',
    },
    {
      id: 'cf2', name: 'Codeforces Round 1031 (Div. 1)', platform: 'codeforces', platformLabel: 'Codeforces',
      startTime: now + 4 * day + 3 * hour, duration: '2h 30m', url: 'https://codeforces.com/contests',
      division: 'Div. 1',
    },
    {
      id: 'cf3', name: 'Codeforces Round 1032 (Div. 3)', platform: 'codeforces', platformLabel: 'Codeforces',
      startTime: now + 1 * day + 8 * hour, duration: '2h', url: 'https://codeforces.com/contests',
      division: 'Div. 3',
    },
    {
      id: 'lc1', name: 'LeetCode Weekly Contest 456', platform: 'leetcode', platformLabel: 'LeetCode',
      startTime: now + 3 * day + 1 * hour, duration: '1h 30m', url: 'https://leetcode.com/contest/',
      division: '',
    },
    {
      id: 'lc2', name: 'LeetCode Biweekly Contest 152', platform: 'leetcode', platformLabel: 'LeetCode',
      startTime: now + 10 * day + 2 * hour, duration: '1h 30m', url: 'https://leetcode.com/contest/',
      division: '',
    },
    {
      id: 'ac1', name: 'AtCoder Beginner Contest 392', platform: 'atcoder', platformLabel: 'AtCoder',
      startTime: now + 5 * day + 6 * hour, duration: '1h 40m', url: 'https://atcoder.jp/contests/',
      division: 'ABC',
    },
    {
      id: 'ac2', name: 'AtCoder Regular Contest 190', platform: 'atcoder', platformLabel: 'AtCoder',
      startTime: now + 7 * day + 4 * hour, duration: '2h', url: 'https://atcoder.jp/contests/',
      division: 'ARC',
    },
    {
      id: 'cc1', name: 'CodeChef Starters 168', platform: 'codechef', platformLabel: 'CodeChef',
      startTime: now + 6 * day + 2 * hour, duration: '3h', url: 'https://www.codechef.com/contests',
      division: 'Div. 2',
    },
    {
      id: 'cc2', name: 'CodeChef Long Challenge', platform: 'codechef', platformLabel: 'CodeChef',
      startTime: now + 14 * day, duration: '10 days', url: 'https://www.codechef.com/contests',
      division: '',
    },
  ].sort((a, b) => a.startTime - b.startTime);
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

  // Page-specific init
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

  // Redraw chart if visible
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
  function update() {
    const diff = startTime - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<div class="cd-unit"><span class="cd-val">🔴</span><span class="cd-label">Live</span></div>';
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
  const iv = setInterval(update, 1000);
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
function renderContests() {
  clearCountdowns();
  if (!STATE.contests.length) {
    STATE.contests = generateContests();
  }

  const grid = document.getElementById('contestsGrid');
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
  document.getElementById('refreshContests').addEventListener('click', () => {
    STATE.contests = generateContests();
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
  document.getElementById('newChallenge').addEventListener('click', () => {
    pickRandomChallenge();
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

function pickRandomChallenge(problem) {
  const pool = problem ? [problem] : PROBLEMS;
  const p = pool[Math.floor(Math.random() * pool.length)];
  STATE.currentChallenge = p;
  renderChallengeCard(p);
  renderProblemBank();
  localStorage.setItem('cp_challenge_' + todayKey(), JSON.stringify(p));
}

function renderChallenge() {
  const saved = localStorage.getItem('cp_challenge_' + todayKey());
  if (saved) {
    STATE.currentChallenge = JSON.parse(saved);
    renderChallengeCard(STATE.currentChallenge);
  } else {
    pickRandomChallenge();
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
      const pid = parseInt(el.dataset.pid);
      const prob = PROBLEMS.find(p => p.id === pid);
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
function renderDashboard() {
  if (!STATE.contests.length) STATE.contests = generateContests();

  updateDashboardStats();
  renderDashNextContest();
  renderDashGoals();
  renderDashChallenge();
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

function renderDashChallenge() {
  const el = document.getElementById('dashChallenge');
  const saved = localStorage.getItem('cp_challenge_' + todayKey());
  const p = saved ? JSON.parse(saved) : PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
  if (!saved) localStorage.setItem('cp_challenge_' + todayKey(), JSON.stringify(p));

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:700;font-size:15px;">${p.name}</div>
        <div class="diff-badge diff-${p.difficulty}">${p.difficulty}</div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);">${p.desc.slice(0, 100)}...</div>
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
document.addEventListener('DOMContentLoaded', () => {
  // Load contests
  STATE.contests = generateContests();

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

  // Initial render
  renderDashboard();
});