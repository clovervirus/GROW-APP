export function exportCSV(filename, rows){
  const lines = rows.map(r=> r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(","));
  const blob = new Blob([lines.join("\n")], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=> URL.revokeObjectURL(a.href), 0);
}

export function importCSV(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = () => {
      const text = String(fr.result||"");
      const rows = text.split(/\r?\n/).filter(Boolean).map(line=> line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s=> s.replace(/^\"|\"$/g,"").replace(/\"\"/g,'"')));
      resolve(rows);
    };
    fr.onerror = reject; fr.readAsText(file);
  });
}
