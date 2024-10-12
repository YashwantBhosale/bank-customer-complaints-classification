from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
import numpy as np
import joblib
import bcrypt
import jwt
import datetime

SECRET_KEY = 'thequickbrownfoxjumpsoverthelazydog'
client = MongoClient('mongodb+srv://yashwantbhosale07:MhlUoNi0hCeArHSG@cluster0.uoqen.mongodb.net/')

# Load pre-fitted vectorizer
vectorizer = joblib.load('vectorizer.pkl')  
app = Flask(__name__)

# Load the trained model
model = joblib.load('model.pkl')

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Welcome to the Bank Complaints API'}), 200

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json(force=True)
        db = client['bank-complaints']
        collection = db['users']
        
        user = collection.find_one({'email': data['email']})
        if user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash the password with bcrypt
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
        
        user = {
            'username': data['username'],
            'password': hashed_password,
            'email': data['email'],
            'created_at': pd.Timestamp.now()
        }
        
        collection.insert_one(user)
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True)
        db = client['bank-complaints']
        collection = db['users']
        
        user = collection.find_one({'email': data['email']})
        if user is None:
            return jsonify({'error': 'User not found'}), 404

        hashed_password = user['password']
        
        if bcrypt.checkpw(data['password'].encode('utf-8'), hashed_password):
            payload = {
                'user_id': str(user['_id']),  # Convert ObjectId to string
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Expiration time
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            return jsonify({'message': 'Login successful', 'token': token}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)  # Ensure JSON format
        data_unseen = pd.DataFrame([data])
        
        # Ensure that 'text' exists in the incoming data
        if 'text' not in data_unseen.columns:
            return jsonify({'error': 'No text field found in input'}), 400
        
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        db = client['bank-complaints']
        collection = db['complaints']
        users_collection = db['users']
        
        # Decode and validate the JWT
        try:
            decoded_token = jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms=['HS256'])
            user = users_collection.find_one({'_id': ObjectId(decoded_token['user_id'])})
            if not user:
                return jsonify({'error': 'User not found'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Vectorize the input text
        vectorized_data = vectorizer.transform(data_unseen['text'])
        prediction = model.predict(vectorized_data)
        prediction = prediction[0]
        
        # Create a complaint record
        complaint = {
            'user_id': str(user['_id']),  # Convert ObjectId to string
            'text': data['text'],
            'prediction': prediction
        }
        
        # Insert into MongoDB
        collection.insert_one(complaint)
        print(f"Inserted complaint with prediction: {prediction}")
        
        return jsonify({'prediction': prediction}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-data', methods=['GET'])
def get_data():
    try:
        db = client['bank-complaints']
        collection = db['complaints']
        data = list(collection.find())
        
        # Convert the ObjectId to a string for JSON serialization
        for complaint in data:
            complaint['_id'] = str(complaint['_id'])
        
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
