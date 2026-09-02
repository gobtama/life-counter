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
const shareCard = document.getElementById("shareCard");
const xShareButton = document.getElementById("xShareButton");
const imageButton = document.getElementById("imageButton");
const shareMessage = document.getElementById("shareMessage");

const savedBirthdate = localStorage.getItem("birthdate");
const oneDayMs = 1000 * 60 * 60 * 24;

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

function shareToX() {
  const text = getShareText();
  const url =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(text);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

async function createResultImage() {
  if (typeof html2canvas === "undefined") {
    shareMessage.textContent = "画像生成機能を読み込めませんでした。";
    return;
  }

  imageButton.disabled = true;
  imageButton.textContent = "画像を作成中…";
  shareMessage.textContent = "";

  try {
    const canvas = await html2canvas(shareCard, {
      scale: 2,
      backgroundColor: "#f4f1eb",
      useCORS: true
    });

    canvas.toBlob(async function (blob) {
      if (blob === null) {
        shareMessage.textContent = "画像を作成できませんでした。";
        resetImageButton();
        return;
      }

      const file = new File(
        [blob],
        "人生カウンター.png",
        { type: "image/png" }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "人生カウンター",
            text: "人生カウンターの結果"
          });

          shareMessage.textContent = "結果画像を共有しました。";
        } catch (error) {
          if (error.name !== "AbortError") {
            shareMessage.textContent = "共有をキャンセルしました。";
          }
        }
      } else {
        const imageUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = imageUrl;
        link.download = "人生カウンター.png";
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
  imageButton.textContent = "結果を画像にする";
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
imageButton.addEventListener("click", createResultImage);

createBirthdateOptions();
setupInfoButtons();

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