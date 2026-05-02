(function (global) {
  var VA = global.VendasApp;

  function joinUrl(base, path) {
    var b = base.replace(/\/$/, '');
    var p = path.charAt(0) === '/' ? path : '/' + path;
    return b + p;
  }

  async function parseErrorBody(res) {
    var text = await res.text();
    try {
      var j = JSON.parse(text);
      if (j.message) return j.message;
      if (typeof j.error === 'string' && j.error.length > 0) return j.error;
      if (j.detail) return typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
      if (Array.isArray(j.errors)) return j.errors.map(function (e) { return e.defaultMessage || e.message || ''; }).filter(Boolean).join(' ');
      return text || res.statusText;
    } catch (e) {
      return text || res.statusText;
    }
  }

  VA.apiRequest = async function (path, options) {
    options = options || {};
    var url = joinUrl(VA.getApiBaseUrl(), path);
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    if (options.body != null && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    var res = await fetch(url, Object.assign({}, options, { headers: headers }));
    if (!res.ok) {
      var msg = await parseErrorBody(res);
      throw new Error(msg || 'Erro HTTP ' + res.status);
    }
    var text = await res.text();
    if (!text || !String(text).trim()) return null;
    var ct = res.headers.get('content-type') || '';
    if (ct.indexOf('application/json') !== -1) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    }
    return text;
  };

  VA.api = {
    listClientes: function () {
      return VA.apiRequest('/clientes');
    },
    getCliente: function (id) {
      return VA.apiRequest('/clientes/' + encodeURIComponent(id));
    },
    createCliente: function (body) {
      return VA.apiRequest('/clientes', { method: 'POST', body: JSON.stringify(body) });
    },
    updateCliente: function (id, body) {
      return VA.apiRequest('/clientes/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) });
    },
    deleteCliente: function (id) {
      return VA.apiRequest('/clientes/' + encodeURIComponent(id), { method: 'DELETE' });
    },
    ativarCliente: function (id) {
      return VA.apiRequest('/clientes/' + encodeURIComponent(id) + '/ativar', { method: 'PATCH' });
    },
    desativarCliente: function (id) {
      return VA.apiRequest('/clientes/' + encodeURIComponent(id) + '/desativar', { method: 'PATCH' });
    },

    listTipos: function () {
      return VA.apiRequest('/tipos-de-item');
    },
    getTipo: function (id) {
      return VA.apiRequest('/tipos-de-item/' + encodeURIComponent(id));
    },
    createTipo: function (body) {
      return VA.apiRequest('/tipos-de-item', { method: 'POST', body: JSON.stringify(body) });
    },
    updateTipo: function (id, body) {
      return VA.apiRequest('/tipos-de-item/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) });
    },
    deleteTipo: function (id) {
      return VA.apiRequest('/tipos-de-item/' + encodeURIComponent(id), { method: 'DELETE' });
    },

    listItems: function () {
      return VA.apiRequest('/items');
    },
    getItem: function (id) {
      return VA.apiRequest('/items/' + encodeURIComponent(id));
    },
    createItem: function (body) {
      return VA.apiRequest('/items', { method: 'POST', body: JSON.stringify(body) });
    },
    updateItem: function (id, body) {
      return VA.apiRequest('/items/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) });
    },
    ativarItem: function (id) {
      return VA.apiRequest('/items/' + encodeURIComponent(id) + '/ativar', { method: 'POST' });
    },
    desativarItem: function (id) {
      return VA.apiRequest('/items/' + encodeURIComponent(id) + '/desativar', { method: 'POST' });
    },

    listVendas: function (filters) {
      filters = filters || {};
      var q = [];
      if (filters.clienteId) q.push('clienteId=' + encodeURIComponent(filters.clienteId));
      if (filters.itemId) q.push('itemId=' + encodeURIComponent(filters.itemId));
      if (filters.tipoDeItemId) q.push('tipoDeItemId=' + encodeURIComponent(filters.tipoDeItemId));
      var qs = q.length ? '?' + q.join('&') : '';
      return VA.apiRequest('/vendas' + qs);
    },
    getVenda: function (id) {
      return VA.apiRequest('/vendas/' + encodeURIComponent(id));
    },
    createVenda: function (body) {
      return VA.apiRequest('/vendas', { method: 'POST', body: JSON.stringify(body) });
    },
    confirmarVenda: function (id) {
      return VA.apiRequest('/vendas/' + encodeURIComponent(id) + '/confirmar', { method: 'PATCH' });
    },
    cancelarVenda: function (id) {
      return VA.apiRequest('/vendas/' + encodeURIComponent(id) + '/cancelar', { method: 'PATCH' });
    },

    relatoriosTotais: function () {
      return VA.apiRequest('/vendas/relatoriosTotais');
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
