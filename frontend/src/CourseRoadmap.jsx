import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Code, Laptop } from "lucide-react";

const CourseRoadmap = ({ outline }) => {
  if (!outline) return null;

  // Split into steps
  const steps = outline.split(/\d\.\s/).filter(step => step.trim());

  const icons = [BookOpen, Code, Laptop];

  return (
    <div className="roadmap-container">
      <h2 className="roadmap-title">📘 Learning Roadmap</h2>
      <div className="roadmap-grid">
        {steps.map((step, index) => {
          const Icon = icons[index % icons.length];
          return (
            <motion.div
              key={index}
              className="roadmap-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Icon size={32} className="roadmap-icon" />
              <p>{step}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseRoadmap;
