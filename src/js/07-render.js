// =========================================================================
// ЁРДАМЧИ ФУНКЦИЯ: ҲУДУД СЕЛЕКТЛАРИНИ ТЎЛДИРИШ (Қайтарилди)
// =========================================================================

function populateRegionSelects() {
  const inpReg = document.getElementById("inpRegion");
  const editReg = document.getElementById("editCandRegion");
  const fotoReg = document.getElementById("fotoRegionFilter");
  const formerReg = document.getElementById("formerRegionFilter");
  const dbReg = document.getElementById("dbRegionFilter");

  // Барча ҳудудлар рўйхати
  const singleOpts = REGIONS_14.map(r => `<option value="${r}">${r}</option>`).join("");
  const allOpts = `<option value="ALL">Барча ҳудудлар (${REGIONS_14.length} та)</option>` + singleOpts;

  // 1. Номзод қўшиш формасидаги селект
  if (inpReg && inpReg.options.length === 0) {
    inpReg.innerHTML = singleOpts;
  }

  // 2. Таҳрирлаш модалидаги селект
  if (editReg && editReg.options.length === 0) {
    editReg.innerHTML = singleOpts;
  }

  // 3. Фильтрлар (Барчаси)
  [fotoReg, formerReg, dbReg].forEach(el => {
    if (el && el.options.length === 0) {
      el.innerHTML = allOpts;
    }
  });

  // Санани янгилаш
  const dateLabel = document.getElementById("fotoCurrentDateLabel");
  if (dateLabel) {
    const now = getNow();
    dateLabel.textContent = `${now.date} йил ҳолатига`;
  }
}

console.log("✅ 07-render.js юкланди (v10.5 — populateRegionSelects тузатилди)");
