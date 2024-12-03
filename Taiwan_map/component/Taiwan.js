import Taoyuan from "./Taoyuan/towns.js";
import NewTaipei from "./NewTaipei/towns.js";
import Kaohsiung from "./Kaohsiung/towns.js";
import Hsinchu from "./Hsinchu/towns.js";
import { assignValue, getBBoxCenter } from "../utils.js";

export const taiwan = {
  props: {
    deepVal: {
      type: Number,
      default: 0,
    },
    searchParam: {
      type: Object,
      default: null,
    },
  },
  emits: ["updateDeep", "getLocationData", "updateAddress"],
  data() {
    return {
      position: {
        x: 0,
        y: 0,
        scale: 0,
      },
      countryList: {
        68000: Taoyuan,
        65000: NewTaipei,
        64000: Kaohsiung,
        10004: Hsinchu,
      },
      countryInfo: {
        name: "",
        dom: "",
        id: "",
        textContent: "",
      },
      townInfo: {
        name: "",
        dom: "",
        textContent: "",
      },
      villageInfo: {
        name: "",
        dom: "",
        textContent: "",
      },
      defaultInfo: {
        name: "尚無資料",
        dom: "",
        id: "",
        textContent: "尚無資料",
      },
      focusDom: "",
      inValid: false,
      d3Svg: "",
      countrySvg: "",
      mapGroup: "",
      townSvg: "",
      villageSvg: "",
      areaData: "",
      villageData: "",
      targetData: {},
      changeArea: false,
      isMapClick: false,
    };
  },
  computed: {},
  watch: {
    deepVal(newVal, oldVal) {
      if (newVal > 0 || oldVal > newVal) {
        this.removeChild(newVal, oldVal);
      }
      const dom = this.getDomFromDeep(newVal);
      this.appendMap(newVal, this.targetData.id);
      this.$nextTick(() => {
        if (newVal === 0) {
          this.moveMapInCenter();
        } else {
          this.moveMap(dom.node());
        }
      });
    },
    currAddress(val) {
      this.$emit("updateAddress", val);
    },
    // 父層查詢事件
    async searchParam(param) {
      let deep = 1;
      for (const id of param.idList) {
        await this.handleEvent(id, deep);
        deep++;
      }
    },
  },
  methods: {
    async initMap(init) {
      const { svg } = this.$refs;
      const { innerWidth, innerHeight } = window;
      svg.setAttribute(
        "viewBox",
        `0 0 ${innerWidth > 400 ? innerWidth : 400} ${innerHeight}`
      );

      if (init) {
        this.d3Svg = d3.select(svg);
        this.mapGroup = this.d3Svg
          .append("g")
          .attr("class", "map-group")
          .attr("translate", "map");

        this.countrySvg = this.mapGroup
          .append("g")
          .attr("class", "selected-county-country");
        this.townSvg = this.mapGroup
          .append("g")
          .attr("class", "selected-county-towns");
        this.villageSvg = this.mapGroup
          .append("g")
          .attr("class", "selected-county-villages");

        this.areaData = await this.getMapData();
        this.appendMap(0);
      }

      this.$nextTick(() => {
        this.moveMapInCenter();
      });
    },
    moveMapInCenter() {
      const { centerX, centerY } = getBBoxCenter(this.mapGroup.node());
      const translateX = innerWidth / 2 - centerX;
      const translateY = innerHeight / 2 - centerY;
      this.mapGroup.attr("transform", `translate(${translateX},${translateY})`);
    },
    getMapData(id) {
      let url = "./data/topoJson/towns-mercator.json";
      if (id) {
        url = `./data/topoJson/tw-village/${id}.json`;
      }
      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          return data || {};
        });
    },
    async appendMap(deep, id) {
      const path = d3.geoPath();
      const dom = this.getDomFromDeep(deep);
      // console.log("dom", dom.node());
      let mapData;

      switch (deep) {
        case 1:
          mapData = topojson
            .feature(this.areaData, this.areaData.objects.towns)
            .features.filter((item) => item.id.includes(id));

          break;
        case 2:
          mapData = topojson
            .feature(this.villageData, this.villageData.objects.village)
            .features.filter((item) => item.properties.TOWNCODE.includes(id));
          break;

        default:
          mapData = topojson.feature(
            this.areaData,
            this.areaData.objects.counties
          ).features;
          break;
      }
      // console.log("dom", dom.node());
      // console.log("mapData", mapData);

      dom
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("fill", "lightblue")
        .attr("stroke-width", 0.5)
        .on("click", async (d, data) => {
          const foucsNode = this.mapGroup.select(".focus").node();
          if (foucsNode) this.mapGroup.select(".focus").remove();

          this.mapGroup
            .datum(data)
            .append("path")
            .attr("d", path)
            .attr("stroke", "red")
            .attr("fill", "none")
            .attr("class", "focus")
            .attr("stroke-width", 0.5);

          //因為要設定到下一層所以+1
          this.mapOnClick(deep + 1, data);
        });
    },
    async mapOnClick(deep, data) {
      this.isMapClick = true;
      const moveDom = deep === 1 ? this.townSvg : this.villageSvg;
      this.targetData = data;

      if (deep === 1) {
        this.villageData = await this.getMapData(data.id);
        // this.countryInfo = await assignValue(data.id, moveDom.node(), deep);
      }

      // 深度不超過2
      if (deep <= 2) {
        this.$emit("updateDeep", deep);

        if (deep === this.deepVal) {
          this.removeChild(deep, this.deepVal);
          this.appendMap(deep, data.id);
          this.$nextTick(() => {
            this.moveMap(moveDom.node());
          });
        }
      } else if (deep === 3) {
      }
      this.$nextTick(() => {
        this.isMapClick = false;
      });
    },
    getDomFromDeep(deep) {
      const useDeep = deep === undefined ? this.deepVal : deep;
      switch (useDeep) {
        case 0:
          return this.countrySvg;
        case 1:
          return this.townSvg;
        case 2:
          return this.villageSvg;
        default:
          return this.mapGroup;
      }
    },
    updateDeepVal(newVal, oldVal) {
      console.log("newVal", newVal, "oldVal", oldVal);
      // const { towns, villages, map } = this.$refs;

      // switch (newVal) {
      //   case 0:
      //     this.initMap();
      //     this.removeChild(towns);
      //     map.removeChild(this.focusDom);
      //     this.focusDom = "";
      //     break;
      //   case 1:
      //     this.focusMap(this.countryInfo.dom);
      //     this.$emit("getLocationData", this.countryInfo);
      //     if (oldVal > newVal) {
      //       this.moveMap(this.position.x, this.position.y, this.position.scale);
      //       this.removeChild(villages);
      //     }
      //     break;
      //   case 2:
      //     this.$emit("getLocationData", this.townInfo);
      //     this.focusMap(this.townInfo.dom);

      //     break;
      //   case 3:
      //     this.$emit("getLocationData", this.villageInfo);
      //     this.focusMap(this.villageInfo.dom);
      //     break;
      // }
    },
    removeChild(newDeep, oldDeep) {
      console.log(newDeep, oldDeep);

      if (newDeep === oldDeep) {
        // 同層移動
        const dom = this.getDomFromDeep(newDeep);
        dom.selectAll("path").remove();
      } else if (oldDeep > newDeep) {
        /**
         * 子層的點擊需要清空兩層，父
         * 層的點擊僅須返回一層
         */
        newDeep = this.isMapClick ? newDeep - 1 : newDeep;
        // 跨縣市移動
        while (oldDeep > newDeep) {
          const dom = this.getDomFromDeep(oldDeep);
          dom.selectAll("path").remove();
          oldDeep--;
        }
      }
    },
    getMoveRange(dom) {
      // debugger;
      const {
        centerX: pathCenterX,
        centerY: pathCenterY,
        zoomLevel,
      } = getBBoxCenter(dom);

      // viewBox
      const svgSize = this.d3Svg.node().getAttribute("viewBox").split(" ");
      const svgWidth = svgSize[2];
      const svgHeight = svgSize[3];

      // 將目標 path 的中心點移動到 SVG 可視區域的中心
      const translateX = svgWidth / 2 - pathCenterX * zoomLevel;
      const translateY = svgHeight / 2 - pathCenterY * zoomLevel;

      return { translateX, translateY, zoomLevel };
    },
    moveMap(dom) {
      const { translateX, translateY, zoomLevel } = this.getMoveRange(dom);
      // console.log("translateX", translateX);
      // console.log("zoomLevel", zoomLevel);
      this.mapGroup.attr(
        "transform",
        `translate(${translateX},${translateY}) scale(${zoomLevel})`
      );
    },
    insertMap(parent, child) {
      parent.insertAdjacentHTML("beforeend", child);
      this.$nextTick(() => {
        if (this.deepVal <= 2) {
          this.addEvent(parent, this.deepVal + 1);
        }
      });
    },
    focusMap(dom) {
      const { map } = this.$refs;
      if (this.focusDom) {
        map.removeChild(this.focusDom);
      }
      const cloneDom = dom.cloneNode(true);
      cloneDom.setAttribute("stroke", "yellow");
      cloneDom.setAttribute("stroke-width", `0.${4 - this.deepVal}`);
      cloneDom.setAttribute("fill", "none");
      this.focusDom = cloneDom;
      map.appendChild(cloneDom);
    },
    async handleEvent(id, deep) {
      // await this.$nextTick(() => {});
      const element = document.getElementById(id);
      const dom = element?.children[0] || element;

      if (!id || !dom) {
        this.$emit("getLocationData", this.defaultInfo);
        this.inValid = true;
        return;
      }
      this.inValid = false;
      const { towns, villages, map, svg } = this.$refs;

      if (deep === 3) {
        this.villageInfo = await assignValue(id, dom, deep);
        this.$emit("updateDeep", deep);
      } else {
        const {
          centerX: pathCenterX,
          centerY: pathCenterY,
          zoomLevel,
        } = getBBoxCenter(dom);

        // viewBox
        const svgSize = svg.getAttribute("viewBox").split(" ");
        const svgWidth = svgSize[2];
        const svgHeight = svgSize[3];

        // 將目標 path 的中心點移動到 SVG 可視區域的中心
        const translateX = svgWidth / 2 - pathCenterX * zoomLevel;
        const translateY = svgHeight / 2 - pathCenterY * zoomLevel;

        // 紀錄country的移動(桃園、台北...)
        if (deep === 1) {
          const sameName = id !== this.countryInfo.id;
          if (sameName) {
            this.removeChild(towns);
          }
          this.position.x = translateX;
          this.position.y = translateY;
          this.position.scale = zoomLevel;
          this.countryInfo = await assignValue(id, dom, deep);
        } else {
          const sameName = id !== this.townInfo.id;
          if (sameName) {
            this.removeChild(villages);
          }
          this.townInfo = await assignValue(id, dom, deep);
        }

        /**
         * 更新父曾深度，須確保子層的DOM已取得
         */
        this.$emit("updateDeep", deep);

        const template =
          deep === 1
            ? this.countryList[id]?.country
            : this.countryList[this.countryInfo.id]?.towns[id];

        this.moveMap(translateX, translateY, zoomLevel);
        // this.insertMap(deep === 1 ? towns : villages, template);
      }

      // 在同一層移動也要確保觸發位移
      if (this.deepVal === deep) {
        this.updateDeepVal(deep, this.deepVal);
      }
    },
    // 地圖點擊事件
    addEvent(el, deep) {
      Array.from(el.children).forEach((child) => {
        child.addEventListener("click", async () => {
          const id =
            child.getAttribute("xlink:href")?.substring(1) ||
            child.getAttribute("id");

          await this.handleEvent(id, deep);
        });
      });
    },
  },
  mounted() {
    const { country, map, svg } = this.$refs;
    // this.addEvent(country, 1);

    window.addEventListener("resize", () => {
      this.initMap();
    });

    this.$nextTick(() => {
      this.initMap(true);
    });
  },
  template: `
    
 <svg class="tw-geo svelte-ul8skc" viewBox="0 0 960 910" ref="svg" preserveAspectRatio="xMidYMid meet">
 
    </svg>`,
  // template: `
  //    <svg class="tw-geo svelte-ul8skc" viewBox="0 0 960 910" ref="svg" preserveAspectRatio="xMidYMid meet">
  //     <g class="map-container">
  //       <g
  //         class="map-group"
  //         stroke-width="0.5"
  //         transform="translate(0,0) scale(1)"
  //         ref="map"
  //         shape-rendering="crispEdges"
  //         vector-effect="non-scaling-stroke"
  //       >
  //         <g class="county" ref="country">
  //           <use xlink:href="#64000"></use>
  //           <use xlink:href="#09007"></use>
  //           <use xlink:href="#10013"></use>
  //           <use xlink:href="#10015"></use>
  //           <use xlink:href="#10018"></use>
  //           <use xlink:href="#10014"></use>
  //           <use xlink:href="#66000"></use>
  //           <use xlink:href="#10010"></use>
  //           <use xlink:href="#68000"></use>
  //           <use xlink:href="#10008"></use>
  //           <use xlink:href="#10009"></use>
  //           <use xlink:href="#10016"></use>
  //           <use xlink:href="#67000"></use>
  //           <use xlink:href="#63000"></use>
  //           <use xlink:href="#10007"></use>
  //           <use xlink:href="#10004"></use>
  //           <use xlink:href="#10020"></use>
  //           <use xlink:href="#10017"></use>
  //           <use xlink:href="#10005"></use>
  //           <use xlink:href="#10002"></use>
  //           <use xlink:href="#65000"></use>
  //           <use xlink:href="#9020"></use>
  //         </g>
  //         <g class="selected-county-towns" ref="towns"></g>
  //         <g class="selected-town-villages" ref="villages"></g>
  //       </g>
  //     </g>
  //     <defs>
  //       <pattern id="tpp-pattern" x="0" y="0" width="0.9055382649729705" height="0.9055382649729705" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
  //         <circle cx="0.45276913248648526" cy="0.45276913248648526" r="0.22638456624324263" fill="#fff" opacity="0.5"></circle>
  //       </pattern>
  //     </defs>
  //   </svg>`,
};
