// ===================== إعداد Firebase =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
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

// ===================== قائمة البريد الإلكتروني للأدمن =====================
const ADMIN_EMAILS = [
    "admin@clinic.com"
];

// ===================== متغيرات المصادقة =====================
let currentUser = null;

// ===================== المتغيرات العامة =====================
let allPatients = [];
let patientNamesList = [];

// ===================== دالة التحقق من صلاحية الأدمن =====================
function isCurrentUserAdmin() {
    return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}

// ===================== مراقبة حالة تسجيل الدخول =====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const isAdmin = isCurrentUserAdmin();
        
        console.log(`✅ مستخدم مسجل الدخول: ${user.email}`);
        console.log(`👑 صلاحية الأدمن: ${isAdmin ? "نعم" : "لا"}`);
        
        // إظهار عناصر المستخدم المسجل
        const loginContainer = document.getElementById('loginContainer');
        const appContent = document.getElementById('appContent');
        const topButtons = document.getElementById('topButtons');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const tabs = document.querySelector('.nav-tabs');
        const tabContent = document.querySelector('.tab-content');
        
        if (loginContainer) loginContainer.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
        if (topButtons) topButtons.style.display = 'flex';
        if (welcomeMessage) welcomeMessage.style.display = 'block';
        if (tabs) tabs.style.display = 'flex';
        if (tabContent) tabContent.style.display = 'block';
        
        // عرض اسم المستخدم
        const userNameSpan = document.getElementById('userNameDisplay');
        if (userNameSpan) {
            const displayName = user.email.split('@')[0];
            userNameSpan.textContent = `مرحباً ${displayName}`;
        }
        
        // تطبيق صلاحيات الأدمن
        applyPermissionsBasedOnRole();
        
        // تحميل البيانات
        loadPatientsList();
    } else {
        currentUser = null;
        console.log("❌ لا يوجد مستخدم مسجل الدخول");
        
        // إظهار شاشة تسجيل الدخول
        const loginContainer = document.getElementById('loginContainer');
        const appContent = document.getElementById('appContent');
        const topButtons = document.getElementById('topButtons');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const tabs = document.querySelector('.nav-tabs');
        const tabContent = document.querySelector('.tab-content');
        
        if (loginContainer) loginContainer.style.display = 'flex';
        if (appContent) appContent.style.display = 'none';
        if (topButtons) topButtons.style.display = 'none';
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (tabs) tabs.style.display = 'none';
        if (tabContent) tabContent.style.display = 'none';
    }
});

// ===================== تطبيق الصلاحيات حسب دور المستخدم =====================
function applyPermissionsBasedOnRole() {
    const isAdmin = isCurrentUserAdmin();
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    adminOnlyElements.forEach(el => {
        if (isAdmin) {
            el.style.display = '';
            if (el.classList.contains('nav-link')) {
                const parentItem = el.closest('.nav-item');
                if (parentItem) parentItem.style.display = '';
            }
        } else {
            el.style.display = 'none';
            if (el.classList.contains('nav-link')) {
                const parentItem = el.closest('.nav-item');
                if (parentItem) parentItem.style.display = 'none';
            }
        }
    });
}

// ===================== حفظ البريد الإلكتروني =====================
function saveEmailToLocalStorage(email) {
    if (email) {
        localStorage.setItem('savedEmail', email);
    }
}

function getSavedEmail() {
    return localStorage.getItem('savedEmail') || '';
}

// ===================== وظائف تسجيل الدخول =====================
window.toggleSaveEmail = function() {
    const emailInput = document.getElementById('loginEmail');
    const saveBtn = document.getElementById('saveEmailBtn');
    const email = emailInput.value.trim();
    
    if (email) {
        saveEmailToLocalStorage(email);
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
    
    if (!email || !password) {
        messageDiv.textContent = '⚠️ الرجاء إدخال البريد الإلكتروني وكلمة المرور';
        return;
    }
    
    try {
        messageDiv.textContent = '⏳ جاري تسجيل الدخول...';
        await signInWithEmailAndPassword(auth, email, password);
        messageDiv.textContent = '✅ تم تسجيل الدخول بنجاح!';
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            messageDiv.textContent = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (error.code === 'auth/invalid-email') {
            messageDiv.textContent = '❌ البريد الإلكتروني غير صالح';
        } else {
            messageDiv.textContent = '❌ حدث خطأ: ' + error.message;
        }
    }
};

window.logoutUser = async function() {
    try {
        await signOut(auth);
        alert('👋 تم تسجيل الخروج بنجاح');
        location.reload();
    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ أثناء تسجيل الخروج');
    }
};

// ===================== إعدادات الأدمن =====================
window.openSettings = function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصفحة متاحة فقط للأدمن');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    modal.show();
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('createUserMessage').textContent = '';
};

