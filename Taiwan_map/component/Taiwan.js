import {
  assignValue,
  getBBoxCenter,
  getPartyColorBySupport,
  getTransform,
} from "../utils.js";

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
    loading: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "updateDeep",
    "getLocationData",
    "updateAddress",
    "updateSelectionInfo",
    "update:loading",
  ],
  data() {
    return {
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
      d3Svg: "",
      countrySvg: "",
      mapGroup: "",
      townSvg: "",
      villageSvg: "",
      areaData: "",
      villageData: "",
      villageDataList: {},
      isMapClick: false,
      maxDeep: 3,
      selectionData: [],
      selectionInfo: {},
      zoom: null,
      isMouseDown: false,
      allowZoom: true,
      maxDeep: 0,
    };
  },
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

      this.$emit("updateDeep", 0); //reset map
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

        for (let i = 0; i < counties.geometries.length; i++) {
          await this.getSelectionData(counties.geometries[i].id);
        }
        this.appendMap(0);
      }
      this.moveMapInCenter();
    },
    initD3js() {
      if (!this.zoom) {
        this.zoom = d3
          .zoom()
          .scaleExtent([1, 30])
          .on("zoom", (d, data) => {
            if (this.deepVal > 0 || this.allowZoom) {
              this.zoomed(d, data);
            }
          });
        this.d3Svg.call(this.zoom);
      }
    },
    zoomed(event) {
      const { transform } = event;
      const { x, y, k } = transform;

      this.mapGroup.attr("transform", `translate(${x},${y}) scale(${k})`);
      this.mapGroup.attr("stroke-width", 1 / transform.k);
    },
    moveMapInCenter() {
      const dom = this.mapGroup.node();
      const { zoomLevel } = getBBoxCenter(this.mapGroup.node());
      const { translateX, translateY } = getTransform(dom, zoomLevel);

      // 应用过渡效果
      this.d3Svg
        .transition()
        .duration(500)
        .call(
          this.zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(zoomLevel)
        )
        .on("end", () => {
          this.allowZoom = false;
          this.$emit("update:loading", false);
        });
    },
    getMapData(id) {
      let url = "./data/topoJson/towns-mercator.json";
      if (id) {
        if (this.villageDataList[id]) return this.villageDataList[id];
        this.$emit("update:loading", true);
        url = `./data/topoJson/tw-village/${id}.json`;
      }

      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (id) {
            this.villageDataList[id] = data;
            this.$emit("update:loading", false);
          }

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

      if (type === "find") {
        if (deep === 0) return data.find((item) => item.id.includes(id));
        if (deep === 1) return data.find((item) => item.id.includes(id));
        if (deep === 2)
          return data.find((item) => item.properties.VILLCODE.includes(id));
      }

      if (deep === 0) return data;
      if (deep === 1)
        return data.filter((item) => item.id.slice(0, id.length).includes(id));
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
        .attr("stroke-width", `0.${deep === 0 ? 3 : 1}`)
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
    },
    updateDeepVal(newDeep, oldDeep) {
      console.log("newDeep", newDeep, "oldDeep", oldDeep);
      if (newDeep > 0 || oldDeep > newDeep) {
        this.removeChild(newDeep, oldDeep);
      }
      const currInfo = this.getInfoFromDeep(newDeep);
      this.focusMap();
      this.$emit("getLocationData", currInfo);

      if (newDeep < 3) {
        this.appendMap(newDeep, currInfo.id);
      }
      if (newDeep === 0) {
        this.allowZoom = true;
        this.moveMapInCenter();
      } else {
        this.moveMap(currInfo.targetData);
      }
    },
    removeChild(newDeep, oldDeep) {
      if (newDeep === 3 && oldDeep === 3) return;

      const delNode = (deep) => {
        const dom = this.getDomFromDeep(deep);
        dom.selectAll("path").remove();
      };
      if (newDeep === oldDeep) {
        // 同層移動
        delNode(newDeep);
      } else if (oldDeep > newDeep) {
        /**
         * 不同層移動(里=>縣 or 區=>里)
         * 子層的點擊需要全部清空，父
         * 層的點擊僅須返回一層
         */
        while (oldDeep > newDeep) {
          delNode(oldDeep);
          oldDeep--;
        }
      }
    },
    moveMap(data) {
      const path = d3.geoPath();
      /**
       * (x0, y0) 可以代表左上或左下
       * (x1, y1) 可以代表右上或右下
       *
       * x1 - x0 物件寬
       * y1 - y0 物件高
       */
      const [[x0, y0], [x1, y1]] = path.bounds(data);
      const { innerWidth, innerHeight } = window;
      // 计算新的 transform
      const scale = Math.min(
        30, // 最大縮放尺寸限制
        0.9 / Math.max((x1 - x0) / innerWidth, (y1 - y0) / innerHeight)
      );

      const translateX = innerWidth / 2 - (scale * (x0 + x1)) / 2;
      const translateY = innerHeight / 2 - (scale * (y0 + y1)) / 2;

      // 应用过渡效果
      this.d3Svg
        .transition()
        .duration(500)
        .call(
          this.zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
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
        .attr("stroke-width", `0.${4 - useDeep}`);
      // .attr("stroke-width", `0.4`);
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
      let cand_1 = 0; // 民眾黨
      let cand_2 = 0; // 民進黨
      let cand_3 = 0; // 國民黨

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

      this.$emit("updateSelectionInfo", this.selectionInfo);
      const max = Math.max(...[cand_1, cand_2, cand_3]);

      if (max === 0) return "lightblue";
      if (max === cand_1) return "#00ffff";
      if (max === cand_2)
        return getPartyColorBySupport(2, (cand_2 / data.length).toFixed(2));
      if (max === cand_3)
        return getPartyColorBySupport(3, (cand_3 / data.length).toFixed(2));
    },
  },
  mounted() {
    window.addEventListener("resize", async () => {
      this.allowZoom = true;
      this.initMap();

      const length = this.deepVal;
      for (let i = 0; i <= length; i++) {
        this.$emit("updateDeep", i);
        await this.$nextTick();
      }
    });

    this.$nextTick(() => {
      this.initMap(true);
      this.initD3js();
    });
  },
  template: `<svg ref="svg" ></svg>`,
};
