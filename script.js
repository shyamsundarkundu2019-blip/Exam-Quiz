// ---------- ভ্যারিয়েবল ----------
const subjectSelect = document.getElementById("subject");
const chapterBox = document.getElementById("chapterBox");
const chapterSelect = document.getElementById("chapter");
const quizDiv = document.getElementById("quiz");
const controlsNav = document.getElementById("controls-nav");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const submitBtn = document.getElementById("submit");
const resultDiv = document.getElementById("result");
const timerDiv = document.getElementById("timer");
const themeToggle = document.getElementById("themeToggle");

let questions = {};
let chapterQuestions = [];
let currentIndex = 0;
let selectedAnswers = {};
let timer;
let timeLeft = 60;

// ---------- Subject Load ----------
subjectSelect.addEventListener("change", async () => {
  let file = subjectSelect.value;
  if (!file) return;

  let res = await fetch(file);
  questions = await res.json();

  chapterSelect.innerHTML = "";
  Object.keys(questions).forEach(chap => {
    let opt = document.createElement("option");
    opt.value = chap;
    opt.textContent = chap;
    chapterSelect.appendChild(opt);
  });

  chapterBox.style.display = "block";
});

// ---------- Chapter Load ----------
chapterSelect.addEventListener("change", () => {
  let chap = chapterSelect.value;
  if (!chap) return;

  chapterQuestions = questions[chap];
  currentIndex = 0;
  selectedAnswers = {};
  resultDiv.innerHTML = "";
  controlsNav.style.display = "block";

  startTimer();
  showQuestion();
});

// ---------- Show Question ----------
function showQuestion() {
  let q = chapterQuestions[currentIndex];
  quizDiv.innerHTML = `
    <div class="question">প্রশ্ন ${currentIndex + 1}: ${q.question}</div>
    ${q.options.map(opt => `
      <button class="option ${selectedAnswers[currentIndex] === opt ? 'selected' : ''}"
        onclick="selectOption('${opt}')">${opt}</button>
    `).join("")}
  `;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === chapterQuestions.length - 1;
}

function selectOption(opt) {
  selectedAnswers[currentIndex] = opt;
  showQuestion();
}

// ---------- Navigation ----------
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < chapterQuestions.length - 1) {
    currentIndex++;
    showQuestion();
  }
});

submitBtn.addEventListener("click", showResult);

// ---------- Timer ----------
function startTimer() {
  clearInterval(timer);
  timeLeft = 60;
  timerDiv.textContent = `⏰ সময়: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `⏰ সময়: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      showResult();
    }
  }, 1000);
}

// ---------- Result ----------
function showResult() {
  clearInterval(timer);
  let correct = 0;
  let reviewHTML = "";
  let answersForPDF = [];

  chapterQuestions.forEach((q, i) => {
    let userAnswer = selectedAnswers[i] || "❌ উত্তর দাওনি";
    let isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;

    answersForPDF.push({
      question: q.question,
      user: userAnswer,
      correct: q.answer,
      status: isCorrect ? "✅ সঠিক" : "❌ ভুল"
    });

    reviewHTML += `
      <div style="margin:15px; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:left;">
        <b>প্রশ্ন ${i + 1}:</b> ${q.question} <br>
        <b>তোমার উত্তর:</b> <span style="color:${isCorrect ? 'green' : 'red'};">${userAnswer}</span> <br>
        <b>সঠিক উত্তর:</b> ✅ ${q.answer}
      </div>
    `;
  });

  let wrong = chapterQuestions.length - correct;
  let scorePercent = (correct / chapterQuestions.length * 100).toFixed(2);

  resultDiv.innerHTML = `
    <h2>📊 রেজাল্ট</h2>
    ✅ সঠিক: ${correct}<br>
    ❌ ভুল: ${wrong}<br>
    ⭐ স্কোর: ${scorePercent}%<br><br>
    <h3>📖 রিভিউ</h3>
    ${reviewHTML}
    <br>
    <button onclick="downloadPDF()" style="padding:10px; background:#2196f3; color:white;">📥 PDF ডাউনলোড</button>
  `;

  quizDiv.innerHTML = "";
  controlsNav.style.display = "none";
  timerDiv.textContent = "";

  // Pie Chart
  const ctxPie = document.getElementById("scoreChart").getContext("2d");
  new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: ["সঠিক", "ভুল"],
      datasets: [{ data: [correct, wrong], backgroundColor: ["#4caf50", "#f44336"] }]
    }
  });

  // Bar Chart
  const ctxBar = document.getElementById("barChart").getContext("2d");
  new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: chapterQuestions.map((_, i) => `Q${i+1}`),
      datasets: [{
        label: "সঠিক হলে 1, ভুল হলে 0",
        data: chapterQuestions.map((q, i) => (selectedAnswers[i] === q.answer ? 1 : 0)),
        backgroundColor: chapterQuestions.map((q, i) =>
          selectedAnswers[i] === q.answer ? "#4caf50" : "#f44336"
        )
      }]
    },
    options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // ---------- PDF Download ----------
  window.downloadPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("📊 কুইজ রেজাল্ট", 10, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`✅ সঠিক: ${correct}`, 10, y); y += 7;
    doc.text(`❌ ভুল: ${wrong}`, 10, y); y += 7;
    doc.text(`⭐ স্কোর: ${scorePercent}%`, 10, y); y += 10;

    answersForPDF.forEach((ans, i) => {
      doc.text(`${i+1}. ${ans.question}`, 10, y);
      y += 7;
      doc.text(`তোমার উত্তর: ${ans.user}`, 15, y);
      y += 7;
      doc.text(`সঠিক উত্তর: ${ans.correct}`, 15, y);
      y += 7;
      doc.text(`স্ট্যাটাস: ${ans.status}`, 15, y);
      y += 10;
      if (y > 270) { doc.addPage(); y = 10; }
    });

    doc.save("quiz_result.pdf");
  }
}

// ---------- Theme Change ----------
const themes = ["theme1", "theme2", "theme3", "theme4", "theme5"];
let currentTheme = 0;

themeToggle.addEventListener("click", () => {
  document.body.classList.remove(...themes);
  currentTheme = (currentTheme + 1) % themes.length;
  document.body.classList.add(themes[currentTheme]);
});