window.createNewUserByAdmin = async function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const messageDiv = document.getElementById('createUserMessage');
    
    if (!email || !password) {
        messageDiv.textContent = '⚠️ الرجاء ملء جميع الحقول';
        messageDiv.style.color = 'red';
        return;
    }
    
    if (password.length < 6) {
        messageDiv.textContent = '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        messageDiv.style.color = 'red';
        return;
    }
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        messageDiv.textContent = '✅ تم إنشاء الحساب بنجاح!';
        messageDiv.style.color = 'green';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPassword').value = '';
        
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            messageDiv.textContent = '❌ هذا البريد الإلكتروني مسجل بالفعل';
        } else if (error.code === 'auth/invalid-email') {
            messageDiv.textContent = '❌ البريد الإلكتروني غير صالح';
        } else if (error.code === 'auth/weak-password') {
            messageDiv.textContent = '❌ كلمة المرور ضعيفة جداً';
        } else {
            messageDiv.textContent = '❌ حدث خطأ: ' + error.message;
        }
        messageDiv.style.color = 'red';
    }
};

// ===================== دالة تحويل التاريخ =====================
function parseExcelDate(excelDateValue) {
    if (!excelDateValue) return new Date().toLocaleDateString('ar-EG');
    let dateStr = String(excelDateValue).trim();
    if (dateStr.includes('-')) return dateStr.replace(/-/g, '/');
    if (dateStr.includes('/')) return dateStr;
    const num = parseFloat(excelDateValue);
    if (!isNaN(num)) {
        const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    }
    return dateStr;
}

// ===================== تحديث قائمة المرضى =====================
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
                    label: `${p.name} ${p.age ? `(${p.age} سنة)` : ''} ${p.phone ? `📞 ${p.phone}` : ''}`,
                    value: p.name,
                    id: p.id,
                    phone: p.phone,
                    address: p.address,
                    age: p.age
                });
            });
        }
        
        displayPatientsList();
        updateAutocomplete();
    });
}

// ===================== عرض قائمة المرضى (بشكل صحيح) =====================
function displayPatientsList(searchTerm = '') {
    let filteredPatients = allPatients;
    if (searchTerm) {
        filteredPatients = allPatients.filter(p => 
            p.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // إنشاء الجدول بشكل صحيح مع أعمدة منفصلة
    let html = `
        <table class="table table-bordered table-hover">
            <thead>
                <tr>
                    <th style="background: var(--table-header); color: white; padding: 12px;">#</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">الاسم</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">العمر</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">الجوال</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">العنوان</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">تاريخ التسجيل</th>
                    <th style="background: var(--table-header); color: white; padding: 12px;">إجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let index = 1;
    if (filteredPatients.length > 0) {
        filteredPatients.forEach(p => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">${index++}</td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);"><strong>${p.name || '-'}</strong></td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">${p.age || '-'}</td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">${p.phone || '-'}</td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">${p.address || '-'}</td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">${p.createdAt || '-'}</td>
                    <td style="padding: 10px; border: 1px solid var(--border-color);">
                        <button class="btn btn-sm btn-danger" onclick="window.deletePatient('${p.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="7" style="padding: 10px; text-align: center;">لا يوجد مرضى مسجلين</td></tr>`;
    }
    
    html += `</tbody></table>`;
    document.getElementById('patientsList').innerHTML = html;
}

window.filterPatients = function() {
    displayPatientsList(document.getElementById('searchPatient').value);
};

// ===================== تحديث الـ Autocomplete =====================
function updateAutocomplete() {
    if (document.getElementById('patientSearchInput')) {
        $("#patientSearchInput").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('patientSearchInput').value = ui.item.value;
                document.getElementById('selectedPatientId').value = ui.item.id;
                return false;
            }
        });
    }
    
    if (document.getElementById('historySearchInput')) {
        $("#historySearchInput").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('historySearchInput').value = ui.item.value;
                document.getElementById('historySelectedPatientId').value = ui.item.id;
                return false;
            }
        });
    }
    
    if (document.getElementById('financePatientSearch')) {
        $("#financePatientSearch").autocomplete({
            source: patientNamesList,
            select: function(event, ui) {
                document.getElementById('financePatientSearch').value = ui.item.value;
                document.getElementById('financeSelectedPatientId').value = ui.item.id;
                window.getFinancialReportAutocomplete();
                return false;
            }
        });
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
        age: document.getElementById('patientAge').value.trim(),
        phone: document.getElementById('patientPhone').value.trim(),
        address: document.getElementById('patientAddress').value.trim(),
        createdAt: new Date().toLocaleDateString('ar-EG')
    };
    
    try {
        await set(newPatientRef, patientData);
        document.getElementById('patientName').value = '';
        document.getElementById('patientAge').value = '';
        document.getElementById('patientPhone').value = '';
        document.getElementById('patientAddress').value = '';
        alert('✅ تم إضافة المريض بنجاح');
    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ أثناء الإضافة');
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
            console.error(error);
            alert('❌ حدث خطأ أثناء الحذف');
        }
    }
};

