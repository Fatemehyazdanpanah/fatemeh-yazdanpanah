(() => {
    const initializeLucideIcons = (element = document) => {
        if (typeof lucide !== 'undefined' && lucide.replace) {
            lucide.replace(element);
        }
    };

    const getData = (key, defaultValue) => {
        try {
            const data = localStorage.getItem(key);
            if (data === null || data === undefined) {
                saveData(key, defaultValue);
                return defaultValue;
            }
            const parsedData = JSON.parse(data);
            return parsedData;
        } catch (e) {
            saveData(key, defaultValue);
            return defaultValue;
        }
    };

    const saveData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
        }
    };

    const UnitsPage = {
        numberOfUnits: 14,
        defaultUnits: Array.from({ length: 14 }, (_, i) => ({
            number: i + 1,
            occupied: false
        })),
        unitsData: [],

        _updateUnitCardUI(unitNumber, isOccupied) {
            const card = document.querySelector(`.unit-card[data-unit-number="${unitNumber}"]`);
            if (!card) return;

            const statusSpan = card.querySelector('.unit-status');
            const toggleButton = card.querySelector('.toggle-status-btn');
            const iconContainer = toggleButton ? toggleButton.querySelector('.icon-container') : null;

            if (statusSpan) {
                statusSpan.classList.remove('text-violet-700', 'text-red-600', 'text-lg', 'font-bold');
                statusSpan.classList.add('text-lg', 'font-bold');
                if (isOccupied) {
                    statusSpan.classList.add('text-violet-700');
                    statusSpan.textContent = 'Occupied';
                } else {
                    statusSpan.classList.add('text-red-600');
                    statusSpan.textContent = 'Vacant';
                }
            }

            if (toggleButton) {
                toggleButton.dataset.occupied = isOccupied;
                toggleButton.title = isOccupied ? 'Mark as Vacant' : 'Mark as Occupied';

                toggleButton.classList.remove('bg-red-100', 'hover:bg-red-200', 'bg-violet-100', 'hover:bg-violet-200');
                toggleButton.classList.add(isOccupied ? 'bg-violet-100' : 'bg-red-100');
                toggleButton.classList.add(isOccupied ? 'hover:bg-violet-200' : 'hover:bg-red-200');

                if (iconContainer) {
                    const iconColorClass = isOccupied ? 'text-violet-700' : 'text-red-500';
                    const iconSvgContent = isOccupied ? `
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle ${iconColorClass}">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    ` : `
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle ${iconColorClass}">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="m15 9-6 6"/>
                            <path d="m9 9 6 6"/>
                        </svg>
                    `;
                    iconContainer.innerHTML = iconSvgContent;
                }
            }
        },

        _loadUnitsData() {
            let loadedData = getData('unitsData', this.defaultUnits);
            let needsCorrection = !Array.isArray(loadedData) || loadedData.length !== this.numberOfUnits;
            if (!needsCorrection) {
                const existingUnitNumbers = new Set(loadedData.map(unit => unit.number));
                for (let i = 1; i <= this.numberOfUnits; i++) {
                    if (!existingUnitNumbers.has(i)) {
                        needsCorrection = true;
                        break;
                    }
                    const unit = loadedData.find(u => u.number === i);
                    if (typeof unit.occupied !== 'boolean') {
                        needsCorrection = true;
                        break;
                    }
                }
            }

            if (needsCorrection) {
                this.unitsData = this.defaultUnits;
                saveData('unitsData', this.unitsData);
            } else {
                this.unitsData = loadedData.sort((a, b) => a.number - b.number);
            }
        },

        _setupEventListeners() {
            document.querySelectorAll('.unit-card .toggle-status-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const unitNumberToToggle = parseInt(e.currentTarget.dataset.unitNumber);
                    const unitIndex = this.unitsData.findIndex(unit => unit.number === unitNumberToToggle);

                    if (unitIndex > -1) {
                        const currentStatus = this.unitsData[unitIndex].occupied;
                        this.unitsData[unitIndex].occupied = !currentStatus;
                        saveData('unitsData', this.unitsData);
                        this._updateUnitCardUI(unitNumberToToggle, this.unitsData[unitIndex].occupied);
                    }
                });
            });
        },

        init() {
            this._loadUnitsData();
            this.unitsData.forEach(unit => {
                this._updateUnitCardUI(unit.number, unit.occupied);
            });
            this._setupEventListeners();
            initializeLucideIcons();
        }
    };

    const FamiliesPage = {
        numberOfUnits: 14,
        defaultFamilies: Array.from({ length: 14 }, (_, i) => ({
            unit: i + 1,
            name: '',
            members: 0
        })).reduce((acc, family) => {
            acc[family.unit] = { name: family.name, members: family.members };
            return acc;
        }, {}),
        familiesData: {},

        _loadFamiliesData() {
            this.familiesData = getData('familiesData', this.defaultFamilies);
            const currentFamilyUnits = Object.keys(this.familiesData).map(Number);
            const expectedUnits = Array.from({ length: this.numberOfUnits }, (_, i) => i + 1);

            let needsReset = (Object.keys(this.familiesData).length !== this.numberOfUnits || !expectedUnits.every(unit => currentFamilyUnits.includes(unit)));
            if (!needsReset) {
                for (const unit of expectedUnits) {
                    const family = this.familiesData[unit];
                    if (!family || typeof family.name !== 'string' || typeof family.members !== 'number' || family.members < 0) {
                        needsReset = true;
                        break;
                    }
                }
            }

            if (needsReset) {
                this.familiesData = this.defaultFamilies;
                saveData('familiesData', this.familiesData);
            } else {
                const sortedKeys = Object.keys(this.familiesData).sort((a, b) => parseInt(a) - parseInt(b));
                const sortedFamilies = {};
                sortedKeys.forEach(key => sortedFamilies[key] = this.familiesData[key]);
                this.familiesData = sortedFamilies;
            }
        },

        _renderFamilies() {
            const familiesList = document.getElementById('families-list');
            if (!familiesList) return;
            familiesList.innerHTML = '';

            Object.keys(this.familiesData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(unitNum => {
                const family = this.familiesData[unitNum];
                const listItem = document.createElement('li');
                const displayContent = family.name && family.name.trim() !== '' ?
                    `<strong class="text-violet-700 text-xl">Unit ${unitNum}:</strong> <span class="text-lg">${family.name}</span> - <span class="font-bold text-slate-700 text-lg">${family.members}</span> members` :
                    `<strong class="text-violet-700 text-xl">Unit ${unitNum}:</strong> <span class="text-lg italic text-slate-500">Vacant / No Family Assigned</span>`;

                listItem.innerHTML = `<div class="flex-grow">${displayContent}</div>`;
                listItem.className = 'flex items-center justify-between p-6 mb-4 bg-white rounded-2xl shadow-lg cursor-default transition-all duration-300 ease-out border border-blue-100 hover:bg-violet-50 hover:translate-y-[-5px] hover:scale-[1.01] hover:shadow-xl hover:border-violet-300 text-slate-700 text-lg';
                familiesList.appendChild(listItem);
            });
            initializeLucideIcons();
        },

        _setupForm() {
            const editFamilyForm = document.getElementById('edit-family-form');
            const unitSelect = document.getElementById('unit-select');
            const familyNameInput = document.getElementById('family-name');
            const numMembersInput = document.getElementById('num-members');

            if (!editFamilyForm || !unitSelect || !familyNameInput || !numMembersInput) return;

            unitSelect.innerHTML = '';
            for (let i = 1; i <= this.numberOfUnits; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Unit ${i}`;
                unitSelect.appendChild(option);
            }

            if (unitSelect.options.length > 0) {
                unitSelect.value = unitSelect.options[0].value;
                setTimeout(() => unitSelect.dispatchEvent(new Event('change', { bubbles: true })), 0);
            }

            unitSelect.addEventListener('change', () => {
                const selectedUnit = unitSelect.value;
                const family = this.familiesData[selectedUnit];
                if (family) {
                    familyNameInput.value = family.name;
                    numMembersInput.value = family.members;
                } else {
                    familyNameInput.value = '';
                    numMembersInput.value = 0;
                }
            });

            editFamilyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const unit = unitSelect.value;
                const newFamilyName = familyNameInput.value.trim();
                const newNumMembers = parseInt(numMembersInput.value, 10);

                if (unit && !isNaN(newNumMembers) && newNumMembers >= 0) {
                    this.familiesData = {
                        ...this.familiesData,
                        [unit]: {
                            name: newFamilyName,
                            members: newNumMembers
                        }
                    };
                    saveData('familiesData', this.familiesData);
                    this._renderFamilies();
                    alert(`Unit ${unit} family information updated successfully!`);
                } else {
                    alert('Please select a Unit Number, fill in Family Name (can be empty), and ensure member count is a non-negative number.');
                }
            });
        },

        init() {
            this._loadFamiliesData();
            this._renderFamilies();
            this._setupForm();
        }
    };

    const MaintenancePage = {
        maintenanceRequests: [],
        initialRequests: [{
            id: 1,
            unit: 2,
            description: 'Leaky faucet in kitchen',
            date: '2024-05-10',
            status: 'Pending'
        }, {
            id: 2,
            unit: 4,
            description: 'AC not cooling properly',
            date: '2024-05-15',
            status: 'In Progress'
        }, {
            id: 3,
            unit: 1,
            description: 'Clogged toilet in bathroom',
            date: '2024-04-20',
            status: 'Completed'
        }, ],

        _generateId() {
            return this.maintenanceRequests.length > 0 ? Math.max(...this.maintenanceRequests.map(req => req.id)) + 1 : 1;
        },

        _renderRequests() {
            const maintenanceList = document.getElementById('maintenance-list');
            if (!maintenanceList) return;
            maintenanceList.innerHTML = '';
            this.maintenanceRequests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);

            this.maintenanceRequests.forEach(request => {
                const listItem = document.createElement('li');
                let statusClass = '';
                switch (request.status) {
                    case 'Pending':
                        statusClass = 'text-amber-500 font-bold';
                        break;
                    case 'In Progress':
                        statusClass = 'text-blue-500 font-bold';
                        break;
                    case 'Completed':
                        statusClass = 'text-emerald-500 font-bold';
                        break;
                    default:
                        statusClass = 'text-gray-500 font-bold';
                }
                listItem.innerHTML = `
                    <div class="flex-grow">
                        <strong class="text-violet-700 text-xl">Unit ${request.unit}:</strong>
                        <span class="text-lg">${request.description}</span>
                        <br>
                        <span class="text-sm text-slate-500">Date: ${request.date}</span> - Status: <span class="${statusClass} text-lg">${request.status}</span>
                    </div>
                    <div class="flex items-center gap-2 ml-6">
                        <button class="delete-btn p-3 rounded-full bg-red-100 transition-colors hover:bg-red-200 shadow-md hover:shadow-lg" data-id="${request.id}" title="Delete Request">
                            <i data-lucide="trash-2" class="w-6 h-6 text-red-500"></i>
                        </button>
                    </div>
                `;
                listItem.className = 'flex items-center justify-between p-6 mb-4 bg-white rounded-2xl shadow-lg cursor-default transition-all duration-300 ease-out border border-blue-100 hover:bg-violet-50 hover:translate-y-[-5px] hover:scale-[1.01] hover:shadow-xl hover:border-violet-300 text-slate-700 text-lg';
                maintenanceList.appendChild(listItem);
            });
            initializeLucideIcons();
        },

        _setupFormAndListeners() {
            const addRequestForm = document.getElementById('add-request-form');
            const maintenanceList = document.getElementById('maintenance-list');
            if (!addRequestForm || !maintenanceList) return;

            addRequestForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const requestUnitInput = document.getElementById('request-unit');
                const requestDescriptionInput = document.getElementById('request-description');
                const requestDateInput = document.getElementById('request-date');
                const requestStatusInput = document.getElementById('request-status');

                if (!requestUnitInput || !requestDescriptionInput || !requestDateInput || !requestStatusInput) return;

                const newRequest = {
                    id: this._generateId(),
                    unit: parseInt(requestUnitInput.value),
                    description: requestDescriptionInput.value.trim(),
                    date: requestDateInput.value,
                    status: requestStatusInput.value
                };

                if (newRequest.unit >= 1 && newRequest.unit <= 14 && !isNaN(newRequest.unit) && newRequest.description && newRequest.date) {
                    this.maintenanceRequests.push(newRequest);
                    saveData('maintenanceRequests', this.maintenanceRequests);
                    this._renderRequests();
                    addRequestForm.reset();
                    alert('Maintenance request added successfully!');
                } else {
                    alert('Please fill in all fields correctly and ensure Unit Number is between 1 and 14.');
                }
            });

            maintenanceList.addEventListener('click', (e) => {
                const button = e.target.closest('.delete-btn');
                if (button) {
                    const requestIdToDelete = parseInt(button.dataset.id);
                    if (confirm(`Are you sure you want to delete this maintenance request?`)) {
                        this.maintenanceRequests = this.maintenanceRequests.filter(req => req.id !== requestIdToDelete);
                        saveData('maintenanceRequests', this.maintenanceRequests);
                        this._renderRequests();
                        alert('Maintenance request deleted.');
                    }
                }
            });
        },

        init() {
            this.maintenanceRequests = getData('maintenanceRequests', this.initialRequests);
            this._renderRequests();
            this._setupFormAndListeners();
        }
    };

    const ExpensesPage = {
        expensesData: [],
        initialExpenses: [{
            id: 1,
            description: 'Monthly Electricity',
            amount: 350.50,
            date: '2022-05-01',
            category: 'Utilities'
        }, {
            id: 2,
            description: 'Water Bill',
            amount: 120.00,
            date: '2022-05-05',
            category: 'Utilities'
        }, {
            id: 3,
            description: 'Janitorial Services',
            amount: 400.00,
            date: '2022-04-28',
            category: 'Maintenance'
        }, {
            id: 4,
            description: 'Property Tax',
            amount: 1500.00,
            date: '2022-03-10',
            category: 'Others'
        }, ],

        _generateId() {
            return this.expensesData.length > 0 ? Math.max(...this.expensesData.map(exp => exp.id)) + 1 : 1;
        },

        _renderExpenses() {
            const expensesList = document.getElementById('expenses-list');
            if (!expensesList) return;
            expensesList.innerHTML = '';
            this.expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);

            this.expensesData.forEach(expense => {
                const listItem = document.createElement('li');
                let categoryClass = '';
                switch (expense.category) {
                    case 'Rent':
                        categoryClass = 'text-emerald-600';
                        break;
                    case 'Utilities':
                        categoryClass = 'text-orange-600';
                        break;
                    case 'Maintenance':
                        categoryClass = 'text-indigo-600';
                        break;
                    case 'Others':
                        categoryClass = 'text-purple-600';
                        break;
                    default:
                        categoryClass = 'text-gray-500';
                }
                listItem.innerHTML = `
                    <div class="expense-item flex-grow">
                        <strong class="text-violet-700 text-xl">${expense.description}:</strong>
                        $<span class="font-bold text-slate-700 text-lg">${expense.amount.toFixed(2)}</span>
                        <br>
                        <span class="text-sm text-slate-500">Date: ${expense.date}</span> - Category: <span class="${categoryClass} font-semibold text-lg">${expense.category}</span>
                    </div>
                    <div class="flex items-center gap-2 ml-6">
                        <button class="delete-btn p-3 rounded-full bg-red-100 transition-colors hover:bg-red-200 shadow-md hover:shadow-lg" data-id="${expense.id}" title="Delete Expense">
                            <i data-lucide="trash-2" class="w-6 h-6 text-red-500"></i>
                        </button>
                    </div>
                `;
                listItem.className = 'flex items-center justify-between p-6 mb-4 bg-white rounded-2xl shadow-lg cursor-default transition-all duration-300 ease-out border border-blue-100 hover:bg-violet-50 hover:translate-y-[-5px] hover:scale-[1.01] hover:shadow-xl hover:border-violet-300 text-slate-700 text-lg';
                expensesList.appendChild(listItem);
            });
            initializeLucideIcons();
        },

        _setupFormAndListeners() {
            const addExpenseForm = document.getElementById('add-expense-form');
            const expensesList = document.getElementById('expenses-list');
            if (!addExpenseForm || !expensesList) return;

            addExpenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const expenseDescriptionInput = document.getElementById('expense-description');
                const expenseAmountInput = document.getElementById('expense-amount');
                const expenseDateInput = document.getElementById('expense-date');
                const expenseCategoryInput = document.getElementById('expense-category');

                if (!expenseDescriptionInput || !expenseAmountInput || !expenseDateInput || !expenseCategoryInput) return;

                const newExpense = {
                    id: this._generateId(),
                    description: expenseDescriptionInput.value.trim(),
                    amount: parseFloat(expenseAmountInput.value),
                    date: expenseDateInput.value,
                    category: expenseCategoryInput.value
                };

                if (newExpense.description && newExpense.amount > 0 && newExpense.date && !isNaN(newExpense.amount)) {
                    this.expensesData.push(newExpense);
                    saveData('expensesData', this.expensesData);
                    this._renderExpenses();
                    addExpenseForm.reset();
                    alert('Expense added successfully!');
                } else {
                    alert('Please fill in all fields correctly and ensure the amount is a positive number.');
                }
            });

            expensesList.addEventListener('click', (e) => {
                const button = e.target.closest('.delete-btn');
                if (button) {
                    const expenseIdToDelete = parseInt(button.dataset.id);
                    if (confirm(`Are you sure you want to delete this expense?`)) {
                        this.expensesData = this.expensesData.filter(exp => exp.id !== expenseIdToDelete);
                        saveData('expensesData', this.expensesData);
                        this._renderExpenses();
                        alert('Expense deleted.');
                    }
                }
            });
        },

        init() {
            this.expensesData = getData('expensesData', this.initialExpenses);
            this._renderExpenses();
            this._setupFormAndListeners();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname;
        const getBaseFolder = () => {
            const lastSlashIndex = path.lastIndexOf('/');
            return lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
        };
        const baseFolder = getBaseFolder();

        if (path.includes('index.html') || path === '/' || path === `${baseFolder}/` || path === `${baseFolder}/index.html`) {
            UnitsPage.init();
        } else if (path.includes('families.html')) {
            FamiliesPage.init();
        } else if (path.includes('maintenance.html')) {
            MaintenancePage.init();
        } else if (path.includes('expenses.html')) {
            ExpensesPage.init();
        }
    });
})();