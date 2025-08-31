// Quick script to fetch public vendor products and print real design positions
// Usage: node print-design-positions.js [baseUrl]
// Default baseUrl: http://localhost:3000

const baseUrl = process.argv[2] || 'http://localhost:3000';

async function main() {
  const url = `${baseUrl.replace(/\/$/, '')}/public/vendor-products?allProducts=true&limit=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const products = json?.data?.products || json?.data || [];
    if (!Array.isArray(products)) {
      console.log('Unexpected response shape:', JSON.stringify(json, null, 2));
      process.exit(1);
    }

    console.log(`Fetched ${products.length} products from ${url}`);
    for (const p of products) {
      const positions = p.designPositions || [];
      if (positions.length === 0) {
        console.log(`- Product ${p.id} ${p.vendorName || p.name || ''}: no designPositions`);
        continue;
      }
      console.log(`- Product ${p.id} ${p.vendorName || p.name || ''}:`);
      positions.forEach((dp, idx) => {
        const pos = dp.position || {};
        const out = {
          index: idx,
          designId: dp.designId,
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          rotation: pos.rotation,
          designWidth: pos.designWidth ?? pos.design_width ?? pos.width,
          designHeight: pos.designHeight ?? pos.design_height ?? pos.height,
        };
        console.log(`  position[${idx}]:`, out);
      });
    }
  } catch (err) {
    console.error('Error fetching positions:', err);
    process.exit(1);
  }
}

main();


