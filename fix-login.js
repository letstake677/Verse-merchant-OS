const fs = require('fs');
let content = fs.readFileSync('app/login/page.tsx', 'utf8');
content = content.replace(/if \(\!mounted\) return null\n/g, '');
content = content.replace(/const \[mounted, setMounted\] = React\.useState\(false\)\n  React\.useEffect\(\(\) => \{ setMounted\(true\) \}, \[\]\)\n  /g, '');
fs.writeFileSync('app/login/page.tsx', content);
