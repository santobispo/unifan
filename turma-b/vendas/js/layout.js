(function (global) {
  var VA = global.VendasApp;

  VA.injectLayout = function (activeNav) {
    var header = document.getElementById('site-header');
    if (!header) return;

    var links = [
      { href: 'index.html', id: 'dashboard', label: 'Dashboard' },
      { href: 'clientes.html', id: 'clientes', label: 'Clientes' },
      { href: 'tipos.html', id: 'tipos', label: 'Tipos de item' },
      { href: 'items.html', id: 'items', label: 'Itens' },
      { href: 'vendas.html', id: 'vendas', label: 'Vendas' },
    ];

    var navHtml = links
      .map(function (l) {
        var cls = 'site-nav__link' + (l.id === activeNav ? ' site-nav__link--active' : '');
        return '<a class="' + cls + '" href="' + l.href + '">' + VA.escapeHtml(l.label) + '</a>';
      })
      .join('');

    header.innerHTML =
      '<div class="site-header__inner">' +
      '<a class="site-brand site-brand--home" href="../../index.html" title="Voltar ao Reciclômetro">' +
      '<svg class="site-brand__icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M16 4C16 4 6 10 6 19a10 10 0 0016.93 7.19C26.6 23.47 28 20.37 28 17 28 9 16 4 16 4z" fill="currentColor" fill-opacity=".85"/>' +
      '<path d="M16 28V14" stroke="#1B4332" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>' +
      '<div>' +
      '<p class="site-brand__title">Start Solidarium</p>' +
      '<p class="site-brand__tag">Vendas</p>' +
      '</div></a>' +
      '<nav class="site-nav" aria-label="Principal">' +
      navHtml +
      '</nav></div>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
