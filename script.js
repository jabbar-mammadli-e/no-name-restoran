/* ============================================================
   No Name Restaurant – Admin Panel | script.js
   ============================================================ */

// ===== STATE =====
const state = {
  restaurantInfo: {
    name: 'No Name Restaurant',
    desc: 'Dadlı anlar, unudulmaz təcrübə...',
    address: 'Şəki, Azərbaycan',
    phone: '+994 50 123 45 67',
    insta: '@noname.restaurant',
    logoUrl: null,
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'
  },
  menuItems: [
    { id: 1, name: 'Kabab', price: 12, category: 'Kabablar', desc: 'Ləzzətli Azərbaycan kababi', popular: true, outOfStock: false, emoji: '🍖', imgUrl: null },
    { id: 2, name: 'Plov', price: 10, category: 'Kabablar', desc: 'Ənənəvi Azərbaycan plovu', popular: false, outOfStock: false, emoji: '🍚', imgUrl: null },
    { id: 3, name: 'Marqarita Pizza', price: 14, category: 'Pizzalar', desc: 'İtalyan üslublu pizza', popular: true, outOfStock: false, emoji: '🍕', imgUrl: null },
    { id: 4, name: 'Şəki Pitiси', price: 16, category: 'Şorbalar', desc: 'Ənənəvi Şəki pitisi', popular: true, outOfStock: false, emoji: '🍲', imgUrl: null },
    { id: 5, name: 'Çoban Salat', price: 8, category: 'Salatlar', desc: 'Təzə tərəvəzlər ilə', popular: false, outOfStock: false, emoji: '🥗', imgUrl: null },
    { id: 6, name: 'Şaşlıq', price: 16, category: 'Kabablar', desc: 'Manqalda bişirilmiş', popular: false, outOfStock: false, emoji: '🍢', imgUrl: null },
  ],
  orders: [
    { id: 1028, customer: 'Aysel Əliyeva', phone: '050 123 45 67', items: [{name:'Kabab',qty:2,price:12},{name:'Plov',qty:1,price:10}], total: 34, type: 'delivery', status: 'Qəbul Edildi', time: '14:32', address: 'Şəki şəhəri, M.Ə. Rəsulzadə küçəsi, bina 12, mənzil 48', note: 'Zəng etməyin, qapıya gəlin.', lat: 41.1978, lon: 47.1706, table: null },
    { id: 1027, customer: 'Rəşad Məmmədov', phone: '051 234 56 78', items: [{name:'Marqarita Pizza',qty:1,price:14}], total: 14, type: 'dine', status: 'Hazırlanır', time: '14:28', address: null, note: '', lat: null, lon: null, table: '5' },
    { id: 1026, customer: 'Nigar İsmayılova', phone: '055 345 67 89', items: [{name:'Şaşlıq',qty:1,price:16}], total: 16, type: 'delivery', status: 'Yoldadır', time: '14:20', address: 'Şəki, İstiqlaliyyət küç. 7', note: '', lat: 41.1990, lon: 47.1720, table: null },
    { id: 1025, customer: 'Tural Quliyev', phone: '070 456 78 90', items: [{name:'Plov',qty:1,price:10}], total: 10, type: 'dine', status: 'Tamamlandı', time: '13:55', address: null, note: '', lat: null, lon: null, table: '3' },
    { id: 1024, customer: 'Leyla Hüseynova', phone: '077 567 89 01', items: [{name:'Çoban Salat',qty:1,price:8},{name:'Plov',qty:1,price:10}], total: 18, type: 'delivery', status: 'Ləğv Edildi', time: '13:40', address: 'Şəki, Nizami küç. 15', note: 'Tez gətirin', lat: 41.1965, lon: 47.1695, table: null },
    { id: 1023, customer: 'Kamran Nəsirov', phone: '099 678 90 12', items: [{name:'Kabab',qty:3,price:12}], total: 36, type: 'delivery', status: 'Yeni', time: '15:10', address: 'Şəki, Həsən bəy Zərdabi küç. 3', note: '', lat: 41.2010, lon: 47.1730, table: null },
  ],
  customers: [],
  activeOrderId: 1028,
  newOrderIdx: 0,
  revenueChart: null,
  donutChart: null,
  statsRevChart: null,
  statsDonutChart: null,
  currentLang: 'az',
  currentPage: 'dashboard',
  mapInstance: null,
  orderMapInstance: null,
  nextFoodId: 7,
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  buildCustomers();
  navigate('dashboard');
  setupMenuToggle();
  updateStats();
  renderDashOrders();
  renderCategoryGrid();
  renderRightPanel();
  setTimeout(initDonutChart, 300);
  setTimeout(initRevenueChart, 300);
});

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const titles = {
    dashboard: 'Ana Panel', menu: 'Menyu', orders: 'Sifarişlər',
    customers: 'Müştərilər', map: 'Çatdırılma Xəritəsi',
    stats: 'Statistika', settings: 'Parametrlər',
    profile: 'Profil Ayarları', languages: 'Dillər'
  };
  document.getElementById('pageTitle').textContent = titles[page] || '';
  state.currentPage = page;

  if (page === 'orders') renderOrdersPage();
  if (page === 'customers') renderCustomers();
  if (page === 'map') setTimeout(initDeliveryMap, 100);
  if (page === 'stats') setTimeout(initStatsCharts, 200);
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  showToast('Sistemdən çıxış edildi');
  setTimeout(() => location.reload(), 1500);
});

