/* ============================================================
   TagAlong — script.js
   Dynamic Frontend Application Logic
   Client-side state management via localStorage
   ============================================================

   TABLE OF CONTENTS
   -----------------
   1.  Constants & Config
   2.  localStorage Helpers  → getMeetups() / saveMeetups()
   3.  Seed Data             → loadSeedMeetups()
   4.  Dashboard Module      → renderMeetups() / handleJoinMeetup()
   5.  Create Module         → handleCreateMeetup() / live preview
   6.  Filter & Search Module
   7.  Auth Module           → handleLogin() / handleSignup()
   8.  Stats Module          → updateStats()
   9.  Utility               → formatDateTime() / escHtml() etc.
   10. Page Router           → DOMContentLoaded dispatcher
   ============================================================ */


/* ============================================================
   1. CONSTANTS & CONFIG
   ============================================================ */

const LS_KEY        = 'tagalong_meetups';  // localStorage key for all meetups
const LS_USER_KEY   = 'tagalong_user';     // localStorage key for logged-in user
const LS_JOINED_KEY = 'tagalong_joined';   // localStorage key for meetups joined by user

/** Valid Amity email domains */
const VALID_DOMAINS = ['@s.amity.edu', '@amity.edu'];

/** Rotating card accent colour classes */
const ACCENT_CLASSES = ['mcard-pink', 'mcard-blue', 'mcard-yellow', 'mcard-purple', 'mcard-green'];

/** Gender label → CSS tag class */
const GENDER_TAG_CLASS = {
  'Everyone': 'tag-blue',
  'Girls Only': 'tag-pink',
  'Boys Only': 'tag-green',
};


/* ============================================================
   2. LOCALSTORAGE HELPERS
   ============================================================ */

function getMeetups() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveMeetups(meetups) {
  localStorage.setItem(LS_KEY, JSON.stringify(meetups));
}

function getJoinedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_JOINED_KEY)) || []); }
  catch { return new Set(); }
}

function saveJoinedSet(joinedSet) {
  localStorage.setItem(LS_JOINED_KEY, JSON.stringify([...joinedSet]));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(LS_USER_KEY)) || {
      name: 'Aryan Kapoor', initial: 'A', course: 'B.Tech CSE · 3rd Year'
    };
  } catch {
    return { name: 'Aryan Kapoor', initial: 'A', course: 'B.Tech CSE · 3rd Year' };
  }
}


/* ============================================================
   3. SEED DATA
   Pre-populate localStorage so the dashboard is never empty.
   ============================================================ */

