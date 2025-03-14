// בדיקת התחברות בעת טעינת הדפים
const currentUser = localStorage.getItem('currentUser');
if (!currentUser && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// טעינת לקוחות מה-Local Storage לפי המשתמש הנוכחי
let customers = JSON.parse(localStorage.getItem(`customers_${currentUser}`)) || [];

let isEditing = false;
let expenses = []; // מערך זמני לשמירת ההוצאות

// פונקציה להוספת פסיקים למספרים גבוהים
function addCommasToNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// פונקציה לחישוב עמלה לפי הנוסחה: (Project Price - Lead Cost - Dealer Fee - Project Expenses) / 2
function calculateCommission(customer) {
    const projectPrice = parseFloat(customer.projectPrice) || 0;
    const projectExpenses = parseFloat(customer.projectExpenses) || 0;
    const leadCostPercent = parseFloat(customer.leadCost) || 0;
    const dealerFeePercent = parseFloat(customer.dealerFee) || 0;

    // המרת Lead Cost ו-Dealer Fee לדולרים
    const leadCost = (leadCostPercent / 100) * projectPrice;
    const dealerFee = (dealerFeePercent / 100) * projectPrice;

    // חישוב העמלה: (Project Price - Lead Cost - Dealer Fee - Project Expenses) / 2
    const commission = (projectPrice - leadCost - dealerFee - projectExpenses) / 2;
    return commission > 0 ? commission.toFixed(2) : 0; // מחזיר 0 אם העמלה שלילית
}

// פונקציה לעדכון נתונים ב-Dashboard
function updateDashboardStats() {
    const totalSalesElement = document.querySelector('.value.sales');
    const totalProjectsElement = document.querySelector('.value.projects');
    const totalCommissionElement = document.querySelector('.value.commission');

    if (totalSalesElement && totalProjectsElement && totalCommissionElement) {
        // חישוב סך המכירות (סכום כל ה-Project Price)
        const totalSales = customers.reduce((sum, customer) => sum + (parseFloat(customer.projectPrice) || 0), 0).toFixed(2);

        // סך הפרויקטים (מספר הלקוחות)
        const totalProjects = customers.length;

        // חישוב סך העמלות
        const totalCommission = customers.reduce((sum, customer) => sum + parseFloat(calculateCommission(customer)), 0).toFixed(2);

        totalSalesElement.textContent = `$${addCommasToNumber(totalSales)}`;
        totalProjectsElement.textContent = addCommasToNumber(totalProjects);
        totalCommissionElement.textContent = `$${addCommasToNumber(totalCommission)}`;
    }
}

// פונקציה לטעינת לקוחות
function renderCustomers() {
    const container = document.getElementById('customersList');
    if (container) {
        container.innerHTML = '';
        customers.forEach((customer, index) => {
            const commission = calculateCommission(customer);
            const card = document.createElement('div');
            card.className = 'customer-card';
            card.innerHTML = `
                <h3>${customer.name}</h3>
                <p><span>Project Type:</span> ${Array.isArray(customer.projectType) ? customer.projectType.join(', ') : customer.projectType}</p>
                <p><span>Project Price:</span> $${addCommasToNumber(customer.projectPrice)}</p>
                <p><span>Commission:</span> $<span class="commission-value">${addCommasToNumber(commission)}</span></p>
                <p><span>Banks:</span> ${Array.isArray(customer.bank) ? customer.bank.join(', ') : customer.bank}</p>
                <span class="status ${customer.status.toLowerCase().replace(' ', '-')}">${customer.status}</span>
            `;
            card.addEventListener('click', () => {
                window.location.href = `customer.html?id=${index}`;
            });
            container.appendChild(card);
        });
    }
}

// פונקציה להתנתקות
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// פונקציה לעדכון תגיות הפרויקטים
function updateSelectedProjects() {
    const projectTypeSelect = document.getElementById('projectType');
    const selectedProjectsDiv = document.getElementById('selectedProjects');
    if (projectTypeSelect && selectedProjectsDiv) {
        selectedProjectsDiv.innerHTML = '';
        const selectedOptions = Array.from(projectTypeSelect.selectedOptions).map(option => option.value);
        selectedOptions.forEach(project => {
            const tag = document.createElement('span');
            tag.className = `project-tag ${project.toLowerCase().replace(' ', '-')}`;
            tag.textContent = project;
            selectedProjectsDiv.appendChild(tag);
        });
    }
}

// פונקציה לעדכון תגיות הבנקים
function updateSelectedBanks() {
    const bankSelect = document.getElementById('bank');
    const selectedBanksDiv = document.getElementById('selectedBanks');
    if (bankSelect && selectedBanksDiv) {
        selectedBanksDiv.innerHTML = '';
        const selectedOptions = Array.from(bankSelect.selectedOptions).map(option => option.value);
        selectedOptions.forEach(bank => {
            const tag = document.createElement('span');
            tag.className = 'bank-tag';
            tag.textContent = bank;
            selectedBanksDiv.appendChild(tag);
        });
    }
}

// פונקציה להצגת פרטי הלקוח
function renderCustomerDetails() {
    const container = document.getElementById('customerDetails');
    const deleteBtn = document.getElementById('deleteBtn');
    if (container && deleteBtn) {
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('id');
        const customer = customers[customerId];

        if (customer) {
            const commission = calculateCommission(customer);
            if (!isEditing) {
                container.innerHTML = `
                    <div class="header-section">
                        <h2><i class="fas fa-user"></i> ${customer.name}</h2>
                        <p><span>Contract Date:</span> ${customer.contractDate}</p>
                        <span class="status ${customer.status.toLowerCase().replace(' ', '-')}">${customer.status}</span>
                    </div>
                    <div class="section contact-info">
                        <h3><i class="fas fa-address-book"></i> Contact Information</h3>
                        <p><i class="fas fa-map-marker-alt"></i> <span>Address:</span> ${customer.address}</p>
                        <p><i class="fas fa-phone"></i> <span>Phone Number:</span> ${customer.phone}</p>
                        <p><i class="fas fa-user"></i> <span>Age:</span> ${customer.age}</p>
                    </div>
                    <div class="section">
                        <h3><i class="fas fa-tools"></i> Project Details</h3>
                        <p><i class="fas fa-list"></i> <span>Project Type:</span> ${Array.isArray(customer.projectType) ? customer.projectType.join(', ') : customer.projectType}</p>
                        <p><i class="fas fa-dollar-sign"></i> <span>Project Price:</span> $${addCommasToNumber(customer.projectPrice)}</p>
                        <p><i class="fas fa-money-bill-wave"></i> <span>Project Expenses:</span> $${addCommasToNumber(customer.projectExpenses)}</p>
                        <p><i class="fas fa-chart-line"></i> <span>Commission:</span> $<span class="commission-value">${addCommasToNumber(commission)}</span></p>
                    </div>
                    <div class="section financial-details">
                        <h3><i class="fas fa-chart-pie"></i> Financial Details</h3>
                        <p><i class="fas fa-percent"></i> <span>Lead Cost:</span> ${customer.leadCost}%</p>
                        <p><i class="fas fa-percent"></i> <span>Dealer Fee:</span> ${customer.dealerFee}%</p>
                        <p><i class="fas fa-university"></i> <span>Banks:</span> ${Array.isArray(customer.bank) ? customer.bank.join(', ') : customer.bank}</p>
                        <p><i class="fas fa-file-alt"></i> <span>Terms:</span> ${customer.terms}</p>
                        <p><i class="fas fa-check-circle"></i> <span>Max Approved:</span> $${addCommasToNumber(customer.maxApproved)}</p>
                        <p><i class="fas fa-money-check"></i> <span>Money Used:</span> $${addCommasToNumber(customer.moneyUsed)}</p>
                        <p><i class="fas fa-shield-alt"></i> <span>Payment Method:</span> ${customer.paymentMethod}</p>
                    </div>
                `;
                deleteBtn.style.display = 'none'; // מסתיר את כפתור המחיקה במצב צפייה
            } else {
                container.innerHTML = `
                    <div class="header-section">
                        <h2><i class="fas fa-user"></i> <input type="text" id="editName" value="${customer.name}" required></h2>
                        <p><span>Contract Date:</span> <input type="date" id="editContractDate" value="${customer.contractDate}" required></p>
                        <select id="editStatus" required>
                            <option value="In Progress" ${customer.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="In Progress(Funded)" ${customer.status === 'In Progress(Funded)' ? 'selected' : ''}>In Progress (Funded)</option>
                            <option value="Closed" ${customer.status === 'Closed' ? 'selected' : ''}>Closed</option>
                            <option value="Cancelled" ${customer.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="section contact-info">
                        <h3><i class="fas fa-address-book"></i> Contact Information</h3>
                        <p><i class="fas fa-map-marker-alt"></i> <span>Address:</span> <input type="text" id="editAddress" value="${customer.address}" required></p>
                        <p><i class="fas fa-phone"></i> <span>Phone Number:</span> <input type="tel" id="editPhone" value="${customer.phone}" required></p>
                        <p><i class="fas fa-user"></i> <span>Age:</span> <input type="number" id="editAge" value="${customer.age}" min="1" required></p>
                    </div>
                    <div class="section">
                        <h3><i class="fas fa-tools"></i> Project Details</h3>
                        <p><i class="fas fa-list"></i> <span>Project Type:</span> <select id="editProjectType" multiple required>
                            <option value="Roofing" ${customer.projectType.includes('Roofing') ? 'selected' : ''}>Roofing</option>
                            <option value="Solar" ${customer.projectType.includes('Solar') ? 'selected' : ''}>Solar</option>
                            <option value="Hvac" ${customer.projectType.includes('Hvac') ? 'selected' : ''}>Hvac</option>
                            <option value="Windows" ${customer.projectType.includes('Windows') ? 'selected' : ''}>Windows</option>
                            <option value="Tankless Water Heater" ${customer.projectType.includes('Tankless Water Heater') ? 'selected' : ''}>Tankless Water Heater</option>
                            <option value="Exterior Paint" ${customer.projectType.includes('Exterior Paint') ? 'selected' : ''}>Exterior Paint</option>
                            <option value="Interior Paint" ${customer.projectType.includes('Interior Paint') ? 'selected' : ''}>Interior Paint</option>
                            <option value="Flooring" ${customer.projectType.includes('Flooring') ? 'selected' : ''}>Flooring</option>
                            <option value="Bathroom Remodel" ${customer.projectType.includes('Bathroom Remodel') ? 'selected' : ''}>Bathroom Remodel</option>
                            <option value="Kitchen Remodel" ${customer.projectType.includes('Kitchen Remodel') ? 'selected' : ''}>Kitchen Remodel</option>
                            <option value="Landscape" ${customer.projectType.includes('Landscape') ? 'selected' : ''}>Landscape</option>
                            <option value="Gutters" ${customer.projectType.includes('Gutters') ? 'selected' : ''}>Gutters</option>
                            <option value="Foundation" ${customer.projectType.includes('Foundation') ? 'selected' : ''}>Foundation</option>
                            <option value="Insulation" ${customer.projectType.includes('Insulation') ? 'selected' : ''}>Insulation</option>
                            <option value="Fence" ${customer.projectType.includes('Fence') ? 'selected' : ''}>Fence</option>
                            <option value="Main Panel Upgrade" ${customer.projectType.includes('Main Panel Upgrade') ? 'selected' : ''}>Main Panel Upgrade</option>
                            <option value="Rewire" ${customer.projectType.includes('Rewire') ? 'selected' : ''}>Rewire</option>
                            <option value="Repipe" ${customer.projectType.includes('Repipe') ? 'selected' : ''}>Repipe</option>
                        </select></p>
                        <p><i class="fas fa-dollar-sign"></i> <span>Project Price:</span> $<input type="number" id="editProjectPrice" value="${customer.projectPrice}" min="0" step="0.01" required></p>
                        <p><i class="fas fa-money-bill-wave"></i> <span>Project Expenses:</span> $<input type="number" id="editProjectExpenses" value="${customer.projectExpenses}" min="0" step="0.01" required></p>
                        <p><i class="fas fa-chart-line"></i> <span>Commission:</span> $<span class="commission-value">${addCommasToNumber(commission)}</span></p>
                    </div>
                    <div class="section financial-details">
                        <h3><i class="fas fa-chart-pie"></i> Financial Details</h3>
                        <p><i class="fas fa-percent"></i> <span>Lead Cost:</span> <input type="number" id="editLeadCost" value="${customer.leadCost}" min="0" max="100" step="0.1" required>%</p>
                        <p><i class="fas fa-percent"></i> <span>Dealer Fee:</span> <input type="number" id="editDealerFee" value="${customer.dealerFee}" min="0" max="100" step="0.1" required>%</p>
                        <p><i class="fas fa-university"></i> <span>Banks:</span> <select id="editBank" multiple required>
                            <option value="Goodleap" ${Array.isArray(customer.bank) && customer.bank.includes('Goodleap') ? 'selected' : ''}>Goodleap</option>
                            <option value="Service Finance" ${Array.isArray(customer.bank) && customer.bank.includes('Service Finance') ? 'selected' : ''}>Service Finance</option>
                            <option value="Aqua" ${Array.isArray(customer.bank) && customer.bank.includes('Aqua') ? 'selected' : ''}>Aqua</option>
                            <option value="Slice" ${Array.isArray(customer.bank) && customer.bank.includes('Slice') ? 'selected' : ''}>Slice</option>
                            <option value="Mosaic" ${Array.isArray(customer.bank) && customer.bank.includes('Mosaic') ? 'selected' : ''}>Mosaic</option>
                        </select></p>
                        <p><i class="fas fa-file-alt"></i> <span>Terms:</span> <input type="text" id="editTerms" value="${customer.terms}" required></p>
                        <p><i class="fas fa-check-circle"></i> <span>Max Approved:</span> $<input type="number" id="editMaxApproved" value="${customer.maxApproved}" min="0" step="0.01" required></p>
                        <p><i class="fas fa-money-check"></i> <span>Money Used:</span> $<input type="number" id="editMoneyUsed" value="${customer.moneyUsed}" min="0" step="0.01" required></p>
                        <p><i class="fas fa-shield-alt"></i> <span>Payment Method:</span> 
                            <select id="editPaymentMethod" required>
                                <option value="Cash" ${customer.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                                <option value="Finance" ${customer.paymentMethod === 'Finance' ? 'selected' : ''}>Finance</option>
                            </select>
                        </p>
                    </div>
                `;
                deleteBtn.style.display = 'block'; // מציג את כפתור המחיקה במצב עריכה
            }
        } else {
            container.innerHTML = '<p>Customer not found.</p>';
            deleteBtn.style.display = 'none';
        }
    }
}

// פונקציה לחישוב Money Used לפי Project Price (זהה ל-Project Price)
function updateMoneyUsed() {
    const projectPrice = parseFloat(document.getElementById('projectPrice').value) || 0;
    const moneyUsedInput = document.getElementById('moneyUsed');
    if (moneyUsedInput) {
        moneyUsedInput.value = projectPrice.toFixed(2);
        console.log(`Updated Money Used to: ${moneyUsedInput.value}`);
    }
}

// פונקציה לעדכון סך ההוצאות ב-Project Expenses
function updateProjectExpenses() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense), 0);
    const projectExpensesInput = document.getElementById('projectExpenses');
    if (projectExpensesInput) {
        projectExpensesInput.value = totalExpenses.toFixed(2);
        console.log(`Updated Project Expenses to: ${projectExpensesInput.value}`);
    }
}

