/* ==========================================================================
   CONFIGURAÇÃO
   ========================================================================== */

const API_BASE = "/api";
const TOKEN_STORAGE_KEY = "angelica_admin_token";
const DEFAULT_WHATSAPP_NUMBER = "5500000000000";

/* ==========================================================================
   Produtos de exemplo — usados automaticamente se a API não responder
   (ex: testando o arquivo direto no navegador, sem servidor).
   ========================================================================== */

const SAMPLE_PRODUCTS = [
  { name: "Véu Dourado", category: "Perfume Feminino", price: 189.90, volume: "50ml", description: "Notas de âmbar e baunilha envoltas em um dourado quente e sedutor.", images: ["https://images.unsplash.com/photo-1591892212776-a09de24dbe84?w=800&q=80&auto=format&fit=crop"] },
  { name: "Noir Élégance", category: "Perfume Unissex", price: 219.90, volume: "100ml", description: "Preto e dourado em harmonia: couro, madeira de oud e um toque de especiarias.", images: ["https://images.unsplash.com/photo-1584841247175-4d766cefa018?w=800&q=80&auto=format&fit=crop"] },
  { name: "Essência Pura", category: "Perfume Unissex", price: 159.90, volume: "50ml", description: "Frasco transparente, fragrância limpa e luminosa de flor de laranjeira.", images: ["https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80&auto=format&fit=crop"] },
  { name: "Toque de Seda", category: "Perfume Feminino", price: 174.90, volume: "50ml", description: "Almíscar suave sobre um fundo floral delicado, para o dia a dia.", images: ["https://images.unsplash.com/photo-1543422655-ac1c6ca993ed?w=800&q=80&auto=format&fit=crop"] },
  { name: "Alma Artesanal", category: "Perfume Unissex", price: 249.90, volume: "100ml", description: "Extração artesanal de essências puras, para quem valoriza autenticidade.", images: ["https://images.unsplash.com/photo-1709662217618-83586dc9b777?w=800&q=80&auto=format&fit=crop"] },
  { name: "Jardim de Angelica", category: "Perfume Feminino", price: 164.90, volume: "50ml", description: "Um buquê floral fresco, inspirado em jardins ao amanhecer.", images: ["https://images.unsplash.com/photo-1631701464241-99f7f0ed6f8f?w=800&q=80&auto=format&fit=crop"] },
  { name: "Colar Lua", category: "Bijuteria", price: 59.90, volume: "—", description: "Colar folheado a ouro com pingente em formato de lua crescente.", images: ["https://images.unsplash.com/photo-1708486235073-14879ff14c4c?w=800&q=80&auto=format&fit=crop"] },
  { name: "Águas Vermelhas", category: "Perfume Feminino", price: 194.90, volume: "50ml", description: "Frescor aquático com um coração de flores vermelhas intensas.", images: ["https://images.unsplash.com/photo-1763987300634-7b0822cbf390?w=800&q=80&auto=format&fit=crop"] },
  { name: "Cristal", category: "Perfume Unissex", price: 169.90, volume: "50ml", description: "Transparência e leveza em um perfume clean e versátil.", images: ["https://images.unsplash.com/photo-1619352704218-ab07491b9353?w=800&q=80&auto=format&fit=crop"] },
  { name: "Branco Puro", category: "Perfume Unissex", price: 154.90, volume: "50ml", description: "Notas brancas suaves — algodão, almíscar limpo e um fundo amadeirado sutil.", images: ["https://images.unsplash.com/photo-1588159344397-e03f2eddfb8d?w=800&q=80&auto=format&fit=crop"] }
];

/* ==========================================================================
   Estado e referências
   ========================================================================== */

const catalogEl = document.getElementById("catalog");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("category-filter");
const emptyMessageEl = document.getElementById("empty-message");
const statusEl = document.getElementById("status-message");
const whatsappLinkEl = document.getElementById("whatsapp-link");
const editBarEl = document.getElementById("edit-bar");
const gearBtn = document.getElementById("gear-btn");

let products = [];
let whatsappNumber = DEFAULT_WHATSAPP_NUMBER;
let isEditMode = false;
let editingId = null;
let currentPhotos = [];
let usingSampleData = false;

const cloudinaryReady = Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);

/* ==========================================================================
   Sessão (token) e chamadas à API
   ========================================================================== */

// Guarda o token em memória (sempre funciona, dura enquanto a página está
// aberta) e também tenta salvar no localStorage (para continuar logado
// depois de fechar/reabrir a aba) — sem depender só do localStorage, que
// alguns navegadores/extensões podem bloquear silenciosamente.
let memoryToken = null;

function getToken() {
  if (memoryToken) return memoryToken;
  try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}
