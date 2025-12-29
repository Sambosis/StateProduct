
import React, { useState, useMemo, useRef } from 'react';
import { Search, Package, Info, ChevronRight, DollarSign, Box, Tag, Filter, Upload, Database, RefreshCcw, Copy, CheckCircle2, FileUp, AlertCircle, Trash2 } from 'lucide-react';
import { ProductGroup, ProductVariant } from './types';
import { parseCSV, formatCurrency } from './utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STORAGE_KEY = 'state_chemical_catalog_v2';

const App: React.FC = () => {
  // Initialize state from localStorage only.
  const [csvData, setCsvData] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize parsed data
  const productGroups = useMemo(() => {
    if (!csvData) return [];
    return parseCSV(csvData);
  }, [csvData]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return productGroups;

    return productGroups.filter(group => {
      const nameMatch = group.parentName.toLowerCase().includes(term);
      const familyMatch = group.family.toLowerCase().includes(term);
      const variantMatch = group.variants.some(v => 
        v.sku.toLowerCase().includes(term) || 
        v.description.toLowerCase().includes(term)
      );
      return nameMatch || familyMatch || variantMatch;
    });
  }, [productGroups, searchTerm]);

  const activeVariant = useMemo(() => {
    if (!selectedGroup) return null;
    return selectedGroup.variants[selectedVariantIdx] || selectedGroup.variants[0];
  }, [selectedGroup, selectedVariantIdx]);

  const chartData = useMemo(() => {
    if (!activeVariant) return [];
    return [
      { name: 'Standard', value: activeVariant.stdPrice, color: '#6366f1' },
      { name: 'Floor', value: activeVariant.floorPrice, color: '#f59e0b' },
      { name: 'Give', value: activeVariant.givePrice, color: '#10b981' },
      { name: 'GSA', value: activeVariant.gsaPrice, color: '#ef4444' },
    ];
  }, [activeVariant]);

  const handleSelectGroup = (group: ProductGroup) => {
    setSelectedGroup(group);
    setSelectedVariantIdx(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setCsvData(text);
          localStorage.setItem(STORAGE_KEY, text);
          setSelectedGroup(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const copySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear the current catalog data?")) {
      setCsvData(null);
      localStorage.removeItem(STORAGE_KEY);
      setSelectedGroup(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Landing Page (No Data State)
  // ---------------------------------------------------------------------------
  if (!csvData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".csv"
        />
        
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-200">
          <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
            <Package className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">State Chemical Catalog</h1>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Please upload your product catalog CSV file to begin. The data will be stored locally in your browser.
          </p>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200"
          >
            <Upload className="w-6 h-6" />
            <span>Upload Catalog CSV</span>
          </button>
        </div>
        
        <p className="mt-8 text-xs text-slate-400 font-medium uppercase tracking-widest">
          Secure Local Browser Storage
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main App Interface
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".csv"
      />
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={() => setSelectedGroup(null)} title="Return Home">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold leading-none">State Chemical</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Pricing Matrix</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              placeholder="Search products by Parent Name, SKU, or Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              <span className="hidden lg:inline">Update CSV</span>
            </button>
            <button 
              onClick={clearData}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Clear data"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex gap-6 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-80 lg:w-96 flex flex-col shrink-0">
          <div className="mb-4 px-2 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center">
              <Database className="w-3.5 h-3.5 mr-2" />
              <span>{filteredGroups.length} Products</span>
            </div>
            <Filter className="w-3.5 h-3.5" />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <button
                  key={group.parentName}
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full text-left p-4 rounded-2xl transition-all group border ${
                    selectedGroup?.parentName === group.parentName
                      ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      selectedGroup?.parentName === group.parentName ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {group.family}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedGroup?.parentName === group.parentName ? 'text-indigo-500 translate-x-1' : 'text-slate-300'}`} />
                  </div>
                  <h3 className={`text-sm font-bold leading-tight ${selectedGroup?.parentName === group.parentName ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {group.parentName}
                  </h3>
                  <div className="mt-3 flex items-center text-[11px] text-slate-400 font-semibold">
                    <Box className="w-3 h-3 mr-1.5 opacity-50" />
                    {group.variants.length} SKU Variants
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-slate-400">No products found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedGroup ? (
            <div className="space-y-6 pb-20">
              {/* Product Header */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Package className="w-32 h-32" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 text-indigo-500 mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">{selectedGroup.family}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{selectedGroup.parentName}</h2>
                  
                  {/* Variant Selector */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Variant / Size</label>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{selectedGroup.variants.length} Options Available</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {selectedGroup.variants.map((v, i) => (
                        <button
                          key={v.sku}
                          onClick={() => setSelectedVariantIdx(i)}
                          className={`text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${
                            selectedVariantIdx === i
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]'
                              : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2 relative z-10 gap-2">
                             <div className="flex-1">
                               <p className={`text-xs font-extrabold uppercase leading-tight ${selectedVariantIdx === i ? 'text-indigo-100' : 'text-slate-500'}`}>
                                 {v.unit}
                               </p>
                               <p className={`text-sm font-bold leading-snug mt-1 ${selectedVariantIdx === i ? 'text-white' : 'text-slate-800'}`}>
                                 {v.description}
                               </p>
                             </div>
                          </div>
                          
                          <div className={`mt-3 pt-3 border-t ${selectedVariantIdx === i ? 'border-white/20' : 'border-slate-100'} flex items-center justify-between font-mono text-xs relative z-10`}>
                             <span className={selectedVariantIdx === i ? 'text-indigo-200' : 'text-slate-400'}>SKU: {v.sku}</span>
                             {selectedVariantIdx === i && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Pricing */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Pricing Grid */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-indigo-500" />
                        Pricing Matrix
                      </h3>
                      {activeVariant && (
                         <span className="text-xs font-medium text-slate-400 font-mono">
                           {activeVariant.sku} • {activeVariant.unit}
                         </span>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Standard', value: activeVariant?.stdPrice, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                      { label: 'Floor', value: activeVariant?.floorPrice, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                      { label: 'Give', value: activeVariant?.givePrice, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                      { label: 'GSA', value: activeVariant?.gsaPrice, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                    ].map((tier) => (
                      <div key={tier.label} className={`${tier.bg} rounded-2xl p-5 border border-white transition-transform hover:scale-[1.02]`}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{tier.label}</p>
                        <p className={`text-3xl font-black tabular-nums ${tier.color}`}>{formatCurrency(tier.value || 0)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quick Copy</p>
                        <div className="flex items-center group cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all" onClick={() => copySku(activeVariant?.sku || '')}>
                          <p className="text-sm font-mono font-bold text-slate-700">{activeVariant?.sku}</p>
                          {copiedSku === activeVariant?.sku ? (
                            <CheckCircle2 className="w-3.5 h-3.5 ml-2 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 ml-2 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Wt.</p>
                        <p className="text-sm font-bold text-slate-900">{activeVariant?.weight.toFixed(3)} <span className="text-slate-400 font-medium">lbs</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Spread Analysis</h3>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc', radius: 10 }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Price']}
                        />
                        <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={48}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center p-12">
              <div className="bg-indigo-50 p-8 rounded-full mb-8">
                <Search className="w-16 h-16 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Enterprise Product Search</h3>
              <p className="max-w-sm text-slate-500 font-medium">
                Type a SKU, parent name, or category into the search bar, or select a product from the list to view its multi-tier pricing structure.
              </p>
              {productGroups.length === 0 && (
                <div className="mt-6 flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm font-medium">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No data loaded. Use "Update CSV" to load a catalog.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 px-8 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>Systems Active</span>
        </div>
        <div className="hidden sm:block">
          {productGroups.length} Products • Internal Pricing Matrix
        </div>
        <div>
          State Chemical Solutions
        </div>
      </footer>
    </div>
  );
};

export default App;
