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

// ===================== متغيرات المصادقة =====================
let currentUser = null;

// ===================== المتغيرات العامة =====================
let allPatients = [];
let patientNamesList = [];

// ===================== مراقبة حالة تسجيل الدخول =====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log(`✅ مستخدم مسجل الدخول: ${user.email}`);
        showAppContent(true);
        loadPatientsList();
    } else {
        currentUser = null;
        console.log("❌ لا يوجد مستخدم مسجل الدخول");
        showAppContent(false);
        showLoginScreen();
    }
});

// ===================== عرض/إخفاء محتوى التطبيق =====================
function showAppContent(isLoggedIn) {
    const tabs = document.querySelector('.nav-tabs');
    const tabContent = document.querySelector('.tab-content');
    const loginSection = document.getElementById('loginSection');
    const appContent = document.getElementById('appContent');
    
    if (isLoggedIn) {
        if (loginSection) loginSection.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
        if (tabs) tabs.style.display = 'flex';
        if (tabContent) tabContent.style.display = 'block';
    } else {
        if (loginSection) loginSection.style.display = 'flex';
        if (appContent) appContent.style.display = 'none';
        if (tabs) tabs.style.display = 'none';
        if (tabContent) tabContent.style.display = 'none';
    }
}

// ===================== شاشة تسجيل الدخول =====================
function showLoginScreen() {
    if (document.getElementById('loginSection')) return;
    
    const mainCard = document.querySelector('.main-card');
    const loginHTML = `
        <div id="loginSection" style="display: flex; justify-content: center; align-items: center; min-height: 500px; padding: 40px;">
            <div style="background: var(--card-bg); border-radius: 30px; padding: 40px; max-width: 400px; width: 100%; text-align: center; box-shadow: var(--shadow);">
                <i class="fas fa-lock" style="font-size: 60px; color: var(--nav-active); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 25px; color: var(--text-color);">تسجيل الدخول إلى النظام</h3>
                
                <div class="mb-3">
                    <input type="email" id="loginEmail" class="form-control" placeholder="البريد الإلكتروني" style="border-radius: 25px; padding: 12px;">
                </div>
                <div class="mb-3">
                    <input type="password" id="loginPassword" class="form-control" placeholder="كلمة المرور" style="border-radius: 25px; padding: 12px;">
                </div>
                
                <button onclick="window.loginWithEmail()" class="btn btn-primary w-100 mb-3" style="border-radius: 25px; padding: 12px;">
                    <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                </button>
                
                <hr style="margin: 20px 0;">
                
                <button onclick="window.showRegisterForm()" class="btn btn-outline-secondary w-100" style="border-radius: 25px; padding: 12px;">
                    <i class="fas fa-user-plus"></i> إنشاء حساب جديد
                </button>
                
                <div id="loginMessage" class="mt-3 text-danger small"></div>
            </div>
        </div>
    `;
    
    const header = document.querySelector('.custom-header');
    header.insertAdjacentHTML('afterend', loginHTML);
    
    const tabs = document.querySelector('.nav-tabs');
    const tabContent = document.querySelector('.tab-content');
    if (tabs) tabs.style.display = 'none';
    if (tabContent) tabContent.style.display = 'none';
}

// ===================== وظائف المصادقة =====================
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
        messageDiv.textContent = '✅ تم تسجيل الدخول بنجاح! جاري تحميل النظام...';
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