function setToken(token) {
  memoryToken = token;
  try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* navegador pode bloquear */ }
}
function clearToken() {
  memoryToken = null;
  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    setEditMode(false);
  }

  let body = null;
  try { body = await response.json(); } catch { /* corpo vazio */ }

  if (!response.ok) {
    throw new Error(body?.error || `Erro ${response.status}`);
  }
  return body;
}

// Envia uma foto para o Cloudinary (gratuito) e devolve o link público dela.
async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!response.ok) throw new Error("Falha ao enviar foto");
  const data = await response.json();
  return data.secure_url;
}

/* ==========================================================================
   Utilidades
   ========================================================================== */

function normalize(str) {
  return String(str || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}
function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parsePrice(raw) {
  const cleaned = String(raw).replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  return parseFloat(normalized) || 0;
}
function buildWhatsappLink(product) {
  const message = `Olá! Tenho interesse em "${product.name}" por ${formatPrice(product.price)}.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
function showStatus(message) {
  if (!statusEl) return;
  statusEl.hidden = false;
  statusEl.textContent = message;
}
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.hidden = true; });
});

/* ==========================================================================
   Catálogo (vitrine)
   ========================================================================== */

function populateCategoryFilter(list) {
  const current = categoryEl.value;
  const categories = [...new Set(list.map((p) => p.category).filter(Boolean))].sort();
  categoryEl.innerHTML = '<option value="Todos">Todas as categorias</option>';
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryEl.appendChild(option);
  }
  if (categories.includes(current)) categoryEl.value = current;
}

function buildGallery(images, name) {
  const pics = images && images.length ? images : ["https://placehold.co/600x800/ece2d4/8a7a6f?text=Sem+foto"];
  if (pics.length === 1) {
    return `<div class="card-image-wrap"><img src="${pics[0]}" alt="${name}" loading="lazy"></div>`;
  }
  const slides = pics.map((src, i) => `<img src="${src}" alt="${name}" loading="lazy" class="${i === 0 ? "active" : ""}" data-index="${i}">`).join("");
  const dots = pics.map((_, i) => `<button class="gallery-dot ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="Foto ${i + 1}"></button>`).join("");
  return `<div class="card-image-wrap has-gallery">${slides}<div class="gallery-dots">${dots}</div></div>`;
}

function renderCatalog(list) {
  catalogEl.innerHTML = "";
  emptyMessageEl.hidden = list.length !== 0 || isEditMode;

  for (const product of list) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      ${buildGallery(product.images, product.name)}
      <div class="card-body">
        <span class="card-brand">${product.category}</span>
        <h2 class="card-name">${product.name}</h2>
        <p class="card-desc">${product.description}</p>
        <div class="card-meta">
          <span class="card-price">${formatPrice(product.price)}</span>
          <span class="card-volume">${product.volume || ""}</span>
        </div>
        <a class="buy-button" href="${buildWhatsappLink(product)}" target="_blank" rel="noopener">Comprar pelo WhatsApp</a>
      </div>
      ${isEditMode && product.id ? '<button type="button" class="card-edit-btn" aria-label="Editar produto">✏️</button>' : ""}
    `;

    const dots = card.querySelectorAll(".gallery-dot");
    const slides = card.querySelectorAll(".card-image-wrap img");
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = dot.dataset.index;
        slides.forEach((img) => img.classList.toggle("active", img.dataset.index === index));
        dots.forEach((d) => d.classList.toggle("active", d === dot));
      });
    });

    if (isEditMode && product.id) {
      card.querySelector(".card-edit-btn").addEventListener("click", () => openProductForm(product));
    }

    catalogEl.appendChild(card);
  }

  if (isEditMode) {
    const addTile = document.createElement("button");
    addTile.type = "button";
    addTile.className = "card add-card";
    addTile.innerHTML = `<span class="add-card-plus">+</span><span>Adicionar produto</span>`;
    addTile.addEventListener("click", () => openProductForm(null));
    catalogEl.appendChild(addTile);
  }
}

function applyFilters() {
  const term = normalize(searchEl.value);
  const category = categoryEl.value;
  const filtered = products.filter((product) => {
    const matchesTerm = normalize(product.name).includes(term) || normalize(product.category).includes(term) || normalize(product.description).includes(term);
    const matchesCategory = category === "Todos" || product.category === category;
    return matchesTerm && matchesCategory;
  });
  renderCatalog(filtered);
}

async function loadProducts() {
  try {
    const data = await api("/products");
    products = data;
    usingSampleData = false;
    statusEl.hidden = true;
  } catch (err) {
    products = SAMPLE_PRODUCTS;
    usingSampleData = true;
    showStatus("Não foi possível conectar ao servidor agora — mostrando produtos de exemplo.");
  }
  populateCategoryFilter(products);
  applyFilters();
}

/* ==========================================================================
   Engrenagem → senha de 4 números → modo edição
   ========================================================================== */

const pinForm = document.getElementById("pin-form");
const pinInput = document.getElementById("pin-input");
const pinError = document.getElementById("pin-error");

function setEditMode(value) {
  isEditMode = value;
  editBarEl.hidden = !value;
  gearBtn.classList.toggle("active", value);
  renderCatalog(products);
}

gearBtn.addEventListener("click", () => {
  if (isEditMode) {
    settingsWhatsapp.value = whatsappNumber === DEFAULT_WHATSAPP_NUMBER ? "" : whatsappNumber;
    openModal("settings-modal");
  } else {
    pinInput.value = "";
    pinError.hidden = true;
    openModal("pin-modal");
    setTimeout(() => pinInput.focus(), 50);
  }
});

pinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pin = pinInput.value.trim();
  pinError.hidden = true;
  if (!/^\d{4}$/.test(pin)) {
    pinError.hidden = false;
    pinError.textContent = "Digite os 4 números da senha.";
    return;
  }
  try {
    const data = await api("/login", { method: "POST", body: JSON.stringify({ pin }) });
    setToken(data.token);
    closeModal("pin-modal");
    setEditMode(true);
    if (usingSampleData) loadProducts();
  } catch (err) {
    pinError.hidden = false;
    pinError.textContent = err.message || "Senha incorreta.";
  }
});

document.getElementById("exit-edit-btn").addEventListener("click", () => {
  clearToken();
  setEditMode(false);
});
document.getElementById("open-settings-btn").addEventListener("click", () => {
  settingsWhatsapp.value = whatsappNumber === DEFAULT_WHATSAPP_NUMBER ? "" : whatsappNumber;
  openModal("settings-modal");
});

/* ==========================================================================
   Configurações (WhatsApp + trocar senha)
   ========================================================================== */

const settingsWhatsapp = document.getElementById("settings-whatsapp");
const settingsFeedback = document.getElementById("settings-feedback");
const settingsNewPin = document.getElementById("settings-new-pin");
const pinFeedback = document.getElementById("pin-feedback");

document.getElementById("save-whatsapp-btn").addEventListener("click", async () => {
  const value = settingsWhatsapp.value.replace(/\D/g, "");
  settingsFeedback.hidden = true;
  if (!value) return;
  try {
    await api("/settings", { method: "POST", body: JSON.stringify({ whatsapp: value }) });
    whatsappNumber = value;
    whatsappLinkEl.href = `https://wa.me/${whatsappNumber}`;
    renderCatalog(products);
    settingsFeedback.hidden = false;
    settingsFeedback.textContent = "Número salvo!";
  } catch (err) {
    settingsFeedback.hidden = false;
    settingsFeedback.textContent = err.message || "Não foi possível salvar.";
  }
  setTimeout(() => { settingsFeedback.hidden = true; }, 2500);
});

