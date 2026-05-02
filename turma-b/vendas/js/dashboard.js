(function () {
  var VA = window.VendasApp;
  var api = VA.api;

  var barCanvas = document.getElementById('chart-barras');
  var pieCanvas = document.getElementById('chart-pizza');
  var banner = document.getElementById('error-banner');
  var bannerMsg = document.getElementById('error-detail');

  function showError(msg) {
    if (!banner || !bannerMsg) return;
    banner.classList.add('is-visible');
    bannerMsg.textContent = msg;
  }

  function hideError() {
    if (banner) banner.classList.remove('is-visible');
  }

  function fillTables(data) {
    var tbItem = document.getElementById('tbody-itens');
    var tbTipo = document.getElementById('tbody-tipos');
    if (tbItem) {
      tbItem.innerHTML = '';
      var items = data.totalPorItems || [];
      if (!items.length) {
        tbItem.innerHTML =
          '<tr><td colspan="4" class="empty-state">Nenhum item vendido ainda.</td></tr>';
      } else {
        items.forEach(function (row) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' +
            VA.escapeHtml(row.nome) +
            '</td><td>' +
            VA.formatInt(row.quantidadeVendida) +
            '</td><td>R$ ' +
            VA.formatMoney(row.valor) +
            '</td><td>R$ ' +
            VA.formatMoney(row.valorTotal) +
            '</td>';
          tbItem.appendChild(tr);
        });
      }
    }
    if (tbTipo) {
      tbTipo.innerHTML = '';
      var tipos = data.totalPorTipo || [];
      if (!tipos.length) {
        tbTipo.innerHTML =
          '<tr><td colspan="3" class="empty-state">Nenhum tipo com vendas.</td></tr>';
      } else {
        tipos.forEach(function (row) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' +
            VA.escapeHtml(row.nome) +
            '</td><td>' +
            VA.formatInt(row.quantidadeVendida) +
            '</td><td>R$ ' +
            VA.formatMoney(row.totalDeVendas) +
            '</td>';
          tbTipo.appendChild(tr);
        });
      }
    }
  }

  function updateCharts(data) {
    var items = data.totalPorItems || [];
    var tipos = data.totalPorTipo || [];

    var labelsBar = items.map(function (i) {
      return i.nome || 'Item';
    });
    var valuesBar = items.map(function (i) {
      return Number(i.valorTotal) || 0;
    });

    var labelsPie = tipos.map(function (t) {
      return t.nome || 'Tipo';
    });
    var valuesPie = tipos.map(function (t) {
      return Number(t.totalDeVendas) || 0;
    });

    if (barCanvas) VA.drawBarChart(barCanvas, labelsBar, valuesBar);
    if (pieCanvas) VA.drawPieChart(pieCanvas, labelsPie, valuesPie);
  }

  function redrawCharts() {
    if (!window.__dashData) return;
    updateCharts(window.__dashData);
  }

  async function load() {
    hideError();
    try {
      var data = await api.relatoriosTotais();
      window.__dashData = data;

      var elTotal = document.getElementById('stat-total');
      var elQtd = document.getElementById('stat-qtd');
      if (elTotal) elTotal.textContent = 'R$ ' + VA.formatMoney(data.totalDeVendas);
      if (elQtd) elQtd.textContent = VA.formatInt(data.quantidadeVendida);

      fillTables(data);
      updateCharts(data);

      if (barCanvas && pieCanvas && !window.__vendasDashResizeBound) {
        window.__vendasDashResizeBound = true;
        VA.redrawChartsOnResize(barCanvas, redrawCharts, pieCanvas, redrawCharts);
      }
    } catch (e) {
      console.error(e);
      showError(e.message || 'Não foi possível carregar os relatórios.');
      VA.showToast('Falha ao carregar o dashboard.', 'error');
    }
  }

  VA.injectLayout('dashboard');
  load();
})();
