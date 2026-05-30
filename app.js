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
console.log("✅ Firebase متصل");

let allPatients = [];
let patientNamesList = [];
let currentHistoryData = [];
let currentFinanceData = [];

// دالة لتنسيق التاريخ للنص
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    return dateStr;
}

// دالة لتحويل التاريخ من Firebase إلى تاريخ صالح للمقارنة
function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    return new Date(dateStr);
}

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
                patientNamesList.push({ label: `${p.name} ${p.phone ? `📞 ${p.phone}` : ''}`, value: p.name, id: p.id, phone: p.phone });
            });
        }
        displayPatientsList();
        updateAutocomplete();
    });
}

function displayPatientsList(searchTerm = '') {
    let filtered = allPatients.filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    let html = '<table class="table table-bordered"><thead><tr><th>#</th><th>الاسم</th><th>الجوال</th><th>العنوان</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr></thead><tbody>';
    let idx = 1;
    filtered.forEach(p => { html += `<tr><td>${idx++}</td><td><strong>${p.name}</strong></td><td>${p.phone || '-'}</td><td>${p.address || '-'}</td><td>${p.createdAt || '-'}</td><td><button class="btn btn-sm btn-danger" onclick="deletePatient('${p.id}')"><i class="fas fa-trash"></i></button></td></tr>`; });
    if (!filtered.length) html += '<tr><td colspan="6" class="text-center">لا يوجد مرضى</td></tr>';
    html += '</tbody></table>';
    document.getElementById('patientsList').innerHTML = html;
}

window.filterPatients = () => displayPatientsList(document.getElementById('searchPatient')?.value);

function updateAutocomplete() {
    const fields = ['patientSearchInput', 'historySearchInput', 'financePatientSearch'];
    fields.forEach(field => {
        if (document.getElementById(field)) {
            $(`#${field}`).autocomplete({
                source: patientNamesList,
                select: function(e, ui) {
                    document.getElementById(field).value = ui.item.value;
                    const idMap = { patientSearchInput: 'selectedPatientId', historySearchInput: 'historySelectedPatientId', financePatientSearch: 'financeSelectedPatientId' };
                    document.getElementById(idMap[field]).value = ui.item.id;
                    if (field === 'financePatientSearch') getFinancialReportAutocomplete();
                    return false;
                }
            }).data("ui-autocomplete")._renderItem = (ul, item) => $("<li>").append(`<div class="patient-result"><span>${item.value}</span><small>${item.phone || ''}</small></div>`).appendTo(ul);
        }
    });
}

window.addPatient = async () => {
    const name = document.getElementById('patientName').value.trim();
    if (!name) return alert('⚠️ مطلوب إدخال اسم المريض');
    await set(push(ref(db, 'patients')), { 
        name, 
        phone: document.getElementById('patientPhone').value.trim(), 
        address: document.getElementById('patientAddress').value.trim(), 
        createdAt: new Date().toLocaleDateString('ar-EG') 
    });
    document.getElementById('patientName').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientAddress').value = '';
    alert('✅ تم الإضافة بنجاح');
};

window.deletePatient = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من الحذف؟')) return;
    await remove(ref(db, `patients/${id}`));
    const visits = (await get(ref(db, 'visits'))).val();
    if (visits) for (const vid of Object.keys(visits)) if (visits[vid].patientId === id) await remove(ref(db, `visits/${vid}`));
    alert('🗑️ تم الحذف');
};

window.addVisitWithAutocomplete = async () => {
    const patientId = document.getElementById('selectedPatientId').value;
    if (!patientId) return alert('⚠️ مطلوب اختيار مريض');
    const patient = allPatients.find(p => p.id === patientId);
    const medicines = window.getMedicinesString ? window.getMedicinesString() : '';
    const now = new Date();
    await set(push(ref(db, 'visits')), {
        patientId, 
        patientName: patient.name,
        diagnosis: document.getElementById('diagnosis').value.trim(),
        medicines: medicines,
        totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
        paidAmount: parseFloat(document.getElementById('paidAmount').value) || 0,
        remainingAmount: Math.max(0, (parseFloat(document.getElementById('totalAmount').value) || 0) - (parseFloat(document.getElementById('paidAmount').value) || 0)),
        date: now.toLocaleDateString('ar-EG'),
        time: now.toLocaleTimeString('ar-EG'),
        timestamp: now.getTime()
    });
    document.getElementById('patientSearchInput').value = '';
    document.getElementById('selectedPatientId').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('medicinesList').innerHTML = `<div class="medicine-row"><input type="text" class="form-control" placeholder="اسم الدواء" id="medName0"><input type="number" class="form-control" placeholder="العدد" id="medQty0" value="1" min="1"></div>`;
    window.medicineCounter = 1;
    document.getElementById('totalAmount').value = '';
    document.getElementById('paidAmount').value = '';
    document.getElementById('remainingAmount').value = '';
    alert('✅ تم تسجيل الزيارة');
};

