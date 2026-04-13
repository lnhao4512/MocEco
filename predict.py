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

# Tắt các thông báo log không cần thiết của TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def predict(img_base64):
    try:
        # 1. Load mô hình (Nên dùng caching nếu chạy thực tế lâu dài, nhưng ở đây dùng chạy đơn)
        model_path = './models/skin_analysis_v3.keras'
        if not os.path.exists(model_path):
            return {"success": False, "message": "Model file not found"}
        
        model = load_model(model_path)
        
        # 2. Giải mã ảnh từ Base64
        if 'base64,' in img_base64:
            img_base64 = img_base64.split('base64,')[1]
        
        img_data = base64.b64decode(img_base64)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img = img.resize((224, 224))
        
        # 3. Tiền xử lý
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = x / 255.0
        
        # 4. Dự đoán
        predictions = model.predict(x)
        class_indices = {
            "acne": 0,
            "dry": 1,
            "hyperpigmentation": 2,
            "normal": 3,
            "oily": 4
        }
        # Lưu ý: Mapping này phải khớp với lúc train. 
        # Train script mặc định sắp xếp theo bảng chữ cái: 
        # (acne, dry, hyperpigmentation, normal, oily)
        # 0: acne, 1: dry, 2: hyperpigmentation, 3: normal, 4: oily
        
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        
        # Mapping ngược lại nhãn
        labels = ["acne", "dry", "hyperpigmentation", "normal", "oily"]
        label = labels[predicted_class_idx]
        
        # Trả về kết quả
        return {
            "success": True,
            "prediction": label,
            "confidence": confidence,
            "scores": {labels[i]: float(predictions[0][i]) for i in range(len(labels))}
        }
        
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    # Đọc dữ liệu từ stdin vì base64 image rất dài, không thể truyền qua argument
    img_data = sys.stdin.read()
    if not img_data:
        print(json.dumps({"success": False, "message": "No data received via stdin"}))
    else:
        result = predict(img_data)
        print(json.dumps(result))