document.getElementById("save-pin-btn").addEventListener("click", async () => {
  const pin = settingsNewPin.value.trim();
  pinFeedback.hidden = true;
  if (!/^\d{4}$/.test(pin)) {
    pinFeedback.hidden = false;
    pinFeedback.textContent = "Digite 4 números.";
    return;
  }
  try {
    await api("/change-pin", { method: "POST", body: JSON.stringify({ pin }) });
    settingsNewPin.value = "";
    pinFeedback.hidden = false;
    pinFeedback.textContent = "Senha alterada!";
  } catch (err) {
    pinFeedback.hidden = false;
    pinFeedback.textContent = err.message || "Não foi possível trocar a senha.";
  }
  setTimeout(() => { pinFeedback.hidden = true; }, 3500);
});

/* ==========================================================================
   Formulário de produto (adicionar / editar / excluir)
   ========================================================================== */

const productForm = document.getElementById("product-form");
const formTitle = document.getElementById("form-title");
const fieldName = document.getElementById("field-name");
const fieldCategory = document.getElementById("field-category");
const fieldPrice = document.getElementById("field-price");
const fieldVolume = document.getElementById("field-volume");
const fieldDescription = document.getElementById("field-description");
const photosGrid = document.getElementById("photos-grid");
const addPhotoBtn = document.getElementById("add-photo-btn");
const photoInput = document.getElementById("photo-input");
const uploadFeedback = document.getElementById("upload-feedback");
const submitBtn = document.getElementById("submit-btn");
const deleteProductBtn = document.getElementById("delete-product-btn");
const formError = document.getElementById("form-error");

const MAX_PHOTO_SIZE = 8 * 1024 * 1024; // 8MB por foto

