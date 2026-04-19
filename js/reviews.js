// ── REVIEWS.JS ───────────────────────────────────────
import { saveReview, loadReviews } from './firebase.js';

const Reviews = (() => {

  // ── Render Reviews Grid — loads from Firebase ──────
  async function renderReviews() {
    const grid = document.getElementById('reviews-grid');
    if (!grid) return;

    // Load from Firebase ✅
    const reviews = await loadReviews();

    if (reviews.length === 0) {
      grid.innerHTML = `
        <div style="
          grid-column:1/-1;text-align:center;
          padding:3rem;color:rgba(245,239,224,0.3);
        ">
          <div style="font-size:2.5rem;margin-bottom:1rem;">🌶️</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:0.2em;text-transform:uppercase;">
            No reviews yet
          </div>
          <div style="font-size:0.85rem;margin-top:0.5rem;">
            Be the first to review! Login and share your heat experience.
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = reviews.map(r => {
      const date = r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })
        : '';
      return `
        <div class="review-card">
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <p class="review-text">"${escapeHtml(r.text)}"</p>
          <div class="review-author">${escapeHtml(r.author)}</div>
          <div class="review-location">${escapeHtml(r.location || '')}</div>
          <div class="review-verified">✓ Verified Customer</div>
          <div class="review-date">${date}</div>
        </div>
      `;
    }).join('');
  }

  // ── Render Review Form (login-gated) ───────────────
  function renderReviewForm() {
    const formSection = document.getElementById('review-form-section');
    if (!formSection) return;

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;

    if (!user) {
      formSection.innerHTML = `
        <div class="review-form-section">
          <div class="review-login-prompt">
            <p style="margin-bottom:0.5rem;">Want to leave a review?</p>
            <p><a onclick="Auth.openModal('login')">Login</a> or <a onclick="Auth.openModal('signup')">create an account</a> to share your experience.</p>
          </div>
        </div>
      `;
      return;
    }

    formSection.innerHTML = `
      <div class="review-form-section">
        <div class="review-form-title">Leave a Review</div>
        <p class="review-form-sub">Share your honest experience with Volcano Heat.</p>

        <div class="rform-row">
          <label>Your Rating</label>
          <div class="star-picker" id="star-picker">
            ${[1,2,3,4,5].map(n => `
              <button class="star-pick" data-val="${n}" type="button">★</button>
            `).join('')}
          </div>
          <input type="hidden" id="review-rating" value="0" />
        </div>

        <div class="rform-row">
          <label>Product</label>
          <select id="review-product">
            <option value="">Select product...</option>
            <option value="Bhoot Jolokia Pickle">Bhoot Jolokia Pickle — Original</option>
            <option value="Double Smoked">Double Smoked Pickle</option>
            <option value="Garlic Infused">Garlic Infused Pickle</option>
          </select>
        </div>

        <div class="rform-row">
          <label>Your Name</label>
          <input type="text" id="review-name" value="${escapeHtml(user.name)}" placeholder="Your name" />
        </div>

        <div class="rform-row">
          <label>Location (optional)</label>
          <input type="text" id="review-location" placeholder="e.g. Guwahati, Assam" />
        </div>

        <div class="rform-row">
          <label>Your Review</label>
          <textarea id="review-text" rows="4" placeholder="Tell others about your experience..."></textarea>
        </div>

        <p id="review-form-error" style="font-size:0.8rem;color:#E85D04;min-height:1.2em;margin-bottom:0.5rem;"></p>
        <button class="rform-submit" id="review-submit">Submit Review</button>
      </div>
    `;

    // Star picker
    let selectedRating = 0;
    const stars = document.querySelectorAll('.star-pick');
    const ratingInput = document.getElementById('review-rating');

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.val);
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
      });
      star.addEventListener('mouseleave', () => {
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      });
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.val);
        ratingInput.value = selectedRating;
        stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      });
    });

    document.getElementById('review-submit').addEventListener('click', submitReview);
  }

  // ── Submit Review — saves to Firebase ─────────────
  async function submitReview() {
    const rating   = parseInt(document.getElementById('review-rating').value);
    const product  = document.getElementById('review-product').value;
    const name     = document.getElementById('review-name').value.trim();
    const location = document.getElementById('review-location').value.trim();
    const text     = document.getElementById('review-text').value.trim();
    const errEl    = document.getElementById('review-form-error');
    const btn      = document.getElementById('review-submit');

    if (rating === 0)         { errEl.textContent = 'Please select a rating.'; return; }
    if (!product)             { errEl.textContent = 'Please select a product.'; return; }
    if (!name)                { errEl.textContent = 'Please enter your name.'; return; }
    if (text.length < 20)     { errEl.textContent = 'Please write at least 20 characters.'; return; }

    errEl.textContent  = '';
    btn.textContent    = 'Submitting…';
    btn.disabled       = true;

    try {
      // Save to Firebase ✅
      await saveReview({
        author  : name,
        product,
        rating,
        text,
        location: location || '',
        verified: true,
      });

      await renderReviews(); // refresh grid from Firebase
      renderReviewForm();    // reset the form

      if (typeof Auth !== 'undefined') Auth.showToast('Review submitted! Thank you 🔥');

    } catch (e) {
      errEl.textContent = 'Failed to submit. Please try again.';
      console.error('Review error:', e);
    } finally {
      btn.textContent = 'Submit Review';
      btn.disabled    = false;
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ───────────────────────────────────────────
  async function init() {
    await renderReviews();
    renderReviewForm();
  }

  return { init, renderReviews, renderReviewForm };

})();

document.addEventListener('DOMContentLoaded', Reviews.init);
window.Reviews = Reviews;