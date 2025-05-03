// backend/utils/updateRankings.js

import { db } from '../firebase.js';

// groupKey = "1VJ23CS"
// student = { usn, name, totalMarks }

export async function updateRankings({ usn, name, totalMarks, collegeCode, year, branch }) {
  const groupKey = `${collegeCode}${year}${branch}`;   // For class_rankings
  const universityKey = `${year}${branch}`;            // For university_rankings (branch-wise)

  const docRef = db.collection('class_rankings').doc(groupKey);
  const docSnap = await docRef.get();

  let results = [];
  if (docSnap.exists) {
    results = docSnap.data().results;
  }

  // Clean USN for matching
  const cleanUSN = usn.replace(/^:\s*/, '').trim().toUpperCase();

  // === Update CLASS RANK ===
  const existingIndex = results.findIndex(r =>
    r.usn.replace(/^:\s*/, '').trim().toUpperCase() === cleanUSN
  );

  if (existingIndex !== -1) {
    results[existingIndex].name = name;
    results[existingIndex].totalMarks = totalMarks;
  } else {
    results.push({ usn, name, totalMarks });
  }

  results.sort((a, b) => b.totalMarks - a.totalMarks);
  results.forEach((r, index) => {
    r.rank = index + 1;
  });

  await docRef.set({ results });

  // === Update UNIVERSITY RANK (branch-wise) ===
  const universityDocRef = db.collection('university_rankings').doc(universityKey);
  const universityDocSnap = await universityDocRef.get();

  let universityResults = [];
  if (universityDocSnap.exists) {
    universityResults = universityDocSnap.data().results;
  }

  const uniExistingIndex = universityResults.findIndex(r =>
    r.usn.replace(/^:\s*/, '').trim().toUpperCase() === cleanUSN
  );

  if (uniExistingIndex !== -1) {
    universityResults[uniExistingIndex].name = name;
    universityResults[uniExistingIndex].totalMarks = totalMarks;
  } else {
    universityResults.push({ usn, name, totalMarks });
  }

  universityResults.sort((a, b) => b.totalMarks - a.totalMarks);
  universityResults.forEach((r, index) => {
    r.rank = index + 1;
  });

  await universityDocRef.set({ results: universityResults });

  // === Return updated ranks ===
  const updatedStudent = results.find(r => r.usn.replace(/^:\s*/, '').trim().toUpperCase() === cleanUSN);
  const updatedUniStudent = universityResults.find(r => r.usn.replace(/^:\s*/, '').trim().toUpperCase() === cleanUSN);

  return {
    classRank: updatedStudent.rank,
    classSize: results.length,
    universityRank: updatedUniStudent.rank,
    universitySize: universityResults.length
  };
}
