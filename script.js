// Danh mục các món hải sản
const MENU = [
    { id: 'muc_ong', name: 'Mực ống', category: 'Các loại Mực' },
    { id: 'muc_la', name: 'Mực lá', category: 'Các loại Mực' },
    { id: 'muc_xo', name: 'Mực xô', category: 'Các loại Mực' },
    { id: 'muc_gai', name: 'Mực gai', category: 'Các loại Mực' },
    { id: 'muc_tua_den', name: 'Mực tua đen', category: 'Các loại Mực' },
    { id: 'muc_tua_trang', name: 'Mực tua trắng', category: 'Các loại Mực' },
    { id: 'muc_nuc', name: 'Mực núc', category: 'Các loại Mực' },

    { id: 'tom', name: 'Tôm', category: 'Các loại Tôm' },
    { id: 'tom_su', name: 'Tôm sú', category: 'Các loại Tôm' },
    { id: 'tom_the', name: 'Tôm thẻ', category: 'Các loại Tôm' },
    { id: 'tom_xo', name: 'Tôm xô', category: 'Các loại Tôm' },

    { id: 'ca_xo', name: 'Cá xô', category: 'Các loại Cá' },
    { id: 'ca_heo', name: 'Cá heo', category: 'Các loại Cá' },
    { id: 'ca_bong', name: 'Cá bóng', category: 'Các loại Cá' },
    { id: 'ca_dai1', name: 'Cá dài', category: 'Các loại Cá' },
    { id: 'ca_dai2', name: 'Cá sùng sịnh', category: 'Các loại Cá' },
    { id: 'ca_an', name: 'Cá ăn', category: 'Các loại Cá' },

    { id: 'dam', name: 'Ghẹ dăm', category: 'Khác' },
    { id: 'xa_ban', name: 'Xà bần', category: 'Khác' },
    { id: 'ghe', name: 'Ghẹ', category: 'Khác' },
    { id: 'oc_huong', name: 'Ốc hương', category: 'Khác' },
    { id: 'oc_da', name: 'Ốc đá', category: 'Khác' },
    { id: 'oc_trang', name: 'Ốc trắng', category: 'Khác' },
    { id: 'cua_bien', name: 'Cua', category: 'Khác' },
];

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('calc-form');
    const orderDateInput = document.getElementById('orderDate');
    const customerNameInput = document.getElementById('customerName');
    const itemNameInput = document.getElementById('itemName');
    const customItemNameContainer = document.getElementById('customItemNameContainer');
    const customItemNameInput = document.getElementById('customItemName');
    const weightInput = document.getElementById('weight');
    const priceInput = document.getElementById('price');
    const previewAmount = document.getElementById('preview-amount');
    const itemList = document.getElementById('item-list');
    const grandTotalAmount = document.getElementById('grand-total-amount');
    const clearAllBtn = document.getElementById('clear-all');

    const btnSaveInvoice = document.getElementById('btn-save-invoice');
    const invoiceList = document.getElementById('invoice-list');

    const btnReport = document.getElementById('btn-report');
    const btnCloseReport = document.getElementById('btn-close-report');
    const btnCopy = document.getElementById('btn-copy');
    const reportContainer = document.getElementById('report-container');
    const reportText = document.getElementById('report-text');

    // Tabs logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Populate select options
    const populateSelect = () => {
        // Group menu items by category
        const categories = {};
        MENU.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        // Generate optgroups and options
        for (const [category, items] of Object.entries(categories)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;

            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                optgroup.appendChild(option);
            });

            itemNameInput.appendChild(optgroup);
        }

        // Option "Món khác"
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Món khác...';
        itemNameInput.appendChild(otherOption);
    };
    populateSelect();

    // Handle "Món khác" select change
    itemNameInput.addEventListener('change', (e) => {
        if (e.target.value === 'other') {
            customItemNameContainer.style.display = 'block';
            customItemNameInput.required = true;
            customItemNameInput.focus();
        } else {
            customItemNameContainer.style.display = 'none';
            customItemNameInput.required = false;
        }
    });


    // Formatter for currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
    };

    // Parsers
    const parseWeight = (valStr) => {
        let str = valStr.trim();
        if (str.startsWith('0') && !str.includes('.') && str.length > 1) {
            str = '0.' + str.substring(1);
        }
        return parseFloat(str) || 0;
    };

    const parsePrice = (valStr) => {
        let num = parseFloat(valStr) || 0;
        return num * 1000;
    };

    // Update preview
    const updatePreview = () => {
        const weight = parseWeight(weightInput.value);
        const price = parsePrice(priceInput.value);
        const total = weight * price;
        previewAmount.textContent = formatCurrency(total);
    };

    // Listen to input changes for preview
    weightInput.addEventListener('input', updatePreview);
    priceInput.addEventListener('input', updatePreview);

    // State
    let items = JSON.parse(localStorage.getItem('tinhbong_items')) || [];
    let invoices = JSON.parse(localStorage.getItem('tinhbong_invoices')) || [];

    // Save to localStorage
    const saveItems = () => {
        localStorage.setItem('tinhbong_items', JSON.stringify(items));
    };

    const saveInvoices = () => {
        localStorage.setItem('tinhbong_invoices', JSON.stringify(invoices));
    };

    // Initialize date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    orderDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Helper to format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    const formatShortDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
        return dateStr;
    };

    // Render list
    const renderList = () => {
        itemList.innerHTML = '';

        if (items.length === 0) {
            itemList.innerHTML = '<div class="empty-state">Chưa có món hàng nào</div>';
            grandTotalAmount.textContent = '0 ₫';
            return;
        }

        let grandTotal = 0;
        const groups = {};

        // Group items
        items.forEach((item, index) => {
            const key = `${item.date}_${item.customer}`;
            if (!groups[key]) {
                groups[key] = {
                    date: item.date,
                    customer: item.customer,
                    itemList: []
                };
            }
            groups[key].itemList.push({ ...item, originalIndex: index });
        });

        // Render groups
        for (const key in groups) {
            const group = groups[key];

            // Group header
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.innerHTML = `Ngày ${formatDate(group.date)} - Ghe ${group.customer}`;
            itemList.appendChild(groupHeader);

            // Items in group
            group.itemList.forEach(item => {
                const itemTotal = item.weight * item.price;
                grandTotal += itemTotal;

                const li = document.createElement('li');
                li.className = 'list-item';

                li.innerHTML = `
                    <div class="item-single-line">
                        <span class="sl-name">${item.name}</span>
                        <span class="sl-calc">${item.weight}kg × ${formatCurrency(item.price)}</span>
                        <span class="sl-equal">=</span>
                        <span class="sl-total">${formatCurrency(itemTotal)} ₫</span>
                    </div>
                    <button class="btn-delete" data-index="${item.originalIndex}">×</button>
                `;
                itemList.appendChild(li);
            });
        }

        grandTotalAmount.textContent = formatCurrency(grandTotal) + ' ₫';
    };

    // Handle form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const weight = parseWeight(weightInput.value);
        const price = parsePrice(priceInput.value);

        if (!weight || !price) return;

        const dateVal = orderDateInput.value;
        const customerVal = customerNameInput.value.trim();
        let nameVal = itemNameInput.value;

        if (nameVal === 'other') {
            nameVal = customItemNameInput.value.trim();
        }

        // Check for existing item with same date, customer, name and price
        const existingItem = items.find(i =>
            i.date === dateVal &&
            i.customer === customerVal &&
            i.name === nameVal &&
            i.price === price
        );

        if (existingItem) {
            existingItem.weight += weight;
        } else {
            const newItem = {
                id: Date.now(),
                date: dateVal,
                customer: customerVal,
                name: nameVal,
                weight: weight,
                price: price
            };
            items.push(newItem);
        }
        saveItems();
        renderList();

        // Reset form
        itemNameInput.value = '';
        customItemNameInput.value = '';
        customItemNameContainer.style.display = 'none';
        customItemNameInput.required = false;
        weightInput.value = '';
        priceInput.value = '';
        updatePreview();
        itemNameInput.focus();
    });

    // Handle delete item
    itemList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const index = e.target.getAttribute('data-index');
            items.splice(index, 1);
            saveItems();
            renderList();
        }
    });

    // Handle clear all
    clearAllBtn.addEventListener('click', () => {
        if (items.length > 0 && confirm('Bạn có chắc chắn muốn xóa tất cả danh sách không?')) {
            items = [];
            saveItems();
            renderList();
        }
    });

    // Generate Report Helper
    const generateReportText = (itemList) => {
        let reportStr = '';
        let total = 0;
        const groups = {};

        itemList.forEach((item) => {
            const key = `${item.date}_${item.customer}`;
            if (!groups[key]) {
                groups[key] = {
                    date: item.date,
                    customer: item.customer,
                    list: []
                };
            }
            groups[key].list.push(item);
        });

        for (const key in groups) {
            const group = groups[key];
            reportStr += `${formatShortDate(group.date)} ${group.customer}\n`;

            group.list.forEach(item => {
                const itemTotal = item.weight * item.price;
                total += itemTotal;

                const priceShort = item.price / 1000;
                const totalShort = formatCurrency(itemTotal / 1000);

                reportStr += `    - ${item.name}: ${item.weight} x ${priceShort} = ${totalShort}\n`;
            });
        }

        reportStr += `----------------------\n`;
        reportStr += `Tổng cộng: ${formatCurrency(total / 1000)}`;
        return reportStr;
    };

    // Render Invoices
    const renderInvoices = () => {
        invoiceList.innerHTML = '';
        if (invoices.length === 0) {
            invoiceList.innerHTML = '<div class="empty-state">Chưa có hóa đơn nào</div>';
            return;
        }

        invoices.forEach((inv, index) => {
            const reportStr = generateReportText(inv.items);
            const details = document.createElement('details');
            details.className = 'invoice-item';

            details.innerHTML = `
                <summary>
                    <div class="item-info">
                        <div class="item-name">${inv.name}</div>
                        <div class="item-details" style="color:var(--text-muted); font-size:13px; font-weight:normal;">${inv.dateStr} - Tổng: <strong style="color:var(--primary-color);">${formatCurrency(inv.total)} ₫</strong></div>
                    </div>
                </summary>
                <div class="invoice-body">
                    <textarea id="history-text-${index}" readonly>${reportStr}</textarea>
                    <button class="btn-primary btn-copy-history" data-index="${index}">Copy báo cáo</button>
                </div>
            `;
            invoiceList.appendChild(details);
        });
    };

    // Handle History Copy
    invoiceList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-copy-history')) {
            const index = e.target.getAttribute('data-index');
            const textarea = document.getElementById(`history-text-${index}`);
            textarea.select();
            document.execCommand('copy');
            alert('Đã copy báo cáo!');
        }
    });

    // Save Invoice
    btnSaveInvoice.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Chưa có dữ liệu để lưu!');
            return;
        }

        const invName = prompt('Nhập tên hóa đơn:', 'Hóa đơn ghe');
        if (!invName) return;

        // Calculate total
        const invTotal = items.reduce((acc, item) => acc + (item.weight * item.price), 0);

        const newInvoice = {
            id: Date.now(),
            name: invName,
            dateStr: new Date().toLocaleString('vi-VN'),
            items: [...items],
            total: invTotal
        };

        invoices.unshift(newInvoice);
        if (invoices.length > 20) {
            invoices = invoices.slice(0, 20);
        }

        saveInvoices();
        renderInvoices();

        // Clear current list
        items = [];
        saveItems();
        renderList();
        alert('Đã lưu hóa đơn thành công!');
    });

    // Report generation
    btnReport.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Chưa có dữ liệu để tạo báo cáo!');
            return;
        }

        reportText.value = generateReportText(items);
        reportContainer.style.display = 'block';

        // Scroll to bottom
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });

    btnCloseReport.addEventListener('click', () => {
        reportContainer.style.display = 'none';
    });

    btnCopy.addEventListener('click', () => {
        reportText.select();
        document.execCommand('copy');
        alert('Đã copy báo cáo!');
    });

    // Initial render
    renderList();
    renderInvoices();
});
