// ═════════════════════════════════════════════════════════════
// DataLoader - 데이터 소스와의 통신 담당
// ═════════════════════════════════════════════════════════════

/**
 * 로컬 JSON 파일 또는 외부 API로부터 raw 데이터를 로드
 * @returns {Promise<Object>} API 응답 원본 데이터
 */
export function fetchRawData() {
  return fetch('./data.json')
    .then(function(response) {
      if (!response.ok) {
        throw new Error('데이터 로드 실패: ' + response.status);
      }
      return response.json();
    });
}

// 향후 외부 API 연동 시 사용할 함수 (현재 비활성화)
export function fetchFromAPI(apiBase, apiKey, totalPages) {
  var requests = [];
  
  for (var page = 1; page <= totalPages; page++) {
    var url = apiBase
      + '?key=' + apiKey
      + '&type=json'
      + '&numOfRows=100'
      + '&pageNo=' + page;
    
    requests.push(
      fetch(url).then(function(res) { return res.json(); })
    );
  }
  
  return Promise.all(requests).then(function(results) {
    var combined = [];
    results.forEach(function(r) {
      if (r.list) {
        combined = combined.concat(r.list);
      }
    });
    return { list: combined };
  });
}
