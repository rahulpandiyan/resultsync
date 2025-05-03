// rank.js

document.addEventListener('DOMContentLoaded', function() {
  // === Element references ===
  const classBtn = document.getElementById('classBtn');
  const univBtn = document.getElementById('univBtn');
  const usnInput = document.getElementById('usnInput');
  const form = document.getElementById('rankForm');
  const loader = document.getElementById('loader');
  const table = document.getElementById('rankTable');
  const tbody = table.querySelector('tbody');
  const shareBtn = document.getElementById('shareBtn');
  const summaryBox = document.getElementById('myRankSummary');
  const classRankText = document.getElementById('classRankText');
  const univRankText = document.getElementById('univRankText');
  const motivationalText = document.getElementById('motivationalText');

  let mode = 'class'; // default view
  let latestResults = { class: null, university: null }; // Cache both

  // === Toggle buttons (Class/Univ) ===
  classBtn.addEventListener('click', () => {
    mode = 'class';
    classBtn.classList.add('active');
    univBtn.classList.remove('active');
    showTable('class');
  });

  univBtn.addEventListener('click', () => {
    mode = 'university';
    univBtn.classList.add('active');
    classBtn.classList.remove('active');
    showTable('university');
  });

  // === Extract keys ===
  function extractKeys(usn) {
    const cleanUSN = usn.replace(/^:\s*/, '').trim().toUpperCase();
    const collegeCode = cleanUSN.substring(0, 3);
    const year = cleanUSN.substring(3, 5);
    const branch = cleanUSN.substring(5, 7);
    return {
      classKey: `${collegeCode}${year}${branch}`,
      univKey: `${year}${branch}`
    };
  }

  // === Display My Rank Summary ===
  function displayMyRank(usn, classRank, univRank) {
    classRankText.textContent = `🏆 Your Class Rank: ${classRank}`;
    
    if (univRank && univRank <= 100) {
      univRankText.textContent = `🌍 Your University Rank: ${univRank} (Top 100!)`;
    } else {
      univRankText.textContent = `🌍 Your University Rank: Not in Top 100`;
    }

    if (classRank <= 3) {
      motivationalText.textContent = "🔥 Amazing! You're among the toppers of your class!";
    } else if (classRank <= 10) {
      motivationalText.textContent = "💪 Great job! You're in the top 10 of your class.";
    } else {
      motivationalText.textContent = "✨ Keep pushing! Success is built step by step.";
    }

    summaryBox.style.display = 'block';
  }

  // === Form submit handler ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usn = usnInput.value.trim().toUpperCase();
    if (!usn || usn.length < 7) {
      alert("Please enter a valid full USN (like 1VJ23CS040)");
      return;
    }

    const { classKey, univKey } = extractKeys(usn);

    loader.style.display = 'block';
    table.style.display = 'none';
    summaryBox.style.display = 'none';
    tbody.innerHTML = '';
    shareBtn.style.display = 'none';

    try {
      // Fetch both class + university ranks in parallel
      const [classRes, univRes] = await Promise.all([
        fetch(`/api/class-rank?groupKey=${classKey}`).then(r => r.json()),
        fetch(`/api/university-rank?groupKey=${univKey}`).then(r => r.json())
      ]);

      if (classRes.error || univRes.error) {
        alert(classRes.error || univRes.error);
        loader.style.display = 'none';
        return;
      }

      // Store for toggling later
      latestResults.class = { data: classRes.results, usn };
      latestResults.university = { data: univRes.results, usn };

      // Calculate user class and university rank
      const userClassRankObj = classRes.results.find(r => r.usn === usn);
      const userUnivRankObj = univRes.results.find(r => r.usn === usn);

      const userClassRank = userClassRankObj ? userClassRankObj.rank : null;
      const userUnivRank = userUnivRankObj ? userUnivRankObj.rank : null;

      // Show table and summary
      showTable(mode);
      if (userClassRank) {
        displayMyRank(usn, userClassRank, userUnivRank);
      }

    } catch (err) {
      alert('Failed to fetch rankings');
      console.error(err);
    } finally {
      loader.style.display = 'none';
    }
  });

  // === Show table ===
  function showTable(viewMode) {
    table.style.display = 'table';
    tbody.innerHTML = '';

    const { data, usn } = latestResults[viewMode];
    const list = viewMode === 'university' ? data.slice(0, 100) : data; // Limit univ

    let studentRow = null;

    list.forEach(r => {
      let badge = '';
      if (r.rank === 1) badge = '🥇';
      else if (r.rank === 2) badge = '🥈';
      else if (r.rank === 3) badge = '🥉';

      const row = `<tr data-usn="${r.usn}">
        <td>#${r.rank} ${badge}</td>
        <td>${r.name}</td>
        <td>${r.usn}</td>
        <td>${r.totalMarks}</td>
      </tr>`;
      tbody.insertAdjacentHTML('beforeend', row);

      if (r.usn === usn) studentRow = r;
    });

    // Highlight student row + setup share button
    if (studentRow) {
      const studentRowElement = document.querySelector(`tr[data-usn="${studentRow.usn}"]`);
      studentRowElement.classList.add('highlight-row');

      shareBtn.style.display = 'inline-block';
      shareBtn.onclick = () => {
        const msg = `I got ${viewMode === 'class' ? 'Class' : 'University'} Rank #${studentRow.rank} (Total: ${studentRow.totalMarks} marks) in VTU Results! See where you stand with ResultSync https://beta.vtusync.in`;
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      };
    }
  }

  // === Mobile menu toggle ===
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-close-btn');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  });
});
