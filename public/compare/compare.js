document.addEventListener('DOMContentLoaded', function () {
  // Add friend USN input field
  document.getElementById('addFriendBtn').addEventListener('click', () => {
    const container = document.getElementById('friendsUsnsContainer');
    const friendGroup = document.createElement('div');
    friendGroup.className = 'friend-input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = "Friend's USN";
    input.className = 'friendUsnInput';
    input.required = true;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-friend-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    removeBtn.addEventListener('click', () => {
      container.removeChild(friendGroup);
    });
    
    friendGroup.appendChild(input);
    friendGroup.appendChild(removeBtn);
    container.appendChild(friendGroup);
  });

  // Refresh captcha
  document.getElementById('refreshCaptcha').addEventListener('click', () => {
    document.getElementById('captchaImg').src = `/api/captcha?t=${Date.now()}`;
  });

  // Form submission
  document.getElementById('comparisonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usn = document.getElementById('usn').value.trim();
    const friendInputs = document.querySelectorAll('.friendUsnInput');
    const captcha = document.getElementById('captcha').value.trim();

    const usns = [usn, ...Array.from(friendInputs).map(input => input.value.trim())].filter(Boolean);

    if (usns.length < 2) {
      alert('Please enter at least 1 friend\'s USN to compare.');
      return;
    }

    // Show loader and hide table
    document.getElementById('loader').style.display = 'block';
    document.getElementById('resultsTable').style.display = 'none';

    try {
      const response = await fetch('/api/result/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usns, captcha })
      });

      const data = await response.json();
      document.getElementById('loader').style.display = 'none';

      if (data.error) {
        alert(data.error);
        return;
      }

      // Process and display results
      const table = document.getElementById('resultsTable');
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';

      data.results.forEach((result, index) => {
        const row = document.createElement('tr');
        
        // Determine score class for coloring
        const totalMarks = parseInt(result.totalMarks) || 0;
        let scoreClass = 'score-medium';
        if (totalMarks > 800) scoreClass = 'score-high';
        else if (totalMarks < 600) scoreClass = 'score-low';

        // Format subjects grid
        const subjectsGrid = document.createElement('div');
        subjectsGrid.className = 'subjects-grid';
        
        result.subjects
          .filter(sub => !(sub.code.includes('PASS') || sub.title.includes('FAIL')))
          .forEach(sub => {
            const subScore = parseInt(sub.total) || 0;
            let cardClass = 'medium';
            if (subScore > 80) cardClass = 'high';
            else if (subScore < 50) cardClass = 'low';
            
            const subjectCard = document.createElement('div');
            subjectCard.className = `subject-card ${cardClass}`;
            subjectCard.innerHTML = `
              <div class="subject-name">${sub.code}</div>
              <div class="subject-marks">${sub.total}</div>
              <div class="subject-percentage">${Math.round((subScore / 100) * 100)}%</div>
            `;
            subjectsGrid.appendChild(subjectCard);
          });

        row.innerHTML = `
          <td data-label="Student">
            <div class="student-card">
              <div class="student-avatar">${result.name.charAt(0)}</div>
              <div class="student-details">
                <div class="student-name">${result.name}</div>
                <div class="usn-badge">
                  <i class="fas fa-id-card"></i> ${result.universitySeatNumber}
                </div>
              </div>
            </div>
          </td>
          <td data-label="Total Marks" class="${scoreClass}">${result.totalMarks}</td>
          <td data-label="Rank">#${result.rank || index + 1}</td>
          <td data-label="Subjects"></td>
        `;
        
        // Append subjects grid to the cell
        const subjectsCell = row.querySelector('td:last-child');
        subjectsCell.appendChild(subjectsGrid);
        
        tbody.appendChild(row);

        // Add comparison indicators
        addComparisonIndicators(subjectsGrid, index, data.results);
      });

      table.style.display = 'table';

    } catch (err) {
      document.getElementById('loader').style.display = 'none';
      alert('An error occurred. Please try again.');
      console.error(err);
    }
  });

  // Share button functionality
  document.getElementById('shareBtn').addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({
        title: 'VTU Results Comparison',
        text: 'Check out my VTU results comparison!',
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
      });
    } else {
      alert('Web Share API not supported in your browser');
    }
  });

  // Mobile menu functionality
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-close-btn');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  
  // Toggle menu when hamburger is clicked
  menuBtn.addEventListener('click', function () {
    document.body.classList.toggle('menu-open');
  });
  
  // Close menu when X button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when overlay is clicked
  if (navOverlay) {
    navOverlay.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when a link is clicked
  mobileNavLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
    });
  });
});

// Comparison indicators
function addComparisonIndicators(subjectsGrid, studentIndex, allResults) {
  const subjectCards = subjectsGrid.querySelectorAll('.subject-card');
  
  subjectCards.forEach(card => {
    const subjectCode = card.querySelector('.subject-name').textContent;
    const subjectMarks = parseInt(card.querySelector('.subject-marks').textContent);
    
    // Compare with all other students
    let isHighest = true;
    let isLowest = true;
    let comparisonCount = 0;
    let higherCount = 0;
    
    allResults.forEach((result, idx) => {
      if (idx !== studentIndex) {
        const otherSubjects = result.subjects.filter(sub => !(sub.code.includes('PASS') || sub.title.includes('FAIL')));
        const otherSubject = otherSubjects.find(sub => sub.code === subjectCode);
        
        if (otherSubject) {
          comparisonCount++;
          const otherMarks = parseInt(otherSubject.total) || 0;
          
          if (subjectMarks >= otherMarks) {
            higherCount++;
          } else {
            isHighest = false;
          }
          
          if (subjectMarks <= otherMarks) {
            isLowest = false;
          }
        }
      }
    });
    
    // Add indicator based on comparison
    const indicator = document.createElement('div');
    indicator.className = 'comparison-indicator';
    
    if (comparisonCount > 0) {
      if (isHighest) {
        indicator.classList.add('highest');
      } else if (isLowest) {
        indicator.classList.add('lowest');
      } else if (higherCount === comparisonCount) {
        indicator.classList.add('higher');
      } else if (higherCount === 0) {
        indicator.classList.add('lower');
      } else {
        // For middle scores, you could add a neutral indicator or skip
        return; // Skip adding indicator for middle scores
      }
      
      card.appendChild(indicator);
    }
  });
}
