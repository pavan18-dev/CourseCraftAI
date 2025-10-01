// frontend/src/pages/CourseDetail.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReactFlow, { 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    addEdge 
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { useCourseFlow } from '../hooks/useCourseFlow'; 

// --- Custom Node Component ---
const CustomCourseNode = ({ data, id }) => {
    const isCompleted = data.isCompleted;
    const buttonText = isCompleted ? "Completed 🎉" : "Mark Complete";
    // Change node color based on status
    const statusColor = isCompleted ? '#10B981' : '#4F46E5'; 
    const statusClass = isCompleted ? "bg-green-50 border-green-500" : "bg-white border-indigo-400";

    return (
        <div 
            className={`p-3 shadow-lg rounded-lg border-2 w-full h-full 
                       hover:shadow-xl transition-shadow`}
            style={{ borderColor: statusColor }}
        >
            <div className="font-bold" style={{ color: statusColor }}>{data.label}</div>
            <div className="text-xs text-gray-600 truncate">{data.description}</div>
            <div className="text-xs mt-1 mb-2 text-teal-600 font-medium">
                Resources: {data.resources.length}
            </div>

            {/* Completion Button */}
            <button
                onClick={() => data.onComplete(data.module_id)} // Call the injected handler
                disabled={isCompleted}
                className={`mt-1 w-full text-white font-bold py-1 px-2 text-sm rounded 
                            ${isCompleted ? 'bg-green-500 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {buttonText}
            </button>
        </div>
    );
};

const nodeTypes = {
    default: CustomCourseNode,
    input: CustomCourseNode,
};


const CourseDetail = () => {
    const { courseId } = useParams();
    const { token, isLoggedIn } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // --- Helper function to re-fetch course data after an update ---
    const fetchCourse = useCallback(async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCourse(response.data);
        } catch (err) {
            console.error("Failed to fetch course detail:", err);
            setError("Could not load course details.");
        } finally {
            setLoading(false);
        }
    }, [courseId, token]);

    // --- NEW: Handler for marking a module complete ---
    const handleModuleComplete = useCallback(async (moduleId) => {
        try {
            await axios.patch(
                `http://127.0.0.1:8000/api/courses/${courseId}/complete/${moduleId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // On success, re-fetch data to update the UI
            await fetchCourse(); 
        } catch (err) {
            console.error("Failed to mark module as complete:", err.response?.data || err.message);
            setError("Failed to update module status.");
        }
    }, [courseId, token, fetchCourse]);


    // --- 1. Initial Data Fetch ---
    useEffect(() => {
        if (isLoggedIn && courseId) {
            fetchCourse();
        }
    }, [isLoggedIn, courseId, fetchCourse]);

    // --- 2. React Flow State Initialization and Hook Usage ---
    // Get the flow elements using the hook and inject the handler
    const getFlowElements = useCourseFlow(course);
    const { nodes: initialNodes, edges: initialEdges } = getFlowElements(handleModuleComplete);
    
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    // Update React Flow nodes/edges when course data is loaded/updated
    useEffect(() => {
        if (course) {
            const { nodes: updatedNodes, edges: updatedEdges } = getFlowElements(handleModuleComplete);
            setNodes(updatedNodes);
            setEdges(updatedEdges);
        }
    }, [course, getFlowElements, setNodes, setEdges, handleModuleComplete]);


    if (loading) return <div className="p-8 text-center text-xl">Loading AI Roadmap...</div>;
    if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;

    // --- 3. Render the Visualization ---
    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto mb-6">
                <h1 className="text-4xl font-extrabold text-indigo-700">{course.title}</h1>
                <p className="text-lg text-gray-600">Drag, scroll, and zoom to explore your personalized learning path.</p>
            </div>

            <div className="w-full h-[70vh] border rounded-xl shadow-2xl bg-white">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView 
                >
                    <Controls />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>

            {/* Optional: Simple list view for resource details */}
            <div className="mt-8 p-4 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Module Details (Resources)</h2>
                {course.modules.map(module => (
                    <div key={module.id} className="mb-4 p-4 border rounded-md">
                        <h3 className="font-semibold">{module.title}</h3>
                        <ul className="text-sm list-disc pl-5">
                            {module.resources.map(res => (
                                <li key={res.url}><a href={res.url} target="_blank" className="text-blue-600 hover:underline">{res.title}</a> ({res.type})</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseDetail;