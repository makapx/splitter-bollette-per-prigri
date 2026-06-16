const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const APPLIANCE_ESTIMATES = {
  Frigorifero: 200,
  Router: 30,
  "Standby TV": 50,
  "Illuminazione stand-by": 30,
  Altro: 0,
};

const AVERAGE_COST_PER_KWH = 0.3;
const PASSIVE_PERCENT = 2.0;

let numPeople = 0;
let monthCount = 0;
let fixedCount = 0;
let applianceCount = 0;
let currentCalculation = null;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindStaticEvents();
  addFixed();
  addAppliance("Frigorifero");
  addAppliance("Router");
  addMonth();
  updateLiveVariable();
  markResultsStale();
});

function cacheElements() {
  els.totalAmount = document.getElementById("totalAmount");
  els.liveVar = document.getElementById("liveVar");
  els.numBtns = document.getElementById("numBtns");
  els.nameFields = document.getElementById("nameFields");
  els.fixedCosts = document.getElementById("fixedCosts");
  els.applianceCosts = document.getElementById("applianceCosts");
  els.months = document.getElementById("months");
  els.commissionAmount = document.getElementById("commissionAmount");
  els.error = document.getElementById("error");
  els.resultDivider = document.getElementById("resultDivider");
  els.results = document.getElementById("results");
  els.calculateBtn = document.querySelector('[data-action="calculate"]');
  els.printReportBtn = document.querySelector('[data-action="print-report"]');
}

function bindStaticEvents() {
  document.querySelectorAll("[data-num]").forEach((button) => {
    button.addEventListener("click", () => setNum(Number(button.dataset.num)));
  });

  document.querySelector('[data-action="add-fixed"]').addEventListener("click", () => addFixed());
  document
    .querySelector('[data-action="add-appliance"]')
    .addEventListener("click", () => addAppliance());
  document.querySelector('[data-action="add-month"]').addEventListener("click", () => addMonth());
  els.calculateBtn.addEventListener("click", calculate);
  els.printReportBtn.addEventListener("click", printReport);

  els.totalAmount.addEventListener("input", updateLiveVariable);
  els.totalAmount.addEventListener("input", markResultsStale);
  els.fixedCosts.addEventListener("input", updateLiveVariable);
  els.fixedCosts.addEventListener("input", markResultsStale);
  els.applianceCosts.addEventListener("input", updateLiveVariable);
  els.applianceCosts.addEventListener("input", markResultsStale);
  els.commissionAmount.addEventListener("input", markResultsStale);
  els.applianceCosts.addEventListener("change", handleApplianceChange);
  els.applianceCosts.addEventListener("click", handleRemovalClick);
  els.fixedCosts.addEventListener("click", handleRemovalClick);
  els.months.addEventListener("click", handleRemovalClick);
  els.months.addEventListener("change", handleMonthConfigChange);
}

