const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function sendToBackend(blob) {
  const formData = new FormData();
  formData.append("image", blob, "frame.jpg");

  const res = await fetch("http://localhost:5000/detect", {
    method: "POST",
    body: formData
  });
  return await res.json();
}

function drawBoxes(detections) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  detections.forEach(det => {
    const [x1, y1, x2, y2] = det.box;
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillStyle = "lime";
    ctx.font = "16px Arial";
    ctx.fillText(`${det.class} (${Math.round(det.confidence * 100)}%)`, x1, y1 - 5);
  });
}

function captureFrame() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(video, 0, 0);

  tempCanvas.toBlob(async blob => {
    const result = await sendToBackend(blob);
    drawBoxes(result.detections);
  }, "image/jpeg");
}

async function main() {
  await setupCamera();
  video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  setInterval(captureFrame, 1000); // capture every second
}

main();
