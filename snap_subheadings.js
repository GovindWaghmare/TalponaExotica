const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9370',
    '--window-size=1440,900',
    'http://127.0.0.1:8080/Index.html'
  ], { stdio: 'ignore' });

  let page;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9370/json');
      const list = await res.json();
      if (Array.isArray(list)) {
        page = list.find(t => t.type === 'page');
        if (page) break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const call = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === cur) {
        ws.removeEventListener('message', h);
        resolve(m.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => setTimeout(r, 1000));

  const targets = [
    { sel: '#about-resort', file: 'subheading-about.png' },
    { sel: '#facilities', file: 'subheading-facilities.png' },
    { sel: '.video-section', file: 'subheading-video.png' },
    { sel: '#dining', file: 'subheading-dining.png' },
    { sel: '#faq', file: 'subheading-faq.png' },
    { sel: '.final-cta-section', file: 'subheading-cta.png' }
  ];

  for (const t of targets) {
    await call('Runtime.evaluate', {
      expression: 'document.querySelector(\"' + t.sel + '\").scrollIntoView({ block: \"start\", behavior: \"instant\" });'
    });
    await new Promise(r => setTimeout(r, 500));
    const shot = await call('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: 1440, height: 420, scale: 1 }
    });
    fs.writeFileSync('/Users/cybercreative/.gemini/antigravity/brain/7b502e5d-e0ad-452e-a583-2a7893e1340a/' + t.file, Buffer.from(shot.data, 'base64'));
    console.log('Saved ' + t.file);
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

main();
