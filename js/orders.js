// ── ORDERS.JS ────────────────────────────────────────
// Cart, checkout, payment options (COD / UPI / Netbanking)
// ────────────────────────────────────────────────────

const Orders = (() => {

  const CART_KEY   = 'vh_cart';
  const ORDERS_KEY = 'vh_orders';

  // ── Products Catalogue ─────────────────────────────
  const PRODUCTS = [
    {
      id: 'p1',
      name: 'Bhoot Jolokia Pickle',
      variant: 'Original — 100ml',
      price: 249,
      heat: 5,
      img: 'image/mainpic.png',
      desc: 'The original. Made from hand-picked Bhoot Jolokia from Tezpur, slow-cooked in cold-pressed mustard oil with traditional Assamese spices. Extreme heat, pure authenticity.',
      features: ['1,000,000+ Scoville Heat Units', 'Hand-picked Ghost Peppers', 'No artificial preservatives', 'Small-batch crafted in Assam']
    },
    {
      id: 'p2',
      name: 'Double Smoked',
      variant: 'Smoked Variant — 100ml',
      price: 279,
      heat: 4,
      img: 'image/doubleSmoked.jpeg',
      desc: 'Ghost peppers double-smoked over hardwood for a deep, complex flavour layered beneath searing heat. Smoky, bold, unrelenting.',
      features: ['Double-smoked over hardwood', 'Deep smoky flavour profile', 'High heat — 4/5 intensity', 'Small-batch crafted in Assam']
    },
    {
      id: 'p3',
      name: 'Garlic Infused',
      variant: 'Garlic Variant — 100ml',
      price: 259,
      heat: 3,
      img: 'image/garlicinfused.jpeg',
      desc: 'Our most versatile variant — whole garlic cloves slow-cooked into the pickle for a rich, aromatic heat that builds slowly and lingers.',
      features: ['Whole garlic cloves infused', 'Rich aromatic base', 'Medium-high heat — 3/5 intensity', 'Pairs perfectly with everything']
    },
  ];

  // ── Cart State ─────────────────────────────────────
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function getCartCount() { return cart.reduce((sum, i) => sum + i.qty, 0); }
  function getCartTotal() { return cart.reduce((sum, i) => sum + i.price * i.qty, 0); }
  function getShipping() { return getCartTotal() >= 499 ? 0 : 49; }
  function getGrandTotal() { return getCartTotal() + getShipping(); }
  function getProduct(id) { return PRODUCTS.find(p => p.id === id); }

  // ── Add / Remove / Update ──────────────────────────
  function addToCart(productId, qty = 1) {
    const product = getProduct(productId);
    if (!product) return;
    const existing = cart.find(i => i.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ ...product, qty });
    }
    saveCart();
    updateCartBadge();
    if (typeof Auth !== 'undefined') Auth.showToast(`${product.name} added to cart! 🛒`);
  }

  function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartBadge();
    renderCartItems();
  }

  function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    renderCartItems();
    updateCartBadge();
  }

  // ── Cart Badge ─────────────────────────────────────
  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const count = getCartCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  // ── Inject Cart Icon in Nav ────────────────────────
  function injectCartIcon() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    const btn = document.createElement('button');
    btn.id = 'cart-btn';
    btn.innerHTML = `
      <span style="font-size:1.1rem;">🛒</span>
      <span id="cart-badge" style="
        display:none;position:absolute;top:-6px;right:-8px;
        background:#E85D04;color:#0D0D0D;
        font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;font-weight:700;
        min-width:16px;height:16px;border-radius:50%;
        align-items:center;justify-content:center;padding:0 3px;
      ">${getCartCount()}</span>
    `;
    btn.style.cssText = `
      position:relative;background:none;border:1px solid rgba(245,239,224,0.15);
      color:#F5EFE0;padding:0.45rem 0.7rem;cursor:pointer;
    `;
    btn.onclick = openCartDrawer;
    navRight.insertBefore(btn, navRight.firstChild);
    updateCartBadge();
  }

  // ── Cart Drawer ────────────────────────────────────
  function injectCartDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-overlay" id="cart-overlay"></div>
      <div class="cart-panel">
        <div class="cart-header">
          <span style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:0.05em;">Your Cart</span>
          <button id="cart-close">&times;</button>
        </div>
        <div id="cart-items" class="cart-items"></div>
        <div class="cart-footer">
          <div class="cart-total-row">
            <span>Subtotal</span>
            <span id="cart-subtotal">₹0</span>
          </div>
          <div class="cart-total-row" style="font-size:1rem;color:rgba(245,239,224,0.5)">
            <span>Shipping</span>
            <span id="cart-shipping-val">₹49</span>
          </div>
          <div class="cart-total-row" style="border-top:1px solid rgba(245,239,224,0.1);padding-top:0.75rem;margin-top:0.5rem;">
            <span>Total</span>
            <span id="cart-total-amount">₹0</span>
          </div>
          <p class="cart-shipping-note">Free shipping on orders above ₹499</p>
          <button class="cart-checkout-btn" id="cart-checkout">Proceed to Checkout</button>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
    document.getElementById('cart-overlay').onclick = closeCartDrawer;
    document.getElementById('cart-close').onclick = closeCartDrawer;
    document.getElementById('cart-checkout').onclick = handleCheckout;
  }

  function openCartDrawer() {
    renderCartItems();
    document.getElementById('cart-drawer').classList.add('open');
  }

  function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('open');
  }

  function renderCartItems() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping-val');
    const totalEl = document.getElementById('cart-total-amount');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Add some heat! 🌶️</p>';
      if (subtotalEl) subtotalEl.textContent = '₹0';
      if (shippingEl) shippingEl.textContent = '₹49';
      if (totalEl) totalEl.textContent = '₹49';
      return;
    }

    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-variant">${item.variant}</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="Orders.updateQty('${item.id}', -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="Orders.updateQty('${item.id}', 1)">+</button>
          </div>
          <button class="cart-remove" onclick="Orders.removeFromCart('${item.id}')">Remove</button>
        </div>
        <div class="cart-item-price">₹${item.price * item.qty}</div>
      </div>
    `).join('');

    const sub = getCartTotal();
    const ship = getShipping();
    if (subtotalEl) subtotalEl.textContent = `₹${sub}`;
    if (shippingEl) shippingEl.textContent = ship === 0 ? 'FREE' : `₹${ship}`;
    if (totalEl) totalEl.textContent = `₹${sub + ship}`;
  }

  // ── Checkout ───────────────────────────────────────
  function handleCheckout() {
    if (typeof Auth !== 'undefined' && !Auth.getUser()) {
      closeCartDrawer();
      Auth.showToast('Please login to place an order.');
      Auth.openModal('login');
      return;
    }
    if (cart.length === 0) {
      if (typeof Auth !== 'undefined') Auth.showToast('Your cart is empty!');
      return;
    }
    closeCartDrawer();
    openCheckoutModal();
  }

  // ── Checkout Modal ─────────────────────────────────
  function injectCheckoutModal() {
    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.innerHTML = `
      <div class="checkout-overlay" id="checkout-overlay"></div>
      <div class="checkout-box">
        <button class="checkout-close" id="checkout-close">&times;</button>
        <h2 class="checkout-title">Checkout</h2>
        <p class="checkout-sub">Almost there — fill in your details below.</p>

        <div class="checkout-section-title">Delivery Address</div>
        <div class="checkout-field">
          <label>Full Name</label>
          <input type="text" id="co-name" placeholder="Your full name" />
        </div>
        <div class="checkout-row">
          <div class="checkout-field">
            <label>Email</label>
            <input type="email" id="co-email" placeholder="you@email.com" />
          </div>
          <div class="checkout-field">
            <label>Phone</label>
            <input type="tel" id="co-phone" placeholder="+91 XXXXX XXXXX" />
          </div>
        </div>
        <div class="checkout-field">
          <label>Address Line 1</label>
          <input type="text" id="co-addr1" placeholder="House/Flat no., Building name" />
        </div>
        <div class="checkout-field">
          <label>Address Line 2</label>
          <input type="text" id="co-addr2" placeholder="Street, Area (optional)" />
        </div>
        <div class="checkout-row">
          <div class="checkout-field">
            <label>City</label>
            <input type="text" id="co-city" placeholder="City" />
          </div>
          <div class="checkout-field">
            <label>PIN Code</label>
            <input type="text" id="co-pin" placeholder="XXXXXX" maxlength="6" />
          </div>
        </div>
        <div class="checkout-field">
          <label>State</label>
          <select id="co-state">
            <option value="">Select state...</option>
            <option>Assam</option><option>Andhra Pradesh</option>
            <option>Bihar</option><option>Delhi</option>
            <option>Goa</option><option>Gujarat</option>
            <option>Haryana</option><option>Karnataka</option>
            <option>Kerala</option><option>Madhya Pradesh</option>
            <option>Maharashtra</option><option>Manipur</option>
            <option>Meghalaya</option><option>Mizoram</option>
            <option>Nagaland</option><option>Odisha</option>
            <option>Punjab</option><option>Rajasthan</option>
            <option>Sikkim</option><option>Tamil Nadu</option>
            <option>Telangana</option><option>Tripura</option>
            <option>Uttar Pradesh</option><option>Uttarakhand</option>
            <option>West Bengal</option>
          </select>
        </div>

        <div class="checkout-section-title">Payment Method</div>
        <div class="payment-options" id="payment-options">
          <div class="payment-option selected" data-method="cod">
            <div class="payment-radio-dot"></div>
            <div class="payment-icon">💵</div>
            <div class="payment-info">
              <div class="payment-label">Cash on Delivery</div>
              <div class="payment-desc">Pay when your order arrives</div>
            </div>
          </div>
          <div class="payment-option" data-method="upi">
            <div class="payment-radio-dot"></div>
            <div class="payment-icon">📱</div>
            <div class="payment-info">
              <div class="payment-label">UPI</div>
              <div class="payment-desc">Pay via Google Pay, PhonePe, Paytm & more</div>
            </div>
          </div>
          <div class="payment-option" data-method="netbanking">
            <div class="payment-radio-dot"></div>
            <div class="payment-icon">🏦</div>
            <div class="payment-info">
              <div class="payment-label">Net Banking</div>
              <div class="payment-desc">All major Indian banks supported</div>
            </div>
          </div>
        </div>

        <!-- UPI ID field (shown when UPI selected) -->
        <div class="upi-field checkout-field" id="upi-field">
          <label>UPI ID</label>
          <input type="text" id="co-upi" placeholder="yourname@upi" />
        </div>

        <div class="checkout-section-title">Order Summary</div>
        <div class="checkout-summary" id="checkout-summary"></div>

        <p id="checkout-error" style="font-size:0.82rem;color:#E85D04;min-height:1.2em;margin-bottom:0.5rem;"></p>
        <button class="checkout-place-btn" id="place-order-btn">Place Order</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('checkout-overlay').onclick = closeCheckoutModal;
    document.getElementById('checkout-close').onclick = closeCheckoutModal;
    document.getElementById('place-order-btn').onclick = placeOrder;

    // Payment option selection
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const upiField = document.getElementById('upi-field');
        if (upiField) {
          upiField.classList.toggle('show', opt.dataset.method === 'upi');
        }
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeCheckoutModal();
    });
  }

  function openCheckoutModal() {
    // Prefill user data
    const user = Auth ? Auth.getUser() : null;
    if (user) {
      const nameEl = document.getElementById('co-name');
      const emailEl = document.getElementById('co-email');
      const phoneEl = document.getElementById('co-phone');
      if (nameEl && !nameEl.value) nameEl.value = user.name;
      if (emailEl && !emailEl.value) emailEl.value = user.email;
      if (phoneEl && !phoneEl.value && user.phone) phoneEl.value = user.phone;
    }
    renderCheckoutSummary();
    document.getElementById('checkout-modal').classList.add('open');
  }

  function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
  }

  function renderCheckoutSummary() {
    const el = document.getElementById('checkout-summary');
    if (!el) return;
    const sub = getCartTotal();
    const ship = getShipping();
    el.innerHTML = `
      ${cart.map(item => `
        <div class="summary-item">
          <span>${item.name} × ${item.qty}</span>
          <span>₹${item.price * item.qty}</span>
        </div>
      `).join('')}
      <div class="summary-item">
        <span>Shipping</span>
        <span>${ship === 0 ? 'FREE' : '₹' + ship}</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>₹${sub + ship}</span>
      </div>
    `;
  }

  function placeOrder() {
    const name = (document.getElementById('co-name') || {}).value?.trim();
    const email = (document.getElementById('co-email') || {}).value?.trim();
    const phone = (document.getElementById('co-phone') || {}).value?.trim();
    const addr1 = (document.getElementById('co-addr1') || {}).value?.trim();
    const city = (document.getElementById('co-city') || {}).value?.trim();
    const pin = (document.getElementById('co-pin') || {}).value?.trim();
    const state = (document.getElementById('co-state') || {}).value;
    const errEl = document.getElementById('checkout-error');

    const selectedPayment = document.querySelector('.payment-option.selected');
    const paymentMethod = selectedPayment ? selectedPayment.dataset.method : 'cod';

    // Validation
    if (!name) { errEl.textContent = 'Please enter your full name.'; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email.'; return; }
    if (!phone || phone.length < 10) { errEl.textContent = 'Please enter a valid phone number.'; return; }
    if (!addr1) { errEl.textContent = 'Please enter your address.'; return; }
    if (!city) { errEl.textContent = 'Please enter your city.'; return; }
    if (!pin || pin.length !== 6 || isNaN(pin)) { errEl.textContent = 'Please enter a valid 6-digit PIN code.'; return; }
    if (!state) { errEl.textContent = 'Please select your state.'; return; }

    if (paymentMethod === 'upi') {
      const upiId = (document.getElementById('co-upi') || {}).value?.trim();
      if (!upiId || !upiId.includes('@')) { errEl.textContent = 'Please enter a valid UPI ID.'; return; }
    }

    errEl.textContent = '';

    // Save order
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    const order = {
      id: 'VH' + Date.now(),
      items: [...cart],
      subtotal: getCartTotal(),
      shipping: getShipping(),
      total: getGrandTotal(),
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Net Banking',
      address: { name, email, phone, addr1, city, pin, state },
      date: new Date().toLocaleDateString('en-IN'),
      status: paymentMethod === 'cod' ? 'Confirmed — Pay on Delivery' : 'Payment Pending',
    };
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Clear cart
    cart = [];
    saveCart();
    updateCartBadge();
    closeCheckoutModal();

    // Success screen
    showOrderSuccess(order);
  }

  function showOrderSuccess(order) {
    let overlay = document.getElementById('order-success-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'order-success-overlay';
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:2000;
        background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
      `;
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div style="
        background:#1A1A1A;border:1px solid rgba(139,26,26,0.5);
        padding:3rem 2.5rem;max-width:480px;width:92vw;text-align:center;
      ">
        <div style="font-size:3rem;margin-bottom:1rem;">🔥</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;color:#F5EFE0;letter-spacing:0.05em;margin-bottom:0.5rem;">Order Confirmed!</div>
        <div style="font-size:0.9rem;color:rgba(245,239,224,0.5);margin-bottom:2rem;">
          Order ID: <strong style="color:#E85D04;">${order.id}</strong>
        </div>
        <div style="background:rgba(139,26,26,0.1);border:1px solid rgba(139,26,26,0.2);padding:1.2rem;margin-bottom:1.5rem;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;color:#E85D04;margin-bottom:0.8rem;">Order Details</div>
          ${order.items.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:rgba(245,239,224,0.6);padding:0.25rem 0;">
              <span>${i.name} × ${i.qty}</span><span>₹${i.price * i.qty}</span>
            </div>
          `).join('')}
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:rgba(245,239,224,0.4);padding:0.25rem 0;">
            <span>Shipping</span><span>${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:#F5EFE0;padding-top:0.6rem;margin-top:0.6rem;border-top:1px solid rgba(245,239,224,0.1);">
            <span>Total</span><span>₹${order.total}</span>
          </div>
        </div>
        <div style="font-size:0.82rem;color:rgba(245,239,224,0.4);margin-bottom:0.5rem;">
          Payment: <strong style="color:#F5EFE0;">${order.paymentMethod}</strong>
        </div>
        <div style="font-size:0.82rem;color:rgba(245,239,224,0.3);margin-bottom:2rem;">
          Delivering to ${order.address.city}, ${order.address.state}
        </div>
        <button onclick="document.getElementById('order-success-overlay').style.display='none';" style="
          font-family:'Barlow Condensed',sans-serif;letter-spacing:0.15em;text-transform:uppercase;
          background:linear-gradient(135deg,#8B1A1A,#C0392B);color:#F5EFE0;border:none;
          padding:0.85rem 2.5rem;cursor:pointer;font-size:0.9rem;
        ">Continue Shopping</button>
      </div>
    `;
    overlay.style.display = 'flex';
  }

  // ── Wire Product Buttons ───────────────────────────
  function bindProductButtons() {
    document.querySelectorAll('.card-btn').forEach((btn, i) => {
      const productId = `p${i + 1}`;
      btn.onclick = (e) => {
        e.stopPropagation();
        addToCart(productId);
      };
    });

    // Click on product card → go to product detail
    document.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-btn')) return;
        goToProduct(`p${i + 1}`);
      });
    });
  }

  function goToProduct(productId) {
    // Store in sessionStorage and load product page
    sessionStorage.setItem('vh_selected_product', productId);
    window.location.href = 'pages/product.html';
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    injectCartDrawer();
    injectCheckoutModal();
    injectCartIcon();
    bindProductButtons();
  }

  return {
    init,
    addToCart,
    removeFromCart,
    updateQty,
    getProduct,
    getProducts: () => PRODUCTS,
    goToProduct,
    openCartDrawer,
  };

})();

document.addEventListener('DOMContentLoaded', Orders.init);
