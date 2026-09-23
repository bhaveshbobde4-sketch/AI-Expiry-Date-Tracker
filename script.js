const STORAGE_KEY = "expiryTrackerItems";

let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  renderInventory();
}

function openAddForm() {
  document.getElementById("addForm").classList.remove("hidden");
}

function closeAddForm() {
  document.getElementById("addForm").classList.add("hidden");
}

function addItem() {
  const name = document.getElementById("productName").value.trim();
  const expiry = document.getElementById("expiryDate").value;

  if (!name || !expiry) {
    alert("Please enter product name and expiry date.");
    return;
  }

  items.push({
    id: Date.now(),
    name,
    expiry
  });

  document.getElementById("productName").value = "";
  document.getElementById("expiryDate").value = "";
  closeAddForm();
  saveItems();
}

function deleteItem(id) {
  items = items.filter(item => item.id !== id);
  saveItems();
}

function markConsumed(id) {

    const item = items.find(item => item.id === id);

    if (!item) return;

    const consumedItems =
        JSON.parse(localStorage.getItem("consumedItems")) || [];

    consumedItems.push({
        ...item,
        consumedAt: new Date().toISOString()
    });

    localStorage.setItem(
        "consumedItems",
        JSON.stringify(consumedItems)
    );

    items = items.filter(item => item.id !== id);

    saveItems();
    renderInventory();
}

function getStatus(expiry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(expiry + "T00:00:00");
  const diff = Math.ceil((date - today) / 86400000);

  if (diff < 0) {
    return {
        text: "Expired",
        cls: "expired",
        days: diff
    };
}

if (diff <= 7) {
    return {
        text: "Expiring Soon",
        cls: "soon",
        days: diff
    };
}

return {
    text: "Safe",
    cls: "safe",
    days: diff
};
}

function daysText(days) {

    if (days < 0) {
        return `${Math.abs(days)} day(s) overdue`;
    }

    if (days === 0) {
        return "Expires today";
    }

    if (days === 1) {
        return "1 day left";
    }

    return `${days} days left`;
}

function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderInventory() {
  const list = document.getElementById("inventoryList");
  const empty = document.getElementById("emptyState");

  list.innerHTML = "";

  if (!items.length) {
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");

    items.sort((a, b) => a.expiry.localeCompare(b.expiry));

    items.forEach(item => {
      const status = getStatus(item.expiry);

      const card = document.createElement("div");
      card.className = "inventory-item";
      card.innerHTML = `
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>Expiry date: ${formatDate(item.expiry)}</p>
        </div>
        <small>${daysText(status.days)}</small>
        <span class="badge ${status.cls}">${status.text}</span>
        <div class="item-actions">

    <button
        class="consume-btn"
        onclick="markConsumed(${item.id})">
        ✓ Consumed
    </button>

    <button
        class="delete-btn"
        title="Delete item"
        onclick="deleteItem(${item.id})">
        ×
    </button>

</div>

      `;

      list.appendChild(card);
    });
  }

  const statuses = items.map(i => getStatus(i.expiry));
  document.getElementById("totalCount").textContent = items.length;
  document.getElementById("soonCount").textContent =
    statuses.filter(s => s.cls === "soon").length;
  document.getElementById("expiredCount").textContent =
    statuses.filter(s => s.cls === "expired").length;
}

const reminderPanel =
    document.getElementById("reminderPanel");

const consumeFirst =
    document.getElementById("consumeFirst");

const consumeItems =
    document.getElementById("consumeItems");

const sortedItems =
    [...items].sort((a, b) =>
        a.expiry.localeCompare(b.expiry)
    );

const expiredItems =
    sortedItems.filter(item =>
        getStatus(item.expiry).cls === "expired"
    );

const soonItems =
    sortedItems.filter(item =>
        getStatus(item.expiry).cls === "soon"
    );


// 🔔 SMART REMINDER

if (expiredItems.length > 0 || soonItems.length > 0) {

    reminderPanel.classList.remove("hidden");

    let message = "";

    if (expiredItems.length > 0) {
        message +=
            `⚠️ <strong>${expiredItems.length}</strong> item(s) are already expired.<br>`;
    }

    if (soonItems.length > 0) {
        message +=
            `🔔 <strong>${soonItems.length}</strong> item(s) are expiring within 7 days.`;
    }

    reminderPanel.innerHTML = message;

} else {

    reminderPanel.classList.add("hidden");
    reminderPanel.innerHTML = "";
}


