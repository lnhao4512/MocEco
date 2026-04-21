"""
train_model.py - MucEcoPure Acne Classifier
Dataset: train/ valid/ test/  (5 classes: Blackheads, Cyst, Papules, Pustules, Whiteheads)
Architecture: Transfer Learning voi MobileNetV2 (do chinh xac cao hon CNN thuan)
"""

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
)
import os

# ─── CAU HINH ─────────────────────────────────────────────────────────────────
TRAIN_DIR  = './train'
VALID_DIR  = './valid'
TEST_DIR   = './test'
MODEL_OUT  = './models/skin_analysis_v3.keras'
IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
EPOCHS     = 30  # EarlyStopping se dung truoc neu model hoi tu

os.makedirs('./models', exist_ok=True)

# ─── DATA AUGMENTATION ────────────────────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

valid_gen = val_datagen.flow_from_directory(
    VALID_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

NUM_CLASSES = train_gen.num_classes
CLASS_NAMES = list(train_gen.class_indices.keys())
print(f"\n✅ Tim thay {NUM_CLASSES} lop: {CLASS_NAMES}")
print(f"   Train: {train_gen.samples} anh | Valid: {valid_gen.samples} anh\n")

# ─── XAY DUNG MO HINH (Transfer Learning: MobileNetV2) ───────────────────────
base_model = MobileNetV2(
    input_shape=(*IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Giai dong 100 lop cuoi de fine-tune
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.3)(x)
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ─── CALLBACKS ────────────────────────────────────────────────────────────────
callbacks = [
    EarlyStopping(
        monitor='val_accuracy',
        patience=6,
        restore_best_weights=True,
        verbose=1
    ),
    ModelCheckpoint(
        MODEL_OUT,
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

# ─── HUAN LUYEN ───────────────────────────────────────────────────────────────
print("\n🚀 Bat dau huan luyen...\n")
history = model.fit(
    train_gen,
    epochs=EPOCHS,
    validation_data=valid_gen,
    callbacks=callbacks
)

# ─── DANH GIA TREN TEST SET ───────────────────────────────────────────────────
if os.path.exists(TEST_DIR):
    test_gen = val_datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    test_loss, test_acc = model.evaluate(test_gen, verbose=1)
    print(f"\n🎯 Test Accuracy: {test_acc*100:.2f}%")

# ─── LUU VA IN KET QUA ────────────────────────────────────────────────────────
print(f"\n✅ Mo hinh da luu tai: {MODEL_OUT}")
print("\n📋 Class mapping (dung cho predict.py):")
for name, idx in train_gen.class_indices.items():
    print(f"   {idx}: '{name}'")
