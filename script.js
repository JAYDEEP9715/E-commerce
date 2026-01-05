// Product and cart logic

let users = [];
let orders = [];

// Load user and order data
if (window.data) {
    users = window.data.users || [];
    orders = window.data.orders || [];
    // Merge with localStorage
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    users = [...users, ...localUsers];
    const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
    orders = [...orders, ...localOrders];
} else {
    // Fallback to fetch
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            users = data.users;
            orders = data.orders;
            // Merge with localStorage
            const localUsers = JSON.parse(localStorage.getItem('users')) || [];
            users = [...users, ...localUsers];
            const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            orders = [...orders, ...localOrders];
        })
        .catch(error => console.error('Error loading data:', error));
}

// Responsive menu
const bar = document.getElementById("bar");
const close = document.getElementById("close");
const nav = document.getElementById("navbar");

if(bar){
    bar.addEventListener("click", () => {
        nav.classList.add("active")
    })
}

if(close){
    close.addEventListener("click", () => {
        nav.classList.remove("active")
    })
}

let container = document.getElementById("product");
let currentFilter = 'all';
function renderProducts(){
    // Only render if container exists
   if(!container) return;
   console.log('rendering products', products.length);
   const list = products.filter(p => {
       if(currentFilter === 'all') return true;
       return String(p.category || '').toLowerCase() === currentFilter.toLowerCase();
   });
   console.log('filtered list', list.length);
   container.innerHTML = list.map((p)=>{
       const stars = `<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>`;
       return `  <div class="pro" data-id="${p.id}" data-category="">
                   <a class="product-link" href="product.html?id=${p.id}"><img src="${p.img}" alt=""></a>
                   <div class="des">
                        <h5>${p.title}</h5>
                       <div class="star">
                           ${stars}
                       </div>
                       <h4>₹${Math.round(p.price)}</h4>
                   </div>
                   <a href="#" data-id="${p.id}"><i class="fal fa-shopping-cart cart"></i></a>
               </div>
   `}).join('')
   console.log('HTML set, length:', container.innerHTML.length);
}

// Annotate static product blocks
function annotateStaticProducts(){
    document.querySelectorAll('.pro').forEach(pro => {
        // Skip already annotated
        const img = pro.querySelector('img')?.src || '';
        const filename = img.split('/').pop();
        const product = products.find(p => p.img && p.img.endsWith(filename));
        if(product){
            // Set category for filtering
            pro.setAttribute('data-category', product.category || '');
            // Remove existing badge
            const existing = pro.querySelector('.badge');
            if (existing) existing.remove();
        }
    });
}

// Run annotation on load
annotateStaticProducts();
// Apply filter buttons
document.addEventListener('click', function(e){
    const btn = e.target.closest('.filter-btn');
    if(!btn) return;
    // Toggle active class
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    // Re-render if container present
    if(container) renderProducts();
    // Show/hide static product blocks
    const staticPros = document.querySelectorAll('.pro');
    staticPros.forEach(pro => {
        // Infer product by image filename
        const img = pro.querySelector('img')?.src || '';
        const filename = img.split('/').pop();
        const product = products.find(p => p.img && p.img.endsWith(filename));
        if(!product) return; // No match
        if(currentFilter === 'all'){
            pro.style.display = '';
        } else {
            pro.style.display = (String(product.category || '').toLowerCase() === currentFilter.toLowerCase()) ? '' : 'none';
        }
    });
});

// Export functions for async loading
window.renderProducts = renderProducts;
window.annotateStaticProducts = annotateStaticProducts;

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// configuration: when true, add-to-cart will auto-redirect after showing the toast
// Set to false to keep users on the current page after adding to cart.
const AUTO_REDIRECT_ON_ADD = false;

// save cart and update UI
function saveCart(){
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartCount();
    // brief pop animation on the cart count
    document.querySelectorAll('.cart-count').forEach(el => {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 300);
    });
    // update mini cart display
    renderMiniCart();
}

