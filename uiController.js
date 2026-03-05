// ═════════════════════════════════════════════════════════════
// UIController - 툴팁, 사이드바, 탭, 상태바 UI 관리
// ═════════════════════════════════════════════════════════════

import { ROUTE_META } from './mapRenderer.js';

/**
 * 툴팁 초기화 및 핸들러 반환
 */
export function initTooltip() {
  var tooltip  = document.getElementById('tooltip');
  var ttName   = document.getElementById('tt-name');
  var ttCoords = document.getElementById('tt-coords');
  var ttRoute  = document.getElementById('tt-route');

  return {
    show: function(e, station, color) {
      ttName.textContent   = station.name + ' 영업소';
      ttName.style.color   = color;
      ttCoords.textContent = station.lat.toFixed(6) + '°N  ' + station.lon.toFixed(6) + '°E';
      ttRoute.textContent  = station.routeName;
      ttRoute.style.color  = color;
      tooltip.classList.add('show');
      this.move(e);
    },
    
    move: function(e) {
      var wrap = document.querySelector('.map-wrapper');
      var rect = wrap.getBoundingClientRect();
      var tx = e.clientX - rect.left + 14;
      var ty = e.clientY - rect.top  - 10;
      if (tx + 190 > rect.width) tx = e.clientX - rect.left - 200;
      tooltip.style.left = tx + 'px';
      tooltip.style.top  = ty + 'px';
    },
    
    hide: function() {
      tooltip.classList.remove('show');
    }
  };
}

/**
 * 사이드바 노선 목록 렌더링
 */
export function renderSidebar(routeGroups, onItemClick) {
  var list = document.getElementById('sidebar-list');
  list.innerHTML = '';
  
  Object.keys(ROUTE_META).forEach(function(routeNo) {
    var m  = ROUTE_META[routeNo];
    var ct = routeGroups[routeNo] ? routeGroups[routeNo].length : 0;
    
    var el = document.createElement('div');
    el.className     = 'road-item';
    el.dataset.route = routeNo;
    el.innerHTML =
      '<div class="road-dot" style="background:' + m.color + '"></div>' +
      '<div><div class="road-label">' + m.name + '</div>' +
      '<div class="road-sub">' + ct + '개 영업소</div></div>';
    
    el.addEventListener('click', function(){ onItemClick(routeNo); });
    list.appendChild(el);
  });
}

/**
 * 탭바 렌더링
 */
export function renderTabs(openTabs, activeRoute, onTabClick, onTabClose) {
  var bar = document.getElementById('tab-bar');
  bar.innerHTML = '';
  
  openTabs.forEach(function(routeNo) {
    var m  = ROUTE_META[routeNo] || { name: routeNo };
    var el = document.createElement('div');
    el.className     = 'tab' + (routeNo === activeRoute ? ' active' : '');
    el.dataset.route = routeNo;
    el.innerHTML = m.name + '<span class="tab-close" title="닫기">✕</span>';
    
    el.addEventListener('click', function(){ onTabClick(routeNo); });
    el.querySelector('.tab-close').addEventListener('click', function(e){ 
      e.stopPropagation();
      onTabClose(routeNo); 
    });
    
    bar.appendChild(el);
  });
}

/**
 * 사이드바 활성 항목 하이라이트
 */
export function updateSidebarHighlight(activeRoute) {
  document.querySelectorAll('.road-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.route === activeRoute);
  });
}

/**
 * 상태바 업데이트
 */
export function updateStatusBar(stationCount, routeCount) {
  document.getElementById('st-count').textContent  = stationCount;
  document.getElementById('st-routes').textContent = routeCount;
}
