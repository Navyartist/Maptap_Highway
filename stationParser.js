// ═════════════════════════════════════════════════════════════
// StationParser - 데이터 정제, 정렬, 그룹화 담당
// ═════════════════════════════════════════════════════════════

// 경부선/영동선: 수작업 조사 순서 기준
var ROUTE_ORDER = {
  "001": ["대왕판교","판교","서울","수원신갈","기흥","기흥동탄","오산","남사진위","안성","북천안","천안","독립기념관","청주","남청주","신탄진","대전","옥천","금강","영동","황간","추풍령","김천","동김천","구미","남구미","왜관","칠곡물류","북대구","경산","영천","서경주","경주","활천","서울산","통도사","양산","노포","부산"],
  "050": ["군자","서안산","안산","군포","동군포","부곡","북수원","동수원","마성","용인","양지","덕평","이천","여주","문막","원주","새말","둔내","면온","평창","속사","진부","대관령"],
};

// 남해선 순천 구간 교정 순서
var NAMHAE_SUNCHEON = ["남순천","순천만","서순천","순천"];

// 서해안선/중부선/남해선: 위도경도 기준 정렬
var ROUTE_SORT = {
  "015": function(a, b) { return b.lat - a.lat; },
  "035": function(a, b) { return b.lat - a.lat; },
  "010": function(a, b) { return a.lon - b.lon; },
};

/**
 * API 응답 데이터를 Station 객체 배열로 변환
 * null 좌표 필터링 + 노선별 정렬 포함
 * @param {Object} apiResp - API 응답 원본 ({ list: [...] })
 * @returns {Array} Station 객체 배열
 */
export function parseStations(apiResp) {
  // 1) raw 데이터를 Station 객체로 변환 + null 필터링
  var stations = apiResp.list
    .filter(function(d) {
      var bad = d.xValue == null || d.yValue == null || d.xValue === '' || d.yValue === '';
      if (bad) console.warn('좌표 없는 영업소 제외:', d.unitName, d.routeName);
      return !bad;
    })
    .map(function(d) {
      return {
        name:      d.unitName,
        code:      d.unitCode.trim(),
        routeNo:   d.routeNo,
        routeName: d.routeName,
        lon:       parseFloat(d.xValue),
        lat:       parseFloat(d.yValue),
      };
    })
    .filter(function(s) {
      return !isNaN(s.lon) && !isNaN(s.lat);
    });

  // 2) 노선별로 그룹화
  var grouped = {};
  stations.forEach(function(s) {
    if (!grouped[s.routeNo]) grouped[s.routeNo] = [];
    grouped[s.routeNo].push(s);
  });

  // 3) 각 노선별로 정렬 로직 적용
  var result = [];
  Object.keys(grouped).forEach(function(routeNo) {
    var group = grouped[routeNo];

    if (ROUTE_ORDER[routeNo]) {
      // 수작업 순서 기준 정렬
      var orderMap = {};
      ROUTE_ORDER[routeNo].forEach(function(name, i) { orderMap[name] = i; });
      group.sort(function(a, b) {
        var ia = orderMap[a.name] !== undefined ? orderMap[a.name] : 9999;
        var ib = orderMap[b.name] !== undefined ? orderMap[b.name] : 9999;
        return ia - ib;
      });

    } else if (routeNo === "010") {
      // 남해선: 위도경도 정렬 후 순천 구간 교정
      group.sort(ROUTE_SORT["010"]);

      var suncheonMap = {};
      NAMHAE_SUNCHEON.forEach(function(name, i) { suncheonMap[name] = i; });
      var suncheon = group.filter(function(s) { return suncheonMap[s.name] !== undefined; });
      var others   = group.filter(function(s) { return suncheonMap[s.name] === undefined; });
      suncheon.sort(function(a, b) { return suncheonMap[a.name] - suncheonMap[b.name]; });

      var insertAt = others.findIndex(function(s) { return s.name === "광양"; });
      if (insertAt === -1) insertAt = others.length;
      group = others.slice(0, insertAt).concat(suncheon).concat(others.slice(insertAt));

    } else {
      // 서해안선/중부선: 위도경도 정렬
      var sortFn = ROUTE_SORT[routeNo];
      if (sortFn) group.sort(sortFn);
    }

    result = result.concat(group);
  });

  return result;
}

/**
 * Station 배열을 노선별로 그룹화
 * @param {Array} stations - parseStations()의 결과
 * @returns {Object} { "001": [Station, ...], "015": [...], ... }
 */
export function groupByRoute(stations) {
  var acc = {};
  stations.forEach(function(s) {
    if (!acc[s.routeNo]) acc[s.routeNo] = [];
    acc[s.routeNo].push(s);
  });
  return acc;
}
