export function toCSV(rows){
  const header = ["id","type","strain","qty"];
  const lines = [header.join(",")].concat(rows.map(row=> header.map(key=> String(row[key] ?? "").replaceAll(",",";")).join(",")));
  return lines.join("\n");
}

export function downloadCSV(rows, name="inventory.csv"){
  const blob = new Blob([toCSV(rows)], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(()=> URL.revokeObjectURL(a.href), 0);
}

export function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  if(!lines.length) return [];
  const header = lines[0].split(",");
  const rows = [];
  for(let i=1;i<lines.length;i+=1){
    const cols = lines[i].split(",");
    const record = {};
    header.forEach((key, idx)=>{
      record[key] = cols[idx] ?? "";
    });
    record.qty = Number(record.qty || 1);
    rows.push(record);
  }
  return rows;
}