function loadSeedMeetups() {
  if (getMeetups().length > 0) return;

  const today    = getTodayDate();
  const tomorrow = getTomorrowDate();
  const weekend  = getWeekendDate();

  const seeds = [
    {
      id: 'seed-1', title: 'Sunset Walk at Botanical Garden', description: 'Winding down after classes with a peaceful walk. Bring earphones and good vibes!',
      location: 'Botanical Garden, Block B', date: today, time: '17:00',
      gender: 'Girls Only', maxParticipants: 5, joined: 2,
      host: 'Riya Sharma', hostCourse: 'BBA · 2nd Year', category: 'Walk'
    },
    {
      id: 'seed-2', title: 'LeetCode Grind Session', description: 'Placement prep! Bringing my laptop and snacks. All skill levels welcome.',
      location: 'Central Library, 3rd Floor', date: tomorrow, time: '10:00',
      gender: 'Everyone', maxParticipants: 6, joined: 1,
      host: 'Karan Mehta', hostCourse: 'B.Tech CSE · 3rd Year', category: 'Study'
    },
    {
      id: 'seed-3', title: 'Morning Yoga on Campus Lawn', description: 'Starting the day right with 45 mins of yoga. Bring a mat if you have one!',
      location: 'Main Lawn, near Fountain', date: weekend, time: '07:00',
      gender: 'Girls Only', maxParticipants: 5, joined: 4,
      host: 'Meera Iyer', hostCourse: 'B.Sc Biotech · 1st Year', category: 'Sports'
    },
    {
      id: 'seed-4', title: 'Chess & Chill', description: 'Casual chess evening at SAC. Beginners welcome!',
      location: 'Student Activity Centre', date: today, time: '19:00',
      gender: 'Everyone', maxParticipants: 8, joined: 3,
      host: 'Sahil Gupta', hostCourse: 'MBA · 1st Year', category: 'Gaming'
    },
    {
      id: 'seed-5', title: 'Canteen Lunch Together', description: 'Tired of eating alone? Lets grab lunch and chat!',
      location: 'Main Canteen, Block F', date: today, time: '13:00',
      gender: 'Everyone', maxParticipants: 4, joined: 2,
      host: 'Priya Verma', hostCourse: 'B.Tech IT · 4th Year', category: 'Food'
    },
    {
      id: 'seed-6', title: 'Thrift Shopping Trip', description: 'Heading to Sarojini after 3pm. Going by metro!',
      location: 'Campus Gate, meet here', date: weekend, time: '15:00',
      gender: 'Girls Only', maxParticipants: 3, joined: 1,
      host: 'Nandini A.', hostCourse: 'BCA · 2nd Year', category: 'Social'
    },
  ];

  saveMeetups(seeds);
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
function getTomorrowDate() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function getWeekendDate() {
  const d = new Date();
  const daysToSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysToSat);
  return d.toISOString().split('T')[0];
}


/* ============================================================
   4. DASHBOARD MODULE
   ============================================================ */

/**
 * Build and inject all meetup cards into #meetup-grid.
 * Accepts an optional pre-filtered array; otherwise reads all from LS.
 */
