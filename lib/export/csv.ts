export function productsToCSV(products: any[]): string {
  const headers = ['id', 'name', 'sku', 'currentPrice', 'costPrice', 'currency', 'category', 'source', 'createdAt'];
  const rows = products.map(p => headers.map(h => {
    const val = p[h] !== null && p[h] !== undefined ? p[h] : '';
    return typeof val === 'string' ? `"\${val.replace(/"/g, '""')}"` : String(val);
  }));
  return [headers.join(','), ...rows].join('\n');
}

export function competitorPricesToCSV(records: any[]): string {
  const headers = ['date', 'product', 'competitor', 'price', 'originalPrice', 'discountPct', 'inStock'];
  const rows = records.map(r => headers.map(h => {
    const val = r[h] !== null && r[h] !== undefined ? r[h] : '';
    return typeof val === 'string' ? `"\${val.replace(/"/g, '""')}"` : String(val);
  }));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
