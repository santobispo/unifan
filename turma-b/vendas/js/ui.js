(function (global) {
  var VA = global.VendasApp;

  VA.escapeHtml = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  VA.formatMoney = function (n) {
    var x = Number(n);
    if (isNaN(x)) return '—';
    return x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  VA.formatInt = function (n) {
    var x = Number(n);
    if (isNaN(x)) return '—';
    return x.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  VA.formatDateBR = function (isoDate) {
    if (!isoDate) return '—';
    var parts = String(isoDate).split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return isoDate;
  };

  VA.todayISO = function () {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  VA.showToast = function (message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('toast--visible');
    });
    setTimeout(function () {
      toast.classList.remove('toast--visible');
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3200);
  };

  VA.openModal = function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('modal-overlay--open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  VA.closeModal = function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('modal-overlay--open');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  VA.bindModalOverlayClose = function (overlayId) {
    var el = document.getElementById(overlayId);
    if (!el) return;
    el.addEventListener('click', function (e) {
      if (e.target === el) VA.closeModal(overlayId);
    });
  };

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay--open').forEach(function (node) {
      VA.closeModal(node.id);
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
