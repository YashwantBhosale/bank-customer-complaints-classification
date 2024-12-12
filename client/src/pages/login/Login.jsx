import React, { useState } from "react";
import styles from "./login.module.css";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;
const Login = () => {
    const {user, dispatch} = useAuthContext();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if(user)
        return <Navigate to="/dashboard" />
        

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleLogin = async () => {
        try {
            setLoading(true);
            
            let response = await fetch(`${BASE_URL}login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                let data = await response.json();
                localStorage.setItem("token", data.token);
                dispatch({type: "LOGIN", payload: data.user
                })
                navigate('/dashboard');
                console.log(data);
            }
            else {
                throw new Error("Login failed");
            }


        }catch(err) {
            setError(err.message);
        }

    }

    return (
		<div className={styles.loginContainer}>
			<div className={styles.main}>
				<h2>Welcome to Bank Complaints classification portal</h2>
				<div className={styles.login}>
					<input type="text" name="email" placeholder="email" value={formData.email} onChange={handleChange} />
					<input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                    {error && <p className={styles.errmsg}>{error}</p>}
					<button onClick={handleLogin}>Login</button>
                    <p>Don't have an account?</p> <a onClick={() => navigate('/signup')}>Register</a>
				</div>
			</div>
		</div>
	);
};

export default Login;
