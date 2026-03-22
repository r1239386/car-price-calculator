/* Car Price Calculator
 * - Base price
 * - Deduction items (subtract)
 * - Addition items (add)
 * - User can add custom items with name + amount
 */

(() => {
  const $ = (id) => document.getElementById(id);

  const basePriceInput = $("basePrice");
  const deductionTbody = $("deductionTbody");
  const additionTbody = $("additionTbody");
  const deductionEmptyHint = $("deductionEmptyHint");
  const additionEmptyHint = $("additionEmptyHint");

  const deductionTotalEl = $("deductionTotal");
  const additionTotalEl = $("additionTotal");
  const afterDeductionsEl = $("afterDeductions");
  const afterAdditionsEl = $("afterAdditions");
  const grandTotalEl = $("grandTotal");

  const detailEl = $("detail");

  const addDeductionBtn = $("addDeductionBtn");
  const addAdditionBtn = $("addAdditionBtn");
  const makeAllInclusiveBtn = $("makeAllInclusiveBtn"); // 👈 新增這行
  const exportJpgBtn = $("exportJpgBtn");
  const printDetailBtn = $("printDetailBtn");

  const addDeductionModal = $("addDeductionModal");
  const dedOptDeposit = $("dedOptDeposit");
  const dedOptLoan = $("dedOptLoan");
  const dedOptOldCar = $("dedOptOldCar");
  const dedOptDownPayment = $("dedOptDownPayment");
  const dedOptRemittance = $("dedOptRemittance");
  const dedOptBlank = $("dedOptBlank");
  const dedDownPaymentDate = $("dedDownPaymentDate");
  const dedRemittanceDate = $("dedRemittanceDate");
  const addDeductionConfirmBtn = $("addDeductionConfirmBtn");

  const addAdditionModal = $("addAdditionModal");

  const openUsedCarTaxModalBtn = $("openUsedCarTaxModalBtn");
  const openNewCarTaxModalBtn = $("openNewCarTaxModalBtn");
  const usedCarTaxModal = $("usedCarTaxModal");
  const usedCarTaxModalTitle = $("usedCarTaxModalTitle");
  const usedCarTaxGiftBtn = $("usedCarTaxGiftBtn");
  const usedCarTaxConfirmBtn = $("usedCarTaxConfirmBtn");
  const uctVehicleType = $("uctVehicleType");
  const uctFuelType = $("uctFuelType");
  const uctRange = $("uctRange");
  const uctStartDate = $("uctStartDate");
  const uctEndDate = $("uctEndDate");
  const uctPaymentStatus = $("uctPaymentStatus");
  const uctPaymentStatusWrap = $("uctPaymentStatusWrap");

  const STORAGE_KEY = "carPriceCalculator.v1";

  // 台灣汽車稅金對照表 (年度總額)
  const TAX_DATA = {
    passenger: [
      { range: "500cc以下", license: 1620, fuelGas: 2160, fuelDiesel: 1296 },
      { range: "501-600cc", license: 2160, fuelGas: 2880, fuelDiesel: 1728 },
      { range: "601-1200cc", license: 4320, fuelGas: 4320, fuelDiesel: 2592 },
      { range: "1201-1800cc", license: 7120, fuelGas: 4800, fuelDiesel: 2880 },
      { range: "1801-2400cc", license: 11230, fuelGas: 6180, fuelDiesel: 3708 },
      { range: "2401-3000cc", license: 15210, fuelGas: 7200, fuelDiesel: 4320 },
      { range: "3001-4200cc", license: 28220, fuelGas: 8640, fuelDiesel: 5184 },
      { range: "4201-5400cc", license: 46170, fuelGas: 9810, fuelDiesel: 5886 },
      { range: "5401-6600cc", license: 69690, fuelGas: 11220, fuelDiesel: 6732 },
      { range: "6601-7800cc", license: 117000, fuelGas: 12180, fuelDiesel: 7308 },
      { range: "7801cc以上", license: 151200, fuelGas: 13080, fuelDiesel: 7848 },
    ],
    truck: [
      { range: "500cc以下", license: 900, fuelGas: 2160, fuelDiesel: 1296 },
      { range: "501-600cc", license: 1080, fuelGas: 2880, fuelDiesel: 1728 },
      { range: "601-1200cc", license: 1800, fuelGas: 4320, fuelDiesel: 2592 },
      { range: "1201-1800cc", license: 2700, fuelGas: 4800, fuelDiesel: 2880 },
      { range: "1801-2400cc", license: 3600, fuelGas: 7710, fuelDiesel: 4626 },
      { range: "2401-3000cc", license: 4500, fuelGas: 9900, fuelDiesel: 5940 },
      { range: "3001-3600cc", license: 5400, fuelGas: 11880, fuelDiesel: 7128 },
      { range: "3601-4200cc", license: 6300, fuelGas: 13500, fuelDiesel: 8100 },
      { range: "4201-4800cc", license: 7200, fuelGas: 15420, fuelDiesel: 9252 },
      { range: "4801-5400cc", license: 8100, fuelGas: 16740, fuelDiesel: 10044 },
      { range: "5401-6000cc", license: 9000, fuelGas: 18000, fuelDiesel: 10800 },
    ],
  };

  function toIsoLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isoToMmDd(iso) {
    const parts = String(iso || "").split("-");
    if (parts.length !== 3) return "";
    const [, m, d] = parts;
    return `${m}/${d}`;
  }

  /** 將 YYYY-MM-DD 轉為 YYYY/MM/DD */
  function isoToSlashDate(iso) {
    if (!iso || typeof iso !== "string") return "";
    return String(iso).replace(/-/g, "/");
  }

  /** 取得扣除項目類別權重：1訂金 2貸款 3估舊車 4頭期款 5匯款 6其他 */
  function getDeductionWeight(name) {
    const n = String(name ?? "").trim();
    if (n === "訂金") return 1;
    if (n === "貸款") return 2;
    if (n === "估舊車") return 3;
    if (n.includes("頭期款")) return 4;
    if (n.includes("匯款")) return 5;
    return 6;
  }

  /** 從名稱中提取 YYYY/MM/DD 格式日期，若無則回傳 null */
  function extractDateFromName(name) {
    const match = String(name ?? "").match(/\d{4}\/\d{2}\/\d{2}/);
    return match ? match[0] : null;
  }

  /** * 取得增加項目類別權重
   * 1 (過戶類)：過戶、領牌、選牌、代刻印章
   * 2 (稅金類)：稅金
   * 2 (保險類)：強制險、第三責任險
   * 3 (貸款類)：貸款、動保
   * 4 (常用配件)：行車記錄器、安卓機、避光墊、腳踏墊、胎壓偵測器、隔熱紙
   * 5 (其他)：其餘
   */
  function getAdditionWeight(name) {
    const n = String(name ?? "").trim();
    // 1. 過戶類
    if (
      n.includes("過戶") || 
      n.includes("領牌") || 
      n.includes("選牌") || 
      n.includes("代刻印章")
    ) {
      return 1;
    }
	// 2. 稅金類
    if (
	  n.includes("新車牌照") ||
	  n.includes("新車燃料") || 
      n.includes("稅金")
    ) {
      return 2;
    }
    // 3. 保險類
    if (n.includes("強制險") || n.includes("第三責任險")) {
      return 3;
    }
    // 4. 貸款類
    if (n.includes("貸款") || n.includes("動保")) {
      return 4;
    }
    // 5. 常用配件
    const accessories = ["行車記錄器", "安卓機", "避光墊", "腳踏墊", "胎壓偵測器", "隔熱紙"];
    if (accessories.some((a) => n.includes(a))) {
      return 5;
    }
    // 6. 其他
    return 6;
  }



  function daysInclusiveLocal(isoStart, isoEnd) {
    const [sy, sm, sd] = isoStart.split("-").map(Number);
    const [ey, em, ed] = isoEnd.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  }
  
  /** 取得該年份的總天數 (判斷閏年，牌照稅專用) */
	function getYearDays(isoDate) {
		if (!isoDate) return 365;
		const year = new Date(isoDate).getFullYear();
		const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
		return isLeap ? 366 : 365;
	}

	 /** 依照台灣監理站燃料費規則計算天數 (每月視為30天，一年360天) */
	function getFuelDays(isoStart, isoEnd) {
		const [y1, m1, d1_raw] = isoStart.split("-").map(Number);
		const [y2, m2, d2_raw] = isoEnd.split("-").map(Number);
		// 遇到 31 日強制當作 30 日計算
		const d1 = Math.min(30, d1_raw);
		const d2 = Math.min(30, d2_raw);
		return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1) + 1;
	}

  function populateUctRangeOptions() {
    if (!uctVehicleType || !uctRange) return;
    const key = uctVehicleType.value;
    const rows = TAX_DATA[key];
    uctRange.innerHTML = "";
    rows.forEach((row, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = row.range;
      uctRange.appendChild(opt);
    });
    const defaultIdx = rows.findIndex((r) => r.range === "1201-1800cc");
    uctRange.selectedIndex = defaultIdx >= 0 ? defaultIdx : 0;
  }

  let taxModalMode = "old"; // "old" | "new"

  function setCarTaxDefaultDates(mode) {
    if (!uctStartDate || !uctEndDate) return;
    const now = new Date();
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    if (mode === "old") {
      uctStartDate.value = toIsoLocalDate(jan1);
      uctEndDate.value = toIsoLocalDate(now);
    } else {
      uctStartDate.value = toIsoLocalDate(now);
      uctEndDate.value = toIsoLocalDate(dec31);
    }
  }

  function openCarTaxModal(mode) {
    if (!usedCarTaxModal) return;
    taxModalMode = mode;
    if (usedCarTaxModalTitle) {
      usedCarTaxModalTitle.textContent = mode === "old" ? "舊車稅金試算" : "新車稅金試算";
    }
    if (usedCarTaxGiftBtn) {
      usedCarTaxGiftBtn.style.display = "";
    }
    if (uctPaymentStatusWrap) {
      uctPaymentStatusWrap.style.display = mode === "old" ? "" : "none";
    }
    setCarTaxDefaultDates(mode);
    populateUctRangeOptions();
    usedCarTaxModal.hidden = false;
    usedCarTaxModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (mode === "old") updateOldCarTaxGiftButton();
    else if (mode === "new") updateNewCarTaxGiftButton();
  }

  function closeUsedCarTaxModal() {
    if (!usedCarTaxModal) return;
    usedCarTaxModal.hidden = true;
    usedCarTaxModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openAddDeductionModal() {
    if (!addDeductionModal) return;
    [dedOptDeposit, dedOptLoan, dedOptOldCar, dedOptDownPayment, dedOptRemittance, dedOptBlank].forEach(
      (el) => el && (el.checked = false)
    );
    const today = toIsoLocalDate(new Date());
    if (dedDownPaymentDate) {
      dedDownPaymentDate.value = today;
      dedDownPaymentDate.disabled = true;
    }
    if (dedRemittanceDate) {
      dedRemittanceDate.value = today;
      dedRemittanceDate.disabled = true;
    }
    addDeductionModal.hidden = false;
    addDeductionModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAddDeductionModal() {
    if (!addDeductionModal) return;
    addDeductionModal.hidden = true;
    addDeductionModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openAddAdditionModal() {
    if (!addAdditionModal) return;
    addAdditionModal.hidden = false;
    addAdditionModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAddAdditionModal() {
    if (!addAdditionModal) return;
    addAdditionModal.hidden = true;
    addAdditionModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function confirmAddDeduction() {
    const items = [];
    if (dedOptDeposit?.checked) {
      items.push({ name: "訂金", amount: 0 });
    }
    if (dedOptLoan?.checked) {
      items.push({ name: "貸款", amount: 0 });
    }
    if (dedOptOldCar?.checked) {
      items.push({ name: "估舊車", amount: 0 });
    }
    if (dedOptDownPayment?.checked) {
      const dateStr = dedDownPaymentDate?.value || toIsoLocalDate(new Date());
      items.push({ name: `頭期款(交付日期${isoToSlashDate(dateStr)})`, amount: 0 });
    }
    if (dedOptRemittance?.checked) {
      const dateStr = dedRemittanceDate?.value || toIsoLocalDate(new Date());
      items.push({ name: `匯款(匯款日期${isoToSlashDate(dateStr)})`, amount: 0 });
    }
    if (dedOptBlank?.checked) {
      items.push({ name: "", amount: 0 });
    }

    // 唯一性項目：送出前先移除舊有重複項目（匯款、空白不受影響）
    state.deductions = state.deductions.filter((item) => {
      const name = String(item.name ?? "").trim();
      if (dedOptDeposit?.checked && name === "訂金") return false;
      if (dedOptLoan?.checked && name === "貸款") return false;
      if (dedOptOldCar?.checked && name === "估舊車") return false;
      if (dedOptDownPayment?.checked && name.includes("頭期款")) return false;
      return true;
    });

    for (const it of items) {
      state.deductions.push({
        id: uid(),
        name: it.name,
        amount: it.amount,
      });
    }
    closeAddDeductionModal();
    renderList("deduction");
    recompute();
  }

/** 計算舊車稅金 B、A、Result，並回傳完整計算明細 */
  function calcOldCarTaxResult() {
    if (!uctStartDate || !uctEndDate || !uctVehicleType || !uctFuelType || !uctRange || !uctPaymentStatus)
      return null;
    const startVal = uctStartDate.value;
    const endVal = uctEndDate.value;
    if (!startVal || !endVal) return null;

    // 舊車稅金計算從該年 1/1 到過戶日(結束日)
    const year = Number(endVal.split("-")[0]);
    const jan1Iso = `${year}-01-01`;
    
    // 牌照用實際天數，燃料用監理站 30 日制
    const actualDays = daysInclusiveLocal(jan1Iso, endVal);
    const fuelDays = getFuelDays(jan1Iso, endVal);
    
    if (!Number.isFinite(actualDays) || actualDays < 1) return null;
    
    const vKey = uctVehicleType.value;
    const rowIdx = Number(uctRange.value);
    const rows = TAX_DATA[vKey];
    if (!rows || !rows[rowIdx]) return null;
    
    const row = rows[rowIdx];
    const annualFuel = uctFuelType.value === "gas" ? row.fuelGas : row.fuelDiesel;
    
    // 依監理站規則：無條件捨去(floor)、牌照看閏年、燃料用360天
    const yearDays = getYearDays(jan1Iso);
    const licensePro = Math.floor((row.license * actualDays) / yearDays);
    const fuelPro = Math.floor((annualFuel * fuelDays) / 360);
    const B = licensePro + fuelPro; // 應負擔總額
    
    const status = uctPaymentStatus.value;
    let A = 0;
    let paidDesc = "都沒繳(0)";
    if (status === "license") {
      A = row.license;
      paidDesc = `已繳牌照(${row.license})`;
    } else if (status === "fuel") {
      A = annualFuel;
      paidDesc = `已繳燃料(${annualFuel})`;
    } else if (status === "both") {
      A = row.license + annualFuel;
      paidDesc = `牌+燃皆繳(${A})`;
    }
    
    return {
      result: B - A,
      days: actualDays,
      fuelDays: fuelDays, // 傳出燃料專屬天數
      licensePro,
      fuelPro,
      totalPro: B,
      paidDesc
    };
  }

function updateOldCarTaxGiftButton() {
    if (taxModalMode !== "old" || !usedCarTaxGiftBtn) return;
    const calcObj = calcOldCarTaxResult();
    // 檢查回傳的物件是否存在且 result > 0
    usedCarTaxGiftBtn.disabled = calcObj === null || calcObj.result <= 0;
  }

  function updateNewCarTaxGiftButton() {
    if (taxModalMode !== "new" || !usedCarTaxGiftBtn) return;
    usedCarTaxGiftBtn.disabled = false;
  }

  function clearOldCarTaxItems() {
    state.deductions = state.deductions.filter((item) => !String(item.name ?? "").includes("舊車稅金"));
    state.additions = state.additions.filter((item) => !String(item.name ?? "").includes("舊車稅金"));
  }

  function clearNewCarTaxItems() {
    state.deductions = state.deductions.filter(
      (item) =>
        !String(item.name ?? "").includes("新車牌照稅") && !String(item.name ?? "").includes("新車燃料費")
    );
    state.additions = state.additions.filter(
      (item) =>
        !String(item.name ?? "").includes("新車牌照稅") && !String(item.name ?? "").includes("新車燃料費")
    );
  }

function confirmCarTax() {
    if (taxModalMode === "old") {
      const calcObj = calcOldCarTaxResult();
      if (calcObj === null) {
        alert("請確認已選擇日期、排氣量級距與繳納狀態。");
        return;
      }
      clearOldCarTaxItems();
      
      // 修改明細字串，清楚標示牌照與燃料的「不同天數」避免爭議
	  // 【修改後】：拿掉天數顯示
      const detailStr = `(牌照:${calcObj.licensePro} + 燃料:${calcObj.fuelPro} = ${calcObj.totalPro}，扣除${calcObj.paidDesc})`;

      if (calcObj.result < 0) {
        const absVal = Math.abs(calcObj.result);
        state.deductions.push({
          id: uid(),
          name: `舊車稅金溢繳 ${detailStr}：${absVal}`,
          amount: absVal,
        });
      } else if (calcObj.result > 0) {
        state.additions.push({
          id: uid(),
          name: `舊車稅金欠繳 ${detailStr}：${calcObj.result}`,
          amount: calcObj.result,
        });
      }
      renderList("deduction");
      renderList("addition");
      closeUsedCarTaxModal();
      recompute();
      return;
    }

    // --- 新車稅金邏輯 ---
    if (!uctStartDate || !uctEndDate || !uctVehicleType || !uctFuelType || !uctRange) return;
    const startVal = uctStartDate.value;
    const endVal = uctEndDate.value;
    if (!startVal || !endVal) {
      alert("請選擇開始與結束日期。");
      return;
    }
    const actualDays = daysInclusiveLocal(startVal, endVal);
    const fuelDays = getFuelDays(startVal, endVal);
    if (!Number.isFinite(actualDays) || actualDays < 1) {
      alert("請選擇有效的日期區間（結束日不可早於開始日）。");
      return;
    }
    const vKey = uctVehicleType.value;
    const rowIdx = Number(uctRange.value);
    const rows = TAX_DATA[vKey];
    if (!rows || !rows[rowIdx]) {
      alert("請選擇排氣量級距。");
      return;
    }
    const row = rows[rowIdx];
    const annualFuel = uctFuelType.value === "gas" ? row.fuelGas : row.fuelDiesel;
    
    // 無條件捨去與不同天數基底
    const yearDays = getYearDays(startVal);
    const licenseAmount = Math.floor((row.license * actualDays) / yearDays);
    const fuelAmount = Math.floor((annualFuel * fuelDays) / 360);
    const rangeLabel = `${isoToMmDd(startVal)}~${isoToMmDd(endVal)}`;

    state.additions = state.additions.filter(
      (item) =>
        !String(item.name ?? "").includes("新車牌照稅") &&
        !String(item.name ?? "").includes("新車燃料費")
    );
    state.additions.push(
		{ id: uid(), name: `新車牌照稅(${rangeLabel})`, amount: licenseAmount },
		{ id: uid(), name: `新車燃料費(${rangeLabel})`, amount: fuelAmount }
    );
    closeUsedCarTaxModal();
    renderList("addition");
    recompute();
  }

function confirmCarTaxGift() {
    if (taxModalMode === "old") {
      const calcObj = calcOldCarTaxResult();
      if (calcObj === null) {
        alert("請確認已選擇日期、排氣量級距與繳納狀態。");
        return;
      }
      if (calcObj.result <= 0) return;
      clearOldCarTaxItems();
      
      // 【修改後】：拿掉天數顯示
      const detailStr = `(牌照:${calcObj.licensePro} + 燃料:${calcObj.fuelPro} = ${calcObj.totalPro}，扣除${calcObj.paidDesc})`;

      state.additions.push({
        id: uid(),
        name: `(贈送)舊車稅金欠繳 ${detailStr}：${calcObj.result}`,
        amount: 0,
      });
    } else if (taxModalMode === "new") {
      if (!uctStartDate || !uctEndDate || !uctVehicleType || !uctFuelType || !uctRange) return;
      const startVal = uctStartDate.value;
      const endVal = uctEndDate.value;
      if (!startVal || !endVal) {
        alert("請選擇開始與結束日期。");
        return;
      }
      const actualDays = daysInclusiveLocal(startVal, endVal);
      const fuelDays = getFuelDays(startVal, endVal);
      if (!Number.isFinite(actualDays) || actualDays < 1) {
        alert("請選擇有效的日期區間（結束日不可早於開始日）。");
        return;
      }
      const vKey = uctVehicleType.value;
      const rowIdx = Number(uctRange.value);
      const rows = TAX_DATA[vKey];
      if (!rows || !rows[rowIdx]) {
        alert("請選擇排氣量級距。");
        return;
      }
      const row = rows[rowIdx];
      const annualFuel = uctFuelType.value === "gas" ? row.fuelGas : row.fuelDiesel;
      
      const yearDays = getYearDays(startVal);
      const licenseAmount = Math.floor((row.license * actualDays) / yearDays);
      const fuelAmount = Math.floor((annualFuel * fuelDays) / 360);
      const rangeLabel = `${isoToMmDd(startVal)}~${isoToMmDd(endVal)}`;

      clearNewCarTaxItems();
      state.additions.push(
		{ id: uid(), name: `(贈送)新車牌照稅(${rangeLabel}，價值:${licenseAmount})`, amount: 0 },
        { id: uid(), name: `(贈送)新車燃料費(${rangeLabel}，價值:${fuelAmount})`, amount: 0 }
      );
    } else {
      return;
    }
    renderList("deduction");
    renderList("addition");
    closeUsedCarTaxModal();
    recompute();
  }

  const moneyFormatter = new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 10,
  });

  function parseMoney(value) {
    if (value === null || value === undefined) return 0;
    const s = String(value).trim();
    if (!s) return 0;
    const normalized = s.replace(/,/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(n) {
    if (!Number.isFinite(n)) return "0";
    return moneyFormatter.format(n);
  }

  function uid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  const state = {
    basePrice: 215000,
    deductions: [
      { id: uid(), name: "訂金", amount: 15000 },
    ],
    additions: [],
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      if (typeof parsed.basePrice === "number") state.basePrice = parsed.basePrice;
      if (Array.isArray(parsed.deductions)) {
        state.deductions = parsed.deductions
          .map((x) => ({
            id: typeof x.id === "string" ? x.id : uid(),
            name: typeof x.name === "string" ? x.name : "",
            amount: typeof x.amount === "number" ? x.amount : parseMoney(x.amount),
          }))
          .slice(0, 200);
      }
      if (Array.isArray(parsed.additions)) {
        state.additions = parsed.additions
          .map((x) => ({
            id: typeof x.id === "string" ? x.id : uid(),
            name: typeof x.name === "string" ? x.name : "",
            amount: typeof x.amount === "number" ? x.amount : parseMoney(x.amount),
          }))
          .slice(0, 200);
      }
    } catch {
      // ignore
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore (e.g. storage quota)
    }
  }

  function calcSum(items) {
    return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }

  function recompute() {
    const base = Number(state.basePrice) || 0;
    const deductionSum = calcSum(state.deductions);
    const additionSum = calcSum(state.additions);

    const afterDed = base - deductionSum;
    const grand = afterDed + additionSum;

    deductionTotalEl.textContent = formatMoney(deductionSum);
    additionTotalEl.textContent = formatMoney(additionSum);
    afterDeductionsEl.textContent = formatMoney(afterDed);
    afterAdditionsEl.textContent = formatMoney(additionSum);
    grandTotalEl.textContent = formatMoney(grand);

    function renderSignedAmount(kind, amt) {
      const a = Number(amt) || 0;
      const abs = Math.abs(a) || 0;
      if (kind === "deduction") {
        const sign = a >= 0 ? "-" : "+";
        const cls = sign === "-" ? "amount-negative" : "amount-positive";
        return { text: `${sign}${formatMoney(abs)}`, cls };
      }
      const sign = a >= 0 ? "+" : "-";
      const cls = sign === "+" ? "amount-positive" : "amount-negative";
      return { text: `${sign}${formatMoney(abs)}`, cls };
    }

    function appendGroupTitle(text) {
      const el = document.createElement("div");
      el.className = "detail-group-title";
      el.textContent = text;
      detailEl.appendChild(el);
    }

    function appendDivider() {
      const el = document.createElement("div");
      el.className = "detail-divider";
      detailEl.appendChild(el);
    }

    function appendRow(label, amountText, amountClass) {
      const row = document.createElement("div");
      row.className = "detail-row";
      const left = document.createElement("div");
      left.className = "detail-label";
      left.textContent = label;
      const right = document.createElement("div");
      right.className = `detail-amount ${amountClass || ""}`;
      right.textContent = amountText;
      row.appendChild(left);
      row.appendChild(right);
      detailEl.appendChild(row);
    }

    function appendTotalRow(label, amountText) {
      const row = document.createElement("div");
      row.className = "detail-row detail-total-row";
      const left = document.createElement("div");
      left.className = "detail-label";
      left.textContent = label;
      const right = document.createElement("div");
      right.className = "detail-amount";
      right.textContent = amountText;
      row.appendChild(left);
      row.appendChild(right);
      detailEl.appendChild(row);
    }

    detailEl.innerHTML = "";
    appendRow("車價", formatMoney(base));

    const hasDeductions = state.deductions.length > 0;
    const hasAdditions = state.additions.length > 0;

    if (hasDeductions) {
      for (const d of state.deductions) {
        const amt = Number(d.amount) || 0;
        const name = d.name?.trim() ? d.name.trim() : "（未命名扣除）";
        const signed = renderSignedAmount("deduction", amt);
        appendRow(name, signed.text, signed.cls);
      }
    }

    if (hasAdditions) {
      if (hasDeductions) appendDivider();
      appendGroupTitle("");
      for (const a of state.additions) {
        const amt = Number(a.amount) || 0;
        const name = a.name?.trim() ? a.name.trim() : "（未命名增加）";
        const signed = renderSignedAmount("addition", amt);
        appendRow(name, signed.text, signed.cls);
      }
    }

    if (!hasDeductions && !hasAdditions) {
      appendRow("目前沒有明細項目", formatMoney(0), "amount-positive");
    }

    appendDivider();
    const totalLabel = grand >= 0 ? "應收金額" : "應退金額(因貸款金額≥車價)";
    const totalAmount = grand >= 0 ? grand : Math.abs(grand);
    appendTotalRow(totalLabel, formatMoney(totalAmount));

    save();
  }

  function renderList(kind) {
    const tbody = kind === "deduction" ? deductionTbody : additionTbody;
    const items = kind === "deduction" ? state.deductions : state.additions;

    // 排序與穩定性標記
    items.forEach((item, i) => {
      item._sortIdx = i;
    });

    if (kind === "deduction") {
      state.deductions.sort((a, b) => {
        const wa = getDeductionWeight(a.name);
        const wb = getDeductionWeight(b.name);
        if (wa !== wb) return wa - wb;
        const da = extractDateFromName(a.name);
        const db = extractDateFromName(b.name);
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return a._sortIdx - b._sortIdx;
      });
    }

    if (kind === "addition") {
      state.additions.sort((a, b) => {
        const wa = getAdditionWeight(a.name);
        const wb = getAdditionWeight(b.name);
        if (wa !== wb) return wa - wb;
        // 權重相同則依據原本陣列順序 (穩定排序)
        return a._sortIdx - b._sortIdx;
      });
    }

    // 移除輔助排序屬性
    items.forEach((item) => delete item._sortIdx);

    tbody.innerHTML = "";
    if (kind === "deduction") deductionEmptyHint.style.display = items.length ? "none" : "block";
    if (kind === "addition") additionEmptyHint.style.display = items.length ? "none" : "block";

    for (const item of items) {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.style.width = "44%";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = item.name || "";
      nameInput.placeholder = kind === "deduction" ? "自訂扣除" : "自訂增加";
      // 修改後的名稱輸入邏輯
      nameInput.addEventListener("input", () => {
        item.name = nameInput.value;
        // 僅即時更新下方的明細與總價，不要重繪列表
        recompute();
      });

      // 新增：當離開輸入框時，才根據名稱重新排序並渲染列表
      nameInput.addEventListener("blur", () => {
        renderList(kind);
      });
      tdName.appendChild(nameInput);

      const tdAmount = document.createElement("td");
      tdAmount.style.width = "34%";
      const amountInput = document.createElement("input");
      amountInput.type = "text";
      amountInput.inputMode = "decimal";
      amountInput.value = String(item.amount ?? 0);
      amountInput.placeholder = "例如：15000";
      amountInput.addEventListener("input", () => {
        item.amount = parseMoney(amountInput.value);
        recompute();
      });
      tdAmount.appendChild(amountInput);

      const tdOp = document.createElement("td");
      tdOp.style.width = "22%";
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "移除";
      removeBtn.addEventListener("click", () => {
        const arr = kind === "deduction" ? state.deductions : state.additions;
        const idx = arr.findIndex((x) => x.id === item.id);
        if (idx >= 0) arr.splice(idx, 1);
        renderList(kind);
        recompute();
      });
      tdOp.appendChild(removeBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdAmount);
      tr.appendChild(tdOp);
      tbody.appendChild(tr);
    }
  }

  // Events
  basePriceInput.addEventListener("input", () => {
    state.basePrice = parseMoney(basePriceInput.value);
    recompute();
  });

  addDeductionBtn.addEventListener("click", openAddDeductionModal);
  addAdditionBtn.addEventListener("click", openAddAdditionModal);

  if (addAdditionModal) {
    // 點擊背景關閉 Modal
    addAdditionModal.querySelectorAll("[data-addition-modal-dismiss]").forEach((el) => {
      el.addEventListener("click", closeAddAdditionModal);
    });

    // 綁定所有「快捷按鈕」的點擊事件
    addAdditionModal.querySelectorAll(".addition-quick-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-name") ?? "";
        const amount = Number(btn.getAttribute("data-amount")) || 0;

        // 🌟 升級版防重複檢查：檢查是否存在相同的名稱，或是已經變成 (辦到好) / (贈送) 的相同項目
        const exists = state.additions.some((existingItem) => {
          if (existingItem.name === "" || name === "") return false; // 空白項目不阻擋
          const n = existingItem.name;
          return (
            n === name || 
            n.includes(`(辦到好)${name}`) || 
            n.includes(`(贈送)${name}`)
          );
        });

        if (!exists || name === "") {
          state.additions.push({
            id: uid(),
            name: name,
            amount: amount,
          });
        }

        // 更新畫面並自動關閉 Modal
        renderList("addition");
        recompute();
        closeAddAdditionModal();
      });
    });

    // 按下 ESC 鍵可關閉 Modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && addAdditionModal && !addAdditionModal.hidden) closeAddAdditionModal();
    });
  }

  if (addDeductionModal) {
    addDeductionModal.querySelectorAll("[data-deduction-modal-dismiss]").forEach((el) => {
      el.addEventListener("click", closeAddDeductionModal);
    });
    if (addDeductionConfirmBtn) addDeductionConfirmBtn.addEventListener("click", confirmAddDeduction);
    if (dedOptDownPayment) {
      dedOptDownPayment.addEventListener("change", () => {
        if (dedDownPaymentDate) {
          dedDownPaymentDate.disabled = !dedOptDownPayment.checked;
          if (dedOptDownPayment.checked && !dedDownPaymentDate.value) {
            dedDownPaymentDate.value = toIsoLocalDate(new Date());
          }
        }
      });
    }
    if (dedOptRemittance) {
      dedOptRemittance.addEventListener("change", () => {
        if (dedRemittanceDate) {
          dedRemittanceDate.disabled = !dedOptRemittance.checked;
          if (dedOptRemittance.checked && !dedRemittanceDate.value) {
            dedRemittanceDate.value = toIsoLocalDate(new Date());
          }
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && addDeductionModal && !addDeductionModal.hidden) closeAddDeductionModal();
    });
  }

  if (usedCarTaxModal) {
    if (openUsedCarTaxModalBtn) openUsedCarTaxModalBtn.addEventListener("click", () => openCarTaxModal("old"));
    if (openNewCarTaxModalBtn) openNewCarTaxModalBtn.addEventListener("click", () => openCarTaxModal("new"));
    usedCarTaxModal.querySelectorAll("[data-modal-dismiss]").forEach((el) => {
      el.addEventListener("click", closeUsedCarTaxModal);
    });
    if (usedCarTaxConfirmBtn) usedCarTaxConfirmBtn.addEventListener("click", confirmCarTax);
    if (usedCarTaxGiftBtn) usedCarTaxGiftBtn.addEventListener("click", confirmCarTaxGift);
    if (uctVehicleType) {
      uctVehicleType.addEventListener("change", () => {
        populateUctRangeOptions();
        updateOldCarTaxGiftButton();
      });
    }
    [uctEndDate, uctFuelType, uctRange, uctPaymentStatus].forEach((el) => {
      if (el) el.addEventListener("change", updateOldCarTaxGiftButton);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && usedCarTaxModal && !usedCarTaxModal.hidden) closeUsedCarTaxModal();
    });
  }

  function init() {
    load();
    basePriceInput.value = String(state.basePrice);
    renderList("deduction");
    renderList("addition");
    recompute();
  }

