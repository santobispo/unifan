(function () {
  var VA = window.VendasApp;
  var api = VA.api;
  var editingId = null;
  var deleteId = null;

  var tbody = document.getElementById('tbody-tipos');
  var countEl = document.getElementById('count-tipos');

  async function loadList() {
    try {
      var list = await api.listTipos();
      render(list || []);
      if (countEl) countEl.textContent = String((list || []).length);
    } catch (e) {
      console.error(e);
      VA.showToast(e.message || 'Erro ao listar tipos.', 'error');
      render([]);
    }
  }

  function render(list) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty-state">Nenhum tipo cadastrado.</td></tr>';
      return;
    }
    list.forEach(function (t) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        VA.escapeHtml(t.nome) +
        '</td><td>' +
        VA.escapeHtml(t.descricao) +
        '</td><td><code style="font-size:0.7rem">' +
        VA.escapeHtml((t.id || '').slice(0, 8)) +
        '…</code></td><td>' +
        '<button type="button" class="btn btn--ghost btn--sm btn-edit" data-id="' +
        VA.escapeHtml(t.id) +
        '">Editar</button> ' +
        '<button type="button" class="btn btn--danger btn--sm btn-del" data-id="' +
        VA.escapeHtml(t.id) +
        '">Excluir</button></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(btn.getAttribute('data-id'));
      });
    });
    tbody.querySelectorAll('.btn-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        askDelete(btn.getAttribute('data-id'));
      });
    });
  }

  function openCreate() {
    editingId = null;
    document.getElementById('modal-tipo-title').textContent = 'Novo tipo de item';
    document.getElementById('modal-tipo-sub').textContent = 'Nome e descrição são obrigatórios.';
    document.getElementById('f-tipo-nome').value = '';
    document.getElementById('f-tipo-desc').value = '';
    VA.openModal('modal-tipo');
    setTimeout(function () {
      document.getElementById('f-tipo-nome').focus();
    }, 100);
  }

  async function openEdit(id) {
    try {
      var t = await api.getTipo(id);
      editingId = id;
      document.getElementById('modal-tipo-title').textContent = 'Editar tipo';
      document.getElementById('modal-tipo-sub').textContent = 'Atualize os dados.';
      document.getElementById('f-tipo-nome').value = t.nome || '';
      document.getElementById('f-tipo-desc').value = t.descricao || '';
      VA.openModal('modal-tipo');
    } catch (e) {
      VA.showToast(e.message || 'Erro ao carregar tipo.', 'error');
    }
  }

  function askDelete(id) {
    deleteId = id;
    VA.openModal('modal-confirm-delete-tipo');
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.deleteTipo(deleteId);
      VA.showToast('Tipo removido.', 'info');
      VA.closeModal('modal-confirm-delete-tipo');
      deleteId = null;
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao excluir.', 'error');
    }
  }

  var MAX_VARCHAR = 255;

  async function saveTipo() {
    var nome = document.getElementById('f-tipo-nome').value.trim();
    var descricao = document.getElementById('f-tipo-desc').value.trim();
    if (nome.length < 1 || descricao.length < 1) {
      VA.showToast('Nome e descrição são obrigatórios.', 'error');
      return;
    }
    if (nome.length > MAX_VARCHAR || descricao.length > MAX_VARCHAR) {
      VA.showToast('Nome e descrição aceitam no máximo ' + MAX_VARCHAR + ' caracteres.', 'error');
      return;
    }
    var body = { nome: nome, descricao: descricao };
    try {
      if (editingId) {
        await api.updateTipo(editingId, body);
        VA.showToast('Tipo atualizado.', 'success');
      } else {
        await api.createTipo(body);
        VA.showToast('Tipo cadastrado.', 'success');
      }
      VA.closeModal('modal-tipo');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao salvar.', 'error');
    }
  }

  VA.injectLayout('tipos');

  document.getElementById('btn-novo-tipo').addEventListener('click', openCreate);
  document.getElementById('btn-save-tipo').addEventListener('click', saveTipo);
  document.getElementById('btn-cancel-tipo').addEventListener('click', function () {
    VA.closeModal('modal-tipo');
  });
  document.getElementById('btn-del-tipo-no').addEventListener('click', function () {
    VA.closeModal('modal-confirm-delete-tipo');
    deleteId = null;
  });
  document.getElementById('btn-del-tipo-yes').addEventListener('click', confirmDelete);

  VA.bindModalOverlayClose('modal-tipo');
  VA.bindModalOverlayClose('modal-confirm-delete-tipo');

  loadList();
})();
