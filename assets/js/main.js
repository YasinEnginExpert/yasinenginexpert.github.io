const themeBtn = document.getElementById('themeToken');
const htmlEl = document.documentElement;
const icon = themeBtn.querySelector('i');
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);
themeBtn.addEventListener('click', () => {
const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
htmlEl.setAttribute('data-theme', newTheme);
localStorage.setItem('theme', newTheme);
updateIcon(newTheme);
});
function updateIcon(theme) {
if (theme === 'dark') {
icon.classList.remove('fa-sun');
icon.classList.add('fa-moon');
} else {
icon.classList.remove('fa-moon');
icon.classList.add('fa-sun');
}
}
const copyBtn = document.getElementById('copyBtn');
const emailInput = document.getElementById('email-address');
copyBtn.addEventListener('click', () => {
emailInput.select();
emailInput.setSelectionRange(0, 99999); // Mobile compatibility
navigator.clipboard.writeText(emailInput.value).then(() => {
const originalText = copyBtn.textContent;
const currentLang = document.documentElement.lang;
copyBtn.textContent = currentLang === 'tr' ? 'Kopyalandı!' : 'Copied!';
copyBtn.style.background = '#10b981'; // Success green
setTimeout(() => {
copyBtn.textContent = originalText;
copyBtn.style.background = '';
}, 2000);
}).catch(err => {
console.error('Kopyalama başarısız:', err);
});
});
const translations = {
tr: {
nav_about: "Hakkında",
nav_projects: "Projeler",
nav_community: "Topluluk",
nav_library: "Kütüphane",
nav_contact: "İletişim",
location: "Samsun, Türkiye",
hero_title: 'Network & Wireless <br> <span class="highlight">Engineering</span>',
hero_bio: "Enterprise networking ve wireless teknolojilerde odaklıyım. Güvenli ve sürdürülebilir ağlar tasarlar, izleme/konfigürasyon işlerini otomasyonla sadeleştiririm.",
projects_title: "Öne Çıkan Projeler",
proj_ccna_desc: "Yapılandırma dosyaları, rehberler ve otomasyon scriptleri içeren Cisco CCNA laboratuvarları.",
proj_ccnp_desc: "Yapılandırma dosyaları, rehberler ve otomasyon scriptleri içeren CCNP notları ve laboratuvarları.",
proj_go_desc: "Go ile Ağ Programlama + güvenilir kaynaklardan pratik örnekler: soketler, HTTP, vb.",
proj_tolerex_desc: "Hata toleranslı dağıtık mesaj depolama; lider tabanlı replikasyon, gRPC.",
proj_ansible_desc: "Nokia SR Linux için Ansible + Containerlab ile modern model-driven spine–leaf laboratuvarı.",
proj_nexus_desc: "Go ile Production-grade Microservices Hub: Docker Swarm, RabbitMQ, gRPC, Caddy.",
view_repo: "Repo'yu İncele",
community_desc: "\"Herkes İçin Netreka!\" sloganıyla teknoloji eğitimleri.",
last_video: "Son Video:",
join_linkedin: "LinkedIn Grubuna Katıl",
contact_title: "Birlikte Çalışalım",
service_lab: "Lab Kurulum",
service_group: "Çalışma Grubu",
btn_copy: "Kopyala",
community_hero_title: "Topluluk Merkezi",
community_hero_desc: "Birlikte üretelim, paylaşalım ve geliştirelim. Fikirlerinizi sunun, takıldığınız yerde destek alın veya projenizi sergileyin.",
community_ideas: "Fikirler",
community_help: "Yardım",
community_showcase: "Vitrin",
section_ideas_title: "Proje Fikirleri",
section_help_title: "Yardım Bekleyenler",
section_showcase_title: "Proje Vitrini"
},
en: {
nav_about: "About",
nav_projects: "Projects",
nav_community: "Community",
nav_library: "Library",
nav_contact: "Contact",
location: "Samsun, Turkey",
hero_title: 'Network & Wireless <br> <span class="highlight">Engineering</span>',
hero_bio: "Focused on enterprise networking and wireless technologies. I design secure and sustainable networks and simplify monitoring/configuration via automation.",
projects_title: "Featured Projects",
proj_ccna_desc: "Cisco CCNA networking labs with configuration files, guides, and automation scripts.",
proj_ccnp_desc: "CCNP networking notes and labs with configuration files, guides, and automation scripts.",
proj_go_desc: "Network Programming with Go + practical examples from reliable sources: sockets, HTTP, etc.",
proj_tolerex_desc: "Fault-tolerant distributed message storage; leader-based replication, gRPC, configurable consistency.",
proj_ansible_desc: "Modern model-driven spine–leaf lab with Ansible + Containerlab for Nokia SR Linux.",
proj_nexus_desc: "Production-grade Microservices Hub in Go: Docker Swarm, RabbitMQ, gRPC, Caddy, Postgres + Mongo.",
view_repo: "View Repo",
community_desc: "Tech education with the slogan \"Netreka for Everyone!\"",
last_video: "Latest Video:",
join_linkedin: "Join LinkedIn Group",
contact_title: "Let's Work Together",
service_lab: "Lab Setup",
service_group: "Study Group",
btn_copy: "Copy Email",
community_hero_title: "Community Hub",
community_hero_desc: "Let's create, share, and grow together. Submit your ideas, get help when stuck, or showcase your project.",
community_ideas: "Ideas",
community_help: "Help",
community_showcase: "Showcase",
section_ideas_title: "Project Ideas",
section_help_title: "Help Wanted",
section_showcase_title: "Project Showcase"
}
};
const langToggle = document.getElementById('langToggle');
if (langToggle) {
langToggle.addEventListener('click', () => {
const currentLang = document.documentElement.lang;
const newLang = currentLang === 'tr' ? 'en' : 'tr';
document.documentElement.lang = newLang;
langToggle.textContent = newLang === 'tr' ? 'EN' : 'TR';
document.querySelectorAll('[data-i18n]').forEach(el => {
const key = el.getAttribute('data-i18n');
if (translations[newLang][key]) {
if (key === 'hero_title' || key === 'hero_bio') {
el.innerHTML = translations[newLang][key];
} else {
el.textContent = translations[newLang][key];
}
}
});
});
}
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('keydown', function (event) {
if (event.key === 'F12' ||
(event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
(event.ctrlKey && event.key === 'u')) {
event.preventDefault();
console.warn("%cSTOP!", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px black;");
console.warn("%cThis is a protected system. Access denied.", "color: white; font-size: 20px; background: red; padding: 5px; border-radius: 5px;");
}
});
console.log("Portfolio ready. 🚀");