// ═════════════════════════════════════════════════════════════
// RouteManager - 노선 탭/활성화 상태 관리
// ═════════════════════════════════════════════════════════════

/**
 * 노선 탭 열림/닫힘 및 활성 노선 관리
 */
export function RouteManager(routeGroups) {
  this.routeGroups = routeGroups;  // { "001": [Station, ...], "015": [...] }
  this.openTabs = [];               // 현재 열린 탭들 ["001", "015", ...]
  this.activeRoute = null;          // 현재 활성화된 노선 "001"
}

/**
 * 노선 탭 열기 (이미 열려있으면 활성화만)
 */
RouteManager.prototype.openTab = function(routeNo) {
  if (this.openTabs.indexOf(routeNo) === -1) {
    this.openTabs.push(routeNo);
  }
  this.setActive(routeNo);
};

/**
 * 노선 탭 닫기
 */
RouteManager.prototype.closeTab = function(routeNo) {
  this.openTabs = this.openTabs.filter(function(r) { return r !== routeNo; });
  
  // 닫은 탭이 활성 탭이었다면 다른 탭으로 전환
  if (this.activeRoute === routeNo) {
    this.activeRoute = this.openTabs[this.openTabs.length - 1] || null;
  }
};

/**
 * 활성 노선 설정
 */
RouteManager.prototype.setActive = function(routeNo) {
  this.activeRoute = routeNo;
};

/**
 * 현재 열린 모든 탭의 Station 배열 반환
 */
RouteManager.prototype.getActiveStations = function() {
  var self = this;
  var result = [];
  this.openTabs.forEach(function(routeNo) {
    var stations = self.routeGroups[routeNo];
    if (stations) {
      result = result.concat(stations);
    }
  });
  return result;
};

/**
 * 현재 열린 탭의 총 영업소 수
 */
RouteManager.prototype.getTotalStationCount = function() {
  var self = this;
  return this.openTabs.reduce(function(sum, routeNo) {
    var stations = self.routeGroups[routeNo];
    return sum + (stations ? stations.length : 0);
  }, 0);
};

/**
 * 노선별로 그룹화된 Station 반환 (렌더링용)
 */
RouteManager.prototype.getActiveRouteGroups = function() {
  var self = this;
  var groups = {};
  this.openTabs.forEach(function(routeNo) {
    if (self.routeGroups[routeNo]) {
      groups[routeNo] = self.routeGroups[routeNo];
    }
  });
  return groups;
};