// Mini-cart preview (rendered and managed via JS)
function renderMiniCart(){
    let mini = document.getElementById('mini-cart');
    if(!mini){
        mini = document.createElement('div');
        mini.id = 'mini-cart';
        mini.className = 'mini-cart';
        document.body.appendChild(mini);
    }

    if(cart.length === 0){
        mini.innerHTML = `<div class="mini-empty">Your cart is empty</div>`;
        mini.setAttribute('aria-hidden','true');
        return;
    }

    const itemsHtml = cart.slice(0,4).map(i => `
        <div class="mini-item">
            <img src="${i.img}" alt="">
            <div class="mini-info">
                <div class="mini-title">${i.title}</div>
                <div class="mini-variant">${i.size ? 'Size: '+i.size : ''}${i.color ? (i.size ? ' • ' : '') + 'Color: '+i.color : ''}</div>
                <div class="mini-qty">Qty: ${i.quantity || 1}</div>
            </div>
                <div class="mini-price">₹${Math.round((i.price) * (i.quantity || 1))}</div>
        </div>
    `).join('');

    const more = cart.length > 4 ? `<div class="mini-more">+${cart.length - 4} more</div>` : '';
    const total = cart.reduce((s,i) => s + (i.price * (i.quantity || 1)), 0);

    mini.innerHTML = `
        <div class="mini-header">Cart <button class="mini-close" aria-label="Close">&times;</button></div>
        <div class="mini-items">${itemsHtml}${more}</div>
        <div class="mini-footer">
            <div class="mini-total">Total: ₹${Math.round(total)}</div>
            <div class="mini-actions"><a href="cart.html" class="mini-view">View Cart</a><button id="mini-checkout" class="normal">Checkout</button></div>
        </div>
    `;
    mini.setAttribute('aria-hidden','true');
}

function showMiniCart(){
    renderMiniCart();
    const mini = document.getElementById('mini-cart');
    if(!mini) return;
    mini.setAttribute('aria-hidden','false');
    mini.classList.add('visible');
    clearTimeout(mini._timeout);
    mini._timeout = setTimeout(()=>{
        mini.setAttribute('aria-hidden','true');
        mini.classList.remove('visible');
    }, 4500);
}

function hideMiniCart(){
    const mini = document.getElementById('mini-cart');
    if(!mini) return;
    mini.setAttribute('aria-hidden','true');
    mini.classList.remove('visible');
    clearTimeout(mini._timeout);
}

function renderCartCount(){
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    console.log('Updating cart count to:', count);
    document.querySelectorAll('.cart-count').forEach(el => {
        console.log('Updating el:', el, 'to', count);
        el.textContent = count;
    })
}

// Initialize cart count on load
renderCartCount();

// add product to cart (increments quantity if already present)
function addtoCart(id){
    if (!localStorage.getItem('loggedInUser')) {
        alert('Please login to add items to cart');
        return;
    }
    const product = products.find(p => p.id === id);
    console.log('Adding to cart, id:', id, 'product:', product);
    if(!product){
        showToast('Product not found');
        return;
    }
    console.log('Product price:', product.price);
    const existing = cart.find(item => item.id === id && !item.size && !item.color);
    if(existing){
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        const uid = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        cart.push({ ...product, quantity: 1, uid });
    }
    saveCart();
    // show a small toast with 'View Cart' option (non-blocking)
    showAddToast(product.title);
}

