const fs = require('fs');
const path = 'app/admin/AdminLayoutClient.jsx';
let c = fs.readFileSync(path, 'utf8');

// The problem: after the last </div> closing the Surface parent div,
// we need to close:
// 1. The sticky header `<div className="sticky top-0 z-50">` 
// 2. The outermost `<div className="min-h-screen acadvizen-noise">`
// 
// Current snippet around lines 355-362:
//   </Surface>
//         </div>
//       <div data-admin-root ...
//         {children}
//       </div>
//   )
// }
//
// We need to add two </div> between the </Surface> sibling div and <div data-admin-root>
// AND add </div> after </div> closing the data-admin-root

// Strategy: Replace the last occurrence of the specific pattern
const lines = c.split('\n');

// Find the main return block ending
// We need to find: "        </div>" followed by "      <div data-admin-root"
// And insert two more closing divs before "<div data-admin-root"

let result = [];
let fixed = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Check if this line is "      <div data-admin-root" (7 spaces)
  // and the previous line (i-1) is "        </div>" (8 spaces)
  if (!fixed && i > 0 && trimmed.startsWith('<div data-admin-root')) {
    const prevLine = lines[i - 1].trim();
    if (prevLine === '</div>') {
      // Insert two closing divs before this line
      result.push('        </div>');
      result.push('      </div>');
      result.push(line);
      fixed = true;
      continue;
    }
  }
  result.push(line);
}

c = result.join('\n');

// Now fix the end: we have 
//   </div>          (closes data-admin-root)
//   )               (closes return)
//   }               (closes function)
// Need to add </div> before the )
// The last </div> in the output should be followed by </div>

// Find "      </div>" followed by "  )" and replace with three closing divs
c = c.replace(
  '      </div>\n  )\n}',
  '      </div>\n    </div>\n  )\n}'
);

fs.writeFileSync(path, c);
console.log('Fixed successfully');
