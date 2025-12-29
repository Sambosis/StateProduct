
import { ProductVariant, ProductGroup } from './types';

export const parseCSV = (csv: string): ProductGroup[] => {
  if (!csv) return [];
  
  // Normalize line endings and split
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const parseLine = (line: string) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const groups: Record<string, ProductGroup> = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop parsing if we hit the second section header (SCSClass)
    // This prevents the secondary table from polluting the main product list
    if (line.toLowerCase().startsWith('scsclass')) break; 
    
    if (!line || line.toLowerCase().startsWith('productlinedescription')) continue;

    const parts = parseLine(line);
    if (parts.length < 11) continue;

    // Standard Report Structure:
    // 0: ProductLine, 1: Family, 2: Parent, 3: SKU, 4: Description, 5: UOM, 6: STD, 8: Floor, 9: Give, 10: GSA, 13: Weight
    const parentName = parts[2] || 'Uncategorized';
    const family = parts[1] || 'General';

    if (!groups[parentName]) {
      groups[parentName] = {
        parentName,
        family,
        variants: []
      };
    }
    
    const cleanPrice = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[$,\s]/g, '')) || 0;
    };
    
    // Prevent duplicate SKUs within the same group
    const sku = parts[3];
    if (groups[parentName].variants.some(v => v.sku === sku)) continue;

    groups[parentName].variants.push({
      productLine: parts[0],
      family: family,
      sku: sku,
      description: parts[4],
      unit: parts[5],
      stdPrice: cleanPrice(parts[6]),
      floorPrice: cleanPrice(parts[8]),
      givePrice: cleanPrice(parts[9]),
      gsaPrice: cleanPrice(parts[10]),
      weight: parseFloat(parts[13]) || 0
    });
  }

  return Object.values(groups).sort((a, b) => a.parentName.localeCompare(b.parentName));
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