// פונקציה להוספת הוצאה חדשה
function addExpense(amount) {
    expenses.push(parseFloat(amount).toFixed(2));
    updateProjectExpenses();
    renderExpenses();
    console.log(`Added Expense: ${amount}, Total Expenses: ${expenses}`);
}

// פונקציה למחיקת הוצאה
function removeExpense(index) {
    expenses.splice(index, 1);
    updateProjectExpenses();
    renderExpenses();
    console.log(`Removed Expense at index ${index}, Total Expenses: ${expenses}`);
}

// פונקציה להצגת רשימת ההוצאות
function renderExpenses() {
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        expenseList.innerHTML = '';
        expenses.forEach((expense, index) => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            expenseItem.innerHTML = `
                $${addCommasToNumber(expense)}
                <button class="remove-expense" onclick="removeExpense(${index})"><i class="fas fa-times"></i></button>
            `;
            expenseList.appendChild(expenseItem);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // עדכון תגיות הפרויקטים
    const projectTypeSelect = document.getElementById('projectType');
    if (projectTypeSelect) {
        projectTypeSelect.addEventListener('change', updateSelectedProjects);
        updateSelectedProjects(); // עדכון ראשוני
    }

    // עדכון תגיות הבנקים
    const bankSelect = document.getElementById('bank');
    if (bankSelect) {
        bankSelect.addEventListener('change', updateSelectedBanks);
        updateSelectedBanks(); // עדכון ראשוני
    }

    // עדכון Dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        updateDashboardStats();
    }

    // עדכון Customers
    if (window.location.pathname.includes('customers.html')) {
        renderCustomers();
    }

    // עדכון Customer Details
    if (window.location.pathname.includes('customer.html')) {
        renderCustomerDetails();

        // ניהול כפתור העריכה והמחיקה
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (editBtn && deleteBtn) {
            editBtn.addEventListener('click', () => {
                isEditing = !isEditing;
                if (isEditing) {
                    editBtn.textContent = 'Save';
                    editBtn.id = 'saveBtn';
                    deleteBtn.style.display = 'block'; // מציג את כפתור המחיקה במצב עריכה
                } else {
                    // שמירת השינויים
                    const urlParams = new URLSearchParams(window.location.search);
                    const customerId = urlParams.get('id');
                    const updatedCustomer = {
                        name: document.getElementById('editName').value,
                        address: document.getElementById('editAddress').value,
                        phone: document.getElementById('editPhone').value,
                        age: document.getElementById('editAge').value,
                        contractDate: document.getElementById('editContractDate').value,
                        projectType: Array.from(document.getElementById('editProjectType').selectedOptions).map(option => option.value),
                        projectPrice: document.getElementById('editProjectPrice').value,
                        projectExpenses: document.getElementById('editProjectExpenses').value,
                        paymentMethod: document.getElementById('editPaymentMethod').value,
                        leadCost: document.getElementById('editLeadCost').value,
                        dealerFee: document.getElementById('editDealerFee').value,
                        bank: Array.from(document.getElementById('editBank').selectedOptions).map(option => option.value),
                        terms: document.getElementById('editTerms').value,
                        maxApproved: document.getElementById('editMaxApproved').value,
                        moneyUsed: document.getElementById('editMoneyUsed').value,
                        status: document.getElementById('editStatus').value
                    };
                    customers[customerId] = updatedCustomer;
                    localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customers)); // שמירה לפי המשתמש
                    editBtn.textContent = 'Edit';
                    editBtn.id = 'editBtn';
                    deleteBtn.style.display = 'none'; // מסתיר את כפתור המחיקה לאחר שמירה
                }
                renderCustomerDetails();
            });

            // ניהול כפתור המחיקה
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const customerId = urlParams.get('id');
                    customers.splice(customerId, 1); // מוחק את הלקוח מהמערך
                    localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customers)); // מעדכן את ה-Local Storage לפי המשתמש
                    window.location.href = 'customers.html'; // מחזיר לדף הלקוחות
                }
            });
        }
    }

    // ניהול Log In
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const validUsers = {
                'matan': '123456',
                'almog': '12345'
            };

            if (validUsers[username] && validUsers[username] === password) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                customers = JSON.parse(localStorage.getItem(`customers_${username}`)) || [];
                console.log(`User ${username} logged in. Loaded customers:`, customers);
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('loginMessage').style.display = 'block';
                document.getElementById('loginMessage').textContent = 'Invalid username or password';
            }
        });
    }

    // ניהול הוספת לקוח
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            window.location.href = 'add-customer.html';
        });
    }

    // ניהול התנתקות
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    }

    // ניהול טופס הוספת לקוח
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const projectTypeSelect = document.getElementById('projectType');
            const selectedProjects = Array.from(projectTypeSelect.selectedOptions).map(option => option.value);

            if (selectedProjects.length === 0) {
                alert('Please select at least one project type.');
                return;
            }

            const bankSelect = document.getElementById('bank');
            const selectedBanks = Array.from(bankSelect.selectedOptions).map(option => option.value);

            if (selectedBanks.length === 0) {
                alert('Please select at least one bank.');
                return;
            }

            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!paymentMethod) {
                alert('Please select a payment method.');
                return;
            }

            const newCustomer = {
                name: document.getElementById('customerName').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                age: document.getElementById('age').value,
                contractDate: document.getElementById('contractDate').value,
                projectType: selectedProjects,
                projectPrice: document.getElementById('projectPrice').value,
                projectExpenses: document.getElementById('projectExpenses').value,
                paymentMethod: paymentMethod.value,
                leadCost: document.getElementById('leadCost').value,
                dealerFee: document.getElementById('dealerFee').value,
                bank: selectedBanks, // שמירה כמערך של בנקים
                terms: document.getElementById('terms').value,
                maxApproved: document.getElementById('maxApproved').value,
                moneyUsed: document.getElementById('moneyUsed').value,
                status: document.getElementById('status').value
            };

            console.log('New Customer Data:', newCustomer);

            customers.push(newCustomer);
            try {
                localStorage.setItem(`customers_${currentUser}`, JSON.stringify(customers));
                console.log(`Customer saved for ${currentUser}. Total customers:`, customers);
                window.location.href = 'customers.html';
            } catch (e) {
                console.error('Error saving to Local Storage:', e);
                alert('Error saving customer data. Please check your storage settings.');
            }
        });

        // חישוב דינמי של Money Used לפי Project Price (זהה ל-Project Price)
        const projectPriceInput = document.getElementById('projectPrice');
        const moneyUsedInput = document.getElementById('moneyUsed');
        if (projectPriceInput && moneyUsedInput) {
            projectPriceInput.addEventListener('input', updateMoneyUsed);
            updateMoneyUsed(); // עדכון ראשוני
        }

        // ניהול הוספת הוצאות ב-Project Expenses
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                const amount = prompt("Enter expense amount ($):");
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    addExpense(amount);
                } else {
                    alert("Please enter a valid expense amount.");
                }
            });
        }
    }
});