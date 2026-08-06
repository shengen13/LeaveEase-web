import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
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

let firebaseUser = null;

let allEmployees = [];

const employeeTable = document.getElementById("employeeTable");

const searchEmployee = document.getElementById("searchEmployee");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  firebaseUser = user;

  const token = await getToken();

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const admin = await response.json();

    const adminName = document.getElementById("adminName");

    if (adminName) {
      adminName.textContent = admin.name || "Admin";
    }
  }

  await loadEmployees();
  searchEmployee.dispatchEvent(new Event("input"));
});

async function getToken() {
  return await firebaseUser.getIdToken(true);
}

async function loadEmployees() {
  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load employees");
    }

    allEmployees = await response.json();

    renderEmployees(allEmployees);
  } catch (error) {
    console.error("Load Error:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Unable to load employees.",
    });
  }
}

function renderEmployees(employees) {
  employeeTable.innerHTML = "";

  if (employees.length === 0) {
    employeeTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No Employees Found
                </td>
            </tr>
        `;

    return;
  }

  employees.forEach((employee) => {
    employeeTable.innerHTML += `
        <tr>

            <td>${employee.name}</td>

            <td>${employee.email}</td>

            <td>${employee.department}</td>

            <td>${employee.designation}</td>

            <td>
                <span class="badge-status pending">
                    ${employee.role}
                </span>
            </td>

            <td>

                <button
                    class="approve-btn"
                    onclick="editEmployee('${employee.uid}')">

                    <i class="bi bi-pencil-square"></i>

                </button>

                <button
                    class="reject-btn"
                    onclick="deleteEmployee('${employee.uid}')">

                    <i class="bi bi-trash"></i>

                </button>

            </td>

        </tr>
        `;
  });
}

window.editEmployee = async function (uid) {
  const employee = allEmployees.find((user) => user.uid === uid);

  if (!employee) return;

  const { value: formValues } = await Swal.fire({
    title: "Edit Employee",

    customClass: {
        popup: "edit-popup"
    },

    html: `

<input
id="swal-name"
class="swal2-input"
placeholder="Name"
value="${employee.name}">

<select id="swal-department" class="swal2-select">

    <option value="Information Technology" ${employee.department === "Information Technology" ? "selected" : ""}>
        Information Technology
    </option>

    <option value="Human Resources" ${employee.department === "Human Resources" ? "selected" : ""}>
        Human Resources
    </option>

    <option value="Finance" ${employee.department === "Finance" ? "selected" : ""}>
        Finance
    </option>

    <option value="Marketing" ${employee.department === "Marketing" ? "selected" : ""}>
        Marketing
    </option>

    <option value="Sales" ${employee.department === "Sales" ? "selected" : ""}>
        Sales
    </option>

    <option value="Operations" ${employee.department === "Operations" ? "selected" : ""}>
        Operations
    </option>

</select>

<select id="swal-designation" class="swal2-select">

    <option value="Software Developer" ${employee.designation === "Software Developer" ? "selected" : ""}>
        Software Developer
    </option>

    <option value="HR Executive" ${employee.designation === "HR Executive" ? "selected" : ""}>
        HR Executive
    </option>

    <option value="Accountant" ${employee.designation === "Accountant" ? "selected" : ""}>
        Accountant
    </option>

    <option value="Marketing Executive" ${employee.designation === "Marketing Executive" ? "selected" : ""}>
        Marketing Executive
    </option>

    <option value="Sales Executive" ${employee.designation === "Sales Executive" ? "selected" : ""}>
        Sales Executive
    </option>

    <option value="Operations Manager" ${employee.designation === "Operations Manager" ? "selected" : ""}>
        Operations Manager
    </option>

</select>

<select id="swal-role" class="swal2-select">

    <option value="employee" ${employee.role === "employee" ? "selected" : ""}>
        Employee
    </option>

    <option value="admin" ${employee.role === "admin" ? "selected" : ""}>
        Admin
    </option>

</select>

`,

    focusConfirm: false,

    showCancelButton: true,

    confirmButtonText: "Save",

    preConfirm: () => {
      return {
        name: document.getElementById("swal-name").value,

        department: document.getElementById("swal-department").value,

        designation: document.getElementById("swal-designation").value,

        role: document.getElementById("swal-role").value,
      };
    },
  });

  if (!formValues) return;

  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}/auth/update/${uid}`, {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify(formValues),
    });

    if (!response.ok) {
      throw new Error();
    }

    await Swal.fire({
      icon: "success",

      title: "Updated!",

      text: "Employee updated successfully.",
    });

    await loadEmployees();
    searchEmployee.dispatchEvent(new Event("input"));
  } catch (error) {
    Swal.fire({
      icon: "error",

      title: "Error",

      text: "Unable to update employee.",
    });
  }
};

window.deleteEmployee = async function (uid) {
  const employee = allEmployees.find((user) => user.uid === uid);

  if (!employee) return;

  const result = await Swal.fire({
    title: "Delete Employee?",

    html: `
            <b>${employee.name}</b><br>
            ${employee.email}<br><br>
            This action cannot be undone.
        `,

    icon: "warning",

    showCancelButton: true,

    confirmButtonColor: "#dc2626",

    cancelButtonColor: "#6b7280",

    confirmButtonText: "Delete",

    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const token = await getToken();

    const response = await fetch(`${API_URL}/auth/delete/${uid}`, {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail);
    }

    await Swal.fire({
      icon: "success",

      title: "Deleted",

      text: data.message,

      timer: 1500,

      showConfirmButton: false,
    });

    await loadEmployees();
    searchEmployee.dispatchEvent(new Event("input"));
  } catch (error) {
    Swal.fire({
      icon: "error",

      title: "Delete Failed",

      text: error.message,
    });
  }
};

searchEmployee.addEventListener("input", () => {
  const value = searchEmployee.value.toLowerCase().trim();

  const filtered = allEmployees.filter((employee) => {
    const department = employee.department || "";
    const designation = employee.designation || "";
    const role = employee.role || "";

    return (
      employee.name.toLowerCase().includes(value) ||
      employee.email.toLowerCase().includes(value) ||
      department.toLowerCase().includes(value) ||
      designation.toLowerCase().includes(value) ||
      role.toLowerCase().includes(value)
    );
  });

  renderEmployees(filtered);
});