function setNum(n) {
  numPeople = n;

  document.querySelectorAll("[data-num]").forEach((button) => {
    const isActive = Number(button.dataset.num) === n;
    button.classList.toggle("bg-sky-600", isActive);
    button.classList.toggle("border-sky-600", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("shadow-sm", isActive);
    button.classList.toggle("bg-slate-50", !isActive);
    button.classList.toggle("border-slate-200", !isActive);
    button.classList.toggle("text-slate-500", !isActive);
    button.classList.toggle("hover:bg-slate-100", !isActive);
    button.classList.toggle("hover:border-slate-300", !isActive);
    button.classList.toggle("hover:text-slate-700", !isActive);
  });

  const colsClass = n <= 2 ? "sm:grid-cols-2" : n === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";
  els.nameFields.className = `mt-4 grid gap-3 ${colsClass}`;
  els.nameFields.innerHTML = "";

  for (let i = 0; i < n; i += 1) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label class="mb-2 block text-sm font-medium text-slate-500" for="name_${i}">Coinquilino ${i + 1}</label>
      <input
        type="text"
        id="name_${i}"
        data-name-index="${i}"
        placeholder="Nome"
        class="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15"
      />
    `;
    els.nameFields.appendChild(wrapper);
  }

  els.nameFields.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateMonthGrids);
    input.addEventListener("input", markResultsStale);
  });

  updateMonthGrids();
  updateLiveVariable();
  markResultsStale();
}

function getNames() {
  return Array.from({ length: numPeople }, (_, index) => {
    const value = document.getElementById(`name_${index}`)?.value.trim();
    return value || `Coinquilino ${index + 1}`;
  });
}

function addFixed() {
  fixedCount += 1;
  const id = fixedCount;
  const row = document.createElement("div");
  row.id = `fixed_${id}`;
  row.dataset.fixedRow = "true";
  row.className = "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end";
  row.innerHTML = `
    <div class="min-w-0 flex-[2]">
      <label class="mb-2 block text-sm font-medium text-slate-500">Descrizione</label>
      <input
        type="text"
        data-field="description"
        placeholder="es. Quota fissa, Quota potenza..."
        class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
      />
    </div>
    <div class="flex-[1]">
      <label class="mb-2 block text-sm font-medium text-slate-500">Importo €</label>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        data-field="amount"
        class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
      />
    </div>
    <button
      type="button"
      data-action="remove-fixed"
      data-id="${id}"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
      title="Rimuovi"
    >
      <i class="ti ti-x text-[16px]" aria-hidden="true"></i>
    </button>
  `;
  els.fixedCosts.appendChild(row);
  updateLiveVariable();
  markResultsStale();
}

function addAppliance(type = "Frigorifero") {
  applianceCount += 1;
  const id = applianceCount;
  const estimate = APPLIANCE_ESTIMATES[type] ?? 0;
  const row = document.createElement("div");
  row.id = `appliance_${id}`;
  row.dataset.applianceRow = "true";
  row.className = "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end";
  row.innerHTML = `
    <div class="min-w-0 flex-[2]">
      <label class="mb-2 block text-sm font-medium text-slate-500">Elettrodomestico</label>
      <select
        id="app_type_${id}"
        data-action="appliance-type"
        data-id="${id}"
        class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
      >
        ${Object.keys(APPLIANCE_ESTIMATES)
          .map(
            (key) =>
              `<option value="${escapeHtml(key)}"${key === type ? " selected" : ""}>${escapeHtml(key)}</option>`,
          )
          .join("")}
      </select>
    </div>
    <div class="flex-[1]">
      <label class="mb-2 block text-sm font-medium text-slate-500">kWh/mese</label>
      <input
        id="app_amt_${id}"
        type="number"
        min="0"
        step="1"
        value="${Math.round(estimate)}"
        ${type === "Altro" ? "" : "disabled"}
        class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </div>
    <button
      type="button"
      data-action="remove-appliance"
      data-id="${id}"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
      title="Rimuovi"
    >
      <i class="ti ti-x text-[16px]" aria-hidden="true"></i>
    </button>
  `;
  els.applianceCosts.appendChild(row);
  updateLiveVariable();
  markResultsStale();
}

function addMonth() {
  monthCount += 1;
  const id = monthCount;
  const now = new Date();
  const monthIndex = (now.getMonth() - (monthCount - 1) + 12) % 12;
  const row = document.createElement("div");
  row.id = `month_${id}`;
  row.dataset.monthRow = "true";
  row.className = "rounded-2xl border border-slate-200 bg-slate-50/80 p-4";
  row.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="min-w-0 flex-[2]">
        <label class="mb-2 block text-sm font-medium text-slate-500" for="msel_${id}">Mese</label>
        <select
          id="msel_${id}"
          data-action="month-change"
          data-id="${id}"
          class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
        >
          ${MESI.map(
            (month, index) =>
              `<option value="${index}"${index === monthIndex ? " selected" : ""}>${month}</option>`,
          ).join("")}
        </select>
      </div>
      <div class="flex-[1]">
        <label class="mb-2 block text-sm font-medium text-slate-500" for="myear_${id}">Anno</label>
        <input
          type="number"
          id="myear_${id}"
          data-action="month-change"
          data-id="${id}"
          value="${now.getFullYear()}"
          min="2000"
          max="2099"
          class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
        />
      </div>
      <button
        type="button"
        data-action="remove-month"
        data-id="${id}"
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
        title="Rimuovi mese"
      >
        <i class="ti ti-x text-[16px]" aria-hidden="true"></i>
      </button>
    </div>
    <div id="pg_${id}" data-month-id="${id}" class="mt-4 grid gap-3"></div>
  `;
  els.months.appendChild(row);
  rebuildPresenceGrid(id);
  markResultsStale();
}

function handleRemovalClick(event) {
  const button = event.target.closest("button[data-action^='remove-']");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "remove-fixed") {
    document.getElementById(`fixed_${id}`)?.remove();
    updateLiveVariable();
    markResultsStale();
    return;
  }

  if (action === "remove-appliance") {
    document.getElementById(`appliance_${id}`)?.remove();
    updateLiveVariable();
    markResultsStale();
    return;
  }

  if (action === "remove-month") {
    document.getElementById(`month_${id}`)?.remove();
    markResultsStale();
  }
}

