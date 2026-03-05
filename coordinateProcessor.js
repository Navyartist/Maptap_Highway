// ═════════════════════════════════════════════════════════════
// CoordinateProcessor - 위경도 ↔ SVG 픽셀 좌표 변환
// ═════════════════════════════════════════════════════════════

/**
 * 위경도를 SVG 좌표로 변환하는 함수 생성
 * @param {Object} bounds - { minLon, maxLon, minLat, maxLat }
 * @param {Number} canvasW - SVG 캔버스 너비
 * @param {Number} canvasH - SVG 캔버스 높이
 * @param {Object} pad - { top, right, bottom, left } 여백
 * @returns {Function} (lon, lat) => { x, y }
 */
export function createProcessor(bounds, canvasW, canvasH, pad) {
  const mapW    = canvasW - pad.left - pad.right;
  const mapH    = canvasH - pad.top  - pad.bottom;
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;
  
  // 종횡비 유지하며 최대 크기로 스케일링
  const scale   = Math.min(mapW / lonSpan, mapH / latSpan);
  
  // 중앙 정렬을 위한 오프셋
  const offX    = pad.left  + (mapW - lonSpan * scale) / 2;
  const offY    = pad.top   + (mapH - latSpan * scale) / 2;

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
