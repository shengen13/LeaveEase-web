import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

let currentUser = null;
let priority = "Standard";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/frontend/login.html";
    return;
  }

  currentUser = user;

  try {
    const token = await currentUser.getIdToken(true);

    const response = await fetch("https://leaveease-api-j9j8.onrender.com/auth/login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return;

    const employee = await response.json();

    document.getElementById("employeeName").textContent = employee.name;
  } catch (error) {
    console.error(error);
  }
});

const priorityButtons = document.querySelectorAll(".priority");

priorityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    priorityButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    priority = button.textContent.trim();
  });
});

const fileInput = document.getElementById("document");
const uploadTitle = document.getElementById("uploadTitle");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    uploadTitle.textContent = "Selected File";
    fileName.textContent = fileInput.files[0].name;
    fileName.style.color = "#2563eb";
    fileName.style.fontWeight = "600";
  } else {
    uploadTitle.textContent = "Click or Drag to Upload";
    fileName.textContent =
      "Medical certificates, travel bookings, etc. (PDF, JPG up to 10MB)";
    fileName.style.color = "";
    fileName.style.fontWeight = "";
  }
});

document.querySelector(".submit-btn").addEventListener("click", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const leaveType = document.getElementById("leaveType").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const reason = document.getElementById("reason").value.trim();
  const documentFile = document.getElementById("document").files[0];

  if (documentFile && documentFile.size > 10 * 1024 * 1024) {
    Toastify({
      text: "File size must be less than 10 MB.",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#dc3545",
      },
    }).showToast();

    return;
  }

  if (documentFile) {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(documentFile.type)) {
      Toastify({
        text: "Only PDF, JPG and PNG files are allowed.",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
          background: "#dc3545",
        },
      }).showToast();

      return;
    }
  }

  if (!leaveType || !startDate || !endDate || !reason) {
    Toastify({
      text: "Please fill all required fields.",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#dc3545",
      },
    }).showToast();
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    Toastify({
      text: "End date cannot be earlier than Start Date.",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#dc3545",
      },
    }).showToast();
    return;
  }

  try {
    const token = await currentUser.getIdToken(true);

    const formData = new FormData();

    formData.append("leave_type", leaveType);
    formData.append("priority", priority);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("reason", reason);

    if (documentFile) {
      formData.append("document", documentFile);
    }

    const response = await fetch("https://leaveease-api-j9j8.onrender.com/leave/apply", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Unable to submit leave request.");
    }

    await Swal.fire({
      icon: "success",
      title: "Leave Submitted!",
      text: "Your leave request has been submitted successfully.",
      confirmButtonColor: "#2563eb",
    });

    document.getElementById("leaveType").selectedIndex = 0;
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("reason").value = "";
    document.getElementById("document").value = "";

    uploadTitle.textContent = "Click or Drag to Upload";
    fileName.textContent =
      "Medical certificates, travel bookings, etc. (PDF, JPG up to 10MB)";
    fileName.style.color = "";
    fileName.style.fontWeight = "";

    priority = "Standard";

    priorityButtons.forEach((btn) => btn.classList.remove("active"));
    priorityButtons[0].classList.add("active");
  } catch (error) {
    Toastify({
      text: error.message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "#dc3545",
      },
    }).showToast();

    console.error(error);
  }
});
