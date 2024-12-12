import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Adminlogin from './pages/adminlogin/Adminlogin';
import Admindashboard from './pages/admindashboard/Admindashboard';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/adminlogin' element={<Adminlogin />} />
        <Route path='/admindashboard' element={<Admindashboard />} />
      </Routes>
    </div>
  );
}

export default App;
