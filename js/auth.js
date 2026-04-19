// ── AUTH.JS ──────────────────────────────────────────
// Handles Login & Signup modal, form validation,
// session state (localStorage), UI auth toggle
// ────────────────────────────────────────────────────

import { saveUser } from './firebase.js';



const Auth = (() => {

  // ── State ──────────────────────────────────────────
  // In production this would use a real backend.
  // Here we use localStorage as a demo DB with basic
  // password hashing simulation.
  const USERS_KEY = 'vh_users_db';
  const SESSION_KEY = 'vh_session';

  let currentUser = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;

  // ── Simple hash (demo only, not real crypto) ───────
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  // ── User DB helpers ────────────────────────────────
  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ── DOM Injection ──────────────────────────────────
  function injectModal() {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-overlay" id="auth-overlay"></div>
      <div class="auth-box">
        <button class="auth-close" id="auth-close">&times;</button>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="signup">Sign Up</button>
        </div>

        <!-- Login Form -->
        <div class="auth-panel active" id="tab-login">
          <h2 class="auth-title">Welcome Back</h2>
          <p class="auth-sub">Login to track your orders and leave reviews.</p>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="you@email.com" autocomplete="email"/>
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password"/>
          </div>
          <p class="auth-error" id="login-error"></p>
          <button class="auth-submit" id="login-submit">Login</button>
          <p class="auth-switch">No account? <a href="#" data-tab="signup">Sign up</a></p>
          <p class="auth-security-note">🔒 Your data stays on this device (demo mode)</p>
        </div>

        <!-- Signup Form -->
        <div class="auth-panel" id="tab-signup">
          <h2 class="auth-title">Join the Heat</h2>
          <p class="auth-sub">Create an account to order and review products.</p>
          <div class="auth-field">
            <label>Full Name</label>
            <input type="text" id="signup-name" placeholder="Your name" autocomplete="name"/>
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="signup-email" placeholder="you@email.com" autocomplete="email"/>
          </div>
          <div class="auth-field">
            <label>Phone (optional)</label>
            <input type="tel" id="signup-phone" placeholder="+91 XXXXX XXXXX" autocomplete="tel"/>
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" id="signup-password" placeholder="Min. 6 characters" autocomplete="new-password"/>
          </div>
          <p class="auth-error" id="signup-error"></p>
          <button class="auth-submit" id="signup-submit">Create Account</button>
          <p class="auth-switch">Already have an account? <a href="#" data-tab="login">Login</a></p>
          <p class="auth-security-note">🔒 Your data stays on this device (demo mode)</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    bindModalEvents();
  }

  // ── Tab Switching ───────────────────────────────────
  function switchTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabName));
    document.querySelectorAll('.auth-panel').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${tabName}`));
  }

  // ── Validation ──────────────────────────────────────
  function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function validatePassword(pw) { return pw.length >= 6; }

  // ── Login ──────────────────────────────────────────
  function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');

    if (!validateEmail(email)) { errEl.textContent = 'Please enter a valid email.'; return; }
    if (!validatePassword(password)) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

    const users = getUsers();
    const storedUser = users[email];
    if (!storedUser) {
      errEl.textContent = 'No account found. Please sign up first.';
      return;
    }
    if (storedUser.passwordHash !== simpleHash(password)) {
      errEl.textContent = 'Incorrect password. Please try again.';
      return;
    }

    const user = { name: storedUser.name, email: storedUser.email, phone: storedUser.phone };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    currentUser = user;
    errEl.textContent = '';
    closeModal();
    updateNavForUser(user);
    showToast(`Welcome back, ${user.name}! 🔥`);
    // Refresh reviews section to show/hide form
    if (typeof Reviews !== 'undefined') Reviews.renderReviewForm();
  }

  // ── Signup ─────────────────────────────────────────
  async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const errEl = document.getElementById('signup-error');

    if (!name) { errEl.textContent = 'Please enter your name.'; return; }
    if (!validateEmail(email)) { errEl.textContent = 'Please enter a valid email.'; return; }
    if (!validatePassword(password)) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

    const users = getUsers();
    if (users[email]) {
      errEl.textContent = 'An account with this email already exists.';
      return;
    }

    users[email] = {
      name,
      email,
      phone,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);


    const user = { name, email, phone };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    currentUser = user;
    errEl.textContent = '';
    closeModal();
    updateNavForUser(user);
    showToast(`Account created! Welcome, ${name}! 🌶️`);
    if (typeof Reviews !== 'undefined') Reviews.renderReviewForm();

    // inside handleSignup(), after creating the account:
    await saveUser({ name, email, phone, createdAt: new Date().toISOString() });
  }

  


  // ── Nav Update ─────────────────────────────────────
  function updateNavForUser(user) {
    const cta = document.querySelector('.nav-cta');
    if (!cta) return;
    if (user) {
      cta.textContent = user.name.split(' ')[0];
      cta.title = 'Click to logout';
      cta.onclick = logout;
    } else {
      cta.textContent = 'Login';
      cta.title = '';
      cta.onclick = () => openModal('login');
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    currentUser = null;
    updateNavForUser(null);
    showToast('Logged out. See you next time!');
    if (typeof Reviews !== 'undefined') Reviews.renderReviewForm();
  }

  // ── Modal Open/Close ───────────────────────────────
  function openModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('open');
      switchTab(tab);
    }
  }

  function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
  }

  // ── Toast ──────────────────────────────────────────
  function showToast(msg) {
    let t = document.getElementById('vh-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'vh-toast';
      t.style.cssText = `
        position:fixed;bottom:2rem;right:2rem;z-index:9999;
        background:#8B1A1A;color:#F5EFE0;
        padding:0.75rem 1.4rem;
        font-family:'Barlow Condensed',sans-serif;
        font-size:0.9rem;letter-spacing:0.1em;
        opacity:0;transition:opacity 0.3s;pointer-events:none;
        max-width:300px;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }

  // ── Bind Events ────────────────────────────────────
  function bindModalEvents() {
    document.getElementById('auth-close').onclick = closeModal;
    document.getElementById('auth-overlay').onclick = closeModal;
    document.getElementById('login-submit').onclick = handleLogin;
    document.getElementById('signup-submit').onclick = handleSignup;

    // Enter key on inputs
    ['login-email','login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
    });
    ['signup-name','signup-email','signup-phone','signup-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
    });

    document.querySelectorAll('.auth-tab, .auth-switch a').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (el.dataset.tab) switchTab(el.dataset.tab);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    injectModal();
    updateNavForUser(currentUser);
  }

  return {
    init,
    openModal,
    closeModal,
    getUser: () => currentUser,
    showToast,
    updateNavForUser,
  };

})();

document.addEventListener('DOMContentLoaded', Auth.init);
