/**
 * Card de vendas do Reciclômetro (turma-b/index.html).
 * Depende de: Chart (global), VendasApp.config/api (config.js + api.js).
 */
(function (global) {
  var VA = global.VendasApp;
  var salesChartInstance = null;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBRL(n) {
    var x = Number(n);
    if (isNaN(x)) return '—';
    return x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function initReciclometroVendasCard() {
    if (!VA || !VA.api || typeof VA.api.relatoriosTotais !== 'function') {
      console.warn('[reciclometro-vendas-card] Carregue vendas/js/config.js e vendas/js/api.js antes deste arquivo.');
      return;
    }
    if (typeof global.Chart === 'undefined') {
      console.warn('[reciclometro-vendas-card] Chart.js não encontrado.');
      return;
    }

    var canvas = document.getElementById('salesChart');
    if (!canvas) return;

    var salesCtx = canvas.getContext('2d');
    var metricEl = document.getElementById('vendas-metric-total');
    var qtdEl = document.getElementById('vendas-qtd-val');
    var progressEl = document.getElementById('vendas-progress-fill');
    var listEl = document.getElementById('vendas-top-itens-list');
    var badgeEl = document.getElementById('vendas-card-badge');
    var hintEl = document.getElementById('vendas-chart-hint');

    VA.api
      .relatoriosTotais()
      .then(function (data) {
        var total = Number(data.totalDeVendas) || 0;
        var qtd = Number(data.quantidadeVendida) || 0;
        if (metricEl) metricEl.textContent = formatBRL(total);
        if (qtdEl) qtdEl.textContent = qtd.toLocaleString('pt-BR') + ' un.';
        if (badgeEl) badgeEl.textContent = 'Relatório sincronizado';

        var tipos = data.totalPorTipo || [];
        var labels = tipos.map(function (t) {
          return t.nome || 'Tipo';
        });
        var values = tipos.map(function (t) {
          return Number(t.totalDeVendas) || 0;
        });

        if (!labels.length && (data.totalPorItems || []).length) {
          var porItems = data.totalPorItems || [];
          labels = porItems.map(function (i) {
            return i.nome || 'Item';
          });
          values = porItems.map(function (i) {
            return Number(i.valorTotal) || 0;
          });
          if (hintEl) hintEl.textContent = 'Total por item (R$)';
        } else if (hintEl) hintEl.textContent = 'Total por tipo de item (R$)';

        if (!labels.length && total > 0) {
          labels = ['Total'];
          values = [total];
        }
        if (!labels.length) {
          labels = ['Sem dados'];
          values = [0];
        }

        if (salesChartInstance) salesChartInstance.destroy();
        salesChartInstance = new global.Chart(salesCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Valor (R$)',
                data: values,
                backgroundColor: '#4caf50',
                borderRadius: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: { beginAtZero: true },
            },
          },
        });

        if (progressEl && tipos.length && total > 0) {
          var maxTipo = Math.max.apply(
            null,
            tipos.map(function (t) {
              return Number(t.totalDeVendas) || 0;
            })
          );
          var pct = Math.round((maxTipo / total) * 100);
          progressEl.style.width = Math.min(100, pct) + '%';
        } else if (progressEl && total > 0) {
          progressEl.style.width = '100%';
        } else if (progressEl) {
          progressEl.style.width = '0%';
        }

        if (listEl) {
          var topItems = (data.totalPorItems || []).slice(0, 5);
          if (!topItems.length) {
            listEl.innerHTML = '<div class="order-item"><span>Nenhum item no relatório.</span></div>';
          } else {
            listEl.innerHTML = topItems
              .map(function (it) {
                return (
                  '<div class="order-item"><span>📦 ' +
                  escapeHtml(it.nome) +
                  '</span><strong>' +
                  formatBRL(it.valorTotal) +
                  '</strong></div>'
                );
              })
              .join('');
          }
        }
      })
      .catch(function (err) {
        console.error(err);
        if (metricEl) metricEl.textContent = '—';
        if (badgeEl) badgeEl.textContent = 'Sem conexão';
        if (listEl)
          listEl.innerHTML =
            '<div class="order-item"><span>Não foi possível carregar o relatório (rede ou CORS).</span></div>';
        new global.Chart(salesCtx, {
          type: 'line',
          data: {
            labels: ['—'],
            datasets: [
              {
                label: 'Aguardando API',
                data: [0],
                borderColor: '#BDBDBD',
                backgroundColor: 'rgba(189,189,189,0.1)',
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } },
          },
        });
      });
  }

  if (VA) {
    VA.initReciclometroVendasCard = initReciclometroVendasCard;
  }
})(typeof window !== 'undefined' ? window : globalThis);