function renderMeetups(filteredMeetups) {
  const grid = document.getElementById('meetup-grid');
  if (!grid) return;

  const meetups   = filteredMeetups !== undefined ? filteredMeetups : getMeetups();
  const joinedSet = getJoinedSet();

  grid.innerHTML = '';

  if (meetups.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🗺️</div>
        <h3>No meetups found</h3>
        <p>Be the first! It only takes 2 minutes to create one.</p>
        <a href="create.html" class="btn btn-primary" style="margin-top:20px;display:inline-flex">
          + Create a Meetup
        </a>
      </div>`;
    return;
  }

  meetups.forEach((meetup, i) => {
    const card = buildMeetupCard(meetup, i, joinedSet);
    grid.appendChild(card);
    requestAnimationFrame(() => setTimeout(() => card.classList.add('visible'), i * 60));
  });

  updateStats(getMeetups());
}

/**
 * Construct a single card DOM element for a meetup object.
 */
function buildMeetupCard(meetup, index, joinedSet) {
  const isFull    = meetup.joined >= meetup.maxParticipants;
  const hasJoined = joinedSet.has(String(meetup.id));
  const fillPct   = Math.min(100, Math.round((meetup.joined / meetup.maxParticipants) * 100));
  const accentCls = ACCENT_CLASSES[index % ACCENT_CLASSES.length];
  const genderKey = Object.keys(GENDER_TAG_CLASS).find(k => meetup.gender && meetup.gender.includes(k)) || 'Everyone';
  const genderCls = GENDER_TAG_CLASS[genderKey] || 'tag-blue';
  const spotsLeft = meetup.maxParticipants - meetup.joined;
  const timeLabel = formatDateTime(meetup.date, meetup.time);
  const initial   = getInitial(meetup.host);
  const categoryEmoji = getCategoryEmoji(meetup.category);

  let btnText = 'Join', btnDisabled = '', btnStyle = '';
  if (hasJoined) {
    btnText = 'Joined'; btnDisabled = 'disabled'; btnStyle = 'opacity:.7;cursor:default;';
  } else if (isFull) {
    btnText = 'Full'; btnDisabled = 'disabled'; btnStyle = 'opacity:.5;cursor:default;';
  }

  const card = document.createElement('div');
  card.className = 'mcard fade-in';
  card.dataset.meetupId = meetup.id;

  card.innerHTML = `
    <div class="mcard-top ${accentCls}"></div>
    <div class="mcard-body">
      <div class="mcard-host">
        <div class="avatar" style="width:36px;height:36px;font-size:.85rem">${initial}</div>
        <div>
          <div class="mcard-hname">${escHtml(meetup.host)}</div>
          <div class="mcard-hcourse">${escHtml(meetup.hostCourse || 'Amity Student')}</div>
        </div>
      </div>
      <div class="mcard-title">${escHtml(meetup.title)}</div>
      <div class="mcard-loc">📍 ${escHtml(meetup.location)}</div>
      <div class="mcard-tags">
        <span class="tag ${genderCls}">${escHtml(meetup.gender)}</span>
        <span class="tag tag-blue">⏰ ${timeLabel}</span>
        ${meetup.category ? `<span class="tag tag-yellow">${categoryEmoji} ${escHtml(meetup.category)}</span>` : ''}
        ${isFull
          ? '<span class="tag" style="background:#ffebee;color:#c62828">Full</span>'
          : `<span class="tag tag-green">${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left</span>`}
      </div>
      <div class="mcard-footer">
        <div>
          <div class="spots-info">👥 ${meetup.joined} / ${meetup.maxParticipants} joined</div>
          <div class="spots-bar"><div class="spots-bar-fill" style="width:${fillPct}%"></div></div>
        </div>
        <button class="btn btn-primary btn-sm join-btn"
          data-id="${meetup.id}" ${btnDisabled} style="${btnStyle}">${btnText}</button>
      </div>
    </div>`;

  // Join button listener
  if (!hasJoined && !isFull) {
    card.querySelector('.join-btn').addEventListener('click', e => {
      e.stopPropagation();
      handleJoinMeetup(meetup.id);
    });
  }

  // Card click → detail modal
  card.addEventListener('click', () => openDetailModal(meetup));

  return card;
}

/**
 * Increment joined count, persist, re-render.
 */
function handleJoinMeetup(meetupId) {
  const meetups   = getMeetups();
  const joinedSet = getJoinedSet();
  const idx       = meetups.findIndex(m => String(m.id) === String(meetupId));

  if (idx === -1) { showToast('Meetup not found. Please refresh.', '⚠️'); return; }

  const meetup = meetups[idx];

  if (joinedSet.has(String(meetupId))) { showToast('You already joined this meetup!', 'ℹ️'); return; }
  if (meetup.joined >= meetup.maxParticipants) { showToast('Sorry, this meetup is full!', '😔'); return; }

  meetup.joined += 1;
  meetups[idx] = meetup;
  saveMeetups(meetups);

  joinedSet.add(String(meetupId));
  saveJoinedSet(joinedSet);

  showToast(`You joined "${meetup.title}"! 🎉`, '✅');
  applyFiltersAndRender();
}

/**
 * Populate and open the meetup detail modal.
 */
function openDetailModal(meetup) {
  const modal = document.getElementById('meetup-detail-modal');
  if (!modal) return;

  const joinedSet = getJoinedSet();
  const isFull    = meetup.joined >= meetup.maxParticipants;
  const hasJoined = joinedSet.has(String(meetup.id));

  const set = (id, val) => { const el = modal.querySelector('#' + id); if (el) el.textContent = val; };
  set('modal-host-initial',  getInitial(meetup.host));
  set('modal-host-name',     meetup.host);
  set('modal-host-course',   meetup.hostCourse || 'Amity Student');
  set('modal-title',         meetup.title);
  set('modal-description',   meetup.description || 'No description provided.');
  set('modal-datetime',      formatDateTime(meetup.date, meetup.time));
  set('modal-location',      meetup.location);
  set('modal-spots',         `${meetup.joined} / ${meetup.maxParticipants} joined`);
  set('modal-gender',        meetup.gender);

  const modalJoinBtn = modal.querySelector('#modal-join-btn');
  if (modalJoinBtn) {
    if (hasJoined) {
      modalJoinBtn.textContent = 'Already Joined'; modalJoinBtn.disabled = true; modalJoinBtn.style.opacity = '.7';
    } else if (isFull) {
      modalJoinBtn.textContent = 'Meetup is Full'; modalJoinBtn.disabled = true; modalJoinBtn.style.opacity = '.5';
    } else {
      modalJoinBtn.textContent = 'Request to Join 🙌'; modalJoinBtn.disabled = false; modalJoinBtn.style.opacity = '1';
      modalJoinBtn.onclick = () => { closeModal('meetup-detail-modal'); handleJoinMeetup(meetup.id); };
    }
  }

  openModal('meetup-detail-modal');
}


/* ============================================================
   5. CREATE MEETUP MODULE
   ============================================================ */

const createState = { gender: 'Everyone', category: '' };

/**
 * Validate form, build meetup object, save to LS, redirect.
 */
function handleCreateMeetup() {
  const val  = id => document.getElementById(id)?.value.trim() || '';
  const title    = val('title-input');
  const desc     = val('desc-input');
  const location = val('loc-input');
  const date     = val('date-input');
  const time     = val('time-input');
  const spots    = parseInt(document.getElementById('spots-slider')?.value || '5');

  if (!title)    { showToast('Please enter a meetup title.', '⚠️'); document.getElementById('title-input')?.focus(); return; }
  if (!location) { showToast('Please enter a location.', '⚠️'); document.getElementById('loc-input')?.focus(); return; }
  if (!date)     { showToast('Please pick a date.', '⚠️'); return; }
  if (!time)     { showToast('Please set a time.', '⚠️'); return; }

  const user   = getCurrentUser();
  const meetup = {
    id:             Date.now(),
    title, description: desc, location, date, time,
    gender:          createState.gender,
    maxParticipants: spots,
    joined:          1,
    host:            user.name,
    hostCourse:      user.course,
    category:        createState.category,
    createdAt:       new Date().toISOString(),
  };

  const meetups = getMeetups();
  meetups.unshift(meetup);
  saveMeetups(meetups);

  showToast('Meetup posted! Redirecting… 🚀', '🎉');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
}

function updateLivePreview() {
  const v    = id => document.getElementById(id)?.value || '';
  const title = v('title-input');
  const loc   = v('loc-input');
  const date  = v('date-input');
  const time  = v('time-input');

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('title-count', title.length);
  set('desc-count',  (v('desc-input')).length);
  set('preview-title',  title  || 'Your meetup title will appear here…');
  set('preview-loc',    loc    ? '📍 ' + loc : '📍 Location');
  set('preview-gender', createState.gender);

  if (date && time) {
    const d    = new Date(`${date}T${time}`);
    const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    set('preview-time', '⏰ ' + d.toLocaleString('en-IN', opts));
  }
}

function updateSpotsDisplay(val) {
  const n = parseInt(val);
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('spots-display', n); s('spots-others', n - 1); s('preview-spots', n);
}

function selectGenderPill(el) {
  document.querySelectorAll('.gender-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  createState.gender = el.dataset.gender || el.textContent.trim();
  updateLivePreview();
}

function selectCategoryChip(el) {
  document.querySelectorAll('.tag-select-item').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  createState.category = el.dataset.category || el.textContent.trim().replace(/^[^\w]+ ?/, '');
}

function handleLocInput() {
  const val = document.getElementById('loc-input')?.value || '';
  document.getElementById('loc-suggestions')?.classList.toggle('show', val.length > 0);
  updateLivePreview();
}

function pickLocation(loc) {
  const inp = document.getElementById('loc-input');
  if (inp) inp.value = loc;
  document.getElementById('loc-suggestions')?.classList.remove('show');
  updateLivePreview();
}


/* ============================================================
   6. FILTER & SEARCH MODULE
   ============================================================ */

const filterState = { category: 'All', gender: 'All', when: 'All', search: '' };

function applyFiltersAndRender() {
  let meetups = getMeetups();

  if (filterState.category !== 'All') {
    const q = filterState.category.toLowerCase();
    meetups = meetups.filter(m => m.category && m.category.toLowerCase().includes(q));
  }
  if (filterState.gender !== 'All') {
    meetups = meetups.filter(m => m.gender && m.gender.includes(filterState.gender));
  }
  if (filterState.when !== 'All') {
    const today = getTodayDate();
    const tom   = getTomorrowDate();
    meetups = meetups.filter(m => {
      if (filterState.when === 'Today')     return m.date === today;
      if (filterState.when === 'Tomorrow')  return m.date === tom;
      if (filterState.when === 'This week') {
        const md = new Date(m.date), now = new Date(), we = new Date();
        we.setDate(now.getDate() + 7);
        return md >= now && md <= we;
      }
      return true;
    });
  }
  if (filterState.search.trim()) {
    const q = filterState.search.trim().toLowerCase();
    meetups = meetups.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.host.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  }

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${meetups.length} meetup${meetups.length !== 1 ? 's' : ''} found`;

  renderMeetups(meetups);
}

function handleFilterChip(el, key, value) {
  el.closest('.filter-chips').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterState[key] = value;
  applyFiltersAndRender();
}

function clearAllFilters() {
  filterState.category = 'All'; filterState.gender = 'All';
  filterState.when = 'All'; filterState.search = '';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('[data-default="true"]').forEach(c => c.classList.add('active'));
  document.querySelectorAll('.search-input').forEach(i => i.value = '');
  applyFiltersAndRender();
  showToast('Filters cleared! ✨', '🧹');
}


/* ============================================================
   7. AUTH MODULE
   ============================================================ */

function isValidAmityEmail(email) {
  const lower = email.trim().toLowerCase();
  return VALID_DOMAINS.some(d => lower.endsWith(d));
}

function handleLogin() {
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-pass');
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const pass  = passEl.value;

  if (!email)                    { showToast('Please enter your Amity email.', '⚠️'); emailEl.focus(); return; }
  if (!isValidAmityEmail(email)) {
    showToast('Only @s.amity.edu or @amity.edu emails are allowed.', '🚫');
    emailEl.style.borderColor = '#ef9a9a'; emailEl.focus();
    setTimeout(() => emailEl.style.borderColor = '', 2000); return;
  }
  if (pass.length < 6) { showToast('Password must be at least 6 characters.', '⚠️'); passEl.focus(); return; }

  const rawName = email.split('@')[0].replace(/\d+/g, ' ').trim();
  const user = {
    name:    capitalise(rawName) || 'Amity Student',
    initial: (rawName[0] || 'A').toUpperCase(),
    course:  'Amity University', email,
  };
  localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
  showToast('Logging you in… 🎉', '✅');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
}

function handleSignup() {
  const fName = document.getElementById('signup-fname')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const pass  = document.getElementById('signup-pass')?.value;

  if (!fName)                    { showToast('Please enter your first name.', '⚠️'); return; }
  if (!email)                    { showToast('Please enter your Amity email.', '⚠️'); return; }
  if (!isValidAmityEmail(email)) {
    showToast('Only @s.amity.edu or @amity.edu emails are accepted.', '🚫');
    const el = document.getElementById('signup-email');
    if (el) { el.style.borderColor = '#ef9a9a'; el.focus(); setTimeout(() => el.style.borderColor = '', 2000); }
    return;
  }
  if (!pass || pass.length < 8) { showToast('Password must be at least 8 characters.', '⚠️'); return; }

  const lName  = document.getElementById('signup-lname')?.value.trim() || '';
  const course = document.getElementById('signup-course')?.value || '';
  const year   = document.getElementById('signup-year')?.value   || '';
  const user = {
    name:    `${fName} ${lName}`.trim(), initial: fName[0].toUpperCase(),
    course:  [course, year].filter(Boolean).join(' · '), email,
  };
  localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
  openModal('otp-modal');
}

function handleOtpVerify() {
  closeModal('otp-modal');
  showToast('Account created! Welcome to TagAlong 🎊', '🎉');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
}

function handleOtpInput(input) {
  if (input.value.length === 1) {
    const next = input.nextElementSibling;
    if (next && next.classList.contains('otp-box')) next.focus();
  }
}

function togglePasswordVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) =>
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup'))
  );
  document.getElementById('form-login')?.classList.toggle('active',  tab === 'login');
  document.getElementById('form-signup')?.classList.toggle('active', tab === 'signup');
}


