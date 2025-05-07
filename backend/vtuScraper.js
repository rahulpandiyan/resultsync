// backend/vtuScraper.js
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { calculateSGPA } from './utils/sgpaCalculator.js';
import { updateRankings } from './utils/updateRankings.js'; // 📌 New import for updating class rank

const BASE_URL = 'https://results.vtu.ac.in/DJcbcs25/resultpage.php';
const CAPTCHA_URL = 'https://results.vtu.ac.in/captcha/vtu_captcha.php';

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}));

let cachedToken = null; // Store session token (after CAPTCHA fetch)

// 🥇 Fetch CAPTCHA image + Token
export async function fetchCaptcha() {
  try {
    const initRes = await client.get(BASE_URL);
    const $ = cheerio.load(initRes.data);
    cachedToken = $('input[name="Token"]').val();
    if (!cachedToken) throw new Error('Token not found on result page');

    const response = await client.get(`${CAPTCHA_URL}?_CAPTCHA&t=${Date.now()}`, {
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data, 'binary');
  } catch (err) {
    throw new Error('Failed to fetch CAPTCHA: ' + err.message);
  }
}

// 🥈 Fetch VTU Result and update ranks (class & university)
export async function fetchVTUResult(usn, captcha) {
  try {
    if (!cachedToken) {
      console.warn('[fetchVTUResult] No token cached—fetching CAPTCHA automatically.');
      await fetchCaptcha();
    }

    const form = new URLSearchParams();
    form.append('Token', cachedToken);
    form.append('lns', usn);
    form.append('captchacode', captcha);

    const resultRes = await client.post(BASE_URL, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const html = resultRes.data;

    // ❌ Handle errors
    if (/Invalid captcha code/i.test(html)) return { error: 'Invalid Captcha' };
    if (/Invalid USN/i.test(html)) return { error: 'Invalid USN' };

    const $ = cheerio.load(html);
    const name = $('table').first().find('tr').eq(1).find('td').eq(1).text().replace(':', '').trim();
    const universitySeatNumber = $('table').first().find('tr').eq(0).find('td').eq(1).text().trim();

    // Parse subjects + marks
    const subjects = [];
    $('.divTable .divTableBody .divTableRow').each((i, row) => {
      if (i === 0) return;
      const cells = $(row).find('.divTableCell');
      subjects.push({
        code: $(cells[0]).text().trim(),
        title: $(cells[1]).text().trim(),
        internal: parseInt($(cells[2]).text().trim()) || 0,
        external: parseInt($(cells[3]).text().trim()) || 0,
        total: parseInt($(cells[4]).text().trim()) || 0,
        result: $(cells[5]).text().trim(),
        announced: $(cells[6]).text().trim(),
      });
    });

    const { sgpa, semester, branch, percentage } = calculateSGPA(universitySeatNumber, subjects);
    const totalMarks = subjects.reduce((sum, subject) => sum + subject.total, 0);

    // Clean USN (remove ": " prefix if exists)
    const cleanUSN = universitySeatNumber.replace(/^:\s*/, '').trim().toUpperCase();
    const collegeCode = cleanUSN.substring(0, 3);
    const year = cleanUSN.substring(3, 5);
    const branchCode = cleanUSN.substring(5, 7);

    // ✨ Update Class + University Rank
    const rankInfo = await updateRankings({
      usn: cleanUSN,
      name,
      totalMarks,
      collegeCode,
      year,
      branch: branchCode
    });

    // If there's an error with rankInfo, handle it
    if (rankInfo.error) {
      return { error: rankInfo.error };
    }

    // ⏩ NEW: Determine PASS/FAIL
const hasFailed = subjects.some(subject => subject.result.toUpperCase() === 'F');
const status = hasFailed ? 'FAIL' : 'PASS';

    // Return result data with ranks
    return {
      name,
      universitySeatNumber: cleanUSN,
      subjects,
      totalMarks,
      sgpa,
      semester,
      percentage,
      branch,
      status,
      classRank: rankInfo.classRank,
      classSize: rankInfo.classSize,
      universityRank: rankInfo.universityRank,
      universitySize: rankInfo.universitySize
    };

  } catch (err) {
    console.error('[fetchVTUResult] error:', err.message);
    return {
      error: err.message.includes('Token') ? 'Session expired. Please fetch CAPTCHA again.' : 'Something went wrong. Check USN/CAPTCHA and try again.'
    };
  }
}
