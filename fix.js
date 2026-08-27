const fs = require('fs');

function fixLogin() {
  const file = 'app/login/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove all if (!mounted) return null
  content = content.replace(/  if \(\!mounted\) return null\n\n/g, '');
  
  // Find LoginPageContent
  const funcStart = content.indexOf('function LoginPageContent() {');
  // insert if (!mounted) return null right before the return statement inside LoginPageContent
  
  // Let's just find the first return statement after funcStart
  // This is too fragile. Instead I'll use multi_edit.
}
fixLogin();
