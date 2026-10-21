async function executeAutoSolve() {
  const captchaImg = document.querySelector('img[src*="captcha"], img[alt*="captcha"], img[id*="captcha"]');
  const captchaInput = document.querySelector('input[type="text"][name*="captcha"], input[id*="captcha"]');

  if (!captchaImg || !captchaInput) return;

  const canvas = document.createElement('canvas');
  canvas.width = captchaImg.width || captchaImg.naturalWidth;
  canvas.height = captchaImg.height || captchaImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(captchaImg, 0, 0);
  const base64Image = canvas.toDataURL('image/jpeg');

  const formData = new FormData();
  formData.append('base64Image', base64Image);
  formData.append('apikey', 'helloworld'); // Public test key
  formData.append('isOverlayRequired', 'false');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  try {
    const response = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
    const data = await response.json();

    if (data.IsErroredOnProcessing || !data.ParsedResults || data.ParsedResults.length === 0) return;

    const solvedText = data.ParsedResults[0].ParsedText.replace(/\s/g, '').trim();
    if (!solvedText) return;

    captchaInput.value = solvedText;
    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (e) {
    console.error("OCR Fetch failed", e);
  }
}

// Run 800ms after page load to ensure the image has rendered
setTimeout(executeAutoSolve, 800);
