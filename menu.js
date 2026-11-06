/* ================================================
   NO NAME RESTAURANT – menu.js
   3-cü Mərhələ: Menyu İdarəetmə Sistemi
   ================================================ */

(function () {
    'use strict';

    /* ════════════════════════════════════════
       STORAGE LAYER
    ════════════════════════════════════════ */
    var KEYS = {
        foods:      'nnr_menu_foods',
        categories: 'nnr_menu_categories'
    };

    var DEFAULT_CATEGORIES = [
        { id: 'cat_1', name: 'Kabablar',       order: 0 },
        { id: 'cat_2', name: 'Pizzalar',        order: 1 },
        { id: 'cat_3', name: 'Salatlar',        order: 2 },
        { id: 'cat_4', name: 'Şorbalar',        order: 3 },
        { id: 'cat_5', name: 'Əsas Yeməklər',   order: 4 },
        { id: 'cat_6', name: 'İçkilər',         order: 5 },
        { id: 'cat_7', name: 'Desertlər',       order: 6 }
    ];

    var MenuStore = {
        getCategories: function () {
            try {
                var d = localStorage.getItem(KEYS.categories);
                return d ? JSON.parse(d) : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            } catch (e) { return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)); }
        },
        saveCategories: function (cats) {
            try { localStorage.setItem(KEYS.categories, JSON.stringify(cats)); return true; }
            catch (e) { showToast('Kateqoriyalar saxlanmadı: yaddaş dolu ola bilər.', 'error'); return false; }
        },
        getFoods: function () {
            try {
                var d = localStorage.getItem(KEYS.foods);
                return d ? JSON.parse(d) : [];
            } catch (e) { return []; }
        },
        saveFoods: function (foods) {
            try { localStorage.setItem(KEYS.foods, JSON.stringify(foods)); return true; }
            catch (e) { showToast('Yeməklər saxlanmadı: yaddaş dolu ola bilər.', 'error'); return false; }
        },
        addFood: function (food) {
            var foods = this.getFoods();
            foods.push(food);
            return this.saveFoods(foods);
        },
        updateFood: function (id, data) {
            var foods = this.getFoods();
            var idx   = foods.findIndex(function (f) { return f.id === id; });
            if (idx === -1) return false;
            foods[idx] = Object.assign({}, foods[idx], data, { updatedAt: Date.now() });
            return this.saveFoods(foods);
        },
        deleteFood: function (id) {
            var foods = this.getFoods().filter(function (f) { return f.id !== id; });
            return this.saveFoods(foods);
        },
        addCategory: function (cat) {
            var cats = this.getCategories();
            cats.push(cat);
            return this.saveCategories(cats);
        },
        updateCategory: function (id, data) {
            var cats = this.getCategories();
            var idx  = cats.findIndex(function (c) { return c.id === id; });
            if (idx === -1) return false;
            cats[idx] = Object.assign({}, cats[idx], data);
            return this.saveCategories(cats);
        },
        deleteCategory: function (id) {
            var cats = this.getCategories().filter(function (c) { return c.id !== id; });
            return this.saveCategories(cats);
        }
    };

    /* ════════════════════════════════════════
       STATE
    ════════════════════════════════════════ */
    var State = {
        searchQuery:     '',
        statusFilter:    'all',
        catFilter:       'all',
        editingFoodId:   null,
        tempFoodImage:   null   /* editor-dan gələn şəkil (hələ saxlanmamış) */
    };

    /* ════════════════════════════════════════
       FOOD IMAGE EDITOR
    ════════════════════════════════════════ */
    var FIE = {
        modal:      null,
        canvas:     null,
        prevCanvas: null,
        ctx:        null,
        pctx:       null,
        img:        null,
        scale:      1,
        offsetX:    0,
        offsetY:    0,
        rotation:   0,
        isDragging: false,
        lastX:      0,
        lastY:      0,
        onSave:     null,   /* callback(dataURL) */

        init: function () {
            var self = this;
            this.modal      = document.getElementById('foodImgEditorModal');
            this.canvas     = document.getElementById('foodImgCanvas');
            this.prevCanvas = document.getElementById('foodImgPreviewCanvas');
            if (!this.canvas) return;
            this.ctx  = this.canvas.getContext('2d');
            this.pctx = this.prevCanvas.getContext('2d');

            /* Controls */
            function on(id, fn) {
                var el = document.getElementById(id);
                if (el) el.addEventListener('click', fn);
            }
            on('foodZoomIn',   function () { self.scale = Math.min(self.scale * 1.15, 15); self._labels(); self.draw(); });
            on('foodZoomOut',  function () { self.scale = Math.max(self.scale / 1.15, 0.03); self._labels(); self.draw(); });
            on('foodRotateR',  function () { self.rotation = (self.rotation + 15) % 360; self._labels(); self.draw(); });
            on('foodRotateL',  function () { self.rotation = (self.rotation - 15 + 360) % 360; self._labels(); self.draw(); });
            on('foodMoveU',    function () { self.offsetY -= 20; self.draw(); });
            on('foodMoveD',    function () { self.offsetY += 20; self.draw(); });
            on('foodMoveL',    function () { self.offsetX -= 20; self.draw(); });
            on('foodMoveR',    function () { self.offsetX += 20; self.draw(); });
            on('foodImgReset', function () { self._fit(); self.draw(); });

            on('foodImgEditorClose',  function () { self.close(); });
            on('foodImgEditorCancel', function () { self.close(); });

            on('foodImgEditorSave', function () {
                if (!self.img) return;
                var btn = document.getElementById('foodImgEditorSave');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saxlanır...';
                setTimeout(function () {
                    var dataURL = self.getCropped(500, 500, 0.85);
                    if (typeof self.onSave === 'function') self.onSave(dataURL);
                    self.close();
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check"></i> Yadda saxla';
                }, 50);
            });

            /* Drag */
            var c = this.canvas;
            c.addEventListener('mousedown', function (e) { e.preventDefault(); self.isDragging = true; self.lastX = e.clientX; self.lastY = e.clientY; c.style.cursor = 'grabbing'; });
            window.addEventListener('mousemove', function (e) { if (!self.isDragging) return; self.offsetX += e.clientX - self.lastX; self.offsetY += e.clientY - self.lastY; self.lastX = e.clientX; self.lastY = e.clientY; self.draw(); });
            window.addEventListener('mouseup',   function () { self.isDragging = false; if (c) c.style.cursor = 'grab'; });
            c.addEventListener('touchstart', function (e) { e.preventDefault(); self.isDragging = true; self.lastX = e.touches[0].clientX; self.lastY = e.touches[0].clientY; }, { passive: false });
            c.addEventListener('touchmove',  function (e) { e.preventDefault(); self.offsetX += e.touches[0].clientX - self.lastX; self.offsetY += e.touches[0].clientY - self.lastY; self.lastX = e.touches[0].clientX; self.lastY = e.touches[0].clientY; self.draw(); }, { passive: false });
            c.addEventListener('touchend',   function () { self.isDragging = false; });

            /* Wheel zoom */
            c.addEventListener('wheel', function (e) { e.preventDefault(); var d = e.deltaY > 0 ? 1 / 1.1 : 1.1; self.scale = Math.min(Math.max(self.scale * d, 0.03), 15); self._labels(); self.draw(); }, { passive: false });

            /* Keyboard */
            document.addEventListener('keydown', function (e) {
                if (!self.modal.classList.contains('active')) return;
                switch (e.key) {
                    case 'ArrowUp':    e.preventDefault(); self.offsetY -= 10; self.draw(); break;
                    case 'ArrowDown':  e.preventDefault(); self.offsetY += 10; self.draw(); break;
                    case 'ArrowLeft':  e.preventDefault(); self.offsetX -= 10; self.draw(); break;
                    case 'ArrowRight': e.preventDefault(); self.offsetX += 10; self.draw(); break;
                    case '+': case '=': self.scale = Math.min(self.scale * 1.1, 15); self._labels(); self.draw(); break;
                    case '-': self.scale = Math.max(self.scale / 1.1, 0.03); self._labels(); self.draw(); break;
                    case 'Escape': self.close(); break;
                }
            });

            c.style.cursor = 'grab';
        },

        open: function (src, saveCallback) {
            var self = this;
            this.onSave = saveCallback;
            var img = new Image();
            img.onload = function () { self.img = img; self._fit(); self.draw(); };
            img.onerror = function () { showToast('Şəkil yüklənə bilmədi.', 'error'); };
            img.src = src;
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close: function () {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        },

        _fit: function () {
            if (!this.img) return;
            var CW = this.canvas.width, CH = this.canvas.height;
            var pad = 20;
            var ratio = Math.max((CW - pad*2) / this.img.width, (CH - pad*2) / this.img.height);
            this.scale = ratio; this.offsetX = 0; this.offsetY = 0; this.rotation = 0;
            this._labels();
        },

        draw: function () {
            if (!this.img) return;
            var ctx = this.ctx;
            var CW = this.canvas.width, CH = this.canvas.height;
            var pad = 20;

            ctx.clearRect(0, 0, CW, CH);
            ctx.fillStyle = '#0a0500';
            ctx.fillRect(0, 0, CW, CH);

            ctx.save();
            ctx.translate(CW / 2 + this.offsetX, CH / 2 + this.offsetY);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
            ctx.restore();

            /* Dark overlay */
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.rect(0, 0, CW, CH);
            /* Square crop hole */
            var size = Math.min(CW, CH) - pad * 2;
            var rx = (CW - size) / 2, ry = (CH - size) / 2;
            ctx.rect(rx, ry, size, size);
            ctx.fill('evenodd');
            ctx.restore();

            /* Gold border */
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 2;
            var size2 = Math.min(CW, CH) - pad * 2;
            var rx2 = (CW - size2) / 2, ry2 = (CH - size2) / 2;
            ctx.strokeRect(rx2, ry2, size2, size2);

            /* Hint */
            ctx.font = '10px Inter,sans-serif';
            ctx.fillStyle = 'rgba(212,175,55,0.4)';
            ctx.fillText('Scroll → Zoom | Sürüklə → Hərəkət', 8, 16);

            this._drawPreview();
        },

        _drawPreview: function () {
            var pc = this.prevCanvas;
            var pctx = this.pctx;
            var PW = pc.width, PH = pc.height;
            var CW = this.canvas.width, CH = this.canvas.height;
            var pad = 20;
            var size = Math.min(CW, CH) - pad * 2;
            var rx = (CW - size) / 2, ry = (CH - size) / 2;

            pctx.clearRect(0, 0, PW, PH);
            pctx.fillStyle = '#0a0500';
            pctx.fillRect(0, 0, PW, PH);
            pctx.drawImage(this.canvas, rx, ry, size, size, 0, 0, PW, PH);
            pctx.strokeStyle = '#D4AF37';
            pctx.lineWidth = 2;
            pctx.strokeRect(1, 1, PW - 2, PH - 2);
        },

        getCropped: function (outW, outH, q) {
            var out = document.createElement('canvas');
            out.width = outW; out.height = outH;
            var octx = out.getContext('2d');
            var CW = this.canvas.width, CH = this.canvas.height;
            var pad = 20;
            var size = Math.min(CW, CH) - pad * 2;
            var rx = (CW - size) / 2, ry = (CH - size) / 2;
            octx.drawImage(this.canvas, rx, ry, size, size, 0, 0, outW, outH);
            return out.toDataURL('image/jpeg', q || 0.85);
        },

        _labels: function () {
            var zv = document.getElementById('foodZoomVal');
            var rv = document.getElementById('foodRotateVal');
            if (zv) zv.textContent = Math.round(this.scale * 100) + '%';
            if (rv) rv.textContent = this.rotation + '°';
        }
    };

    /* ════════════════════════════════════════
       TOAST
    ════════════════════════════════════════ */
    function showToast(msg, type) {
        type = type || 'info';
        var iconMap = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
        /* Mövcud NNR toast funksiyası varsa ondan istifadə et */
        var t = document.createElement('div');
        t.className = 'nnr-toast nnr-toast-' + type;
        t.innerHTML = '<i class="fas fa-' + iconMap[type] + '"></i> ' + msg;
        document.body.appendChild(t);
        setTimeout(function () { t.classList.add('show'); }, 10);
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
        }, 3200);
    }

    /* ════════════════════════════════════════
       HELPER: generate ID
    ════════════════════════════════════════ */
    function genId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
    }

    /* ════════════════════════════════════════
       UI RENDERING
    ════════════════════════════════════════ */
    var MenuUI = {

        /* ── Render food grid ── */
        renderFoodGrid: function () {
            var grid  = document.getElementById('foodGrid');
            var empty = document.getElementById('foodEmpty');
            if (!grid) return;

            var foods = MenuStore.getFoods();
            var cats  = MenuStore.getCategories();

            /* Apply filters */
            var filtered = foods.filter(function (f) {
                /* Status filter */
                if (State.statusFilter === 'active'   && !f.isActive)  return false;
                if (State.statusFilter === 'inactive' && f.isActive)   return false;
                /* Category filter */
                if (State.catFilter !== 'all' && f.categoryId !== State.catFilter) return false;
                /* Search */
                if (State.searchQuery) {
                    var q = State.searchQuery.toLowerCase();
                    if (!f.name.toLowerCase().includes(q)) return false;
                }
                return true;
            });

            /* Clear */
            grid.innerHTML = '';

            if (filtered.length === 0) {
                if (empty) empty.style.display = 'flex';
                this.updateStats(foods, cats);
                return;
            }
            if (empty) empty.style.display = 'none';

            var catMap = {};
            cats.forEach(function (c) { catMap[c.id] = c.name; });

            filtered.forEach(function (food) {
                var card = MenuUI._createFoodCard(food, catMap[food.categoryId] || '—');
                grid.appendChild(card);
            });

            this.updateStats(foods, cats);
        },

        /* ── Build a food card DOM element ── */
        _createFoodCard: function (food, catName) {
            var card = document.createElement('div');
            card.className = 'food-card glass-card' + (food.isActive ? '' : ' fc-inactive');
            card.dataset.id = food.id;

            var imgHtml;
            if (food.image) {
                imgHtml = '<img src="' + food.image + '" alt="' + food.name + '" class="fc-img">';
            } else {
                imgHtml = '<div class="fc-no-img"><i class="fas fa-utensils"></i></div>';
            }

            var statusBadge = food.isActive
                ? '<span class="fc-status-badge active-badge">Aktiv</span>'
                : '<span class="fc-status-badge inactive-badge">Qeyri-aktiv</span>';

            var toggleIcon = food.isActive ? 'fa-toggle-on' : 'fa-toggle-off';
            var toggleCls  = food.isActive ? 'is-active' : '';

            card.innerHTML =
                '<div class="fc-img-wrap">' +
                    imgHtml +
                    statusBadge +
                    '<span class="fc-cat-badge">' + catName + '</span>' +
                '</div>' +
                '<div class="fc-body">' +
                    '<h4 class="fc-name">' + food.name + '</h4>' +
                    '<p class="fc-desc">' + (food.description || '') + '</p>' +
                    '<div class="fc-meta">' +
                        '<span class="fc-price">' + parseFloat(food.price).toFixed(2) + ' ₼</span>' +
                        (food.prepTime ? '<span class="fc-prep"><i class="fas fa-clock"></i>' + food.prepTime + ' dəq</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="fc-actions">' +
                    '<button class="fc-toggle-btn ' + toggleCls + '" title="Aktiv/Qeyri-aktiv dəyişdir">' +
                        '<i class="fas ' + toggleIcon + '"></i>' +
                    '</button>' +
                    '<button class="fc-edit-btn"><i class="fas fa-pen"></i> Redaktə</button>' +
                    '<button class="fc-del-btn" title="Sil"><i class="fas fa-trash"></i></button>' +
                '</div>';

            /* Events */
            card.querySelector('.fc-toggle-btn').addEventListener('click', function () {
                MenuStore.updateFood(food.id, { isActive: !food.isActive });
                MenuUI.renderFoodGrid();
                showToast(food.isActive ? 'Yemək qeyri-aktiv edildi.' : 'Yemək aktiv edildi.', 'info');
            });

            card.querySelector('.fc-edit-btn').addEventListener('click', function () {
                openFoodForm(food.id);
            });

            card.querySelector('.fc-del-btn').addEventListener('click', function () {
                openDeleteModal(food.id, food.name);
            });

            return card;
        },

        /* ── Category filter select ── */
        renderCatFilter: function () {
            var sel = document.getElementById('catFilterSelect');
            if (!sel) return;
            var cats = MenuStore.getCategories();
            sel.innerHTML = '<option value="all">Bütün kateqoriyalar</option>';
            cats.forEach(function (c) {
                var o = document.createElement('option');
                o.value = c.id;
                o.textContent = c.name;
                if (c.id === State.catFilter) o.selected = true;
                sel.appendChild(o);
            });
        },

        /* ── Category select inside food form ── */
        populateCatSelect: function () {
            var sel = document.getElementById('ffCategory');
            if (!sel) return;
            var cats = MenuStore.getCategories();
            sel.innerHTML = '<option value="">Kateqoriya seçin</option>';
            cats.forEach(function (c) {
                var o = document.createElement('option');
                o.value = c.id; o.textContent = c.name;
                sel.appendChild(o);
            });
        },

        /* ── Category management list ── */
        renderCatsList: function () {
            var list = document.getElementById('catsList');
            if (!list) return;
            var cats  = MenuStore.getCategories();
            var foods = MenuStore.getFoods();
            list.innerHTML = '';

            cats.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

            cats.forEach(function (cat) {
                var count = foods.filter(function (f) { return f.categoryId === cat.id; }).length;
                var row = document.createElement('div');
                row.className = 'cat-manage-item';
                row.dataset.catId = cat.id;
                row.innerHTML =
                    '<i class="fas fa-grip-lines cat-manage-drag"></i>' +
                    '<input type="text" class="cat-manage-name" value="' + cat.name + '" data-id="' + cat.id + '">' +
                    '<span class="cat-food-count">' + count + ' yemək</span>' +
                    '<button class="cat-del-btn" data-id="' + cat.id + '" data-count="' + count + '" title="Sil">' +
                        '<i class="fas fa-trash"></i>' +
                    '</button>';

                /* Rename on blur */
                var nameInput = row.querySelector('.cat-manage-name');
                nameInput.addEventListener('blur', function () {
                    var newName = this.value.trim();
                    if (!newName) { this.value = cat.name; return; }
                    if (newName === cat.name) return;
                    MenuStore.updateCategory(cat.id, { name: newName });
                    MenuUI.renderCatFilter();
                    MenuUI.populateCatSelect();
                    MenuUI.renderFoodGrid();
                    showToast('Kateqoriya adı yeniləndi.', 'success');
                });

                /* Delete */
                row.querySelector('.cat-del-btn').addEventListener('click', function () {
                    var id    = this.dataset.id;
                    var cnt   = parseInt(this.dataset.count, 10);
                    if (cnt > 0) {
                        showToast('Bu kateqoriyada ' + cnt + ' yemək var. Əvvəlcə yeməkləri silin və ya köçürün.', 'error');
                        return;
                    }
                    MenuStore.deleteCategory(id);
                    MenuUI.renderCatsList();
                    MenuUI.renderCatFilter();
                    MenuUI.populateCatSelect();
                    MenuUI.updateStats();
                    showToast('Kateqoriya silindi.', 'info');
                });

                list.appendChild(row);
            });
        },

        /* ── Stats strip ── */
        updateStats: function (foodsArg, catsArg) {
            var foods = foodsArg || MenuStore.getFoods();
            var cats  = catsArg  || MenuStore.getCategories();
            var active   = foods.filter(function (f) { return f.isActive; }).length;
            var inactive = foods.length - active;

            var el = function (id) { return document.getElementById(id); };
            if (el('statTotal'))    el('statTotal').textContent    = foods.length;
            if (el('statActive'))   el('statActive').textContent   = active;
            if (el('statInactive')) el('statInactive').textContent = inactive;
            if (el('statCats'))     el('statCats').textContent     = cats.length;

            /* Ana panel stat kartını da yenilə */
            var apTotal = document.querySelector('.stat-card .stat-val');
            if (apTotal) apTotal.textContent = foods.length;
        }
    };

    /* ════════════════════════════════════════
       FOOD FORM MODAL
    ════════════════════════════════════════ */
    function openFoodForm(foodId) {
        var isEdit = !!foodId;
        var food   = null;
        if (isEdit) {
            var all = MenuStore.getFoods();
            food = all.find(function (f) { return f.id === foodId; }) || null;
        }

        State.editingFoodId = isEdit ? foodId : null;
        State.tempFoodImage = null;

        /* Title */
        var title = document.getElementById('foodFormTitle');
        if (title) title.textContent = isEdit ? 'Yeməyi Redaktə Et' : 'Yeni Yemək';

        /* Populate fields */
        document.getElementById('ffName').value     = food ? food.name        : '';
        document.getElementById('ffDesc').value     = food ? (food.description || '') : '';
        document.getElementById('ffPrice').value    = food ? food.price        : '';
        document.getElementById('ffPrepTime').value = food ? (food.prepTime || '') : '';
        document.getElementById('ffIsActive').checked = food ? food.isActive : true;

        /* Clear errors */
        ['ffNameErr','ffPriceErr','ffCatErr'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = '';
        });
        ['ffName','ffPrice','ffCategory'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('ff-error');
        });

        /* Image preview */
        MenuUI.populateCatSelect();
        var preview = document.getElementById('ffImgPreview');
        if (food && food.image) {
            preview.innerHTML = '<img src="' + food.image + '" alt="' + food.name + '">';
        } else {
            preview.innerHTML = '<i class="fas fa-camera"></i><span>Şəkil yükləyin</span>';
        }

        /* Category */
        if (food) {
            var catSel = document.getElementById('ffCategory');
            if (catSel) catSel.value = food.categoryId || '';
        }

        /* Active hint */
        updateActiveHint();

        document.getElementById('foodFormModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeFoodForm() {
        document.getElementById('foodFormModal').classList.remove('active');
        document.body.style.overflow = '';
        State.editingFoodId = null;
        State.tempFoodImage = null;
    }

    function updateActiveHint() {
        var chk  = document.getElementById('ffIsActive');
        var hint = document.getElementById('ffActiveHint');
        if (!chk || !hint) return;
        hint.textContent = chk.checked
            ? 'Yemək müştərilərə görünür'
            : 'Yemək müştərilərə görünmür';
        hint.style.color = chk.checked ? '#4ADE80' : '#EF4444';
    }

    function validateFoodForm() {
        var valid = true;

        var name    = document.getElementById('ffName');
        var price   = document.getElementById('ffPrice');
        var catSel  = document.getElementById('ffCategory');
        var nameErr = document.getElementById('ffNameErr');
        var priceErr= document.getElementById('ffPriceErr');
        var catErr  = document.getElementById('ffCatErr');

        /* Clear */
        [nameErr, priceErr, catErr].forEach(function (el) { if (el) el.textContent = ''; });
        [name, price, catSel].forEach(function (el) { if (el) el.classList.remove('ff-error'); });

        if (!name.value.trim()) {
            nameErr.textContent = 'Ad boş buraxıla bilməz';
            name.classList.add('ff-error');
            valid = false;
        }
        var priceVal = parseFloat(price.value);
        if (isNaN(priceVal) || priceVal < 0) {
            priceErr.textContent = 'Düzgün qiymət daxil edin';
            price.classList.add('ff-error');
            valid = false;
        }
        if (!catSel.value) {
            catErr.textContent = 'Kateqoriya seçilməlidir';
            catSel.classList.add('ff-error');
            valid = false;
        }
        return valid;
    }

    function saveFoodForm() {
        if (!validateFoodForm()) return;

        var name     = document.getElementById('ffName').value.trim();
        var desc     = document.getElementById('ffDesc').value.trim();
        var price    = parseFloat(document.getElementById('ffPrice').value);
        var cat      = document.getElementById('ffCategory').value;
        var prepTime = parseInt(document.getElementById('ffPrepTime').value, 10) || 0;
        var isActive = document.getElementById('ffIsActive').checked;

        /* Image: use temp if new, else keep existing */
        var image = State.tempFoodImage;
        if (!image && State.editingFoodId) {
            var existing = MenuStore.getFoods().find(function (f) { return f.id === State.editingFoodId; });
            if (existing) image = existing.image || null;
        }

        var btn = document.getElementById('foodFormSave');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saxlanır...';

        setTimeout(function () {
            if (State.editingFoodId) {
                MenuStore.updateFood(State.editingFoodId, {
                    name: name, description: desc, price: price,
                    categoryId: cat, prepTime: prepTime,
                    isActive: isActive, image: image
                });
                showToast('"' + name + '" yeməyi yeniləndi.', 'success');
            } else {
                MenuStore.addFood({
                    id: genId('food'), name: name, description: desc,
                    price: price, categoryId: cat, prepTime: prepTime,
                    isActive: isActive, image: image,
                    createdAt: Date.now(), updatedAt: Date.now()
                });
                showToast('"' + name + '" menyuya əlavə edildi.', 'success');
            }

            MenuUI.renderFoodGrid();
            MenuUI.renderCatFilter();
            closeFoodForm();

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Yadda saxla';
        }, 50);
    }

    /* ════════════════════════════════════════
       DELETE MODAL
    ════════════════════════════════════════ */
    var _deleteTargetId = null;

    function openDeleteModal(id, name) {
        _deleteTargetId = id;
        var el = document.getElementById('delFoodName');
        if (el) el.textContent = name;
        document.getElementById('deleteModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        document.body.style.overflow = '';
        _deleteTargetId = null;
    }

    /* ════════════════════════════════════════
       CATEGORY MODAL
    ════════════════════════════════════════ */
    function openCatsModal() {
        MenuUI.renderCatsList();
        document.getElementById('catsModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeCatsModal() {
        document.getElementById('catsModal').classList.remove('active');
        document.body.style.overflow = '';
        MenuUI.renderCatFilter();
        MenuUI.renderFoodGrid();
        MenuUI.updateStats();
    }

    /* ════════════════════════════════════════
       SECTION NAVIGATION
    ════════════════════════════════════════ */
    function initNavigation() {
        var dashboard = document.getElementById('dashboardSection');
        var menuSec   = document.getElementById('menuSection');
        if (!dashboard || !menuSec) return;

        document.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                var spanEl = this.querySelector('span');
                var txt    = spanEl ? spanEl.textContent.trim() : '';

                if (txt === 'Menyu') {
                    dashboard.style.display = 'none';
                    menuSec.classList.add('section-active');
                    MenuUI.renderFoodGrid();
                    MenuUI.renderCatFilter();
                } else {
                    menuSec.classList.remove('section-active');
                    dashboard.style.display = 'flex';
                }
            });
        });
    }

    /* ════════════════════════════════════════
       FILE INPUT FOR FOOD IMAGE
    ════════════════════════════════════════ */
    function initFoodFileInput() {
        var input = document.getElementById('foodFileInput');
        if (!input) return;

        /* Click on preview or button opens file dialog */
        var previewEl = document.getElementById('ffImgPreview');
        var imgBtn    = document.getElementById('ffImgBtn');

        function openFile() { input.click(); }
        if (previewEl) previewEl.addEventListener('click', openFile);
        if (imgBtn)    imgBtn.addEventListener('click', openFile);

        input.addEventListener('change', function () {
            var file = input.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Zəhmət olmasa yalnız şəkil faylı seçin.', 'error');
                input.value = ''; return;
            }
            if (file.size > 20 * 1024 * 1024) {
                showToast('Şəkil çox böyükdür (maks. 20MB).', 'error');
                input.value = ''; return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                FIE.open(e.target.result, function (dataURL) {
                    /* onSave callback: update preview + store in State */
                    State.tempFoodImage = dataURL;
                    var preview = document.getElementById('ffImgPreview');
                    if (preview) {
                        preview.innerHTML = '<img src="' + dataURL + '" alt="Yemək şəkli">';
                    }
                    showToast('Şəkil hazırdır. Yadda saxlayın.', 'info');
                });
            };
            reader.readAsDataURL(file);
            input.value = '';
        });
    }

    /* ════════════════════════════════════════
       INIT
    ════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', function () {

        /* Init image editor */
        FIE.init();

        /* Init file input */
        initFoodFileInput();

        /* Init navigation */
        initNavigation();

        /* ── Food Form ── */
        var addFoodBtn     = document.getElementById('addFoodBtn');
        var foodFormClose  = document.getElementById('foodFormClose');
        var foodFormCancel = document.getElementById('foodFormCancel');
        var foodFormSave   = document.getElementById('foodFormSave');
        var ffIsActive     = document.getElementById('ffIsActive');

        if (addFoodBtn)     addFoodBtn.addEventListener('click',     function () { openFoodForm(null); });
        if (foodFormClose)  foodFormClose.addEventListener('click',  closeFoodForm);
        if (foodFormCancel) foodFormCancel.addEventListener('click', closeFoodForm);
        if (foodFormSave)   foodFormSave.addEventListener('click',   saveFoodForm);
        if (ffIsActive)     ffIsActive.addEventListener('change',    updateActiveHint);

        /* Overlay click closes */
        var ffModal = document.getElementById('foodFormModal');
        if (ffModal) ffModal.addEventListener('click', function (e) {
            if (e.target === this) closeFoodForm();
        });

        /* ── Delete Modal ── */
        var deleteCancel  = document.getElementById('deleteCancel');
        var deleteConfirm = document.getElementById('deleteConfirm');

        if (deleteCancel)  deleteCancel.addEventListener('click',  closeDeleteModal);
        if (deleteConfirm) deleteConfirm.addEventListener('click', function () {
            if (!_deleteTargetId) return;
            var food = MenuStore.getFoods().find(function (f) { return f.id === _deleteTargetId; });
            var name = food ? food.name : '';
            MenuStore.deleteFood(_deleteTargetId);
            MenuUI.renderFoodGrid();
            closeDeleteModal();
            showToast('"' + name + '" menyudan silindi.', 'info');
        });

        var delModal = document.getElementById('deleteModal');
        if (delModal) delModal.addEventListener('click', function (e) {
            if (e.target === this) closeDeleteModal();
        });

        /* ── Category Modal ── */
        var manageCatsBtn  = document.getElementById('manageCatsBtn');
        var catsModalClose = document.getElementById('catsModalClose');
        var catsModalDone  = document.getElementById('catsModalDone');
        var addCatBtn      = document.getElementById('addCatBtn');
        var newCatName     = document.getElementById('newCatName');

        if (manageCatsBtn)  manageCatsBtn.addEventListener('click',  openCatsModal);
        if (catsModalClose) catsModalClose.addEventListener('click', closeCatsModal);
        if (catsModalDone)  catsModalDone.addEventListener('click',  closeCatsModal);

        if (addCatBtn) addCatBtn.addEventListener('click', function () {
            var name = newCatName.value.trim();
            if (!name) { newCatName.focus(); showToast('Kateqoriya adı boş ola bilməz.', 'error'); return; }
            var cats = MenuStore.getCategories();
            var dup  = cats.find(function (c) { return c.name.toLowerCase() === name.toLowerCase(); });
            if (dup) { showToast('Bu adda kateqoriya artıq mövcuddur.', 'error'); return; }
            MenuStore.addCategory({ id: genId('cat'), name: name, order: cats.length });
            newCatName.value = '';
            MenuUI.renderCatsList();
            MenuUI.updateStats();
            showToast('"' + name + '" kateqoriyası əlavə edildi.', 'success');
        });
        if (newCatName) newCatName.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); if (addCatBtn) addCatBtn.click(); }
        });

        var cModal = document.getElementById('catsModal');
        if (cModal) cModal.addEventListener('click', function (e) {
            if (e.target === this) closeCatsModal();
        });

        /* ── Filter bar ── */
        var searchInput = document.getElementById('menuSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                State.searchQuery = this.value.trim();
                MenuUI.renderFoodGrid();
            });
        }

        var statusTabs = document.getElementById('statusTabs');
        if (statusTabs) {
            statusTabs.addEventListener('click', function (e) {
                var btn = e.target.closest('.mfb-tab');
                if (!btn) return;
                statusTabs.querySelectorAll('.mfb-tab').forEach(function (t) { t.classList.remove('active'); });
                btn.classList.add('active');
                State.statusFilter = btn.dataset.status || 'all';
                MenuUI.renderFoodGrid();
            });
        }

        var catFilter = document.getElementById('catFilterSelect');
        if (catFilter) {
            catFilter.addEventListener('change', function () {
                State.catFilter = this.value;
                MenuUI.renderFoodGrid();
            });
        }

        /* ── Initial render ── */
        /* Kateqoriyalar LocalStorage-da yoxdursa default-ları yaz */
        if (!localStorage.getItem(KEYS.categories)) {
            MenuStore.saveCategories(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)));
        }

        MenuUI.renderCatFilter();
        MenuUI.renderFoodGrid();
        MenuUI.updateStats();

    }); /* END DOMContentLoaded */

})(); /* END IIFE */