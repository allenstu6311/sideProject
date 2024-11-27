import location from "./location.js";

let countryCsv = [];
let townsCsv = [];
let townsId = "";

export const locationMap = {};

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
    // console.log(`<symbol id="${matches[1]}"></symbol>`);
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

export async function assignValue(id, dom, deep) {
  let textContent = "";
  switch (deep) {
    case 1:
      textContent = await getCsv("county-gpt", id, deep);
      break;
    case 2:
      textContent = await getCsv("town-gpt", id);
      break;
    case 3:
      textContent = await getCsv(`village-${id.slice(0, 8)}-gpt`, id);
      break;
  }
  const chName = locationMap[id] || "";

  const keys = {
    id,
    dom,
    textContent,
    chName,
  };
  return keys;
}

export function getBBoxCenter(svg) {
  const svgBox = svg.getBBox();
  const centerX = svgBox.x + svgBox.width / 2;
  const centerY = svgBox.y + svgBox.height / 2;
  const zoomLevel =
    svgBox.height > svgBox.width ? 728 / svgBox.height : 728 / svgBox.width;

  return { svgBox, centerX, centerY, zoomLevel };
}
