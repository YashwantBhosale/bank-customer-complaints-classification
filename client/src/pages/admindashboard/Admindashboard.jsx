import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import { Navigate, useNavigate } from "react-router-dom";

const BASE_URL = "https://bank-complaint-classification-backend-1.onrender.com/";

const Admindashboard = () => {
    const {user, dispatch} = useAuthContext();
	const [complaintsData, setComplaintsData] = useState([]);
    const [classifications, setClassifications] = useState({
        'credit_card': [],
        'credit_reporting': [],
        'debt_collection': [],
        'mortgages_and_loans': [],
        'retail_banking': [],
    });
    const [recentComplaints, setRecentComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

	const fetchData = async () => {
		try {
			const response = await fetch(`${BASE_URL}get-data`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setComplaintsData(data);
				setLoading(false);
			}
		} catch (err) {
			console.log(err);
		}
	};

    const classifyData = async (data) => {
        const classifiedData = {
            'credit_card': [],
            'credit_reporting': [],
            'debt_collection': [],
            'mortgages_and_loans': [],
            'retail_banking': [],
        };

        for (const complaint of data) {
            const classification = complaint.prediction;
            classifiedData[classification].push(complaint);
        }

        setClassifications(classifiedData);

    }

    const getRecentComplaints = async (data) => {
        const recentComplaints =[];
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        recentComplaints.push(...data.slice(0, 5));
        setRecentComplaints(recentComplaints);
    }

    useEffect(() => {
        if(user && user.role !== 'admin') {
            dispatch({type: 'LOGOUT'});
        }

        fetchData();
    }, []);

    useEffect(() => {
        if (complaintsData.length > 0) {
            classifyData(complaintsData);
            getRecentComplaints(complaintsData);
        }
        console.log(complaintsData);
    }, [complaintsData]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        dispatch({type: 'LOGOUT'});
        navigate('/adminlogin');
    }

	return <div>
        <h1>admin dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
        {recentComplaints && recentComplaints.length > 0 && (
            <div>
                <h2>Recent complaints</h2>
                <ul>
                    {recentComplaints.map((complaint, index) => (
                        <li key={index}>
                            {index+1}. {complaint.text} - {complaint.prediction}
                        </li>
                    ))}
                </ul>
            </div>
        )}
        {classifications && (
            <div>
                <h2>Classifications</h2>
                <ul>
                    {Object.keys(classifications).map((key, index) => (
                        <li key={index}>
                            {key} - {classifications[key].length}
                        </li>
                    ))}
                </ul>
            </div>
        )}


    </div>;
};

export default Admindashboard;
