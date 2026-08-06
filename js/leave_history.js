import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  currentUser = user;

  const token = await currentUser.getIdToken(true);

  // Load Employee Details
  const employeeResponse = await fetch("https://leaveease-api-j9j8.onrender.com/auth/login", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const employee = await employeeResponse.json();

  document.getElementById("employeeName").textContent = employee.name;

  // Load Leave History
  loadLeaveHistory(token);
});

// =============================
// Load Leave History
// =============================

async function loadLeaveHistory(token) {
  const response = await fetch("https://leaveease-api-j9j8.onrender.com/leave/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const history = await response.json();

  const table = document.getElementById("historyTable");

  table.innerHTML = "";

  if (history.length === 0) {
    table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    No leave requests found.
                </td>
            </tr>
        `;

    return;
  }

  history.forEach((leave) => {
    let statusClass = "";

    if (leave.status === "Approved") {
      statusClass = "approved";
    } else if (leave.status === "Rejected") {
      statusClass = "rejected";
    } else {
      statusClass = "pending";
    }

    table.innerHTML += `
            <tr>

                <td>${leave.leave_type}</td>

                <td>${leave.start_date}</td>

                <td>${leave.end_date}</td>

                <td>${leave.reason}</td>

                <td>
                    ${
                      leave.document
                        ? `<a href="https://leaveease-api-j9j8.onrender.com/${leave.document}"
                         target="_blank"
                     class="document-link">
                        View Document
                        </a>`
                        : "N/A"
                    }
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${leave.status}
                    </span>
                </td>

            </tr>
        `;
  });
}

// =============================
// Logout
// =============================

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  await signOut(auth);

  window.location.href = "../login.html";
});
