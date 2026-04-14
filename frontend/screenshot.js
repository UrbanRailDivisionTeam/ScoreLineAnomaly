const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 设置视口大小
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('正在访问 http://localhost:3001 ...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 60000 });

  // 等待图表渲染
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('正在截图...');
  await page.screenshot({
    path: 'D:/OneDrive/工作资料/00 信息组工作/2026-04-14 校线异常分析/screenshot_spc.png',
    fullPage: true
  });

  console.log('截图已保存!');
  await browser.close();
})();
