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

export async function assignValue(id, deep) {
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
    textContent,
    chName,
  };
  return keys;
}

export function getBBoxCenter(svg) {
  const svgBox = svg.getBBox();

  const { innerWidth, innerHeight } = window;
  let scaleFactor = 0.7;

  if (innerWidth < 500) {
    scaleFactor = 0.6;
  } else if (innerWidth < 968) {
    scaleFactor = 0.7;
  }

  const scaleX = window.innerHeight / svgBox.width;
  const scaleY = window.innerHeight / svgBox.height;
  const zoomLevel = Math.min(scaleX, scaleY) * scaleFactor; // 選擇較小的縮放比例

  const centerX = (svgBox.x + svgBox.width / 2) * zoomLevel;
  const centerY = (svgBox.y + svgBox.height / 2) * zoomLevel;

  return { svgBox, centerX, centerY, zoomLevel };
}

export function getPartyColorBySupport(party, support) {
  if (party === 2) {
    if (support < 40) return "rgb(88, 220, 152)";
    else if (support < 60) return "rgb(49, 198, 114)";
    else return "rgb(39, 174, 97)";
  }

  if (party === 3) {
    if (support < 40) return "rgb(127, 182, 238)";
    else if (support < 50) return "rgb(112, 171, 236)";
    else return "rgb(56, 112, 189)";
  }
}
