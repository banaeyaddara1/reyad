// ===================== إعداد Firebase =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHruhzjavgVxQuL2kFPqJ4Es1HXPG8pqM",
    authDomain: "reyad-dd42a.firebaseapp.com",
    databaseURL: "https://reyad-dd42a-default-rtdb.firebaseio.com",
    projectId: "reyad-dd42a",
    storageBucket: "reyad-dd42a.firebasestorage.app",
    messagingSenderId: "144646094473",
    appId: "1:144646094473:web:edc911f459d3f70acd5058"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("✅ Firebase متصل بنجاح");

// ===================== المتغيرات العامة =====================
let allPatients = [];
let patientNamesList = [];
let currentHistoryData = [];
let currentFinanceData = [];
let medicineCounter = 1;

// ===================== تحديث قائمة المرضى من Firebase =====================
function loadPatientsList() {
    const patientsRef = ref(db, 'patients');
    onValue(patientsRef, (snapshot) => {
        allPatients = [];
        patientNamesList = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                const p = { id: key, ...data[key] };
                allPatients.push(p);
                patientNamesList.push({
                    label: `${p.name} ${p.phone ? `📞 ${p.phone}` : ''}`,
                    value: p.name,
                    id: p.id,
                    phone: p.phone,
                    address: p.address
                });
            });
        }
        displayPatientsList();
        updateAutocomplete();
    });
}

