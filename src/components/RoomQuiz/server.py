from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import os
import joblib
import random

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

def load_model():
    model_path = './linear_regression_model.joblib'
    
    # Check if model file exists
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Please ensure the model file is in the correct location.")
    
    try:
        # Load the scikit-learn pipeline
        model = joblib.load(model_path)
        return model
    except Exception as e:
        raise Exception(f"Error loading model: {str(e)}")

# Initialize model as None
model = None

@app.route('/api/predict-budget', methods=['POST'])
def predict_budget():
    global model
    
    try:
        # Load the model if not already loaded
        if model is None:
            try:
                model = load_model()
            except Exception as e:
                # If model loading fails, return a dummy prediction for testing
                print(f"Warning: Using dummy model due to loading error: {str(e)}")
                return jsonify({
                    'estimatedBudget': 500000,  # Dummy value for testing
                    'warning': 'Using test mode: Model not loaded'
                })

        # Get the data from the POST request
        data = request.get_json()
        print("Received data:", data)

        # Validate required fields
        required_fields = ['bedrooms', 'sqft', 'price', 'toilets', 'locality', 
                         'renovation', 'age', 'quality']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Map input data keys to training data column names
        mapped_data = {
            'Bedrooms': int(data['bedrooms']),
            'Sqft Area': float(data['sqft']),
            'Price per Sqft (INR)': float(data['price']),
            'Toilets': int(data['toilets']),
            'House Age (years)': int(data['age']),
            'Locality': data['locality'],  # Keep as string for the pipeline
            'Renovation Type': data['renovation'].lower(),  # Normalize to lowercase for the pipeline
            'Material Quality': data['quality'].lower(),
            'Energy Efficiency Rating': random.randint(1, 5)  # Add a random energy efficiency rating
        }

        # Convert the mapped data to a DataFrame
        input_df = pd.DataFrame([mapped_data])

        # Use the model's pipeline for prediction
        prediction = model.predict(input_df)
        print("Prediction:", prediction)

        return jsonify({'estimatedBudget': np.ceil(float(prediction[0]*0.3))})

    except Exception as e:
        print("Error:", e)
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    
    # Try to load the model at startup
    try:
        model = load_model()
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Warning: Could not load model at startup: {str(e)}")
        print("Server will run in test mode with dummy predictions")
    
    app.run(debug=True, port = 5003)