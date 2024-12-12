import React, { useState } from "react";
import styles from "./signup.module.css";
import { useNavigate } from "react-router-dom";

const BASE_URL = 'https://bank-complaint-classification-backend-1.onrender.com/';

const Signup = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSignup = async () => {
		try {
			setLoading(true);

			let response = await fetch(`${BASE_URL}signup`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				let data = await response.json();
				localStorage.setItem("token", data.token);
				console.log(data);
			} else {
				throw new Error("Signup failed");
			}
		} catch (err) {
			setError(err.message);
			setTimeout(() => {
				setError("");
			}, 3000);
		}
	};

	return (
		<div className={styles.signupContainer}>
			<div className={styles.main}>
				<h2>Welcome to Bank Complaints classification portal</h2>
				<div className={styles.signup}>
					<h2>SIGNUP</h2>
					<input
						type="text"
						name="username"
						placeholder="username"
						value={formData.username}
						onChange={handleChange}
					/>
					<input
						type="text"
						name="email"
						placeholder="email"
						value={formData.email}
						onChange={handleChange}
					/>
					<input
						type="password"
						name="password"
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
					/>
					{error && <p className={styles.errmsg}>{error}</p>}
					<button onClick={handleSignup}>Signup</button>
					<p>Already have an account?</p>{" "}
					<a onClick={() => navigate("/login")}>Login</a>
				</div>
			</div>
		</div>
	);
};

export default Signup;