function setupMenuToggle() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
}

// ===== STATS =====
function updateStats() {
  document.getElementById('statMenuCount').textContent = state.menuItems.length;
  document.getElementById('statOrderCount').textContent = state.orders.length;
  const total = state.orders.filter(o => o.status === 'Tamamlandı').reduce((s, o) => s + o.total, 0);
  document.getElementById('statRevenue').textContent = total + ' ₼';
  const newCount = state.orders.filter(o => o.status === 'Yeni').length;
  document.getElementById('statNewOrders').textContent = `↑ ${newCount} yeni`;

  // Revenue summary
  const todayRev = state.orders.filter(o => o.status === 'Tamamlandı').reduce((s,o) => s+o.total, 0);
  document.getElementById('dailyRev').textContent = todayRev + ' ₼';
  document.getElementById('weeklyRev').textContent = (todayRev * 7) + ' ₼';
  document.getElementById('monthlyRev').textContent = (todayRev * 30) + ' ₼';

  // Badge
  document.getElementById('orderBadge').textContent = newCount;
  document.getElementById('notifCount').textContent = newCount;

  // Donut text
  const total128 = state.orders.length;
  const dine = state.orders.filter(o => o.type === 'dine').length;
  const del = state.orders.filter(o => o.type === 'delivery').length;
  const dinePct = total128 > 0 ? Math.round(dine/total128*100) : 0;
  const delPct = 100 - dinePct;
  document.getElementById('dinePercent').textContent = dinePct + '%';
  document.getElementById('deliveryPercent').textContent = delPct + '%';
  document.getElementById('donutTotal').textContent = total128 + ' Sifariş';
}

// ===== DASHBOARD ORDERS TABLE =====
function renderDashOrders() {
  const tbody = document.getElementById('dashOrdersBody');
  tbody.innerHTML = '';
  const recent = state.orders.slice(0, 5);
  recent.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--gold);font-weight:700;">#${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.items.map(i=>`${i.qty} × ${i.name}`).join(', ')}</td>
      <td class="amount-gold">${order.total}.00 ₼</td>
      <td class="type-badge">${order.type==='delivery'?'<i class="fas fa-truck" style="color:var(--gold)"></i> Çatdırılma':'<i class="fas fa-utensils" style="color:var(--text-muted)"></i> Restoranda'}</td>
      <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
      <td style="color:var(--text-muted);">${order.time}</td>
    `;
    tr.style.cursor = 'pointer';
    tr.onclick = () => showOrderDetail(order.id);
    tbody.appendChild(tr);
  });
}

function getStatusClass(status) {
  const map = {
    'Yeni': 'new', 'Qəbul Edildi': 'accepted', 'Hazırlanır': 'preparing',
    'Kuryerə Verildi': 'courier', 'Yoldadır': 'onway',
    'Tamamlandı': 'done', 'Ləğv Edildi': 'cancelled'
  };
  return map[status] || 'new';
}

// ===== CATEGORY GRID =====
function renderCategoryGrid() {
  const cats = [
    { name: 'Kabablar', emoji: '🍖' },
    { name: 'Pizzalar', emoji: '🍕' },
    { name: 'Salatlar', emoji: '🥗' },
    { name: 'Şorbalar', emoji: '🍲' },
  ];
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = '';
  cats.forEach(cat => {
    const count = state.menuItems.filter(m => m.category === cat.name).length;
    const div = document.createElement('div');
    div.className = 'cat-item';
    div.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><div class="cat-item-info"><strong>${cat.name}</strong><span>${count} məhsul</span></div>`;
    div.onclick = () => { navigate('menu'); filterMenu(cat.name, null); };
    grid.appendChild(div);
  });
}