window.showRegisterForm = function() {
    const loginSection = document.getElementById('loginSection');
    loginSection.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 30px; padding: 40px; max-width: 400px; width: 100%; text-align: center; box-shadow: var(--shadow);">
            <i class="fas fa-user-plus" style="font-size: 60px; color: var(--nav-active); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 25px; color: var(--text-color);">إنشاء حساب جديد</h3>
            
            <div class="mb-3">
                <input type="email" id="registerEmail" class="form-control" placeholder="البريد الإلكتروني" style="border-radius: 25px; padding: 12px;">
            </div>
            <div class="mb-3">
                <input type="password" id="registerPassword" class="form-control" placeholder="كلمة المرور (6 أحرف على الأقل)" style="border-radius: 25px; padding: 12px;">
            </div>
            <div class="mb-3">
                <input type="password" id="confirmPassword" class="form-control" placeholder="تأكيد كلمة المرور" style="border-radius: 25px; padding: 12px;">
            </div>
            
            <button onclick="window.registerNewUser()" class="btn btn-success w-100 mb-3" style="border-radius: 25px; padding: 12px;">
                <i class="fas fa-check"></i> إنشاء حساب
            </button>
            
            <button onclick="window.showLoginForm()" class="btn btn-outline-secondary w-100" style="border-radius: 25px; padding: 12px;">
                <i class="fas fa-arrow-right"></i> العودة إلى تسجيل الدخول
            </button>
            
            <div id="registerMessage" class="mt-3 text-danger small"></div>
        </div>
    `;
};

window.showLoginForm = function() {
    location.reload();
};

window.registerNewUser = async function() {
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('registerMessage');
    
    if (!email || !password) {
        messageDiv.textContent = '⚠️ الرجاء ملء جميع الحقول';
        return;
    }
    
    if (password !== confirmPassword) {
        messageDiv.textContent = '⚠️ كلمة المرور وتأكيدها غير متطابقتين';
        return;
    }
    
    if (password.length < 6) {
        messageDiv.textContent = '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        return;
    }
    
    try {
        messageDiv.textContent = '⏳ جاري إنشاء الحساب...';
        await createUserWithEmailAndPassword(auth, email, password);
        messageDiv.textContent = '✅ تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...';
        setTimeout(() => {
            location.reload();
        }, 1500);
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

// ===================== دالة التحويل الذكية والمطورة للتواريخ =====================
function parseExcelDate(excelDateValue) {
    if (!excelDateValue) return new Date().toLocaleDateString('ar-EG');
    
    let dateStr = String(excelDateValue).trim();
    
    if (dateStr.includes('-')) {
        return dateStr.replace(/-/g, '/');
    }
    
    if (dateStr.includes('/')) {
        return dateStr;
    }
    
    const num = parseFloat(excelDateValue);
    if (!isNaN(num)) {
        const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    return dateStr;
}

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

// ===================== إضافة مريض جديد يدوياً =====================
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
    } catch (error) {
        console.error(error);
    }
};

// ===================== حذف مريض مفرد =====================
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
        }
    }
};

// ===================== إضافة زيارة يدوياً =====================
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
        console.error(error);
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
                    <td>${v.diagnosis || '-'}</td>
                    <td class="text-primary fw-bold">${v.totalAmount || 0}</td>
                    <td class="text-success fw-bold">${v.paidAmount || 0}</td>
                    <td class="text-danger fw-bold">${v.remainingAmount || 0}</td>
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
            </div>`;
        } else {
            html = '<div class="alert alert-warning">❌ لا توجد زيارات لهذا المريض في الفترة المحددة</div>';
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
                </div>
            </div>`;
    }
    document.getElementById('financeResult').innerHTML = html;
};

// ===================== بوابات حماية الحذف الشامل (معدلة) =====================
window.clearAllPatientsData = async () => {
    if (!currentUser) {
        alert('⚠️ يجب تسجيل الدخول أولاً');
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

window.clearAllVisitsData = async () => {
    if (!currentUser) {
        alert('⚠️ يجب تسجيل الدخول أولاً');
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

// ===================== محرك تحميل وتصدير ملفات Excel =====================
window.downloadTemplate = function(type) {
    let headers = [];
    let filename = "";
    if (type === "patients") {
        headers = [["الاسم", "الجوال", "العنوان"]];
        filename = "قالب_استيراد_المرضى.xlsx";
    } else if (type === "visits") {
        headers = [["اسم المريض", "التشخيص", "العلاج", "المبلغ الكامل", "المبلغ المدفوع", "التاريخ"]];
        filename = "قالب_استيراد_الزيارات.xlsx";
    }
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
};

window.importPatientsExcel = function() {
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
                    await set(newPRef, { name: pName, phone: "", address: "", createdAt: new Date().toLocaleDateString('ar-EG') });
                    targetId = newPRef.key;
                    currentPatientsList.push({ id: targetId, name: pName });
                }
                
                const total = parseFloat(row["المبلغ الكامل"]) || 0;
                const paid = parseFloat(row["المبلغ المدفوع"]) || 0;
                const remaining = total - paid;
                
                const structuredDate = parseExcelDate(row["التاريخ"]);
                
                const newVisitRef = push(ref(db, 'visits'));
                await set(newVisitRef, {
                    patientId: targetId,
                    patientName: pName,
                    diagnosis: row["التشخيص"]?.toString().trim() || "-",
                    treatment: row["العلاج"]?.toString().trim() || "-",
                    totalAmount: total,
                    paidAmount: paid,
                    remainingAmount: remaining >= 0 ? remaining : 0,
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
    if (!allPatients.length) return alert("❌ لا توجد بيانات مرضى لتصديرها");
    
    const dataRows = allPatients.map(p => ({
        "الاسم": p.name || "",
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

// ===================== تحميل البيانات البدئي =====================
// تم نقل loadPatientsList() داخل onAuthStateChanged