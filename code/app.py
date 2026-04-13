import gradio as gr
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import numpy as np

# Load the trained model
model = load_model("skin_model.keras")

# Class labels
class_labels = ['Acne', 'Oily Skin', 'Dry Skin', 'Hyperpigmentation/Discoloration', 'Normal Skin']

def predict_skin_condition(image):
    """Process the uploaded image and predict the skin condition."""
    try:
        # Resize to match model's input size of (150, 150)
        image = image.resize((150, 150))  
        img_array = img_to_array(image) / 255.0  # Normalize image
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        predictions = model.predict(img_array)
        predicted_class = class_labels[np.argmax(predictions)]
        confidence = np.max(predictions) * 100
        return f"{predicted_class} ({confidence:.2f}% confidence)"
    except Exception as e:
        return f"Error processing image: {e}"

def clear_input():
    """Clear the input field."""
    return None, ""

# Define the Gradio Interface
def create_interface():
    with gr.Blocks(css=""" 
        #uploaded_image label {color: white; font-weight: bold;}
        #output label {color: white; font-weight: bold;}
        .drop-image-here {color: hotpink; font-weight: bold;}
        .click-to-upload {color: hotpink; font-weight: bold;}
        """) as demo:
        gr.Markdown("""<h1 style='color: hotpink; text-align: center;'>Skin Condition Classification</h1>
        <p style='color: #555; text-align: center;'>Upload a face image, and the model will predict the skin condition.</p>""")

        with gr.Row():
            with gr.Column():
                uploaded_image = gr.Image(label="uploaded_image", type="pil", elem_id="uploaded_image")
                clear_button = gr.Button("Clear", elem_id="clear_button")
                submit_button = gr.Button("Submit", elem_id="submit_button")

            with gr.Column():
                output = gr.Textbox(label="output", elem_id="output")
                flag_button = gr.Button("Flag", elem_id="flag_button")

        submit_button.click(predict_skin_condition, inputs=[uploaded_image], outputs=[output])
        clear_button.click(clear_input, inputs=[], outputs=[uploaded_image, output])

    return demo

# Launch the interface
if __name__ == "__main__":
    demo = create_interface()
    demo.launch()
