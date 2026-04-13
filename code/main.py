import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint

# Define constants
DATA_DIR = "data"  # Path to the 'data' folder
MODEL_SAVE_PATH = "skin_model.keras"
IMG_HEIGHT = 150
IMG_WIDTH = 150
BATCH_SIZE = 32
CLASSES = ['sample_acne', 'sample_hyperpigmentation', 'sample_dry', 'sample_oily', 'sample_normal']

# Load and preprocess the data
def load_data():
    datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=0.2  # 80-20 train-validation split
    )

    train_generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        classes=CLASSES
    )

    val_generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        classes=CLASSES
    )

    return train_generator, val_generator

# Build the CNN model
def build_model():
    model = Sequential([
        tf.keras.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
        Conv2D(32, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),

        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(len(CLASSES), activation='softmax')
    ])

    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

# Train the model
def train_model():
    train_generator, val_generator = load_data()
    model = build_model()

    checkpoint = ModelCheckpoint(
        MODEL_SAVE_PATH, monitor='val_accuracy', save_best_only=True, verbose=1
    )

    history = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=20,
        callbacks=[checkpoint],
        verbose=1
    )

    print("Training complete. Best model saved at", MODEL_SAVE_PATH)

    # Plot model performance
    plot_model_performance(history)

# Plot model performance
def plot_model_performance(history):
    plt.figure(figsize=(10, 5))

    # Accuracy Plot
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy', color='hotpink')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy', color='black')
    plt.title('Model Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()

    # Loss Plot
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss', color='hotpink')
    plt.plot(history.history['val_loss'], label='Validation Loss', color='black')
    plt.title('Model Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.show()

# Run the training
train_model()
