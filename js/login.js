import { auth } from "./firebase.js";

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        await userCredential.user.reload();

        const token = await userCredential.user.getIdToken(true);

        const response = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const user = await response.json();

        if (!response.ok) {

            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: user.detail,
                confirmButtonColor: "#2563eb",
            });

            return;
        }

        Swal.fire({
            icon: "success",
            title: "Welcome!",
            text: `Welcome back, ${user.name}!`,
            timer: 1800,
            showConfirmButton: false,
        }).then(() => {

            if (user.role === "admin") {
                window.location.href = "/frontend/admin/admin_dashboard.html";
            } else {
                window.location.href = "/frontend/employee/dashboard.html";
            }

        });

    } catch (error) {

        let message = "Something went wrong.";

        switch (error.code) {

            case "auth/invalid-email":
                message = "Please enter a valid email address.";
                break;

            case "auth/user-disabled":
                message = "This account has been disabled.";
                break;

            case "auth/user-not-found":
                message = "No account found with this email.";
                break;

            case "auth/wrong-password":
            case "auth/invalid-credential":
                message = "Incorrect email or password.";
                break;

            case "auth/too-many-requests":
                message = "Too many login attempts. Please try again later.";
                break;

            default:
                message = error.message;
        }

        Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: message,
            confirmButtonColor: "#2563eb",
        });

    }

});