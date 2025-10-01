// frontend/src/hooks/useCourseFlow.js

import { useCallback } from 'react';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 120; // Increased height to fit the button
const Y_SPACING = 50;

/**
 * Converts the flat list of modules into React Flow nodes and edges.
 */
export const useCourseFlow = (course) => {

    const getFlowElements = useCallback((onCompleteHandler) => {
        if (!course || !course.modules || course.modules.length === 0) {
            return { nodes: [], edges: [] };
        }

        const nodes = [];
        const edges = [];
        let previousNodeId = null;
        let yPos = 0;

        course.modules.forEach((module, index) => {
            const nodeId = module.id;
            const isFirstModule = index === 0;

            // 1. Create Node (Module)
            nodes.push({
                id: nodeId,
                position: { x: 0, y: yPos }, 
                data: { 
                    label: `Week ${module.week}: ${module.title}`, 
                    description: module.description,
                    resources: module.resources,
                    isCompleted: module.is_completed, // 💡 NEW: Pass completion status
                    onComplete: onCompleteHandler, // 💡 NEW: Pass the handler function
                    module_id: module.id // Pass the actual module ID
                },
                type: isFirstModule ? 'input' : 'default', 
                style: { width: NODE_WIDTH, height: NODE_HEIGHT }
            });

            // 2. Create Edge (Connection)
            if (previousNodeId) {
                edges.push({
                    id: `e-${previousNodeId}-${nodeId}`,
                    source: previousNodeId,
                    target: nodeId,
                    type: 'smoothstep', 
                    animated: !module.is_completed, // Animate only if NOT completed
                    label: module.is_completed ? 'Completed' : 'Next Up',
                    style: { stroke: module.is_completed ? '#10B981' : '#4F46E5', strokeWidth: module.is_completed ? 3 : 2 }
                });
            }

            previousNodeId = nodeId;
            yPos += NODE_HEIGHT + Y_SPACING;
        });

        return { nodes, edges };
    }, [course]);

    return getFlowElements;
};