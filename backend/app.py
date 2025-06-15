from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

# Load the model
model = YOLO("yolov8n.pt")  # You can replace with a custom model

@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    image_data = image_file.read()
    np_img = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    results = model(img)[0]

    detections = []
    for box in results.boxes:
        cls = model.names[int(box.cls[0])]
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        detections.append({
            "class": cls,
            "confidence": round(conf, 2),
            "box": [x1, y1, x2, y2]
        })

    return jsonify({"detections": detections})

if __name__ == "__main__":
    app.run(debug=True)
