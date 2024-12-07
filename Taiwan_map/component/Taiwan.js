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
  emits: ["updateDeep", "getLocationData", "updateAddress", "updateSelectionInfo"],
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
      isMapClick: false,
      maxDeep: 3,
      selectionData: [],
      selectionInfo: {},
    };
  },
  computed: {},
  watch: {
    deepVal: {
      handler(newVal, oldVal) {
        this.updateDeepVal(newVal, oldVal);
      },
      deep: true,
    },
    currAddress(val) {
      this.$emit("updateAddress", val);
    },
    // 父層查詢事件
    async searchParam(param) {
      const { idList, id } = param;

      this.villageData = await this.getMapData(idList[0]);
      for (let i = 1; i <= idList.length; i++) {
        await this.updateCurrInfo(idList[i - 1], i);
        this.$emit("updateDeep", i);
        await this.$nextTick();
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
        const { counties } = this.areaData.objects;
        // console.log("counties", counties);

        const countryIdList = [];
        for (let i = 0; i < counties.geometries.length; i++) {
          countryIdList.push(counties.geometries[i].id);
          await this.getSelectionData(counties.geometries[i].id);
        }
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
      this.mapGroup
        .transition()
        .duration(500)
        .attr("transform", `translate(${translateX},${translateY})`);
      // this.mapGroup.style("transform", `translate(${translateX}px,${translateY}px)`);
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
    getFeatureById(deep, id, type) {
      let data;

      switch (deep) {
        case 0:
          data = topojson.feature(
            this.areaData,
            this.areaData.objects.counties
          ).features;
          break;
        case 1:
          data = topojson.feature(
            this.areaData,
            this.areaData.objects.towns
          ).features;
          break;
        default:
          data = topojson.feature(
            this.villageData,
            this.villageData.objects.village
          ).features;
          break;
      }
      // console.log('data',data.filter((item) => item.id.includes(id)),'id',id);
      
      if (type === "find") {
        if (deep === 0) return data.find((item) => item.id.includes(id));
        if (deep === 1) return data.find((item) => item.id.includes(id));
        if (deep === 2)
          return data.find((item) => item.properties.VILLCODE.includes(id));
      }

      if (deep === 0) return data;
      if (deep === 1) return data.filter((item) => item.id.slice(0,id.length).includes(id));
      if (deep === 2)
        return data.filter((item) => item.properties.TOWNCODE.includes(id));
    },
    appendMap(deep, id) {
      const path = d3.geoPath();
      const dom = this.getDomFromDeep(deep);
      const mapData = this.getFeatureById(deep, id);

      dom
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff")
        .attr("fill", (data, index) => {
          const id = data.id ? data.id : data.properties.VILLCODE;
          let range = 5;
          if (deep === 1) range = 8;
          if (deep === 2) range = 11;

          const selectData = this.selectionData.filter((item) => {
            return item.village_id.slice(0, range).includes(id);
          });

          if (!selectData.length) return "lightblue";
          return this.calauteSelectionRate(id, selectData);
        })
        .attr("stroke-width", 0.2)
        .on("click", async (e, data) => {
          //因為要設定到下一層所以+1
          this.mapOnClick(deep + 1, data);
        });
    },
    async mapOnClick(deep, data) {
      this.isMapClick = true;
      const id = data.id ? data.id : data.properties.VILLCODE;
      await this.updateCurrInfo(id, deep);

      if (deep === 1) {
        this.villageData = await this.getMapData(id);

        // 切換縣市
        this.townSvg.selectAll("path").remove();
        this.villageSvg.selectAll("path").remove();
      }

      if (deep === this.deepVal) {
        this.updateDeepVal(deep, this.deepVal);
      }
      this.$emit("updateDeep", deep);

      this.$nextTick(() => {
        this.isMapClick = false;
      });
    },
    async updateCurrInfo(id, deep) {
      const DATA_INDEX = 1; //資料跟地圖深度距離1
      const currInfo = this.getInfoFromDeep(deep);
      Object.assign(currInfo, await assignValue(id, deep));
      currInfo.targetData = this.getFeatureById(deep - DATA_INDEX, id, "find");
      this.$emit("getLocationData", currInfo);
    },
    updateDeepVal(newDeep, oldDeep) {
      if (newDeep > 0 || oldDeep > newDeep) {
        this.removeChild(newDeep, oldDeep);
      }
      const currInfo = this.getInfoFromDeep(newDeep);
      this.focusMap();

      if(!this.isMapClick){
        this.$emit("getLocationData", currInfo);
      }

      const dom = this.getDomFromDeep(newDeep);
      if (newDeep < 3) {
        this.appendMap(newDeep, currInfo.id);
      }

      if (newDeep === 0) {
        this.moveMapInCenter();
      } else if (newDeep < 3) {
        this.moveMap(dom.node());
      }
    },
    removeChild(newDeep, oldDeep) {
      if (newDeep === 3 && oldDeep === 3) return;
      if (newDeep === oldDeep) {
        // 同層移動
        const dom = this.getDomFromDeep(newDeep);
        dom.selectAll("path").remove();
      } else if (oldDeep > newDeep) {
        /**
         * 子層的點擊需要清空兩層，父
         * 層的點擊僅須返回一層
         */
        // 跨縣市移動
        while (oldDeep > newDeep) {
          const dom = this.getDomFromDeep(oldDeep);
          dom.selectAll("path").remove();
          oldDeep--;
        }
      }
    },
    getMoveRange(dom) {
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
      this.mapGroup
        .transition()
        .duration(500)
        .attr(
          "transform",
          `translate(${translateX},${translateY}) scale(${zoomLevel})`
        );
      // this.mapGroup
      // .transition()
      // .duration(500)
      // .style(
      //   "transform",
      //   `translate(${translateX}px,${translateY}px) scale(${zoomLevel})`
      // );
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
          return this.villageSvg;
      }
    },
    getInfoFromDeep(deep) {
      const useDeep = deep === undefined ? this.deepVal : deep;
      switch (useDeep) {
        case 1:
          return this.countryInfo;
        case 2:
          return this.townInfo;
        case 3:
          return this.villageInfo;

        default:
          return {};
      }
    },
    focusMap(deep) {
      const useDeep = deep === undefined ? this.deepVal : deep;
      const foucsNode = this.mapGroup.select(".focus").node();
      if (foucsNode) this.mapGroup.select(".focus").remove();

      const path = d3.geoPath();
      let currInfo = this.getInfoFromDeep(useDeep);

      this.mapGroup
        .datum(currInfo.targetData)
        .append("path")
        .attr("d", path)
        .attr("stroke", "#FFFA76")
        .attr("fill", "none")
        .attr("class", "focus")
        // .attr("stroke-width", `0.${4 - this.deepVal}`);
        .attr("stroke-width", `0.4`);
    },
    getSelectionData(id) {
      if (!id) return;
      return fetch(`./data/selection/${id}.json`)
        .then((res) => res.json())
        .then((data) => {
          this.selectionData = this.selectionData.concat(data);
        })
        .catch(() => {});
    },
    calauteSelectionRate(id, data) {
      let cand_1 = 0;
      let cand_2 = 0;
      let cand_3 = 0;

      for (let i = 0; i < data.length; i++) {
        const { cand_info } = data[i];

        cand_1 += cand_info[0].tks_rate;
        cand_2 += cand_info[1].tks_rate;
        cand_3 += cand_info[2].tks_rate;
      }

      this.selectionInfo[id] = {
        cand_1: (cand_1 / data.length).toFixed(2),
        cand_2: (cand_2 / data.length).toFixed(2),
        cand_3: (cand_3 / data.length).toFixed(2),
      };

      this.$emit("updateSelectionInfo",this.selectionInfo) 
      const max = Math.max(...[cand_1, cand_2, cand_3]);

      if (max === 0) return "lightblue";
      if (max === cand_1) return "#00ffff";
      if (max === cand_2) return "rgb(118, 231, 176)";
      if (max === cand_3) return "rgb(118, 175, 237)";
    },
  },
  mounted() {
    window.addEventListener("resize", () => {
      this.initMap();
    });

    this.$nextTick(() => {
      this.initMap(true);
    });
  },
  template: `
  <svg class="tw-geo svelte-ul8skc" viewBox="0 0 960 910" ref="svg" preserveAspectRatio="xMidYMid meet"></svg>`,
};