// ===== RIGHT PANEL =====
function renderRightPanel() {
  const order = state.orders.find(o => o.id === state.activeOrderId);
  if (!order) return;

  document.getElementById('newOrderNum').textContent = `Yeni Sifariş #${order.id}`;
  document.getElementById('newOrderType').textContent = order.type === 'delivery' ? 'Çatdırılma' : 'Restoranda';
  document.getElementById('newOrderCustomer').textContent = order.customer;
  document.getElementById('newOrderPhone').textContent = order.phone;
  document.getElementById('newOrderNote').textContent = order.note || 'Qeyd yoxdur';
  document.getElementById('newOrderTotal').textContent = order.total + '.00 ₼';

  // Map
  if (order.lat && order.lon) {
    document.getElementById('mapOpenLink').href = `https://www.openstreetmap.org/?mlat=${order.lat}&mlon=${order.lon}&zoom=16`;
    setTimeout(() => initOrderMap(order.lat, order.lon), 200);
  } else {
    document.getElementById('newOrderMapWrap').innerHTML = `<div style="height:130px;background:var(--bg-card2);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;"><i class="fas fa-utensils" style="margin-right:6px;"></i> Stol № ${order.table || '-'}</div>`;
  }

  // Items
  const itemsDiv = document.getElementById('newOrderItems');
  itemsDiv.innerHTML = '';
  order.items.forEach(item => {
    const food = state.menuItems.find(m => m.name === item.name);
    const div = document.createElement('div');
    div.className = 'order-item-row';
    div.innerHTML = `
      <div class="order-item-img">${food?.imgUrl ? `<img src="${food.imgUrl}">` : (food?.emoji || '🍽️')}</div>
      <div class="order-item-name"><strong>${item.name}</strong><span>${item.qty} ədəd</span></div>
      <div class="order-item-price">${item.qty * item.price}.00 ₼</div>
    `;
    itemsDiv.appendChild(div);
  });
}

