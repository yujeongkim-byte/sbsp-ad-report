const { getReportStore, KEY, emptyAllData, checkSecret, json } = require('./_shared');

// 누적된 전체 데이터를 완전히 삭제한다. 모든 사람이 보는 공유 데이터이므로 업로드와 같은
// 비밀번호로 보호하고, 프론트엔드에서도 반드시 한 번 더 확인(confirm)을 받은 뒤 호출해야 한다.
exports.handler = async function(event){
  if(event.httpMethod !== 'POST'){
    return json(405, { error: 'POST만 지원합니다' });
  }

  let payload;
  try{
    payload = JSON.parse(event.body || '{}');
  }catch(err){
    return json(400, { error: '잘못된 요청 형식입니다 (JSON 파싱 실패)' });
  }

  if(!checkSecret(payload)){
    return json(401, { error: '비밀번호가 올바르지 않습니다' });
  }

  try{
    const store = getReportStore(event);
    await store.setJSON(KEY, emptyAllData());
    return json(200, { ok: true });
  }catch(err){
    console.error(err);
    return json(500, { error: '초기화 중 오류가 발생했습니다: ' + err.message });
  }
};