// Render cart page table if present
function renderCartPage(){
    const tbody = document.getElementById('cart-items');
    const summaryEl = document.getElementById('cart-summary');
    const footerEl = document.getElementById('cart-footer');
    if(!tbody) return;
    if(cart.length === 0){
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Your cart is empty</td></tr>`;
        if(summaryEl) summaryEl.innerHTML = '';
        if(footerEl) footerEl.innerHTML = '';
        // ensure cart section is visible at top when opening cart page
        if (window.location.href.includes('cart.html') || window.location.pathname.includes('cart.html')) {
            const cartSection = document.getElementById('cart');
            if (cartSection) cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    tbody.innerHTML = cart.map(item => `
        <tr>
            <td><a href="#" class="remove-item" data-uid="${item.uid || item.id}"><i class="far fa-times-circle"></i></a></td>
            <td><img src="${item.img}" alt="" style="width:80px"></td>
            <td>
                ${item.title}
                ${ (item.size || item.color) ? `<div class="cart-variant">${item.size ? 'Size: '+item.size : ''}${item.color ? (item.size ? ' • ' : '') + 'Color: '+item.color : ''}</div>` : '' }
            </td>
            <td class="price">₹${Math.round(item.price)}</td>
            <td><button class="qty-minus" data-uid="${item.uid || item.id}" style="background:#088178; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">-</button><span class="qty-display" style="display:inline-block; min-width:30px; text-align:center; font-weight:bold; padding:5px; background:#f9f9f9; margin:0 5px;">${item.quantity || 1}</span><button class="qty-plus" data-uid="${item.uid || item.id}" style="background:#088178; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">+</button></td>
            <td class="subtotal">₹${Math.round((item.price) * (item.quantity || 1))}</td>
        </tr>
    `).join('');

    // Add event listeners for quantity buttons
    setTimeout(() => {
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.onclick = () => {
                const uid = btn.dataset.uid;
                const item = cart.find(i => (i.uid || i.id) == uid);
                if(item && item.quantity > 1){
                    item.quantity--;
                    saveCart();
                    renderCartPage();
                }
            };
        });
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.onclick = () => {
                const uid = btn.dataset.uid;
                const item = cart.find(i => (i.uid || i.id) == uid);
                if(item){
                    item.quantity++;
                    saveCart();
                    renderCartPage();
                }
            };
        });
    }, 0);

    // compute total
    const total = cart.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    if(summaryEl){
        summaryEl.innerHTML = `
            <h3>Cart Total: ₹<span id="cart-total">${Math.round(total)}</span></h3>
            <button id="checkout" class="normal">Proceed to Checkout</button>
            <button id="clear-cart" class="white">Clear Cart</button>
        `;
    }
    if(footerEl){
        footerEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:right; font-weight:700; padding:12px 8px;">Total</td>
                <td style="font-weight:700; padding:12px 8px;">₹${Math.round(total)}</td>
            </tr>
        `;
    }
    // when rendering the cart page, scroll the cart section to top of viewport
    if (window.location.href.includes('cart.html') || window.location.pathname.includes('cart.html')) {
        const cartSection = document.getElementById('cart');
        if (cartSection) cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
} 

// checkout / clear handlers
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'checkout'){
        e.preventDefault();
        openCheckoutModal();
    }
    if(e.target && e.target.id === 'clear-cart'){
        e.preventDefault();
        if(confirm('Remove all items from cart?')){
            cart = [];
            saveCart();
            renderCartPage();
        }
    }
});

// remove item
function removeFromCart(uid){
    cart = cart.filter(item => {
        const key = item.uid ? String(item.uid) : String(item.id);
        return key !== String(uid);
    });
    saveCart();
    renderCartPage();
}

// handle clicks for remove and quantity changes
document.addEventListener('click', function(e){
    const rem = e.target.closest('.remove-item');
    if(rem){
        e.preventDefault();
        const uid = rem.dataset.uid;
        removeFromCart(uid);
    }
});

document.addEventListener('change', function(e){
    if(e.target.classList.contains('qty')){
        const uid = e.target.dataset.uid;
        const qty = parseInt(e.target.value, 10) || 1;
        const item = cart.find(i => (i.uid ? i.uid === uid : String(i.id) === String(uid)));
        if(item){
            item.quantity = qty;
            saveCart();
            renderCartPage();
        }
    }
});

