// ===================== إعداد Firebase =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set, update, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

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
const auth = getAuth(app);

console.log("✅ Firebase متصل بنجاح");

const ADMIN_EMAILS = [
    "admin@clinic.com",
    "reyad@clinic.com"
];

let currentUser = null;
let allPatients = [];
let patientNamesList = [];

function isCurrentUserAdmin() {
    return currentUser && ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());
}

// ===================== مراقبة حالة تسجيل الدخول =====================
onAuthStateChanged(auth, (user) => {
    const loginContainer = document.getElementById('loginContainer');
    const appContent = document.getElementById('appContent');
    const topButtons = document.getElementById('topButtons');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const tabs = document.querySelector('.nav-tabs');
    const tabContent = document.querySelector('.tab-content');

    if (user) {
        currentUser = user;
        const isAdmin = isCurrentUserAdmin();
        
        if (loginContainer) loginContainer.style.setProperty('display', 'none', 'important');
        if (appContent) appContent.style.setProperty('display', 'block', 'important');
        if (topButtons) topButtons.style.setProperty('display', 'flex', 'important');
        if (welcomeMessage) welcomeMessage.style.setProperty('display', 'block', 'important');
        if (tabs) tabs.style.setProperty('display', 'flex', 'important');
        if (tabContent) tabContent.style.setProperty('display', 'block', 'important');
        
        const userNameSpan = document.getElementById('userNameDisplay');
        if (userNameSpan) {
            userNameSpan.textContent = `مرحباً ${user.email.split('@')[0]}`;
        }
        
        applyPermissionsBasedOnRole();
        loadPatientsList();
    } else {
        currentUser = null;
        if (loginContainer) loginContainer.style.setProperty('display', 'flex', 'important');
        if (appContent) appContent.style.setProperty('display', 'none', 'important');
        if (topButtons) topButtons.style.setProperty('display', 'none', 'important');
        if (welcomeMessage) welcomeMessage.style.setProperty('display', 'none', 'important');
        if (tabs) tabs.style.setProperty('display', 'none', 'important');
        if (tabContent) tabContent.style.setProperty('display', 'none', 'important');
    }
});

function applyPermissionsBasedOnRole() {
    const isAdmin = isCurrentUserAdmin();
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty('display', isAdmin ? '' : 'none', 'important');
        if (el.classList.contains('nav-link')) {
            const parentItem = el.closest('.nav-item');
            if (parentItem) parentItem.style.setProperty('display', isAdmin ? '' : 'none', 'important');
        }
    });
    
    const mergeCard = document.getElementById('mergePatientsCard');
    if (mergeCard) {
        mergeCard.style.display = (isAdmin || (currentUser && currentUser.email === "reyad@clinic.com")) ? 'block' : 'none';
    }
}

function saveEmailToLocalStorage(email) { if (email) localStorage.setItem('savedEmail', email); }
function getSavedEmail() { return localStorage.getItem('savedEmail') || ''; }

window.toggleSaveEmail = function() {
    const emailInput = document.getElementById('loginEmail');
    const saveBtn = document.getElementById('saveEmailBtn');
    if (emailInput.value.trim()) {
        saveEmailToLocalStorage(emailInput.value.trim());
        saveBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else {
        localStorage.removeItem('savedEmail');
        saveBtn.innerHTML = '<i class="fas fa-circle"></i>';
    }
};

window.loginWithEmail = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    if (!email || !password) { messageDiv.textContent = '⚠️ الرجاء إدخال البيانات'; return; }
    try {
        messageDiv.textContent = '⏳ جاري تسجيل الدخول...';
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        messageDiv.textContent = '❌ خطأ في عملية تسجيل الدخول';
    }
};

window.logoutUser = async function() { await signOut(auth); };

// ===================== استرجاع وعرض بيانات المرضى (الاستعلام الثلاثي الشامل) =====================
function loadPatientsList() {
    onValue(ref(db, 'patients'), (snapshot) => {
        allPatients = [];
        patientNamesList = [];
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const p = { id: key, ...data[key] };
                allPatients.push(p);
                patientNamesList.push({
                    label: `${p.name} ${p.age ? `(${p.age} سنة)` : ''} ${p.phone ? `📞 ${p.phone}` : ''}`,
                    value: p.name,
                    id: p.id
                });
            });
        }
        displayPatientsList();
        updateAutocomplete();
        initMergeAutocomplete();
    });
}

