const { spawn } = require('child_process');
const http = require('http');

const testUrls = [
  'https://marcuscaiado.github.io/sky-ace-1944/',
  'https://marcuscaiado.github.io/flappy-cyber-droid/',
  'https://marcuscaiado.github.io/neon-tetris-3d/',
  'https://marcuscaiado.github.io/cute-mini-golf/'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const port = 9260 + Math.floor(Math.random() * 30);
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--disable-gpu',
      '--no-sandbox',
      url
    ]);

    setTimeout(() => {
      http.get(`http://localhost:${port}/json`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tabs = JSON.parse(data);
            const pageTab = tabs.find(t => t.type === 'page');
            if (!pageTab) {
              chrome.kill();
              return resolve({ url, success: false, error: 'No page tab' });
            }
            const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
            ws.onopen = () => {
              ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: { expression: 'typeof window.ArcadeDifficulty !== "undefined" ? ArcadeDifficulty.getMultiplier(1000, 2000) : null' }
              }));
            };
            ws.onmessage = (msg) => {
              const res = JSON.parse(msg.data);
              if (res.id === 1) {
                chrome.kill();
                resolve({ url, success: true, ddaVal: res.result.result.value });
              }
            };
            ws.onerror = (e) => {
              chrome.kill();
              resolve({ url, success: false, error: e.message });
            };
          } catch (err) {
            chrome.kill();
            resolve({ url, success: false, error: err.message });
          }
        });
      }).on('error', (e) => {
        chrome.kill();
        resolve({ url, success: false, error: e.message });
      });
    }, 2800);
  });
}

(async () => {
  console.log('Testing live deployment DDA runtime evaluation...');
  for (const url of testUrls) {
    const r = await testUrl(url);
    console.log(`${r.url} -> success: ${r.success} | ddaVal: ${r.ddaVal}${r.error ? ' | err: ' + r.error : ''}`);
  }
})();
