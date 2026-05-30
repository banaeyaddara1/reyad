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
    
    const newVisitRef = push(ref(db, 'visits'));
    const visitData = {
        patientId: patientId,
        patientName: selectedPatient?.name || 'غير معروف',
        diagnosis: document.getElementById('diagnosis').value.trim(),
        treatment: document.getElementById('treatment').value.trim(),
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount >= 0 ? remainingAmount : 0,
        date: now.toLocaleDateString('ar-EG'),
        time: now.toLocaleTimeString('ar-EG'),
        timestamp: now.getTime()
    };
    
    try {
        await set(newVisitRef, visitData);
        document.getElementById('patientSearchInput').value = '';
        document.getElementById('selectedPatientId').value = '';
        document.getElementById('diagnosis').value = '';
        document.getElementById('treatment').value = '';
        document.getElementById('totalAmount').value = '';
        document.getElementById('paidAmount').value = '';
        document.getElementById('remainingAmount').value = '';
        alert('✅ تم تسجيل الزيارة بنجاح!');
    } catch (error) {
        console.error("خطأ:", error);
        alert('❌ فشل في تسجيل الزيارة');
    }
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
    
    if (visits) {
        for (const key of Object.keys(visits)) {
            const v = visits[key];
            if (patientId === v.patientId) {
                found = true;
                html += `<div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${key}">
                            🩺 ${v.patientName} - ${v.date} - إجمالي: ${v.totalAmount || 0} د.أ
                        </button>
                    </h2>
                    <div id="collapse${key}" class="accordion-collapse collapse" data-bs-parent="#historyAccordion">
                        <div class="accordion-body">
                            <p><strong><i class="fas fa-stethoscope"></i> التشخيص:</strong> ${v.diagnosis || '-'}</p>
                            <p><strong><i class="fas fa-pills"></i> العلاج:</strong> ${v.treatment || '-'}</p>
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

// ===================== التقرير المالي (المحدث) =====================
window.getFinancialReportAutocomplete = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const patientId = document.getElementById('financeSelectedPatientId').value;
    const patientName = document.getElementById('financePatientSearch').value.trim();
    
    const visitsRef = ref(db, 'visits');
    const snapshot = await get(visitsRef);
    const visits = snapshot.val();
    
    let totalAmountSum = 0;
    let paidAmountSum = 0;
    let remainingAmountSum = 0;
    let filteredVisits = [];
    
    if (visits) {
        for (const key of Object.keys(visits)) {
            const v = visits[key];
            
            let visitDate = null;
            if (v.date) {
                const parts = v.date.split('/');
                if (parts.length === 3) {
                    visitDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            let start = startDate ? new Date(startDate) : null;
            let end = endDate ? new Date(endDate) : null;
            
            let inRange = true;
            if (visitDate) {
                if (start && visitDate < start) inRange = false;
                if (end && visitDate > end) inRange = false;
            } else {
                inRange = false;
            }
            
            let patientMatch = true;
            if (patientId) {
                patientMatch = (patientId === v.patientId);
            } else if (patientName) {
                patientMatch = v.patientName?.toLowerCase().includes(patientName.toLowerCase());
            }
            
            if (inRange && patientMatch) {
                filteredVisits.push(v);
                totalAmountSum += v.totalAmount || 0;
                paidAmountSum += v.paidAmount || 0;
                remainingAmountSum += v.remainingAmount || 0;
            }
        }
    }
    
    let html = '';
    const collectionRate = totalAmountSum > 0 ? Math.round((paidAmountSum / totalAmountSum) * 100) : 0;
    
    if (patientId || patientName) {
        if (filteredVisits.length > 0) {
            const targetName = filteredVisits[0].patientName;
            html = `
                <div class="animate__animated animate__fadeIn">
                    <div class="stat-card mb-4" style="background: linear-gradient(135deg, #11998e, #38ef7d);">
                        <i class="fas fa-user-md"></i>
                        <h4>كشف حساب المريض: ${targetName}</h4>
                    </div>
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>التاريخ</th>
                                <th>التشخيص</th>
                                <th>الكامل (د.أ)</th>
                                <th>المدفوع (د.أ)</th>
                                <th>المتبقي (د.أ)</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            for (const v of filteredVisits) {
                html += `<tr>
                    <td>${v.date || '-'}</td>
                    <td>${(v.diagnosis || '-').substring(0, 40)}</td>
                    <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                    <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                    <td class="text-warning fw-bold">${v.remainingAmount || 0}</td>
                </tr>`;
            }
            
            html += `</tbody>
                    <tfoot class="table-info">
                        <tr>
                            <td colspan="2"><strong>الإجمالي</strong></td>
                            <td><strong>${totalAmountSum} د.أ</strong></td>
                            <td><strong>${paidAmountSum} د.أ</strong></td>
                            <td><strong>${remainingAmountSum} د.أ</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <div class="total-box">
                    <div class="row">
                        <div class="col-md-4"><h4><i class="fas fa-percent"></i> نسبة التحصيل: ${collectionRate}%</h4></div>
                        <div class="col-md-8"><div class="custom-progress"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}%</div></div></div>
                    </div>
                </div>
            </div>`;
        } else {
            html = '<div class="alert alert-warning animate__animated animate__shakeX">❌ لا توجد زيارات لهذا المريض في الفترة المحددة</div>';
        }
    } else {
        html = `
            <div class="animate__animated animate__fadeIn">
                <div class="total-box">
                    <h4><i class="fas fa-chart-line"></i> التقرير المالي العام</h4>
                    <div class="row mt-4">
                        <div class="col-md-4"><h3><i class="fas fa-dollar-sign"></i> إجمالي الإيرادات: ${totalAmountSum} د.أ</h3></div>
                        <div class="col-md-4"><h3><i class="fas fa-money-bill"></i> المدفوع: ${paidAmountSum} د.أ</h3></div>
                        <div class="col-md-4"><h3><i class="fas fa-credit-card"></i> المتبقي: ${remainingAmountSum} د.أ</h3></div>
                    </div>
                    <hr>
                    <div class="row mt-3">
                        <div class="col-md-6"><p><i class="fas fa-chart-simple"></i> عدد الزيارات: ${filteredVisits.length}</p></div>
                        <div class="col-md-6"><p><i class="fas fa-chart-line"></i> نسبة التحصيل: ${collectionRate}%</p></div>
                    </div>
                    <div class="custom-progress mt-2"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}%</div></div>
                    <p class="mt-3"><i class="fas fa-info-circle"></i> هذه المجاميع تشمل جميع المرضى في الفترة المحددة</p>
                </div>
            </div>`;
    }
    
    document.getElementById('financeResult').innerHTML = html;
};

// ===================== تحميل البيانات عند بدء التشغيل =====================
loadPatientsList();

// جعل الدوال متاحة عالمياً
window.deletePatient = deletePatient;
window.addPatient = addPatient;
window.addVisitWithAutocomplete = addVisitWithAutocomplete;
window.searchMedicalHistoryAutocomplete = searchMedicalHistoryAutocomplete;
window.getFinancialReportAutocomplete = getFinancialReportAutocomplete;
window.filterPatients = filterPatients;
window.deleteVisit = deleteVisit;