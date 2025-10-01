import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import CourseRoadmap from "./CourseRoadmap";
import "./App.css";

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [hours, setHours] = useState("");
  const [preference, setPreference] = useState("Mixed (video + text)");
  const [plan, setPlan] = useState("");

  const generatePlan = async () => {
    try {
      const response = await axios.post("http://localhost:5000/generate-plan", {
        name,
        email,
        skills,
        goal,
        level,
        hours,
        preference,
      });
      setPlan(response.data.plan);
    } catch (error) {
      console.error("Error generating plan:", error);
    }
  };

  return (
    <div className="app-container">
      <motion.h1
        className="title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🚀 CourseCraftAI
      </motion.h1>
      <p className="subtitle">AI-powered personalized learning paths ✨</p>

      {/* Input Form */}
      <div className="form-container">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Skills you know (e.g. Python, Java)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <input
          type="text"
          placeholder="Your Goal (e.g. Developer, Data Scientist)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>

        <input
          type="number"
          placeholder="Hours per week"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />

        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
        >
          <option>Video</option>
          <option>Text</option>
          <option>Mixed (video + text)</option>
        </select>

        <button onClick={generatePlan}>✨ Generate Course Plan</button>
      </div>

      {/* Generated Plan */}
      {plan && (
        <motion.div
          className="generated-plan"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>📖 Generated Course Plan</h2>
          <p>{plan}</p>
          <CourseRoadmap outline={plan} />
        </motion.div>
      )}
    </div>
  );
}
