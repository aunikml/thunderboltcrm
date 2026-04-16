import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounts/change-password/', { new_password: password });
            alert("Password updated! Please login again.");
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            alert("Error updating password.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-bold mb-4">Security Update</h2>
                <input 
                    type="password" 
                    placeholder="New Password" 
                    className="border p-2 w-full mb-4" 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="bg-green-600 text-white w-full py-2 rounded">Update Password</button>
            </form>
        </div>
    );
};

export default ChangePassword;