const API_BASE_URL = 'http://127.0.0.1:8000';
let allProducts = []; 

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    toastBody.textContent = message;
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
    if (type === 'error') toastEl.classList.add('bg-danger');
    else if (type === 'warning') toastEl.classList.add('bg-warning');
    else toastEl.classList.add('bg-success');
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function setLoading(loading) {
    document.getElementById('loadingSpinner').classList.toggle('d-none', !loading);
}

async function fetchProducts() {
    try {
        
        allProducts = [
            { product_id: 1, product_name: 'Dell Inspiron 15', product_type_id: 1 },
            { product_id: 2, product_name: 'HP Pavilion 14', product_type_id: 1 },
            { product_id: 3, product_name: 'Samsung 24 inch Monitor', product_type_id: 2 },
            { product_id: 4, product_name: 'LG 27 inch Monitor', product_type_id: 2 }
        ];
        populateProductDropdown();
    } catch (error) {
        console.error('Failed to load products:', error);
        showToast('Could not load products', 'error');
    }
}


function populateProductDropdown() {
    const typeSelect = document.getElementById('productType');
    const productSelect = document.getElementById('product');
    const selectedType = typeSelect.value;

    productSelect.innerHTML = '<option value="">Select Product</option>';

    if (selectedType) {
        const filtered = allProducts.filter(p => p.product_type_id == selectedType);
        filtered.forEach(p => {
            const option = document.createElement('option');
            option.value = p.product_id;
            option.textContent = p.product_name;
            productSelect.appendChild(option);
        });
    }
}


async function fetchSales() {
    setLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/sales`);
        if (!response.ok) throw new Error('Failed to fetch sales');
        const sales = await response.json();
        renderSalesTable(sales);
        document.getElementById('noDataMessage').classList.toggle('d-none', sales.length > 0);
    } catch (error) {
        console.error('Error fetching sales:', error);
        showToast('Could not load sales', 'error');
    } finally {
        setLoading(false);
    }
}


function renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    if (sales.length === 0) return;

    sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.sale_id}</td>
            <td>${getProductName(sale.product_id)}</td>
            <td>${sale.quantity}</td>
            <td>₹${sale.amount.toLocaleString()}</td>
            <td>${new Date(sale.sale_date).toLocaleDateString('en-IN')}</td>
            <td>${sale.customer_name}</td>
            <td>${sale.remarks || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1" onclick="editSale(${sale.sale_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteSale(${sale.sale_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}


function getProductName(productId) {
    const product = allProducts.find(p => p.product_id == productId);
    return product ? product.product_name : `Product ${productId}`;
}


async function handleSaleSubmit(event) {
    event.preventDefault();

    const saleId = document.getElementById('saleId').value;
    const productId = document.getElementById('product').value;
    const quantity = document.getElementById('quantity').value;
    const saleDate = document.getElementById('saleDate').value;
    const customerName = document.getElementById('customerName').value;
    const remarks = document.getElementById('remarks').value;

    if (!productId || !quantity || !saleDate || !customerName) {
        showToast('Please fill all required fields', 'warning');
        return;
    }

    const saleData = {
        product_id: parseInt(productId),
        quantity: parseInt(quantity),
        sale_date: saleDate,
        customer_name: customerName,
        remarks: remarks || null
    };

    const url = saleId ? `${API_BASE_URL}/sales/${saleId}` : `${API_BASE_URL}/sales`;
    const method = saleId ? 'PUT' : 'POST';

    setLoading(true);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Request failed');
        }

        showToast(saleId ? 'Sale updated successfully' : 'Sale added successfully');
        resetForm();
        fetchSales(); 
    } catch (error) {
        console.error('Error saving sale:', error);
        showToast(error.message || 'Failed to save sale', 'error');
    } finally {
        setLoading(false);
    }
}


function resetForm() {
    document.getElementById('saleForm').reset();
    document.getElementById('saleId').value = '';
    document.getElementById('saleDate').valueAsDate = new Date();
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save me-2"></i>Add Sale';
    document.getElementById('cancelEditBtn').classList.add('d-none');
    populateProductDropdown(); 
}


function cancelEdit() {
    resetForm();
}


async function editSale(saleId) {
    setLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/sales/${saleId}`);
        if (!response.ok) throw new Error('Sale not found');
        const sale = await response.json();

        
        document.getElementById('saleId').value = sale.sale_id;
        document.getElementById('productType').value = allProducts.find(p => p.product_id == sale.product_id)?.product_type_id || '';
        populateProductDropdown();
        setTimeout(() => {
            document.getElementById('product').value = sale.product_id;
        }, 100);
        document.getElementById('quantity').value = sale.quantity;
        document.getElementById('saleDate').value = sale.sale_date;
        document.getElementById('customerName').value = sale.customer_name;
        document.getElementById('remarks').value = sale.remarks || '';

        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-sync me-2"></i>Update Sale';
        document.getElementById('cancelEditBtn').classList.remove('d-none');
        showToast('Sale loaded for editing', 'success');
    } catch (error) {
        console.error('Error loading sale for edit:', error);
        showToast('Could not load sale details', 'error');
    } finally {
        setLoading(false);
    }
}


async function deleteSale(saleId) {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    setLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/sales/${saleId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        showToast('Sale deleted successfully');
        fetchSales(); 
    } catch (error) {
        console.error('Error deleting sale:', error);
        showToast('Failed to delete sale', 'error');
    } finally {
        setLoading(false);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('saleDate').valueAsDate = new Date();

    
    fetchProducts();

    
    document.getElementById('productType').addEventListener('change', populateProductDropdown);
    document.getElementById('saleForm').addEventListener('submit', handleSaleSubmit);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

    
    fetchSales();
});