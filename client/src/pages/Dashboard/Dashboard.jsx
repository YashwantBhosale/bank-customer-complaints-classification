import React, { useState } from "react";
import styles from "./dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
	const { user, dispatch } = useAuthContext();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		text: "",
	});
	const [result, setResult] = useState("");

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handle_submit = async (e) => {
		e.preventDefault();
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				navigate("/login");
			}
			e.preventDefault();
			let response = await fetch(`${BASE_URL}predict`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				let data = await response.json();
				setResult(data.prediction);
				console.log(data);
			} else {
				throw new Error("Complaint submission failed");
			}
		} catch (e) {
			console.log(e);
		}
	};

    return (
        <div className={styles.dashboardContainer}>
            <button className={styles.logoutButton} onClick={() =>{
                localStorage.removeItem("token");
                dispatch({type: "LOGOUT"});
                navigate("/login");
            }}>LOGOUT</button>
            <h4 className={styles.welcomeMessage}>Welcome Back User!</h4>

            <h3 className={styles.formHeading}>Submit Your Complaint</h3>
            <form className={styles.complaintForm} onSubmit={handle_submit}>
                <textarea
                    style={{ maxWidth: "100%", resize: "vertical" }}
                    placeholder="Complaint Description"
                    className={styles.textArea}
                    name="text"
                    onChange={handleChange}
                    value={formData.text}
                ></textarea>
                <button className={styles.submitButton}>Submit</button>
            </form>
            {result && (
                <div className={styles.result_div}>
                    <b>Your complaint is likely to be classified under: </b>
                    <p className={styles.result}>{result}</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
