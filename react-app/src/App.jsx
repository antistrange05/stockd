import { useState, useEffect } from "react";
import "./App.css";
import ReceiptScannerPage from './components/ReceiptScannerPage.jsx';

function App() {
  // --- STATE DECLARATIONS ---
  const [appView, setAppView] = useState('main'); 
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [sortOption, setSortOption] = useState("name");
  const [selectedItem, setSelectedItem] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  // --------------------------------------------------------

  const API_KEY = 'HIE5hqcouLjbEoWB5NRuCY3C2HgM50ZvnhcXVBpA';

  
  const handleScannedItems = (scannedItems) => {
    const newItems = scannedItems.map(item => {
        // Map the storage suggestion to your existing 'category' values
        let category;
        // The AI result should be "Pantry", "Fridge", or "Freezer"
        switch (item.storage.toLowerCase()) {
            case 'fridge':
                category = 'Dairy'; // Using an existing category for Fridge items
                break;
            case 'freezer':
                category = 'Frozen';
                break;
            case 'pantry':
            default:
                category = 'Grains'; // Using an existing category for Pantry items
                break;
        }

        return {
            id: Date.now() + Math.random(),
            name: item.name,
            quantity: 1, 
            category: category,
            // ✅ CHANGE 1: Save the storage location explicitly
            storage: item.storage, 
            // ✅ CHANGE 2: Save the shelf life
            shelfLife: item.shelfLife || 'Unknown' 
        };
    });

    setItems(prevItems => [...prevItems, ...newItems]);
    setAppView('main');
  };
  

  const handleSelect = (item) => {
    setSelectedItem(item);
  }

  const handleSubmit = () => {
    const newItem = {
      id: Date.now(),
      name: itemName,
      quantity: quantity,
      category: category,
      storage: category, // For manual items, default storage to category
      shelfLife: null    // Manual items usually don't have this unless added
    }

    setItems([...items, newItem]);
    setItemName("");
    setQuantity("");
    setCategory("");
    setAppView('main');
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


  
// 1. Manual Form View
if (appView === 'addManual') {
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
        <select
          id = "category"
          value = {category}
          onChange = {(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          <option value="Dairy">Dairy</option>
          <option value="Snacks">Snacks</option>
          <option value="Produce">Produce</option>
          <option value="Grains">Grains</option>
          <option value="Frozen">Frozen</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className = "form-buttons">
          <button onClick = {handleSubmit}>add item!</button>
          <button onClick = {() => setAppView('main')}>cancel</button> 
      </div>
    </div>
  </div>
  );
}

// 2. Receipt Scanner View
if (appView === 'scanReceipt') {
  return <ReceiptScannerPage 
      onItemsScanned={handleScannedItems} 
      setAppView={setAppView} 
  />;
}

// --- MAIN VIEW RENDER LOGIC ---
const sortedItems = [...items].sort((a, b) => {
  if (sortOption === "name") return a.name.localeCompare(b.name);
  if (sortOption === "quantity") return Number(a.quantity) - Number(b.quantity);
  if (sortOption === "category") return a.category.localeCompare(b.category);
  return 0;
});
  
  return (
    <div>
      <h1>stock'd</h1>
      <p>your handy pantry tracker app!</p>
      <button id = "add-item" onClick = {() => setAppView('addManual')}>add item</button>
      <button 
        onClick={() => setAppView('scanReceipt')} 
        style={{
          marginLeft: '1rem', 
          backgroundColor: '#d8e2dc', 
          color: '#333'
        }}
      >
        Scan Receipt 📸
      </button>
      
      <section id = "pantry">
        <div id = "shelf"> {/* holds all items */}
          <h3>my shelf</h3>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="name">Sort by Name (A–Z)</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="category">Sort by Category</option>
          </select>
          
          <ul>
            {sortedItems.map((item) => ( 
              <li 
                key={item.id}
                onClick={() => handleSelect(item)}
                className={selectedItem?.id === item.id ? "selected" : ""}
                style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "6px", 
                  alignItems: "flex-start",
                  textAlign: "left"
                }}
              >
                  {/* Item Name */}
                  <strong style={{ fontSize: "1.1rem" }}>{item.name}</strong>
                  
                  {/* Quantity and Storage Location */}
                  <div style={{ fontSize: "0.9rem", color: "#555" }}>
                    <span>Qty: {item.quantity}</span>
                    <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
                    {/* Display Storage if available, else fallback to Category */}
                    <span> {item.storage || item.category}</span> 
                  </div>

                  {/* Shelf Life (Only shows if scanned) */}
                  {item.shelfLife && (
                    <div style={{ fontSize: "0.85rem", color: "#d35400", fontWeight: "500" }}>
                       ⏳ Expires in: {item.shelfLife}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* ... Actions and Facts panels ... */}
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

              <button
                onClick = {() => {
                  setEditingCategory(true);
                  setNewCategory(selectedItem.category);
                }}> 
                change category
                </button>

                {editingCategory && (
                  <div className = "edit-category-form">
                    <input
                      type = "text"
                      value = {newCategory}
                      onChange = {(e) => setNewCategory(e.target.value)}
                      placeholder = "new cateogry"
                    />

                    <div className = "edit-buttons">
                      <button
                        onClick ={() => {
                          const updated = items.map((i) => 
                            i.id === selectedItem.id ? {...i, category: newCategory} : i
                        );
                        setItems(updated);

                        setSelectedItem({...selectedItem, category: newCategory,});

                        setEditingCategory(false);
                        }}
                      >
                        save
                      </button>

                      <button onClick={() => setEditingCategory(false)}>cancel</button>
                      </div>
                      </div>
                )}

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