// 🍽️ CONSUME FIRST

const consume = sortedItems
    .filter(item =>
        getStatus(item.expiry).cls !== "expired"
    )
    .slice(0, 3);

if (consume.length > 0) {

    consumeFirst.classList.remove("hidden");

    consumeItems.innerHTML = consume.map(item => {

        const status = getStatus(item.expiry);

        return `
            <div class="consume-card">

                <b>${escapeHtml(item.name)}</b>

                <small>
                    ${formatDate(item.expiry)}
                    •
                    ${daysText(status.days)}
                </small>

            </div>
        `;

    }).join("");

} else {

    consumeFirst.classList.add("hidden");
    consumeItems.innerHTML = "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  const previewWrap = document.getElementById("previewWrap");
  const scanMessage = document.getElementById("scanMessage");
  const readExpiryBtn = document.getElementById("readExpiryBtn");

  if (!imageInput || !preview || !previewWrap || !scanMessage || !readExpiryBtn) {
    console.error("Scan elements are missing from index.html");
    return;
  }

  imageInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      scanMessage.textContent = "❌ Please select an image file.";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      preview.src = event.target.result;
      previewWrap.classList.remove("hidden");
      scanMessage.textContent = "✅ Image uploaded successfully. Click Read Expiry Date.";
    };
    reader.onerror = function () {
      scanMessage.textContent = "❌ Could not read this image. Please try again.";
    };
    reader.readAsDataURL(file);
  });

  readExpiryBtn.addEventListener("click", function () {
    processImage();
  });
});

async function processImage() {
  const fileInput = document.getElementById("imageInput");
  const message = document.getElementById("scanMessage");
  const file = fileInput.files[0];

  if (!file) {
    message.textContent = "Please choose an image first.";
    return;
  }

  message.textContent = "🔍 Reading text from package... Please wait.";

  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: info => {
        if (info.status === "recognizing text") {
          const progress = Math.round((info.progress || 0) * 100);
          message.textContent = `🔍 OCR processing... ${progress}%`;
        }
      }
    });

    const text = result.data.text || "";

    console.log("OCR TEXT:", text);

    const detectedDate = findExpiryDate(text);

    if (detectedDate) {
      const dateForInput =
    detectedDate.getFullYear() + "-" +
    String(detectedDate.getMonth() + 1).padStart(2, "0") + "-" +
    String(detectedDate.getDate()).padStart(2, "0");

      message.innerHTML = `
        ✅ Expiry date detected:
        <b>${formatDate(dateForInput)}</b>

        <br><br>

        <button class="primary-btn"
          onclick="addDetectedItem('${dateForInput}')">
          Add to Inventory
        </button>

        <br><br>

        <small>
          OCR detected:
          ${escapeHtml(text.slice(0, 300))}
        </small>
      `;

    } else {

      message.innerHTML = `
        ⚠️ Expiry date could not be detected.

        <br><br>

        <small>
        OCR Text:
        ${escapeHtml(text.slice(0, 500) || "No text found")}
        </small>

        <br><br>

        Try a clearer and closer photo of the expiry label.
      `;
    }

  } catch (error) {

    console.error(error);

    message.textContent =
      "❌ OCR failed. Please try another clear image.";
  }
}

