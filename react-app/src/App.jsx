import { useState, useEffect } from "react";
import "./App.css";

function App() {

  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  const API_KEY = 'HIE5hqcouLjbEoWB5NRuCY3C2HgM50ZvnhcXVBpA';

  

  const handleSelect = (item) => {
    setSelectedItem(item);
  }

  const handleSubmit = () => {

    const newItem = {
      id: Date.now(),
      name: itemName,
      quantity: quantity,
      category: category
    }

    setItems([...items, newItem]);

    console.log("item added!");
    setItemName("");
    setQuantity("");
    setCategory("");
    setShowForm(false);
  };

   const fetchNutritionData = async (foodName) => {
    setLoadingNutrition(true);
    setNutritionData(null);
    
    try {
      const searchResponse = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&api_key=${API_KEY}`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.foods && searchData.foods.length > 0) {
        const food = searchData.foods[0];
        
        const nutrients = {
          calories: food.foodNutrients.find(n => n.nutrientName === "Energy")?.value || "N/A",
          protein: food.foodNutrients.find(n => n.nutrientName === "Protein")?.value || "N/A",
          carbs: food.foodNutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || "N/A",
          fat: food.foodNutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || "N/A",
          fiber: food.foodNutrients.find(n => n.nutrientName === "Fiber, total dietary")?.value || "N/A",
        };
        
        setNutritionData({
          foodName: food.description,
          nutrients: nutrients,
          servingSize: food.servingSize || 100,
          servingUnit: food.servingSizeUnit || "g"
        });
      } else {
        setNutritionData({ error: "No nutritional data found for this item" });
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
      setNutritionData({ error: "Failed to fetch nutritional data" });
    } finally {
      setLoadingNutrition(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      fetchNutritionData(selectedItem.name);
    } else {
      setNutritionData(null);
    }
  }, [selectedItem]);

if (showForm) {
    return (
      <div className="form-page">
        <h1>Add New Item</h1>
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="itemName">Item Name:</label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Milk, Eggs, Bread"
            />
          </div>
        
        <div className = "form-group">
          <label htmlFor = "quantity">quantity:</label>
          <input
            type = "number"
            id = "quantity"
            value = {quantity}
            onChange = {(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className = "form-group">
          <label htmlFor = "category">category: </label>
          <input
            type = "text"
            id = "category"
            value = {category}
            onChange = {(e) => setCategory(e.target.value)}
          />
        </div>

        <div className = "form-buttons">
            <button onClick = {handleSubmit}>add item!</button>
            <button onClick = {() => setShowForm(false)}>cancel</button>
        </div>
      </div>
    </div>
    );
}


  return (
    <div>
      <h1>stock'd</h1>
      <p>your handy pantry tracker app!</p>
      <button id = "add-item" onClick = {() => setShowForm(true)}>add item</button>
      
      <section id = "pantry">
        <div id = "shelf"> {/* holds all items */}
          <h3>my shelf</h3>
          <ul>
            {items.map((item) => (
              <li 
                key = {item.id}
                onClick = {() => handleSelect(item)}
                className = {selectedItem?.id === item.id ? "selected" : ""}
                style = {{ cursor : "pointer"}}
                >
                  <strong>{item.name}</strong> - Quantity: {item.quantity} - Category: {item.category}
              </li>
            ))}
          </ul>
        </div>
<div id="actions">
  <h3>what would you like to do?</h3>

  {selectedItem ? (
    <div className="action-panel">


      <div className="quantity-editor">
        <p>edit quantity</p>
        <button
          onClick={() => {
            const updated = items.map((i) =>
              i.id === selectedItem.id
                ? { ...i, quantity: Number(i.quantity) - 1 }
                : i
            );
            setItems(updated);

            // update selectedItem reference
            setSelectedItem({
              ...selectedItem,
              quantity: Number(selectedItem.quantity) - 1,
            });
          }}
        >
          –
        </button>

        <input
          type="number"
          value={selectedItem.quantity}
          onChange={(e) => {
            const updated = items.map((i) =>
              i.id === selectedItem.id
                ? { ...i, quantity: e.target.value }
                : i
            );
            setItems(updated);

            setSelectedItem({
              ...selectedItem,
              quantity: e.target.value,
            });
          }}
          style={{ width: "60px", textAlign: "center" }}
        />

        <button
          onClick={() => {
            const updated = items.map((i) =>
              i.id === selectedItem.id
                ? { ...i, quantity: Number(i.quantity) + 1 }
                : i
            );
            setItems(updated);

            setSelectedItem({
              ...selectedItem,
              quantity: Number(selectedItem.quantity) + 1,
            });
          }}
        >
          +
        </button>
      </div>

      <button
        onClick={() => {
          setItems(items.filter((i) => i.id !== selectedItem.id));
          setSelectedItem(null);
        }}
      >
        delete this item
      </button>
    </div>
  ) : (
    <p className="no-selection">select an item from the shelf</p>
  )}
</div>


        <div id="facts">
          <h3>nutritional information</h3>
          {!selectedItem ? (
            <p>Select an item to view nutritional facts</p>
          ) : loadingNutrition ? (
            <p>Loading nutrition data...</p>
          ) : nutritionData?.error ? (
            <div className="item-info">
              <p>{nutritionData.error}</p>
            </div>
          ) : nutritionData ? (
            <div className="item-info nutrition-facts">
              <div className="nutrient-list">
                <div className="nutrient-item">
                  <span className="nutrient-name">Calories: </span>
                  <span className="nutrient-value">{nutritionData.nutrients.calories} kcal</span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-name">Protein: </span>
                  <span className="nutrient-value">{nutritionData.nutrients.protein} g</span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-name">Carbohydrates: </span>
                  <span className="nutrient-value">{nutritionData.nutrients.carbs} g</span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-name">Fat: </span>
                  <span className="nutrient-value">{nutritionData.nutrients.fat} g</span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-name">Fiber: </span>
                  <span className="nutrient-value">{nutritionData.nutrients.fiber} g</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default App;