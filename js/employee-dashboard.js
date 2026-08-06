import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const token = await firebaseUser.getIdToken(true);

    const response = await fetch("https://leaveease-api-j9j8.onrender.com/auth/login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await response.json();

    if (!response.ok) {
      alert(user.detail);
      return;
    }

    document.getElementById("employeeName").textContent =
      user.name || "Employee";
    document.getElementById("welcomeName").textContent =
      user.name || "Employee";
    document.getElementById("employeeEmail").textContent = user.email || "";
    document.getElementById("employeeDepartment").textContent =
      user.department || "";
    document.getElementById("employeeDesignation").textContent =
      user.designation || "";

    await loadRecentRequests(token);

    await loadLeaveBalance(token);

    async function loadLeaveBalance(token) {
      try {
        const response = await fetch("https://leaveease-api-j9j8.onrender.com/leave/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const leaves = await response.json();

        const TOTAL = {
          "Annual Leave": 24,
          "Sick Leave": 10,
          "Casual Leave": 6,
        };

        let usedAnnual = 0;
        let usedSick = 0;
        let usedCasual = 0;

        leaves.forEach((leave) => {
          if (leave.status !== "Approved") return;

          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);

          const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

          switch (leave.leave_type) {
            case "Annual Leave":
              usedAnnual += days;
              break;

            case "Sick Leave":
              usedSick += days;
              break;

            case "Casual Leave":
              usedCasual += days;
              break;
          }
        });

        document.getElementById("annualBalance").textContent = Math.max(
          0,
          TOTAL["Annual Leave"] - usedAnnual,
        );

        document.getElementById("sickBalance").textContent = Math.max(
          0,
          TOTAL["Sick Leave"] - usedSick,
        );

        document.getElementById("casualBalance").textContent = Math.max(
          0,
          TOTAL["Casual Leave"] - usedCasual,
        );

        const totalAllowed =
          TOTAL["Annual Leave"] + TOTAL["Sick Leave"] + TOTAL["Casual Leave"];

        const totalUsed = usedAnnual + usedSick + usedCasual;

        const totalPercent = Math.round((totalUsed / totalAllowed) * 100);

        const annualPercent = Math.round(
          (usedAnnual / TOTAL["Annual Leave"]) * 100,
        );

        const otherPercent = Math.round(
          ((usedSick + usedCasual) /
            (TOTAL["Sick Leave"] + TOTAL["Casual Leave"])) *
            100,
        );

        document.getElementById("totalUsedPercent").textContent =
          totalPercent + "%";

        document.getElementById("annualUsedPercent").textContent =
          annualPercent + "%";

        document.getElementById("otherUsedPercent").textContent =
          otherPercent + "%";
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Unable to load dashboard.",
    });
  }
});

async function loadRecentRequests(token) {
  try {
    const response = await fetch("https://leaveease-api-j9j8.onrender.com/leave/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const leaves = await response.json();

    if (!response.ok) return;

    const table = document.getElementById("recentRequestsTable");

    table.innerHTML = "";

    const latestLeaves = [...leaves].reverse().slice(0, 5);

    latestLeaves.forEach((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);

      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      let statusClass = "pending";

      if (leave.status === "Approved") statusClass = "approved";

      if (leave.status === "Rejected") statusClass = "rejected";

      table.innerHTML += `
                <tr>

                    <td>
                        <div class="leave-type">
                            <div class="table-icon">
                                <i class="bi bi-calendar-check"></i>
                            </div>

                            ${leave.leave_type}
                        </div>
                    </td>

                    <td>${days} Day(s)</td>

                    <td>${leave.start_date} - ${leave.end_date}</td>

                    <td>
                        <span class="status ${statusClass}">
                            ${leave.status}
                        </span>
                    </td>

                </tr>
            `;
    });
  } catch (error) {
    console.error(error);
  }
}

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Logout?",
    text: "Do you want to logout?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Logout",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    await signOut(auth);

    window.location.href = "../login.html";
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Logout Failed",
      text: "Please try again.",
    });
  }
});