// ===================== إضافة زيارة =====================
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
    const boxesCount = parseFloat(document.getElementById('boxesCount').value) || 0;
    
    const newVisitRef = push(ref(db, 'visits'));
    const visitData = {
        patientId: patientId,
        patientName: selectedPatient?.name || 'غير معروف',
        diagnosis: document.getElementById('diagnosis').value.trim(),
        treatment: document.getElementById('treatment').value.trim(),
        boxesCount: boxesCount,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
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
        document.getElementById('boxesCount').value = '0';
        document.getElementById('totalAmount').value = '';
        document.getElementById('paidAmount').value = '';
        document.getElementById('remainingAmount').value = '';
        alert('✅ تم تسجيل الزيارة بنجاح!');
    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ أثناء تسجيل الزيارة');
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
                const remainingClass = v.remainingAmount < 0 ? 'text-danger' : 'text-success';
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
                            <p><strong><i class="fas fa-boxes"></i> عدد العلب:</strong> ${v.boxesCount || 0}</p>
                            <div class="payment-details">
                                <p><strong><i class="fas fa-dollar-sign"></i> المبلغ الكامل:</strong> ${v.totalAmount || 0} د.أ</p>
                                <p><strong><i class="fas fa-money-bill"></i> المبلغ المدفوع:</strong> ${v.paidAmount || 0} د.أ</p>
                                <p><strong><i class="fas fa-credit-card"></i> المبلغ المتبقي:</strong> <span class="${remainingClass}">${v.remainingAmount || 0} د.أ</span></p>
                            </div>
                            <p><strong><i class="fas fa-clock"></i> الوقت:</strong> ${v.time || '-'}</p>
                            <button class="btn btn-sm btn-danger" onclick="window.deleteVisit('${key}')"><i class="fas fa-trash"></i> حذف الزيارة</button>
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

window.deleteVisit = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الزيارة؟')) {
        try {
            await remove(ref(db, `visits/${id}`));
            alert('🗑️ تم حذف الزيارة');
            window.searchMedicalHistoryAutocomplete();
            window.getFinancialReportAutocomplete();
        } catch (error) {
            console.error(error);
        }
    }
};

