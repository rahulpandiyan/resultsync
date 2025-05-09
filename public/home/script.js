document.getElementById('refreshCaptcha').addEventListener('click', () => {
  // Reload captcha image
  document.getElementById('captchaImg').src = `/api/captcha?t=${Date.now()}`;
});


document.getElementById('resultForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const usn = document.getElementById('usn').value;
  const captcha = document.getElementById('captcha').value;

  const loaderWrapper = document.getElementById('loaderWrapper');
  const submitButton = document.querySelector('.get-result-btn');

  // Show loader and disable button
  loaderWrapper.style.display = 'flex';
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usn, captcha }),
    });

    const resultData = await response.json();
    console.log(resultData);

    // Hide loader and re-enable button
    loaderWrapper.style.display = 'none';
    submitButton.disabled = false;

    if (resultData.error) {
      alert(resultData.error);
      return;
    }
    document.getElementById('perfStats').style.display = 'grid';

    // Display student info
    document.getElementById('studentInfo').style.display = 'block';
    document.getElementById('studentName').innerText = resultData.name;
    document.getElementById('universitySeatNumber').innerText = resultData.universitySeatNumber;
    document.getElementById('studentSemester').innerText = resultData.semester;
    document.getElementById('studentBranch').innerText = resultData.branch;
    document.getElementById('studentSGPA').innerText = resultData.sgpa;
    document.getElementById('studentPercentage').innerText = resultData.percentage;

    document.getElementById('studentRank').innerText = resultData.classRank
      ? `#${resultData.classRank} out of ${resultData.classSize}`
      : 'Not available';

    document.getElementById('studentStatus').innerText =
      resultData.status === 'PASS' ? '✅ Pass' : '❌ Fail';

    document.getElementById('perfStats').style.display = 'grid';

    // Show result table
    document.getElementById('resultTable').style.display = 'block';

    if (!resultData.subjects || resultData.subjects.length === 0) {
      alert("No subject data available.");
      return;
    }

    const tableBody = document.querySelector('#resultTable tbody');
    tableBody.innerHTML = '';

    resultData.subjects.forEach(subject => {
      if (subject.code === "P -> PASS" && subject.title === "F -> FAIL") return;

      const result = subject.result === 'P' ? 'Pass' : subject.result === 'F' ? 'Fail' : subject.result;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${subject.code}</td>
        <td>${subject.title}</td>
        <td>${subject.internal}</td>
        <td>${subject.external}</td>
        <td>${subject.total}</td>
        <td><span class="badge ${result === 'Pass' ? 'pass' : 'fail'}">${result}</span></td>
      `;
      tableBody.appendChild(row);
    });

    // Hide form and show download button
    document.querySelector('.form-card').style.display = 'none';
    document.querySelector('.download-btn').style.display = 'inline-block';

  } catch (err) {
    // Hide loader and re-enable button even on error
    loaderWrapper.style.display = 'none';
    submitButton.disabled = false;
    console.error('Error occurred:', err);
    alert('An error occurred. Please try again later.');
  }
});

// PDF Download functionality
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.querySelector('.download-btn');

  downloadBtn.addEventListener('click', () => {
    // Elements to include in PDF (student info + stats + result table)
    const studentInfo = document.getElementById('studentInfo');
    const perfStats = document.getElementById('perfStats');
    const resultTable = document.getElementById('resultTable');

    // Ensure at least one block is visible (optional guard)
    if (studentInfo.style.display === 'none' && resultTable.style.display === 'none') {
      alert('No result data to download.');
      return;
    }

    // Create a container div to combine all parts into one PDF
    const pdfContent = document.createElement('div');

    // Add the "ResultSync - Congratulations" message to the PDF
    const title = document.createElement('h2');
    title.innerText = "ResultSync - Great job! Aim higher next time!"; // Your custom message
    // Set the title style (including color)
title.style.color = "#7d79ec";  // Change this to your desired color (e.g., your base color)

// Optional: Add more styling for the title
title.style.fontSize = "24px";  // Adjust font size if needed
title.style.textAlign = "center";  // Center align the title
    pdfContent.appendChild(title);

    pdfContent.appendChild(studentInfo.cloneNode(true));
    pdfContent.appendChild(perfStats.cloneNode(true));
    pdfContent.appendChild(resultTable.cloneNode(true));

    // Optional: Set padding/margins for better layout
    pdfContent.style.padding = '20px';

    // Use html2pdf to generate and download the PDF
    const opt = {
      margin:       0.3,
      filename:     'ResultSync_Result.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(pdfContent).save();
  });
});


// Add this JavaScript to your site
document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-close-btn');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  
  // Toggle menu when hamburger is clicked
  menuBtn.addEventListener('click', function() {
    document.body.classList.toggle('menu-open');
  });
  
  // Close menu when X button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when overlay is clicked
  if (navOverlay) {
    navOverlay.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when a link is clicked
  mobileNavLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  });
});


// === CONFIG ===
const COOLDOWN_SECONDS = 30;
const COOLDOWN_KEY = 'resultCooldownTimestamp';

// === ELEMENTS ===
const getResultBtn = document.querySelector('.get-result-btn');
const cooldownTimerEl = document.getElementById('cooldownTimer');
const trafficMessage = document.getElementById('trafficMessage');
const form = document.getElementById('resultForm');
const captchaImg = document.getElementById('captchaImg');
const refreshCaptchaBtn = document.getElementById('refreshCaptcha');
const captchaInput = document.getElementById('captcha');

// Track if we've had a cooldown
let hadActiveCooldown = false;

// === UTILS ===
function getRemainingCooldown() {
  const savedTimestamp = localStorage.getItem(COOLDOWN_KEY);
  if (!savedTimestamp) return 0;
  const expiresAt = parseInt(savedTimestamp, 10);
  const remaining = Math.floor((expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function startCooldown() {
  const expiresAt = Date.now() + COOLDOWN_SECONDS * 1000;
  localStorage.setItem(COOLDOWN_KEY, expiresAt);
  hadActiveCooldown = true; // Mark that we've had a cooldown
  updateButtonState();
}

function refreshCaptcha() {
  // Add random parameter to prevent caching
  const randomString = Math.random().toString(36).substring(2, 8);
  captchaImg.src = `/api/captcha?t=${randomString}`;
  captchaInput.value = '';
}

function updateButtonState() {
  const remaining = getRemainingCooldown();
  
  if (remaining > 0) {
    getResultBtn.disabled = true;
    getResultBtn.innerHTML = `<i class="fa-solid fa-clock"></i> Please Wait (${remaining}s)`;
    cooldownTimerEl.textContent = remaining;
    trafficMessage.style.display = 'flex';
  } else {
    getResultBtn.disabled = false;
    getResultBtn.innerHTML = `<i class="fa-solid fa-square-poll-vertical"></i> Get Result`;
    trafficMessage.style.display = 'none';
    
    // Only refresh if we're coming out of a cooldown period
    if (hadActiveCooldown) {
      refreshCaptcha();
      hadActiveCooldown = false;
    }
  }
}

// === INIT TIMER ===
function initCooldownTimer() {
  // Set up error handling (only refresh if initial load fails)
  captchaImg.addEventListener('error', refreshCaptcha);
  
  // Check if we're coming from a cooldown
  hadActiveCooldown = getRemainingCooldown() > 0;
  
  updateButtonState();
  const timerInterval = setInterval(() => {
    const remaining = getRemainingCooldown();
    cooldownTimerEl.textContent = remaining;
    getResultBtn.innerHTML = `<i class="fa-solid fa-clock"></i> Please Wait (${remaining}s)`;
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      updateButtonState();
    }
  }, 1000);
}

// === FORM SUBMISSION ===
if (form) {
  form.addEventListener('submit', function(e) {
    const remaining = getRemainingCooldown();
    
    if (remaining > 0) {
      e.preventDefault();
      trafficMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      if (form.checkValidity()) {
        // Start cooldown (which will trigger refresh when it ends)
        startCooldown();
        trafficMessage.style.display = 'flex';
        cooldownTimerEl.textContent = COOLDOWN_SECONDS;
        setTimeout(() => {
          trafficMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  });
}

// Manual refresh button
if (refreshCaptchaBtn) {
  refreshCaptchaBtn.addEventListener('click', refreshCaptcha);
}

// Initialize - will show initial captcha without refreshing
document.addEventListener('DOMContentLoaded', initCooldownTimer);