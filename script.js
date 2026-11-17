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

const MAX_INVOICES = 100;

// Helpers cho tính toán và chuẩn hóa dữ liệu
const roundNumber = (num, decimals = 3) => {
    const factor = 10 ** decimals;
    return Math.round((num + Number.EPSILON) * factor) / factor;
};

const normalizeText = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ');
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
};

const formatShortCurrency = (amountInThousands) => {
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }).format(roundNumber(amountInThousands, 3));
};

const parseWeight = (valStr) => {
    if (typeof valStr !== 'string') return 0;
    let str = valStr.trim().replace(/,/g, '.');
    if (!/^\d+(\.\d+)?$/.test(str)) return 0;
    if (str.startsWith('0') && !str.includes('.') && str.length > 1) {
        str = '0.' + str.substring(1);
    }
    const num = parseFloat(str);
    return Number.isFinite(num) && num > 0 ? roundNumber(num, 3) : 0;
};

const parsePrice = (valStr) => {
    if (typeof valStr !== 'string') return 0;
    const str = valStr.trim().replace(/,/g, '.');
    if (!/^\d+(\.\d+)?$/.test(str)) return 0;
    const num = parseFloat(str);
    return Number.isFinite(num) && num > 0 ? Math.round(num * 1000) : 0;
};

const loadStorage = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

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
    const submitBtn = document.getElementById('btn-submit');
    const itemList = document.getElementById('item-list');
    const grandTotalAmount = document.getElementById('grand-total-amount');
    const clearAllBtn = document.getElementById('clear-all');

    const btnSaveInvoice = document.getElementById('btn-save-invoice');
    const invoiceList = document.getElementById('invoice-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    const btnReport = document.getElementById('btn-report');
    const btnCloseReport = document.getElementById('btn-close-report');
    const btnCopy = document.getElementById('btn-copy');
    const reportContainer = document.getElementById('report-container');
    const reportText = document.getElementById('report-text');

    // State
    let items = loadStorage('tinhbong_items', []);
    let invoices = loadStorage('tinhbong_invoices', []);
    let editingIndex = null;

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
        const categories = {};
        MENU.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        for (const [category, menuItems] of Object.entries(categories)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;

            menuItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                optgroup.appendChild(option);
            });

            itemNameInput.appendChild(optgroup);
        }

        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Món khác...';
        itemNameInput.appendChild(otherOption);
    };
    populateSelect();

    // Handle "Món khác" select change
    itemNameInput.addEventListener('change', (e) => {
        itemNameInput.setCustomValidity('');
        if (e.target.value === 'other') {
            customItemNameContainer.style.display = 'block';
            customItemNameInput.required = true;
            customItemNameInput.focus();
        } else {
            customItemNameContainer.style.display = 'none';
            customItemNameInput.required = false;
            customItemNameInput.setCustomValidity('');
        }
    });

    // Update preview
    const updatePreview = () => {
        const weight = parseWeight(weightInput.value);
        const price = parsePrice(priceInput.value);
        const total = weight * price;
        previewAmount.textContent = formatCurrency(total);
    };

    // Clear custom validity on input
    customerNameInput.addEventListener('input', () => {
        customerNameInput.setCustomValidity('');
    });
    customItemNameInput.addEventListener('input', () => {
        customItemNameInput.setCustomValidity('');
    });
    weightInput.addEventListener('input', () => {
        weightInput.setCustomValidity('');
        updatePreview();
    });
    priceInput.addEventListener('input', () => {
        priceInput.setCustomValidity('');
        updatePreview();
    });

    // Validate fields on blur (after interaction)
    customerNameInput.addEventListener('blur', () => {
        if (customerNameInput.value && !normalizeText(customerNameInput.value)) {
            customerNameInput.setCustomValidity('Vui lòng nhập tên ghe hợp lệ.');
        }
    });
    customItemNameInput.addEventListener('blur', () => {
        if (itemNameInput.value === 'other' && customItemNameInput.value && !normalizeText(customItemNameInput.value)) {
            customItemNameInput.setCustomValidity('Vui lòng nhập tên món hàng hợp lệ.');
        }
    });
    weightInput.addEventListener('blur', () => {
        if (weightInput.value && parseWeight(weightInput.value) <= 0) {
            weightInput.setCustomValidity('Số cân phải là số lớn hơn 0 (ví dụ: 2.5 hoặc 05).');
        }
    });
    priceInput.addEventListener('blur', () => {
        if (priceInput.value && parsePrice(priceInput.value) <= 0) {
            priceInput.setCustomValidity('Giá phải là số lớn hơn 0.');
        }
    });

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
        if (parts.length === 3) return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
        return dateStr;
    };

    // Generate Report Helper
    const generateReportText = (listData) => {
        let reportStr = '';
        let total = 0;
        const groups = {};

        listData.forEach((item) => {
            const key = `${item.date}::${normalizeText(item.customer).toLowerCase()}`;
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
                const itemTotal = roundNumber(item.weight * item.price, 0);
                total += itemTotal;

                const priceShort = formatShortCurrency(item.price / 1000);
                const totalShort = formatShortCurrency(itemTotal / 1000);

                reportStr += `    - ${item.name}: ${item.weight} x ${priceShort} = ${totalShort}\n`;
            });
        }

        reportStr += `----------------------\n`;
        reportStr += `Tổng cộng: ${formatShortCurrency(total / 1000)}`;
        return reportStr;
    };

    const syncReportView = () => {
        if (reportContainer.style.display !== 'none') {
            if (items.length === 0) {
                reportContainer.style.display = 'none';
                reportText.value = '';
            } else {
                reportText.value = generateReportText(items);
            }
        }
    };

    const resetEditMode = () => {
        editingIndex = null;
        if (submitBtn) {
            submitBtn.textContent = 'Thêm vào đơn hàng';
        }
    };

    // Render list safely without innerHTML XSS sinks
    const renderList = () => {
        itemList.replaceChildren();

        if (items.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.textContent = 'Chưa có món hàng nào';
            itemList.appendChild(emptyDiv);
            grandTotalAmount.textContent = '0 ₫';
            syncReportView();
            return;
        }

        let grandTotal = 0;
        const groups = {};

        items.forEach((item, index) => {
            const key = `${item.date}::${normalizeText(item.customer).toLowerCase()}`;
            if (!groups[key]) {
                groups[key] = {
                    date: item.date,
                    customer: item.customer,
                    subtotal: 0,
                    itemList: []
                };
            }
            const itemTotal = roundNumber(item.weight * item.price, 0);
            groups[key].subtotal += itemTotal;
            groups[key].itemList.push({ ...item, itemTotal, originalIndex: index });
        });

        const fragment = document.createDocumentFragment();

        for (const key in groups) {
            const group = groups[key];

            // Group header with subtotal
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';

            const groupTitle = document.createElement('span');
            groupTitle.textContent = `Ngày ${formatDate(group.date)} - Ghe ${group.customer}`;

            const groupSubtotal = document.createElement('span');
            groupSubtotal.className = 'group-subtotal';
            groupSubtotal.textContent = `${formatCurrency(group.subtotal)} ₫`;

            groupHeader.append(groupTitle, groupSubtotal);
            fragment.appendChild(groupHeader);

            // Items in group
            group.itemList.forEach(item => {
                grandTotal += item.itemTotal;

                const li = document.createElement('li');
                li.className = 'list-item';

                const singleLine = document.createElement('div');
                singleLine.className = 'item-single-line';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'sl-name';
                nameSpan.textContent = item.name;

                const calcSpan = document.createElement('span');
                calcSpan.className = 'sl-calc';
                calcSpan.textContent = `${item.weight}kg × ${formatCurrency(item.price)}`;

                const equalSpan = document.createElement('span');
                equalSpan.className = 'sl-equal';
                equalSpan.textContent = '=';

                const totalSpan = document.createElement('span');
                totalSpan.className = 'sl-total';
                totalSpan.textContent = `${formatCurrency(item.itemTotal)} ₫`;

                singleLine.append(nameSpan, calcSpan, equalSpan, totalSpan);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'btn-edit';
                editBtn.dataset.index = String(item.originalIndex);
                editBtn.title = 'Sửa món này';
                editBtn.textContent = '✎';

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'btn-delete';
                deleteBtn.dataset.index = String(item.originalIndex);
                deleteBtn.title = 'Xóa món này';
                deleteBtn.textContent = '×';

                actionsDiv.append(editBtn, deleteBtn);
                li.append(singleLine, actionsDiv);
                fragment.appendChild(li);
            });
        }

        itemList.appendChild(fragment);
        grandTotalAmount.textContent = `${formatCurrency(grandTotal)} ₫`;
        syncReportView();
    };

    // Handle form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const dateVal = orderDateInput.value;
        const customerVal = normalizeText(customerNameInput.value);
        let nameVal = itemNameInput.value;
        if (nameVal === 'other') {
            nameVal = normalizeText(customItemNameInput.value);
        }

        const weight = parseWeight(weightInput.value);
        const price = parsePrice(priceInput.value);

        // Validate inputs and move focus to the first invalid field
        if (!customerVal) {
            customerNameInput.setCustomValidity('Vui lòng nhập tên ghe hợp lệ.');
            customerNameInput.reportValidity();
            customerNameInput.focus();
            return;
        }
        if (!nameVal) {
            const targetInput = itemNameInput.value === 'other' ? customItemNameInput : itemNameInput;
            targetInput.setCustomValidity('Vui lòng chọn hoặc nhập tên món hàng.');
            targetInput.reportValidity();
            targetInput.focus();
            return;
        }
        if (weight <= 0) {
            weightInput.setCustomValidity('Số cân phải là số lớn hơn 0 (ví dụ: 2.5 hoặc 05).');
            weightInput.reportValidity();
            weightInput.focus();
            return;
        }
        if (price <= 0) {
            priceInput.setCustomValidity('Giá phải là số lớn hơn 0.');
            priceInput.reportValidity();
            priceInput.focus();
            return;
        }

        customerNameInput.value = customerVal;

        if (editingIndex !== null && editingIndex >= 0 && editingIndex < items.length) {
            // Check if updated item matches another item in the list
            const duplicateIndex = items.findIndex((i, idx) =>
                idx !== editingIndex &&
                i.date === dateVal &&
                normalizeText(i.customer).toLowerCase() === customerVal.toLowerCase() &&
                normalizeText(i.name).toLowerCase() === nameVal.toLowerCase() &&
                i.price === price
            );

            if (duplicateIndex !== -1) {
                items[duplicateIndex].weight = roundNumber(items[duplicateIndex].weight + weight, 3);
                items.splice(editingIndex, 1);
            } else {
                items[editingIndex] = {
                    ...items[editingIndex],
                    date: dateVal,
                    customer: customerVal,
                    name: nameVal,
                    weight: weight,
                    price: price
                };
            }
            resetEditMode();
        } else {
            // Check for existing item with same date, customer, name and price
            const existingItem = items.find(i =>
                i.date === dateVal &&
                normalizeText(i.customer).toLowerCase() === customerVal.toLowerCase() &&
                normalizeText(i.name).toLowerCase() === nameVal.toLowerCase() &&
                i.price === price
            );

            if (existingItem) {
                existingItem.weight = roundNumber(existingItem.weight + weight, 3);
            } else {
                items.push({
                    id: Date.now(),
                    date: dateVal,
                    customer: customerVal,
                    name: nameVal,
                    weight: weight,
                    price: price
                });
            }
        }

        saveItems();
        renderList();

        // Reset item fields while preserving Date & Customer for fast batch entry
        itemNameInput.value = '';
        customItemNameInput.value = '';
        customItemNameContainer.style.display = 'none';
        customItemNameInput.required = false;
        weightInput.value = '';
        priceInput.value = '';
        updatePreview();
        itemNameInput.focus();
    });

    // Handle edit & delete item in list
    itemList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete')) {
            const index = Number(target.dataset.index);
            if (!Number.isNaN(index) && index >= 0 && index < items.length) {
                items.splice(index, 1);
                if (editingIndex === index) {
                    resetEditMode();
                } else if (editingIndex !== null && index < editingIndex) {
                    editingIndex -= 1;
                }
                saveItems();
                renderList();
            }
        } else if (target.classList.contains('btn-edit')) {
            const index = Number(target.dataset.index);
            if (!Number.isNaN(index) && index >= 0 && index < items.length) {
                const item = items[index];
                editingIndex = index;
                orderDateInput.value = item.date;
                customerNameInput.value = item.customer;

                const isMenuOption = MENU.some(m => m.name === item.name);
                if (isMenuOption) {
                    itemNameInput.value = item.name;
                    customItemNameContainer.style.display = 'none';
                    customItemNameInput.required = false;
                    customItemNameInput.value = '';
                } else {
                    itemNameInput.value = 'other';
                    customItemNameContainer.style.display = 'block';
                    customItemNameInput.required = true;
                    customItemNameInput.value = item.name;
                }

                weightInput.value = String(item.weight);
                priceInput.value = String(roundNumber(item.price / 1000, 3));
                updatePreview();

                if (submitBtn) {
                    submitBtn.textContent = 'Cập nhật món hàng';
                }
                weightInput.focus();
            }
        }
    });

    // Handle clear all items
    clearAllBtn.addEventListener('click', () => {
        if (items.length > 0 && confirm('Bạn có chắc chắn muốn xóa tất cả danh sách không?')) {
            items = [];
            resetEditMode();
            saveItems();
            renderList();
        }
    });

    // Modern Clipboard helper with fallback
    const copyToClipboard = async (text, fallbackTextarea) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                alert('Đã copy báo cáo!');
                return;
            }
        } catch {
            // Fall through to legacy selection copy
        }
        if (fallbackTextarea) {
            fallbackTextarea.select();
            document.execCommand('copy');
            alert('Đã copy báo cáo!');
        }
    };

    // Render Invoices safely without innerHTML XSS sinks
    const renderInvoices = () => {
        invoiceList.replaceChildren();
        if (invoices.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.textContent = 'Chưa có hóa đơn nào';
            invoiceList.appendChild(emptyDiv);
            return;
        }

        const fragment = document.createDocumentFragment();

        invoices.forEach((inv, index) => {
            const reportStr = generateReportText(inv.items || []);
            const details = document.createElement('details');
            details.className = 'invoice-item';

            const summary = document.createElement('summary');
            const infoDiv = document.createElement('div');
            infoDiv.className = 'item-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'item-name';
            nameDiv.textContent = inv.name;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'item-details';
            detailsDiv.style.color = 'var(--text-muted)';
            detailsDiv.style.fontSize = '13px';
            detailsDiv.style.fontWeight = 'normal';
            detailsDiv.append(`${inv.dateStr} - Tổng: `);

            const totalStrong = document.createElement('strong');
            totalStrong.style.color = 'var(--primary-color)';
            totalStrong.textContent = `${formatCurrency(inv.total)} ₫`;
            detailsDiv.appendChild(totalStrong);

            infoDiv.append(nameDiv, detailsDiv);
            summary.appendChild(infoDiv);

            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'invoice-body';

            const textarea = document.createElement('textarea');
            textarea.id = `history-text-${index}`;
            textarea.readOnly = true;
            textarea.value = reportStr;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'invoice-actions';

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'btn-primary btn-copy-history';
            copyBtn.dataset.index = String(index);
            copyBtn.textContent = 'Copy báo cáo';

            const deleteInvBtn = document.createElement('button');
            deleteInvBtn.type = 'button';
            deleteInvBtn.className = 'btn-danger-outline btn-delete-invoice';
            deleteInvBtn.dataset.index = String(index);
            deleteInvBtn.textContent = 'Xóa';

            actionsDiv.append(copyBtn, deleteInvBtn);
            bodyDiv.append(textarea, actionsDiv);
            details.append(summary, bodyDiv);
            fragment.appendChild(details);
        });

        invoiceList.appendChild(fragment);
    };

    // Handle History Copy & Delete
    invoiceList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-copy-history')) {
            const index = Number(target.dataset.index);
            const textarea = document.getElementById(`history-text-${index}`);
            if (textarea) {
                copyToClipboard(textarea.value, textarea);
            }
        } else if (target.classList.contains('btn-delete-invoice')) {
            const index = Number(target.dataset.index);
            if (!Number.isNaN(index) && index >= 0 && index < invoices.length) {
                if (confirm(`Bạn có chắc muốn xóa hóa đơn "${invoices[index].name}" không?`)) {
                    invoices.splice(index, 1);
                    saveInvoices();
                    renderInvoices();
                }
            }
        }
    });

    // Handle Clear All History
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (invoices.length > 0 && confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hóa đơn không?')) {
                invoices = [];
                saveInvoices();
                renderInvoices();
            }
        });
    }

    // Save Invoice
    btnSaveInvoice.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Chưa có dữ liệu để lưu!');
            return;
        }

        const rawInvName = prompt('Nhập tên hóa đơn:', 'Hóa đơn ghe');
        if (rawInvName === null) return;

        const invName = normalizeText(rawInvName);
        if (!invName) {
            alert('Tên hóa đơn không được để trống!');
            return;
        }

        const invTotal = items.reduce((acc, item) => acc + roundNumber(item.weight * item.price, 0), 0);

        const newInvoice = {
            id: Date.now(),
            name: invName,
            dateStr: new Date().toLocaleString('vi-VN'),
            items: structuredClone(items),
            total: invTotal
        };

        invoices.unshift(newInvoice);
        if (invoices.length > MAX_INVOICES) {
            invoices = invoices.slice(0, MAX_INVOICES);
        }

        saveInvoices();
        renderInvoices();

        items = [];
        resetEditMode();
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

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });

    btnCloseReport.addEventListener('click', () => {
        reportContainer.style.display = 'none';
    });

    btnCopy.addEventListener('click', () => {
        copyToClipboard(reportText.value, reportText);
    });

    // Initial render
    renderList();
    renderInvoices();
});
