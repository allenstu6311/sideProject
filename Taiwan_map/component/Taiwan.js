import Taoyuan from "./Taoyuan/towns.js";
import NewTaipei from "./NewTaipei/towns.js";
import Kaohsiung from "./Kaohsiung/towns.js";
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
      countryList: {},
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
    };
  },
  computed: {},
  watch: {
    deepVal(newVal, oldVal) {
      this.updateDeepVal(newVal, oldVal);
    },
    currAddress(val) {
      this.$emit("updateAddress", val);
    },
    // 父層查詢事件
    searchParam(param) {
      // let deep = this.deepVal || 1;
      // const { idList } = param;
      // console.log("idList", idList);

      // for (let i = deep; i < idList.length; i++) {
      //   this.handleEvent(idList[i], i + 1);
      // }
      let deep = 1;
      param.idList.forEach((id) => {
        this.handleEvent(id, deep);
        deep++;
      });
    },
  },
  methods: {
    initMap() {
      const { map, svg } = this.$refs;
      const { innerWidth, innerHeight } = window;
      svg.setAttribute(
        "viewBox",
        `0 0 ${innerWidth > 400 ? innerWidth : 400} ${innerHeight}`
      );

      const { centerX, centerY } = getBBoxCenter(map);

      const translateX = innerWidth / 2 - centerX;
      const translateY = innerHeight / 2 - centerY;

      this.moveMap(translateX, translateY);
    },
    updateDeepVal(newVal, oldVal) {
      // console.log("newVal", newVal, "oldVal", oldVal);
      const { towns, villages, map } = this.$refs;

      switch (newVal) {
        case 0:
          this.initMap();
          this.removeChild(towns);
          map.removeChild(this.focusDom);
          this.focusDom = "";
          break;
        case 1:
          this.focusMap(this.countryInfo.dom);
          this.$emit("getLocationData", this.countryInfo);
          if (oldVal > newVal) {
            this.moveMap(this.position.x, this.position.y, this.position.scale);
            this.removeChild(villages);
          }
          break;
        case 2:
          this.$emit("getLocationData", this.townInfo);
          this.focusMap(this.townInfo.dom);

          break;
        case 3:
          this.$emit("getLocationData", this.villageInfo);
          this.focusMap(this.villageInfo.dom);
          break;
      }
    },
    removeChild(parent) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
    },
    moveMap(translateX, translateY, scale = 1) {
      const { map } = this.$refs;

      map.style.transform = `translate(${translateX}px,${translateY}px) scale(${scale})`;
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
      const dom = document.getElementById(id)?.children[0];
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
        this.insertMap(deep === 1 ? towns : villages, template);
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
    const { country, map } = this.$refs;
    this.addEvent(country, 1);

    window.addEventListener("resize", () => {
      this.initMap();
    });
    this.countryList = {
      68000: Taoyuan,
      65000: NewTaipei,
      64000: Kaohsiung,
    };

    this.$nextTick(() => {
      this.initMap();
    });
  },
  template: `
     <svg class="tw-geo svelte-ul8skc" viewBox="0 0 960 910" ref="svg" preserveAspectRatio="xMidYMid meet">
      <g class="map-container">
        <g
          class="map-group"
          stroke-width="0.5"
          transform="translate(0,0) scale(1)"
          ref="map"
          shape-rendering="crispEdges"
          vector-effect="non-scaling-stroke"
        >
          <g class="county" ref="country">
            <use xlink:href="#64000"></use>
            <use xlink:href="#09007"></use>
            <use xlink:href="#10013"></use>
            <use xlink:href="#10015"></use>
            <use xlink:href="#10018"></use>
            <use xlink:href="#10014"></use>
            <use xlink:href="#66000"></use>
            <use xlink:href="#10010"></use>
            <use xlink:href="#68000"></use>
            <use xlink:href="#10008"></use>
            <use xlink:href="#10009"></use>
            <use xlink:href="#10016"></use>
            <use xlink:href="#67000"></use>      
            <use xlink:href="#63000"></use>
            <use xlink:href="#10007"></use>         
            <use xlink:href="#10004"></use>
            <use xlink:href="#10020"></use>
            <use xlink:href="#10017"></use>
            <use xlink:href="#10005"></use>
            <use xlink:href="#10002"></use>
            <use xlink:href="#65000"></use>
            <use xlink:href="#9020"></use>
          </g>
          <g class="selected-county-towns" ref="towns"></g>
          <g class="selected-town-villages" ref="villages"></g>
        </g>
      </g>
      <defs>
        <pattern
          id="tpp-pattern"
          x="0"
          y="0"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="2" fill="#fff" opacity="0.5"></circle>
        </pattern>
      </defs>
    </svg>`,
};