window.searchMedicalHistoryAutocomplete = async () => {
    const patientId = document.getElementById('historySelectedPatientId').value;
    if (!patientId) return alert('⚠️ مطلوب اختيار مريض');
    const visits = (await get(ref(db, 'visits'))).val();
    let html = '<div class="accordion">';
    let found = false;
    currentHistoryData = [];
    if (visits) {
        for (const [key, v] of Object.entries(visits)) {
            if (v.patientId === patientId) {
                found = true;
                currentHistoryData.push({ ...v, id: key });
                html += `<div class="accordion-item mb-2 border rounded">
                    <div class="accordion-header p-2" style="background: var(--border-color); cursor: pointer;" onclick="this.nextElementSibling.classList.toggle('d-none')">
                        <strong>🩺 ${v.date} - ${v.totalAmount || 0} د.أ</strong>
                    </div>
                    <div class="accordion-body d-none p-2">
                        <p><strong><i class="fas fa-stethoscope"></i> التشخيص:</strong> ${v.diagnosis || '-'}</p>
                        <p><strong><i class="fas fa-pills"></i> الأدوية:</strong> ${v.medicines || '-'}</p>
                        <p><strong><i class="fas fa-dollar-sign"></i> المبلغ الإجمالي:</strong> ${v.totalAmount || 0} د.أ</p>
                        <p><strong><i class="fas fa-money-bill"></i> المبلغ المدفوع:</strong> ${v.paidAmount || 0} د.أ</p>
                        <p><strong><i class="fas fa-credit-card"></i> المبلغ المتبقي:</strong> ${v.remainingAmount || 0} د.أ</p>
                        <button class="btn btn-sm btn-danger mt-2" onclick="deleteVisit('${key}')"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>`;
            }
        }
    }
    html += '</div>';
    if (!found) html = '<div class="alert alert-warning">❌ لا توجد زيارات لهذا المريض</div>';
    document.getElementById('historyResult').innerHTML = html;
};

window.deleteVisit = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من الحذف؟')) {
        await remove(ref(db, `visits/${id}`));
        alert('🗑️ تم حذف الزيارة');
        searchMedicalHistoryAutocomplete();
        getFinancialReportAutocomplete();
    }
};

