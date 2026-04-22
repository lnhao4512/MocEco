"""
predict.py - MocEcoPure Acne Type Classifier (TFLite version)
Dung TFLite Runtime thay vi full TensorFlow de tiet kiem RAM (~50MB vs ~400MB).
Cho phep chay duoc tren Render Free Tier (512MB RAM).

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
import io
from PIL import Image

# ─── LOAD TFLITE INTERPRETER ────────────────────────────────────────────
# Uu tien tflite_runtime (nhe), fallback sang tf.lite neu can
try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter
    except ImportError:
        import tensorflow as tf
        Interpreter = tf.lite.Interpreter

# ─── CLASS MAPPING (khop voi thu tu alphabet cua train/) ─────────────────────
# Blackheads=0, Cyst=1, Papules=2, Pustules=3, Whiteheads=4
LABELS = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

# Muc do nghiem trong
SEVERITY_MAP = {
    'Blackheads': 'nhe',       # Mun dau den - de dieu tri
    'Whiteheads': 'nhe',       # Mun dau trang - de dieu tri
    'Papules':    'trung binh', # Mun san - co viem nhe
    'Pustules':   'trung binh', # Mun mu - co viem, co mu
    'Cyst':       'nang'        # U nang - viem sau, kho dieu tri
}

# Acne score goi y (0-100) - dung truc tiep tu model, khong can cong thuc
ACNE_SCORE_HINT = {
    'Blackheads': 15,
    'Whiteheads': 18,
    'Papules':    45,
    'Pustules':   55,
    'Cyst':       80
}

# Texture score goi y theo loai mun
TEXTURE_SCORE_HINT = {
    'Blackheads': 25,   # Da sam, lo chan long to
    'Whiteheads': 20,   # Da co nhan trang nho
    'Papules':    40,   # Da san sui viem
    'Pustules':   50,   # Da co mu, be mat khong deu
    'Cyst':       60    # Da viem sau, be mat bien dang
}

# Pores score goi y
PORES_SCORE_HINT = {
    'Blackheads': 50,   # Lo chan long bi tac
    'Whiteheads': 35,   # Lo chan long bit kin
    'Papules':    30,   # Lo chan long viem
    'Pustules':   35,   # Lo chan long co mu
    'Cyst':       25    # Viem sau, khong lien quan lo chan long
}


def predict(img_base64):
    try:
        # Tim model TFLite truoc, fallback sang Keras
        tflite_path = './models/skin_analysis_v3.tflite'
        keras_path = './models/skin_analysis_v3.keras'
        
        if not os.path.exists(tflite_path):
            if not os.path.exists(keras_path):
                return {"success": False, "message": "Model file not found"}
            # Fallback: dung full TF neu chi co .keras
            return _predict_keras(img_base64, keras_path)

        # ─── TFLITE INFERENCE (NHE, NHANH) ──────────────────────────────
        interpreter = Interpreter(model_path=tflite_path)
        interpreter.allocate_tensors()
        
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Giai ma Base64
        if 'base64,' in img_base64:
            img_base64 = img_base64.split('base64,')[1]

        img_data = base64.b64decode(img_base64)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img = img.resize((224, 224))

        # Tien xu ly (phai khop voi rescale=1./255 luc train)
        x = np.array(img, dtype=np.float32) / 255.0
        x = np.expand_dims(x, axis=0)

        # Du doan
        interpreter.set_tensor(input_details[0]['index'], x)
        interpreter.invoke()
        preds = interpreter.get_tensor(output_details[0]['index'])

        idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][idx])
        label = LABELS[idx]

        return {
            "success": True,
            "prediction": label,
            "confidence": confidence,
            "severity": SEVERITY_MAP.get(label, 'trung binh'),
            "acne_score_hint": ACNE_SCORE_HINT.get(label, 30),
            "texture_score_hint": TEXTURE_SCORE_HINT.get(label, 25),
            "pores_score_hint": PORES_SCORE_HINT.get(label, 30),
            "scores": {LABELS[i]: float(preds[0][i]) for i in range(len(LABELS))}
        }

    except Exception as e:
        return {"success": False, "message": str(e)}


def _predict_keras(img_base64, model_path):
    """Fallback: dung full TensorFlow khi khong co .tflite"""
    try:
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
        import tensorflow as tf
        tf.get_logger().setLevel('ERROR')
        
        model = tf.keras.models.load_model(model_path)

        if 'base64,' in img_base64:
            img_base64 = img_base64.split('base64,')[1]

        img_data = base64.b64decode(img_base64)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img = img.resize((224, 224))

        x = np.array(img, dtype=np.float32) / 255.0
        x = np.expand_dims(x, axis=0)

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
            "texture_score_hint": TEXTURE_SCORE_HINT.get(label, 25),
            "pores_score_hint": PORES_SCORE_HINT.get(label, 30),
            "scores": {LABELS[i]: float(preds[0][i]) for i in range(len(LABELS))}
        }
    except Exception as e:
        return {"success": False, "message": "Keras fallback error: " + str(e)}


if __name__ == "__main__":
    img_data = sys.stdin.read().strip()
    if not img_data:
        print(json.dumps({"success": False, "message": "No input data via stdin"}))
    else:
        result = predict(img_data)
        print(json.dumps(result))
