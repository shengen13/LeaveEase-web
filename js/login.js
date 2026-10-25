import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

        const response = await fetch("https://leaveease-api-j9j8.onrender.com/auth/login", {
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
                window.location.href = "/admin/admin_dashboard.html";
            } else {
                window.location.href = "/employee/dashboard.html";
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

const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {
    forgotPassword.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email) {
            Swal.fire("Enter your email", "Please enter your email address first.", "warning");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);

            Swal.fire(
                "Email sent",
                "Check your inbox and spam folder for the password reset link.",
                "success"
            );
        } catch (error) {
            Swal.fire("Reset failed", error.message, "error");
        }
    });
}