function handleApplianceChange(event) {
  const select = event.target.closest("select[data-action='appliance-type']");
  if (!select) return;
  updateApplianceCost(Number(select.dataset.id));
  markResultsStale();
}

function handleMonthConfigChange(event) {
  const control = event.target.closest("[data-action='month-change']");
  if (!control) return;
  rebuildPresenceGrid(Number(control.dataset.id));
  markResultsStale();
}

function updateApplianceCost(id) {
  const type = document.getElementById(`app_type_${id}`)?.value || "Altro";
  const amountInput = document.getElementById(`app_amt_${id}`);
  if (!amountInput) return;

  const estimate = APPLIANCE_ESTIMATES[type] ?? 0;
  amountInput.value = Math.round(estimate);
  amountInput.disabled = type !== "Altro";
  updateLiveVariable();
  markResultsStale();
}

function getFixedSum() {
  return Array.from(document.querySelectorAll("[data-fixed-row]")).reduce((sum, row) => {
    const amountInput = row.querySelector('[data-field="amount"]');
    return sum + (parseFloat(amountInput?.value) || 0);
  }, 0);
}

function getApplianceKwh() {
  return Array.from(document.querySelectorAll("[data-appliance-row]")).reduce((sum, row) => {
    const amountInput = row.querySelector("input[type='number']");
    return sum + (parseFloat(amountInput?.value) || 0);
  }, 0);
}

function updateLiveVariable() {
  const total = parseFloat(els.totalAmount.value);
  if (Number.isNaN(total)) {
    els.liveVar.classList.add("hidden");
    els.liveVar.innerHTML = "";
    return;
  }

  const fixedSum = getFixedSum();
  const applianceKwh = getApplianceKwh();
  const commission = parseFloat(els.commissionAmount?.value) || 0;
  const rawVariable = total - fixedSum;
  const appliancePct = rawVariable > 0 ? (applianceKwh * AVERAGE_COST_PER_KWH) / rawVariable * 100 : 0;
  const cappedAppliancePct = Math.min(appliancePct, 50);
  const applianceCost = rawVariable > 0 ? (rawVariable * cappedAppliancePct) / 100 : 0;
  const passiveCost = rawVariable > 0 ? (rawVariable * PASSIVE_PERCENT) / 100 : 0;
  const presenceVariable = rawVariable - applianceCost - passiveCost;

  els.liveVar.classList.remove("hidden");
  els.liveVar.innerHTML = `
    <span class="font-medium text-slate-700">Totale:</span> <strong class="font-mono text-slate-800">€${total.toFixed(2)}</strong>
    &minus; <span class="font-medium text-slate-700">Fissi:</span> <strong class="font-mono text-slate-800">€${fixedSum.toFixed(2)}</strong>
    &minus; <span class="font-medium text-slate-700">Elettrodomestici:</span> <strong class="font-mono text-slate-800">${cappedAppliancePct.toFixed(1)}%</strong>
    = <strong class="font-mono text-slate-800">€${applianceCost.toFixed(2)}</strong>
    &minus; <span class="font-medium text-slate-700">Passivo:</span> <strong class="font-mono text-slate-800">${PASSIVE_PERCENT.toFixed(1)}%</strong>
    = <strong class="font-mono text-slate-800">€${passiveCost.toFixed(2)}</strong>
    <br />
    <span class="font-medium text-slate-700">Consumo da presenza:</span> <strong class="font-mono text-slate-800">€${presenceVariable.toFixed(2)}</strong>
    <br />
    <span class="font-medium text-slate-700">Commissioni:</span> <strong class="font-mono text-slate-800">€${commission.toFixed(2)}</strong> fuori bolletta
  `;
}

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function rebuildPresenceGrid(id) {
  const container = document.getElementById(`pg_${id}`);
  if (!container) return;

  const monthSelect = document.getElementById(`msel_${id}`);
  const yearInput = document.getElementById(`myear_${id}`);
  if (!monthSelect || !yearInput) return;

  const monthIndex = parseInt(monthSelect.value, 10);
  const year = parseInt(yearInput.value, 10) || new Date().getFullYear();
  const maxDays = daysInMonth(monthIndex, year);
  const names = getNames();

  const previousValues = {};
  container.querySelectorAll("input").forEach((input) => {
    previousValues[input.id] = input.value;
  });

  if (names.length === 0) {
    container.className = "mt-4";
    container.innerHTML = `
      <p class="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Inserisci prima i coinquilini.
      </p>
    `;
    return;
  }

  const colsClass = names.length <= 2 ? "sm:grid-cols-2" : names.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";
  container.className = `mt-4 grid gap-3 ${colsClass}`;
  container.innerHTML = names
    .map((name, index) => {
      const inputId = `dp_${id}_${index}`;
      const currentValue = previousValues[inputId] ?? maxDays;
      const nextValue = Math.min(parseInt(currentValue, 10) || maxDays, maxDays);
      return `
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-500" for="${inputId}">${escapeHtml(name)} - giorni presenti (max ${maxDays})</label>
          <input
            type="number"
            id="${inputId}"
            min="0"
            max="${maxDays}"
            step="1"
            value="${nextValue}"
            class="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
          />
        </div>
      `;
    })
    .join("");
}