function displayPatientsList(searchTerm = '') {
    let filteredPatients = allPatients;
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        // الفلترة الشاملة: بحث بالاسم أو الجوال أو العنوان
        filteredPatients = allPatients.filter(p => 
            p.name?.toLowerCase().includes(searchTerm) || 
            p.phone?.toLowerCase().includes(searchTerm) || 
            p.address?.toLowerCase().includes(searchTerm)
        );
    }
    
    let html = `
        <table class="table table-bordered table-hover">
            <thead>
                <tr>
                    <th>#</th><th>الاسم</th><th>العمر</th><th>الجوال</th><th>العنوان</th><th>تاريخ التسجيل</th><th>إجراءات</th>
                </tr>
            </thead>
            <tbody>`;
    
    let index = 1;
    if (filteredPatients.length > 0) {
        filteredPatients.forEach(p => {
            html += `
                <tr>
                    <td>${index++}</td>
                    <td><strong>${p.name || '-'}</strong></td>
                    <td>${p.age || '-'}</td>
                    <td>${p.phone || '-'}</td>
                    <td>${p.address || '-'}</td>
                    <td>${p.createdAt || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1" onclick="window.openEditPatientModal('${p.id}', '${p.name}', '${p.age || ''}', '${p.phone || ''}', '${p.address || ''}')"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="btn btn-sm btn-danger" onclick="window.deletePatient('${p.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } else {
        html += `<tr><td colspan="7" class="text-center">لا توجد نتائج مطابقة للبحث</td></tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById('patientsList').innerHTML = html;
}

window.filterPatients = function() {
    displayPatientsList(document.getElementById('searchPatient').value);
};

// ===================== إضافة مريض جديد والتحويل المباشر لصفحة الزيارات =====================
window.addPatient = async function() {
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value.trim();
    const phone = document.getElementById('patientPhone').value.trim();
    const address = document.getElementById('patientAddress').value.trim();
    
    if (!name) { alert('⚠️ الرجاء إدخال اسم المريض'); return; }
    
    const newPatientRef = push(ref(db, 'patients'));
    const targetId = newPatientRef.key;
    const patientData = {
        name: name, age: age, phone: phone, address: address,
        createdAt: new Date().toLocaleDateString('ar-EG')
    };
    
    try {
        await set(newPatientRef, patientData);
        
        document.getElementById('patientName').value = '';
        document.getElementById('patientAge').value = '';
        document.getElementById('patientPhone').value = '';
        document.getElementById('patientAddress').value = '';
        
        if (confirm('✅ تم حفظ المريض بنجاح!\n\nهل تريد تسجيل زيارة جديدة لهذا المريض الآن؟')) {
            document.getElementById('patientSearchInput').value = name;
            document.getElementById('selectedPatientId').value = targetId;
            
            const visitsTabButton = document.getElementById('visits-tab');
            if (visitsTabButton) {
                bootstrap.Tab.getInstance(visitsTabButton)?.show() || new bootstrap.Tab(visitsTabButton).show();
            }
        } else {
            alert('✅ تم حفظ ملف المريض بنجاح بقائمة العيادة.');
        }
    } catch (error) {
        alert('❌ حدث خطأ أثناء عملية الحفظ');
    }
};

// ===================== التقارير المالية المتطورة والمصححة حسابياً =====================
window.getFinancialReportAutocomplete = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const patientId = document.getElementById('financeSelectedPatientId').value;
    const patientName = document.getElementById('financePatientSearch').value.trim();
    
    const snapshot = await get(ref(db, 'visits'));
    const visits = snapshot.val();
    
    let totalAmountSum = 0, paidAmountSum = 0, remainingAmountSum = 0;
    let filteredVisits = [];
    
    if (visits) {
        for (const key of Object.keys(visits)) {
            const v = visits[key];
            let visitDate = null;
            if (v.date) {
                const parts = v.date.split('/');
                if (parts.length === 3) visitDate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
            
            let start = startDate ? new Date(startDate) : null;
            let end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            
            let inRange = true;
            if (visitDate) {
                if (start && visitDate < start) inRange = false;
                if (end && visitDate > end) inRange = false;
            } else { inRange = false; }
            
            let patientMatch = true;
            if (patientId) { patientMatch = (patientId === v.patientId); }
            else if (patientName) { patientMatch = v.patientName?.toLowerCase().includes(patientName.toLowerCase()); }
            
            if (inRange && patientMatch) {
                filteredVisits.push(v);
                totalAmountSum += parseFloat(v.totalAmount) || 0;
                paidAmountSum += parseFloat(v.paidAmount) || 0;
            }
        }
    }
    
    // المعادلة الحسابية الصافية لضمان دقة إشارة السالب والبلس
    remainingAmountSum = totalAmountSum - paidAmountSum;
    
    // ترتيب الحركات المالية تنازلياً حسب الوقت والتاريخ
    filteredVisits.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    let html = '';
    const collectionRate = totalAmountSum > 0 ? Math.round((paidAmountSum / totalAmountSum) * 100) : 0;
    
    if (patientId || patientName) {
        // كشف حساب تفصيلي لمريض محدد
        if (filteredVisits.length > 0) {
            const targetId = patientId || filteredVisits[0].patientId;
            const patientObj = allPatients.find(p => p.id === targetId) || { name: filteredVisits[0].patientName };

            html = `
                <div class="animate__animated animate__fadeIn">
                    <div class="stat-card mb-4 text-start p-4">
                        <h4 class="text-center mb-3"><i class="fas fa-file-invoice-dollar"></i> كشف حساب المريض التفصيلي</h4>
                        <div class="row text-white g-2 fs-6">
                            <div class="col-md-6"><strong>الاسم:</strong> ${patientObj.name}</div>
                            <div class="col-md-6"><strong>العمر:</strong> ${patientObj.age || '-'} سنة</div>
                            <div class="col-md-6"><strong>الجوال:</strong> ${patientObj.phone || '-'}</div>
                            <div class="col-md-6"><strong>العنوان:</strong> ${patientObj.address || '-'}</div>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr><th>التاريخ</th><th>التشخيص</th><th>العلاج</th><th>عدد العلب</th><th>الكامل (د.أ)</th><th>المدفوع (د.أ)</th><th>المتبقي (د.أ)</th></tr>
                            </thead>
                            <tbody>`;
            
            for (const v of filteredVisits) {
                html += `<tr>
                    <td>${v.date || '-'}</td>
                    <td>${v.diagnosis || '-'}</td>
                    <td>${v.treatment || '-'}</td>
                    <td>${v.boxesCount || 0}</td>
                    <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                    <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                    <td class="${v.remainingAmount < 0 ? 'text-danger':'text-success'} fw-bold">${v.remainingAmount || 0}</td>
                </tr>`;
            }
            html += `</tbody>
                    <tfoot class="table-info text-dark">
                        <tr><td colspan="4"><strong>الإجمالي</strong></td>
                        <td><strong>${totalAmountSum.toFixed(2)} د.أ</strong></td>
                        <td><strong>${paidAmountSum.toFixed(2)} د.أ</strong></td>
                        <td><strong class="${remainingAmountSum < 0 ? 'text-danger' : 'text-success'}">${remainingAmountSum.toFixed(2)} د.أ</strong></td>
                    </tr></tfoot></table></div></div>`;
        } else {
            html = '<div class="alert alert-warning">❌ لا توجد زيارات لهذا المريض في الفترة المحددة</div>';
        }
    } else {
        // التقرير العام الشامل: يعرض جدولاً تفصيلياً كاملاً للمرضى والحركات المالية بالفترات مرتبة بالتاريخ
        if (filteredVisits.length > 0) {
            html = `
                <div class="animate__animated animate__fadeIn">
                    <div class="total-box mb-4">
                        <h4><i class="fas fa-chart-line"></i> ملخص الإيرادات العامة للفترة</h4>
                        <div class="row mt-4">
                            <div class="col-md-4"><h3>الإيرادات: ${totalAmountSum.toFixed(2)} د.أ</h3></div>
                            <div class="col-md-4"><h3>المدفوع: ${paidAmountSum.toFixed(2)} د.أ</h3></div>
                            <div class="col-md-4"><h3>المتبقي الإجمالي: <span class="${remainingAmountSum < 0 ? 'text-danger':'text-success'}">${remainingAmountSum.toFixed(2)} د.أ</span></h3></div>
                        </div>
                        <div class="custom-progress mt-3"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}% نسبة التحصيل</div></div>
                    </div>
                    
                    <h5 class="mb-3 text-white"><i class="fas fa-list-alt"></i> سجل الكشف المالي التفصيلي لجميع المرضى مرتباً بالتاريخ:</h5>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>التاريخ</th>
                                    <th>المريض</th>
                                    <th>المبلغ الكامل (د.أ)</th>
                                    <th>المدفوع (د.أ)</th>
                                    <th>المتبقي (د.أ)</th>
                                </tr>
                            </thead>
                            <tbody>`;
            
            for (const v of filteredVisits) {
                // حساب متبقي الحركة الفردية لإظهار لونه حسب حالته (سالب أو موجب)
                const currentRemaining = (parseFloat(v.totalAmount) || 0) - (parseFloat(v.paidAmount) || 0);
                html += `
                    <tr>
                        <td>${v.date || '-'} ${v.time ? `<small class="text-muted">(${v.time})</small>` : ''}</td>
                        <td><strong>${v.patientName || 'مريض غير معروف'}</strong></td>
                        <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                        <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                        <td class="${currentRemaining < 0 ? 'text-danger' : 'text-success'} fw-bold">${currentRemaining}</td>
                    </tr>`;
            }
            
            html += `
                            </tbody>
                            <tfoot class="table-warning text-dark">
                                <tr>
                                    <td colspan="2"><strong>المجموع الكلي للحركات المالية</strong></td>
                                    <td><strong>${totalAmountSum.toFixed(2)} د.أ</strong></td>
                                    <td><strong>${paidAmountSum.toFixed(2)} د.أ</strong></td>
                                    <td><strong class="${remainingAmountSum < 0 ? 'text-danger' : 'text-success'}">${remainingAmountSum.toFixed(2)} د.أ</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>`;
        } else {
            html = '<div class="alert alert-warning">❌ لا توجد قيود مالية مسجلة خلال الفترة الزمنية المحددة</div>';
        }
    }
    document.getElementById('financeResult').innerHTML = html;
};

// ===================== بقية وظائف النظام المساعدة =====================
window.openEditPatientModal = function(id, name, age, phone, address) {
    document.getElementById('editPatientId').value = id;
    document.getElementById('editPatientName').value = name;
    document.getElementById('editPatientAge').value = age;
    document.getElementById('editPatientPhone').value = phone;
    document.getElementById('editPatientAddress').value = address;
    new bootstrap.Modal(document.getElementById('editPatientModal')).show();
};

window.savePatientEdit = async function() {
    const id = document.getElementById('editPatientId').value;
    const name = document.getElementById('editPatientName').value.trim();
    if (!name) { alert('⚠️ الاسم مطلوب'); return; }
    try {
        await update(ref(db, `patients/${id}`), {
            name: name, age: document.getElementById('editPatientAge').value.trim(),
            phone: document.getElementById('editPatientPhone').value.trim(),
            address: document.getElementById('editPatientAddress').value.trim()
        });
        bootstrap.Modal.getInstance(document.getElementById('editPatientModal'))?.hide();
    } catch (e) { alert('❌ فشل التحديث'); }
};

function updateAutocomplete() {
    ["#patientSearchInput", "#historySearchInput", "#financePatientSearch"].forEach(selector => {
        if (document.getElementById(selector.replace('#', ''))) {
            $(selector).autocomplete({
                source: patientNamesList,
                select: function(event, ui) {
                    $(selector).val(ui.item.value);
                    if (selector === "#patientSearchInput") document.getElementById('selectedPatientId').value = ui.item.id;
                    if (selector === "#historySearchInput") document.getElementById('historySelectedPatientId').value = ui.item.id;
                    if (selector === "#financePatientSearch") {
                        document.getElementById('financeSelectedPatientId').value = ui.item.id;
                        window.getFinancialReportAutocomplete();
                    }
                    return false;
                }
            });
        }
    });
}

window.addVisitWithAutocomplete = async function() {
    const patientId = document.getElementById('selectedPatientId').value;
    if (!patientId) { alert('⚠️ الرجاء اختيار مريض أولاً'); return; }
    const selectedPatient = allPatients.find(p => p.id === patientId);
    const now = new Date();
    
    const total = parseFloat(document.getElementById('totalAmount').value) || 0;
    const paid = parseFloat(document.getElementById('paidAmount').value) || 0;
    
    const visitData = {
        patientId: patientId, patientName: selectedPatient?.name || 'غير معروف',
        diagnosis: document.getElementById('diagnosis').value.trim(),
        treatment: document.getElementById('treatment').value.trim(),
        boxesCount: parseFloat(document.getElementById('boxesCount').value) || 0,
        totalAmount: total, paidAmount: paid, remainingAmount: total - paid,
        date: now.toLocaleDateString('ar-EG'), time: now.toLocaleTimeString('ar-EG'), timestamp: now.getTime()
    };
    
    try {
        await set(push(ref(db, 'visits')), visitData);
        ["patientSearchInput", "selectedPatientId", "diagnosis", "treatment", "totalAmount", "paidAmount", "remainingAmount"].forEach(id => document.getElementById(id).value = '');
        document.getElementById('boxesCount').value = '0';
        alert('✅ تم تسجيل الزيارة بنجاح');
    } catch (e) { alert('❌ فشل التسجيل'); }
};

window.searchMedicalHistoryAutocomplete = async () => {
    const patientId = document.getElementById('historySelectedPatientId').value;
    if (!patientId) { alert('⚠️ الرجاء تحديد مريض'); return; }
    const snapshot = await get(ref(db, 'visits'));
    const visits = snapshot.val();
    let html = '<div class="accordion" id="historyAccordion">', found = false;
    
    if (visits) {
        Object.keys(visits).forEach(key => {
            const v = visits[key];
            if (patientId === v.patientId) {
                found = true;
                html += `<div class="accordion-item mb-2">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${key}">
                            🩺 ${v.date} - إجمالي الإجراء: ${v.totalAmount || 0} د.أ
                        </button>
                    </h2>
                    <div id="collapse${key}" class="accordion-collapse collapse" data-bs-parent="#historyAccordion">
                        <div class="accordion-body">
                            <p><strong>التشخيص:</strong> ${v.diagnosis || '-'}</p>
                            <p><strong>العلاج:</strong> ${v.treatment || '-'}</p>
                            <p><strong>عدد العلب:</strong> ${v.boxesCount || 0}</p>
                            <div class="payment-details">
                                <p><strong>المبلغ الكامل:</strong> ${v.totalAmount || 0} د.أ</p>
                                <p><strong>المدفوع:</strong> ${v.paidAmount || 0} د.أ</p>
                                <p><strong>المتبقي:</strong> ${v.remainingAmount || 0} د.أ</p>
                            </div>
                            <button class="btn btn-sm btn-danger mt-2" onclick="window.deleteVisit('${key}')">حذف الزيارة</button>
                        </div>
                    </div>
                </div>`;
            }
        });
    }
    html += '</div>';
    document.getElementById('historyResult').innerHTML = found ? html : '<div class="alert alert-warning">❌ لا توجد زيارات سابقة</div>';
};

window.deleteVisit = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من الحذف؟')) {
        await remove(ref(db, `visits/${id}`));
        window.searchMedicalHistoryAutocomplete();
        window.getFinancialReportAutocomplete();
    }
};

