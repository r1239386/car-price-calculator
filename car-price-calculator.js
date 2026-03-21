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
  const exportJpgBtn = $("exportJpgBtn");
  const printDetailBtn = $("printDetailBtn");

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

  function daysInclusiveLocal(isoStart, isoEnd) {
    const [sy, sm, sd] = isoStart.split("-").map(Number);
    const [ey, em, ed] = isoEnd.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
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

  /** 計算舊車稅金 B、A、Result，僅在 mode=old 時使用 */
  function calcOldCarTaxResult() {
    if (!uctStartDate || !uctEndDate || !uctVehicleType || !uctFuelType || !uctRange || !uctPaymentStatus)
      return null;
    const endVal = uctEndDate.value;
    if (!endVal) return null;
    const year = Number(endVal.split("-")[0]);
    const jan1Iso = `${year}-01-01`;
    const days = daysInclusiveLocal(jan1Iso, endVal);
    if (!Number.isFinite(days) || days < 1) return null;
    const vKey = uctVehicleType.value;
    const rowIdx = Number(uctRange.value);
    const rows = TAX_DATA[vKey];
    if (!rows || !rows[rowIdx]) return null;
    const row = rows[rowIdx];
    const annualFuel = uctFuelType.value === "gas" ? row.fuelGas : row.fuelDiesel;
    const B = Math.round((row.license / 365) * days) + Math.round((annualFuel / 365) * days);
    const status = uctPaymentStatus.value;
    let A = 0;
    if (status === "license") A = row.license;
    else if (status === "fuel") A = annualFuel;
    else if (status === "both") A = row.license + annualFuel;
    return B - A;
  }

  function updateOldCarTaxGiftButton() {
    if (taxModalMode !== "old" || !usedCarTaxGiftBtn) return;
    const result = calcOldCarTaxResult();
    usedCarTaxGiftBtn.disabled = result === null || result <= 0;
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
      const result = calcOldCarTaxResult();
      if (result === null) {
        alert("請確認已選擇日期、排氣量級距與繳納狀態。");
        return;
      }
      clearOldCarTaxItems();
      if (result < 0) {
        const absVal = Math.abs(result);
        state.deductions.push({
          id: uid(),
          name: `舊車稅金溢繳：${absVal}`,
          amount: absVal,
        });
      } else if (result > 0) {
        state.additions.push({
          id: uid(),
          name: `舊車稅金欠繳：${result}`,
          amount: result,
        });
      }
      renderList("deduction");
      renderList("addition");
      closeUsedCarTaxModal();
      recompute();
      return;
    }

    if (!uctStartDate || !uctEndDate || !uctVehicleType || !uctFuelType || !uctRange) return;
    const startVal = uctStartDate.value;
    const endVal = uctEndDate.value;
    if (!startVal || !endVal) {
      alert("請選擇開始與結束日期。");
      return;
    }
    const days = daysInclusiveLocal(startVal, endVal);
    if (!Number.isFinite(days) || days < 1) {
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
    const licenseAmount = Math.round((row.license / 365) * days);
    const fuelAmount = Math.round((annualFuel / 365) * days);
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
      const result = calcOldCarTaxResult();
      if (result === null) {
        alert("請確認已選擇日期、排氣量級距與繳納狀態。");
        return;
      }
      if (result <= 0) return;
      clearOldCarTaxItems();
      state.additions.push({
        id: uid(),
        name: `(贈送)舊車稅金欠繳：${result}`,
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
      const days = daysInclusiveLocal(startVal, endVal);
      if (!Number.isFinite(days) || days < 1) {
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
      const licenseAmount = Math.round((row.license / 365) * days);
      const fuelAmount = Math.round((annualFuel / 365) * days);
      const rangeLabel = `${isoToMmDd(startVal)}~${isoToMmDd(endVal)}`;

      clearNewCarTaxItems();
      state.additions.push(
        { id: uid(), name: `(贈送)新車牌照稅(${rangeLabel})`, amount: 0 },
        { id: uid(), name: `(贈送)新車燃料費(${rangeLabel})`, amount: 0 }
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
    // Accept commas: "215,000" => "215000"
    const normalized = s.replace(/,/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(n) {
    if (!Number.isFinite(n)) return "0";
    // For display, keep it readable and avoid trailing ".0" for integers.
    // Intl may show decimals if input had decimals; that's okay.
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

      // Deductions are subtracted from base.
      // - If user enters positive deduction amount: it will show as "-$X" (negative).
      // - If user enters negative deduction amount: it will effectively add, show as "+$X".
      if (kind === "deduction") {
        const sign = a >= 0 ? "-" : "+";
        const cls = sign === "-" ? "amount-negative" : "amount-positive";
        return { text: `${sign}${formatMoney(abs)}`, cls };
      }

      // Additions are added to base.
      // - If user enters positive addition amount: show "+$X".
      // - If user enters negative addition amount: show "-$X".
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

    // First show base car price (matching the screenshot)
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

    // Clear
    tbody.innerHTML = "";

    // Empty hints
    if (kind === "deduction") deductionEmptyHint.style.display = items.length ? "none" : "block";
    if (kind === "addition") additionEmptyHint.style.display = items.length ? "none" : "block";

    for (const item of items) {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.style.width = "44%";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = item.name || "";
      nameInput.placeholder = kind === "deduction" ? "例如：訂金" : "例如：稅金";
      nameInput.addEventListener("input", () => {
        item.name = nameInput.value;
        recompute();
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

  function addItem(kind) {
    const arr = kind === "deduction" ? state.deductions : state.additions;
    const newItem = {
      id: uid(),
      // Default name should be blank (show placeholder), as requested.
      name: "",
      amount: 0,
    };
    arr.push(newItem);
    renderList(kind);
    recompute();
  }

  // Events
  basePriceInput.addEventListener("input", () => {
    state.basePrice = parseMoney(basePriceInput.value);
    recompute();
  });

  addDeductionBtn.addEventListener("click", () => addItem("deduction"));
  addAdditionBtn.addEventListener("click", () => addItem("addition"));

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

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    // Simple character-based wrapping for Chinese/compact UIs.
    const chars = Array.from(text || "");
    if (chars.length === 0) return;

    const lines = [];
    let current = "";

    for (const ch of chars) {
      const next = current + ch;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = next;
      }
      if (lines.length >= 3) break;
    }
    if (lines.length < 3 && current) lines.push(current);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }

async function exportDetailAsJpg() {
    if (!exportJpgBtn) return;

    const oldText = exportJpgBtn.textContent;
    exportJpgBtn.disabled = true;
    exportJpgBtn.textContent = "輸出中...";

    try {
      // --- 核心佈局修改 ---
      const canvasWidthCss = 400; // 寬度從 820 縮小到 400，讓兩側更靠近
      const scale = 3; 
      const paddingX = 35;  // 左右邊距縮小，空間利用率更高
      const leftX = paddingX;
      const rightX = canvasWidthCss - paddingX;
      const topY = 80;
      const maxLabelWidth = 180; // 限制文字寬度，避免撞到數字

      const h3 = document.querySelector(".breakdown-title");
      const title = (h3?.textContent || "明細").trim();

      // 計算總高度
      let heightCss = topY;
      const children = Array.from(detailEl.children);
      for (const el of children) {
        if (el.classList.contains("detail-divider")) heightCss += 18;
        else if (el.classList.contains("detail-group-title")) heightCss += 35;
        else if (el.classList.contains("detail-total-row")) heightCss += 70;
        else heightCss += 50; 
      }
      heightCss += 40;

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(canvasWidthCss * scale);
      canvas.height = Math.floor(heightCss * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = false;

      // 背景
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidthCss, heightCss);

      // 標題
      ctx.fillStyle = "#1f2330";
      ctx.font = "800 28px Microsoft JhengHei, Segoe UI, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(title, leftX, 30);

      // 標題下方的裝飾線
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
      for (const el of children) {
        if (el.classList.contains("detail-divider")) {
          ctx.strokeStyle = "#e7e5ef";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(leftX, y + 5);
          ctx.lineTo(rightX, y + 5);
          ctx.stroke();
          y += 18;
          continue;
        }

        if (el.classList.contains("detail-group-title")) {
          ctx.fillStyle = COLOR_MUTED;
          ctx.font = "800 16px Microsoft JhengHei, Segoe UI, Arial, sans-serif";
          ctx.fillText(el.textContent.trim(), leftX, y);
          y += 35;
          continue;
        }

        const labelEl = el.querySelector(".detail-label");
        const amountEl = el.querySelector(".detail-amount");
        const labelText = (labelEl?.textContent || "").trim();
        const amountText = (amountEl?.textContent || "").trim();

        const isTotal = el.classList.contains("detail-total-row");
        const amountFontSize = isTotal ? 24 : 20;
        const labelFontSize = isTotal ? 20 : 18;

        ctx.textBaseline = "top";
        
        // 繪製文字 (靠左)
        ctx.textAlign = "left";
        ctx.fillStyle = isTotal ? COLOR_TEXT : COLOR_MUTED;
        ctx.font = `800 ${labelFontSize}px Microsoft JhengHei, Segoe UI, Arial, sans-serif`;
        drawWrappedText(ctx, labelText, leftX, y + 5, maxLabelWidth, 24);

        // 繪製數字 (靠右)
        ctx.textAlign = "right";
        const hasNeg = amountEl?.classList?.contains("amount-negative");
        const hasPos = amountEl?.classList?.contains("amount-positive");

        let amountColor = COLOR_TEXT;
        if (isTotal) amountColor = COLOR_TOTAL;
        else if (hasNeg) amountColor = COLOR_NEG;
        else if (hasPos) amountColor = COLOR_POS;

        ctx.fillStyle = amountColor;
        ctx.font = `900 ${amountFontSize}px Microsoft JhengHei, Segoe UI, Arial, sans-serif`;
        ctx.fillText(amountText, rightX, y + 8);

        y += isTotal ? 70 : 50;
      }

      // 下載邏輯
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

  init();
  if (exportJpgBtn) exportJpgBtn.addEventListener("click", exportDetailAsJpg);
  if (printDetailBtn) printDetailBtn.addEventListener("click", printDetail);
})();

