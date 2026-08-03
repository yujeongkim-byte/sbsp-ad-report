const { getReportStore, KEY, emptyAllData, mergeRecords, checkSecret, json } = require('./_shared');

// 요청 바디: { secret, batches: [ { adType:'SB'|'SP', keyword:[...], searchterm:[...] }, ... ] }
// 한 번의 업로드에 SB/SP가 섞여 있어도 반드시 이 함수 안에서 한 번의 읽기-수정-쓰기로 전부 처리한다.
// (SB/SP를 별도 요청 두 개로 동시에 보내면, 서로 다른 요청이 같은 데이터를 동시에 읽고 쓰면서
//  한쪽 결과가 다른 쪽에 덮여 사라지는 경합(race condition)이 생길 수 있어서 반드시 하나로 합쳐야 한다.)
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

  // 이전 버전(adType 하나만 보내는 방식) 요청도 계속 동작하도록 batches 형태로 정규화한다.
  const batches = Array.isArray(payload.batches) ? payload.batches
    : (payload.adType ? [{ adType: payload.adType, keyword: payload.keyword, searchterm: payload.searchterm }] : []);

  for(const b of batches){
    if(b.adType !== 'SB' && b.adType !== 'SP'){
      return json(400, { error: "adType은 'SB' 또는 'SP'여야 합니다" });
    }
  }
  if(!batches.length){
    return json(400, { error: '업로드할 데이터가 없습니다' });
  }

  try{
    const store = getReportStore(event);
    const existing = (await store.get(KEY, { type: 'json' })) || emptyAllData();

    for(const b of batches){
      existing[b.adType].keyword = mergeRecords(existing[b.adType].keyword, b.keyword || [], 'keyword');
      existing[b.adType].searchterm = mergeRecords(existing[b.adType].searchterm, b.searchterm || [], 'searchterm');
    }

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
