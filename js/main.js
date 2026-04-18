// ── MAIN.JS ─────────────────────────────────────────
// Scroll reveal animation + Nav scroll effect
// ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Scroll Reveal
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));

  // Nav scroll border effect
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (!nav) return;
    nav.style.borderBottomColor = window.scrollY > 60
      ? 'rgba(139,26,26,0.6)'
      : 'rgba(139,26,26,0.3)';
  });

  // "Shop Now" button → scroll to products
  const shopNowBtn = document.querySelector('.btn-primary');
  if (shopNowBtn) {
    shopNowBtn.addEventListener('click', () => {
      const productSection = document.getElementById('product');
      if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Footer newsletter mock subscribe
  const newsletterForm = document.querySelector('.footer-newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      if (input && input.value) {
        if (typeof Auth !== 'undefined') Auth.showToast('Subscribed! Heat news incoming 🔥');
        input.value = '';
      }
    });
    // Also bind button click
    const btn = newsletterForm.querySelector('button');
    if (btn) btn.addEventListener('click', (e) => {
      e.preventDefault();
      newsletterForm.dispatchEvent(new Event('submit'));
    });
  }

});