function findExpiryDate(text) {

  // Clean OCR text
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  console.log("Cleaned OCR:", cleaned);

  // Date formats supported:
  // DD/MM/YY
  // DD-MM-YY
  // DD.MM.YY
  // DD/MM/YYYY
  // DD-MM-YYYY
  // DD.MM.YYYY
  const datePattern =
    /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g;

  const dates = cleaned.match(datePattern);

  if (!dates || dates.length === 0) {
    console.log("No date found in OCR.");
    return null;
  }

  console.log("Possible dates found:", dates);

  // Convert OCR dates into valid JavaScript dates
  const validDates = dates
    .map(date => parseDateString(date))
    .filter(date => date !== null);

  if (validDates.length === 0) {
    console.log("No valid dates found.");
    return null;
  }

  // -----------------------------------------
  // PRIORITY 1: Expiry-related words
  // -----------------------------------------

  const expiryWords =
    /\b(?:EXP|EXPIRY|EXPIRY DATE|EXP DATE|USE BY|BEST BEFORE|BEST BY|BB|BBD)\b/i;

  const expiryMatch = cleaned.match(expiryWords);

  if (expiryMatch) {

    const afterExpiry =
      cleaned.slice(expiryMatch.index + expiryMatch[0].length);

    const nearbyDate =
      afterExpiry.match(datePattern);

    if (nearbyDate) {

      const expiryDate =
        parseDateString(nearbyDate[0]);

      if (expiryDate) {

        console.log(
          "Expiry-related date found:",
          nearbyDate[0]
        );

        return expiryDate;
      }
    }
  }

  // -----------------------------------------
  // PRIORITY 2: USE BY / BEST BEFORE
  // -----------------------------------------

  const useByMatch =
    cleaned.match(/\b(?:USE BY|BEST BEFORE|BEST BY)\b/i);

  if (useByMatch) {

    const textAfter =
      cleaned.slice(
        useByMatch.index + useByMatch[0].length
      );

    const nearbyDate =
      textAfter.match(datePattern);

    if (nearbyDate) {

      const expiryDate =
        parseDateString(nearbyDate[0]);

      if (expiryDate) {

        console.log(
          "Use-by date found:",
          nearbyDate[0]
        );

        return expiryDate;
      }
    }
  }

  // -----------------------------------------
  // PRIORITY 3: First valid date
  // -----------------------------------------

  console.log(
    "Using first valid OCR date:",
    dates[0]
  );

  return validDates[0];
}


function parseDateString(value) {

  const match =
    value.match(
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/
    );

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);

  let year = Number(match[3]);

  // Convert 25 → 2025
  if (year < 100) {
    year += 2000;
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  // Validate date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}


function addDetectedItem(expiry) {

  const name =
    prompt("Enter product name:", "Food Product");

  if (!name) return;

  items.push({
    id: Date.now(),
    name: name,
    expiry: expiry
  });

  saveItems();

  scrollToSection("inventory");
}


renderInventory();
renderHistory();

function filterInventory() {

    const searchInput =
        document.getElementById("inventorySearch");

    const statusFilter =
        document.getElementById("statusFilter");

    if (!searchInput || !statusFilter) return;

    const search =
        searchInput.value.toLowerCase().trim();

    const filter =
        statusFilter.value;

    const cards =
        document.querySelectorAll(".inventory-item");

    cards.forEach(card => {

        // Product name is inside <h3>
        const nameElement =
            card.querySelector("h3");

        const name =
            nameElement
                ? nameElement.textContent.toLowerCase()
                : "";

        // Find the status badge
        const badge =
            card.querySelector(".badge");

        let status = "all";

        if (badge) {

            if (badge.classList.contains("safe")) {
                status = "safe";
            }

            else if (badge.classList.contains("soon")) {
                status = "soon";
            }

            else if (badge.classList.contains("expired")) {
                status = "expired";
            }
        }

        const matchesSearch =
            name.includes(search);

        const matchesStatus =
            filter === "all" ||
            filter === status;

        if (matchesSearch && matchesStatus) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}
function renderHistory() {

    const historyList =
        document.getElementById("historyList");

    const emptyHistory =
        document.getElementById("emptyHistory");

    if (!historyList || !emptyHistory) return;

    const consumedItems =
        JSON.parse(
            localStorage.getItem("consumedItems")
        ) || [];

    historyList.innerHTML = "";

    if (consumedItems.length === 0) {

        emptyHistory.style.display = "block";
        return;
    }

    emptyHistory.style.display = "none";

    consumedItems
        .slice()
        .reverse()
        .forEach(item => {

            const card =
                document.createElement("div");

            card.className = "history-item";

            const consumedDate =
                new Date(item.consumedAt)
                    .toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    });

            card.innerHTML = `
                <div>
                    <h3>✓ ${escapeHtml(item.name)}</h3>
                    <p>Expiry date: ${formatDate(item.expiry)}</p>
                </div>

                <span>
                    Consumed on ${consumedDate}
                </span>
            `;

            historyList.appendChild(card);
        });
}