// ===================== عرض قائمة المرضى =====================
function displayPatientsList(searchTerm = '') {
    let filteredPatients = allPatients;
    if (searchTerm) {
        filteredPatients = allPatients.filter(p => 
            p.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    let html = '<table class="table table-bordered table-hover"><thead class="table-light"><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>العنوان</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr></thead><tbody>';
    
    let index = 1;
    if (filteredPatients.length > 0) {
        filteredPatients.forEach(p => {
            html += `<tr>
                <td>${index++}</td>
                <td><strong>${p.name || '-'}</strong></td>
                <td>${p.phone || '-'}</td>
                <td>${p.address || '-'}</td>
                <td>${p.createdAt || '-'}</td>
                <td><button class="btn btn-sm btn-danger" onclick="window.deletePatient('${p.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
    } else {
        html += '<tr><td colspan="6" class="text-center">لا يوجد مرضى مسجلين</td></tr>';
    }
    html += '</tbody></table>';
    document.getElementById('patientsList').innerHTML = html;
}

// ===================== فلترة المرضى =====================
window.filterPatients = function() {
    displayPatientsList(document.getElementById('searchPatient').value);
};

// ===================== تحديث الـ Autocomplete =====================
function updateAutocomplete() {
    // حقل إدخال الزيارة
    if (document.getElementById('patientSearchInput')) {
        $("#patientSearchInput").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('patientSearchInput').value = ui.item.value;
                document.getElementById('selectedPatientId').value = ui.item.id;
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function(ul, item) {
            return $("<li>")
                .append(`<div class="patient-result"><span class="patient-name">${item.value}</span><span class="patient-phone">${item.phone ? item.phone : ''}</span></div>`)
                .appendTo(ul);
        };
    }
    
    // حقل التاريخ الطبي
    if (document.getElementById('historySearchInput')) {
        $("#historySearchInput").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('historySearchInput').value = ui.item.value;
                document.getElementById('historySelectedPatientId').value = ui.item.id;
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function(ul, item) {
            return $("<li>")
                .append(`<div class="patient-result"><span class="patient-name">${item.value}</span><span class="patient-phone">${item.phone ? item.phone : ''}</span></div>`)
                .appendTo(ul);
        };
    }
    
    // حقل التقارير المالية
    if (document.getElementById('financePatientSearch')) {
        $("#financePatientSearch").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('financePatientSearch').value = ui.item.value;
                document.getElementById('financeSelectedPatientId').value = ui.item.id;
                getFinancialReportAutocomplete();
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function(ul, item) {
            return $("<li>")
                .append(`<div class="patient-result"><span class="patient-name">${item.value}</span><span class="patient-phone">${item.phone ? item.phone : ''}</span></div>`)
                .appendTo(ul);
        };
    }
}

// ===================== إضافة مريض جديد =====================
window.addPatient = async function() {
    const name = document.getElementById('patientName').value.trim();
    if (!name) {
        alert('⚠️ الرجاء إدخال اسم المريض');
        return;
    }
    
    const newPatientRef = push(ref(db, 'patients'));
    const patientData = {
        name: name,
        phone: document.getElementById('patientPhone').value.trim(),
        address: document.getElementById('patientAddress').value.trim(),
        createdAt: new Date().toLocaleDateString('ar-EG')
    };
    
    try {
        await set(newPatientRef, patientData);
        document.getElementById('patientName').value = '';
        document.getElementById('patientPhone').value = '';
        document.getElementById('patientAddress').value = '';
        alert('✅ تم إضافة المريض بنجاح!');
    } catch (error) {
        console.error("خطأ:", error);
        alert('❌ فشل في إضافة المريض: ' + error.message);
    }
};

// ===================== حذف مريض =====================
window.deletePatient = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا المريض؟ سيتم حذف جميع زياراته أيضاً!')) {
        try {
            await remove(ref(db, `patients/${id}`));
            const visitsRef = ref(db, 'visits');
            const snapshot = await get(visitsRef);
            const visits = snapshot.val();
            if (visits) {
                for (const visitId of Object.keys(visits)) {
                    if (visits[visitId].patientId === id) {
                        await remove(ref(db, `visits/${visitId}`));
                    }
                }
            }
            alert('🗑️ تم حذف المريض وجميع زياراته');
        } catch (error) {
            console.error("خطأ:", error);
            alert('❌ فشل في الحذف');
        }
    }
};

// ===================== دالة جمع الأدوية =====================
window.getMedicinesString = function() {
    let medicines = [];
    for (let i = 0; i <= medicineCounter; i++) {
        const nameInput = document.getElementById(`medName${i}`);
        const qtyInput = document.getElementById(`medQty${i}`);
        if (nameInput && nameInput.value.trim()) {
            const qty = qtyInput ? qtyInput.value : 1;
            medicines.push(`${nameInput.value.trim()} (${qty})`);
        }
    }
    return medicines.join('، ');
};

// ===================== إضافة زيارة جديدة =====================
window.addVisitWithAutocomplete = async function() {
    const patientId = document.getElementById('selectedPatientId').value;
    if (!patientId) {
        alert('⚠️ الرجاء اختيار مريض من القائمة المنسدلة');
        return;
    }
    
    const selectedPatient = allPatients.find(p => p.id === patientId);
    const now = new Date();
    
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paidAmount').value) || 0;
    const remainingAmount = totalAmount - paidAmount;
    const medicines = window.getMedicinesString();
    
    const newVisitRef = push(ref(db, 'visits'));
    const visitData = {
        patientId: patientId,
        patientName: selectedPatient?.name || 'غير معروف',
        diagnosis: document.getElementById('diagnosis').value.trim(),
        medicines: medicines,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount >= 0 ? remainingAmount : 0,
        date: now.toLocaleDateString('ar-EG'),
        time: now.toLocaleTimeString('ar-EG'),
        timestamp: now.getTime()
    };
    
    try {
        await set(newVisitRef, visitData);
        // تفريغ جميع الحقول
        document.getElementById('patientSearchInput').value = '';
        document.getElementById('selectedPatientId').value = '';
        document.getElementById('diagnosis').value = '';
        document.getElementById('totalAmount').value = '';
        document.getElementById('paidAmount').value = '';
        document.getElementById('remainingAmount').value = '';
        
        // إعادة تعيين حقل الأدوية
        const medicinesContainer = document.getElementById('medicinesList');
        if (medicinesContainer) {
            medicinesContainer.innerHTML = `<div class="medicine-row">
                <input type="text" class="form-control" placeholder="اسم الدواء" id="medName0">
                <input type="number" class="form-control" placeholder="العدد" id="medQty0" value="1" min="1" style="width: 100px;">
            </div>`;
        }
        medicineCounter = 1;
        
        alert('✅ تم تسجيل الزيارة بنجاح!');
    } catch (error) {
        console.error("خطأ:", error);
        alert('❌ فشل في تسجيل الزيارة');
    }
};

// ===================== إضافة صف دواء جديد =====================
window.addMedicineRow = function() {
    const container = document.getElementById('medicinesList');
    const newRow = document.createElement('div');
    newRow.className = 'medicine-row';
    newRow.style.display = 'flex';
    newRow.style.gap = '10px';
    newRow.style.marginBottom = '10px';
    newRow.innerHTML = `
        <input type="text" class="form-control" placeholder="اسم الدواء" id="medName${medicineCounter}" style="flex: 2;">
        <input type="number" class="form-control" placeholder="العدد" id="medQty${medicineCounter}" value="1" min="1" style="flex: 0.5;">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(newRow);
    medicineCounter++;
};

// ===================== البحث في التاريخ الطبي =====================
window.searchMedicalHistoryAutocomplete = async () => {
    const patientId = document.getElementById('historySelectedPatientId').value;
    if (!patientId) {
        alert('⚠️ الرجاء اختيار مريض من القائمة');
        return;
    }
    
    const visitsRef = ref(db, 'visits');
    const snapshot = await get(visitsRef);
    const visits = snapshot.val();
    
    let html = '<div class="accordion" id="historyAccordion">';
    let found = false;
    currentHistoryData = [];
    
    if (visits) {
        for (const key of Object.keys(visits)) {
            const v = visits[key];
            if (patientId === v.patientId) {
                found = true;
                currentHistoryData.push({ id: key, ...v });
                html += `<div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${key}">
                            🩺 ${v.patientName} - ${v.date} - إجمالي: ${v.totalAmount || 0} د.أ
                        </button>
                    </h2>
                    <div id="collapse${key}" class="accordion-collapse collapse" data-bs-parent="#historyAccordion">
                        <div class="accordion-body">
                            <p><strong><i class="fas fa-stethoscope"></i> التشخيص:</strong> ${v.diagnosis || '-'}</p>
                            <p><strong><i class="fas fa-pills"></i> الأدوية:</strong> ${v.medicines || '-'}</p>
                            <div class="payment-details">
                                <p><strong><i class="fas fa-dollar-sign"></i> المبلغ الكامل:</strong> ${v.totalAmount || 0} د.أ</p>
                                <p><strong><i class="fas fa-money-bill"></i> المبلغ المدفوع:</strong> ${v.paidAmount || 0} د.أ</p>
                                <p><strong><i class="fas fa-credit-card"></i> المبلغ المتبقي:</strong> ${v.remainingAmount || 0} د.أ</p>
                            </div>
                            <p><strong><i class="fas fa-clock"></i> الوقت:</strong> ${v.time || '-'}</p>
                            <button class="btn btn-sm btn-danger" onclick="deleteVisit('${key}')"><i class="fas fa-trash"></i> حذف</button>
                        </div>
                    </div>
                </div>`;
            }
        }
    }
    
    html += '</div>';
    if (!found) html = '<div class="alert alert-warning">❌ لا توجد زيارات لهذا المريض</div>';
    
    document.getElementById('historyResult').innerHTML = html;
};

// ===================== حذف زيارة =====================
window.deleteVisit = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الزيارة؟')) {
        try {
            await remove(ref(db, `visits/${id}`));
            alert('🗑️ تم حذف الزيارة');
            searchMedicalHistoryAutocomplete();
            getFinancialReportAutocomplete();
        } catch (error) {
            console.error("خطأ:", error);
            alert('❌ فشل في الحذف');
        }
    }
};

// ===================== التقرير المالي (مع رصيد أول المدة والتحقق من التواريخ) =====================
window.getFinancialReportAutocomplete = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const patientId = document.getElementById('financeSelectedPatientId').value;
    const patientName = document.getElementById('financePatientSearch').value.trim();
    
    // التحقق من صحة التاريخ
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            alert('⚠️ خطأ: تاريخ "إلى" يجب أن يكون أكبر من أو يساوي تاريخ "من"');
            return;
        }
    }
    
    const visitsRef = ref(db, 'visits');
    const snapshot = await get(visitsRef);
    const visits = snapshot.val();
    
    let allVisits = [];
    if (visits) {
        for (const key of Object.keys(visits)) {
            allVisits.push({ id: key, ...visits[key] });
        }
    }
    
    // فلترة حسب المريض
    if (patientId) {
        allVisits = allVisits.filter(v => v.patientId === patientId);
    } else if (patientName) {
        allVisits = allVisits.filter(v => v.patientName?.toLowerCase().includes(patientName.toLowerCase()));
    }
    
    // ترتيب حسب التاريخ
    allVisits.sort((a, b) => {
        const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : 0;
        const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : 0;
        return dateA - dateB;
    });
    
    // حساب رصيد أول المدة والزيارات خلال الفترة
    let openingTotal = 0, openingPaid = 0, openingRemaining = 0;
    let periodVisits = [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    for (const v of allVisits) {
        let visitDate = null;
        if (v.date) {
            const parts = v.date.split('/');
            if (parts.length === 3) {
                visitDate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        
        const isBeforePeriod = (!start || !visitDate || visitDate < start);
        const isInPeriod = (!start || (visitDate && visitDate >= start)) && (!end || (visitDate && visitDate <= end));
        
        if (isBeforePeriod) {
            openingTotal += v.totalAmount || 0;
            openingPaid += v.paidAmount || 0;
            openingRemaining += v.remainingAmount || 0;
        }
        if (isInPeriod) {
            periodVisits.push(v);
        }
    }
    
    let html = '';
    
    // عرض رصيد أول المدة
    if (openingTotal > 0 || openingPaid > 0 || openingRemaining > 0) {
        html += `<div class="opening-balance" style="background: linear-gradient(135deg, #ffd89b, #19547b); color: white; border-radius: 15px; padding: 15px; margin-bottom: 20px; text-align: center;">
            <h5><i class="fas fa-history"></i> رصيد أول المدة</h5>
            <div class="row">
                <div class="col-md-4">💰 إجمالي المستحق: ${openingTotal} د.أ</div>
                <div class="col-md-4">✅ المدفوع سابقاً: ${openingPaid} د.أ</div>
                <div class="col-md-4">📌 المتبقي: ${openingRemaining} د.أ</div>
            </div>
        </div>`;
    }
    
    // عرض جدول الزيارات خلال الفترة
    let periodTotal = 0, periodPaid = 0, periodRemaining = 0;
    let tableHtml = '<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>التاريخ</th><th>التشخيص</th><th>الأدوية</th><th>الكامل (د.أ)</th><th>المدفوع (د.أ)</th><th>المتبقي (د.أ)</th></tr></thead><tbody>';
    
    if (periodVisits.length > 0) {
        for (const v of periodVisits) {
            periodTotal += v.totalAmount || 0;
            periodPaid += v.paidAmount || 0;
            periodRemaining += v.remainingAmount || 0;
            tableHtml += `<tr>
                <td>${v.date || '-'}</td>
                <td>${(v.diagnosis || '-').substring(0, 40)}</td>
                <td>${(v.medicines || '-').substring(0, 30)}</td>
                <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                <td class="text-warning fw-bold">${v.remainingAmount || 0}</td>
            </tr>`;
        }
    } else {
        tableHtml += '<tr><td colspan="6" class="text-center">لا توجد زيارات في هذه الفترة</td></tr>';
    }
    
    tableHtml += `</tbody>
        <tfoot class="table-info">
            <tr><td colspan="3"><strong>الإجمالي</strong></td>
            <td><strong>${periodTotal} د.أ</strong></td>
            <td><strong>${periodPaid} د.أ</strong></td>
            <td><strong>${periodRemaining} د.أ</strong></td>
        </tr>
        </tfoot>
    </table>`;
    
    html += tableHtml;
    
    // المجاميع النهائية
    const grandTotal = openingTotal + periodTotal;
    const grandPaid = openingPaid + periodPaid;
    const grandRemaining = openingRemaining + periodRemaining;
    const collectionRate = grandTotal > 0 ? Math.round((grandPaid / grandTotal) * 100) : 0;
    
    html += `<div class="total-box mt-3">
        <h4><i class="fas fa-chart-line"></i> الملخص النهائي</h4>
        <div class="row mt-3">
            <div class="col-md-3"><strong>🏦 إجمالي المستحق:</strong><br>${grandTotal} د.أ</div>
            <div class="col-md-3"><strong>💳 إجمالي المدفوع:</strong><br>${grandPaid} د.أ</div>
            <div class="col-md-3"><strong>⚠️ إجمالي المتبقي:</strong><br>${grandRemaining} د.أ</div>
            <div class="col-md-3"><strong>📊 نسبة التحصيل:</strong><br>${collectionRate}%</div>
        </div>
        <div class="custom-progress mt-3"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}%</div></div>
    </div>`;
    
    document.getElementById('financeResult').innerHTML = html;
    currentFinanceData = periodVisits;
};

// ===================== تصدير التاريخ الطبي إلى Excel =====================
window.exportHistoryToExcel = function() {
    if (!currentHistoryData.length) {
        alert('⚠️ لا توجد بيانات للتصدير. يرجى البحث عن مريض أولاً.');
        return;
    }
    
    const exportData = currentHistoryData.map(v => ({
        'التاريخ': v.date,
        'الوقت': v.time,
        'التشخيص': v.diagnosis,
        'الأدوية': v.medicines,
        'المبلغ الكامل (د.أ)': v.totalAmount || 0,
        'المبلغ المدفوع (د.أ)': v.paidAmount || 0,
        'المبلغ المتبقي (د.أ)': v.remainingAmount || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التاريخ الطبي');
    XLSX.writeFile(wb, `history_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    alert('✅ تم تصدير البيانات إلى Excel بنجاح');
};

// ===================== تصدير التاريخ الطبي إلى PDF =====================
window.exportHistoryToPDF = async function() {
    if (!currentHistoryData.length) {
        alert('⚠️ لا توجد بيانات للتصدير. يرجى البحث عن مريض أولاً.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.text('التاريخ الطبي للمريض', 14, 10);
    doc.setFontSize(10);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 14, 18);
    
    const tableData = currentHistoryData.map(v => [
        v.date,
        v.diagnosis?.substring(0, 40) || '-',
        v.medicines?.substring(0, 30) || '-',
        (v.totalAmount || 0).toString(),
        (v.paidAmount || 0).toString(),
        (v.remainingAmount || 0).toString()
    ]);
    
    doc.autoTable({
        head: [['التاريخ', 'التشخيص', 'الأدوية', 'الكامل', 'المدفوع', 'المتبقي']],
        body: tableData,
        startY: 25,
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [26, 95, 122], textColor: 255 }
    });
    
    doc.save(`history_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`);
    alert('✅ تم تصدير البيانات إلى PDF بنجاح');
};

// ===================== تصدير التقرير المالي إلى Excel =====================
window.exportFinanceToExcel = function() {
    if (!currentFinanceData.length) {
        alert('⚠️ لا توجد بيانات للتصدير. يرجى عرض تقرير مالي أولاً.');
        return;
    }
    
    const exportData = currentFinanceData.map(v => ({
        'التاريخ': v.date,
        'التشخيص': v.diagnosis,
        'الأدوية': v.medicines,
        'المبلغ الكامل (د.أ)': v.totalAmount || 0,
        'المبلغ المدفوع (د.أ)': v.paidAmount || 0,
        'المبلغ المتبقي (د.أ)': v.remainingAmount || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير المالي');
    XLSX.writeFile(wb, `finance_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    alert('✅ تم تصدير التقرير المالي إلى Excel بنجاح');
};

// ===================== تصدير التقرير المالي إلى PDF =====================
window.exportFinanceToPDF = async function() {
    if (!currentFinanceData.length) {
        alert('⚠️ لا توجد بيانات للتصدير. يرجى عرض تقرير مالي أولاً.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.text('التقرير المالي', 14, 10);
    doc.setFontSize(10);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 14, 18);
    
    const tableData = currentFinanceData.map(v => [
        v.date,
        v.diagnosis?.substring(0, 40) || '-',
        v.medicines?.substring(0, 30) || '-',
        (v.totalAmount || 0).toString(),
        (v.paidAmount || 0).toString(),
        (v.remainingAmount || 0).toString()
    ]);
    
    doc.autoTable({
        head: [['التاريخ', 'التشخيص', 'الأدوية', 'الكامل', 'المدفوع', 'المتبقي']],
        body: tableData,
        startY: 25,
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [26, 95, 122], textColor: 255 }
    });
    
    doc.save(`finance_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`);
    alert('✅ تم تصدير التقرير المالي إلى PDF بنجاح');
};

// ===================== رفع ملف المرضى من Excel =====================
window.importPatientsFromExcel = function() {
    const fileInput = document.getElementById('patientsExcelFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('⚠️ الرجاء اختيار ملف Excel أولاً');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        let count = 0;
        for (const row of rows) {
            const name = row['الاسم'] || row['name'] || row['Name'];
            if (!name) continue;
            
            await set(push(ref(db, 'patients')), {
                name: name,
                phone: row['الجوال'] || row['phone'] || row['Phone'] || '',
                address: row['العنوان'] || row['address'] || '',
                createdAt: new Date().toLocaleDateString('ar-EG')
            });
            count++;
        }
        
        document.getElementById('importResult').innerHTML = `<div class="alert alert-success">✅ تم رفع ${count} مريض بنجاح</div>`;
        setTimeout(() => location.reload(), 1500);
    };
    reader.readAsArrayBuffer(file);
};

// ===================== رفع ملف الزيارات من Excel =====================
window.importVisitsFromExcel = function() {
    const fileInput = document.getElementById('visitsExcelFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('⚠️ الرجاء اختيار ملف Excel أولاً');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        let count = 0;
        let notFound = [];
        
        for (const row of rows) {
            const patientName = row['اسم المريض'] || row['patient_name'] || row['Patient'];
            if (!patientName) continue;
            
            const patient = allPatients.find(p => p.name === patientName);
            if (!patient) {
                notFound.push(patientName);
                continue;
            }
            
            const date = row['التاريخ'] || new Date().toLocaleDateString('ar-EG');
            const time = row['الوقت'] || new Date().toLocaleTimeString('ar-EG');
            
            await set(push(ref(db, 'visits')), {
                patientId: patient.id,
                patientName: patient.name,
                diagnosis: row['التشخيص'] || row['diagnosis'] || '',
                medicines: row['الأدوية'] || row['medicines'] || '',
                totalAmount: parseFloat(row['المبلغ الكامل'] || row['total'] || 0),
                paidAmount: parseFloat(row['المبلغ المدفوع'] || row['paid'] || 0),
                remainingAmount: parseFloat(row['المبلغ المتبقي'] || row['remaining'] || 0),
                date: date,
                time: time,
                timestamp: new Date(date.split('/').reverse().join('-')).getTime() || Date.now()
            });
            count++;
        }
        
        let msg = `✅ تم رفع ${count} زيارة بنجاح`;
        if (notFound.length > 0) {
            msg += `\n⚠️ لم يتم العثور على المرضى: ${notFound.join(', ')}`;
        }
        document.getElementById('importResult').innerHTML = `<div class="alert alert-success">${msg.replace(/\n/g, '<br>')}</div>`;
    };
    reader.readAsArrayBuffer(file);
};

// ===================== تحميل البيانات عند بدء التشغيل =====================
loadPatientsList();

// جعل الدوال متاحة عالمياً
window.searchMedicalHistoryAutocomplete = searchMedicalHistoryAutocomplete;
window.getFinancialReportAutocomplete = getFinancialReportAutocomplete;
window.deleteVisit = deleteVisit;
window.deletePatient = deletePatient;
window.addPatient = addPatient;
window.addVisitWithAutocomplete = addVisitWithAutocomplete;
window.filterPatients = filterPatients;
window.addMedicineRow = addMedicineRow;
window.getMedicinesString = getMedicinesString;
window.exportHistoryToExcel = exportHistoryToExcel;
window.exportHistoryToPDF = exportHistoryToPDF;
window.exportFinanceToExcel = exportFinanceToExcel;
window.exportFinanceToPDF = exportFinanceToPDF;
window.importPatientsFromExcel = importPatientsFromExcel;
window.importVisitsFromExcel = importVisitsFromExcel;