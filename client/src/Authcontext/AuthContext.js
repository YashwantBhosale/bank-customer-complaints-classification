import { createContext, useReducer, useEffect } from "react";

const AuthContext = createContext();

const BASE_URL = "http://localhost:5000/";

const initialState = {
    user : null,
    loading: false,
}

const reducer = (state, action) => {
    switch(action.type) {
        case "LOGIN":
            return {
                ...state,
                user: action.payload,
            }
        case "LOGOUT":
            return {
                ...state,
                user: null,
            }
        default:
            return state;
    }
}

const AuthProvider = ({children}) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if(token) {
           localStorage.removeItem("token");
           dispatch({
            type: "LOGOUT"
           })
        }
    }, [])

    return (
        <AuthContext.Provider value={{state, dispatch}}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext, AuthProvider };