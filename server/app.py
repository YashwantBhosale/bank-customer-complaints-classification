from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
import numpy as np
import joblib
import bcrypt
import jwt
import datetime
import os
from flask_cors import CORS
import re
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
import string

ps = PorterStemmer()
stop_words = set(stopwords.words("english"))


def clean_text(text):
    text = text.lower()
    text = re.sub(r"\[.*?]", "", text)
    url = re.compile(r"https?://\S+|www.\.\S+")
    text = url.sub(r"", text)
    text = re.sub(r"<.*?>+", "", text)
    text = re.sub(r"[%s]" % re.escape(string.punctuation), "", text)
    text = re.sub(r"\w*\d\w*", "", text)
    return text


def stem_text(text):
    text = [ps.stem(word) for word in text.split() if word not in stop_words]
    return " ".join(text)


SECRET_KEY = "thequickbrownfoxjumpsoverthelazydog"
client = MongoClient(
    "mongodb+srv://yashwantbhosale07:MhlUoNi0hCeArHSG@cluster0.uoqen.mongodb.net/"
)

# Load pre-fitted vectorizer
vectorizer = joblib.load("vectorizer.pkl")
app = Flask(__name__)
CORS(app)

# Load the trained model
model = joblib.load("logistic_model.pkl")


@app.route("/", methods=["GET"])
def home():
    return "<h1>Welcome to the Bank Complaints Classification API</h1>"


@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json(force=True)
        db = client["bank-complaints"]
        collection = db["users"]

        user = collection.find_one({"email": data["email"]})
        if user:
            return jsonify({"error": "User already exists"}), 400

        # Hash the password with bcrypt
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), salt)

        user = {
            "username": data["username"],
            "password": hashed_password,
            "email": data["email"],
            "role": "user",
            "created_at": pd.Timestamp.now(),
        }

        collection.insert_one(user)
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        db = client["bank-complaints"]
        collection = db["users"]

        user = collection.find_one({"email": data["email"]})
        if user is None:
            return jsonify({"error": "User not found"}), 404

        hashed_password = user["password"]

        if bcrypt.checkpw(data["password"].encode("utf-8"), hashed_password):
            payload = {
                "user_id": str(user["_id"]),  # Convert ObjectId to string
                "role": user["role"],
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(hours=1),  # Expiration time
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "user": {
                            "username": user["username"],
                            "email": user["email"],
                            "role": user["role"],
                        },
                        "token": token,
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Invalid password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/adminlogin", methods=["POST"])
def adminlogin():
    try:
        data = request.get_json(force=True)
        db = client["bank-complaints"]
        collection = db["users"]

        user = collection.find_one({"email": data["email"]})
        if user is None:
            return jsonify({"error": "User not found"}), 404

        hashed_password = user["password"]

        if bcrypt.checkpw(data["password"].encode("utf-8"), hashed_password):
            if user["role"] != "admin":
                return jsonify({"error": "Unauthorized"}), 403

            payload = {
                "user_id": str(user["_id"]),  # Convert ObjectId to string
                "role": user["role"],
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(hours=1),  # Expiration time
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "user": {
                            "username": user["username"],
                            "email": user["email"],
                            "role": user["role"],
                        },
                        "token": token,
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Invalid password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get-data", methods=["GET"])
def get_data():
    try:
        db = client["bank-complaints"]
        collection = db["complaints"]
        users_collection = db["users"]  # Ensure this is initialized

        data = list(collection.find())

        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "No token provided"}), 401

        try:
            # Decode and validate the JWT
            decoded_token = jwt.decode(
                token.split(" ")[1], SECRET_KEY, algorithms=["HS256"]
            )
            user = users_collection.find_one(
                {"_id": ObjectId(decoded_token["user_id"])}
            )
            if not user:
                return jsonify({"error": "User not found"}), 404
            if user["role"] != "admin":
                return jsonify({"error": "Unauthorized"}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Convert ObjectId to string for JSON serialization
        for complaint in data:
            complaint["_id"] = str(complaint["_id"])

        for complaint in data:
            # This could raise an issue if the user_id is not valid
            user = users_collection.find_one({"_id": ObjectId(complaint["user_id"])})
            if user:
                complaint["username"] = user.get("username", user["email"])

        return jsonify(data), 200

    except Exception as e:
        # Log the error for debugging
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)  # Ensure JSON format
        data_unseen = pd.DataFrame([data])

        # Ensure that 'text' exists in the incoming data
        if "text" not in data_unseen.columns:
            return jsonify({"error": "No text field found in input"}), 400

        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "No token provided"}), 401

        db = client["bank-complaints"]
        collection = db["complaints"]
        users_collection = db["users"]

        # Decode and validate the JWT
        try:
            decoded_token = jwt.decode(
                token.split(" ")[1], SECRET_KEY, algorithms=["HS256"]
            )
            user = users_collection.find_one(
                {"_id": ObjectId(decoded_token["user_id"])}
            )
            if not user:
                return jsonify({"error": "User not found"}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        # Clean and preprocess the text
        raw_text = data_unseen["text"].iloc[0]
        cleaned_text = clean_text(raw_text)   # Apply regex cleaning
        stemmed_text = stem_text(cleaned_text)  # Apply stemming

        # Vectorize the processed text
        vectorized_data = vectorizer.transform([stemmed_text])
        prediction = model.predict(vectorized_data)
        prediction = prediction[0]

        # Create a complaint record
        complaint = {
            "user_id": str(user["_id"]),  # Convert ObjectId to string
            "text": raw_text,
            "processed_text": stemmed_text,
            "prediction": prediction,
            "createdAt": pd.Timestamp.now(),
        }

        # Insert into MongoDB
        collection.insert_one(complaint)
        print(f"Inserted complaint with prediction: {prediction}")

        return jsonify({"prediction": prediction}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