// 取代原本的 drawWrappedText，這個新函式負責精準切割字串並回傳陣列
  function splitTextIntoLines(ctx, text, maxWidth) {
    const chars = Array.from(text || "");
    if (chars.length === 0) return [];
    const lines = [];
    let current = "";
    for (const ch of chars) {
      const next = current + ch;
      // 如果加上下一個字元會超出寬度，就把目前的字串存成一行
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines; // 解除原本最多只能印 3 行的限制
  }

  // 升級版的 JPG 輸出邏輯，支援動態高度計算
  async function exportDetailAsJpg() {
    if (!exportJpgBtn) return;
    const oldText = exportJpgBtn.textContent;
    exportJpgBtn.disabled = true;
    exportJpgBtn.textContent = "輸出中...";
    try {
      const canvasWidthCss = 400;
      const scale = 3; 
      const paddingX = 35;
      const leftX = paddingX;
      const rightX = canvasWidthCss - paddingX;
      const topY = 80;
      // 稍微放寬文字區域，讓一行可以塞多一點字
      const maxLabelWidth = 200; 
      const h3 = document.querySelector(".breakdown-title");
      const title = (h3?.textContent || "明細").trim();
      
      const children = Array.from(detailEl.children);
      
      // 1. 預先計算總高度與每一列需要的高度
      const dummyCanvas = document.createElement("canvas");
      const dummyCtx = dummyCanvas.getContext("2d");
      let heightCss = topY;
      const rowHeights = [];
      const rowLines = [];

      for (const el of children) {
        if (el.classList.contains("detail-divider")) {
          heightCss += 18;
          rowHeights.push(18);
          rowLines.push([]);
        } else if (el.classList.contains("detail-group-title")) {
          heightCss += 35;
          rowHeights.push(35);
          rowLines.push([]);
        } else if (el.classList.contains("detail-total-row")) {
          heightCss += 70;
          rowHeights.push(70);
          rowLines.push([]);
        } else {
          // 一般明細列：動態計算折行次數來決定高度
          const labelEl = el.querySelector(".detail-label");
          const labelText = (labelEl?.textContent || "").trim();
          dummyCtx.font = "800 18px Microsoft JhengHei, Segoe UI, Arial, sans-serif";
          const lines = splitTextIntoLines(dummyCtx, labelText, maxLabelWidth);
          const lineCount = Math.max(1, lines.length);
          // 基礎高度 26 + (行數 * 24)。若只有1行就是 50px，2行就是 74px
          const h = 26 + (lineCount * 24); 
          heightCss += h;
          rowHeights.push(h);
          rowLines.push(lines);
        }
      }
      heightCss += 40; // 底部留白

      // 2. 建立正式 Canvas，使用剛才算出的精準高度
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(canvasWidthCss * scale);
      canvas.height = Math.floor(heightCss * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidthCss, heightCss);
      
      // 畫標題與頂部分隔線
      ctx.fillStyle = "#1f2330";
      ctx.font = "800 28px Microsoft JhengHei, Segoe UI, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(title, leftX, 30);
      ctx.strokeStyle = "#e7e5ef";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX, 65);
      ctx.lineTo(rightX, 65);
      ctx.stroke();
      
      const COLOR_MUTED = "#6b7280";
      const COLOR_NEG = "#ef4444";
      const COLOR_POS = "#0f766e";
      const COLOR_TOTAL = "#4f46e5";
      const COLOR_TEXT = "#1f2330";
      
      let y = topY;
      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        const h = rowHeights[i];
        const lines = rowLines[i];

        if (el.classList.contains("detail-divider")) {
          ctx.strokeStyle = "#e7e5ef";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(leftX, y + 5);
          ctx.lineTo(rightX, y + 5);
          ctx.stroke();
          y += h;
          continue;
        }
        if (el.classList.contains("detail-group-title")) {
          ctx.fillStyle = COLOR_MUTED;
          ctx.font = "800 16px Microsoft JhengHei, Segoe UI, Arial, sans-serif";
          ctx.fillText(el.textContent.trim(), leftX, y);
          y += h;
          continue;
        }

        const amountEl = el.querySelector(".detail-amount");
        const amountText = (amountEl?.textContent || "").trim();
        const isTotal = el.classList.contains("detail-total-row");
        const amountFontSize = isTotal ? 24 : 20;
        const labelFontSize = isTotal ? 20 : 18;
        
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillStyle = isTotal ? COLOR_TEXT : COLOR_MUTED;
        ctx.font = `800 ${labelFontSize}px Microsoft JhengHei, Segoe UI, Arial, sans-serif`;
        
        if (isTotal) {
           const labelEl = el.querySelector(".detail-label");
           ctx.fillText((labelEl?.textContent || "").trim(), leftX, y + 5);
        } else {
           // 根據算好的陣列一行一行畫出來
           for (let j = 0; j < lines.length; j++) {
             ctx.fillText(lines[j], leftX, y + 5 + j * 24);
           }
        }
        
        ctx.textAlign = "right";
        const hasNeg = amountEl?.classList?.contains("amount-negative");
        const hasPos = amountEl?.classList?.contains("amount-positive");
        let amountColor = COLOR_TEXT;
        if (isTotal) amountColor = COLOR_TOTAL;
        else if (hasNeg) amountColor = COLOR_NEG;
        else if (hasPos) amountColor = COLOR_POS;
        
        ctx.fillStyle = amountColor;
        ctx.font = `900 ${amountFontSize}px Microsoft JhengHei, Segoe UI, Arial, sans-serif`;
        // 金額對齊該項目的第一行高度
        ctx.fillText(amountText, rightX, y + 8); 
        
        y += h; // 往下移動該項目專屬的動態高度
      }
      
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "car-price-detail.jpg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert("輸出失敗：" + e.message);
    } finally {
      exportJpgBtn.disabled = false;
      exportJpgBtn.textContent = oldText;
    }
  }



  function printDetail() {
    recompute();
    window.print();
  }
  
  // 🌟 一鍵辦到好 邏輯
  function applyAllInclusive() {
    // 這裡設定會被自動轉換的目標關鍵字
    const targets = ["新車牌照", "新車燃料", "代刻印章", "過戶手續費", "領牌費", "強制險"];
    let changed = false;

    state.additions.forEach((item) => {
      const n = item.name || "";
      
      // 如果這個項目已經是 (辦到好) 或 (贈送)，就跳過不要重複加上去
      if (n.includes("(辦到好)") || n.includes("(贈送)")) return;

      // 檢查這個項目的名稱是否有包含我們的目標關鍵字
      const isTarget = targets.some((t) => n.includes(t));
      
      if (isTarget) {
        // 變更名稱並將金額歸零
        item.name = `(辦到好)${n}(價值:${item.amount})`;
        item.amount = 0;
        changed = true;
      }
    });

    if (changed) {
      renderList("addition");
      recompute();
    } else {
      alert("目前清單中沒有符合「辦到好」條件的項目 (例如：新車稅金、代刻印章、過戶、領牌、強制險)。");
    }
  }

  if (makeAllInclusiveBtn) makeAllInclusiveBtn.addEventListener("click", applyAllInclusive);

  init();
  if (exportJpgBtn) exportJpgBtn.addEventListener("click", exportDetailAsJpg);
  if (printDetailBtn) printDetailBtn.addEventListener("click", printDetail);
})();