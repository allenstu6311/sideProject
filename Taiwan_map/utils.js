import location from "./location.js";

let countryCsv = [];
let townsCsv = [];
let townsId = "";

export function pairId(textRow, id) {
  for (let i = 0; i < textRow.length; i++) {
    const item = textRow[i];
    if (item[1]?.trim() == id?.trim()) {
      return item[2];
    }
  }
}

function parseCSV(text) {
  const pattern = /(\d+),"([\s\S]*?)(?=\d+,|$)/g;
  let matches = "";
  const rows = [];
  while ((matches = pattern.exec(text)) !== null) {
    rows.push(matches);
  }
  return rows;
}

async function getCsv(url, id, deep) {
  const res = await fetch(`./data/${url}.csv`);
  const text = await res.text();
  const textContent = pairId(parseCSV(text), id);
  return textContent;
}

export async function assignValue(name, id, dom, deep) {
  let textContent = "";
  switch (deep) {
    case 1:
      textContent = await getCsv("county-gpt", id, deep);
      break;
    case 2:
      textContent = await getCsv("town-gpt", id);
      townsId = id;
      break;
    case 3:
      textContent = await getCsv(`village-${townsId}-gpt`, id);
      break;
  }
  const chName = location[name] || "";

  const keys = {
    name,
    id,
    dom,
    textContent,
    chName,
  };
  return keys;
}
