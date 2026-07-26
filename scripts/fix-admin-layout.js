const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../app/admin/AdminLayoutClient.jsx');
let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// 1. Remove slugifyFieldLabel function and ensureFormFieldAttributes function
// Find: "function slugifyFieldLabel" ... up to "export default function AdminLayoutClient"
const startMarker = 'function slugifyFieldLabel(value = \'\') {';
const endMarker = 'export default function AdminLayoutClient({ children }) {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  // Remove from slugifyFieldLabel start to just before export default
  content = content.substring(0, startIdx) + content.substring(endIdx);
  console.log('Removed slugifyFieldLabel and ensureFormFieldAttributes functions');
} else {
  console.log('Could not find markers');
  process.exit(1);
}

// 2. Remove the window.fetch override useEffect
// Find the useEffect block that starts with window.fetch and replaces it
const fetchOverrideStart = '  useEffect(() => {';
const fetchOverrideEnd = '  }, [adminState.accessToken])';
const fetchStartIdx = content.indexOf(fetchOverrideStart);
// Find the specific one that mentions originalFetch within this block
// Search from the first useEffect after component state declarations
const afterStateDeclarations = content.indexOf('const verifyAdminAccess');
if (afterStateDeclarations === -1) {
  console.log('Could not find verifyAdminAccess');
  process.exit(1);
}

// Find the fetch override block - it's after verifyAdminAccess
const fetchBlock = content.indexOf('const originalFetch = window.fetch.bind(window)', afterStateDeclarations);
if (fetchBlock === -1) {
  console.log('Could not find originalFetch');
  process.exit(1);
}

// Find the start of this useEffect (backtrack to the nearest useEffect)
const useEffStart = content.lastIndexOf('\n  useEffect(', fetchBlock);
if (useEffStart === -1) {
  console.log('Could not find useEffect for fetch');
  process.exit(1);
}

// Find the end of this useEffect block - find "}, [adminState.accessToken])"
const fetchEnd = content.indexOf('}, [adminState.accessToken])', useEffStart);
if (fetchEnd === -1) {
  console.log('Could not find end of fetch useEffect');
  process.exit(1);
}
const fetchBlockEnd = fetchEnd + '}, [adminState.accessToken])'.length;

const replacement = `  // window.fetch override removed. Use adminApiFetch from lib/adminApiClient.js
  // which properly injects auth headers via Authorization Bearer token.
  // AdminLayoutClient should not monkey-patch global fetch.`;

content = content.substring(0, useEffStart + 1) + replacement + content.substring(fetchBlockEnd);
console.log('Removed window.fetch override');

// 3. Remove the MutationObserver useEffect for form field attributes
const observerStart = content.indexOf('const root = document.querySelector(\'[data-admin-root]\')');
if (observerStart === -1) {
  console.log('Could not find observer code');
  process.exit(1);
}

// Find the start of this useEffect
const obsEffStart = content.lastIndexOf('\n  useEffect(', observerStart);
if (obsEffStart === -1) {
  console.log('Could not find observer useEffect start');
  process.exit(1);
}

// Find the end - "}, [isLoginLikePath, pathname])"
const obsEnd = content.indexOf('}, [isLoginLikePath, pathname])', obsEffStart);
if (obsEnd === -1) {
  console.log('Could not find observer useEffect end');
  process.exit(1);
}
const obsBlockEnd = obsEnd + '}, [isLoginLikePath, pathname])'.length;

const obsReplacement = `  // MutationObserver for form field labels removed.
  // All form fields should use proper htmlFor/id patterns in their components.`;

content = content.substring(0, obsEffStart + 1) + obsReplacement + content.substring(obsBlockEnd);
console.log('Removed MutationObserver for form labels');

// Write the modified content
fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully');
