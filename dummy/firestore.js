// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// Firebase configuration (replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyCvrAWpdJWVRYnDpMcnr6suDSyu_1Tzvso",
  authDomain: "super-mall-1f4d7.firebaseapp.com",
  projectId: "super-mall-1f4d7",
  storageBucket: "super-mall-1f4d7.appspot.com",
  messagingSenderId: "287378421143",
  appId: "1:287378421143:web:eb89e78a68ebc22bc200d2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ----- AUTHENTICATION AND ROLE CHECK ----- */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid); // Assuming user data is stored in the "users" collection
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role !== "seller") {
        document.getElementById("offer-form").style.display = "none"; // Hide the form
        alert("You do not have permission to add offers.");
      }
    } else {
      console.error("User document not found.");
      document.getElementById("offer-form").style.display = "none"; // Hide the form
      alert("You do not have permission to add offers.");
    }
  } else {
    window.location.href = "index.html"; // Redirect to login if not authenticated
  }
});

/* ----- ADD SHOP OFFER ----- */
document.getElementById("offer-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const shopName = document.getElementById("shopName").value;
  const product = document.getElementById("product").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const offerError = document.getElementById("offer-error");

  offerError.textContent = ""; // Clear previous errors

  if (!shopName || !product || !price || !category) {
    offerError.textContent = "All fields are required.";
    return;
  }

  if (isNaN(price) || price <= 0) {
    offerError.textContent = "Price must be a positive number.";
    return;
  }

  try {
    await addDoc(collection(db, "offers"), { shopName, product, price, category });
    alert("Offer added successfully!");
    displayOffers(); // Refresh offer list
  } catch (error) {
    console.error("Error adding offer:", error);
    offerError.textContent = "Failed to add offer: " + error.message;
  }
});

/* ----- ADD SHOP ----- */
document.getElementById("addShopForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const response = await fetch("/add-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        floor: formData.get("floor"),
        category: formData.get("category"),
      }),
    });

    if (response.ok) {
      alert("Shop added successfully!");
      event.target.reset(); // Clear the form
      displayShops(); // Refresh shop list
    } else {
      const result = await response.json();
      document.getElementById("shopError").textContent = result.error || "Failed to add shop.";
    }
  } catch (error) {
    console.error("Error adding shop:", error);
    document.getElementById("shopError").textContent = "An error occurred while adding the shop.";
  }
});

/* ----- ADD PRODUCT ----- */
document.getElementById("addProductForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const response = await fetch("/add-product", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("Product added successfully!");
      event.target.reset(); // Clear the form
    } else {
      const result = await response.json();
      document.getElementById("productError").textContent = result.error || "Failed to add product.";
    }
  } catch (error) {
    console.error("Error adding product:", error);
    document.getElementById("productError").textContent = "An error occurred while adding the product.";
  }
});

/* ----- DISPLAY SHOP OFFERS ----- */
async function displayOffers() {
  const offersList = document.getElementById("offersList");
  const loading = document.getElementById("loading");
  loading.style.display = "block"; // Show loading spinner
  offersList.innerHTML = ""; // Clear the list

  try {
    const querySnapshot = await getDocs(collection(db, "offers"));
    loading.style.display = "none"; // Hide loading spinner

    querySnapshot.forEach((doc) => {
      const offer = doc.data();
      const offerId = doc.id; // Get the document ID for deletion
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${offer.shopName}</strong> - ${offer.product} <br>
        <em>Price:</em> ₹${offer.price} <br>
        <em>Category:</em> ${offer.category}
      `;

      // Add Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        const confirmDelete = confirm("Are you sure you want to delete this offer?");
        if (confirmDelete) {
          try {
            await deleteDoc(doc(db, "offers", offerId)); // Delete the offer from Firestore
            alert("Offer deleted successfully!");
            displayOffers(); // Refresh the offer list
          } catch (error) {
            console.error("Error deleting offer:", error);
            alert("Failed to delete offer. Please try again.");
          }
        }
      });

      li.appendChild(deleteButton); // Append the delete button to the offer
      offersList.appendChild(li); // Append the offer to the list
    });
  } catch (error) {
    loading.style.display = "none"; // Hide loading spinner
    console.error("Error fetching offers:", error);
    offersList.innerHTML = "<p style='color: red;'>Failed to load offers. Please try again later.</p>";
  }
}

/* ----- DISPLAY SHOPS ----- */
async function displayShops() {
  const shopList = document.getElementById("shopList");
  shopList.innerHTML = ""; // Clear the list

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to view shops.");
      return;
    }

    const querySnapshot = await getDocs(collection(db, "shops"));
    querySnapshot.forEach((doc) => {
      const shop = doc.data();
      if (shop.sellerId === user.uid) {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${shop.shopName}</strong> - ${shop.floor} <br>
          <em>Category:</em> ${shop.category}
        `;
        shopList.appendChild(li);
      }
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    shopList.innerHTML = "<p style='color: red;'>Failed to load shops. Please try again later.</p>";
  }
}

// Load offers and shops when the page loads
window.onload = () => {
  displayOffers();
  displayShops();
};