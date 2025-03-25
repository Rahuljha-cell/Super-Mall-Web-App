// Import Firebase Authentication functions
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { app } from "./firebase-config";

// Initialize Firebase Authentication
const auth = getAuth(app);

/* ----- USER LOGIN ----- */
document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const loginError = document.getElementById("login-error");
  const loginButton = document.querySelector("#login-form button");

  loginError.textContent = ""; // Clear previous errors
  loginButton.disabled = true; // Disable button during processing

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Login successful!");
      window.location.href = "dashboard.html"; // Redirect to dashboard
    })
    .catch((error) => {
      loginError.textContent = "Login failed: " + error.message;
    })
    .finally(() => {
      loginButton.disabled = false; // Re-enable button
    });
});

/* ----- USER SIGNUP ----- */
document.getElementById("signup-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const signupError = document.getElementById("signup-error");
  const signupButton = document.querySelector("#signup-form button");

  signupError.textContent = ""; // Clear previous errors
  signupButton.disabled = true; // Disable button during processing

  if (password.length < 6) {
    signupError.textContent = "Password must be at least 6 characters long.";
    signupButton.disabled = false; // Re-enable button
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Signup successful!");
      window.location.href = "dashboard.html"; // Redirect to dashboard
    })
    .catch((error) => {
      signupError.textContent = "Signup failed: " + error.message;
    })
    .finally(() => {
      signupButton.disabled = false; // Re-enable button
    });
});

/* ----- USER LOGOUT ----- */
document.getElementById("logout")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      sessionStorage.clear(); // Clear session storage
      alert("Logged out successfully!");
      window.location.href = "index.html"; // Redirect to login page
    })
    .catch((error) => {
      alert("Error logging out: " + error.message);
    });
});

/* ----- CHECK AUTH STATE (Prevent Unauthorized Access) ----- */
onAuthStateChanged(auth, (user) => {
  const restrictedPages = ["dashboard.html", "sellerdashboard.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (!user && restrictedPages.includes(currentPage)) {
    alert("You must be logged in to access this page.");
    window.location.href = "index.html"; // Redirect to login if not logged in
  }
});