// delegate clicks on cart icons for static product blocks (that don't use addtoCart inline)
document.addEventListener('click', function(e){
    const cartIcon = e.target.closest('.cart');
    if(!cartIcon) return;
    // ignore ones that use inline onClick (they're handled already)
    if(e.target.closest('[onClick]')) return;
    e.preventDefault();
    const anchor = e.target.closest('a');
    const dataId = anchor?.dataset?.id || e.target.closest('.pro')?.dataset?.id;
    if (dataId) {
        const product = products.find(p => String(p.id) === String(dataId));
        if (product) {
            addtoCart(product.id);
            return;
        }
        // product data not loaded yet -- fall back to DOM-based add
        const pro = e.target.closest('.pro');
        if (!pro) return;
        const title = pro.querySelector('.des h5')?.textContent?.trim() || pro.querySelector('.des span')?.textContent?.trim() || 'Product';
        const priceText = pro.querySelector('.des h4')?.textContent?.replace('$','') || '0';
        const img = pro.querySelector('img')?.src || '';
        const price = parseFloat(priceText) || 0;
        const tempId = Date.now();
        const uid = `${tempId}-${Math.random().toString(36).slice(2,7)}`;
        cart.push({ id: tempId, uid, title, price, img, quantity: 1 });
        saveCart();
        showAddToast(title);
        return;
    }
    const pro = e.target.closest('.pro');
    if(!pro) return;
    const title = pro.querySelector('.des h5')?.textContent?.trim() || 'Product';
    const priceText = pro.querySelector('.des h4')?.textContent?.replace('$','') || '0';
    const img = pro.querySelector('img')?.src || '';
    const price = parseFloat(priceText) || 0;
    const tempId = Date.now();
    const uid = `${tempId}-${Math.random().toString(36).slice(2,7)}`;
    cart.push({ id: tempId, uid, title, price, img, quantity: 1 });
    saveCart();
    // show a small toast with 'View Cart' option (non-blocking)
    showAddToast(title);
});

// allow clicking a static product block to open the product detail page (handles anchors and images)
document.addEventListener('click', function(e){
    const pro = e.target.closest('.pro');
    if(!pro) return;
    // ignore clicks on cart icon
    if(e.target.closest('.cart')) return;

    const anchor = e.target.closest('a');
    // if anchor already points to a product page, allow default behavior
    if(anchor && anchor.getAttribute && String(anchor.getAttribute('href')).includes('product.html')) return;
    // prevent default when clicking an anchor that doesn't navigate anywhere
    if(anchor && anchor.getAttribute && anchor.getAttribute('href') === '#') e.preventDefault();

    const imgEl = pro.querySelector('img');
    const title = pro.querySelector('.des h5')?.textContent?.trim() || '';
    const filename = imgEl?.src ? imgEl.src.split('/').pop() : '';
    const product = products.find(p => (p.img && p.img.endsWith(filename)) || (p.title === title));
    if(product){
        window.location.href = `product.html?id=${product.id}`;
    }
});

// show a dismissible toast (message string)
function showToast(message){
    // remove existing toast
    const existing = document.querySelector('.site-toast');
    if(existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.innerHTML = `
        <div class="toast-body">
            <div class="toast-msg">${message}</div>
            <div class="toast-actions">
                <a class="toast-view" href="cart.html">View cart</a>
                <button class="toast-close">Continue</button>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    // trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // auto remove after 3.2s if user doesn't interact
    const timeout = setTimeout(()=>{ toast.remove(); }, 3200);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        toast.remove();
    });
}

// show login prompt toast
function showLoginToast(){
    // remove existing toast
    const existing = document.querySelector('.site-toast');
    if(existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.innerHTML = `
        <div class="toast-body">
            <div class="toast-msg">Please login to add items to cart</div>
            <div class="toast-actions">
                <a class="toast-view" href="login.html">Login</a>
                <button class="toast-close">Continue</button>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    // trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // auto remove after 3.2s if user doesn't interact
    const timeout = setTimeout(()=>{ toast.remove(); }, 3200);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        toast.remove();
    });
}

