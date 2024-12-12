import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import styles from './adminlogin.module.css'
import { useAuthContext } from "../../hooks/useAuthContext";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Adminlogin = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { user, dispatch } = useAuthContext();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        try{
            let response = await fetch(`${BASE_URL}adminlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if(response.ok){
                let data = await response.json();
                localStorage.setItem("token", data.token);
                dispatch({type: "LOGIN", payload: data.user});
                navigate("/admindashboard");
            }else{
                throw new Error("Login failed");
            }
        }catch(e) {
            setError(e.message);
            setTimeout(() => {
                setError("");
            }, 3000);
        }
    }


	return (
		<div className={styles.loginContainer}>
			<div className={styles.main}>
				<h2>Welcome to Bank Complaints classification portal</h2>
                <h3>Admin Login</h3>
				<div className={styles.login}>
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
					<button onClick={handleLogin}>Login</button>
					<p>Not an admin?</p>{" "}
					<a onClick={() => navigate("/login")}>Login</a>
				</div>
			</div>
		</div>
	);
};

export default Adminlogin;
