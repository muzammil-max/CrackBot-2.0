const http = require('http');

http.createServer((_, r) => r.end('ok')).listen(7860, () => {
  console.log('HF port ok');
});

setInterval(() => {
  http.get('http://localhost:7860', (res) => {
    console.log('Self-ping:', res.statusCode);
  }).on('error', (e) => console.error('Ping error:', e.message));
}, 4 * 60 * 1000);