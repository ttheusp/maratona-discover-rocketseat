const newTransactionButton = document.querySelector('.newTransactionButton')
const filterButton = document.querySelector('.filterButton')
const modalOverlay = document.querySelector('.modal-overlay')
const modalElement = document.querySelector('.modal')
const form = document.querySelector('form')
const cancelButton = document.querySelector('.button.cancel')

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('dev.finances:transactions')) || []
    },

    set() {
        localStorage.setItem('dev.finances:transactions', JSON.stringify(Transactions.all))
    }
}   

const Transactions = {
    all: Storage.get(),
    
    add(transaction) {
        this.all.push(transaction)
        Transactions.sortByDate()
        App.reload()
    },

    remove(index) {
        this.all.splice(index, 1)
        App.reload()
    },

    values() {
        return this.all.map(transaction => Number(transaction.amount))
    },
    
    incomes () {
        let income = 0 
        this.values().filter(value => value > 0).forEach(transaction => {
            income += transaction
        })
        return income
    },
    
    expenses () {
        let expense = 0 
        this.values().filter(value => value < 0).forEach(transaction => {
            expense += transaction
        })
        return expense
    },
    
    total () {
        return Number(this.incomes()) + Number(this.expenses())
    },

    sortByDate() {
        const sorted = Transactions.all.sort((transaction1, transaction2) => {
            let transactionDate2 = transaction2.date.split('/')
            transactionDate2 = Number(transactionDate2[2] + transactionDate2[1] + transactionDate2[0])
            let transactionDate1 = transaction1.date.split('/')
            transactionDate1 = Number(transactionDate1[2] + transactionDate1[1] + transactionDate1[0])
            
            return transactionDate2 - transactionDate1
        })
        return sorted
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction)  
        const removeButton = tr.querySelector('.removeButton')
        removeButton.addEventListener('click', e => {
            Transactions.remove(index)
        })
        DOM.transactionsContainer.appendChild(tr)
        
    },

    innerHTMLTransaction(transaction) {
        const CSSclass = transaction.amount > 0 ? 'income' : 'expense'
        const amount = Utils.formatCurrency(transaction.amount)
        return `
                <td class="description">${transaction.description}</td>
                <td class="${CSSclass}">${amount}</td>
                <td class="date">${transaction.date}</td>
                <td><img class="removeButton" src="./assets/minus.svg" alt="Remover transação"></td>
        `
    },

    updateTotalClass(total) {
        const isNegative = total < 0
        document.querySelector('.card.total').classList.remove('negative')
        if (isNegative) {
            document.querySelector('.card.total').classList.add('negative')
        }
    },

    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerText= Utils.formatCurrency(Transactions.incomes()) 
        document
            .getElementById('expenseDisplay')
            .innerText= Utils.formatCurrency(Transactions.expenses()) 
        document
            .getElementById('totalDisplay')
            .innerText= Utils.formatCurrency(Transactions.total())
        
        DOM.updateTotalClass(Transactions.total())
    },

    filterByDate(initialDate, finalDate) {
        DOM.transactionsContainer.innerHTML = ''
        initialDate = initialDate.split('/')
        initialDate = Number(initialDate[2] + initialDate[1] + initialDate[0])
        
        finalDate = finalDate.split('/')
        finalDate = Number(finalDate[2] + finalDate[1] + finalDate[0])
        if (isNaN(initialDate)) initialDate = -99999999
        if (isNaN(finalDate)) finalDate = 99999999
        
        if (finalDate < initialDate) throw new Error('A data final deve ser maior que a data inicial!')
        const transactionsFiltered = Transactions.all.filter(transaction => {
            let transactionDate = transaction.date.split('/')
            transactionDate = Number(transactionDate[2] + transactionDate[1] + transactionDate[0])
            return (transactionDate >= initialDate && transactionDate <= finalDate)
        })

        transactionsFiltered.forEach(transaction => {
            const index = Transactions.all.indexOf(transaction)
            DOM.addTransaction(transaction, index)
        })
        DOM.updateFilteredBalance(transactionsFiltered)
    },

    incomesFiltered(transactionsFiltered) {
        return transactionsFiltered.reduce((incomes, e) => {
            let amount = Number(e.amount)
            if(amount > 0) incomes += amount
            return incomes
        }, 0)
    },
    
    expenseFiltered(transactionsFiltered) {
        return transactionsFiltered.reduce((incomes, e) => {
            let amount = Number(e.amount)
            if(amount < 0) incomes += amount
            return incomes
        }, 0)
    },
    
    totalFiltered(transactionsFiltered) {
        return DOM.incomesFiltered(transactionsFiltered) + DOM.expenseFiltered(transactionsFiltered)
    },

    updateFilteredBalance(transactionsFiltered) {
        const incomesFiltered = DOM.incomesFiltered(transactionsFiltered)
        const expenseFiltered = DOM.expenseFiltered(transactionsFiltered)
        const totalFiltered = DOM.totalFiltered(transactionsFiltered)
        
        document
            .getElementById('incomeDisplay')
            .innerText= Utils.formatCurrency(incomesFiltered) 
        document
            .getElementById('expenseDisplay')
            .innerText= Utils.formatCurrency(expenseFiltered) 
        document
            .getElementById('totalDisplay')
            .innerText= Utils.formatCurrency(totalFiltered)
        
        DOM.updateTotalClass(totalFiltered)
    }
}

