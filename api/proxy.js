// Vercel Serverless Function - 공공데이터 API 프록시
// API 키는 Vercel 환경변수에서 가져옴 (PHARMA_API_KEY)

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint 파라미터가 필요합니다.' });
  }

  // 허용된 엔드포인트만 통과 (보안)
  const ALLOWED = [
    '/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07',
    '/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnDtlInq06',
    '/1471000/MdcBioEqInfoService01/getMdcBioEqList01',
  ];

  if (!ALLOWED.includes(endpoint)) {
    return res.status(403).json({ error: '허용되지 않은 엔드포인트입니다.' });
  }

  // API 키 주입 (환경변수)
  const API_KEY = process.env.PHARMA_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  // 쿼리스트링 조합
  const qs = new URLSearchParams({
    serviceKey: API_KEY,
    type: 'json',
    ...params,
  }).toString();

  const targetUrl = `https://apis.data.go.kr${endpoint}?${qs}`;

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();

    // XML 응답이 오면 그대로 전달
    if (text.trim().startsWith('<')) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(text);
    }

    // JSON 파싱 후 전달
    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(text);
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
