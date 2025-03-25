// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Fetch products from Firebase Realtime Database
function fetchProducts() {
  const productList = document.getElementById("product-list");
  const loading = document.getElementById("loading");
  loading.style.display = "block"; // Show loading spinner

  const productsRef = ref(database, "products");
  onValue(
    productsRef,
    (snapshot) => {
      loading.style.display = "none"; // Hide loading spinner
      productList.innerHTML = ""; // Clear the list

      if (!snapshot.exists()) {
        productList.innerHTML = "<p>No products available.</p>";
        return;
      }

      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        const productDiv = document.createElement("div");
        productDiv.style.border = "1px solid #ddd";
        productDiv.style.padding = "15px";
        productDiv.style.marginBottom = "15px";
        productDiv.style.borderRadius = "8px";
        productDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        productDiv.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";

        productDiv.onmouseover = () => {
          productDiv.style.transform = "translateY(-5px)";
          productDiv.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
        };

        productDiv.onmouseout = () => {
          productDiv.style.transform = "translateY(0)";
          productDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        };

        productDiv.innerHTML = `
          <h3>${product.name}</h3>
          <p>Price: ₹${product.price}</p>
          <p>Category: ${product.category}</p>
          <img src="${product.image}" alt="${product.name}" width="100">
        `;
        productList.appendChild(productDiv);
      });
    },
    (error) => {
      loading.style.display = "none"; // Hide loading spinner
      console.error("Error fetching products:", error.message);
      productList.innerHTML = "<p style='color: red;'>Failed to load products. Please try again later.</p>";
    }
  );
}

// Call fetchProducts when the page loads
document.addEventListener("DOMContentLoaded", fetchProducts);
