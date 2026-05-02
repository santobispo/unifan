(function () {
  var VA = window.VendasApp;
  var api = VA.api;
  var editingId = null;
  var deleteId = null;

  function badgeClassForClienteStatus(status) {
    var s = String(status || '').toUpperCase();
    if (s === 'ATIVADO') return 'badge--ok';
    if (s === 'DESATIVADO') return 'badge--off';
    return 'badge--pendente';
  }

  function labelClienteStatus(status) {
    var s = String(status || '').trim();
    return s || '—';
  }

  var tbody = document.getElementById('tbody-clientes');
  var countEl = document.getElementById('count-clientes');

  async function loadList() {
    try {
      var list = await api.listClientes();
      render(list || []);
      if (countEl) countEl.textContent = String((list || []).length);
    } catch (e) {
      console.error(e);
      VA.showToast(e.message || 'Erro ao listar clientes.', 'error');
      render([]);
    }
  }

  function render(list) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-state">Nenhum cliente cadastrado.</td></tr>';
      return;
    }
    list.forEach(function (c) {
      var st = c.status;
      var stUp = String(st || '').toUpperCase();
      var isDesativado = stUp === 'DESATIVADO';
      var badgeClass = badgeClassForClienteStatus(st);
      var stLabel = labelClienteStatus(st);
      var toggleBtn = isDesativado
        ? '<button type="button" class="btn btn--primary btn--sm btn-ativar-cli" data-id="' +
          VA.escapeHtml(c.id) +
          '">Ativar</button> '
        : '<button type="button" class="btn btn--ghost btn--sm btn-desativ-cli" data-id="' +
          VA.escapeHtml(c.id) +
          '">Desativar</button> ';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        VA.escapeHtml(c.nome) +
        '</td><td>' +
        VA.escapeHtml(c.email || '—') +
        '</td><td>' +
        VA.escapeHtml(c.cep) +
        '</td><td><span class="badge ' +
        badgeClass +
        '">' +
        VA.escapeHtml(stLabel) +
        '</span></td><td><code style="font-size:0.7rem">' +
        VA.escapeHtml((c.id || '').slice(0, 8)) +
        '…</code></td><td style="white-space:normal;max-width:14rem">' +
        '<button type="button" class="btn btn--ghost btn--sm btn-edit" data-id="' +
        VA.escapeHtml(c.id) +
        '">Editar</button> ' +
        toggleBtn +
        '<button type="button" class="btn btn--danger btn--sm btn-del" data-id="' +
        VA.escapeHtml(c.id) +
        '" data-nome="' +
        VA.escapeHtml(c.nome || '') +
        '" data-status="' +
        VA.escapeHtml(stLabel) +
        '">Excluir</button></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(btn.getAttribute('data-id'));
      });
    });
    tbody.querySelectorAll('.btn-ativar-cli').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleClienteAtivo(btn.getAttribute('data-id'), true);
      });
    });
    tbody.querySelectorAll('.btn-desativ-cli').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleClienteAtivo(btn.getAttribute('data-id'), false);
      });
    });
    tbody.querySelectorAll('.btn-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        askDelete(btn);
      });
    });
  }

  async function toggleClienteAtivo(id, ativar) {
    try {
      if (ativar) await api.ativarCliente(id);
      else await api.desativarCliente(id);
      VA.showToast(ativar ? 'Cliente ativado.' : 'Cliente desativado.', 'success');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao alterar status.', 'error');
    }
  }

  function openCreate() {
    editingId = null;
    document.getElementById('modal-cliente-title').textContent = 'Novo cliente';
    document.getElementById('modal-cliente-sub').textContent = 'Preencha nome, CEP e e-mail (opcional).';
    document.getElementById('f-cliente-nome').value = '';
    document.getElementById('f-cliente-email').value = '';
    document.getElementById('f-cliente-cep').value = '';
    VA.openModal('modal-cliente');
    setTimeout(function () {
      document.getElementById('f-cliente-nome').focus();
    }, 100);
  }

  async function openEdit(id) {
    try {
      var c = await api.getCliente(id);
      editingId = id;
      document.getElementById('modal-cliente-title').textContent = 'Editar cliente';
      document.getElementById('modal-cliente-sub').textContent = 'Atualize os dados.';
      document.getElementById('f-cliente-nome').value = c.nome || '';
      document.getElementById('f-cliente-email').value = c.email || '';
      document.getElementById('f-cliente-cep').value = c.cep || '';
      VA.openModal('modal-cliente');
    } catch (e) {
      VA.showToast(e.message || 'Erro ao carregar cliente.', 'error');
    }
  }

  function askDelete(btn) {
    deleteId = btn.getAttribute('data-id');
    var nome = btn.getAttribute('data-nome') || '';
    var status = btn.getAttribute('data-status') || '—';
    var elNome = document.getElementById('confirm-del-cliente-nome');
    var elStatus = document.getElementById('confirm-del-cliente-status');
    if (elNome) elNome.textContent = nome || 'Cliente';
    if (elStatus) {
      elStatus.textContent = status;
      elStatus.className = 'badge ' + badgeClassForClienteStatus(status);
    }
    VA.openModal('modal-confirm-delete');
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.deleteCliente(deleteId);
      VA.showToast('Cliente removido.', 'info');
      VA.closeModal('modal-confirm-delete');
      deleteId = null;
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Não foi possível excluir. Verifique vínculos ou tente novamente.', 'error');
    }
  }

  async function saveCliente() {
    var nome = document.getElementById('f-cliente-nome').value.trim();
    var email = document.getElementById('f-cliente-email').value.trim();
    var cep = document.getElementById('f-cliente-cep').value.trim();

    if (nome.length < 1 || cep.length < 1) {
      VA.showToast('Nome e CEP são obrigatórios.', 'error');
      return;
    }

    var body = { nome: nome, cep: cep };
    if (email) body.email = email;

    try {
      if (editingId) {
        await api.updateCliente(editingId, body);
        VA.showToast('Cliente atualizado.', 'success');
      } else {
        await api.createCliente(body);
        VA.showToast('Cliente cadastrado.', 'success');
      }
      VA.closeModal('modal-cliente');
      await loadList();
    } catch (e) {
      VA.showToast(e.message || 'Erro ao salvar.', 'error');
    }
  }

  VA.injectLayout('clientes');

  document.getElementById('btn-novo-cliente').addEventListener('click', openCreate);
  document.getElementById('btn-save-cliente').addEventListener('click', saveCliente);
  document.getElementById('btn-cancel-cliente').addEventListener('click', function () {
    VA.closeModal('modal-cliente');
  });
  document.getElementById('btn-confirm-del-no').addEventListener('click', function () {
    VA.closeModal('modal-confirm-delete');
    deleteId = null;
  });
  document.getElementById('btn-confirm-del-yes').addEventListener('click', confirmDelete);

  VA.bindModalOverlayClose('modal-cliente');
  VA.bindModalOverlayClose('modal-confirm-delete');

  loadList();
})();
