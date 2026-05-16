const STORAGE_KEY = "silvana-caballero-podologia";
const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const dateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateOnly = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

const defaultData = {
  patients: [],
  appointments: [],
  incomes: [],
  photos: [],
};

const state = loadData();
const today = new Date().toISOString().slice(0, 10);

const patientForm = document.querySelector("#patientForm");
const appointmentForm = document.querySelector("#appointmentForm");
const incomeForm = document.querySelector("#incomeForm");
const photoForm = document.querySelector("#photoForm");
const patientList = document.querySelector("#patientList");
const appointmentList = document.querySelector("#appointmentList");
const incomeList = document.querySelector("#incomeList");
const photoList = document.querySelector("#photoList");

incomeForm.elements.date.value = today;

patientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(patientForm));
  state.patients.unshift({
    id: crypto.randomUUID(),
    name: data.name.trim(),
    phone: data.phone.trim(),
    age: data.age,
    allergies: data.allergies.trim(),
    history: data.history.trim(),
    treatment: data.treatment.trim(),
    createdAt: new Date().toISOString(),
  });
  patientForm.reset();
  saveAndRender();
});

appointmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(appointmentForm));
  state.appointments.push({
    id: crypto.randomUUID(),
    patient: data.patient.trim(),
    date: data.date,
    reason: data.reason.trim(),
  });
  state.appointments.sort((first, second) => new Date(first.date) - new Date(second.date));
  appointmentForm.reset();
  saveAndRender();
});

incomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(incomeForm));
  state.incomes.unshift({
    id: crypto.randomUUID(),
    date: data.date,
    concept: data.concept.trim(),
    amount: Number(data.amount),
  });
  incomeForm.reset();
  incomeForm.elements.date.value = today;
  saveAndRender();
});

photoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(photoForm);
  const before = formData.get("before");
  const after = formData.get("after");
  state.photos.unshift({
    id: crypto.randomUUID(),
    patient: formData.get("patient").trim(),
    before: await fileToDataUrl(before),
    after: await fileToDataUrl(after),
    notes: formData.get("notes").trim(),
    createdAt: new Date().toISOString(),
  });
  photoForm.reset();
  saveAndRender();
});

function loadData() {
  try {
    return { ...defaultData, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  renderDashboard();
  renderPatients();
  renderAppointments();
  renderIncomes();
  renderPhotos();
}

function renderDashboard() {
  const currentMonth = today.slice(0, 7);
  const dailyIncome = state.incomes
    .filter((income) => income.date === today)
    .reduce((total, income) => total + income.amount, 0);
  const monthlyIncome = state.incomes
    .filter((income) => income.date.startsWith(currentMonth))
    .reduce((total, income) => total + income.amount, 0);

  document.querySelector("#patientCount").textContent = state.patients.length;
  document.querySelector("#appointmentCount").textContent = state.appointments.length;
  document.querySelector("#dailyIncome").textContent = currency.format(dailyIncome);
  document.querySelector("#monthlyIncome").textContent = currency.format(monthlyIncome);
}

function renderPatients() {
  if (!state.patients.length) {
    patientList.className = "list empty-state";
    patientList.textContent = "Aún no hay pacientes registrados.";
    return;
  }

  patientList.className = "list";
  patientList.innerHTML = state.patients
    .map(
      (patient) => `
        <article class="record-card">
          <h4>${escapeHtml(patient.name)}</h4>
          <p><strong>Teléfono:</strong> ${escapeHtml(patient.phone || "No registrado")}</p>
          <p><strong>Edad:</strong> ${escapeHtml(patient.age || "No registrada")}</p>
          <div class="tag-row">
            <span class="tag">Alergias: ${escapeHtml(patient.allergies || "Sin datos")}</span>
            <span class="tag">Tratamiento: ${escapeHtml(patient.treatment || "Pendiente")}</span>
          </div>
          <p><strong>Historial:</strong> ${escapeHtml(patient.history || "Sin historial capturado")}</p>
        </article>
      `,
    )
    .join("");
}

function renderAppointments() {
  if (!state.appointments.length) {
    appointmentList.className = "list empty-state";
    appointmentList.textContent = "No hay citas agendadas.";
    return;
  }

  appointmentList.className = "list";
  appointmentList.innerHTML = state.appointments
    .map(
      (appointment) => `
        <article class="record-card">
          <h4>${escapeHtml(appointment.patient)}</h4>
          <p><strong>Fecha:</strong> ${dateTime.format(new Date(appointment.date))}</p>
          <p><strong>Motivo:</strong> ${escapeHtml(appointment.reason || "Consulta de podología")}</p>
        </article>
      `,
    )
    .join("");
}

function renderIncomes() {
  if (!state.incomes.length) {
    incomeList.className = "list empty-state";
    incomeList.textContent = "Aún no hay ingresos registrados.";
    return;
  }

  incomeList.className = "list";
  incomeList.innerHTML = state.incomes
    .map(
      (income) => `
        <article class="record-card">
          <h4>${escapeHtml(income.concept)}</h4>
          <p><strong>Fecha:</strong> ${dateOnly.format(new Date(`${income.date}T00:00:00`))}</p>
          <p><strong>Monto:</strong> ${currency.format(income.amount)}</p>
        </article>
      `,
    )
    .join("");
}

function renderPhotos() {
  if (!state.photos.length) {
    photoList.className = "photo-grid empty-state";
    photoList.textContent = "No hay fotos guardadas.";
    return;
  }

  photoList.className = "photo-grid";
  photoList.innerHTML = state.photos
    .map(
      (photo) => `
        <article class="photo-card">
          <div class="photo-card__images">
            <figure>
              <img src="${photo.before}" alt="Antes del tratamiento de ${escapeHtml(photo.patient)}" />
              <figcaption>Antes</figcaption>
            </figure>
            <figure>
              <img src="${photo.after}" alt="Después del tratamiento de ${escapeHtml(photo.patient)}" />
              <figcaption>Después</figcaption>
            </figure>
          </div>
          <div class="photo-card__body">
            <h4>${escapeHtml(photo.patient)}</h4>
            <p>${escapeHtml(photo.notes || "Seguimiento visual del tratamiento")}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
