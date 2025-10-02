// Global variables for pagination
let currentPage = 1;
let currentFilter = 'all';
const perPage = 10;

// Initialize transactions page when section is active
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the transactions section
    const transactionsSection = document.getElementById('transactions');
    if (transactionsSection) {
        // Add event listener for when transactions section becomes active
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (transactionsSection.classList.contains('active')) {
                        initializeTransactionsPage();
                    }
                }
            });
        });

        observer.observe(transactionsSection, { attributes: true });
    }
});

function initializeTransactionsPage() {
    // Create the HTML structure for the transactions page
    const transactionsSection = document.getElementById('transactions');
    
    // Check if content already exists
    if (transactionsSection.querySelector('.transactions-content')) {
        return;
    }

    const transactionsHTML = `
        <div class="transactions-content">
            <div class="transactions-filters">
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">All Transactions</button>
                    <button class="filter-btn" data-filter="credit">Credits</button>
                    <button class="filter-btn" data-filter="expense">Expenses</button>
                    <button class="filter-btn" data-filter="withdraw">Withdrawals</button>
                </div>
                <div class="transactions-summary">
                    <span class="summary-text">Total: <span id="totalTransactions">0</span> transactions</span>
                </div>
            </div>
            
            <div class="transactions-table-container">
                <h3>Transaction History</h3>
                <div class="table-wrapper">
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Source</th>
                                <th>Note</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody id="allTransactionsTableBody">
                            <!-- Transactions will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination Controls -->
                <div class="pagination-container">
                    <div class="pagination-info">
                        <span id="paginationInfo">Showing 0 - 0 of 0 transactions</span>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="prevBtn" onclick="changePage(currentPage - 1)">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <div class="page-numbers" id="pageNumbers">
                            <!-- Page numbers will be generated here -->
                        </div>
                        <button class="pagination-btn" id="nextBtn" onclick="changePage(currentPage + 1)">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert the HTML after the section header
    const sectionHeader = transactionsSection.querySelector('.section-header');
    sectionHeader.insertAdjacentHTML('afterend', transactionsHTML);

    // Add event listeners for filter buttons
    const filterButtons = transactionsSection.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current filter and reset to page 1
            currentFilter = this.dataset.filter;
            currentPage = 1;
            
            // Load transactions with new filter
            loadTransactions();
        });
    });

    // Load initial transactions
    loadTransactions();
}

function loadTransactions() {
    const tableBody = document.getElementById('allTransactionsTableBody');
    const totalTransactionsSpan = document.getElementById('totalTransactions');
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin"></i> Loading transactions...
            </td>
        </tr>
    `;

    // Determine the endpoint based on current filter
    let endpoint = '/get-all-transactions';
    let requestData = { page: currentPage, per_page: perPage };

    if (currentFilter !== 'all') {
        endpoint = '/get-transactions-by-type';
        requestData.type = currentFilter;
    }

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displayTransactions(data);
        updatePaginationControls(data);
        totalTransactionsSpan.textContent = data.total;
    })
    .catch(error => {
        console.error('Error loading transactions:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--error-color); padding: 2rem;">
                    Error loading transactions. Please try again.
                </td>
            </tr>
        `;
    });
}

function displayTransactions(data) {
    const tableBody = document.getElementById('allTransactionsTableBody');
    tableBody.innerHTML = '';

    if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format amount based on type
            let amountClass = '';
            let formattedAmount = '';
            
            if (transaction.type === 'Credit') {
                amountClass = 'amount-credit';
                formattedAmount = '+$' + parseFloat(transaction.amount).toFixed(2);
            } else {
                amountClass = 'amount-expense';
                formattedAmount = '-$' + parseFloat(transaction.amount).toFixed(2);
            }
            
            // Format date
            let formattedDate = 'N/A';
            if (transaction.date) {
                const date = new Date(transaction.date);
                formattedDate = date.toISOString().split('T')[0];
            }
            
            // Format transaction ID
            const transactionId = `TXN${String(transaction.id).padStart(3, '0')}`;
            
            row.innerHTML = `
                <td>${transactionId}</td>
                <td class="${amountClass}">${formattedAmount}</td>
                <td class="amount-type">${transaction.type}</td>
                <td>${transaction.source || 'N/A'}</td>
                <td>${transaction.note || 'No note'}</td>
                <td>${formattedDate}</td>
            `;
            
            tableBody.appendChild(row);
        });
    } else {
        // Show message if no transactions
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    No transactions found
                </td>
            </tr>
        `;
    }
}

function updatePaginationControls(data) {
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Update pagination info
    const startRecord = data.total > 0 ? (data.page - 1) * data.per_page + 1 : 0;
    const endRecord = Math.min(data.page * data.per_page, data.total);
    paginationInfo.textContent = `Showing ${startRecord} - ${endRecord} of ${data.total} transactions`;

    // Update previous button
    prevBtn.disabled = data.page <= 1;
    prevBtn.style.opacity = data.page <= 1 ? '0.5' : '1';

    // Update next button
    nextBtn.disabled = data.page >= data.total_pages;
    nextBtn.style.opacity = data.page >= data.total_pages ? '0.5' : '1';

    // Generate page numbers
    pageNumbers.innerHTML = '';
    
    if (data.total_pages > 1) {
        const maxVisiblePages = 5;
        let startPage = Math.max(1, data.page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(data.total_pages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page if not visible
        if (startPage > 1) {
            pageNumbers.appendChild(createPageButton(1));
            if (startPage > 2) {
                pageNumbers.appendChild(createEllipsis());
            }
        }

        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.appendChild(createPageButton(i, i === data.page));
        }

        // Add last page if not visible
        if (endPage < data.total_pages) {
            if (endPage < data.total_pages - 1) {
                pageNumbers.appendChild(createEllipsis());
            }
            pageNumbers.appendChild(createPageButton(data.total_pages));
        }
    }
}

function createPageButton(pageNum, isActive = false) {
    const button = document.createElement('button');
    button.className = `page-btn ${isActive ? 'active' : ''}`;
    button.textContent = pageNum;
    button.onclick = () => changePage(pageNum);
    return button;
}

function createEllipsis() {
    const span = document.createElement('span');
    span.className = 'page-ellipsis';
    span.textContent = '...';
    return span;
}

function changePage(newPage) {
    if (newPage !== currentPage) {
        currentPage = newPage;
        loadTransactions();
    }
}