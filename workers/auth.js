// 访问码数组，每个对象包含码值和过期时间
const ACCESS_CODES = [
  { code: '8FpbQktwX00v4ibfx4Ta', expireAt: Date.parse('2024-12-31') },
  { code: 'XANFp5VBeNfmhkxo7EWr', expireAt: Date.parse('2024-06-30') },
  { code: 'Q0ebZra96sYUnqngAug1', expireAt: Date.parse('2024-06-30') },
  { code: 'tMBp3oGy2HmfWYJ3x8q7', expireAt: Date.parse('2024-06-30') },
  { code: 'L2yvJr1G87mK0jbZ5F4N', expireAt: Date.parse('2024-06-30') },
  { code: 'rzM3uFTG24Tu91Ztrm38', expireAt: Date.parse('2024-06-30') },
  { code: '6nMtqWLtv186T5WmAGKM', expireAt: Date.parse('2024-06-30') },
  { code: 'Pd5xcTsZC5d2wJxiyiAt', expireAt: Date.parse('2024-06-30') },
  { code: 'ER4Efjhzsjnw3ubRoi10', expireAt: Date.parse('2024-06-30') },
  { code: 'f8LHos5dP3LZoRsokw8P', expireAt: Date.parse('2024-06-30') },
  { code: 'f8rAZuJiwbgWhEsXo6RX', expireAt: Date.parse('2024-06-30') },
  { code: 'zvGdaetDa2YwVx0HoBog', expireAt: Date.parse('2024-06-30') },
  { code: 's8yCAEaUHJerFmVPjeLZ', expireAt: Date.parse('2024-06-30') },
  { code: '2eHbqDFMHJZfC3ckF8bD', expireAt: Date.parse('2024-06-30') },
  { code: 'R70P8WBXrM3LDXUEs5YK', expireAt: Date.parse('2024-06-30') },
  { code: 'qz94smC8985M3rbk2Xqa', expireAt: Date.parse('2024-06-30') },
  { code: 'rZk5Tu7nARgMnA7Ge4bT', expireAt: Date.parse('2024-06-30') },
  { code: '4HM98LC8pyA6e3jQaNNT', expireAt: Date.parse('2024-06-30') },
  { code: 'CQ6J4BKu9aCGpBq86gem', expireAt: Date.parse('2024-06-30') },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-docs-domain.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    const { code } = await request.json();
    
    // 查找有效的访问码
    const validCode = ACCESS_CODES.find(item => 
      item.code === code && item.expireAt > Date.now()
    );
    
    if (validCode) {
      return new Response(JSON.stringify({ 
        success: true,
        expireAt: validCode.expireAt 
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Invalid or expired code' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
