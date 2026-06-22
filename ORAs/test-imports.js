async function run() {
  try {
    const jsLang = await import('highlight.js/lib/languages/javascript');
    console.log('jsLang keys:', Object.keys(jsLang), typeof jsLang.default);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
