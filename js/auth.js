import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const form = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const department = document.getElementById("department").value;
  const designation = document.getElementById("designation").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("termsAndConditions").checked;

  // Validation
  if (
    !name ||
    !email ||
    !department ||
    !designation ||
    !password ||
    !confirmPassword
  ) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill all fields.",
    });
    return;
  }

  if (!terms) {
    Swal.fire({
      icon: "warning",
      title: "Terms Required",
      text: "Please accept the Terms & Conditions.",
    });
    return;
  }

  if (password !== confirmPassword) {
    Swal.fire({
      icon: "error",
      title: "Password Mismatch",
      text: "Passwords do not match.",
    });
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Creating Account...";

  try {

    // Firebase Registration
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await userCredential.user.getIdToken();

    const response = await fetch("http://127.0.0.1:8000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        department,
        designation,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail);
    }

    // Logout newly created user
    await signOut(auth);

    registerBtn.disabled = false;
    registerBtn.textContent = "Create Account";

    await Swal.fire({
      icon: "success",
      title: "Registration Successful",
      text: "Your account has been created successfully.\n\nYou can now login.",
      confirmButtonColor: "#2563eb",
    });

  } catch (error) {

    console.error(error);

    registerBtn.disabled = false;
    registerBtn.textContent = "Create Account";

    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: error.message,
      confirmButtonColor: "#2563eb",
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {

  new Choices("#department", {
    searchEnabled: false,
    itemSelectText: "",
  });

  new Choices("#designation", {
    searchEnabled: false,
    itemSelectText: "",
  });

});