import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import os

# 1. Cấu hình đường dẫn và thông số
DATA_DIR = './data'
IMG_WIDTH, IMG_HEIGHT = 224, 224
BATCH_SIZE = 32
EPOCHS = 20

# 2. Chuẩn bị dữ liệu (Data Augmentation)
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2, # Chia 20% cho validation
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

train_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_WIDTH, IMG_HEIGHT),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

validation_generator = datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_WIDTH, IMG_HEIGHT),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# 3. Xây dựng mô hình CNN
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_WIDTH, IMG_HEIGHT, 3)),
    MaxPooling2D(2, 2),
    
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(train_generator.num_classes, activation='softmax') # Đầu ra dựa trên số lượng thư mục trong data/
])

# 4. Compile mô hình
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 5. Huấn luyện mô hình
print("Dang bat dau huan luyen mo hinh voi du lieu tai:", DATA_DIR)
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator
)

# 6. Lưu mô hình
if not os.path.exists('./models'):
    os.makedirs('./models')

model_path = './models/skin_analysis_v3.keras'
model.save(model_path)
print(f"Da huan luyen xong! Mo hinh duoc luu tai: {model_path}")

# Hiển thị mapping các lớp để dùng cho backend
print("\nMapping class:")
for label, index in train_generator.class_indices.items():
    print(f" - {label}: {index}")
