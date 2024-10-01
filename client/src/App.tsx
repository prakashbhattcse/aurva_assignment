import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';

const initialNodes = [{ id: '1', data: { label: 'Explore' }, position: { x: 250, y: 50 } }];
const initialEdges = [];

const App: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [mealDetails, setMealDetails] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCategories = async () => {
    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/categories.php');
    return response.data.categories.slice(0, 5);
  };

  const fetchMeals = async (category: string) => {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    return response.data.meals.slice(0, 5);
  };

  const fetchMealDetails = async (id: string) => {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    return response.data.meals[0];
  };

  const handleExploreClick = async () => {
    const categories = await fetchCategories();
    const categoryNodes = categories.map((cat, index) => ({
      id: `cat-${index}`,
      data: { label: cat.strCategory },
      position: { x: 250, y: 100 + index * 50 },
    }));
    
    setNodes((nds) => nds.concat(categoryNodes));
  };

  const handleCategoryClick = (category: string) => {
    const viewMealsId = `view-meals-${category}`;
    const viewMealsNode = {
      id: viewMealsId,
      data: { label: 'View Meals' },
      position: { x: 450, y: 100 },
    };

    setNodes((nds) => nds.concat(viewMealsNode));
  };

  const handleViewMealsClick = async (category: string) => {
    const meals = await fetchMeals(category);
    const mealNodes = meals.map((meal, index) => ({
      id: `meal-${meal.idMeal}`,
      data: { label: meal.strMeal },
      position: { x: 650, y: 100 + index * 50 },
    }));

    setNodes((nds) => nds.concat(mealNodes));
    setEdges((eds) => addEdge({ source: `cat-${category}`, target: `view-meals-${category}`, animated: true }, eds));
  };

  const handleMealClick = async (mealId: string) => {
    const details = await fetchMealDetails(mealId);
    const mealOptions = [
      {
        id: `view-details-${mealId}`,
        data: { label: 'View Details' },
        position: { x: 800, y: 100 },
      },
      {
        id: `view-ingredients-${mealId}`,
        data: { label: 'View Ingredients' },
        position: { x: 800, y: 150 },
      },
      {
        id: `view-tags-${mealId}`,
        data: { label: 'View Tags' },
        position: { x: 800, y: 200 },
      },
    ];

    setNodes((nds) => nds.concat(mealOptions));
  };

  const handleOptionClick = async (optionId: string, mealId: string) => {
    if (optionId.startsWith('view-details-')) {
      const details = await fetchMealDetails(mealId);
      setMealDetails(details);
      setSidebarOpen(true);
    } 
    // Handle view ingredients and view tags options here if needed
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setMealDetails(null);
  };

  const handleNodeClick = (event: any, node: any) => {
    if (node.id === '1') {
      handleExploreClick();
    } else if (node.id.startsWith('cat-')) {
      const category = node.data.label;
      handleCategoryClick(category);
    } else if (node.id.startsWith('view-meals-')) {
      const category = node.id.split('-')[2];
      handleViewMealsClick(category);
    } else if (node.id.startsWith('meal-')) {
      handleMealClick(node.id.split('-')[1]);
    } else if (node.id.startsWith('view-details-') || node.id.startsWith('view-ingredients-') || node.id.startsWith('view-tags-')) {
      const mealId = node.id.split('-')[2];
      handleOptionClick(node.id, mealId);
    }
  };

  return (
    <div className="flex">
      <div className="w-full h-screen">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      {sidebarOpen && mealDetails && (
        <div className="fixed right-0 top-0 w-1/3 h-full bg-white shadow-lg p-4 overflow-auto">
          <h2 className="text-xl font-bold">{mealDetails.strMeal}</h2>
          <button onClick={closeSidebar} className="text-red-500">Close</button>
          <h3 className="mt-4">Instructions:</h3>
          <p>{mealDetails.strInstructions}</p>
        </div>
      )}
    </div>
  );
};

export default App;