window.deletePatient = async (id) => {
    if (confirm('🚨 هل أنت متأكد من حذف المريض وكافة حركاته وزياراته؟')) {
        await remove(ref(db, `patients/${id}`));
        const snap = await get(ref(db, 'visits'));
        if (snap.val()) {
            for (const vid of Object.keys(snap.val())) {
                if (snap.val()[vid].patientId === id) await remove(ref(db, `visits/${vid}`));
            }
        }
    }
};

// ===================== معالجة دمج الحسابات المكررة والمقترحات =====================
function initMergeAutocomplete() {
    $("#mergeMainPatientSearch").autocomplete({
        source: patientNamesList,
        select: function(event, ui) {
            document.getElementById('mergeMainPatientSearch').value = ui.item.value;
            document.getElementById('mergeMainPatientId').value = ui.item.id;
            document.getElementById('mergeMainPreview').innerHTML = `Selected Original ID: ${ui.item.id}`;
            enableMergeButtonIfReady(); return false;
        }
    });
    $("#mergeDuplicatePatientSearch").autocomplete({
        source: patientNamesList,
        select: function(event, ui) {
            document.getElementById('mergeDuplicatePatientSearch').value = ui.item.value;
            document.getElementById('mergeDuplicatePatientId').value = ui.item.id;
            document.getElementById('mergeDuplicatePreview').innerHTML = `Will Merge & Delete ID: ${ui.item.id}`;
            enableMergeButtonIfReady(); return false;
        }
    });
}