// ===================== التقارير المالية =====================
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
            
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);
            
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
                totalAmountSum += parseFloat(v.totalAmount) || 0;
                paidAmountSum += parseFloat(v.paidAmount) || 0;
                remainingAmountSum += parseFloat(v.remainingAmount) || 0;
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
                    <div class="stat-card mb-4">
                        <i class="fas fa-user-md fs-3"></i>
                        <h4>كشف حساب المريض: ${targetName}</h4>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr><th>التاريخ</th><th>التشخيص</th><th>العلاج</th><th>عدد العلب</th><th>الكامل (د.أ)</th><th>المدفوع (د.أ)</th><th>المتبقي (د.أ)</th></tr>
                            </thead>
                            <tbody>`;
            
            for (const v of filteredVisits) {
                const remainingClass = v.remainingAmount < 0 ? 'text-danger' : 'text-success';
                html += `<tr>
                    <td>${v.date || '-'}</td>
                    <td>${v.diagnosis || '-'}</td>
                    <td>${v.treatment || '-'}</td>
                    <td>${v.boxesCount || 0}</td>
                    <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                    <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                    <td class="${remainingClass} fw-bold">${v.remainingAmount || 0}</td>
                </tr>`;
            }
            
            html += `</tbody>
                    <tfoot class="table-info">
                        <tr><td colspan="4"><strong>الإجمالي</strong></td>
                        <td><strong>${totalAmountSum} د.أ</strong></td>
                        <td><strong>${paidAmountSum} د.أ</strong></td>
                        <td><strong class="${remainingAmountSum < 0 ? 'text-danger' : 'text-success'}">${remainingAmountSum} د.أ</strong></td>
                    </tr></tfoot>
                </table>
                    </div>
                </div>`;
        } else {
            html = '<div class="alert alert-warning">❌ لا توجد زيارات لهذا المريض في الفترة المحددة</div>';
        }
    } else {
        const remainingClass = remainingAmountSum < 0 ? 'text-danger' : 'text-success';
        html = `
            <div class="animate__animated animate__fadeIn">
                <div class="total-box">
                    <h4><i class="fas fa-chart-line"></i> التقرير المالي العام</h4>
                    <div class="row mt-4">
                        <div class="col-md-4"><h3><i class="fas fa-dollar-sign"></i> إجمالي الإيرادات: ${totalAmountSum} د.أ</h3></div>
                        <div class="col-md-4"><h3><i class="fas fa-money-bill"></i> المدفوع: ${paidAmountSum} د.أ</h3></div>
                        <div class="col-md-4"><h3><i class="fas fa-credit-card"></i> المتبقي: <span class="${remainingClass}">${remainingAmountSum} د.أ</span></h3></div>
                    </div>
                    <hr>
                    <div class="row mt-3">
                        <div class="col-md-6"><p><i class="fas fa-chart-simple"></i> عدد الزيارات: ${filteredVisits.length}</p></div>
                        <div class="col-md-6"><p><i class="fas fa-chart-line"></i> نسبة التحصيل: ${collectionRate}%</p></div>
                    </div>
                    <div class="custom-progress mt-2"><div class="custom-progress-bar" style="width: ${collectionRate}%;">${collectionRate}%</div></div>
                </div>
            </div>`;
    }
    document.getElementById('financeResult').innerHTML = html;
};

// ===================== حذف جميع المرضى (للأدمن فقط) =====================
window.clearAllPatientsData = async () => {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    if (confirm('🚨 هل أنت متأكد من حذف جميع المرضى؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        try {
            await remove(ref(db, 'patients'));
            alert('✅ تم حذف جميع المرضى');
        } catch (error) {
            alert('❌ حدث خطأ: ' + error.message);
        }
    }
};

// ===================== حذف جميع الزيارات (للأدمن فقط) =====================
window.clearAllVisitsData = async () => {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    if (confirm('🚨 هل أنت متأكد من حذف جميع الزيارات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        try {
            await remove(ref(db, 'visits'));
            alert('✅ تم حذف جميع الزيارات');
            if(document.getElementById('historyResult')) document.getElementById('historyResult').innerHTML = '';
        } catch (error) {
            alert('❌ حدث خطأ: ' + error.message);
        }
    }
};

// ===================== دوال Excel (للأدمن فقط) =====================
window.downloadTemplate = function(type) {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    let headers = [];
    let filename = "";
    if (type === "patients") {
        headers = [["الاسم", "العمر", "الجوال", "العنوان"]];
        filename = "قالب_استيراد_المرضى.xlsx";
    } else if (type === "visits") {
        headers = [["اسم المريض", "التشخيص", "العلاج", "عدد العلب", "المبلغ الكامل", "المبلغ المدفوع", "التاريخ"]];
        filename = "قالب_استيراد_الزيارات.xlsx";
    }
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
};

window.importPatientsExcel = function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    const fileInput = document.getElementById('excelPatientsFile');
    if (!fileInput.files.length) { return alert("⚠️ الرجاء اختيار ملف Excel أولاً"); }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            let count = 0;
            for (const row of json) {
                const name = row["الاسم"]?.toString().trim();
                if (!name) continue;
                
                const newPatientRef = push(ref(db, 'patients'));
                await set(newPatientRef, {
                    name: name,
                    age: row["العمر"]?.toString().trim() || "",
                    phone: row["الجوال"]?.toString().trim() || "",
                    address: row["العنوان"]?.toString().trim() || "",
                    createdAt: new Date().toLocaleDateString('ar-EG')
                });
                count++;
            }
            alert(`✅ تم استيراد عدد ${count} مريض بنجاح إلى قاعدة البيانات!`);
            fileInput.value = "";
        } catch (err) {
            alert("❌ حدث خطأ أثناء قراءة الملف: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
};

window.importVisitsExcel = async function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    const fileInput = document.getElementById('excelVisitsFile');
    if (!fileInput.files.length) { return alert("⚠️ الرجاء اختيار ملف التاريخ الطبي Excel أولاً"); }
    
    try {
        const patientsSnapshot = await get(ref(db, 'patients'));
        const currentPatientsData = patientsSnapshot.val() || {};
        const currentPatientsList = Object.keys(currentPatientsData).map(k => ({ id: k, name: currentPatientsData[k].name }));
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const json = XLSX.utils.sheet_to_json(worksheet, { raw: true });
            
            let count = 0;
            const now = new Date();
            
            for (const row of json) {
                const pName = row["اسم المريض"]?.toString().trim();
                if (!pName) continue;
                
                let matchPatient = currentPatientsList.find(p => p.name.toLowerCase() === pName.toLowerCase());
                let targetId = "";
                
                if (matchPatient) {
                    targetId = matchPatient.id;
                } else {
                    const newPRef = push(ref(db, 'patients'));
                    await set(newPRef, { name: pName, age: "", phone: "", address: "", createdAt: new Date().toLocaleDateString('ar-EG') });
                    targetId = newPRef.key;
                    currentPatientsList.push({ id: targetId, name: pName });
                }
                
                const total = parseFloat(row["المبلغ الكامل"]) || 0;
                const paid = parseFloat(row["المبلغ المدفوع"]) || 0;
                const remaining = total - paid;
                const boxesCount = parseFloat(row["عدد العلب"]) || 0;
                
                const structuredDate = parseExcelDate(row["التاريخ"]);
                
                const newVisitRef = push(ref(db, 'visits'));
                await set(newVisitRef, {
                    patientId: targetId,
                    patientName: pName,
                    diagnosis: row["التشخيص"]?.toString().trim() || "-",
                    treatment: row["العلاج"]?.toString().trim() || "-",
                    boxesCount: boxesCount,
                    totalAmount: total,
                    paidAmount: paid,
                    remainingAmount: remaining,
                    date: structuredDate,
                    time: now.toLocaleTimeString('ar-EG'),
                    timestamp: now.getTime()
                });
                count++;
            }
            alert(`✅ تم استيراد وتحديث عدد ${count} سجل زيارة طبي بنجاح!`);
            fileInput.value = "";
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        alert("❌ حدث خطأ: " + err.message);
    }
};

window.exportPatientsToExcel = function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    if (!allPatients.length) return alert("❌ لا توجد بيانات مرضى لتصديرها");
    
    const dataRows = allPatients.map(p => ({
        "الاسم": p.name || "",
        "العمر": p.age || "",
        "الجوال": p.phone || "",
        "العنوان": p.address || "",
        "تاريخ التسجيل": p.createdAt || ""
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المرضى");
    XLSX.writeFile(wb, `قائمة_المرضى_الكلية_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};