/* ============================================================
   8. STATS MODULE
   ============================================================ */

function updateStats(meetups) {
  const today       = getTodayDate();
  const todayCount  = meetups.filter(m => m.date === today).length;
  const totalJoined = meetups.reduce((s, m) => s + m.joined, 0);
  const myJoined    = getJoinedSet().size;

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('stat-today',    todayCount);
  s('stat-students', totalJoined > 999 ? (totalJoined / 1000).toFixed(1) + 'k' : totalJoined);
  s('stat-joined',   myJoined);
}


/* ============================================================
   9. UTILITY FUNCTIONS
   ============================================================ */

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return 'TBD';
  try {
    const d     = new Date(`${dateStr}T${timeStr || '00:00'}`);
    const today = new Date(); today.setHours(0,0,0,0);
    const tom   = new Date(today); tom.setDate(today.getDate() + 1);
    const dDay  = new Date(d);    dDay.setHours(0,0,0,0);
    const dayLabel = dDay.getTime() === today.getTime() ? 'Today'
      : dDay.getTime() === tom.getTime() ? 'Tomorrow'
      : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeLabel = timeStr ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    return timeLabel ? `${dayLabel}, ${timeLabel}` : dayLabel;
  } catch { return dateStr; }
}

function getInitial(name) { return (name || 'A')[0].toUpperCase(); }

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function capitalise(str) { return str.replace(/\b\w/g, c => c.toUpperCase()); }