function enableMergeButtonIfReady() {
    const m = document.getElementById('mergeMainPatientId').value;
    const d = document.getElementById('mergeDuplicatePatientId').value;
    document.getElementById('mergeBtn').disabled = !(m && d && m !== d);
}

window.clearMergeSelection = function() {
    ["mergeMainPatientSearch", "mergeMainPatientId", "mergeDuplicatePatientSearch", "mergeDuplicatePatientId"].forEach(id => document.getElementById(id).value = '');
    document.getElementById('mergeMainPreview').innerHTML = '';
    document.getElementById('mergeDuplicatePreview').innerHTML = '';
    enableMergeButtonIfReady();
};

window.findDuplicatePatients = function() {
    const duplicates = [];
    const processed = new Set();
    for (let i = 0; i < allPatients.length; i++) {
        const p1 = allPatients[i]; if (processed.has(p1.id)) continue;
        const similar = [p1];
        for (let j = i + 1; j < allPatients.length; j++) {
            const p2 = allPatients[j];
            if ((p1.name?.trim() === p2.name?.trim()) || (p1.phone && p1.phone === p2.phone)) {
                similar.push(p2); processed.add(p2.id);
            }
        }
        if (similar.length > 1) duplicates.push(similar);
        processed.add(p1.id);
    }
    
    let html = '<ul>';
    duplicates.forEach((g, idx) => {
        html += `<li>Group ${idx+1}: ${g.map(p => p.name).join(' | ')} 
        <button class="btn btn-xs btn-warning" onclick='window.mergeSelectedFromGroup(${idx}, ${JSON.stringify(g)}, this)'>دمج الحسابات</button></li>`;
    });
    html += '</ul>';
    document.getElementById('duplicateSuggestionList').innerHTML = duplicates.length ? html : 'لا توجد تكرارات واضحة';
};

