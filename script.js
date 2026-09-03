const countButton = document.getElementById("countButton");
const birthYear = document.getElementById("birthYear");
const birthMonth = document.getElementById("birthMonth");
const birthDay = document.getElementById("birthDay");

const lifeProgressText = document.getElementById("lifeProgress");
const elapsedDaysText = document.getElementById("elapsedDays");
const cherryBlossomsText = document.getElementById("cherryBlossoms");
const fullMoonsText = document.getElementById("fullMoons");
const halleyText = document.getElementById("halley");
const saturdaysText = document.getElementById("saturdays");
const morningsText = document.getElementById("mornings");
const birthdaysText = document.getElementById("birthdays");

const progressFill = document.getElementById("progressFill");
const results = document.getElementById("results");
const loadingOverlay = document.getElementById("loadingOverlay");
const xShareButton = document.getElementById("xShareButton");
const lineShareButton = document.getElementById("lineShareButton");
const instagramShareButton = document.getElementById("instagramShareButton");
const imageButton = document.getElementById("imageButton");
const shareMessage = document.getElementById("shareMessage");
const eventForm = document.getElementById("eventForm");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventRepeat = document.getElementById("eventRepeat");
const eventImage = document.getElementById("eventImage");
const eventImagePreview = document.getElementById("eventImagePreview");
const eventImagePreviewPicture = document.getElementById("eventImagePreviewPicture");
const removeEventImageButton = document.getElementById("removeEventImageButton");
const saveEventButton = document.getElementById("saveEventButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const eventFormMessage = document.getElementById("eventFormMessage");
const eventList = document.getElementById("eventList");

const savedBirthdate = localStorage.getItem("birthdate");
const oneDayMs = 1000 * 60 * 60 * 24;
const eventsStorageKey = "lifeCounterEvents";
let editingEventId = null;
let pendingEventImage = null;
let customEvents = loadCustomEvents();

function loadCustomEvents() {
  try {
    const storedEvents = JSON.parse(localStorage.getItem(eventsStorageKey) || "[]");

    if (!Array.isArray(storedEvents)) {
      return [];
    }

    return storedEvents
      .filter(function (event) {
        return (
        event &&
        typeof event.id === "string" &&
        typeof event.name === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(event.date)
        );
      })
      .map(function (event) {
        return {
          id: event.id,
          name: event.name,
          date: event.date,
          repeat: event.repeat || (event.yearly ? "yearly" : "none"),
          backgroundImage:
            typeof event.backgroundImage === "string" ? event.backgroundImage : null
        };
      });
  } catch (error) {
    console.error("予定を読み込めませんでした。", error);
    return [];
  }
}

function saveCustomEvents() {
  localStorage.setItem(eventsStorageKey, JSON.stringify(customEvents));
}

function createEventId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseLocalDate(dateText) {
  const parts = dateText.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function createClampedAnniversaryDate(originalDate, year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(originalDate.getDate(), lastDay));
}

function getNextEventOccurrence(event, today) {
  const originalDate = parseLocalDate(event.date);

  if (event.repeat === "none") {
    return { targetDate: originalDate, count: null };
  }

  if (event.repeat === "monthly") {
    let count =
      (today.getFullYear() - originalDate.getFullYear()) * 12 +
      today.getMonth() -
      originalDate.getMonth();
    count = Math.max(count, 1);

    let targetMonth = originalDate.getMonth() + count;
    let targetDate = createClampedAnniversaryDate(
      originalDate,
      originalDate.getFullYear() + Math.floor(targetMonth / 12),
      ((targetMonth % 12) + 12) % 12
    );

    if (targetDate < today) {
      count++;
      targetMonth = originalDate.getMonth() + count;
      targetDate = createClampedAnniversaryDate(
        originalDate,
        originalDate.getFullYear() + Math.floor(targetMonth / 12),
        ((targetMonth % 12) + 12) % 12
      );
    }

    return { targetDate, count };
  }

  let count = Math.max(today.getFullYear() - originalDate.getFullYear(), 1);
  let targetDate = createClampedAnniversaryDate(
    originalDate,
    originalDate.getFullYear() + count,
    originalDate.getMonth()
  );

  if (targetDate < today) {
    count++;
    targetDate = createClampedAnniversaryDate(
      originalDate,
      originalDate.getFullYear() + count,
      originalDate.getMonth()
    );
  }

  return { targetDate, count };
}

function formatEventDate(event, occurrence) {
  const targetDate = occurrence.targetDate;

  if (event.repeat === "monthly") {
    return (
      occurrence.count +
      "か月記念日・" +
      (targetDate.getMonth() + 1) +
      "月" +
      targetDate.getDate() +
      "日"
    );
  }

  if (event.repeat === "yearly") {
    return (
      occurrence.count +
      "年記念日・" +
      targetDate.getFullYear() +
      "年" +
      (targetDate.getMonth() + 1) +
      "月" +
      targetDate.getDate() +
      "日"
    );
  }

  return (
    targetDate.getFullYear() +
    "年" +
    (targetDate.getMonth() + 1) +
    "月" +
    targetDate.getDate() +
    "日"
  );
}

function getCountdownLabel(daysLeft) {
  if (daysLeft < 0) {
    return "終了";
  }

  if (daysLeft === 0) {
    return "今日";
  }

  return "あと" + daysLeft.toLocaleString() + "日";
}

function createEventActionButton(label, className, eventId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "event-action-button " + className;
  button.dataset.eventId = eventId;
  button.textContent = label;
  return button;
}

function renderCustomEvents() {
  eventList.replaceChildren();

  if (customEvents.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "event-empty";
    emptyMessage.textContent = "予定を追加すると、ここに残り日数が表示されます。";
    eventList.appendChild(emptyMessage);
    return;
  }

  const today = startOfToday();
  const sortedEvents = customEvents
    .map(function (event) {
      const occurrence = getNextEventOccurrence(event, today);
      const daysLeft = Math.round((occurrence.targetDate - today) / oneDayMs);
      return { event, occurrence, daysLeft };
    })
    .sort(function (a, b) {
      const aPast = a.daysLeft < 0;
      const bPast = b.daysLeft < 0;

      if (aPast !== bPast) {
        return aPast ? 1 : -1;
      }

      return a.occurrence.targetDate - b.occurrence.targetDate;
    });

  sortedEvents.forEach(function (item) {
    const eventItem = document.createElement("article");
    eventItem.className = "event-item";

    if (item.daysLeft < 0) {
      eventItem.classList.add("is-past");
    }

    if (item.event.backgroundImage) {
      eventItem.classList.add("has-background");
      eventItem.style.backgroundImage =
        "linear-gradient(rgba(238, 243, 247, 0.62), rgba(238, 243, 247, 0.78)), url(\"" +
        item.event.backgroundImage +
        "\")";
    }

    const details = document.createElement("div");
    const name = document.createElement("p");
    const date = document.createElement("p");
    const countdown = document.createElement("p");
    const actions = document.createElement("div");

    name.className = "event-item-name";
    name.textContent = item.event.name;
    date.className = "event-item-date";
    date.textContent = formatEventDate(item.event, item.occurrence);
    countdown.className = "event-countdown";
    countdown.textContent = getCountdownLabel(item.daysLeft);
    actions.className = "event-item-actions";

    details.append(name, date);
    actions.append(
      createEventActionButton("編集", "event-edit-button", item.event.id),
      createEventActionButton("削除", "event-delete-button", item.event.id)
    );
    eventItem.append(details, countdown, actions);
    eventList.appendChild(eventItem);
  });
}

function resetEventForm(message = "") {
  eventForm.reset();
  editingEventId = null;
  pendingEventImage = null;
  updateEventImagePreview();
  saveEventButton.textContent = "予定を追加";
  cancelEditButton.hidden = true;
  eventFormMessage.textContent = message;
}

function updateEventImagePreview() {
  if (!pendingEventImage) {
    eventImagePreview.hidden = true;
    eventImagePreviewPicture.removeAttribute("src");
    return;
  }

  eventImagePreviewPicture.src = pendingEventImage;
  eventImagePreview.hidden = false;
}

function resizeImageToDataUrl(image, maxSize, quality) {
  const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function compressEventImage(file) {
  return new Promise(function (resolve, reject) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = function () {
      let dataUrl = resizeImageToDataUrl(image, 900, 0.72);

      if (dataUrl.length > 600000) {
        dataUrl = resizeImageToDataUrl(image, 700, 0.58);
      }

      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };

    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像を読み込めませんでした。"));
    };

    image.src = objectUrl;
  });
}

