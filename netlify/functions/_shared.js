const { getStore, connectLambda } = require('@netlify/blobs');

const STORE_NAME = 'sbsp-report';
const KEY = 'allData';

function emptyAllData(){
  return { SB: { keyword: [], searchterm: [] }, SP: { keyword: [], searchterm: [] } };
}

// 이 함수들은 옛 AWS Lambda 방식 핸들러 형태(exports.handler = (event, context) => ...)를 쓰고 있어서,
// Netlify가 Blobs 접속 정보(siteID/token)를 자동으로 넣어주지 않는다. 그래서 getStore를 부르기 전에
// connectLambda(event)를 먼저 호출해 수동으로 연결해줘야 한다. (Netlify Blobs "Lambda 호환 모드" 요구사항)
function getReportStore(event){
  connectLambda(event);
  return getStore(STORE_NAME);
}

// 같은 (광고유형, 날짜, 캠페인, 광고그룹, 키워드, 매치타입[, 검색어]) 조합을 하나의 레코드로 보고,
// 새로 업로드된 데이터가 기존 값을 덮어써서 누적/갱신되도록 한다.
// 프론트엔드(app.js)의 recordKey/mergeRecords와 반드시 동일한 규칙을 유지해야 한다.
function recordKey(r, type){
  return type === 'keyword'
    ? [r.adType, r.dateKey, r.campaign, r.adgroup, r.keyword, r.matchType].join('␟')
    : [r.adType, r.dateKey, r.campaign, r.adgroup, r.keyword, r.matchType, r.searchTerm].join('␟');
}

function mergeRecords(existing, incoming, type){
  const map = new Map();
  (existing || []).forEach(r => map.set(recordKey(r, type), r));
  (incoming || []).forEach(r => map.set(recordKey(r, type), r));
  return [...map.values()];
}

function checkSecret(payload){
  const secret = process.env.UPLOAD_SECRET || '';
  return !!secret && payload && payload.secret === secret;
}

function json(statusCode, obj){
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(obj),
  };
}

module.exports = { getReportStore, KEY, emptyAllData, recordKey, mergeRecords, checkSecret, json };
