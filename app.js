// ═════════════════════════════════════════════════════════════
//  Maptap Highway — app_v2.js (모듈화 버전)
//  역할 기반 구조: 각 모듈이 명확한 책임을 가짐
// ═════════════════════════════════════════════════════════════

import { fetchRawData } from './dataLoader.js';
import { parseStations, groupByRoute } from './stationParser.js';
import { RouteManager } from './routeManager.js';
import { createProcessor, calcBounds } from './coordinateProcessor.js';
import { renderGrid, renderMap, renderLegend } from './mapRenderer.js';
import { 
  initTooltip, 
  renderSidebar, 
  renderTabs, 
  updateSidebarHighlight,
  updateStatusBar 
} from './uiController.js';

// ── 전역 상태 ─────────────────────────────────────────────────
var routeManager = null;
var allStations  = null;
var tooltipHandlers = null;

// 줌 & 패닝 상태
var zoomLevel = 1.0;    // 1.0 = 기본, 2.0 = 2배 확대
var panOffsetX = 0;     // 패닝 X 오프셋
var panOffsetY = 0;     // 패닝 Y 오프셋

// ── SVG 요소 참조 ─────────────────────────────────────────────
var svg, gridLayer, roadsLayer, dotsLayer, legendEl;

// ── 초기화 함수 ───────────────────────────────────────────────
function init() {
  // DOM 요소 캐싱
  svg        = document.getElementById('map-svg');
  gridLayer  = svg.querySelector('#grid-layer');
  roadsLayer = svg.querySelector('#roads-layer');
  dotsLayer  = svg.querySelector('#dots-layer');
  legendEl   = document.getElementById('legend');

  // 툴팁 초기화
  tooltipHandlers = initTooltip();

  // 마우스 휠 줌 이벤트 설정
  setupZoomControls();

  // 데이터 로드 및 파싱
  fetchRawData()
    .then(function(rawData) {
      // 1) 데이터 파싱
      allStations = parseStations(rawData);
      var routeGroups = groupByRoute(allStations);

      // 2) 상태 관리 객체 생성
      routeManager = new RouteManager(routeGroups);

      // 3) 사이드바 렌더링
      renderSidebar(routeGroups, function(routeNo) {
        routeManager.openTab(routeNo);
        updateUI();
        redraw();
      });

      // 4) ResizeObserver로 SVG 크기 변화 감지
      var initialized = false;
      var ro = new ResizeObserver(function(entries) {
        var entry = entries[0];
        var W = Math.floor(entry.contentRect.width);
        var H = Math.floor(entry.contentRect.height);
        
        if (W > 0 && H > 0) {
          draw(W, H);
          
          // 초기 로드 시 모든 노선 열기
          if (!initialized) {
            initialized = true;
            var available = Object.keys(routeGroups);
            available.forEach(function(r){ routeManager.openTab(r); });
            updateUI();
          }
        }
      });

      ro.observe(svg.parentElement);
    })
    .catch(function(err) {
      console.error('데이터 로드 실패:', err);
      document.querySelector('.map-wrapper').insertAdjacentHTML(
        'beforeend',
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#e84040;font-size:14px;">데이터 로드 실패: ' + err.message + '</div>'
      );
    });
}

// ── 지도 그리기 함수 ──────────────────────────────────────────
function draw(W, H) {
  if (!routeManager || !allStations) return;

  // SVG 크기 설정
  svg.setAttribute('width',   W);
  svg.setAttribute('height',  H);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  // 바운딩 박스 계산
  var bounds = calcBounds(allStations);

  // 좌표 변환 함수 생성 (줌 레벨과 패닝 오프셋 적용)
  var processor = createProcessor(bounds, W, H, { 
    top: 60, 
    right: 80, 
    bottom: 60, 
    left: 80 
  }, zoomLevel, panOffsetX, panOffsetY);

  // 활성 노선 그룹 가져오기
  var activeRouteGroups = routeManager.getActiveRouteGroups();

  // 렌더링
  renderGrid(gridLayer, W, H);
  renderMap(roadsLayer, dotsLayer, activeRouteGroups, processor, tooltipHandlers);
  renderLegend(legendEl, routeManager.openTabs);
}

// ── UI 업데이트 (탭, 사이드바, 상태바) ──────────────────────
function updateUI() {
  if (!routeManager) return;

  // 탭바 렌더링
  renderTabs(
    routeManager.openTabs, 
    routeManager.activeRoute,
    function(routeNo) {
      routeManager.setActive(routeNo);
      updateUI();
      redraw();
    },
    function(routeNo) {
      routeManager.closeTab(routeNo);
      updateUI();
      redraw();
    }
  );

  // 사이드바 하이라이트
  updateSidebarHighlight(routeManager.activeRoute);

  // 상태바
  var count = routeManager.getTotalStationCount();
  updateStatusBar(count, routeManager.openTabs.length, zoomLevel);
}

// ── 현재 크기로 재렌더링 ──────────────────────────────────────
function redraw() {
  var W = parseFloat(svg.getAttribute('width'))  || 0;
  var H = parseFloat(svg.getAttribute('height')) || 0;
  if (W > 0 && H > 0) draw(W, H);
}

// ── 줌 & 패닝 컨트롤 설정 ─────────────────────────────────────
function setupZoomControls() {
  var isDragging = false;
  var lastX = 0;
  var lastY = 0;

  // 마우스 휠 줌
  svg.addEventListener('wheel', function(e) {
    e.preventDefault();
    
    var zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    var newZoom = zoomLevel * zoomFactor;
    
    // 줌 레벨 제한 (0.5x ~ 5.0x)
    newZoom = Math.max(0.5, Math.min(5.0, newZoom));
    
    zoomLevel = newZoom;
    redraw();
    updateStatusBar(
      routeManager.getTotalStationCount(), 
      routeManager.openTabs.length, 
      zoomLevel
    );
  });

  // 드래그로 패닝 (선택사항 - 추후 개선 가능)
  svg.addEventListener('mousedown', function(e) {
    // 영업소 원을 클릭한 경우 드래그 시작 안 함
    if (e.target.tagName === 'circle') return;
    
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    svg.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    
    panOffsetX += dx;
    panOffsetY += dy;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    redraw();
  });

  window.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      svg.style.cursor = 'default';
    }
  });

  // 더블 클릭으로 줌 리셋
  svg.addEventListener('dblclick', function(e) {
    if (e.target.tagName === 'circle') return; // 영업소 클릭 시 제외
    
    zoomLevel = 1.0;
    panOffsetX = 0;
    panOffsetY = 0;
    redraw();
    updateStatusBar(
      routeManager.getTotalStationCount(), 
      routeManager.openTabs.length, 
      zoomLevel
    );
  });
}

// ── 시작 ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);