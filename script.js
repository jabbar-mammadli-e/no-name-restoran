/* ================================================
   NO NAME RESTAURANT – Admin Panel
   script.js  –  Əsas interaksiyalar
   ================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Hamburger / Sidebar toggle ── */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar      = document.getElementById('sidebar');

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }

  /* ── Sidebar xaricini kliklədikdə bağla (mobil) ── */
  document.addEventListener('click', function (e) {
    if (
      window.innerWidth <= 900 &&
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== hamburgerBtn
    ) {
      sidebar.classList.remove('open');
    }
  });

  /* ── Aktiv nav linki ── */
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      this.classList.add('active');
      /* Mobilda bağla */
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
      }
    });
  });

  /* ── Stat kartları hover effekti ── */
  document.querySelectorAll('.stat-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      this.style.borderColor = 'rgba(212,175,55,0.5)';
    });
    card.addEventListener('mouseleave', function () {
      this.style.borderColor = '';
    });
  });

});