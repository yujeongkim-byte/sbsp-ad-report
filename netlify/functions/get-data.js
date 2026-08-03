const { getReportStore, KEY, emptyAllData, json } = require('./_shared');

exports.handler = async function(event){
  if(event.httpMethod !== 'GET'){
    return json(405, { error: 'GET만 지원합니다' });
  }
  try{
    const store = getReportStore();
    const data = await store.get(KEY, { type: 'json' });
    return json(200, data || emptyAllData());
  }catch(err){
    console.error(err);
    return json(500, { error: '데이터를 불러오지 못했습니다: ' + err.message });
  }
};
