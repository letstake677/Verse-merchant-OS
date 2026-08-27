const fs = require('fs');
let content = fs.readFileSync('app/pay/[id]/page.tsx', 'utf8');
content = content.replace(/if \(\!mounted\) return null\n\n  /g, '');
content = content.replace(/const \[mounted, setMounted\] = React\.useState\(false\)\n  React\.useEffect\(\(\) => \{ setMounted\(true\) \}, \[\]\)\n  /g, '');
fs.writeFileSync('app/pay/[id]/page.tsx', content);