function renderPhotosGrid() {
  photosGrid.querySelectorAll(".photo-thumb").forEach((el) => el.remove());
  currentPhotos.forEach((url, index) => {
    const thumb = document.createElement("div");
    thumb.className = "photo-thumb";
    thumb.innerHTML = `<img src="${url}" alt="Foto ${index + 1}"><button type="button" class="remove-photo" aria-label="Remover foto">&times;</button>`;
    thumb.querySelector(".remove-photo").addEventListener("click", () => {
      currentPhotos.splice(index, 1);
      renderPhotosGrid();
    });
    photosGrid.insertBefore(thumb, addPhotoBtn);
  });
}

addPhotoBtn.addEventListener("click", () => {
  if (!cloudinaryReady) {
    alert("O upload de fotos ainda não foi configurado. Veja o arquivo NEON.md.");
    return;
  }
  photoInput.click();
});

photoInput.addEventListener("change", async () => {
  const files = Array.from(photoInput.files || []);
  if (!files.length) return;

  const invalid = files.find((f) => !f.type.startsWith("image/") || f.size > MAX_PHOTO_SIZE);
  if (invalid) {
    uploadFeedback.hidden = false;
    uploadFeedback.textContent = "Só são aceitas imagens de até 8MB.";
    photoInput.value = "";
    setTimeout(() => { uploadFeedback.hidden = true; }, 3000);
    return;
  }

  uploadFeedback.hidden = false;
  uploadFeedback.textContent = `Enviando ${files.length} foto(s)...`;

  try {
    for (const file of files) {
      const url = await uploadPhoto(file);
      currentPhotos.push(url);
      renderPhotosGrid();
    }
    uploadFeedback.textContent = "Fotos enviadas!";
  } catch (err) {
    uploadFeedback.textContent = "Não foi possível enviar uma ou mais fotos.";
  } finally {
    setTimeout(() => { uploadFeedback.hidden = true; }, 2500);
    photoInput.value = "";
  }
});

function openProductForm(product) {
  formError.hidden = true;
  if (product) {
    editingId = product.id;
    currentPhotos = [...(product.images || [])];
    fieldName.value = product.name || "";
    fieldCategory.value = product.category || "";
    fieldPrice.value = String(product.price || "").replace(".", ",");
    fieldVolume.value = product.volume || "";
    fieldDescription.value = product.description || "";
    formTitle.textContent = `Editando: ${product.name}`;
    submitBtn.textContent = "Salvar alterações";
    deleteProductBtn.hidden = false;
  } else {
    editingId = null;
    currentPhotos = [];
    productForm.reset();
    formTitle.textContent = "Adicionar produto";
    submitBtn.textContent = "Adicionar produto";
    deleteProductBtn.hidden = true;
  }
  renderPhotosGrid();
  openModal("product-modal");
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  if (currentPhotos.length === 0) {
    formError.hidden = false;
    formError.textContent = "Adicione pelo menos uma foto.";
    return;
  }

  const data = {
    name: fieldName.value.trim(),
    category: fieldCategory.value.trim(),
    price: parsePrice(fieldPrice.value),
    volume: fieldVolume.value.trim(),
    description: fieldDescription.value.trim(),
    images: currentPhotos,
  };

  submitBtn.disabled = true;
  try {
    if (editingId) {
      await api(`/products?id=${editingId}`, { method: "PUT", body: JSON.stringify(data) });
    } else {
      await api("/products", { method: "POST", body: JSON.stringify(data) });
    }
    closeModal("product-modal");
    loadProducts();
  } catch (err) {
    formError.hidden = false;
    formError.textContent = err.message || "Não foi possível salvar o produto. Tente novamente.";
  } finally {
    submitBtn.disabled = false;
  }
});

deleteProductBtn.addEventListener("click", async () => {
  if (!editingId) return;
  if (!confirm("Excluir este produto? Essa ação não pode ser desfeita.")) return;
  try {
    await api(`/products?id=${editingId}`, { method: "DELETE" });
    closeModal("product-modal");
    loadProducts();
  } catch (err) {
    formError.hidden = false;
    formError.textContent = err.message || "Não foi possível excluir.";
  }
});

/* ==========================================================================
   Inicialização
   ========================================================================== */

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  if (getToken()) setEditMode(true);

  try {
    const data = await api("/settings");
    if (data.whatsapp) whatsappNumber = data.whatsapp;
  } catch (err) { /* mantém o número padrão */ }
  whatsappLinkEl.href = `https://wa.me/${whatsappNumber}`;

  await loadProducts();

  searchEl.addEventListener("input", applyFilters);
  categoryEl.addEventListener("change", applyFilters);
}

init();
