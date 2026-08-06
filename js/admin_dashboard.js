import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYE50OgsSpeMfG8XcJfD7Z1YInJq-uS3A",
  authDomain: "leavetrack-def2a.firebaseapp.com",
  projectId: "leavetrack-def2a",
  storageBucket: "leavetrack-def2a.firebasestorage.app",
  messagingSenderId: "624926183807",
  appId: "1:624926183807:web:4d3fc14ee25c4fce074a4a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://leaveease-api-j9j8.onrender.com";

const totalEmployees = document.getElementById("totalEmployees");
const pendingLeaves = document.getElementById("pendingLeaves");
const leaveTable = document.getElementById("leaveTable");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

let firebaseUser = null;

let allLeaves = [];
let filteredLeaves = [];

let currentPage = 1;
const rowsPerPage = 6;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  firebaseUser = user;

  try {
    const token = await firebaseUser.getIdToken(true);

    const userResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (userResponse.ok) {
      const admin = await userResponse.json();

      const adminName = document.getElementById("adminName");

      if (adminName) {
        adminName.textContent = admin.name;
      }
    }

    await loadDashboard();
  } catch (error) {
    console.error(error);
  }
});

async function getToken() {
  return await firebaseUser.getIdToken(true);
}

async function loadDashboard() {
  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}/leave/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load leave requests");
    }

    allLeaves = await response.json();

    // Newest requests first
    allLeaves.sort((a, b) => new Date(b.applied_on) - new Date(a.applied_on));

    filteredLeaves = [...allLeaves];

    document.getElementById("approvedCount").textContent = allLeaves.filter(
      (leave) => leave.status === "Approved",
    ).length;

    document.getElementById("pendingCount").textContent = allLeaves.filter(
      (leave) => leave.status === "Pending",
    ).length;

    document.getElementById("rejectedCount").textContent = allLeaves.filter(
      (leave) => leave.status === "Rejected",
    ).length;

    pendingLeaves.textContent = allLeaves.filter(
      (leave) => leave.status === "Pending",
    ).length;

    await loadEmployeeCount(token);

    renderTable();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Unable to load dashboard.",
    });
  }
}

async function loadEmployeeCount(token) {
  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      totalEmployees.textContent = "-";
      return;
    }

    const users = await response.json();

    totalEmployees.textContent = users.filter(
      (user) => user.role === "employee",
    ).length;
  } catch {
    totalEmployees.textContent = "-";
  }
}

function renderTable() {
  leaveTable.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageLeaves = filteredLeaves.slice(start, end);

  pageLeaves.forEach((leave) => {
    leaveTable.innerHTML += `
<tr>

<td>
<div class="employee-info">
<div class="avatar-circle">
${leave.employee_name.charAt(0).toUpperCase()}
</div>

<div>
<h6>${leave.employee_name.split("@")[0]}</h6>
<span>${leave.employee_name}</span>
</div>

</div>
</td>

<td>

<div class="leave-type">
<span class="dot blue"></span>
${leave.leave_type}
</div>

</td>

<td>

<strong>${calculateDays(leave.start_date, leave.end_date)} Day(s)</strong>

</td>

<td>

<div class="timeline">
<span>${leave.start_date} — ${leave.end_date}</span>
<small>Applied ${leave.applied_on}</small>
</div>

</td>

<td>

${
  leave.document
    ? `
<a
href="${API_URL}/${leave.document}"
target="_blank"
class="btn btn-primary btn-sm">

<i class="bi bi-file-earmark-arrow-down"></i>

View

</a>
`
    : `<span style="color:#999;">No File</span>`
}

</td>
<td>

<span class="badge-status ${getStatusClass(leave.status)}">

${leave.status}

</span>

</td>

<td>

<div class="action-buttons">

<button
class="approve-btn"
onclick="updateLeave(${leave.id}, 'Approved')"
${leave.status !== "Pending" ? "disabled" : ""}
>

<i class="bi bi-check-circle"></i>

</button>

<button
class="reject-btn"
onclick="updateLeave(${leave.id}, 'Rejected')"
${leave.status !== "Pending" ? "disabled" : ""}
>

<i class="bi bi-x-circle"></i>

</button>

</div>

</td>

</tr>

`;
  });

  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);

  const pageNumbers = document.getElementById("pageNumbers");

  pageNumbers.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.innerHTML += `
<button
class="${i === currentPage ? "active" : ""}"
onclick="goToPage(${i})">

${i}

</button>
`;
  }

  const start =
    filteredLeaves.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const end = Math.min(currentPage * rowsPerPage, filteredLeaves.length);

  document.getElementById("requestCount").textContent =
    `Showing ${start}-${end} of ${filteredLeaves.length} requests`;

  document.getElementById("prevPage").disabled = currentPage === 1;

  document.getElementById("nextPage").disabled =
    currentPage === totalPages || totalPages === 0;
}

window.goToPage = function (page) {
  currentPage = page;
  renderTable();
};

window.updateLeave = async function (id, status) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `You are about to ${status.toLowerCase()} this leave request.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: status === "Approved" ? "#2563eb" : "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: status,
  });

  if (!result.isConfirmed) return;

  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}/leave/update/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: status,
      }),
    });

    if (!response.ok) {
      throw new Error();
    }

    await Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Leave request updated successfully.",
      timer: 1500,
      showConfirmButton: false,
    });

    await loadDashboard();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Unable to update leave request.",
    });
  }
};

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "approved":
      return "approved";

    case "rejected":
      return "rejected";

    default:
      return "pending";
  }
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase().trim();

  filteredLeaves = allLeaves.filter((leave) => {
    return (
      (leave.employee_name || "").toLowerCase().includes(value) ||
      (leave.leave_type || "").toLowerCase().includes(value) ||
      (leave.status || "").toLowerCase().includes(value)
    );
  });

  currentPage = 1;

  renderTable();
});

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);

  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

logoutBtn.addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Logout?",
    text: "Do you want to logout?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Logout",
  });

  if (!result.isConfirmed) return;

  try {
    await signOut(auth);
    window.location.href = "../login.html";
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Logout Failed",
      text: "Please try again.",
    });
  }
});