// --- Checkout modal helpers ---
function openCheckoutModal(){
    const modal = document.getElementById('checkout-modal');
    if(!modal) return;
    const itemsContainer = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');

    // populate items
    if(itemsContainer){
        itemsContainer.innerHTML = cart.length ? cart.map(i => `
            <div class="item">
                <img src="${i.img}" alt="">
                <div class="item-info">
                    <div class="item-title">${i.title}</div>
                    <div class="item-qty">Qty: ${i.quantity || 1}</div>
                </div>
                <div class="item-price">₹${(i.price * (i.quantity || 1)).toFixed(2)}</div>
            </div>
        `).join('') : '<div class="item">No items in your cart</div>';
    }

    if(totalEl) totalEl.textContent = cart.reduce((s,i) => s + (i.price * (i.quantity || 1)), 0).toFixed(2);
    modal.setAttribute('aria-hidden','false');
}

function closeCheckoutModal(){
    const modal = document.getElementById('checkout-modal');
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
}

// modal & mini-cart event handling
document.addEventListener('click', function(e){
    // mini-cart close
    if(e.target && e.target.classList && e.target.classList.contains('mini-close')){
        e.preventDefault();
        hideMiniCart();
        return;
    }

    // mini-cart checkout
    if(e.target && e.target.id === 'mini-checkout'){
        e.preventDefault();
        hideMiniCart();
        openCheckoutModal();
        return;
    }

    if(e.target && e.target.id === 'cancel-order'){
        e.preventDefault();
        closeCheckoutModal();
        return;
    }

    if(e.target && e.target.id === 'confirm-order'){
        e.preventDefault();
        if(cart.length === 0){
            showToast('Your cart is empty');
            closeCheckoutModal();
            return;
        }
        // Get address
        const addressLine1 = document.getElementById('address-line1').value.trim();
        const addressLine2 = document.getElementById('address-line2').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zip = document.getElementById('zip').value.trim();
        const country = document.getElementById('country').value.trim();
        if (!addressLine1 || !city || !state || !zip || !country) {
            showToast('Please fill in all required address fields');
            return;
        }
        const address = {
            line1: addressLine1,
            line2: addressLine2,
            city: city,
            state: state,
            zip: zip,
            country: country
        };
        // Create order helper - will be called with a valid `user` object
        function proceedWithUser(user) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const order = {
                id: Date.now(),
                userId: user.id,
                username: user.username,
                items: cart.map(item => ({
                    productId: item.id,
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: total,
                address: address,
                date: new Date().toISOString().split('T')[0]
            };
            // keep local copy
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            // Also save to server: POST order, then fetch latest user and update their orders
            return fetch('http://localhost:3003/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(order)
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to save order on server');
                return res.json();
            })
            .then(createdOrder => {
                console.log('Order saved to server', createdOrder);
                // fetch latest user from server to avoid stale copies
                return fetch(`http://localhost:3003/users/${user.id}`)
                    .then(r => {
                        if (!r.ok) throw new Error('Failed to fetch user');
                        return r.json();
                    })
                    .then(latestUser => {
                        if (!latestUser.orders) latestUser.orders = [];
                        latestUser.orders.push(createdOrder);
                        return fetch(`http://localhost:3003/users/${user.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(latestUser)
                        }).then(r2 => {
                            if (!r2.ok) throw new Error('Failed to update user orders');
                            return r2.json();
                        }).then(() => createdOrder);
                    });
            })
            .then(createdOrder => {
                // update local users and localStorage copies
                const idx = users.findIndex(u => u.id === user.id);
                if (idx !== -1) {
                    users[idx].orders = users[idx].orders || [];
                    users[idx].orders.push(createdOrder);
                    localStorage.setItem('users', JSON.stringify(users));
                }
                // ensure orders localStorage includes createdOrder
                const lsOrders = JSON.parse(localStorage.getItem('orders')) || [];
                if (!lsOrders.find(o => o.id === createdOrder.id)) {
                    lsOrders.push(createdOrder);
                    localStorage.setItem('orders', JSON.stringify(lsOrders));
                }
                console.log('User updated with order');
            })
            .catch(err => console.error('Failed to save/update on server', err));
        }

        // Determine current user: try local array first, otherwise fetch by currentUserId
        const loggedInUser = localStorage.getItem('loggedInUser');
        let user = users.find(u => u.username === loggedInUser);
        const currentUserId = localStorage.getItem('currentUserId');
        if (!user) {
            if (currentUserId) {
                fetch(`http://localhost:3003/users/${currentUserId}`)
                .then(r => {
                    if (!r.ok) throw new Error('User not found on server');
                    return r.json();
                })
                .then(fUser => proceedWithUser(fUser))
                .catch(err => {
                    console.error('User lookup failed:', err);
                    showToast('User not found');
                    closeCheckoutModal();
                });
            } else {
                showToast('User not found');
                closeCheckoutModal();
            }
            return;
        }
        // we have a local user, proceed
        proceedWithUser(user);
        // simulate order placement
        showToast('Order placed successfully');
        cart = [];
        saveCart();
        renderCartPage();
        closeCheckoutModal();
        return;
    }

    // close when clicking the close button or outside the content
    if(e.target && e.target.classList && (e.target.classList.contains('checkout-close') || e.target.classList.contains('checkout-modal'))){
        if(e.target.classList.contains('checkout-modal')){
            // clicking the overlay
            closeCheckoutModal();
        } else if(e.target.classList.contains('checkout-close')){
            closeCheckoutModal();
        }
        return;
    }
});

// close modal with Escape key
document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeCheckoutModal();
});

function showAddToast(title){
    showToast(`${title} added to cart`);
    // also show the mini cart preview
    showMiniCart();
    if(AUTO_REDIRECT_ON_ADD){
        // redirect immediately to ensure user lands on cart page when adding
        window.location.href = 'cart.html';
    }
}

// initial UI
renderCartCount();
renderCartPage();

// Newsletter subscription
document.addEventListener('submit', function(e) {
    if (e.target.id === 'newsletter-form') {
        e.preventDefault();
        const email = document.getElementById('newsletter-email').value;
        fetch('http://localhost:3003/newsletters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            alert('Subscribed successfully!');
            document.getElementById('newsletter-form').reset();
        })
        .catch(error => {
            console.error('Error subscribing:', error);
            alert('Subscription failed.');
        });
    }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userInfo = document.getElementById('user-info');
    const userLink = document.getElementById('user-link');
    const userDropdown = document.getElementById('user-dropdown');
    const userNameSpan = document.getElementById('user-name');
    if (userInfo && userLink && userDropdown && userNameSpan) {
        if (loggedInUser) {
            // Change user-link to not go to login.html
            userLink.href = '#';
            // Set dropdown content for logged in
            userDropdown.innerHTML = `
                <span class="welcome-user">Welcome, <span id="user-name">${loggedInUser}</span></span>
                <a href="#" id="logout">Logout</a>
            `;
        } else {
            // If not logged in, hide dropdown and set link to login
            userLink.href = 'login.html';
            userDropdown.style.display = 'none';
        }
    }
});

document.addEventListener('click', function(e) {
    if (e.target.id === 'logout') {
        e.preventDefault();
        const currentLoginId = localStorage.getItem('currentLoginId');
        const currentUserId = localStorage.getItem('currentUserId');
        if (currentLoginId) {
            fetch(`http://localhost:3003/logins/${currentLoginId}`, {
                method: 'DELETE'
            })
            .then(() => {
                if (currentUserId) {
                    return fetch(`http://localhost:3003/users/${currentUserId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...users.find(u => u.id === currentUserId), isLoggedIn: false })
                    });
                }
            })
            .then(() => {
                localStorage.removeItem('currentLoginId');
                localStorage.removeItem('currentUserId');
                localStorage.removeItem('loggedInUser');
                location.reload();
            })
            .catch(error => {
                console.error('Error logging out:', error);
                // Still clear localStorage
                localStorage.removeItem('currentLoginId');
                localStorage.removeItem('currentUserId');
                localStorage.removeItem('loggedInUser');
                location.reload();
            });
        } else {
            localStorage.removeItem('loggedInUser');
            location.reload();
        }
    }
});






