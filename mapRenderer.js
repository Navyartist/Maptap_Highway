// ═════════════════════════════════════════════════════════════
// MapRenderer - SVG 요소 렌더링 (지도, 격자, 범례)
// ═════════════════════════════════════════════════════════════

var SVG_NS = 'http://www.w3.org/2000/svg';

// 노선 메타 정보
export var ROUTE_META = {
  "001": { name:"경부선",   color:"#e84040" },
  "015": { name:"서해안선", color:"#e87a40" },
  "050": { name:"영동선",   color:"#3ab54a" },
  "035": { name:"중부선-대전통영선A",   color:"#d4b800" },
  "010": { name:"남해선A",   color:"#3a80e8" },
};

/**
 * SVG 요소 생성 헬퍼
 */
function makeSVG(tag, attrs, text) {
  var el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      el.setAttribute(k, attrs[k]);
    });
  }
  if (text) el.textContent = text;
  return el;
}

/**
 * 격자 렌더링
 */
export function renderGrid(layer, W, H) {
  var cols = 12, rows = 8;
  layer.innerHTML = '';
  
  for (var i = 1; i < cols; i++) {
    var x = (W / cols) * i;
    layer.appendChild(makeSVG('line', { x1:x, y1:0, x2:x, y2:H, class:'grid-line' }));
  }
  for (var j = 1; j < rows; j++) {
    var y = (H / rows) * j;
    layer.appendChild(makeSVG('line', { x1:0, y1:y, x2:W, y2:y, class:'grid-line' }));
  }
}

/**
 * 지도 렌더링 (polyline + circle)
 */
export function renderMap(roadsLayer, dotsLayer, routeGroups, processor, tooltipHandlers) {
  roadsLayer.innerHTML = '';
  dotsLayer.innerHTML  = '';

  Object.keys(routeGroups).forEach(function(routeNo) {
    var stations = routeGroups[routeNo];
    if (!stations || stations.length === 0) return;

    var color = (ROUTE_META[routeNo] || {}).color || '#ffffff';

    // polyline 그리기
    var pts = stations.map(function(s) {
      var p = processor(s.lon, s.lat);
      return p.x + ',' + p.y;
    }).join(' ');

    roadsLayer.appendChild(makeSVG('polyline', {
      points: pts,
      fill:   'none',
      stroke: color,
      'stroke-width':    2.5,
      'stroke-linecap':  'round',
      'stroke-linejoin': 'round',
      opacity: 0.85,
    }));

    // circles 그리기
    stations.forEach(function(s, idx) {
      var p    = processor(s.lon, s.lat);
      var x    = p.x, y = p.y;
      var isEnd = idx === 0 || idx === stations.length - 1;
      var r    = isEnd ? 7 : 4.5;

      // 글로우
      dotsLayer.appendChild(makeSVG('circle', {
        cx: x, cy: y, r: r + 4,
        fill: color, opacity: 0.15,
      }));

      // 본체
      var circle = makeSVG('circle', {
        cx: x, cy: y, r: r,
        fill: color,
        stroke: '#0d0f14',
        'stroke-width': 1.5,
        style: 'cursor:pointer',
      });
      
      // 툴팁 이벤트 연결
      circle.addEventListener('mouseenter', function(e){ 
        tooltipHandlers.show(e, s, color); 
      });
      circle.addEventListener('mouseleave', function(){ 
        tooltipHandlers.hide(); 
      });
      circle.addEventListener('mousemove',  function(e){ 
        tooltipHandlers.move(e); 
      });
      dotsLayer.appendChild(circle);

      // 시작/종점 라벨
      if (isEnd) {
        dotsLayer.appendChild(makeSVG('text', {
          x: x + 10, y: y + 4,
          fill: color,
          'font-size': 11,
          'font-family': 'Noto Sans KR, sans-serif',
          'font-weight': 600,
        }, s.name));
      }
    });
  });
}

/**
 * 범례 렌더링
 */
export function renderLegend(legendEl, activeRoutes) {
  legendEl.innerHTML = '<div class="legend-title">노선 범례</div>';
  
  activeRoutes.forEach(function(routeNo) {
    var m = ROUTE_META[routeNo];
    if (!m) return;
    
    var item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = 
      '<div class="legend-line" style="background:' + m.color + '"></div>' +
      '<span>' + m.name + '</span>';
    legendEl.appendChild(item);
  });
  
  var dw = document.createElement('div');
  dw.className = 'legend-dot-wrap';
  dw.innerHTML = '<div class="legend-dot"></div><span style="font-size:10px;color:var(--muted)">영업소(톨게이트)</span>';
  legendEl.appendChild(dw);
}