async function handleEventImageChange() {
  const file = eventImage.files[0];

  if (!file) {
    return;
  }

  eventFormMessage.textContent = "画像を準備しています…";

  try {
    pendingEventImage = await compressEventImage(file);
    updateEventImagePreview();
    eventFormMessage.textContent = "背景画像を設定しました。";
  } catch (error) {
    console.error(error);
    eventImage.value = "";
    eventFormMessage.textContent = "この画像は読み込めませんでした。";
  }
}

function handleEventSubmit(event) {
  event.preventDefault();

  const name = eventName.value.trim();
  const date = eventDate.value;
  const repeat = eventRepeat.value;

  if (name === "" || date === "") {
    eventFormMessage.textContent = "予定の名前と日付を入力してください。";
    return;
  }

  if (repeat === "none" && parseLocalDate(date) < startOfToday()) {
    eventFormMessage.textContent = "過去の日付は、記念日の開始日として登録してください。";
    return;
  }

  if (repeat !== "none" && parseLocalDate(date) >= startOfToday()) {
    eventFormMessage.textContent = "記念日の開始日は、今日より前の日付を選んでください。";
    return;
  }

  if (editingEventId === null) {
    customEvents.push({
      id: createEventId(),
      name,
      date,
      repeat,
      backgroundImage: pendingEventImage
    });

    try {
      saveCustomEvents();
    } catch (error) {
      customEvents.pop();
      eventFormMessage.textContent = "保存容量が足りません。背景画像を外して試してください。";
      return;
    }
    renderCustomEvents();
    resetEventForm("予定を追加しました。");
    return;
  }

  customEvents = customEvents.map(function (savedEvent) {
    if (savedEvent.id !== editingEventId) {
      return savedEvent;
    }

    return {
      ...savedEvent,
      name,
      date,
      repeat,
      backgroundImage: pendingEventImage
    };
  });

  try {
    saveCustomEvents();
  } catch (error) {
    customEvents = loadCustomEvents();
    eventFormMessage.textContent = "保存容量が足りません。背景画像を外して試してください。";
    return;
  }
  renderCustomEvents();
  resetEventForm("予定を更新しました。");
}

