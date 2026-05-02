(function (global) {
  var VA = global.VendasApp;

  var PALETTE = ['#2D6A4F', '#D97706', '#1B4332', '#40916C', '#FCD34D', '#95D5B2', '#B45309', '#52B788'];

  function clearCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }

  /**
   * Gráfico de barras horizontais simples (rótulos à esquerda).
   */
  VA.drawBarChart = function (canvas, labels, values) {
    labels = labels || [];
    values = values || [];
    var meta = clearCanvas(canvas);
    var ctx = meta.ctx;
    var w = meta.w;
    var h = meta.h;
    if (!labels.length || !w || !h) {
      ctx.fillStyle = '#57534E';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Sem dados para exibir', 16, h / 2);
      return;
    }

    var maxVal = Math.max.apply(null, values.map(function (v) { return Number(v) || 0; }));
    if (maxVal <= 0) maxVal = 1;

    var padL = Math.min(160, w * 0.38);
    var padR = 24;
    var padT = 16;
    var padB = 28;
    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    var n = labels.length;
    var gap = 6;
    var barH = Math.max(8, (innerH - gap * (n - 1)) / n);

    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#57534E';

    for (var i = 0; i < n; i++) {
      var y = padT + i * (barH + gap);
      var v = Number(values[i]) || 0;
      var bw = (v / maxVal) * innerW;
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fillRect(padL, y, Math.max(0, bw), barH);

      ctx.fillStyle = '#1C1917';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      var label = String(labels[i]);
      if (label.length > 22) label = label.slice(0, 20) + '…';
      ctx.fillText(label, padL - 8, y + barH / 2);

      ctx.fillStyle = '#57534E';
      ctx.textAlign = 'left';
      ctx.fillText('R$ ' + VA.formatMoney(v), padL + bw + 8, y + barH / 2);
    }

    ctx.fillStyle = '#A8A29E';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Valor total por item', padL, h - 8);
  };

  /**
   * Gráfico de pizza (donut) com legenda.
   */
  VA.drawPieChart = function (canvas, labels, values) {
    labels = labels || [];
    values = values || [];
    var meta = clearCanvas(canvas);
    var ctx = meta.ctx;
    var w = meta.w;
    var h = meta.h;
    if (!labels.length || !w || !h) {
      ctx.fillStyle = '#57534E';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Sem dados para exibir', 16, h / 2);
      return;
    }

    var cx = w * 0.34;
    var cy = h / 2;
    var r = Math.min(cx - 24, cy - 24, h * 0.38);
    var ri = r * 0.52;

    var nums = values.map(function (v) { return Math.max(0, Number(v) || 0); });
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    if (sum <= 0) sum = 1;

    var start = -Math.PI / 2;
    for (var i = 0; i < labels.length; i++) {
      var slice = (nums[i] / sum) * Math.PI * 2;
      ctx.beginPath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.closePath();
      ctx.fill();
      start += slice;
    }

    ctx.beginPath();
    ctx.fillStyle = '#FAF8F4';
    ctx.arc(cx, cy, ri, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1C1917';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tipos', cx, cy - 6);
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#57534E';
    ctx.fillText('participação', cx, cy + 10);

    var lx = cx + r + 32;
    var rowGap = 36;
    var ly = Math.max(24, cy - (labels.length * rowGap) / 2);
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    for (var j = 0; j < labels.length; j++) {
      var rowY = ly + j * rowGap;
      ctx.fillStyle = PALETTE[j % PALETTE.length];
      ctx.fillRect(lx, rowY - 6, 10, 10);
      ctx.fillStyle = '#1C1917';
      var lab = String(labels[j]);
      if (lab.length > 28) lab = lab.slice(0, 26) + '…';
      ctx.fillText(lab, lx + 16, rowY);
      ctx.fillStyle = '#78716C';
      ctx.fillText('R$ ' + VA.formatMoney(nums[j]), lx + 16, rowY + 12);
    }
  };

  VA.redrawChartsOnResize = function (canvasBar, fnBar, canvasPie, fnPie) {
    var t;
    function run() {
      fnBar();
      fnPie();
    }
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(run, 120);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
