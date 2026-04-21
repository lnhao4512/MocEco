"""
predict.py - MocEcoPure Acne Type Classifier
5 Classes (theo thu tu ASCII, khop voi MobileNetV2 da train):
  0: Blackheads (Mun dau den)
  1: Cyst       (U nang)
  2: Papules    (Mun san)
  3: Pustules   (Mun mu)
  4: Whiteheads (Mun dau trang)
"""

import sys
import os
import json
import base64
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import io
from PIL import Image

# ─── OPTIMIZE MEMORY FOR FREE HOSTING (RENDER) ─────────────────────────
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1' # Ép chạy CPU
try:
    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.config.threading.set_inter_op_parallelism_threads(1)
except Exception:
    pass
tf.get_logger().setLevel('ERROR')

# ─── CLASS MAPPING (khop voi thu tu alphabet cua train/) ─────────────────────
# Blackheads=0, Cyst=1, Papules=2, Pustules=3, Whiteheads=4
LABELS = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

# Muc do nghiem trong de mapping vao scoring cua backend
SEVERITY_MAP = {
    'Blackheads': 'nhe',      # Mun dau den - de dieu tri
    'Whiteheads': 'nhe',      # Mun dau trang - de dieu tri
    'Papules':    'trung binh', # Mun san - co viem nhe
    'Pustules':   'trung binh', # Mun mu - co viem, co mu
    'Cyst':       'nang'       # U nang - viem sau, kho dieu tri
}

# Acne score goi y (0-100) de backend dung tinh toan
ACNE_SCORE_HINT = {
    'Blackheads': 15,
    'Whiteheads': 18,
    'Papules':    45,
    'Pustules':   55,
    'Cyst':       80
}

def predict(img_base64):
    try:
        model_path = './models/skin_analysis_v3.keras'
        if not os.path.exists(model_path):
            return {"success": False, "message": "Model file not found at " + model_path}

        model = load_model(model_path)

        # Giai ma Base64
        if 'base64,' in img_base64:
            img_base64 = img_base64.split('base64,')[1]

        img_data = base64.b64decode(img_base64)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img = img.resize((224, 224))

        # Tien xu ly (phai khop voi rescale=1./255 luc train)
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = x / 255.0

        # Du doan
        preds = model.predict(x, verbose=0)
        idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][idx])
        label = LABELS[idx]

        return {
            "success": True,
            "prediction": label,
            "confidence": confidence,
            "severity": SEVERITY_MAP.get(label, 'trung binh'),
            "acne_score_hint": ACNE_SCORE_HINT.get(label, 30),
            "scores": {LABELS[i]: float(preds[0][i]) for i in range(len(LABELS))}
        }

    except Exception as e:
        return {"success": False, "message": str(e)}


if __name__ == "__main__":
    img_data = sys.stdin.read().strip()
    if not img_data:
        print(json.dumps({"success": False, "message": "No input data via stdin"}))
    else:
        result = predict(img_data)
        print(json.dumps(result))