function startEventEdit(eventId) {
  const targetEvent = customEvents.find(function (savedEvent) {
    return savedEvent.id === eventId;
  });

  if (!targetEvent) {
    return;
  }

  editingEventId = eventId;
  eventName.value = targetEvent.name;
  eventDate.value = targetEvent.date;
  eventRepeat.value = targetEvent.repeat;
  pendingEventImage = targetEvent.backgroundImage;
  updateEventImagePreview();
  saveEventButton.textContent = "変更を保存";
  cancelEditButton.hidden = false;
  eventFormMessage.textContent = "「" + targetEvent.name + "」を編集中です。";
  eventName.focus();
}

function deleteCustomEvent(eventId) {
  const targetEvent = customEvents.find(function (savedEvent) {
    return savedEvent.id === eventId;
  });

  if (!targetEvent || !confirm("「" + targetEvent.name + "」を削除しますか？")) {
    return;
  }

  customEvents = customEvents.filter(function (savedEvent) {
    return savedEvent.id !== eventId;
  });

  saveCustomEvents();
  renderCustomEvents();

  if (editingEventId === eventId) {
    resetEventForm();
  }
}

function handleEventListClick(event) {
  const button = event.target.closest("button[data-event-id]");

  if (!button) {
    return;
  }

  if (button.classList.contains("event-edit-button")) {
    startEventEdit(button.dataset.eventId);
  }

  if (button.classList.contains("event-delete-button")) {
    deleteCustomEvent(button.dataset.eventId);
  }
}

function createBirthdateOptions() {
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= currentYear - 100; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year + "年";
    birthYear.appendChild(option);
  }

  for (let month = 1; month <= 12; month++) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month + "月";
    birthMonth.appendChild(option);
  }

  updateDayOptions();
}

function updateDayOptions() {
  const selectedDay = birthDay.value;
  const year = Number(birthYear.value) || 2000;
  const month = Number(birthMonth.value) || 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  birthDay.innerHTML = '<option value="">日</option>';

  for (let day = 1; day <= daysInMonth; day++) {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day + "日";
    birthDay.appendChild(option);
  }

  if (Number(selectedDay) <= daysInMonth) {
    birthDay.value = selectedDay;
  }
}