const Utils = {
    formatCurrency(value) {
        const signal = Number(value) < 0 ? '-' : ''
        // REGEX - Tirando o sinal
        value = String(value).replace(/\-/g, '')
        value = Number(value)
        // Formatando como Moeda
        value = value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
        return signal + value
    },
    
    formatAmount(amount) {
        return amount
    },
    
    formatDate(date) {
        const splittedDate = date.split('-')
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    }
}

const Form = {
    description: document.getElementById('descriptionInput'),
    amount: document.getElementById('amountInput'),
    date: document.getElementById('dateInput'),

    getValues() {
        return {
            description: this.description.value,
            amount: this.amount.value,
            date: this.date.value,
        }
    },

    formatValues() {
        let {description, amount, date} = this.getValues()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)
        return {
            description,
            amount,
            date
        }
    },

    validateField() {
        const {description, amount, date} = this.getValues()
        return description && amount && date && true || false
    },

    clearFields() {
        Form.description.value = ''
        Form.amount.value = ''
        Form.date.value = ''
    },

    submit(event) {
        try {
            event.preventDefault()
            if (!Form.validateField()) throw new Error('Por favor, preencha todos os campos')
            const transaction = this.formatValues()
            Transactions.add(transaction)
            Form.clearFields()
            toggleModal()
        } catch (error) {
            alert(error.message)
        }
        
    }
}

const App = {
    init() {
        Transactions.all.forEach((transaction, index) => {
            DOM.addTransaction(transaction, index)
        })
        Storage.set(Transactions.all)
        DOM.updateBalance()
    },

    reload() {
        DOM.transactionsContainer.innerHTML = ''
        App.init()
    }
}

App.init()

newTransactionButton.addEventListener('click', (e) => {
    toggleModal()
})

filterButton.addEventListener('click', () => {
    const inputGroupFilter = document.querySelector('.filterManagement')
    const isFiltered = Array.from(filterButton.classList).some(filterClass => filterClass == 'filtered')
    if (isFiltered) {
        const initial = document.getElementById('initial')
        const final = document.getElementById('final')
        initial.value = ''
        final.value = ''
        App.reload()
    }
    inputGroupFilter.classList.toggle('show')
    filterButton.classList.toggle('filtered')
    filterButton.querySelector('.filterIcon').classList.toggle('filtered') 
    const filterManagement = document.querySelector('.filterManagement')
    setTimeout(() => {
        filterManagement.classList.toggle('none')
    },200)
    
})

form.addEventListener('submit', e => {
    Form.submit(e)
})
    
modalOverlay.addEventListener('click', () => {
    toggleModal()
})

cancelButton.addEventListener('click', () => {
    toggleModal()
})

document.getElementById('initial').addEventListener('change', e => {
    const initial = document.getElementById('initial')
    const final = document.getElementById('final')
    if(initial.value === '' && final.value === '') return 
    DOM.filterByDate(Utils.formatDate(initial.value), Utils.formatDate(final.value))
})

document.getElementById('final').addEventListener('change', e => {
    const initial = document.getElementById('initial')
    const final = document.getElementById('final')
    if(initial.value === '' && final.value === '') return 
    DOM.filterByDate(Utils.formatDate(initial.value), Utils.formatDate(final.value))
})

function toggleModal() {
    modalElement.classList.toggle('active')
    modalOverlay.classList.toggle('active')
}