window.getFinancialReportAutocomplete = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const patientId = document.getElementById('financeSelectedPatientId').value;
    const patientName = document.getElementById('financePatientSearch').value.trim();
    
    // التحقق من صحة التواريخ
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            alert('⚠️ خطأ: تاريخ "إلى" مطلوب أن يكون أكبر من تاريخ "من"');
            return;
        }
    }
    
    const visits = (await get(ref(db, 'visits'))).val();
    let allVisits = [];
    if (visits) {
        for (const [key, v] of Object.entries(visits)) {
            allVisits.push({ ...v, id: key });
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
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        return da - db;
    });
    
    let openingTotal = 0, openingPaid = 0, openingRemaining = 0;
    let periodVisits = [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    for (const v of allVisits) {
        const visitDate = parseDate(v.date);
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
    
    // رصيد أول المدة
    if (openingTotal > 0 || openingPaid > 0) {
        html += `<div class="opening-balance">
            <h5><i class="fas fa-history"></i> رصيد أول المدة</h5>
            <div class="row">
                <div class="col-md-4">💰 المبلغ الإجمالي السابق: ${openingTotal} د.أ</div>
                <div class="col-md-4">✅ المدفوع سابقاً: ${openingPaid} د.أ</div>
                <div class="col-md-4">📌 المتبقي سابقاً: ${openingRemaining} د.أ</div>
            </div>
        </div>`;
    }
    
    // جدول الفترة
    let periodTotal = 0, periodPaid = 0, periodRemaining = 0;
    let tableHtml = '<div class="table-responsive"><table class="table table-striped"><thead class="table-dark"><tr><th>التاريخ</th><th>المريض</th><th>التشخيص</th><th>الأدوية</th><th>المبلغ الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr></thead><tbody>';
    
    if (periodVisits.length > 0) {
        for (const v of periodVisits) {
            periodTotal += v.totalAmount || 0;
            periodPaid += v.paidAmount || 0;
            periodRemaining += v.remainingAmount || 0;
            tableHtml += `<tr>
                <td>${formatDateForDisplay(v.date) || '-'}</td>
                <td>${v.patientName || '-'}</td>
                <td>${(v.diagnosis || '-').substring(0, 30)}</td>
                <td>${(v.medicines || '-').substring(0, 25)}</td>
                <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                <td class="text-warning fw-bold">${v.remainingAmount || 0}</td>
            </tr>`;
        }
    } else {
        tableHtml += '<tr><td colspan="7" class="text-center">لا توجد زيارات في هذه الفترة</td></tr>';
    }
    
    tableHtml += `</tbody>
        <tfoot class="table-info">
            <tr><td colspan="4"><strong>الإجمالي</strong></td>
            <td><strong>${periodTotal} د.أ</strong></td>
            <td><strong>${periodPaid} د.أ</strong></td>
            <td><strong>${periodRemaining} د.أ</strong></td>
        </tr>
        </tfoot>
     </table></div>`;
    
    html += tableHtml;
    
    // المجاميع النهائية
    const grandTotal = openingTotal + periodTotal;
    const grandPaid = openingPaid + periodPaid;
    const grandRemaining = openingRemaining + periodRemaining;
    const collectionRate = grandTotal > 0 ? Math.round((grandPaid / grandTotal) * 100) : 0;
    
    html += `<div class="total-box">
        <h4><i class="fas fa-chart-line"></i> الملخص النهائي</h4>
        <div class="row mt-3">
            <div class="col-md-3"><strong>💰 المبلغ الإجمالي الكلي:</strong><br><span style="font-size:1.3rem;">${grandTotal} د.أ</span></div>
            <div class="col-md-3"><strong>💳 إجمالي المدفوع:</strong><br><span style="font-size:1.3rem;">${grandPaid} د.أ</span></div>
            <div class="col-md-3"><strong>⚠️ إجمالي المتبقي:</strong><br><span style="font-size:1.3rem;">${grandRemaining} د.أ</span></div>
            <div class="col-md-3"><strong>📊 نسبة التحصيل:</strong><br><span style="font-size:1.3rem;">${collectionRate}%</span></div>
        </div>
        <div class="custom-progress mt-3"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}%</div></div>
    </div>`;
    
    document.getElementById('financeResult').innerHTML = html;
    currentFinanceData = periodVisits;
};

// تصدير التاريخ الطبي إلى Excel
window.exportHistoryToExcel = () => {
    if (!currentHistoryData.length) return alert('⚠️ لا توجد بيانات للتصدير');
    const data = currentHistoryData.map(v => ({ 
        'التاريخ': v.date || '', 
        'الوقت': v.time || '', 
        'اسم المريض': v.patientName || '', 
        'التشخيص': v.diagnosis || '', 
        'الأدوية': v.medicines || '', 
        'المبلغ الإجمالي (د.أ)': v.totalAmount || 0, 
        'المبلغ المدفوع (د.أ)': v.paidAmount || 0, 
        'المبلغ المتبقي (د.أ)': v.remainingAmount || 0 
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:12},{wch:10},{wch:15},{wch:25},{wch:30},{wch:14},{wch:14},{wch:14}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التاريخ الطبي');
    XLSX.writeFile(wb, `history_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
    alert('✅ تم التصدير إلى Excel');
};

// تصدير التاريخ الطبي إلى PDF
window.exportHistoryToPDF = async () => {
    if (!currentHistoryData.length) return alert('⚠️ لا توجد بيانات للتصدير');
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text('التاريخ الطبي', 14, 15);
        doc.setFontSize(10);
        doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 14, 22);
        
        const tableData = currentHistoryData.map(v => [
            v.date || '',
            v.patientName || '',
            (v.diagnosis || '-').substring(0, 40),
            (v.medicines || '-').substring(0, 30),
            (v.totalAmount || 0).toString(),
            (v.paidAmount || 0).toString(),
            (v.remainingAmount || 0).toString()
        ]);
        
        doc.autoTable({
            head: [['التاريخ', 'المريض', 'التشخيص', 'الأدوية', 'الإجمالي', 'المدفوع', 'المتبقي']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
            headStyles: { fillColor: [26, 95, 122], textColor: 255, halign: 'center' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 },
                3: { cellWidth: 40 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 }
            }
        });
        
        doc.save(`history_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.pdf`);
        alert('✅ تم التصدير إلى PDF');
    } catch(e) {
        console.error(e);
        alert('❌ خطأ في تصدير PDF: ' + e.message);
    }
};

// تصدير التقرير المالي إلى Excel
window.exportFinanceToExcel = () => {
    if (!currentFinanceData.length) return alert('⚠️ لا توجد بيانات للتصدير');
    const data = currentFinanceData.map(v => ({ 
        'التاريخ': v.date || '', 
        'اسم المريض': v.patientName || '', 
        'التشخيص': v.diagnosis || '', 
        'الأدوية': v.medicines || '', 
        'المبلغ الإجمالي (د.أ)': v.totalAmount || 0, 
        'المبلغ المدفوع (د.أ)': v.paidAmount || 0, 
        'المبلغ المتبقي (د.أ)': v.remainingAmount || 0 
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:12},{wch:15},{wch:25},{wch:30},{wch:14},{wch:14},{wch:14}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير المالي');
    XLSX.writeFile(wb, `finance_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
    alert('✅ تم التصدير إلى Excel');
};

// تصدير التقرير المالي إلى PDF
window.exportFinanceToPDF = async () => {
    if (!currentFinanceData.length) return alert('⚠️ لا توجد بيانات للتصدير');
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.text('التقرير المالي', 14, 15);
        doc.setFontSize(10);
        doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 14, 22);
        
        const tableData = currentFinanceData.map(v => [
            v.date || '',
            v.patientName || '',
            (v.diagnosis || '-').substring(0, 40),
            (v.medicines || '-').substring(0, 30),
            (v.totalAmount || 0).toString(),
            (v.paidAmount || 0).toString(),
            (v.remainingAmount || 0).toString()
        ]);
        
        doc.autoTable({
            head: [['التاريخ', 'المريض', 'التشخيص', 'الأدوية', 'الإجمالي', 'المدفوع', 'المتبقي']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
            headStyles: { fillColor: [26, 95, 122], textColor: 255, halign: 'center' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 },
                3: { cellWidth: 40 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 }
            }
        });
        
        doc.save(`finance_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.pdf`);
        alert('✅ تم التصدير إلى PDF');
    } catch(e) {
        console.error(e);
        alert('❌ خطأ في تصدير PDF: ' + e.message);
    }
};

// رفع المرضى من Excel
window.importPatientsFromExcel = () => {
    const file = document.getElementById('patientsExcelFile').files[0];
    if (!file) return alert('⚠️ مطلوب اختيار ملف');
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        let count = 0;
        for (const row of rows) {
            const name = row['الاسم'] || row['name'] || row['Name'];
            if (!name) continue;
            await set(push(ref(db, 'patients')), { 
                name, 
                phone: row['الجوال'] || row['phone'] || '', 
                address: row['العنوان'] || row['address'] || '', 
                createdAt: new Date().toLocaleDateString('ar-EG') 
            });
            count++;
        }
        document.getElementById('importResult').innerHTML = `<div class="alert alert-success">✅ تم رفع ${count} مريض</div>`;
        setTimeout(() => location.reload(), 1500);
    };
    reader.readAsArrayBuffer(file);
};

// رفع الزيارات من Excel
window.importVisitsFromExcel = () => {
    const file = document.getElementById('visitsExcelFile').files[0];
    if (!file) return alert('⚠️ مطلوب اختيار ملف');
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        let count = 0, notFound = [];
        for (const row of rows) {
            const patientName = row['اسم المريض'] || row['patient_name'] || row['Patient'];
            if (!patientName) continue;
            const patient = allPatients.find(p => p.name === patientName);
            if (!patient) { notFound.push(patientName); continue; }
            await set(push(ref(db, 'visits')), {
                patientId: patient.id, 
                patientName: patient.name,
                diagnosis: row['التشخيص'] || row['diagnosis'] || '',
                medicines: row['الأدوية'] || row['medicines'] || '',
                totalAmount: parseFloat(row['المبلغ الإجمالي'] || row['total'] || 0),
                paidAmount: parseFloat(row['المبلغ المدفوع'] || row['paid'] || 0),
                remainingAmount: parseFloat(row['المبلغ المتبقي'] || row['remaining'] || 0),
                date: row['التاريخ'] || new Date().toLocaleDateString('ar-EG'),
                time: row['الوقت'] || new Date().toLocaleTimeString('ar-EG'),
                timestamp: Date.now()
            });
            count++;
        }
        let msg = `✅ تم رفع ${count} زيارة`;
        if (notFound.length) msg += `\n⚠️ لم يتم العثور على: ${notFound.join(', ')}`;
        document.getElementById('importResult').innerHTML = `<div class="alert alert-success">${msg.replace(/\n/g, '<br>')}</div>`;
    };
    reader.readAsArrayBuffer(file);
};

// تحميل نموذج المرضى
window.downloadPatientsTemplate = () => {
    const template = [{ 'الاسم': 'مثال محمد', 'الجوال': '0791234567', 'العنوان': 'عمان' }];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{wch:20},{wch:15},{wch:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المرضى');
    XLSX.writeFile(wb, 'patients_template.xlsx');
};

// تحميل نموذج الزيارات
window.downloadVisitsTemplate = () => {
    const template = [{ 
        'اسم المريض': 'مثال محمد', 
        'التاريخ': new Date().toLocaleDateString('ar-EG'), 
        'التشخيص': 'نزلة برد', 
        'الأدوية': 'بنادول (2)', 
        'المبلغ الإجمالي': 50, 
        'المبلغ المدفوع': 30, 
        'المبلغ المتبقي': 20 
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{wch:15},{wch:15},{wch:20},{wch:25},{wch:15},{wch:15},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الزيارات');
    XLSX.writeFile(wb, 'visits_template.xlsx');
};

loadPatientsList();