function updateMonthGrids() {
  document.querySelectorAll("[data-month-id]").forEach((container) => {
    rebuildPresenceGrid(Number(container.dataset.monthId));
  });
}

function calculate() {
  els.error.textContent = "";
  els.results.innerHTML = "";
  els.resultDivider.classList.add("hidden");
  currentCalculation = null;
  setPrintEnabled(false);

  if (numPeople === 0) {
    showErr("Seleziona il numero di coinquilini.");
    return;
  }

  const names = getNames();
  const total = parseFloat(els.totalAmount.value);
  if (Number.isNaN(total) || total <= 0) {
    showErr("Inserisci il totale della bolletta.");
    return;
  }
  const commissionTotal = parseFloat(els.commissionAmount?.value) || 0;
  if (commissionTotal < 0) {
    showErr("Inserisci una commissione valida.");
    return;
  }

  const fixedItems = [];
  let fixedTotal = 0;
  document.querySelectorAll("[data-fixed-row]").forEach((row) => {
    const description = row.querySelector('[data-field="description"]')?.value.trim() || "Voce fissa";
    const amount = parseFloat(row.querySelector('[data-field="amount"]')?.value) || 0;
    fixedItems.push({ description, amount });
    fixedTotal += amount;
  });

  const applianceItems = [];
  let applianceKwhTotal = 0;
  document.querySelectorAll("[data-appliance-row]").forEach((row) => {
    const type = row.querySelector("select")?.value || "Elettrodomestico";
    const kwh = parseFloat(row.querySelector("input[type='number']")?.value) || 0;
    applianceItems.push({ type, kwh });
    applianceKwhTotal += kwh;
  });

  const rawVariableTotal = total - fixedTotal;
  if (rawVariableTotal < 0) {
    showErr("I costi fissi superano il totale bolletta.");
    return;
  }

  const appliancePct = rawVariableTotal > 0 ? (applianceKwhTotal * AVERAGE_COST_PER_KWH) / rawVariableTotal * 100 : 0;
  const cappedAppliancePct = Math.min(appliancePct, 50);
  const applianceTotal = rawVariableTotal > 0 ? (rawVariableTotal * cappedAppliancePct) / 100 : 0;
  const passiveCost = rawVariableTotal > 0 ? (rawVariableTotal * PASSIVE_PERCENT) / 100 : 0;
  const activeVariableTotal = rawVariableTotal - applianceTotal - passiveCost;

  if (activeVariableTotal < 0) {
    showErr("La somma di elettrodomestici e consumo passivo supera la parte variabile della bolletta.");
    return;
  }

  const monthRows = Array.from(document.querySelectorAll("[data-month-row]"));
  if (monthRows.length === 0) {
    showErr("Aggiungi almeno un mese di presenza.");
    return;
  }

  const monthData = monthRows.map((row) => {
    const monthId = row.id.replace("month_", "");
    const monthIndex = parseInt(document.getElementById(`msel_${monthId}`)?.value, 10);
    const year = parseInt(document.getElementById(`myear_${monthId}`)?.value, 10);
    const maxDays = daysInMonth(monthIndex, year);
    const days = Array.from({ length: numPeople }, (_, index) => parseInt(document.getElementById(`dp_${monthId}_${index}`)?.value, 10) || 0);
    return { monthIndex, year, maxDays, days };
  });

  const totalMonthDays = monthData.reduce((sum, month) => sum + month.maxDays, 0);
  const perPersonDayWeight = new Array(numPeople).fill(0);
  let totalWeight = 0;

  monthData.forEach((month) => {
    const monthWeight = month.maxDays / totalMonthDays;
    const monthTotalDays = month.days.reduce((sum, value) => sum + value, 0);
    if (monthTotalDays === 0) {
      return;
    }

    month.days.forEach((personDays, index) => {
      const share = monthWeight * (personDays / monthTotalDays);
      perPersonDayWeight[index] += share;
      totalWeight += share;
    });
  });

  const allZeroPresence = totalWeight === 0;
  const perPersonPresenceVariable = perPersonDayWeight.map((weight) =>
    allZeroPresence ? activeVariableTotal / numPeople : activeVariableTotal * (weight / totalWeight),
  );
  const perPersonFixed = fixedTotal / numPeople;
  const perPersonAppliance = applianceTotal / numPeople;
  const perPersonPassive = passiveCost / numPeople;
  const perPersonCommission = commissionTotal / numPeople;
  const perPersonTotal = names.map(
    (_, index) =>
      perPersonFixed +
      perPersonAppliance +
      perPersonPassive +
      perPersonCommission +
      perPersonPresenceVariable[index],
  );

  els.resultDivider.classList.remove("hidden");
  currentCalculation = {
    names,
    total,
    commissionTotal,
    fixedTotal,
    applianceTotal,
    cappedAppliancePct,
    passiveCost,
    activeVariableTotal,
    perPersonFixed,
    perPersonAppliance,
    perPersonPassive,
    perPersonCommission,
    perPersonPresenceVariable,
    perPersonTotal,
    allZeroPresence,
    totalWeight,
    perPersonDayWeight,
    monthData,
    applianceItems,
    fixedItems,
    applianceKwhTotal,
  };

  els.results.innerHTML = buildResultsMarkup(currentCalculation);
  setPrintEnabled(true);

  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildResultsMarkup(state) {
  const {
    names,
    total,
    commissionTotal,
    fixedTotal,
    applianceTotal,
    cappedAppliancePct,
    passiveCost,
    activeVariableTotal,
    perPersonFixed,
    perPersonAppliance,
    perPersonPassive,
    perPersonCommission,
    perPersonPresenceVariable,
    perPersonTotal,
    allZeroPresence,
    totalWeight,
    perPersonDayWeight,
    monthData,
    applianceItems,
    fixedItems,
    applianceKwhTotal,
  } = state;

  let html = `
    <div class="rounded-2xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/20">
      <h2 class="text-lg font-semibold tracking-tight">Risultato</h2>
      <p class="mt-2 text-sm leading-6 text-slate-300">
        Totale: <strong class="font-semibold text-white">€${total.toFixed(2)}</strong>
        &mdash; Fissi: <strong class="font-semibold text-white">€${fixedTotal.toFixed(2)}</strong>
        &mdash; Elettrodomestici: <strong class="font-semibold text-white">€${applianceTotal.toFixed(2)}</strong> (${cappedAppliancePct.toFixed(1)}%)
        &mdash; Passivo: <strong class="font-semibold text-white">€${passiveCost.toFixed(2)}</strong>
        &mdash; Commissioni: <strong class="font-semibold text-white">€${commissionTotal.toFixed(2)}</strong>
        &mdash; Consumo da presenza: <strong class="font-semibold text-white">€${activeVariableTotal.toFixed(2)}</strong>
      </p>
    </div>
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
  `;

  names.forEach((name, index) => {
    const presencePct = allZeroPresence
      ? "uguale"
      : `${((perPersonDayWeight[index] / (totalWeight || 1)) * 100).toFixed(1)}%`;

    html += `
      <article class="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg shadow-slate-900/20">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">${escapeHtml(name)}</p>
        <p class="mt-3 font-mono text-3xl font-semibold tracking-tight">€${perPersonTotal[index].toFixed(2)}</p>
        <p class="mt-3 space-y-1 text-xs leading-5 text-slate-300">
          <span class="block">Fissi: €${perPersonFixed.toFixed(2)}</span>
          <span class="block">Appl: €${perPersonAppliance.toFixed(2)}</span>
          <span class="block">Passivo: €${perPersonPassive.toFixed(2)}</span>
          <span class="block">Commissioni: €${perPersonCommission.toFixed(2)}</span>
          <span class="block">Consumi da presenza (${presencePct}): €${perPersonPresenceVariable[index].toFixed(2)}</span>
        </p>
      </article>
    `;
  });

  html += `
    </div>
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <p class="mb-4 text-sm font-semibold text-slate-700">Dettaglio presenza per mese</p>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              <th class="whitespace-nowrap py-2 pr-3">Mese</th>
              <th class="whitespace-nowrap py-2 pr-3">Giorni</th>
              ${names.map((name) => `<th class="whitespace-nowrap py-2 pr-3">${escapeHtml(name)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
  `;

  monthData.forEach((month) => {
    const totalDays = month.days.reduce((sum, value) => sum + value, 0);
    html += `
      <tr class="border-b border-slate-100 last:border-b-0">
        <td class="whitespace-nowrap py-3 pr-3 font-medium text-slate-700">${MESI[month.monthIndex]} ${month.year}</td>
        <td class="whitespace-nowrap py-3 pr-3 text-slate-600">${month.maxDays}</td>
    `;

    month.days.forEach((days) => {
      const pct = totalDays > 0 ? ((days / totalDays) * 100).toFixed(0) : "0";
      html += `
        <td class="whitespace-nowrap py-3 pr-3 text-slate-600">
          ${days}gg<br>
          <span class="text-xs text-slate-400">${pct}%</span>
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (fixedItems.length > 0) {
    html += `
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <p class="mb-4 text-sm font-semibold text-slate-700">Dettaglio costi fissi</p>
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                <th class="whitespace-nowrap py-2 pr-3">Voce</th>
                <th class="whitespace-nowrap py-2 pr-3">Totale</th>
                <th class="whitespace-nowrap py-2 pr-3">A testa</th>
              </tr>
            </thead>
            <tbody>
              ${fixedItems
                .map(
                  (item) => `
                    <tr class="border-b border-slate-100 last:border-b-0">
                      <td class="py-3 pr-3 text-slate-700">${escapeHtml(item.description)}</td>
                      <td class="py-3 pr-3 text-slate-600">€${item.amount.toFixed(2)}</td>
                      <td class="py-3 pr-3 text-slate-600">€${(item.amount / names.length).toFixed(2)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  html += `
    <div class="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
      <p class="mb-4 text-sm font-semibold text-amber-900">Commissioni fuori bolletta</p>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-amber-200 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
              <th class="whitespace-nowrap py-2 pr-3">Voce</th>
              <th class="whitespace-nowrap py-2 pr-3">Totale</th>
              <th class="whitespace-nowrap py-2 pr-3">A testa</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-amber-100 last:border-b-0">
              <td class="py-3 pr-3 text-slate-700">Commissione pagamento</td>
              <td class="py-3 pr-3 text-slate-600">€${commissionTotal.toFixed(2)}</td>
              <td class="py-3 pr-3 text-slate-600">€${perPersonCommission.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (applianceItems.length > 0) {
    html += `
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <p class="mb-4 text-sm font-semibold text-slate-700">Dettaglio elettrodomestici</p>
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                <th class="whitespace-nowrap py-2 pr-3">Voce</th>
                <th class="whitespace-nowrap py-2 pr-3">kWh/mese</th>
                <th class="whitespace-nowrap py-2 pr-3">Costo totale</th>
                <th class="whitespace-nowrap py-2 pr-3">A testa</th>
              </tr>
            </thead>
            <tbody>
              ${applianceItems
                .map((item) => {
                  const itemCost = applianceKwhTotal > 0 ? (applianceTotal * item.kwh) / applianceKwhTotal : 0;
                  return `
                    <tr class="border-b border-slate-100 last:border-b-0">
                      <td class="py-3 pr-3 text-slate-700">${escapeHtml(item.type)}</td>
                      <td class="py-3 pr-3 text-slate-600">${Math.round(item.kwh)}</td>
                      <td class="py-3 pr-3 text-slate-600">€${itemCost.toFixed(2)}</td>
                      <td class="py-3 pr-3 text-slate-600">€${(itemCost / names.length).toFixed(2)}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return html;
}

function showErr(message) {
  els.error.textContent = message;
}

function markResultsStale() {
  currentCalculation = null;
  setPrintEnabled(false);
}

function setPrintEnabled(enabled) {
  if (!els.printReportBtn) return;
  els.printReportBtn.disabled = !enabled;
}

function printReport() {
  if (!currentCalculation) {
    showErr("Prima genera un report da stampare.");
    return;
  }

  window.print();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
