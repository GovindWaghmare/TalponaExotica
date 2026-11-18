const { spawn } = require('child_process');
const fs = require('fs');

async function testSlides() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9330',
    '--window-size=1440,900',
    'http://127.0.0.1:8080/Index.html'
  ]);

  let page;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9330/json');
      const targets = await res.json();
      page = targets.find(t => t.type === 'page');
      if (page) break;
    } catch(e) {}
    await new Promise(r => setTimeout(r, 400));
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const call = (method, params = {}) => new Promise((resolve) => {
    const cur = id++;
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === cur) { ws.removeEventListener('message', h); resolve(m.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => setTimeout(r, 1200));

  for (let slideIdx = 0; slideIdx < 4; slideIdx++) {
    await call('Runtime.evaluate', {
      expression: `
        const dots = document.querySelectorAll('.slider-dot');
        if (dots[${slideIdx}]) dots[${slideIdx}].click();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot = await call('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: 1440, height: 750, scale: 1 }
    });
    fs.writeFileSync(
      `/Users/cybercreative/.gemini/antigravity/brain/7b502e5d-e0ad-452e-a583-2a7893e1340a/hero-slide-${slideIdx + 1}.png`,
      Buffer.from(shot.data, 'base64')
    );
    console.log(`Saved hero-slide-${slideIdx + 1}.png`);
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

testSlides();