window.mergeSelectedFromGroup = async function(idx, group, btn) {
    const main = group[0];
    const dups = group.slice(1);
    try {
        const snap = await get(ref(db, 'visits'));
        if (snap.val()) {
            for (const [vid, vdata] of Object.entries(snap.val())) {
                if (dups.some(d => d.id === vdata.patientId)) {
                    await update(ref(db, `visits/${vid}`), { patientId: main.id, patientName: main.name });
                }
            }
        }
        for (const d of dups) { await remove(ref(db, `patients/${d.id}`)); }
        alert('✅ تم الدمج بنجاح');
        window.findDuplicatePatients();
    } catch (e) { alert('خطأ في الدمج'); }
};

window.clearAllPatientsData = async () => { if(confirm('⚠️ حذف الكل؟')) await remove(ref(db, 'patients')); };
window.clearAllVisitsData = async () => { if(confirm('⚠️ حذف الكل؟')) await remove(ref(db, 'visits')); };

// استعادة البريد الإلكتروني المحفوظ عند بدء التحميل
window.addEventListener('DOMContentLoaded', () => {
    if (getSavedEmail()) {
        document.getElementById('loginEmail').value = getSavedEmail();
        document.getElementById('saveEmailBtn').innerHTML = '<i class="fas fa-check-circle"></i>';
    }
});