function initOrderMap(lat, lon) {
  const container = document.getElementById('newOrderMapWrap');
  container.innerHTML = '';
  const mapDiv = document.createElement('div');
  mapDiv.style.cssText = 'height:130px;border-radius:10px;';
  container.appendChild(mapDiv);

  if (state.orderMapInstance) {
    state.orderMapInstance.remove();
    state.orderMapInstance = null;
  }
  state.orderMapInstance = L.map(mapDiv, { zoomControl: false, scrollWheelZoom: false }).setView([lat, lon], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(state.orderMapInstance);
  const goldIcon = L.divIcon({ html: '<div style="font-size:24px;margin-top:-12px;">📍</div>', className: '', iconSize: [30, 30] });
  L.marker([lat, lon], { icon: goldIcon }).addTo(state.orderMapInstance);
}

// ===== ACCEPT / PREPARE ORDER =====
function acceptOrder() {
  const order = state.orders.find(o => o.id === state.activeOrderId);
  if (order) {
    order.status = 'Qəbul Edildi';
    showToast(`Sifariş #${order.id} qəbul edildi`);
    renderDashOrders();
    updateStats();
  }
}

function prepareOrder() {
  const order = state.orders.find(o => o.id === state.activeOrderId);
  if (order) {
    order.status = 'Hazırlanır';
    showToast(`Sifariş #${order.id} hazırlanır`);
    renderDashOrders();
    updateStats();
  }
}

// ===== MENU PAGE =====
function renderMenuPage(filter = 'all') {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '';
  const items = filter === 'all' ? state.menuItems : state.menuItems.filter(m => m.category === filter);
  if (items.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Bu kateqoriyada yemək yoxdur.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-item-card';
    card.innerHTML = `
      ${item.popular ? '<span class="badge-popular">🔥 Populyar</span>' : ''}
      ${item.outOfStock ? '<span class="badge-out">❌ Stokda yox</span>' : ''}
      <div class="menu-item-img">${item.imgUrl ? `<img src="${item.imgUrl}" alt="${item.name}">` : item.emoji}</div>
      <div class="menu-item-body">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
        <div class="menu-item-footer">
          <span class="menu-item-price">${item.price}.00 ₼</span>
          <div class="menu-item-actions">
            <button onclick="editFood(${item.id})" title="Redaktə"><i class="fas fa-edit"></i></button>
            <button class="del-btn" onclick="deleteFood(${item.id})" title="Sil"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterMenu(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMenuPage(cat);
}

function openAddFood() {
  document.getElementById('foodModalTitle').innerHTML = '<i class="fas fa-plus"></i> Yemək Əlavə Et';
  document.getElementById('foodEditId').value = '';
  document.getElementById('foodName').value = '';
  document.getElementById('foodPrice').value = '';
  document.getElementById('foodCategory').value = 'Kabablar';
  document.getElementById('foodDesc').value = '';
  document.getElementById('foodPopular').checked = false;
  document.getElementById('foodOutOfStock').checked = false;
  document.getElementById('foodImgPreview').style.display = 'none';
  document.getElementById('foodImgPlaceholder').style.display = 'flex';
  openModal('foodModal');
}

function editFood(id) {
  const item = state.menuItems.find(m => m.id === id);
  if (!item) return;
  document.getElementById('foodModalTitle').innerHTML = '<i class="fas fa-edit"></i> Yeməyi Redaktə Et';
  document.getElementById('foodEditId').value = id;
  document.getElementById('foodName').value = item.name;
  document.getElementById('foodPrice').value = item.price;
  document.getElementById('foodCategory').value = item.category;
  document.getElementById('foodDesc').value = item.desc;
  document.getElementById('foodPopular').checked = item.popular;
  document.getElementById('foodOutOfStock').checked = item.outOfStock;
  if (item.imgUrl) {
    document.getElementById('foodImgPreview').src = item.imgUrl;
    document.getElementById('foodImgPreview').style.display = 'block';
    document.getElementById('foodImgPlaceholder').style.display = 'none';
  } else {
    document.getElementById('foodImgPreview').style.display = 'none';
    document.getElementById('foodImgPlaceholder').style.display = 'flex';
  }
  openModal('foodModal');
}

function saveFood() {
  const id = document.getElementById('foodEditId').value;
  const name = document.getElementById('foodName').value.trim();
  const price = parseFloat(document.getElementById('foodPrice').value);
  const category = document.getElementById('foodCategory').value;
  const desc = document.getElementById('foodDesc').value.trim();
  const popular = document.getElementById('foodPopular').checked;
  const outOfStock = document.getElementById('foodOutOfStock').checked;
  const imgSrc = document.getElementById('foodImgPreview').src;
  const imgUrl = document.getElementById('foodImgPreview').style.display !== 'none' ? imgSrc : null;

  if (!name || !price) { showToast('Ad və qiymət daxil edin'); return; }

  if (id) {
    const item = state.menuItems.find(m => m.id === parseInt(id));
    if (item) Object.assign(item, { name, price, category, desc, popular, outOfStock, imgUrl });
    showToast('Yemək yeniləndi');
  } else {
    state.menuItems.push({ id: state.nextFoodId++, name, price, category, desc, popular, outOfStock, emoji: '🍽️', imgUrl });
    showToast('Yemək əlavə edildi');
  }
  closeModal('foodModal');
  renderMenuPage();
  updateStats();
  renderCategoryGrid();
}

function deleteFood(id) {
  if (!confirm('Yeməyi silmək istədiyinizə əminsiniz?')) return;
  state.menuItems = state.menuItems.filter(m => m.id !== id);
  renderMenuPage();
  updateStats();
  renderCategoryGrid();
  showToast('Yemək silindi');
}

function previewFoodImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('foodImgPreview');
    prev.src = e.target.result;
    prev.style.display = 'block';
    document.getElementById('foodImgPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ===== ORDERS PAGE =====
function renderOrdersPage() {
  const tbody = document.getElementById('ordersPageBody');
  const typeFilter = document.getElementById('orderTypeFilter').value;
  const statusFilter = document.getElementById('orderStatusFilter').value;

  let filtered = state.orders;
  if (typeFilter !== 'all') filtered = filtered.filter(o => o.type === typeFilter);
  if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);

  tbody.innerHTML = '';
  filtered.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--gold);font-weight:700;">#${order.id}</td>
      <td>${order.customer}</td>
      <td>${order.items.map(i=>`${i.qty}×${i.name}`).join(', ')}</td>
      <td class="amount-gold">${order.total}.00 ₼</td>
      <td>${order.type==='delivery'?'🚚 Çatdırılma':'🍽️ Restoranda'}</td>
      <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
      <td style="color:var(--text-muted);">${order.time}</td>
      <td><button class="btn-outline" style="font-size:10px;padding:4px 8px;" onclick="showOrderDetail(${order.id})">Ətraflı</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== ORDER DETAIL MODAL =====
function showOrderDetail(id) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;

  const statusOptions = ['Yeni','Qəbul Edildi','Hazırlanır','Kuryerə Verildi','Yoldadır','Tamamlandı','Ləğv Edildi'];
  const opts = statusOptions.map(s => `<option value="${s}" ${order.status===s?'selected':''}>${s}</option>`).join('');

  document.getElementById('orderDetailContent').innerHTML = `
    <div style="display:grid;gap:10px;font-size:13px;">
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--gold);font-size:16px;font-weight:700;">Sifariş #${order.id}</span>
        <span class="status-badge ${getStatusClass(order.status)}">${order.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--bg-card2);padding:10px;border-radius:8px;">
        <div><span style="color:var(--text-muted);">Müştəri:</span> ${order.customer}</div>
        <div><span style="color:var(--text-muted);">Telefon:</span> ${order.phone}</div>
        <div><span style="color:var(--text-muted);">Növ:</span> ${order.type==='delivery'?'🚚 Çatdırılma':'🍽️ Restoranda'}</div>
        <div><span style="color:var(--text-muted);">Saat:</span> ${order.time}</div>
        ${order.address ? `<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">Ünvan:</span> ${order.address}</div>` : ''}
        ${order.table ? `<div><span style="color:var(--text-muted);">Stol №:</span> ${order.table}</div>` : ''}
        ${order.note ? `<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">Qeyd:</span> ${order.note}</div>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="color:var(--text-muted);border-bottom:1px solid var(--border);">
          <th style="padding:6px;text-align:left;">Yemək</th>
          <th style="padding:6px;text-align:center;">Miqdar</th>
          <th style="padding:6px;text-align:right;">Qiymət</th>
        </tr></thead>
        <tbody>${order.items.map(i=>`<tr><td style="padding:6px;">${i.name}</td><td style="padding:6px;text-align:center;">${i.qty}</td><td style="padding:6px;text-align:right;color:var(--gold);">${i.qty*i.price}.00 ₼</td></tr>`).join('')}</tbody>
      </table>
      <div style="text-align:right;font-size:14px;font-weight:700;border-top:1px solid var(--border);padding-top:8px;">
        Ümumi: <span style="color:var(--gold);">${order.total}.00 ₼</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
        <label style="font-size:12px;color:var(--text-muted);">Statusu dəyiş:</label>
        <select id="detailStatus" class="setting-input" style="flex:1;">${opts}</select>
        <button class="btn-gold" onclick="updateOrderStatus(${order.id})">Yenilə</button>
      </div>
    </div>
  `;
  openModal('orderDetailModal');
}

function updateOrderStatus(id) {
  const order = state.orders.find(o => o.id === id);
  const newStatus = document.getElementById('detailStatus').value;
  if (order) {
    order.status = newStatus;
    showToast(`Sifariş #${id} statusu: ${newStatus}`);
    closeModal('orderDetailModal');
    renderDashOrders();
    renderOrdersPage();
    updateStats();
  }
}

// ===== CUSTOMERS =====
function buildCustomers() {
  const map = {};
  state.orders.forEach(order => {
    if (!map[order.customer]) {
      map[order.customer] = { name: order.customer, phone: order.phone, count: 0, total: 0, last: order.time };
    }
    map[order.customer].count++;
    map[order.customer].total += order.total;
    map[order.customer].last = order.time;
  });
  state.customers = Object.values(map);
}

function renderCustomers() {
  buildCustomers();
  const tbody = document.getElementById('customersBody');
  tbody.innerHTML = '';
  state.customers.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td style="color:var(--text-muted);">${c.phone}</td>
      <td style="text-align:center;">${c.count}</td>
      <td class="amount-gold">${c.total}.00 ₼</td>
      <td style="color:var(--text-muted);">${c.last}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== DELIVERY MAP =====
function initDeliveryMap() {
  const container = document.getElementById('deliveryMap');
  if (state.mapInstance) { state.mapInstance.invalidateSize(); return; }
  state.mapInstance = L.map(container).setView([41.1978, 47.1706], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(state.mapInstance);
  const goldIcon = L.divIcon({ html: '<div style="font-size:28px;">📍</div>', className: '', iconSize: [32, 32] });
  state.orders.filter(o => o.lat && o.type === 'delivery').forEach(order => {
    L.marker([order.lat, order.lon], { icon: goldIcon })
      .addTo(state.mapInstance)
      .bindPopup(`<b>#${order.id}</b> – ${order.customer}<br>${order.address || ''}<br><b>${order.status}</b>`);
  });
}

// ===== CHARTS =====
function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  const labels = ['B.e','Ç.a','Ç','C.a','C.','Ş.','B.'];
  const data = [320, 480, 290, 510, 620, 440, 580];
  if (state.revenueChart) state.revenueChart.destroy();
  state.revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#c9a84c',
        backgroundColor: 'rgba(201,168,76,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#c9a84c',
        pointRadius: 4,
        borderWidth: 2,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8a7a5a', font: { size: 10 } }, grid: { color: 'rgba(42,32,16,0.5)' } },
        y: { ticks: { color: '#8a7a5a', font: { size: 10 }, callback: v => v + ' ₼' }, grid: { color: 'rgba(42,32,16,0.5)' } }
      }
    }
  });
}

