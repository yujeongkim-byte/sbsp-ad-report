const { getReportStore, KEY, emptyAllData, mergeRecords, checkSecret, json } = require('./_shared');

// 요청 바디: { secret, adType: 'SB'|'SP', keyword: [...이번에 새로 업로드된 키워드 레코드], searchterm: [...] }
// 전체 누적 데이터가 아니라 "이번에 새로 읽은 분"만 보내면, 서버가 기존 데이터와 병합한다.
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
    return json(401, { error: '업로드 비밀번호가 올바르지 않습니다. Netlify 환경변수 UPLOAD_SECRET 설정을 확인해주세요.' });
  }

  const adType = payload.adType;
  if(adType !== 'SB' && adType !== 'SP'){
    return json(400, { error: "adType은 'SB' 또는 'SP'여야 합니다" });
  }

  try{
    const store = getReportStore(event);
    const existing = (await store.get(KEY, { type: 'json' })) || emptyAllData();

    existing[adType].keyword = mergeRecords(existing[adType].keyword, payload.keyword || [], 'keyword');
    existing[adType].searchterm = mergeRecords(existing[adType].searchterm, payload.searchterm || [], 'searchterm');

    await store.setJSON(KEY, existing);

    return json(200, {
      ok: true,
      counts: {
        SB: { keyword: existing.SB.keyword.length, searchterm: existing.SB.searchterm.length },
        SP: { keyword: existing.SP.keyword.length, searchterm: existing.SP.searchterm.length },
      },
    });
  }catch(err){
    console.error(err);
    return json(500, { error: '저장 중 오류가 발생했습니다: ' + err.message });
  }
};
