/**
 * Helper to export an array of data objects to CSV file download
 */
export function exportToCsv(filename, data = [], headers = []) {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const keys = headers.length ? headers.map(h => h.key) : Object.keys(data[0]);
  const labels = headers.length ? headers.map(h => h.label) : keys;

  let csvContent = labels.map(l => `"${String(l).replace(/"/g, '""')}"`).join(',') + '\n';

  data.forEach(row => {
    const line = keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += line + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
