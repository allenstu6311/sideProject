function getCenterPos() {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return { centerX, centerY };
}

export function parseCSV(text, id) {
  const rows = text.split("\n");
  rows.splice(0, 1);
  let textRow = rows.join("");
  textRow = textRow.split('"- ');
  
  for (let i = 0; i < textRow.length; i++) {
    const item = textRow[i].split('",');
    if(!item[1]) continue

    if (item[1].trim() == id.trim()) {      
      return { textContent: item[0] };
    }
  }
}
