// ═════════════════════════════════════════════════════════════
// CoordinateProcessor - 위경도 ↔ SVG 픽셀 좌표 변환
// ═════════════════════════════════════════════════════════════

/**
 * 위경도를 SVG 좌표로 변환하는 함수 생성
 * @param {Object} bounds - { minLon, maxLon, minLat, maxLat }
 * @param {Number} canvasW - SVG 캔버스 너비
 * @param {Number} canvasH - SVG 캔버스 높이
 * @param {Object} pad - { top, right, bottom, left } 여백
 * @param {Number} zoomLevel - 줌 레벨 (1.0 = 기본, 2.0 = 2배 확대)
 * @param {Number} panX - 패닝 X 오프셋 (픽셀)
 * @param {Number} panY - 패닝 Y 오프셋 (픽셀)
 * @returns {Function} (lon, lat) => { x, y }
 */
export function createProcessor(bounds, canvasW, canvasH, pad, zoomLevel, panX, panY) {
  zoomLevel = zoomLevel || 1.0;
  panX = panX || 0;
  panY = panY || 0;
  
  const mapW    = canvasW - pad.left - pad.right;
  const mapH    = canvasH - pad.top  - pad.bottom;
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;
  
  // 기본 스케일 계산 (종횡비 유지)
  const baseScale = Math.min(mapW / lonSpan, mapH / latSpan);
  
  // 줌 레벨 적용
  const scale = baseScale * zoomLevel;
  
  // 중앙 정렬을 위한 기본 오프셋
  const baseOffX = pad.left  + (mapW - lonSpan * baseScale) / 2;
  const baseOffY = pad.top   + (mapH - latSpan * baseScale) / 2;
  
  // 줌 중심점 (캔버스 중심)
  const centerX = canvasW / 2;
  const centerY = canvasH / 2;
  
  // 줌 시 중심점 기준으로 확대되도록 오프셋 조정
  const offX = centerX + (baseOffX - centerX) * zoomLevel + panX;
  const offY = centerY + (baseOffY - centerY) * zoomLevel + panY;

  return function toSVG(lon, lat) {
    return {
      x: +( offX + (lon - bounds.minLon) * scale ).toFixed(2),
      y: +( offY + (bounds.maxLat - lat) * scale ).toFixed(2),
    };
  };
}

/**
 * Station 배열로부터 바운딩 박스 계산
 * @param {Array} stations - Station 객체 배열
 * @param {Number} margin - 외곽 여백 (기본값 0.18)
 * @returns {Object} { minLon, maxLon, minLat, maxLat }
 */
export function calcBounds(stations, margin) {
  margin = margin === undefined ? 0.18 : margin;
  
  const lons = stations.map(function(s){ return s.lon; });
  const lats = stations.map(function(s){ return s.lat; });
  
  return {
    minLon: Math.min.apply(null, lons) - margin,
    maxLon: Math.max.apply(null, lons) + margin,
    minLat: Math.min.apply(null, lats) - margin,
    maxLat: Math.max.apply(null, lats) + margin,
  };
}