window.exportVisitsToExcel = async function() {
    if (!isCurrentUserAdmin()) {
        alert('⚠️ هذه الصلاحية متاحة فقط للأدمن');
        return;
    }
    
    try {
        const visitsRef = ref(db, 'visits');
        const snapshot = await get(visitsRef);
        const visits = snapshot.val();
        
        if (!visits) return alert("❌ لا توجد بيانات زيارات لتصديرها حالياً");
        
        const dataRows = Object.keys(visits).map(key => {
            const v = visits[key];
            return {
                "اسم المريض": v.patientName || "",
                "التشخيص": v.diagnosis || "",
                "العلاج": v.treatment || "",
                "عدد العلب": v.boxesCount || 0,
                "المبلغ الكامل": v.totalAmount || 0,
                "المبلغ المدفوع": v.paidAmount || 0,
                "المبلغ المتبقي": v.remainingAmount || 0,
                "التاريخ": v.date || "",
                "الوقت": v.time || ""
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "التاريخ الطبي");
        XLSX.writeFile(wb, `التاريخ_الطبي_والزيارات_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
    } catch (err) {
        alert("❌ فشل التصدير: " + err.message);
    }
};

// استعادة البريد الإلكتروني المحفوظ
window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
        const emailInput = document.getElementById('loginEmail');
        const saveBtn = document.getElementById('saveEmailBtn');
        if (emailInput) emailInput.value = savedEmail;
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
    }
});