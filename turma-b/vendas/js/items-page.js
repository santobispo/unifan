(function () {
  var VA = window.VendasApp;
  var api = VA.api;
  var editingId = null;
  var tiposCache = [];

  var grid = document.getElementById('items-grid');
  var countEl = document.getElementById('count-items');

  async function loadTipos() {
    tiposCache = await api.listTipos();
    var sel = document.getElementById('f-item-tipo');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione…</option>';
    (tiposCache || []).forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nome;
      sel.appendChild(opt);
    });
  }

  async function loadList() {
    try {
      await loadTipos();
      var list = await api.listItems();
      render(list || []);
      if (countEl) countEl.textContent = String((list || []).length);
    } catch (e) {
      console.error(e);
      VA.showToast(e.message || 'Erro ao listar itens.', 'error');
      render([]);
    }
  }

  function render(list) {
    if (!grid) return;
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML =
        '<p class="empty-state" style="grid-column:1/-1">Nenhum item cadastrado. Clique em <strong>Novo item</strong>.</p>';
      return;
    }
    list.forEach(function (it) {
      var card = document.createElement('article');
      card.className = 'card';
      var ativo = it.status === 'ATIVADO';
      card.innerHTML =
        '<div class="card__body">' +
        '<span class="badge ' +
        (ativo ? 'badge--ok' : 'badge--off') +
        '">' +
        (ativo ? 'Ativo' : 'Desativado') +
        '</span>' +
        '<h3 class="card__title">' +
        VA.escapeHtml(it.nome) +
        '</h3>' +
        '<p class="card__meta">' +
        VA.escapeHtml(it.descricao) +
        '</p>' +
        '<p class="card__meta">Tipo: <strong>' +
        VA.escapeHtml((it.tipo && it.tipo.nome) || '—') +
        '</strong></p>' +
        '<p class="card__meta">Valor unitário: <strong>R$ ' +
        VA.formatMoney(it.valor) +
        '</strong></p>' +
        '<div class="card__actions">' +
        '<button type="button" class="btn btn--ghost btn--sm btn-edit-item" data-id="' +
        VA.escapeHtml(it.id) +
        '">Editar</button>' +
        (ativo
          ? '<button type="button" class="btn btn--danger btn--sm btn-off-item" data-id="' +
            VA.escapeHtml(it.id) +
            '">Desativar</button>'
          : '<button type="button" class="btn btn--primary btn--sm btn-on-item" data-id="' +
            VA.escapeHtml(it.id) +
            '">Ativar</button>') +
        '</div></div>';
      grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-edit-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(btn.getAttribute('data-id'));
      });
    });
    grid.querySelectorAll('.btn-off-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleItem(btn.getAttribute('data-id'), false);
      });
    });
    grid.querySelectorAll('.btn-on-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleItem(btn.getAttribute('data-id'), true);
      });
    });
  }

  async function toggleItem(id, ativar) {
    try {
      if (ativar) await api.ativarItem(id);
      else await api.desativarItem(id);
      VA.showToast(ativar ? 'Item ativado.' : 'Item desativado.', 'success');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao alterar status.', 'error');
    }
  }

  function openCreate() {
    editingId = null;
    document.getElementById('modal-item-title').textContent = 'Novo item';
    document.getElementById('modal-item-sub').textContent = 'Informe nome, valor, descrição e tipo.';
    document.getElementById('f-item-nome').value = '';
    document.getElementById('f-item-valor').value = '';
    document.getElementById('f-item-desc').value = '';
    document.getElementById('f-item-tipo').value = '';
    VA.openModal('modal-item');
    setTimeout(function () {
      document.getElementById('f-item-nome').focus();
    }, 100);
  }

  async function openEdit(id) {
    try {
      var it = await api.getItem(id);
      editingId = id;
      document.getElementById('modal-item-title').textContent = 'Editar item';
      document.getElementById('modal-item-sub').textContent = 'Atualize os dados.';
      document.getElementById('f-item-nome').value = it.nome || '';
      document.getElementById('f-item-valor').value = it.valor != null ? String(it.valor) : '';
      document.getElementById('f-item-desc').value = it.descricao || '';
      document.getElementById('f-item-tipo').value =
        it.tipo && it.tipo.id ? it.tipo.id : '';
      VA.openModal('modal-item');
    } catch (e) {
      VA.showToast(e.message || 'Erro ao carregar item.', 'error');
    }
  }

  var MAX_VARCHAR = 255;

  async function saveItem() {
    var nome = document.getElementById('f-item-nome').value.trim();
    var valor = parseFloat(document.getElementById('f-item-valor').value, 10);
    var descricao = document.getElementById('f-item-desc').value.trim();
    var tipoId = document.getElementById('f-item-tipo').value;

    if (nome.length < 1 || descricao.length < 1 || !tipoId) {
      VA.showToast('Preencha nome, descrição e tipo.', 'error');
      return;
    }
    if (nome.length > MAX_VARCHAR || descricao.length > MAX_VARCHAR) {
      VA.showToast('Nome e descrição aceitam no máximo ' + MAX_VARCHAR + ' caracteres.', 'error');
      return;
    }
    if (isNaN(valor) || valor < 0) {
      VA.showToast('Valor inválido.', 'error');
      return;
    }

    var body = { nome: nome, valor: valor, descricao: descricao, tipoId: tipoId };
    try {
      if (editingId) {
        await api.updateItem(editingId, body);
        VA.showToast('Item atualizado.', 'success');
      } else {
        await api.createItem(body);
        VA.showToast('Item cadastrado.', 'success');
      }
      VA.closeModal('modal-item');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao salvar.', 'error');
    }
  }

  VA.injectLayout('items');

  document.getElementById('btn-novo-item').addEventListener('click', openCreate);
  document.getElementById('btn-save-item').addEventListener('click', saveItem);
  document.getElementById('btn-cancel-item').addEventListener('click', function () {
    VA.closeModal('modal-item');
  });

  VA.bindModalOverlayClose('modal-item');

  loadList();
})();