function getCategoryEmoji(cat) {
  if (!cat) return '';
  const map = { food:'🍕', study:'📚', sports:'⚽', walk:'🚶', social:'🎉', gaming:'🎮', coffee:'☕', creative:'🎨' };
  return map[(cat || '').toLowerCase()] || '📌';
}

/* ── Toast ── */
function showToast(message, icon) {
  icon = icon || '✨';
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + escHtml(message) + '</span>';
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── Modals ── */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}


/* ============================================================
   10. PAGE ROUTER — DOMContentLoaded DISPATCHER
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Shared: active nav link ── */
  var path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) link.classList.add('active');
  });

  /* ── Shared: overlay click closes modal ── */
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  /* ── Shared: data-modal-close / data-modal-open ── */
  document.addEventListener('click', function (e) {
    var closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) closeModal(closeBtn.dataset.modalClose);
    var openBtn = e.target.closest('[data-modal-open]');
    if (openBtn) openModal(openBtn.dataset.modalOpen);
  });

  /* ── Shared: scroll fade-in ── */
  var fadeEls = document.querySelectorAll('.fade-in');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () { entry.target.classList.add('visible'); }, i * 70);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  fadeEls.forEach(function (el) { obs.observe(el); });


  /* ════════════════════════
     DASHBOARD
  ════════════════════════ */
  if (document.getElementById('meetup-grid')) {
    loadSeedMeetups();
    applyFiltersAndRender();

    document.querySelectorAll('[data-filter-category]').forEach(function (chip) {
      chip.addEventListener('click', function () { handleFilterChip(chip, 'category', chip.dataset.filterCategory); });
    });
    document.querySelectorAll('[data-filter-gender]').forEach(function (chip) {
      chip.addEventListener('click', function () { handleFilterChip(chip, 'gender', chip.dataset.filterGender); });
    });
    document.querySelectorAll('[data-filter-when]').forEach(function (chip) {
      chip.addEventListener('click', function () { handleFilterChip(chip, 'when', chip.dataset.filterWhen); });
    });
    document.querySelectorAll('.search-input').forEach(function (input) {
      input.addEventListener('input', function () {
        filterState.search = input.value;
        document.querySelectorAll('.search-input').forEach(function (el) {
          if (el !== input) el.value = input.value;
        });
        applyFiltersAndRender();
      });
    });
    var clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);

    var emergencyBtn = document.getElementById('emergency-btn');
    if (emergencyBtn) emergencyBtn.addEventListener('click', function () {
      showToast('Emergency location shared with your contacts! 📍', '🆘');
    });
  }


  /* ════════════════════════
     CREATE MEETUP
  ════════════════════════ */
  if (document.getElementById('create-meetup-form')) {
    var dateInput = document.getElementById('date-input');
    if (dateInput && !dateInput.value) dateInput.valueAsDate = new Date();
    updateLivePreview();

    ['title-input','desc-input','date-input','time-input'].forEach(function (id) {
      document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    document.getElementById('loc-input')?.addEventListener('input', handleLocInput);

    document.querySelectorAll('.loc-sug-item').forEach(function (item) {
      item.addEventListener('click', function () {
        pickLocation(item.textContent.replace('📍 ', '').trim());
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.loc-suggestions') && e.target.id !== 'loc-input') {
        document.getElementById('loc-suggestions')?.classList.remove('show');
      }
    });

    document.getElementById('spots-slider')?.addEventListener('input', function (e) {
      updateSpotsDisplay(e.target.value);
    });

    document.querySelectorAll('.gender-pill').forEach(function (pill) {
      pill.addEventListener('click', function () { selectGenderPill(pill); });
    });

    document.querySelectorAll('.tag-select-item').forEach(function (chip) {
      chip.addEventListener('click', function () { selectCategoryChip(chip); });
    });

    document.getElementById('submit-meetup-btn')?.addEventListener('click', handleCreateMeetup);
  }


  /* ════════════════════════
     LOGIN / SIGNUP
  ════════════════════════ */
  if (document.getElementById('form-login')) {
    if (window.location.hash === '#signup') switchAuthTab('signup');

    document.getElementById('tab-btn-login')?.addEventListener('click',  function () { switchAuthTab('login'); });
    document.getElementById('tab-btn-signup')?.addEventListener('click', function () { switchAuthTab('signup'); });

    document.getElementById('login-submit-btn')?.addEventListener('click', handleLogin);
    document.getElementById('login-pass')?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleLogin();
    });

    document.getElementById('signup-submit-btn')?.addEventListener('click', handleSignup);
    document.getElementById('otp-verify-btn')?.addEventListener('click', handleOtpVerify);

    document.querySelectorAll('.otp-box').forEach(function (box) {
      box.addEventListener('input', function () { handleOtpInput(box); });
    });

    document.getElementById('toggle-login-pass')?.addEventListener('click', function () {
      togglePasswordVisibility('login-pass', this);
    });
    document.getElementById('toggle-signup-pass')?.addEventListener('click', function () {
      togglePasswordVisibility('signup-pass', this);
    });

    ['login-email','signup-email'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () {
        if (el.value && !isValidAmityEmail(el.value)) {
          el.style.borderColor = '#ef9a9a';
          showToast('Use your @s.amity.edu or @amity.edu email.', '⚠️');
        } else { el.style.borderColor = ''; }
      });
    });
  }

});
