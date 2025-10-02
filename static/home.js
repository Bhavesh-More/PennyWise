document.addEventListener('DOMContentLoaded', function (e) {
    // Fetch currency symbol from backend
    let currencySymbol = '₹'; // Default
    fetch('/get-currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            currencySymbol = data.currency;
            updateExpenseCards();
        })
        .catch(error => {
            console.error('Error fetching currency:', error);
            updateExpenseCards(); // Proceed with default currency
        });

    // Function to update expense cards with allotted, spent, and remaining amounts
    function updateExpenseCards() {
        fetch('/show-cards', {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                for (const category in data) {
                    const amount = data[category];

                    // Enable the card div by removing 'disabled'
                    const cardDiv = document.getElementById(category);
                    if (cardDiv) {
                        cardDiv.classList.remove('disabled');
                    }

                    // Update the allotted amount
                    const spanClass = category.toLowerCase() + 'Alloted';
                    const spanElement = document.querySelector(`span.${spanClass}`);
                    if (spanElement) {
                        spanElement.textContent = `${currencySymbol}${amount.toFixed(2)}`;
                    }
                }

                // Fetch spent and remaining amounts
                return fetch('/update-expense-cards', {
                    method: 'POST'
                });
            })
            .then(response => response.json())
            .then(spentData => {
                for (const category in spentData) {
                    const { budget, withdrawn, remaining } = spentData[category];

                    // Update the spent amount
                    const spentSpanClass = category.toLowerCase() + 'Spent';
                    const spentSpanElement = document.querySelector(`span.${spentSpanClass}`);
                    if (spentSpanElement) {
                        spentSpanElement.textContent = `${currencySymbol}${withdrawn.toFixed(2)}`;
                    }

                    // Update the remaining amount
                    const remainingSpanClass = category.toLowerCase() + 'Remaining';
                    const remainingSpanElement = document.querySelector(`span.${remainingSpanClass}`);
                    if (remainingSpanElement) {
                        remainingSpanElement.textContent = `${currencySymbol}${remaining.toFixed(2)}`;
                    }
                }
            })
            .catch(error => console.error('Error loading data:', error));
    }

    // Credit form validation (unchanged)
    document.querySelector('.credit-form').addEventListener('submit', function (e) {
        e.preventDefault();
        let amountRegex = /^(?:\d+|\d*\.\d+)$/;
        let amountInput = document.getElementById('credit-amount');
        let dateInput = document.getElementById('credit-date');
        let amount = amountInput.value.trim();
        let selectedDate = dateInput.value;

        clearErrorState(amountInput);
        clearErrorState(dateInput);

        let hasErrors = false;

        if (!amount) {
            showError(amountInput, 'Amount is required');
            hasErrors = true;
        } else if (!amountRegex.test(amount)) {
            showError(amountInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
            hasErrors = true;
        } else {
            let amountValue = parseFloat(amount);
            if (amountValue <= 0) {
                showError(amountInput, 'Amount must be greater than 0');
                hasErrors = true;
            } else if (amountValue > 999999.99) {
                showError(amountInput, 'Amount cannot exceed 999,999.99');
                hasErrors = true;
            }
        }

        if (!selectedDate) {
            showError(dateInput, 'Date is required');
            hasErrors = true;
        } else {
            let today = new Date();
            let inputDate = new Date(selectedDate);
            today.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);

            if (inputDate < today) {
                showError(dateInput, 'Date cannot be in the past. Please select today or a future date.');
                hasErrors = true;
            }
        }

        if (hasErrors) {
            return;
        }
        console.log('Credit form is valid, processing...');

        const amounts = amountInput.value.trim();
        const source = document.getElementById('credit-source').value;
        let note = document.getElementById('credit-note').value;
        const date = selectedDate;

        if (!note.trim()) note = ' ';

        fetch('/add-credit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amounts, source, note, date })
        })
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.json();
            })
            .then(data => {
                if (data.result === true) {
                    showSuccess('Credit added successfully!', document.querySelector('.credit-form'));
                    document.querySelector('.credit-form').reset();
                    updateExpenseCards();
                } else {
                    showError(dateInput, data.message || 'Server error: unable to add credit.');
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                showError(dateInput, 'Error sending request.');
            });
    });

    // Goals form validation (unchanged)
    document.querySelector('.goals-form').addEventListener('submit', function (e) {
        e.preventDefault();
        let amountRegex = /^(?:\d+|\d*\.\d+)$/;
        let goalAmountInput = document.getElementById('goal-amount');
        let goalMinAmountInput = document.getElementById('goal-minAmount');
        let goalSavedForInput = document.getElementById('goal-saved-for');
        let goalNoteInput = document.getElementById('goal-note');

        let goalAmount = goalAmountInput.value.trim();
        let goalMinAmount = goalMinAmountInput.value.trim();
        let goalSavedFor = goalSavedForInput.value;
        let goalNote = goalNoteInput.value.trim();

        clearErrorState(goalAmountInput);
        clearErrorState(goalMinAmountInput);
        clearErrorState(goalSavedForInput);
        clearErrorState(goalNoteInput);

        let hasErrors = false;

        if (!goalAmount) {
            showError(goalAmountInput, 'Goal amount is required');
            hasErrors = true;
        } else if (!amountRegex.test(goalAmount)) {
            showError(goalAmountInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
            hasErrors = true;
        } else {
            let goalAmountValue = parseFloat(goalAmount);
            if (goalAmountValue <= 0) {
                showError(goalAmountInput, 'Goal amount must be greater than 0');
                hasErrors = true;
            } else if (goalAmountValue > 999999.99) {
                showError(goalAmountInput, 'Goal amount cannot exceed 999,999.99');
                hasErrors = true;
            }
        }

        if (!goalMinAmount) {
            showError(goalMinAmountInput, 'Minimum amount is required');
            hasErrors = true;
        } else if (!amountRegex.test(goalMinAmount)) {
            showError(goalMinAmountInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
            hasErrors = true;
        } else {
            let goalMinAmountValue = parseFloat(goalMinAmount);
            if (goalMinAmountValue < 0) {
                showError(goalMinAmountInput, 'Minimum amount cannot be negative');
                hasErrors = true;
            } else if (goalMinAmountValue > 999999.99) {
                showError(goalMinAmountInput, 'Minimum amount cannot exceed 999,999.99');
                hasErrors = true;
            }
            if (goalAmount && goalMinAmount && !hasErrors) {
                let goalAmountValue = parseFloat(goalAmount);
                if (goalMinAmountValue > goalAmountValue) {
                    showError(goalMinAmountInput, 'Minimum amount cannot be greater than goal amount');
                    hasErrors = true;
                }
            }
        }

        if (!goalSavedFor) {
            showError(goalSavedForInput, 'Please select what you are saving for');
            hasErrors = true;
        }

        if (!goalNote) {
            showError(goalNoteInput, 'Note is required');
            hasErrors = true;
        } else if (goalNote.length > 255) {
            showError(goalNoteInput, 'Note cannot exceed 255 characters');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }
        console.log('Goals form is valid, processing...');

        const amount = goalAmount;
        const minAmount = goalMinAmount;
        const savedFor = goalSavedFor;
        const note = goalNote;

        fetch('/set-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, minAmount, savedFor, note })
        })
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.json();
            })
            .then(data => {
                if (data.result === true) {
                    showSuccess('Goal set successfully!', document.querySelector('.goals-form'));
                    document.querySelector('.goals-form').reset();
                } else {
                    showError(goalNoteInput, data.message || 'Server error: unable to set goal.');
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                showError(goalNoteInput, 'Error sending request.');
            });
    });

    // Budget control checkbox functionality
    document.getElementById('budget-control').addEventListener('change', function () {
        const minDepositGroup = document.querySelector('.min-deposit-group');
        const minDepositInput = document.getElementById('min-deposit-amount');

        if (this.checked) {
            minDepositGroup.style.display = 'flex';
            minDepositInput.setAttribute('required', 'required');
        } else {
            minDepositGroup.style.display = 'none';
            minDepositInput.removeAttribute('required');
            minDepositInput.value = '';
            clearErrorState(minDepositInput);
        }
    });

    // Expense form validation
    document.querySelector('.expense-form').addEventListener('submit', function (e) {
        e.preventDefault();

        let amountRegex = /^(?:\d+|\d*\.\d+)$/;
        let expenseAmountInput = document.getElementById('expense-amount');
        let expenseSourceInput = document.getElementById('expense-source');
        let expenseNoteInput = document.getElementById('expense-note');
        let minDepositInput = document.getElementById('min-deposit-amount');

        let expenseAmount = expenseAmountInput.value.trim();
        let expenseSource = expenseSourceInput.value;
        let expenseNote = expenseNoteInput.value.trim();
        let budgetControl = document.getElementById('budget-control').checked;
        let minDepositAmount = minDepositInput.value.trim();

        clearErrorState(expenseAmountInput);
        clearErrorState(expenseSourceInput);
        clearErrorState(expenseNoteInput);
        clearErrorState(minDepositInput);

        let hasErrors = false;

        if (!expenseAmount) {
            showError(expenseAmountInput, 'Amount is required');
            hasErrors = true;
        } else if (!amountRegex.test(expenseAmount)) {
            showError(expenseAmountInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
            hasErrors = true;
        } else {
            let expenseAmountValue = parseFloat(expenseAmount);
            if (expenseAmountValue <= 0) {
                showError(expenseAmountInput, 'Amount must be greater than 0');
                hasErrors = true;
            } else if (expenseAmountValue > 999999.99) {
                showError(expenseAmountInput, 'Amount cannot exceed 999,999.99');
                hasErrors = true;
            }
        }

        if (!expenseSource) {
            showError(expenseSourceInput, 'Please select an expense category');
            hasErrors = true;
        }

        if (expenseNote.length > 255) {
            showError(expenseNoteInput, 'Note cannot exceed 255 characters');
            hasErrors = true;
        }

        if (budgetControl) {
            if (!minDepositAmount) {
                showError(minDepositInput, 'Minimum deposit amount is required when budget control is enabled');
                hasErrors = true;
            } else if (!amountRegex.test(minDepositAmount)) {
                showError(minDepositInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
                hasErrors = true;
            } else {
                let minDepositValue = parseFloat(minDepositAmount);
                if (minDepositValue < 0) {
                    showError(minDepositInput, 'Minimum deposit amount cannot be negative');
                    hasErrors = true;
                } else if (minDepositValue > 999999.99) {
                    showError(minDepositInput, 'Minimum deposit amount cannot exceed 999,999.99');
                    hasErrors = true;
                }
                if (expenseAmount && minDepositAmount && !hasErrors) {
                    let expenseAmountValue = parseFloat(expenseAmount);
                    if (minDepositValue > expenseAmountValue) {
                        showError(minDepositInput, 'Minimum deposit amount cannot be greater than the allocated amount');
                        hasErrors = true;
                    }
                }
            }
        }

        if (hasErrors) {
            return;
        }

        console.log('Expense form is valid, processing...');

        const amount = expenseAmount;
        const source = expenseSource;
        const note = expenseNote || ' ';
        const budget_control = budgetControl;
        const min_deposit_amount = budgetControl ? minDepositAmount : null;

        fetch('/add-expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, source, note, budget_control, min_deposit_amount })
        })
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.json();
            })
            .then(data => {
                if (data.result === true) {
                    showSuccess('Expense added successfully!', document.querySelector('.expense-form'));
                    document.querySelector('.expense-form').reset();
                    document.querySelector('.min-deposit-group').style.display = 'none';
                    document.getElementById('min-deposit-amount').removeAttribute('required');
                    updateExpenseCards();
                } else {
                    showError(expenseNoteInput, data.message || 'Server error: unable to add expense.');
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                showError(expenseNoteInput, 'Error sending request.');
            });
    });

    // Withdraw form validation
    document.querySelector('.withdraw-form').addEventListener('submit', function (e) {
        e.preventDefault();

        let amountRegex = /^(?:\d+|\d*\.\d+)$/;
        let withdrawAmountInput = document.getElementById('withdraw-amount');
        let withdrawSourceInput = document.getElementById('withdraw-source');
        let withdrawNoteInput = document.getElementById('withdraw-note');

        let withdrawAmount = withdrawAmountInput.value.trim();
        let withdrawSource = withdrawSourceInput.value;
        let withdrawNote = withdrawNoteInput.value.trim();

        clearErrorState(withdrawAmountInput);
        clearErrorState(withdrawSourceInput);
        clearErrorState(withdrawNoteInput);

        let hasErrors = false;

        if (!withdrawAmount) {
            showError(withdrawAmountInput, 'Amount is required');
            hasErrors = true;
        } else if (!amountRegex.test(withdrawAmount)) {
            showError(withdrawAmountInput, 'Please enter a valid amount (e.g., 100 or 100.50)');
            hasErrors = true;
        } else {
            let withdrawAmountValue = parseFloat(withdrawAmount);
            if (withdrawAmountValue <= 0) {
                showError(withdrawAmountInput, 'Amount must be greater than 0');
                hasErrors = true;
            } else if (withdrawAmountValue > 999999.99) {
                showError(withdrawAmountInput, 'Amount cannot exceed 999,999.99');
                hasErrors = true;
            }
        }

        if (!withdrawSource) {
            showError(withdrawSourceInput, 'Please select an expense category');
            hasErrors = true;
        }

        if (withdrawNote.length > 255) {
            showError(withdrawNoteInput, 'Note cannot exceed 255 characters');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        console.log('Quick Withdraw form is valid, processing...');

        const amount = withdrawAmount;
        const source = withdrawSource;
        const note = withdrawNote || ' ';

        fetch('/quick-withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, source, note })
        })
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not ok');
                return resp.json();
            })
            .then(data => {
                if (data.result === true) {
                    showSuccess('Withdrawal added successfully!', document.querySelector('.withdraw-form'));
                    document.querySelector('.withdraw-form').reset();
                    updateExpenseCards();
                } else {
                    showHeadError('Error: ', data.message || 'Server error: unable to process withdrawal.');
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                showError(withdrawNoteInput, 'Error sending request.');
            });
    });

    // Clear error state handlers (unchanged)
    document.getElementById('credit-amount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('credit-date').addEventListener('change', function () {
        clearErrorState(this);
    });
    document.getElementById('goal-amount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('goal-minAmount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('goal-saved-for').addEventListener('change', function () {
        clearErrorState(this);
    });
    document.getElementById('goal-note').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('expense-amount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('expense-source').addEventListener('change', function () {
        clearErrorState(this);
    });
    document.getElementById('expense-note').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('min-deposit-amount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('withdraw-amount').addEventListener('input', function () {
        clearErrorState(this);
    });
    document.getElementById('withdraw-source').addEventListener('change', function () {
        clearErrorState(this);
    });
    document.getElementById('withdraw-note').addEventListener('input', function () {
        clearErrorState(this);
    });

    function showError(inputElement, message) {
        inputElement.classList.add('error');
        let errorDiv = inputElement.parentNode.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            inputElement.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        inputElement.focus();
    }

    function clearErrorState(inputElement) {
        inputElement.classList.remove('error');
        let errorDiv = inputElement.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    function showSuccess(message, formElement) {
        let successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            color: #10b981;
            font-size: 0.9em;
            margin-top: 10px;
            padding: 8px 12px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        `;
        formElement.appendChild(successDiv);
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    function showHeadError(head, body) {
        const showErrorDiv = document.getElementById('showError');
        const errorElement = document.createElement('div');
        errorElement.className = 'errors';
        errorElement.innerHTML = `
            <p class="errorHead">${head}:</p>
            <p class="errorBody">${body}</p>
            <button class="error-close" onclick="dismissError(this)">×</button>
        `;
        showErrorDiv.appendChild(errorElement);
        showErrorDiv.style.display = 'block';
        setTimeout(() => {
            if (errorElement.parentNode) {
                dismissError(errorElement.querySelector('.error-close'));
            }
        }, 5000);
    }

    function dismissError(closeButton) {
        const errorElement = closeButton.parentElement;
        const showErrorDiv = document.getElementById('showError');
        errorElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
            if (showErrorDiv.children.length === 0) {
                showErrorDiv.style.display = 'none';
            }
        }, 300);
    }

    window.dismissError = dismissError;

});