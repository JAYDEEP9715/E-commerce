var products = [];
let productsLoaded = false;

async function loadProductData() {
    if (window.data && window.data.products) {
        products = window.data.products;
        productsLoaded = true;
    } else {
        // Try common locations: server/data.json then data.json
        const candidates = ['./server/data.json', './data.json', 'server/data.json', 'data.json'];
        for (const url of candidates) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const json = await res.json();
                if (json && json.products) {
                    products = json.products;
                    productsLoaded = true;
                    break;
                }
            } catch (e) {
                // ignore and try next
            }
        }
    }

    if (productsLoaded) {
        if (typeof window.renderProducts === 'function') window.renderProducts();
        if (typeof window.annotateStaticProducts === 'function') window.annotateStaticProducts();
    } else {
        console.error('Product data could not be loaded from any known JSON file.');
    }
}

loadProductData();