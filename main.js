/* ============================================================
   TagAlong — script.js  (v2 — dynamic localStorage edition)
   ------------------------------------------------------------
   Architecture:
     · Storage layer   → getMeetups / saveMeetups / getUser / saveUser
     · Rendering layer → renderMeetups / buildMeetupCard
     · Action layer    → handleCreateMeetup / handleJoinMeetup
     · Auth layer      → handleLogin / handleSignup / handleVerifyOtp
     · UI layer        → showToast / openModal / closeModal
     · Init layer      → initDashboard / initCreate / initLogin
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const LS_MEETUPS     = 'tagalong_meetups';
const LS_USER        = 'tagalong_user';
const LS_JOINED      = 'tagalong_joined';   // JSON array of joined meetup IDs
const VALID_DOMAINS  = ['@s.amity.edu', '@amity.edu'];
const ACCENT_CLASSES = ['mcard-pink', 'mcard-blue', 'mcard-yellow', 'mcard-purple', 'mcard-green'];

/* ─────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────── */
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}
function getTomorrowString() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function getSaturdayString() {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().split('T')[0];
}

/** "17:00" + "2025-11-15" → "Today, 5:00 PM" */
function formatDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return 'Date TBD';
  const meetupDate = new Date(`${dateStr}T${timeStr}`);
  const today      = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow   = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const mDay       = new Date(dateStr); mDay.setHours(0, 0, 0, 0);

  let prefix;
  if (mDay.getTime() === today.getTime())         prefix = 'Today';
  else if (mDay.getTime() === tomorrow.getTime()) prefix = 'Tomorrow';
  else prefix = mDay.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  const timeLabel = meetupDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${prefix}, ${timeLabel}`;
}

/* ─────────────────────────────────────────
   SEED DATA  (first-run defaults)
───────────────────────────────────────── */
const SEED_MEETUPS = [
  { id: 'seed-1', title: 'Sunset Walk at Botanical Garden 🌅',
    description: 'Winding down after classes with a peaceful walk. Bring earphones and good vibes!',
    location: 'Botanical Garden, Block B', date: getTodayString(), time: '17:00',
    gender: 'Girls Only 👩', maxParticipants: 5, joined: 2, host: 'Riya Sharma',
    category: '🚶 Walk', createdAt: Date.now() - 3600000 },
  { id: 'seed-2', title: 'LeetCode Grind Session 💻',
    description: "Grinding DSA problems together. All levels welcome — let's push each other!",
    location: 'Central Library, 3rd Floor', date: getTomorrowString(), time: '10:00',
    gender: 'Everyone 🤝', maxParticipants: 6, joined: 1, host: 'Karan Mehta',
    category: '📚 Study', createdAt: Date.now() - 7200000 },
  { id: 'seed-3', title: 'Morning Yoga on Campus Lawn 🧘',
    description: 'Start the weekend right. Bring a mat or towel. All levels welcome.',
    location: 'Main Lawn, near Fountain', date: getSaturdayString(), time: '07:00',
    gender: 'Girls Only 👩', maxParticipants: 5, joined: 4, host: 'Meera Iyer',
    category: '⚽ Sports', createdAt: Date.now() - 10800000 },
  { id: 'seed-4', title: 'Chess & Chill ♟️',
    description: 'Casual chess evening. Beginners welcome, bring snacks!',
    location: 'Student Activity Centre', date: getTodayString(), time: '19:00',
    gender: 'Everyone 🤝', maxParticipants: 8, joined: 3, host: 'Sahil Gupta',
    category: '🎮 Gaming', createdAt: Date.now() - 1800000 },
  { id: 'seed-5', title: 'Canteen Lunch 🍱',
    description: "No more eating alone! Let's grab lunch together.",
    location: 'Main Canteen, Block F', date: getTodayString(), time: '13:00',
    gender: 'Everyone 🤝', maxParticipants: 4, joined: 2, host: 'Priya Verma',
    category: '🍕 Food', createdAt: Date.now() - 900000 },
  { id: 'seed-6', title: 'Thrift Shopping Trip 🛍️',
    description: "Heading to Sarojini after campus. Let's carpool and find gems!",
    location: 'Campus Gate, meet at 3pm', date: getSaturdayString(), time: '15:00',
    gender: 'Girls Only 👩', maxParticipants: 3, joined: 1, host: 'Nandini A.',
    category: '🎉 Social', createdAt: Date.now() - 500000 },
];

/* ─────────────────────────────────────────
   STORAGE LAYER
───────────────────────────────────────── */

/** Returns meetup array from localStorage; seeds on first run */
function getMeetups() {
  const raw = localStorage.getItem(LS_MEETUPS);
  if (!raw) { saveMeetups(SEED_MEETUPS); return [...SEED_MEETUPS]; }
  try { return JSON.parse(raw); } catch { return []; }
}

/** Persists meetup array */
function saveMeetups(meetups) {
  localStorage.setItem(LS_MEETUPS, JSON.stringify(meetups));
}

/** Returns Set of meetup IDs the user has joined */
function getJoinedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_JOINED) || '[]')); }
  catch { return new Set(); }
}

/** Persists the joined-ID Set */
function saveJoinedSet(set) {
  localStorage.setItem(LS_JOINED, JSON.stringify([...set]));
}

/** Returns current user object */
function getUser() {
  try { return JSON.parse(localStorage.getItem(LS_USER)) || _defaultUser(); }
  catch { return _defaultUser(); }
}

/** Persists user object */
function saveUser(user) {
  localStorage.setItem(LS_USER, JSON.stringify(user));
}

function _defaultUser() {
  return { name: 'Aryan Kapoor', email: 'a21305@s.amity.edu',
           course: 'B.Tech CSE', year: '3rd Year', initial: 'A' };
}

/* ─────────────────────────────────────────
   UI HELPERS — TOAST
───────────────────────────────────────── */

function showToast(message, icon = '✨') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  if (toast._timer) clearTimeout(toast._timer);
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toast.classList.add('show');
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ─────────────────────────────────────────
   UI HELPERS — MODAL
───────────────────────────────────────── */

function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}

/* ─────────────────────────────────────────
   UI HELPERS — SCROLL ANIMATIONS
───────────────────────────────────────── */

function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in:not(.visible)');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
}

/* ─────────────────────────────────────────
   UTILITY
───────────────────────────────────────── */

/** Escapes user-supplied strings before inserting into innerHTML */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function capitalise(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function genderTagClass(gender) {
  if (gender.includes('Girls')) return 'tag-pink';
  if (gender.includes('Boys'))  return 'tag-blue';
  return 'tag-green';
}

/* ─────────────────────────────────────────
   RENDERING LAYER
───────────────────────────────────────── */

/**
 * Builds one meetup card DOM node.
 * @param {Object} meetup
 * @param {number} index   — accent colour rotation
 * @param {Set}    joined  — IDs already joined by current user
 */
function buildMeetupCard(meetup, index, joined) {
  const isFull    = meetup.joined >= meetup.maxParticipants;
  const hasJoined = joined.has(meetup.id);
  const fillPct   = Math.min(100, Math.round((meetup.joined / meetup.maxParticipants) * 100));
  const timeLabel = formatDateTime(meetup.date, meetup.time);
  const initial   = meetup.host ? meetup.host.charAt(0).toUpperCase() : '?';
  const accent    = ACCENT_CLASSES[index % ACCENT_CLASSES.length];

  let joinBtn;
  if (hasJoined)      joinBtn = `<button class="btn btn-secondary btn-sm" disabled>Joined ✓</button>`;
  else if (isFull)    joinBtn = `<button class="btn btn-secondary btn-sm" disabled>Full 😔</button>`;
  else                joinBtn = `<button class="btn btn-primary btn-sm js-join-btn" data-id="${escHtml(meetup.id)}">Join</button>`;

  const card = document.createElement('div');
  card.className   = 'mcard fade-in';
  card.dataset.id  = meetup.id;
  card.innerHTML = `
    <div class="mcard-top ${accent}"></div>
    <div class="mcard-body">
      <div class="mcard-host">
        <div class="avatar" style="width:36px;height:36px;font-size:0.85rem">${escHtml(initial)}</div>
        <div>
          <div class="mcard-hname">${escHtml(meetup.host)}</div>
          <div class="mcard-hcourse">Amity Student</div>
        </div>
      </div>
      <div class="mcard-title">${escHtml(meetup.title)}</div>
      <div class="mcard-loc">📍 ${escHtml(meetup.location)}</div>
      <div class="mcard-tags">
        <span class="tag ${genderTagClass(meetup.gender)}">${escHtml(meetup.gender)}</span>
        <span class="tag tag-blue">⏰ ${escHtml(timeLabel)}</span>
        ${meetup.category ? `<span class="tag tag-yellow">${escHtml(meetup.category)}</span>` : ''}
      </div>
      <div class="mcard-footer">
        <div>
          <div class="spots-info">👥 ${meetup.joined} / ${meetup.maxParticipants} joined</div>
          <div class="spots-bar"><div class="spots-bar-fill" style="width:${fillPct}%"></div></div>
        </div>
        ${joinBtn}
      </div>
    </div>`;
  return card;
}

/**
 * Filters meetups and re-renders the #meetup-grid element.
 * @param {string} filterGender  'All' | 'Girls Only 👩' | 'Boys Only 👦' | 'Everyone 🤝'
 * @param {string} filterTime    'Any time' | 'Today' | 'Tomorrow' | 'This week'
 * @param {string} searchQuery   free-text
 */
function renderMeetups(filterGender, filterTime, searchQuery) {
  filterGender = filterGender || 'All';
  filterTime   = filterTime   || 'Any time';
  searchQuery  = (searchQuery || '').trim().toLowerCase();

  const grid = document.getElementById('meetup-grid');
  if (!grid) return;

  const allMeetups = getMeetups();
  const joined     = getJoinedSet();
  const today      = getTodayString();
  const tomorrow   = getTomorrowString();

  const filtered = allMeetups.filter(m => {
    // Gender
    if (filterGender === 'Girls Only 👩' && !m.gender.includes('Girls'))    return false;
    if (filterGender === 'Boys Only 👦'  && !m.gender.includes('Boys'))     return false;
    if (filterGender === 'Everyone 🤝'   && !m.gender.includes('Everyone')) return false;
    // Time
    if (filterTime === 'Today'    && m.date !== today)    return false;
    if (filterTime === 'Tomorrow' && m.date !== tomorrow) return false;
    if (filterTime === 'This week') {
      const d = new Date(m.date);
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setDate(now.getDate() + 7);
      if (d < now || d > end) return false;
    }
    // Search
    if (searchQuery) {
      const hay = `${m.title} ${m.location} ${m.host} ${m.category || ''}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🔍</div>
        <h3 style="color:var(--text);margin-bottom:8px">No meetups found</h3>
        <p>Adjust your filters or <a href="create.html" style="color:#f06292;font-weight:600">create one!</a></p>
      </div>`;
    _updateCountLabel(0);
    _updateStatsStrip(allMeetups, joined);
    return;
  }

  filtered.forEach((m, i) => grid.appendChild(buildMeetupCard(m, i, joined)));
  _updateCountLabel(filtered.length);
  _updateStatsStrip(allMeetups, joined);
  initScrollAnimations();

  // Attach join listeners
  grid.querySelectorAll('.js-join-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); handleJoinMeetup(btn.dataset.id); });
  });
}

function _updateCountLabel(count) {
  const el = document.getElementById('meetup-count');
  if (el) el.textContent = `${count} meetup${count !== 1 ? 's' : ''} found`;
}

function _updateStatsStrip(allMeetups, joined) {
  const todayCount = allMeetups.filter(m => m.date === getTodayString()).length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-today',  todayCount);
  set('stat-active', allMeetups.length);
  set('stat-joined', joined.size);
}

/* ─────────────────────────────────────────
   ACTION LAYER — JOIN MEETUP
───────────────────────────────────────── */

function handleJoinMeetup(id) {
  const meetups = getMeetups();
  const idx     = meetups.findIndex(m => m.id === id);
  if (idx === -1) { showToast('Meetup not found.', '⚠️'); return; }

  const meetup = meetups[idx];
  const joined = getJoinedSet();

  if (joined.has(id))                           { showToast("You've already joined this meetup!", 'ℹ️'); return; }
  if (meetup.joined >= meetup.maxParticipants)  { showToast('Sorry, this meetup is full!', '😔');       return; }

  meetups[idx].joined += 1;
  saveMeetups(meetups);
  joined.add(id);
  saveJoinedSet(joined);

  showToast(`You joined "${meetup.title}"! 🎉`, '✅');
  _renderWithActiveFilters();
}

/* ─────────────────────────────────────────
   ACTION LAYER — CREATE MEETUP
───────────────────────────────────────── */

function handleCreateMeetup() {
  const val = id => (document.getElementById(id)?.value || '').trim();

  const title  = val('title-input');
  const desc   = val('desc-input');
  const loc    = val('loc-input');
  const date   = val('date-input');
  const time   = val('time-input');
  const maxP   = parseInt(document.getElementById('spots-slider')?.value || '5', 10);
  const gender = document.querySelector('.gender-pill.active')?.dataset.gender || 'Everyone 🤝';
  const cat    = document.querySelector('.tag-select-item.selected')?.dataset.category || '';

  if (!title) { showToast('Please enter a meetup title.', '⚠️'); return; }
  if (!loc)   { showToast('Please enter a location.', '⚠️');     return; }
  if (!date)  { showToast('Please pick a date.', '⚠️');           return; }
  if (!time)  { showToast('Please set a time.', '⚠️');            return; }

  const user   = getUser();
  const meetup = {
    id:              `meetup-${Date.now()}`,
    title, description: desc, location: loc, date, time, gender,
    maxParticipants: isNaN(maxP) ? 5 : maxP,
    joined:          1,
    host:            user.name,
    category:        cat,
    createdAt:       Date.now(),
  };

  const meetups = getMeetups();
  meetups.unshift(meetup);   // newest first
  saveMeetups(meetups);

  showToast('Meetup posted! 🚀', '🎉');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
}

/* ─────────────────────────────────────────
   ACTION LAYER — AUTH
───────────────────────────────────────── */

function isAmityEmail(email) {
  return VALID_DOMAINS.some(d => email.toLowerCase().endsWith(d));
}

function handleLogin() {
  const email = (document.getElementById('login-email')?.value  || '').trim();
  const pass  = (document.getElementById('login-pass')?.value   || '').trim();

  if (!email)               { showToast('Please enter your email.', '⚠️');                              return; }
  if (!isAmityEmail(email)) { showToast('Only @s.amity.edu or @amity.edu emails are allowed.', '🚫');   return; }
  if (pass.length < 6)      { showToast('Password must be at least 6 characters.', '⚠️');              return; }

  const prefix = email.split('@')[0];
  const user   = getUser();
  user.email   = email;
  if (!/^[a-z]\d{5,}/.test(prefix)) {
    user.name    = capitalise(prefix.replace(/[._]/g, ' '));
    user.initial = user.name.charAt(0).toUpperCase();
  }
  saveUser(user);

  showToast('Logging you in… 🎉', '✅');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1100);
}

function handleSignup() {
  const fname = (document.getElementById('signup-fname')?.value  || '').trim();
  const lname = (document.getElementById('signup-lname')?.value  || '').trim();
  const email = (document.getElementById('signup-email')?.value  || '').trim();
  const pass  = (document.getElementById('signup-pass')?.value   || '').trim();

  if (!fname || !lname)     { showToast('Please enter your full name.', '⚠️');                          return; }
  if (!email)               { showToast('Please enter your Amity email.', '⚠️');                        return; }
  if (!isAmityEmail(email)) { showToast('Only @s.amity.edu or @amity.edu emails are allowed.', '🚫');   return; }
  if (pass.length < 8)      { showToast('Password must be at least 8 characters.', '⚠️');              return; }

  sessionStorage.setItem('tagalong_pending_user', JSON.stringify({ name: `${fname} ${lname}`, email }));
  openModal('otp-modal');
}

function handleVerifyOtp() {
  const otp = [...document.querySelectorAll('.otp-box')].map(b => b.value).join('');
  if (otp.length < 6) { showToast('Please enter the complete 6-digit code.', '⚠️'); return; }

  try {
    const pending = JSON.parse(sessionStorage.getItem('tagalong_pending_user') || '{}');
    if (pending.name) {
      const user   = getUser();
      user.name    = pending.name;
      user.email   = pending.email;
      user.initial = pending.name.charAt(0).toUpperCase();
      saveUser(user);
      sessionStorage.removeItem('tagalong_pending_user');
    }
  } catch (_) {}

  closeModal('otp-modal');
  showToast('Account created! Welcome to TagAlong 🎊', '🎉');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
}

/* ─────────────────────────────────────────
   FILTER STATE  (dashboard module-level)
───────────────────────────────────────── */
let _filterGender = 'All';
let _filterTime   = 'Any time';
let _searchQuery  = '';

function _renderWithActiveFilters() {
  renderMeetups(_filterGender, _filterTime, _searchQuery);
}

/* ─────────────────────────────────────────
   CREATE PAGE — LIVE PREVIEW
───────────────────────────────────────── */

function updatePreview() {
  const g   = id => document.getElementById(id);
  const set = (id, txt) => { const el = g(id); if (el) el.textContent = txt; };

  const title = g('title-input')?.value || '';
  const desc  = g('desc-input')?.value  || '';
  const loc   = g('loc-input')?.value   || '';
  const date  = g('date-input')?.value  || '';
  const time  = g('time-input')?.value  || '';

  set('title-count',   title.length);
  set('desc-count',    desc.length);
  set('preview-title', title || 'Your meetup title will appear here…');
  set('preview-loc',   loc   ? `📍 ${loc}` : '📍 Location');
  if (date && time) set('preview-time', `⏰ ${formatDateTime(date, time)}`);
}

function updateSpots(val) {
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('spots-display', val);
  set('spots-others',  val - 1);
  set('preview-spots', val);
}

/* ─────────────────────────────────────────
   PAGE INIT — DASHBOARD
───────────────────────────────────────── */

function initDashboard() {
  const user = getUser();
  const g    = id => document.getElementById(id);

  // Greet user
  const greetEl = g('user-greeting');
  if (greetEl) greetEl.textContent = `Hey, ${user.name.split(' ')[0]} 👋`;
  const initEl = g('user-initial');
  if (initEl) initEl.textContent = user.initial || user.name.charAt(0).toUpperCase();

  // First render
  _renderWithActiveFilters();

  // Search
  g('dashboard-search')?.addEventListener('input', e => { _searchQuery = e.target.value; _renderWithActiveFilters(); });
  g('sidebar-search')?.addEventListener('input',   e => { _searchQuery = e.target.value; _renderWithActiveFilters(); });

  // Gender filter chips
  document.querySelectorAll('.js-filter-gender').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.js-filter-gender').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      _filterGender = chip.dataset.value;
      _renderWithActiveFilters();
    });
  });

  // Time filter chips
  document.querySelectorAll('.js-filter-time').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.js-filter-time').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      _filterTime = chip.dataset.value;
      _renderWithActiveFilters();
    });
  });

  // Clear filters
  g('clear-filters-btn')?.addEventListener('click', () => {
    _filterGender = 'All'; _filterTime = 'Any time'; _searchQuery = '';
    const ds = g('dashboard-search'); if (ds) ds.value = '';
    const ss = g('sidebar-search');   if (ss) ss.value = '';
    document.querySelectorAll('.js-filter-gender').forEach((c, i) => c.classList.toggle('active', i === 0));
    document.querySelectorAll('.js-filter-time').forEach((c, i)   => c.classList.toggle('active', i === 0));
    _renderWithActiveFilters();
    showToast('Filters cleared ✨', '🔄');
  });

  // Emergency button
  g('emergency-btn')?.addEventListener('click', () => showToast('Emergency location shared with your contacts! 📍', '🆘'));
}

/* ─────────────────────────────────────────
   PAGE INIT — CREATE MEETUP
───────────────────────────────────────── */

function initCreate() {
  const g = id => document.getElementById(id);

  // Default date
  const dateInput = g('date-input');
  if (dateInput) dateInput.valueAsDate = new Date();
  updatePreview();

  // Live preview
  ['title-input', 'desc-input', 'date-input', 'time-input'].forEach(id => g(id)?.addEventListener('input', updatePreview));

  // Spots slider
  const slider = g('spots-slider');
  if (slider) slider.addEventListener('input', () => updateSpots(slider.value));

  // Location autocomplete
  const locInput = g('loc-input');
  const locSug   = g('loc-suggestions');
  if (locInput && locSug) {
    locInput.addEventListener('input', () => { locSug.classList.toggle('show', locInput.value.length > 0); updatePreview(); });
    locSug.querySelectorAll('.loc-sug-item').forEach(item => {
      item.addEventListener('click', () => {
        locInput.value = item.textContent.replace(/^📍\s*/, '').trim();
        locSug.classList.remove('show');
        updatePreview();
      });
    });
    document.addEventListener('click', e => {
      if (!locInput.contains(e.target) && !locSug.contains(e.target)) locSug.classList.remove('show');
    });
  }

  // Gender pills
  document.querySelectorAll('.gender-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.gender-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const pv = g('preview-gender');
      if (pv) pv.textContent = pill.dataset.gender || pill.textContent.trim();
    });
  });

  // Category chips
  document.querySelectorAll('.tag-select-item').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tag-select-item').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // Submit
  g('submit-meetup-btn')?.addEventListener('click', handleCreateMeetup);
}

/* ─────────────────────────────────────────
   PAGE INIT — LOGIN / SIGNUP
───────────────────────────────────────── */

function initLogin() {
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const tabs       = document.querySelectorAll('.auth-tab');

  function switchTab(tab) {
    tabs.forEach((t, i) => t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup')));
    loginForm?.classList.toggle('active',  tab === 'login');
    signupForm?.classList.toggle('active', tab === 'signup');
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => switchTab(i === 0 ? 'login' : 'signup')));
  document.querySelectorAll('.js-switch-signup').forEach(el => el.addEventListener('click', () => switchTab('signup')));
  document.querySelectorAll('.js-switch-login').forEach(el  => el.addEventListener('click', () => switchTab('login')));
  if (window.location.hash === '#signup') switchTab('signup');

  // Password toggles
  document.querySelectorAll('.js-pass-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      inp.type       = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
  });

  // Submit handlers
  document.getElementById('login-submit-btn')?.addEventListener('click',  handleLogin);
  document.getElementById('signup-submit-btn')?.addEventListener('click', handleSignup);
  document.getElementById('otp-verify-btn')?.addEventListener('click',    handleVerifyOtp);

  // OTP auto-advance
  document.querySelectorAll('.otp-box').forEach(box => {
    box.addEventListener('input',   () => { if (box.value.length === 1) box.nextElementSibling?.focus(); });
    box.addEventListener('keydown', e  => { if (e.key === 'Backspace' && !box.value) box.previousElementSibling?.focus(); });
  });

  // Email validation hint
  [document.getElementById('login-email'), document.getElementById('signup-email')].forEach(el => {
    if (!el) return;
    el.addEventListener('blur', () => {
      const v = el.value.trim();
      el.style.borderColor = (v && !isAmityEmail(v)) ? '#f06292' : '';
      if (v && !isAmityEmail(v)) showToast('Use your @s.amity.edu or @amity.edu email.', '⚠️');
    });
  });
}

/* ─────────────────────────────────────────
   GLOBAL — Modal delegation & nav highlight
───────────────────────────────────────── */

function _initGlobal() {
  // Overlay click → close
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  // data-modal-close
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-modal-close]');
    if (btn) closeModal(btn.dataset.modalClose);
  });
  // data-modal-open
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-modal-open]');
    if (btn) openModal(btn.dataset.modalOpen);
  });

  // Active nav link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', href === page || href.endsWith(`/${page}`));
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  _initGlobal();
  initScrollAnimations();

  if      (page === 'dashboard.html') initDashboard();
  else if (page === 'create.html')    initCreate();
  else if (page === 'login.html')     initLogin();
});
