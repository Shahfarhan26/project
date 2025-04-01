import API from './api.js';
import AuthService from './auth.js';

// Global cart state
let cart = [];

// DOM Elements
const productContainer = document.getElementById('product-container');
const cartCountElement = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  // Verify authentication
  if (!await AuthService.isAuthenticated()) {
    showAuthModal('Please login to access weapons catalog');
    return;
  }

  // Load and display products
  try {
    const products = await API.get('/api/products');
    displayProducts(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    showError('Failed to load products. Please try again later.');
  }

  // Initialize cart from localStorage
  loadCart();
  setupEventListeners();
});

// Display products in the grid
function displayProducts(products) {
  if (!productContainer) return;

  productContainer.innerHTML = products.map(product => `
    <div class="product-card" data-category="${product.category}">
      <div class="product-image">
        <img src="/images/products/${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">$${product.price.toFixed(2)}</p>
        <button class="btn add-to-cart" 
                data-id="${product.id}" 
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="${product.image}">
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');

  // Initialize filter buttons
  setupFilterButtons();
}

// Cart functionality
function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  updateCartCount();
  saveCart();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartCount();
  saveCart();
  if (cartModal.style.display === 'block') {
    updateCartModal();
  }
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  if (cartCountElement) cartCountElement.textContent = count;
}

// Cart modal
function updateCartModal() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  
  if (!cartItemsContainer || !cartTotalElement) return;

  cartItemsContainer.innerHTML = cart.length === 0 
    ? '<p>Your cart is empty.</p>'
    : cart.map(item => `
        <div class="cart-item">
          <img src="/images/products/${item.image}" alt="${item.name}">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
          </div>
          <div class="cart-item-price">
            $${(item.price * item.quantity).toFixed(2)}
          </div>
          <button class="remove-item" data-id="${item.id}">&times;</button>
        </div>
      `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalElement.textContent = total.toFixed(2);
}

// Event listeners
function setupEventListeners() {
  // Add to cart buttons
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      e.preventDefault();
      if (!await AuthService.isAuthenticated()) {
        showAuthModal('Please login to add items to cart');
        return;
      }

      const product = {
        id: parseInt(e.target.dataset.id),
        name: e.target.dataset.name,
        price: parseFloat(e.target.dataset.price),
        image: e.target.dataset.image
      };
      addToCart(product);
    }

    // Remove item buttons
    if (e.target.classList.contains('remove-item')) {
      removeFromCart(parseInt(e.target.dataset.id));
    }
  });

  // Cart modal toggle
  document.querySelector('a[href="#cart"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    cartModal.style.display = 'block';
    updateCartModal();
  });

  // Modal close buttons
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  // Checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (!await AuthService.isAuthenticated()) {
        showAuthModal('Please login to complete checkout');
        return;
      }

      if (cart.length === 0) {
        showError('Your cart is empty');
        return;
      }

      try {
        const response = await API.post('/api/orders', { items: cart });
        showToast('Order placed successfully!');
        cart = [];
        saveCart();
        updateCartCount();
        updateCartModal();
        cartModal.style.display = 'none';
      } catch (error) {
        showError('Failed to place order. Please try again.');
      }
    });
  }
}

// Filter functionality
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Filter products
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// UI Helpers
function showAuthModal(message) {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    document.getElementById('modal-message').textContent = message;
    modal.style.display = 'block';
  } else {
    window.location.href = '/login.html';
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const container = document.querySelector('main') || document.body;
  container.prepend(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});