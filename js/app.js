/* MEXIEATS - Main Application Logic */
const MexiEats = {
  cart: JSON.parse(localStorage.getItem('mexieats_cart') || '[]'),
  promoApplied: JSON.parse(localStorage.getItem('mexieats_promo') || 'null'),

  init() {
    this.updateCartUI();
    this.initNavbar();
    this.initMobileMenu();
    this.initScrollReveal();
    this.initCartSidebar();
  },

  /* ---- Cart ---- */
  addToCart(item) {
    const existing = this.cart.find(c => c.id === item.id);
    if (existing) { existing.qty++; }
    else { this.cart.push({ ...item, qty: 1 }); }
    this.saveCart();
    this.updateCartUI();
    this.animateAddToCart();
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(c => c.id !== id);
    this.saveCart();
    this.updateCartUI();
    this.renderCartSidebar();
    this.renderCheckoutSummary && this.renderCheckoutSummary();
  },

  updateQty(id, delta) {
    const item = this.cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { this.removeFromCart(id); return; }
    this.saveCart();
    this.updateCartUI();
    this.renderCartSidebar();
    this.renderCheckoutSummary && this.renderCheckoutSummary();
  },

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  },

  getTax() { return this.getCartTotal() * 0.08; },

  getDeliveryFee() { return this.getCartTotal() >= 25 ? 0 : 3.99; },

  getGrandTotal() { return this.getCartTotal() + this.getTax() + this.getDeliveryFee() - (this.promoApplied ? this.promoApplied.discount : 0); },

  saveCart() { localStorage.setItem('mexieats_cart', JSON.stringify(this.cart)); },

  clearCart() { this.cart = []; this.promoApplied = null; localStorage.removeItem('mexieats_cart'); localStorage.removeItem('mexieats_promo'); this.updateCartUI(); },

  applyPromo(code) {
    const promos = { 'MEXI20': 20, 'WELCOME10': 10, 'FREEDELIVERY': 0 };
    if (code.toUpperCase() === 'MEXI20') { this.promoApplied = { code: 'MEXI20', discount: 20, type: 'fixed' }; }
    else if (code.toUpperCase() === 'WELCOME10') { this.promoApplied = { code: 'WELCOME10', discount: this.getCartTotal() * 0.1, type: 'percent' }; }
    else if (code.toUpperCase() === 'FREEDELIVERY') { this.promoApplied = { code: 'FREEDELIVERY', discount: this.getDeliveryFee(), type: 'delivery' }; }
    else { return false; }
    localStorage.setItem('mexieats_promo', JSON.stringify(this.promoApplied));
    return true;
  },

  /* ---- UI Updates ---- */
  updateCartUI() {
    const count = this.getCartCount();
    const badge = document.querySelector('.nav-cart-badge');
    const float = document.querySelector('.cart-float');
    const floatCount = document.querySelector('.cart-float-count');
    if (badge) { badge.textContent = count; badge.classList.toggle('visible', count > 0); }
    if (float) { float.classList.toggle('visible', count > 0); }
    if (floatCount) { floatCount.textContent = count; }

    document.querySelectorAll('.menu-card').forEach(card => {
      const id = card.dataset.id;
      const item = this.cart.find(c => c.id === id);
      const addBtn = card.querySelector('.btn-add');
      const qtyCtrl = card.querySelector('.qty-control');
      if (addBtn && qtyCtrl) {
        if (item) {
          addBtn.style.display = 'none';
          qtyCtrl.style.display = 'flex';
          const qtyVal = qtyCtrl.querySelector('.qty-value');
          if (qtyVal) qtyVal.textContent = item.qty;
          const minusBtn = qtyCtrl.querySelector('.qty-minus');
          if (minusBtn) minusBtn.disabled = item.qty <= 1;
        } else {
          addBtn.style.display = 'flex';
          qtyCtrl.style.display = 'none';
        }
      }
    });

    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
      const total = this.getCartTotal();
      const tax = this.getTax();
      const delivery = this.getDeliveryFee();
      const promoDisc = this.promoApplied ? this.promoApplied.discount : 0;
      const grandTotal = total + tax + delivery - promoDisc;
      const subEl = cartFooter.querySelector('.cart-subtotal');
      const taxEl = cartFooter.querySelector('.cart-tax');
      const delEl = cartFooter.querySelector('.cart-delivery');
      const totalEl = cartFooter.querySelector('.cart-grand-total');
      if (subEl) subEl.textContent = '$' + total.toFixed(2);
      if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
      if (delEl) delEl.textContent = delivery === 0 ? 'FREE' : '$' + delivery.toFixed(2);
      if (totalEl) totalEl.textContent = '$' + grandTotal.toFixed(2);
    }
  },

  animateAddToCart() {
    const badge = document.querySelector('.nav-cart-badge');
    if (badge) { badge.style.transform = 'scale(1.5)'; setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200); }
  },

  /* ---- Cart Sidebar ---- */
  initCartSidebar() {
    const overlay = document.querySelector('.cart-overlay');
    const sidebar = document.querySelector('.cart-sidebar');
    const openBtns = [document.querySelector('.nav-cart'), document.querySelector('.cart-float-btn')];
    const closeBtn = document.querySelector('.cart-close');

    openBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); this.openCart(); });
    });
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCart());
    if (overlay) overlay.addEventListener('click', () => this.closeCart());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeCart(); });

    this.renderCartSidebar();
  },

  openCart() {
    this.renderCartSidebar();
    document.querySelector('.cart-overlay')?.classList.add('open');
    document.querySelector('.cart-sidebar')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeCart() {
    document.querySelector('.cart-overlay')?.classList.remove('open');
    document.querySelector('.cart-sidebar')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  renderCartSidebar() {
    const container = document.querySelector('.cart-items');
    if (!container) return;
    if (this.cart.length === 0) {
      container.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><h3>Your cart is empty</h3><p>Add some delicious items to get started!</p></div>';
      const footer = document.querySelector('.cart-footer');
      if (footer) footer.style.display = 'none';
      return;
    }
    const footer = document.querySelector('.cart-footer');
    if (footer) footer.style.display = 'block';
    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">${item.emoji}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
          <div class="cart-item-qty">
            <div class="qty-control">
              <button class="qty-btn" onclick="MexiEats.updateQty('${item.id}', -1)">-</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="MexiEats.updateQty('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="MexiEats.removeFromCart('${item.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ---- Navbar ---- */
  initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  },

  initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const menu = document.querySelector('.mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        btn.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  },

  /* ---- Scroll Reveal ---- */
  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  /* ---- Menu Tabs ---- */
  initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const categories = document.querySelectorAll('.menu-category');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.category;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        categories.forEach(c => c.classList.remove('active'));
        const target = document.getElementById('cat-' + cat);
        if (target) target.classList.add('active');
      });
    });
  },

  renderMenuCards(category) {
    const container = document.querySelector('#cat-' + category + ' .menu-grid');
    if (!container || !MENU_DATA[category]) return;
    container.innerHTML = MENU_DATA[category].map(item => `
      <div class="menu-card" data-id="${item.id}">
        <div class="menu-card-image">
          ${item.badge ? `<span class="menu-card-badge ${item.badge}">${item.badge === 'popular' ? '★ Popular' : 'New'}</span>` : ''}
          ${item.img ? `<img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="menu-card-emoji-fallback" style="display:none">${item.emoji}</span>` : `<span class="menu-card-emoji-fallback">${item.emoji}</span>`}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-header">
            <span class="menu-card-title">${item.name}</span>
            <span class="menu-card-price">$${item.price.toFixed(2)}</span>
          </div>
          <p class="menu-card-desc">${item.desc}</p>
          <div class="menu-card-meta">
            <span class="menu-card-meta-item">🔥 ${item.cal} cal</span>
            <span class="menu-card-meta-item">⏱ ${item.time}</span>
          </div>
          <div class="menu-card-footer">
            <button class="btn-add" onclick="MexiEats.addToCart({id:'${item.id}',name:'${item.name.replace(/'/g, "\\'")}',price:${item.price},emoji:'${item.emoji}'})">+ Add to Order</button>
            <div class="qty-control" style="display:none">
              <button class="qty-btn qty-minus" onclick="MexiEats.updateQty('${item.id}', -1)">-</button>
              <span class="qty-value">1</span>
              <button class="qty-btn" onclick="MexiEats.updateQty('${item.id}', 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderAllCards() {
    const container = document.querySelector('#cat-all .menu-grid');
    if (!container) return;
    const allItems = Object.values(MENU_DATA).flat();
    container.innerHTML = allItems.map(item => `
      <div class="menu-card" data-id="${item.id}">
        <div class="menu-card-image">
          ${item.badge ? `<span class="menu-card-badge ${item.badge}">${item.badge === 'popular' ? '★ Popular' : 'New'}</span>` : ''}
          ${item.img ? `<img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="menu-card-emoji-fallback" style="display:none">${item.emoji}</span>` : `<span class="menu-card-emoji-fallback">${item.emoji}</span>`}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-header">
            <span class="menu-card-title">${item.name}</span>
            <span class="menu-card-price">$${item.price.toFixed(2)}</span>
          </div>
          <p class="menu-card-desc">${item.desc}</p>
          <div class="menu-card-meta">
            <span class="menu-card-meta-item">🔥 ${item.cal} cal</span>
            <span class="menu-card-meta-item">⏱ ${item.time}</span>
          </div>
          <div class="menu-card-footer">
            <button class="btn-add" onclick="MexiEats.addToCart({id:'${item.id}',name:'${item.name.replace(/'/g, "\\'")}',price:${item.price},emoji:'${item.emoji}'})">+ Add to Order</button>
            <div class="qty-control" style="display:none">
              <button class="qty-btn qty-minus" onclick="MexiEats.updateQty('${item.id}', -1)">-</button>
              <span class="qty-value">1</span>
              <button class="qty-btn" onclick="MexiEats.updateQty('${item.id}', 1)">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ---- Checkout ---- */
  renderCheckoutSummary() {
    const container = document.querySelector('.checkout-items-list');
    if (!container) return;
    container.innerHTML = this.cart.map(item => `
      <div class="checkout-item">
        <div class="checkout-item-img">${item.emoji}</div>
        <div class="checkout-item-info">
          <div class="checkout-item-title">${item.name}</div>
          <div class="checkout-item-qty">${item.qty}x</div>
        </div>
        <div class="checkout-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>
    `).join('');

    const total = this.getCartTotal();
    const tax = this.getTax();
    const delivery = this.getDeliveryFee();
    const promoDisc = this.promoApplied ? this.promoApplied.discount : 0;
    const grand = total + tax + delivery - promoDisc;

    const rows = document.querySelector('.checkout-totals');
    if (rows) {
      rows.innerHTML = `
        <div class="checkout-total-row"><span>Subtotal</span><span>$${total.toFixed(2)}</span></div>
        <div class="checkout-total-row"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="checkout-total-row"><span>Delivery</span><span>${delivery === 0 ? 'FREE' : '$' + delivery.toFixed(2)}</span></div>
        ${promoDisc > 0 ? `<div class="checkout-total-row" style="color:var(--secondary)"><span>Discount</span><span>-$${promoDisc.toFixed(2)}</span></div>` : ''}
        <div class="checkout-total-row final"><span>Total</span><span>$${grand.toFixed(2)}</span></div>
      `;
    }
  },

  initCheckout() {
    this.renderCheckoutSummary();

    document.querySelectorAll('.delivery-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.delivery-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const timeSlots = document.querySelector('.time-slots');
        if (timeSlots) timeSlots.style.display = opt.dataset.type === 'delivery' ? 'grid' : 'none';
      });
    });

    document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
      slot.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
      });
    });

    document.querySelectorAll('.payment-method').forEach(method => {
      method.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
        document.querySelectorAll('.payment-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('panel-' + method.dataset.method);
        if (panel) panel.classList.add('selected');
        document.querySelectorAll('.payment-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + method.dataset.method)?.classList.add('active');
      });
    });

    document.querySelectorAll('.cash-amount').forEach(amt => {
      amt.addEventListener('click', () => {
        document.querySelectorAll('.cash-amount').forEach(a => a.classList.remove('selected'));
        amt.classList.add('selected');
        const total = this.getGrandTotal();
        const tendered = parseFloat(amt.dataset.amount);
        const change = Math.max(0, tendered - total);
        const changeDisplay = document.querySelector('.change-display');
        if (changeDisplay) {
          changeDisplay.style.display = 'flex';
          changeDisplay.querySelector('.amount').textContent = '$' + change.toFixed(2);
          changeDisplay.querySelector('.paying-with').textContent = '$' + tendered.toFixed(2) + ' Cash';
        }
      });
    });

    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.cart.length === 0) { alert('Your cart is empty!'); return; }
        if (!this.validateCheckoutForm()) return;
        const selectedPayment = document.querySelector('.payment-method.selected');
        if (!selectedPayment) { alert('Please select a payment method.'); return; }
        this.processOrder(selectedPayment.dataset.method);
      });
    }
  },

  validateCheckoutForm() {
    let valid = true;
    const fields = ['full-name', 'email', 'phone', 'address', 'city', 'zip'];
    fields.forEach(id => {
      const input = document.getElementById(id);
      const group = input?.closest('.form-group');
      if (input && !input.value.trim()) {
        group?.classList.add('error');
        valid = false;
      } else {
        group?.classList.remove('error');
      }
    });
    return valid;
  },

  processOrder(method) {
    const btn = document.querySelector('.btn-checkout');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
    setTimeout(() => {
      const orderNum = 'MX-' + Math.floor(10000 + Math.random() * 90000);
      localStorage.setItem('mexieats_last_order', JSON.stringify({
        orderNum,
        items: [...this.cart],
        total: this.getGrandTotal(),
        payment: method,
        date: new Date().toISOString()
      }));
      this.clearCart();
      window.location.href = 'confirmation.html';
    }, 2000);
  },

  /* ---- Confirmation ---- */
  renderConfirmation() {
    const order = JSON.parse(localStorage.getItem('mexieats_last_order') || 'null');
    if (!order) return;
    const el = document.getElementById('order-number');
    if (el) el.textContent = order.orderNum;
    const total = document.getElementById('order-total');
    if (total) total.textContent = '$' + order.total.toFixed(2);
    const payment = document.getElementById('order-payment');
    if (payment) payment.textContent = order.payment.charAt(0).toUpperCase() + order.payment.slice(1);
    const date = document.getElementById('order-date');
    if (date) date.textContent = new Date(order.date).toLocaleString();
  },

  initTracking() {
    let step = 0;
    const steps = document.querySelectorAll('.tracking-step');
    const interval = setInterval(() => {
      if (step < steps.length) {
        steps[step]?.classList.add('completed');
        steps[step + 1]?.classList.add('active');
        step++;
      } else { clearInterval(interval); }
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => MexiEats.init());