function getLifeDates(showAlert = true) {
  const year = birthYear.value;
  const month = birthMonth.value;
  const day = birthDay.value;

  if (year === "" || month === "" || day === "") {
    if (showAlert) {
      alert("生年月日をすべて選択してください。");
    }

    return null;
  }

  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();

  if (birthDate > today) {
    if (showAlert) {
      alert("未来の日付は入力できません。");
    }

    return null;
  }

  const lifeEndDate = new Date(birthDate);
  lifeEndDate.setFullYear(lifeEndDate.getFullYear() + 80);

  if (today >= lifeEndDate) {
    if (showAlert) {
      alert("このアプリは80歳までを基準に計算しています。");
    }

    return null;
  }

  const birthdate =
    year +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0");

  return {
    birthdate,
    birthDate,
    today,
    lifeEndDate
  };
}

function calculateLife(data) {
  const { birthdate, birthDate, today, lifeEndDate } = data;

  localStorage.setItem("birthdate", birthdate);

  const elapsedLifeMs = today - birthDate;
  const totalLifeMs = lifeEndDate - birthDate;
  const lifeProgress = (elapsedLifeMs / totalLifeMs) * 100;
  const roundedProgress = lifeProgress.toFixed(1);
  const elapsedDays = Math.floor(elapsedLifeMs / oneDayMs);

  const remainingLifeMs = lifeEndDate - today;
  const remainingLifeDays = remainingLifeMs / oneDayMs;

  // 桜
  let cherryBlossomCount = 0;

  for (let year = today.getFullYear(); year <= lifeEndDate.getFullYear(); year++) {
    const cherrySeasonEnd = new Date(year, 3, 30);

    if (cherrySeasonEnd >= today && cherrySeasonEnd < lifeEndDate) {
      cherryBlossomCount++;
    }
  }

  // 満月
  const moonCycleDays = 29.53059;
  const fullMoonCount = Math.floor(remainingLifeDays / moonCycleDays);

  // ハレー彗星
  const nextHalleyDate = new Date(2061, 6, 28);
  let halleyCount = 0;

  if (nextHalleyDate >= today && nextHalleyDate <= lifeEndDate) {
    halleyCount = 1;
  }

  // 土曜日
  let saturdayCount = 0;
  const checkDate = new Date(today);

  while (checkDate <= lifeEndDate) {
    if (checkDate.getDay() === 6) {
      saturdayCount++;
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  // 朝
  const remainingDays = Math.ceil(remainingLifeMs / oneDayMs);
  const morningCount = Math.max(remainingDays, 0);

  // 誕生日
  let birthdayCount = 0;

  for (let year = today.getFullYear(); year <= lifeEndDate.getFullYear(); year++) {
    const birthday = new Date(
      year,
      birthDate.getMonth(),
      birthDate.getDate()
    );

    if (birthday >= today && birthday <= lifeEndDate) {
      birthdayCount++;
    }
  }

  lifeProgressText.textContent = roundedProgress;
  elapsedDaysText.textContent =
    "すでに約" + elapsedDays.toLocaleString() + "日が経過しました。";

  cherryBlossomsText.textContent = cherryBlossomCount.toLocaleString();
  fullMoonsText.textContent = fullMoonCount.toLocaleString();
  halleyText.textContent = halleyCount.toLocaleString();
  saturdaysText.textContent = saturdayCount.toLocaleString();
  morningsText.textContent = morningCount.toLocaleString();
  birthdaysText.textContent = birthdayCount.toLocaleString();

  const progress = Math.min(Math.max(lifeProgress, 0), 100);
  progressFill.style.width = progress + "%";
}

function revealCards(animate = true) {
  const cards = document.querySelectorAll(".counter-card");

  cards.forEach(function (card) {
    card.classList.remove("reveal");
  });

  if (!animate) {
    cards.forEach(function (card) {
      card.classList.add("reveal");
    });

    return;
  }

  cards.forEach(function (card, index) {
    setTimeout(function () {
      card.classList.add("reveal");
    }, index * 90);
  });
}

function handleCountClick() {
  const data = getLifeDates();

  if (data === null) {
    return;
  }

  loadingOverlay.classList.add("show");

  setTimeout(function () {
    calculateLife(data);
    results.classList.add("show");

    setTimeout(function () {
      loadingOverlay.classList.remove("show");
      revealCards(true);

      setTimeout(function () {
        results.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 250);
    }, 250);
  }, 900);
}

function getShareText() {
  return (
    "人生消化率 " +
    lifeProgressText.textContent +
    "%\n\n" +
    "🌸 桜の季節 あと" +
    cherryBlossomsText.textContent +
    "回\n" +
    "🌕 満月 あと" +
    fullMoonsText.textContent +
    "回\n" +
    "☄️ ハレー彗星 あと" +
    halleyText.textContent +
    "回\n" +
    "📅 土曜日 あと" +
    saturdaysText.textContent +
    "回\n" +
    "🌅 朝 あと" +
    morningsText.textContent +
    "回\n" +
    "🎂 誕生日 あと" +
    birthdaysText.textContent +
    "回\n\n" +
    "#人生カウンター"
  );
}

function getAppUrl() {
  return window.location.origin + window.location.pathname;
}

function shareToX() {
  const text = getShareText();
  const url =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text) +
    "&url=" +
    encodeURIComponent(getAppUrl());

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

function shareToLine() {
  const message = getShareText() + "\n\n" + getAppUrl();
  const url = "https://line.me/R/share?text=" + encodeURIComponent(message);

  window.location.href = url;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function loadShareIcon() {
  return new Promise(function (resolve) {
    const icon = new Image();

    icon.onload = function () {
      resolve(icon);
    };

    icon.onerror = function () {
      resolve(null);
    };

    icon.src = "./icons/icon-192.png";
  });
}

async function createShareCanvas() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = 1080;
  const height = 1350;
  const padding = 64;

  canvas.width = width;
  canvas.height = height;

  context.fillStyle = "#eef3f7";
  context.fillRect(0, 0, width, height);

  const icon = await loadShareIcon();

  if (icon !== null) {
    context.drawImage(icon, padding, 50, 76, 76);
  }

  context.fillStyle = "#101820";
  context.font = "700 44px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.textBaseline = "middle";
  context.fillText("人生カウンター", 158, 78);

  context.fillStyle = "#66717d";
  context.font = "500 25px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("あなたの人生、あと何回？", 160, 116);

  drawRoundedRect(context, padding, 164, width - padding * 2, 336, 36);
  context.fillStyle = "#101820";
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 30px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("80歳までの人生", 112, 216);

  const progress = Math.min(Math.max(Number(lifeProgressText.textContent), 0), 100);
  const progressLabel = lifeProgressText.textContent;

  context.font = "800 126px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText(progressLabel, 108, 324);
  const progressWidth = context.measureText(progressLabel).width;

  context.fillStyle = "#2457ff";
  context.font = "800 54px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("%", 118 + progressWidth, 348);

  drawRoundedRect(context, 112, 404, 856, 16, 8);
  context.fillStyle = "#444444";
  context.fill();

  if (progress > 0) {
    drawRoundedRect(context, 112, 404, 856 * (progress / 100), 16, 8);
    context.fillStyle = "#2457ff";
    context.fill();
  }

  context.fillStyle = "#c0c0c0";
  context.font = "500 25px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText(elapsedDaysText.textContent, 112, 458);

  context.fillStyle = "#101820";
  context.font = "800 43px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("あと、何回？", padding, 570);

  context.fillStyle = "#66717d";
  context.font = "500 24px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("いつもの景色も、数えると少し違って見える。", padding, 613);

  const counters = [
    { icon: "🌸", name: "桜の季節", value: cherryBlossomsText.textContent },
    { icon: "🌕", name: "満月", value: fullMoonsText.textContent },
    { icon: "☄️", name: "ハレー彗星", value: halleyText.textContent },
    { icon: "📅", name: "土曜日", value: saturdaysText.textContent },
    { icon: "🌅", name: "朝", value: morningsText.textContent },
    { icon: "🎂", name: "誕生日", value: birthdaysText.textContent }
  ];
  const gap = 18;
  const cardWidth = (width - padding * 2 - gap) / 2;
  const cardHeight = 158;
  const cardTop = 650;

  counters.forEach(function (counter, index) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = padding + column * (cardWidth + gap);
    const y = cardTop + row * (cardHeight + gap);

    drawRoundedRect(context, x, y, cardWidth, cardHeight, 24);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#d4dde5";
    context.lineWidth = 2;
    context.stroke();

    context.font = "38px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
    context.fillText(counter.icon, x + 30, y + 43);

    context.fillStyle = "#34404c";
    context.font = "700 25px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
    context.fillText(counter.name, x + 82, y + 43);

    context.fillStyle = "#151515";
    context.font = "800 52px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
    context.fillText(counter.value, x + 30, y + 112);
    const valueWidth = context.measureText(counter.value).width;

    context.fillStyle = "#66717d";
    context.font = "700 24px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
    context.fillText("回", x + 40 + valueWidth, y + 119);
  });

  context.fillStyle = "#66717d";
  context.font = "500 22px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.fillText("※ 80歳まで生きると仮定した、おおよその回数です。", padding, 1232);

  context.fillStyle = "#101820";
  context.font = "700 23px -apple-system, BlinkMacSystemFont, 'Noto Sans JP', sans-serif";
  context.textAlign = "right";
  context.fillText("gobtama.github.io/life-counter/", width - padding, 1288);
  context.textAlign = "left";

  return canvas;
}

async function createResultImage(preferredTarget = "generic") {

  imageButton.disabled = true;
  imageButton.textContent = "画像を作成中…";
  shareMessage.textContent = "";

  try {
    const canvas = await createShareCanvas();

    canvas.toBlob(async function (blob) {
      if (blob === null) {
        shareMessage.textContent = "画像を作成できませんでした。";
        resetImageButton();
        return;
      }

      const file = new File(
        [blob],
        "人生カウンター_4x5.png",
        { type: "image/png" }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          const shareData = { files: [file] };

          if (preferredTarget !== "instagram") {
            shareData.title = "人生カウンター";
            shareData.text = "人生カウンターの結果\n" + getAppUrl();
          }

          if (preferredTarget === "instagram") {
            shareMessage.textContent = "共有先からInstagramを選んでください。";
          }

          await navigator.share(shareData);

          shareMessage.textContent =
            preferredTarget === "instagram"
              ? "Instagramへの共有画面を開きました。"
              : "結果画像を共有しました。";
        } catch (error) {
          if (error.name !== "AbortError") {
            shareMessage.textContent = "共有をキャンセルしました。";
          }
        }
      } else {
        const imageUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = imageUrl;
        link.download = "人生カウンター_4x5.png";
        link.click();

        URL.revokeObjectURL(imageUrl);
        shareMessage.textContent = "結果画像を保存しました。";
      }

      resetImageButton();
    }, "image/png");
  } catch (error) {
    console.error(error);
    shareMessage.textContent = "画像の作成に失敗しました。";
    resetImageButton();
  }
}

function resetImageButton() {
  imageButton.disabled = false;
  instagramShareButton.disabled = false;
  imageButton.textContent = "画像を保存・共有";
  instagramShareButton.textContent = "Instagramでシェア";
}

async function shareToInstagram() {
  instagramShareButton.disabled = true;
  instagramShareButton.textContent = "画像を作成中…";

  await createResultImage("instagram");
}

function setupInfoButtons() {
  const infoButtons = document.querySelectorAll(".info-button");

  infoButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const card = button.closest(".counter-card");
      const isOpen = card.classList.contains("info-open");

      document.querySelectorAll(".counter-card").forEach(function (otherCard) {
        otherCard.classList.remove("info-open");
      });

      if (!isOpen) {
        card.classList.add("info-open");
      }
    });
  });

  document.querySelectorAll(".counter-info").forEach(function (info) {
    info.addEventListener("click", function () {
      info.closest(".counter-card").classList.remove("info-open");
    });
  });
}

