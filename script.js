const countButton = document.getElementById("countButton");
const birthdateInput = document.getElementById("birthdate");
const lifeProgressText = document.getElementById("lifeProgress");
const elapsedDaysText = document.getElementById("elapsedDays");
const cherryBlossomsText = document.getElementById("cherryBlossoms");
const fullMoonsText = document.getElementById("fullMoons");
const halleyText = document.getElementById("halley");
const saturdaysText = document.getElementById("saturdays");
const morningsText = document.getElementById("mornings");
const birthdaysText = document.getElementById("birthdays");

const savedBirthdate = localStorage.getItem("birthdate");
if (savedBirthdate !== null) {
  birthdateInput.value = savedBirthdate;
}

countButton.addEventListener("click", function () {
  const birthdate = birthdateInput.value;

  // ① 未入力チェック
  if (birthdate === "") {
    alert("生年月日を入力してください。");
    return;
  }

  const birthDate = new Date(birthdate);
  const today = new Date();

  // ② 未来の日付チェック
  if (birthDate > today) {
    alert("未来の日付は入力できません。");
    return;
  }

  // ③ 80歳以上チェック
  const lifeEndDate = new Date(birthDate);
  lifeEndDate.setFullYear(lifeEndDate.getFullYear() + 80);

  if (today >= lifeEndDate) {
    alert("このアプリは80歳までを基準に計算しています。");
    return;
  }
  localStorage.setItem("birthdate", birthdate);

  const diffMs = today - birthDate; 
  // 日付の差をミリ秒で返す
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Math.fllor：小数点以下を切り捨てる関数
  
  lifeEndDate.setFullYear(lifeEndDate.getFullYear() + 80); // getFullYear()：年を取る

  const totalLifeMs = lifeEndDate - birthDate;
  const elapsedLifeMs = today - birthDate;
  const oneDayMs = 1000 * 60 * 60 * 24;
  const lifeProgress = (elapsedLifeMs / totalLifeMs) * 100;
  const roundedProgress = lifeProgress.toFixed(1); // 小数点以下1桁
  
  const elapsedDays = Math.floor(elapsedLifeMs / oneDayMs);

  //桜
  let cherryBlossomCount = 0;

  for (
  let year = today.getFullYear();
  year <= lifeEndDate.getFullYear();
  year++
  ) {
  const cherrySeasonEnd = new Date(year, 3, 30);

  if (cherrySeasonEnd >= today && cherrySeasonEnd < lifeEndDate) {
    cherryBlossomCount++;
  }
 }
  // 満月
  const moonCycleDays = 29.53059;

  const remainingLifeMs = lifeEndDate - today;
  const remainingLifeDays = remainingLifeMs / oneDayMs;

  const fullMoonCount = Math.floor(remainingLifeDays / moonCycleDays);

  //ハレー彗星
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
  const remainingMs = lifeEndDate - today;
  const remainingDays = Math.ceil(remainingMs / oneDayMs); // ceil：小数点以下切り上げ
  const morningCount = Math.max(remainingDays, 0); // max：80歳も超える誕生日を入力された場合のマイナス表示防止
  // 誕生日
  let birthdayCount = 0;

  for (
    let year = today.getFullYear();
    year <= lifeEndDate.getFullYear();
    year++
  ) {
  const birthday = new Date(year, birthDate.getMonth(), birthDate.getDate());

  if (birthday >= today && birthday <= lifeEndDate) {
    birthdayCount++;
  }
}


  // 表示
  lifeProgressText.textContent = "人生消化率：" + roundedProgress + "%";
  elapsedDaysText.textContent = "すでに約" + elapsedDays.toLocaleString() + "日が経過しました。";
  // toLocaleString()：3桁ごとカンマ区切り
  cherryBlossomsText.textContent = "🌸 桜の季節　あと約" + cherryBlossomCount + "回";
  fullMoonsText.textContent = "🌕 満月　あと約" + fullMoonCount.toLocaleString() + "回";
  halleyText.textContent = "☄️ ハレー彗星　あと" + halleyCount + "回"; 
  saturdaysText.textContent = "📅 土曜日　あと約" + saturdayCount.toLocaleString() + "回";
  morningsText.textContent = "🌅 朝を迎える　あと約" + morningCount.toLocaleString() + "回";
  birthdaysText.textContent = "🎂 誕生日　あと約" + birthdayCount + "回";
});