import React, { useState } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background } from 'reactflow';
import axios from 'axios';
import { FaUtensils, FaList, FaInfoCircle, FaTag, FaYoutube } from 'react-icons/fa';
import 'reactflow/dist/style.css';
import './App.css';
import { v4 as uuidv4 } from 'uuid'; 

const initialNodes = [
  { id: '1', data: { label: 'Explore', icon: <FaUtensils className="text-blue-600" /> }, position: { x: 250, y: 50 } }
];
const initialEdges: any[] | (() => any[]) = [];

const App: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [mealDetails, setMealDetails] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

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
    const categoryNodes = categories.map((cat: { strCategory: any; }, index: number) => ({
      id: `cat-${index}`,
      data: { label: cat.strCategory, icon: <FaList className="text-green-600" /> },
      position: { x: 250, y: 100 + index * 50 },
    }));

    setNodes((nds) => nds.concat(categoryNodes));
  };

  const handleCategoryClick = (category: string) => {
    const viewMealsId = `view-meals-${category}`;
    const viewMealsNode = {
      id: viewMealsId,
      data: { label: 'View Meals', icon: <FaList className="text-purple-600" /> },
      position: { x: 450, y: 100 },
    };

    setNodes((nds) => nds.concat(viewMealsNode));
  };

  const handleViewMealsClick = async (category: string) => {
    const meals = await fetchMeals(category);
    const mealNodes = meals.map((meal: { idMeal: any; strMeal: any; }, index: number) => ({
      id: `meal-${meal.idMeal}`,
      data: { label: meal.strMeal, icon: <FaUtensils className="text-orange-600" /> },
      position: { x: 650, y: 100 + index * 50 },
    }));

    setNodes((nds) => nds.concat(mealNodes));
    setEdges((eds) => 
      addEdge(
        {
          id: uuidv4(), // Generate a unique ID for the edge
          source: `cat-${category}`, 
          target: `view-meals-${category}`, 
          animated: true 
        }, 
        eds
      )
    );
  };

  const handleMealClick = async (mealId: string) => {
    const mealOptions = [
      {
        id: `view-details-${mealId}`,
        data: { label: 'View Details', icon: <FaInfoCircle className="text-teal-600" /> },
        position: { x: 800, y: 150 }, // Add gap here
      },
      {
        id: `view-ingredients-${mealId}`,
        data: { label: 'View Ingredients', icon: <FaList className="text-pink-600" /> },
        position: { x: 800, y: 200 }, // Add gap here
      },
      {
        id: `view-tags-${mealId}`,
        data: { label: 'View Tags', icon: <FaTag className="text-red-600" /> },
        position: { x: 800, y: 250 }, // Add gap here
      },
    ];

    setNodes((nds) => nds.concat(mealOptions));
  };

  const handleOptionClick = async (optionId: string, mealId: string) => {
    if (optionId.startsWith('view-details-')) {
      const details = await fetchMealDetails(mealId);
      setMealDetails(details);
      setSidebarOpen(true);
      setShowTags(false);
      setShowIngredients(false);
    } else if (optionId.startsWith('view-tags-')) {
      setShowTags(true);
      setShowIngredients(false);
    } else if (optionId.startsWith('view-ingredients-')) {
      setShowIngredients(true);
      setShowTags(false);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setMealDetails(null);
    setShowTags(false);
    setShowIngredients(false);
  };

  const handleNodeClick = (_event: any, node: any) => {
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
          nodes={nodes.map(node => ({
            ...node,
            style: {
              border: '2px solid skyblue', // Border color for nodes
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '10px',
              gap: "10px",
              textOverflow: "ellipsis",
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              maxWidth: '400px', // Set a maximum width
              height: '40px', // Set a maximum height
              overflow: 'hidden', // Hide overflow content
            },
          }))}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          className="rounded-lg shadow-md border border-gray-300"
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      {sidebarOpen && mealDetails && (
        <div className="fixed right-0 top-0 w-1/3 h-full bg-white shadow-lg p-10 overflow-auto border-l border-gray-300">
          <h2 className="text-2xl font-bold text-gray-800 pb-2">{mealDetails.strMeal}</h2>
          <img src={mealDetails.strMealThumb} alt={mealDetails.strMeal} className="w-full h-auto mb-4 rounded-[10%]" />
          <a 
            href={`https://www.youtube.com/embed/${mealDetails.strYoutube.split('v=')[1]}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center bg-red-600 text-white p-2 rounded hover:bg-red-700 mb-4"
          >
            <FaYoutube className="mr-2" /> {/* YouTube icon */}
            Youtube Link
          </a>
          <button onClick={closeSidebar} className="absolute top-0 right-0 bg-red-500 text-white z-10 rounded px-4 mt-2 mr-2 py-2 hover:bg-red-600">Close</button>
          <h3 className="mt-6 text-lg font-semibold text-gray-700">Instructions:</h3>
          <p className="mt-2 text-gray-600">{mealDetails.strInstructions}</p>

          {/* Show tags as buttons if showTags is true */}
          {showTags && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-gray-700">Tags:</h4>
              <div className="flex flex-wrap mt-2">
                {mealDetails.strTags.split(',').map((tag: string, index: React.Key | null | undefined) => (
                  <button key={index} className="bg-blue-500 text-white rounded-full px-4 py-1 m-1">
                    {tag.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show ingredients as buttons if showIngredients is true */}
          {showIngredients && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-gray-700">Ingredients:</h4>
              <div className="flex flex-wrap mt-2">
                {Array.from({ length: 20 }, (_, i) => {
                  const ingredient = mealDetails[`strIngredient${i + 1}`];
                  return ingredient ? (
                    <button key={i} className="bg-green-500 text-white rounded-full px-4 py-1 m-1">
                      {ingredient}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