birthYear.addEventListener("change", updateDayOptions);
birthMonth.addEventListener("change", updateDayOptions);
countButton.addEventListener("click", handleCountClick);
xShareButton.addEventListener("click", shareToX);
lineShareButton.addEventListener("click", shareToLine);
instagramShareButton.addEventListener("click", shareToInstagram);
imageButton.addEventListener("click", function () {
  createResultImage();
});
eventForm.addEventListener("submit", handleEventSubmit);
eventList.addEventListener("click", handleEventListClick);
eventImage.addEventListener("change", handleEventImageChange);
removeEventImageButton.addEventListener("click", function () {
  pendingEventImage = null;
  eventImage.value = "";
  updateEventImagePreview();
  eventFormMessage.textContent = "背景画像を外しました。";
});
cancelEditButton.addEventListener("click", function () {
  resetEventForm();
});

createBirthdateOptions();
setupInfoButtons();
renderCustomEvents();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function (error) {
      console.error("Service Workerの登録に失敗しました。", error);
    });
  });
}

if (savedBirthdate !== null) {
  const parts = savedBirthdate.split("-");

  if (parts.length === 3) {
    birthYear.value = Number(parts[0]);
    birthMonth.value = Number(parts[1]);

    updateDayOptions();

    birthDay.value = Number(parts[2]);

    const savedData = getLifeDates(false);

    if (savedData !== null) {
      calculateLife(savedData);
      results.classList.add("show");
      revealCards(false);
    }
  }
}
