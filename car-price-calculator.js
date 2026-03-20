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

  const STORAGE_KEY = "carPriceCalculator.v1";

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
    const totalLabel = grand >= 0 ? "應收金額" : "應退金額";
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

  init();
  if (exportJpgBtn) exportJpgBtn.addEventListener("click", exportDetailAsJpg);
})();

