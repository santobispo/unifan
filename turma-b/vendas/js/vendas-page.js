(function () {
  var VA = window.VendasApp;
  var api = VA.api;
  var itemsCache = [];
  var clientesCache = [];

  var tbody = document.getElementById('tbody-vendas');
  var linhasContainer = document.getElementById('venda-linhas');

  async function loadClientesEItems() {
    clientesCache = await api.listClientes();
    var items = await api.listItems();
    itemsCache = (items || []).filter(function (i) {
      return i.status === 'ATIVADO';
    });

    var selCliente = document.getElementById('f-venda-cliente');
    if (selCliente) {
      selCliente.innerHTML = '<option value="">Selecione o cliente…</option>';
      clientesCache.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nome;
        selCliente.appendChild(opt);
      });
    }
  }

  function buildItemOptions(selectedId) {
    var html =
      '<option value="">Item…</option>' +
      itemsCache
        .map(function (it) {
          return (
            '<option value="' +
            VA.escapeHtml(it.id) +
            '"' +
            (it.id === selectedId ? ' selected' : '') +
            '>' +
            VA.escapeHtml(it.nome) +
            ' (R$ ' +
            VA.formatMoney(it.valor) +
            ')</option>'
          );
        })
        .join('');
    return html;
  }

  function addLinha(preset) {
    preset = preset || {};
    var wrap = document.createElement('div');
    wrap.className = 'venda-linha';
    wrap.innerHTML =
      '<div class="field" style="margin:0">' +
      '<label>Item</label>' +
      '<select class="field-input linha-item">' +
      buildItemOptions(preset.itemId) +
      '</select></div>' +
      '<div class="field" style="margin:0">' +
      '<label>Quantidade</label>' +
      '<input type="number" class="field-input linha-qtd" min="1" max="100" step="1" value="' +
      (preset.quantidade != null ? preset.quantidade : 1) +
      '" /></div>' +
      '<div><button type="button" class="btn btn--danger btn--sm btn-remove-linha">Remover</button></div>';

    wrap.querySelector('.btn-remove-linha').addEventListener('click', function () {
      wrap.remove();
      if (!linhasContainer.querySelector('.venda-linha')) addLinha();
    });
    linhasContainer.appendChild(wrap);
  }

  async function loadList() {
    try {
      await loadClientesEItems();
      var list = await api.listVendas();
      render(list || []);
    } catch (e) {
      console.error(e);
      VA.showToast(e.message || 'Erro ao listar vendas.', 'error');
      render([]);
    }
  }

  function render(list) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-state">Nenhuma venda registrada.</td></tr>';
      return;
    }
    list.forEach(function (v) {
      var tr = document.createElement('tr');
      var st = v.status || '';
      var badge =
        st === 'CONFIRMADA'
          ? 'badge--confirmada'
          : st === 'CANCELADA'
            ? 'badge--cancelada'
            : 'badge--pendente';
      var clienteNome = v.cliente && v.cliente.nome ? v.cliente.nome : '—';
      var actions = '';
      if (st === 'PENDENTE') {
        actions =
          '<button type="button" class="btn btn--primary btn--sm btn-conf" data-id="' +
          VA.escapeHtml(v.id) +
          '">Confirmar</button> ' +
          '<button type="button" class="btn btn--danger btn--sm btn-canc" data-id="' +
          VA.escapeHtml(v.id) +
          '">Cancelar</button>';
      } else {
        actions = '—';
      }
      tr.innerHTML =
        '<td>' +
        VA.formatDateBR(v.data) +
        '</td><td>' +
        VA.escapeHtml(clienteNome) +
        '</td><td>R$ ' +
        VA.formatMoney(v.total) +
        '</td><td><span class="badge ' +
        badge +
        '">' +
        VA.escapeHtml(st) +
        '</span></td><td>' +
        summarizeItems(v.items) +
        '</td><td>' +
        actions +
        '</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-conf').forEach(function (btn) {
      btn.addEventListener('click', function () {
        patchVenda(btn.getAttribute('data-id'), 'confirmar');
      });
    });
    tbody.querySelectorAll('.btn-canc').forEach(function (btn) {
      btn.addEventListener('click', function () {
        patchVenda(btn.getAttribute('data-id'), 'cancelar');
      });
    });
  }

  function summarizeItems(items) {
    if (!items || !items.length) return '—';
    var parts = items.map(function (iv) {
      var n = iv.item && iv.item.nome ? iv.item.nome : 'Item';
      return VA.escapeHtml(n) + ' × ' + VA.formatInt(iv.quantidade);
    });
    return parts.join(', ');
  }

  async function patchVenda(id, tipo) {
    try {
      if (tipo === 'confirmar') await api.confirmarVenda(id);
      else await api.cancelarVenda(id);
      VA.showToast(tipo === 'confirmar' ? 'Venda confirmada.' : 'Venda cancelada.', 'success');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao atualizar venda.', 'error');
    }
  }

  function openNovaVenda() {
    document.getElementById('f-venda-data').value = VA.todayISO();
    document.getElementById('f-venda-cliente').value = '';
    linhasContainer.innerHTML = '';
    addLinha();
    if (itemsCache.length === 0) {
      VA.showToast('Cadastre itens ativos antes de criar uma venda.', 'info');
    }
    VA.openModal('modal-venda');
  }

  async function saveVenda() {
    var date = document.getElementById('f-venda-data').value;
    var clienteId = document.getElementById('f-venda-cliente').value;
    if (!date || !clienteId) {
      VA.showToast('Informe data e cliente.', 'error');
      return;
    }

    var linhas = linhasContainer.querySelectorAll('.venda-linha');
    var items = [];
    linhas.forEach(function (linha) {
      var itemId = linha.querySelector('.linha-item').value;
      var q = parseInt(linha.querySelector('.linha-qtd').value, 10);
      if (itemId && !isNaN(q) && q >= 1 && q <= 100) {
        items.push({ itemId: itemId, quantidade: q });
      }
    });

    if (!items.length) {
      VA.showToast('Inclua pelo menos um item com quantidade válida.', 'error');
      return;
    }

    var body = {
      date: date,
      clienteId: clienteId,
      items: items,
    };

    try {
      await api.createVenda(body);
      VA.showToast('Venda registrada.', 'success');
      VA.closeModal('modal-venda');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao salvar venda.', 'error');
    }
  }

  VA.injectLayout('vendas');

  document.getElementById('btn-nova-venda').addEventListener('click', openNovaVenda);
  document.getElementById('btn-add-linha').addEventListener('click', function () {
    addLinha();
  });
  document.getElementById('btn-save-venda').addEventListener('click', saveVenda);
  document.getElementById('btn-cancel-venda').addEventListener('click', function () {
    VA.closeModal('modal-venda');
  });

  VA.bindModalOverlayClose('modal-venda');

  loadList();
})();