function updateRevenueChart() { initRevenueChart(); }

function initDonutChart() {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return;
  const dine = state.orders.filter(o => o.type === 'dine').length;
  const del = state.orders.filter(o => o.type === 'delivery').length;
  if (state.donutChart) state.donutChart.destroy();
  state.donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{ data: [dine, del], backgroundColor: ['#c9a84c', '#3a3020'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '70%' }
  });
}

function initStatsCharts() {
  const ctx1 = document.getElementById('statsRevenueChart');
  if (ctx1 && !state.statsRevChart) {
    state.statsRevChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Yan','Fev','Mar','Apr','May','İyn','İyl'],
        datasets: [{
          label: 'Gəlir (₼)',
          data: [2400, 3100, 2800, 3600, 4200, 3800, 4800],
          backgroundColor: 'rgba(201,168,76,0.6)',
          borderColor: '#c9a84c',
          borderWidth: 1,
        }]
      },
      options: { plugins: { legend: { labels: { color: '#8a7a5a' } } }, scales: { x: { ticks: { color: '#8a7a5a' }, grid: { color: 'rgba(42,32,16,0.3)' } }, y: { ticks: { color: '#8a7a5a', callback: v => v + ' ₼' }, grid: { color: 'rgba(42,32,16,0.3)' } } } }
    });
  }

  // Top foods
  const topDiv = document.getElementById('topFoodsList');
  if (topDiv) {
    const counts = {};
    state.orders.forEach(o => o.items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + i.qty; }));
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
    topDiv.innerHTML = sorted.map(([name,qty],i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="color:var(--gold);font-weight:800;width:20px;">${i+1}.</span>
        <span style="flex:1;">${name}</span>
        <span style="color:var(--gold);font-weight:700;">${qty} ədəd</span>
      </div>
    `).join('');
  }

  const ctx2 = document.getElementById('statsDonutChart');
  if (ctx2 && !state.statsDonutChart) {
    const dine = state.orders.filter(o => o.type === 'dine').length;
    const del = state.orders.filter(o => o.type === 'delivery').length;
    state.statsDonutChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Restoranda', 'Çatdırılma'],
        datasets: [{ data: [dine, del], backgroundColor: ['#c9a84c','#3a3020'], borderWidth: 0 }]
      },
      options: { plugins: { legend: { position: 'bottom', labels: { color: '#8a7a5a', padding: 12, font: { size: 11 } } } }, cutout: '65%' }
    });
  }
}

// ===== PROFILE EDIT =====
function openProfileEdit() {
  document.getElementById('editRestName').value = state.restaurantInfo.name;
  document.getElementById('editRestDesc').value = state.restaurantInfo.desc;
  document.getElementById('editRestAddress').value = state.restaurantInfo.address;
  document.getElementById('editRestPhone').value = state.restaurantInfo.phone;
  document.getElementById('editRestInsta').value = state.restaurantInfo.insta;
  openModal('profileEditModal');
}

function saveProfileEdit() {
  state.restaurantInfo.name = document.getElementById('editRestName').value;
  state.restaurantInfo.desc = document.getElementById('editRestDesc').value;
  state.restaurantInfo.address = document.getElementById('editRestAddress').value;
  state.restaurantInfo.phone = document.getElementById('editRestPhone').value;
  state.restaurantInfo.insta = document.getElementById('editRestInsta').value;

  document.getElementById('restName').innerHTML = state.restaurantInfo.name + ' <i class="fas fa-check-circle verified"></i>';
  document.getElementById('restDesc').textContent = state.restaurantInfo.desc;
  document.getElementById('restAddress').textContent = state.restaurantInfo.address;
  document.getElementById('restPhone').textContent = state.restaurantInfo.phone;
  document.getElementById('restInsta').textContent = state.restaurantInfo.insta;

  closeModal('profileEditModal');
  showToast('Məlumatlar yeniləndi');
}

// ===== LOGO UPLOAD =====
function uploadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.restaurantInfo.logoUrl = e.target.result;
    const logoEl = document.getElementById('profileLogoDisplay');
    logoEl.innerHTML = `<img src="${e.target.result}" alt="Logo">`;
    showToast('Loqo yükləndi');
  };
  reader.readAsDataURL(file);
}

// ===== COVER UPLOAD =====
function uploadCover(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.restaurantInfo.coverUrl = e.target.result;
    document.getElementById('coverImg').src = e.target.result;
    showToast('Üz qabığı yükləndi');
  };
  reader.readAsDataURL(file);
}

function deleteCover() {
  state.restaurantInfo.coverUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
  document.getElementById('coverImg').src = state.restaurantInfo.coverUrl;
  showToast('Üz qabığı silindi');
}

function previewCover() {
  document.getElementById('coverPreviewImg').src = state.restaurantInfo.coverUrl;
  openModal('coverPreviewModal');
}

// ===== AVATAR UPLOAD =====
function uploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('bigAvatar').innerHTML = `<img src="${e.target.result}">`;
    document.getElementById('topAdminAvatar').innerHTML = `<img src="${e.target.result}">`;
    showToast('Profil şəkli yeniləndi');
  };
  reader.readAsDataURL(file);
}

// ===== PROFILE SAVE =====
function saveProfile() {
  const username = document.getElementById('adminUsername').value;
  const email = document.getElementById('adminEmail').value;
  const newPass = document.getElementById('newPass').value;

  if (!username || !email) { showToast('Ad və e-poçt daxil edin'); return; }
  showToast(`Profil yeniləndi: ${username}`);
}

// ===== SETTINGS =====
function saveSettings() {
  showToast('Parametrlər yadda saxlandı');
}

function changeTheme(val) {
  document.body.classList.toggle('light', val === 'light');
}

// ===== LANGUAGE =====
function setLang(code, el) {
  document.querySelectorAll('.lang-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  state.currentLang = code;
  document.documentElement.lang = code;
  document.body.classList.toggle('rtl', ['ar','fa'].includes(code));
  document.dir = ['ar','fa'].includes(code) ? 'rtl' : 'ltr';
  showToast(`Dil dəyişdirildi: ${el ? el.textContent.trim() : code}`);
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== NOTIF DROPDOWN (simple toggle) =====
function toggleNotifDropdown() {
  showToast(`${state.orders.filter(o=>o.status==='Yeni').length} yeni sifariş var`);
}

// ===== PAGE INIT ON NAVIGATE =====
const origNavigate = navigate;
window.navigate = function(page) {
  origNavigate(page);
  if (page === 'menu') renderMenuPage();
  if (page === 'dashboard') {
    renderDashOrders();
    updateStats();
    renderCategoryGrid();
    renderRightPanel();
    setTimeout(initDonutChart, 100);
    setTimeout(initRevenueChart, 100);
  }
};