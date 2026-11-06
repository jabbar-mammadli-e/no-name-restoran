/* ================================================
   NO NAME RESTAURANT – admin.js
   2-ci Mərhələ: Şəkil Yükləmə & Redaktə Sistemi
   ================================================ */

(function () {
    'use strict';

    /* ════════════════════════════════════════
       STORAGE — LocalStorage ilə şəkil saxlama
    ════════════════════════════════════════ */
    var KEYS = {
        profile: 'nnr_profile_img',
        bg:      'nnr_bg_img'
    };

    var Store = {
        save: function (key, dataURL) {
            try {
                localStorage.setItem(key, dataURL);
                return true;
            } catch (e) {
                console.warn('LocalStorage xətası (yaddaş dolu ola bilər):', e);
                showToast('Yaddaş dolu! Şəkil ölçüsü çox böyükdür.', 'error');
                return false;
            }
        },
        load: function (key) {
            try { return localStorage.getItem(key); }
            catch (e) { return null; }
        }
    };

    /* ════════════════════════════════════════
       DOM HELPERS
    ════════════════════════════════════════ */
    function applyProfileImage(dataURL) {
        /* Ana panel — dairəvi logo */
        var rpLogo = document.getElementById('rpLogoWrap');
        if (rpLogo) {
            rpLogo.innerHTML =
                '<img src="' + dataURL + '" ' +
                'style="width:100%;height:100%;object-fit:cover;border-radius:50%;" ' +
                'alt="Restoran loqosu">';
        }
        /* Önizləmə kartı — logo */
        var previewLogo = document.getElementById('previewLogoEl');
        if (previewLogo) {
            previewLogo.innerHTML =
                '<img src="' + dataURL + '" ' +
                'style="width:100%;height:100%;object-fit:cover;border-radius:50%;' +
                'border:2px solid #D4AF37;box-shadow:0 0 14px rgba(212,175,55,0.3);" ' +
                'alt="Restoran loqosu">';
        }
    }

    function applyBgImage(dataURL) {
        /* Ana panel — profil kartı arxa fon */
        var rpBg = document.getElementById('rpBgEl');
        if (rpBg) {
            rpBg.style.backgroundImage = 'url(' + dataURL + ')';
            rpBg.style.opacity = '0.45';
        }
        /* Önizləmə kartı — arxa fon */
        var previewBg = document.getElementById('previewBgEl');
        if (previewBg) {
            previewBg.style.backgroundImage = 'url(' + dataURL + ')';
        }
    }

    function loadSavedImages() {
        var savedProfile = Store.load(KEYS.profile);
        if (savedProfile) applyProfileImage(savedProfile);

        var savedBg = Store.load(KEYS.bg);
        if (savedBg) applyBgImage(savedBg);
    }

    /* ════════════════════════════════════════
       IMAGE EDITOR CLASS
    ════════════════════════════════════════ */
    function ImageEditor(cfg) {
        this.isCircle = !!cfg.isCircle;
        this.modal    = document.getElementById(cfg.modalId);
        this.canvas   = document.getElementById(cfg.canvasId);
        this.prevCvs  = document.getElementById(cfg.previewId);
        this.ctx      = this.canvas.getContext('2d');
        this.pctx     = this.prevCvs.getContext('2d');

        this.img       = null;
        this.scale     = 1;
        this.offsetX   = 0;
        this.offsetY   = 0;
        this.rotation  = 0;
        this.isDragging = false;
        this.lastX     = 0;
        this.lastY     = 0;

        /* Canvas natural boyutları (HTML attribute-dən) */
        this.CW = this.canvas.width;
        this.CH = this.canvas.height;

        this.zoomValEl   = document.getElementById(cfg.zoomValId);
        this.rotateValEl = document.getElementById(cfg.rotateValId);

        this._bindControls(cfg);
        this._bindDrag();
        this._bindWheel();
        this._bindKeyboard();
    }

    /* ── Open ── */
    ImageEditor.prototype.open = function (src) {
        var self = this;
        var img  = new Image();
        img.onload = function () {
            self.img = img;
            self._fitImage();
            self.draw();
        };
        img.onerror = function () {
            showToast('Şəkil yüklənə bilmədi.', 'error');
        };
        img.src = src;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    /* ── Close ── */
    ImageEditor.prototype.close = function () {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    /* ── Fit image to canvas ── */
    ImageEditor.prototype._fitImage = function () {
        if (!this.img) return;
        var pad   = this.isCircle ? 0 : 40;
        var availW = this.CW - pad;
        var availH = this.CH - pad;
        var ratio  = Math.max(availW / this.img.width, availH / this.img.height);
        this.scale    = ratio;
        this.offsetX  = 0;
        this.offsetY  = 0;
        this.rotation = 0;
        this._updateLabels();
    };

    /* ── Reset ── */
    ImageEditor.prototype.reset = function () {
        this._fitImage();
        this.draw();
    };

    /* ── Draw main canvas ── */
    ImageEditor.prototype.draw = function () {
        if (!this.img) return;
        var ctx = this.ctx;
        var CW  = this.CW;
        var CH  = this.CH;

        /* Fon */
        ctx.clearRect(0, 0, CW, CH);
        ctx.fillStyle = '#0a0500';
        ctx.fillRect(0, 0, CW, CH);

        /* Şəkil (transform ilə) */
        ctx.save();
        ctx.translate(CW / 2 + this.offsetX, CH / 2 + this.offsetY);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        ctx.restore();

        /* Qaranlıq örtük + kəsmə sahəsi */
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.52)';

        if (this.isCircle) {
            /* Dairəvi kəsmə */
            var r  = Math.min(CW, CH) * 0.42;
            var cx = CW / 2;
            var cy = CH / 2;
            ctx.beginPath();
            ctx.rect(0, 0, CW, CH);
            ctx.arc(cx, cy, r, 0, Math.PI * 2, true); /* əks saat — deşik yaradır */
            ctx.fill('evenodd');
            /* Qızılı dairə çərçivəsi */
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            /* Dairə içi şəffaf vurğu */
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            /* Düzbucaqlı kəsmə */
            var pad = 20;
            var rw  = CW - pad * 2;
            var rh  = CH - pad * 2;
            ctx.beginPath();
            ctx.rect(0, 0, CW, CH);
            ctx.rect(pad, pad, rw, rh);
            ctx.fill('evenodd');
            /* Qızılı düzbucaqlı çərçivə */
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 2;
            ctx.strokeRect(pad, pad, rw, rh);
        }
        ctx.restore();

        /* Hərəkət istiqaməti göstəricisi (solda yuxarı) */
        this._drawHint(ctx, CW, CH);

        /* Önizləməni də yenilə */
        this._drawPreview();
    };

    /* ── Kiçik istifadə ipucu ── */
    ImageEditor.prototype._drawHint = function (ctx, CW) {
        ctx.save();
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(212,175,55,0.45)';
        ctx.fillText('Scroll → Zoom | Sürüklə → Hərəkət', 10, CW > 500 ? 18 : 14);
        ctx.restore();
    };

    /* ── Draw Preview canvas ── */
    ImageEditor.prototype._drawPreview = function () {
        var pc   = this.prevCvs;
        var pctx = this.pctx;
        var PW   = pc.width;
        var PH   = pc.height;
        var CW   = this.CW;
        var CH   = this.CH;

        pctx.clearRect(0, 0, PW, PH);
        pctx.fillStyle = '#0a0500';
        pctx.fillRect(0, 0, PW, PH);

        if (this.isCircle) {
            var r  = Math.min(CW, CH) * 0.42;
            var cx = CW / 2;
            var cy = CH / 2;
            var size = r * 2;

            /* Dairəvi clip tətbiq et */
            pctx.save();
            pctx.beginPath();
            pctx.arc(PW / 2, PH / 2, PW / 2 - 2, 0, Math.PI * 2);
            pctx.clip();
            /* Əsas canvas-ın kəsilmiş hissəsini çək */
            pctx.drawImage(this.canvas, cx - r, cy - r, size, size, 0, 0, PW, PH);
            pctx.restore();
            /* Qızılı çərçivə */
            pctx.beginPath();
            pctx.arc(PW / 2, PH / 2, PW / 2 - 2, 0, Math.PI * 2);
            pctx.strokeStyle = '#D4AF37';
            pctx.lineWidth = 3;
            pctx.stroke();
        } else {
            var pad = 20;
            var sw  = CW - pad * 2;
            var sh  = CH - pad * 2;
            pctx.drawImage(this.canvas, pad, pad, sw, sh, 0, 0, PW, PH);
            pctx.strokeStyle = '#D4AF37';
            pctx.lineWidth = 2;
            pctx.strokeRect(1, 1, PW - 2, PH - 2);
        }
    };

    /* ── Get cropped DataURL ── */
    ImageEditor.prototype.getCropped = function (outW, outH, quality) {
        var out  = document.createElement('canvas');
        out.width  = outW;
        out.height = outH;
        var octx = out.getContext('2d');
        var CW   = this.CW;
        var CH   = this.CH;

        if (this.isCircle) {
            var r  = Math.min(CW, CH) * 0.42;
            var cx = CW / 2;
            var cy = CH / 2;
            octx.save();
            octx.beginPath();
            octx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
            octx.clip();
            octx.drawImage(this.canvas, cx - r, cy - r, r * 2, r * 2, 0, 0, outW, outH);
            octx.restore();
        } else {
            var pad = 20;
            octx.drawImage(
                this.canvas,
                pad, pad, CW - pad * 2, CH - pad * 2,
                0,   0,   outW,         outH
            );
        }

        return out.toDataURL('image/jpeg', quality || 0.85);
    };

    /* ── Bind Controls ── */
    ImageEditor.prototype._bindControls = function (cfg) {
        var self = this;
        var STEP = 20;

        function on(id, fn) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        }

        on(cfg.zoomInId,  function () { self.scale = Math.min(self.scale * 1.15, 15); self._updateLabels(); self.draw(); });
        on(cfg.zoomOutId, function () { self.scale = Math.max(self.scale / 1.15, 0.03); self._updateLabels(); self.draw(); });
        on(cfg.rotateRId, function () { self.rotation = (self.rotation + 15) % 360; self._updateLabels(); self.draw(); });
        on(cfg.rotateLId, function () { self.rotation = (self.rotation - 15 + 360) % 360; self._updateLabels(); self.draw(); });
        on(cfg.moveUId,   function () { self.offsetY -= STEP; self.draw(); });
        on(cfg.moveDId,   function () { self.offsetY += STEP; self.draw(); });
        on(cfg.moveLId,   function () { self.offsetX -= STEP; self.draw(); });
        on(cfg.moveRId,   function () { self.offsetX += STEP; self.draw(); });
        on(cfg.resetId,   function () { self.reset(); });
    };

    /* ── Bind Mouse/Touch Drag ── */
    ImageEditor.prototype._bindDrag = function () {
        var self = this;
        var c    = this.canvas;

        function start(x, y) {
            self.isDragging = true;
            self.lastX = x;
            self.lastY = y;
            c.style.cursor = 'grabbing';
        }
        function move(x, y) {
            if (!self.isDragging) return;
            self.offsetX += x - self.lastX;
            self.offsetY += y - self.lastY;
            self.lastX = x;
            self.lastY = y;
            self.draw();
        }
        function end() {
            self.isDragging = false;
            c.style.cursor = 'grab';
        }

        c.addEventListener('mousedown', function (e) { e.preventDefault(); start(e.clientX, e.clientY); });
        window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
        window.addEventListener('mouseup', end);

        c.addEventListener('touchstart', function (e) {
            e.preventDefault();
            start(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        c.addEventListener('touchmove', function (e) {
            e.preventDefault();
            move(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        c.addEventListener('touchend', end);

        c.style.cursor = 'grab';
    };

    /* ── Bind Mouse Wheel Zoom ── */
    ImageEditor.prototype._bindWheel = function () {
        var self = this;
        this.canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            var delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
            self.scale = Math.min(Math.max(self.scale * delta, 0.03), 15);
            self._updateLabels();
            self.draw();
        }, { passive: false });
    };

    /* ── Bind Keyboard shortcuts ── */
    ImageEditor.prototype._bindKeyboard = function () {
        var self = this;
        document.addEventListener('keydown', function (e) {
            if (!self.modal.classList.contains('active')) return;
            var STEP = 10;
            switch (e.key) {
                case 'ArrowUp':    e.preventDefault(); self.offsetY -= STEP; self.draw(); break;
                case 'ArrowDown':  e.preventDefault(); self.offsetY += STEP; self.draw(); break;
                case 'ArrowLeft':  e.preventDefault(); self.offsetX -= STEP; self.draw(); break;
                case 'ArrowRight': e.preventDefault(); self.offsetX += STEP; self.draw(); break;
                case '+':
                case '=':          self.scale = Math.min(self.scale * 1.1, 15); self._updateLabels(); self.draw(); break;
                case '-':          self.scale = Math.max(self.scale / 1.1, 0.03); self._updateLabels(); self.draw(); break;
                case 'Escape':     self.close(); break;
            }
        });
    };

    /* ── Update label text ── */
    ImageEditor.prototype._updateLabels = function () {
        if (this.zoomValEl)   this.zoomValEl.textContent   = Math.round(this.scale * 100) + '%';
        if (this.rotateValEl) this.rotateValEl.textContent = this.rotation + '°';
    };

    /* ════════════════════════════════════════
       TOAST NOTIFICATION
    ════════════════════════════════════════ */
    function showToast(msg, type) {
        type = type || 'info';
        var iconMap = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
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
       INIT — DOMContentLoaded
    ════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', function () {

        /* ── File Input Utility ── */
        function readFileAsDataURL(input, callback) {
            var file = input.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Zəhmət olmasa yalnız şəkil faylı seçin.', 'error');
                input.value = '';
                return;
            }
            /* Max 20MB yoxla */
            if (file.size > 20 * 1024 * 1024) {
                showToast('Şəkil faylı çox böyükdür (maks. 20MB).', 'error');
                input.value = '';
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) { callback(e.target.result); };
            reader.onerror = function () { showToast('Fayl oxunarkən xəta baş verdi.', 'error'); };
            reader.readAsDataURL(file);
            input.value = ''; /* eyni faylı yenidən seçməyə imkan ver */
        }

        /* ── Create Editors ── */
        var profileEditor = new ImageEditor({
            isCircle:    true,
            modalId:     'profileEditorModal',
            canvasId:    'profileCanvas',
            previewId:   'profilePreviewCanvas',
            zoomInId:    'profileZoomIn',
            zoomOutId:   'profileZoomOut',
            zoomValId:   'profileZoomVal',
            rotateRId:   'profileRotateR',
            rotateLId:   'profileRotateL',
            rotateValId: 'profileRotateVal',
            moveUId:     'profileMoveU',
            moveDId:     'profileMoveD',
            moveLId:     'profileMoveL',
            moveRId:     'profileMoveR',
            resetId:     'profileReset'
        });

        var bgEditor = new ImageEditor({
            isCircle:    false,
            modalId:     'bgEditorModal',
            canvasId:    'bgCanvas',
            previewId:   'bgPreviewCanvas',
            zoomInId:    'bgZoomIn',
            zoomOutId:   'bgZoomOut',
            zoomValId:   'bgZoomVal',
            rotateRId:   'bgRotateR',
            rotateLId:   'bgRotateL',
            rotateValId: 'bgRotateVal',
            moveUId:     'bgMoveU',
            moveDId:     'bgMoveD',
            moveLId:     'bgMoveL',
            moveRId:     'bgMoveR',
            resetId:     'bgReset'
        });

        /* ── File Inputs ── */
        var profileInput = document.getElementById('profileFileInput');
        var bgInput      = document.getElementById('bgFileInput');

        /* Profil kamera düyməsi */
        var profileCamBtn = document.getElementById('profileCamBtn');
        if (profileCamBtn) {
            profileCamBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                profileInput.click();
            });
        }

        profileInput.addEventListener('change', function () {
            readFileAsDataURL(profileInput, function (src) {
                profileEditor.open(src);
            });
        });

        /* Arxa fon dəyişdir düyməsi */
        var bgChangeBtn = document.getElementById('bgChangeBtn');
        if (bgChangeBtn) {
            bgChangeBtn.addEventListener('click', function () {
                bgInput.click();
            });
        }

        bgInput.addEventListener('change', function () {
            readFileAsDataURL(bgInput, function (src) {
                bgEditor.open(src);
            });
        });

        /* ── Close Buttons ── */
        function setupClose(closeId, cancelId, editor) {
            var closeEl  = document.getElementById(closeId);
            var cancelEl = document.getElementById(cancelId);
            if (closeEl)  closeEl.addEventListener('click',  function () { editor.close(); });
            if (cancelEl) cancelEl.addEventListener('click', function () { editor.close(); });
        }

        setupClose('profileEditorClose', 'profileCancel', profileEditor);
        setupClose('bgEditorClose',      'bgCancel',      bgEditor);

        /* Overlay xaricinə kliklədikdə bağla */
        document.getElementById('profileEditorModal').addEventListener('click', function (e) {
            if (e.target === this) profileEditor.close();
        });
        document.getElementById('bgEditorModal').addEventListener('click', function (e) {
            if (e.target === this) bgEditor.close();
        });

        /* ── Save Profile Image ── */
        document.getElementById('profileSave').addEventListener('click', function () {
            var btn = this;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saxlanır...';

            setTimeout(function () {
                try {
                    /* 400x400 px, JPEG %85 keyfiyyət */
                    var dataURL = profileEditor.getCropped(400, 400, 0.85);
                    if (Store.save(KEYS.profile, dataURL)) {
                        applyProfileImage(dataURL);
                        profileEditor.close();
                        showToast('Profil şəkli uğurla yadda saxlandı!', 'success');
                    }
                } catch (e) {
                    showToast('Xəta baş verdi: ' + e.message, 'error');
                }
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Yadda saxla';
            }, 50); /* UI-nın yenilənməsinə zaman ver */
        });

        /* ── Save Background Image ── */
        document.getElementById('bgSave').addEventListener('click', function () {
            var btn = this;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saxlanır...';

            setTimeout(function () {
                try {
                    /* 1200x450 px, JPEG %82 keyfiyyət */
                    var dataURL = bgEditor.getCropped(1200, 450, 0.82);
                    if (Store.save(KEYS.bg, dataURL)) {
                        applyBgImage(dataURL);
                        bgEditor.close();
                        showToast('Arxa fon şəkli uğurla yadda saxlandı!', 'success');
                    }
                } catch (e) {
                    showToast('Xəta baş verdi: ' + e.message, 'error');
                }
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Yadda saxla';
            }, 50);
        });

        /* ── Saxlanmış şəkilləri yüklə ── */
        loadSavedImages();

    }); /* END DOMContentLoaded */

})(); /* END IIFE */