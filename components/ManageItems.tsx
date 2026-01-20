
import React, { useState } from 'react';
import { MenuItem } from '../types';

interface ManageItemsProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const ManageItems: React.FC<ManageItemsProps> = ({ items, setItems }) => {
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Food', description: '' });
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MenuItem | null>(null);

  const predefinedCategories = ['Food', 'Drinks', 'Sides', 'Dessert', 'Other'];
  const activeCategories = Array.from(new Set([...predefinedCategories, ...items.map(i => i.category)]));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    
    const finalCategory = isAddingNewCategory ? customCategory : newItem.category;
    if (!finalCategory) return;

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: finalCategory,
      description: newItem.description,
      isAvailable: true // Default to available
    };
    
    setItems(prev => [...prev, item]);
    setNewItem({ name: '', price: '', category: 'Food', description: '' });
    setCustomCategory('');
    setIsAddingNewCategory(false);
  };

  const toggleAvailability = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isAvailable: item.isAvailable === false ? true : false } : item
    ));
  };

  const startEditing = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm && editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? editForm : i));
      cancelEditing();
    }
  };

  const removeItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Inventory Management</h2>

      {/* Add Item Form */}
      <form onSubmit={handleAdd} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-wrap gap-4 items-end shadow-2xl">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Item Name</label>
          <input 
            type="text"
            required
            value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
            placeholder="e.g. Garlic Bread"
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        <div className="w-32 space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Price (₹)</label>
          <input 
            type="number"
            step="0.01"
            required
            value={newItem.price}
            onChange={e => setNewItem({...newItem, price: e.target.value})}
            placeholder="0.00"
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        <div className="w-48 space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black uppercase text-zinc-500">Category</label>
            <button 
              type="button"
              onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
              className="text-[9px] font-black text-yellow-500 uppercase hover:underline"
            >
              {isAddingNewCategory ? 'Select Existing' : 'New Category'}
            </button>
          </div>
          
          {isAddingNewCategory ? (
            <input 
              type="text"
              required
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              placeholder="Custom category..."
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
            />
          ) : (
            <select 
              value={newItem.category}
              onChange={e => setNewItem({...newItem, category: e.target.value})}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
            >
              {activeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        <div className="w-full space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Description (Optional)</label>
          <input 
            type="text"
            value={newItem.description}
            onChange={e => setNewItem({...newItem, description: e.target.value})}
            placeholder="Describe the item (ingredients, size, etc.)"
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        <button 
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-yellow-500/10"
        >
          Add Item
        </button>
      </form>

      {/* List */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-800/50 border-b border-zinc-800">
              <th className="p-4 text-xs font-black uppercase text-zinc-400">Status</th>
              <th className="p-4 text-xs font-black uppercase text-zinc-400">Name & Description</th>
              <th className="p-4 text-xs font-black uppercase text-zinc-400">Category</th>
              <th className="p-4 text-xs font-black uppercase text-zinc-400">Price (₹)</th>
              <th className="p-4 text-xs font-black uppercase text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className={`border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors ${item.isAvailable === false ? 'opacity-70' : ''}`}>
                <td className="p-4">
                  <button 
                    onClick={() => toggleAvailability(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[9px] uppercase border transition-all ${
                      item.isAvailable === false 
                        ? 'bg-red-500/10 border-red-500/40 text-red-500' 
                        : 'bg-green-500/10 border-green-500/40 text-green-500'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.isAvailable === false ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    {item.isAvailable === false ? 'OFF' : 'ON'}
                  </button>
                </td>
                {editingId === item.id && editForm ? (
                  <>
                    <td className="p-4 space-y-2">
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500"
                        placeholder="Name"
                      />
                      <input 
                        type="text"
                        value={editForm.description || ''}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-zinc-400 text-xs focus:border-yellow-500"
                        placeholder="Description"
                      />
                    </td>
                    <td className="p-4">
                      <select 
                        value={editForm.category}
                        onChange={e => setEditForm({...editForm, category: e.target.value})}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500"
                      >
                        {activeCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <input 
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                        className="w-24 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-yellow-500 font-mono text-sm focus:border-yellow-500"
                      />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={saveEdit}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4">
                      <div className={`font-bold ${item.isAvailable === false ? 'text-zinc-500 line-through' : ''}`}>{item.name}</div>
                      <div className="text-xs text-zinc-500 line-clamp-1">{item.description || 'No description'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-400 text-[10px] font-black uppercase border border-zinc-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-yellow-500 font-bold">₹{item.price.toFixed(2)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => startEditing(item)}
                        className="text-yellow-500 hover:bg-yellow-500/10 px-3 py-1 rounded-lg font-bold transition-all text-xs uppercase border border-yellow-500/30"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-lg font-bold transition-all text-xs uppercase"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-600 font-bold uppercase italic tracking-widest">
                  Inventory is empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageItems;
