document.addEventListener('DOMContentLoaded', function(e){
    if(document.getElementById('dashboard').classList.contains('active')){
        // Fetch balance data
        fetch('/dash-balance',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .then(resp => {
            if (!resp.ok) throw new Error('Network response was not ok');
            return resp.json();
        })
        .then(data => {
            let creditValue = document.getElementById('creditValue');
            let expenseValue = document.getElementById('expenseValue');
            let balanceValue = document.getElementById('balanceValue');

            // to add .00
            const credit = data.credit + .00;
            const expense = data.expense + .00;
            const balance = data.balance + .00;

            creditValue.innerHTML += ' ' + credit;
            expenseValue.innerHTML += ' ' + expense;
            balanceValue.innerHTML += ' ' + balance;
        })
        .catch(error => {
            console.error('Error fetching balance:', error);
        });

        // Fetch recent transactions
        fetch('/dash-transactions',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .then(resp => {
            if (!resp.ok) throw new Error('Network response was not ok');
            return resp.json();
        })
        .then(data => {
            const tableBody = document.getElementById('transactionsTableBody');
            tableBody.innerHTML = ''; // Clear existing content
            
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
                    const date = new Date(transaction.date);
                    const formattedDate = date.toISOString().split('T')[0];
                    
                    row.innerHTML = `
                        <td>TXN${String(transaction.id).padStart(3, '0')}</td>
                        <td class="${amountClass}">${formattedAmount}</td>
                        <td class="amount-type">${transaction.type}</td>
                        <td>${transaction.source}</td>
                        <td>${transaction.note || 'No note'}</td>
                        <td>${formattedDate}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            } else {
                // Show message if no transactions
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No transactions found
                    </td>
                `;
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            const tableBody = document.getElementById('transactionsTableBody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        Error loading transactions
                    </td>
                </tr>
            `;
        });
    }
});