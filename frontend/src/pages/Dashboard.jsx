import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
// 💡 IMPORTANT FIX: axios import is removed. apiClient is used for all network calls.
import apiClient from '../apiClient'; 
import { useAuth } from '../context/AuthContext'; 
// NEW IMPORTS for Dark Mode and Deletion Icon
import { useTheme } from '../context/ThemeContext'; 
import { SunIcon, MoonIcon, XCircleIcon } from '@heroicons/react/24/outline'; 

const Dashboard = () => {
    // 1. Authentication and State Management
    const { isLoggedIn, token, logout } = useAuth();
    const { theme, toggleTheme } = useTheme(); 
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Redirect unauthenticated users
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    // --- Course Fetching Logic (FIXED: Uses apiClient) ---
    const fetchCourses = async () => {
        // The token check is redundant here because apiClient handles token injection,
        // but it remains a good safety check.
        if (!token) return; 

        try {
            // FIX: Replaced axios.get(...) with apiClient.get('/api/courses/my')
            // apiClient automatically uses the VITE_API_URL and adds the Authorization header.
            const response = await apiClient.get('/api/courses/my'); 
            setCourses(response.data);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
            setError("Failed to load your courses. Please try logging in again.");
            if (err.response && err.response.status === 401) {
                 logout(); 
            }
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------------------

    // NEW: Deletion Handler (FIXED: Uses apiClient)
    const handleDelete = async (courseId, courseTitle) => {
        if (!window.confirm(`Are you sure you want to delete the course: "${courseTitle}"? This cannot be undone.`)) {
            return;
        }
        
        try {
            // FIX: Replaced axios.delete(...) with apiClient.delete(...)
            await apiClient.delete(`/api/courses/${courseId}`); 
            
            // Optimistically update UI
            setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
            console.log(`Course ${courseId} deleted.`);

        } catch (err) {
            console.error("Failed to delete course:", err);
            alert("Failed to delete course. Please check your network or token.");
        }
    };

    // 2. Data Fetching Effect
    useEffect(() => {
        // fetchCourses relies on token being present, which is checked in the function itself.
        fetchCourses(); 
        // NOTE: If fetchCourses relied on 'logout' to trigger, it should be in the dependency array. 
        // However, since logout redirects, relying only on [token] is typically sufficient.
    }, [token]); 

    // 3. Render Logic (Unchanged UI/UX)
    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="max-w-6xl mx-auto">
                {/* Header, Logout, and Theme Toggle */}
                <header className="flex justify-between items-center pb-6 border-b border-gray-200 dark:border-gray-700 mb-8">
                    <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">
                        CourseCraft AI Dashboard 🚀
                    </h1>
                    
                    <div className="flex space-x-4 items-center">
                        {/* THEME TOGGLE BUTTON */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:scale-105 transition"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                        </button>

                        <button 
                            onClick={logout} 
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Card 1: Generate New Plan */}
                    <Link 
                        to="/generate" 
                        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-indigo-500 transform hover:scale-[1.02] dark:text-gray-100"
                    >
                        <h2 className="text-2xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">✨ Generate New Plan</h2>
                        <p className="text-gray-500 dark:text-gray-400">Define your skills and goals to create a fresh, personalized roadmap.</p>
                    </Link>

                    {/* Card 2: My Saved Courses List */}
                    <div className="lg:col-span-2 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-teal-500 dark:text-gray-100">
                        <h2 className="text-2xl font-bold mb-6 text-teal-700 dark:text-teal-400">📚 My Saved Courses</h2>
                        
                        {loading && <p className="text-gray-600 dark:text-gray-400">Loading your courses...</p>}
                        
                        {error && <p className="text-red-500 font-semibold">{error}</p>}
                        
                        {!loading && !error && courses.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400">You haven't generated any courses yet. Get started now!</p>
                        )}
                        
                        <div className="space-y-4">
                            {!loading && courses.map(course => (
                                <div 
                                    key={course.id} 
                                    className="p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md transition-colors flex justify-between items-center border border-gray-200 dark:border-gray-600"
                                >
                                    <Link 
                                        to={`/course/${course.id}`} 
                                        className="flex-grow flex flex-col sm:flex-row sm:items-center dark:text-gray-100"
                                    >
                                        <span className="text-lg font-medium mr-4">{course.course_title}</span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                                                    ${course.is_completed ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white'}`}>
                                            {course.is_completed ? 'Completed 🎉' : 'In Progress'}
                                        </span>
                                    </Link>
                                    
                                    {/* DELETE BUTTON (Step 10.1) */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent Link navigation
                                            handleDelete(course.id, course.course_title);
                                        }}
                                        title="Delete Course"
                                        className="text-red-500 hover:text-red-400 ml-4 p-1 rounded-full hover:bg-red-900/10 dark:hover:bg-red-500/10 transition"
                                    >
                                         <XCircleIcon className="h-6 w-6" /> 
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;