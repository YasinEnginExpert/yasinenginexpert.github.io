const htmlEl = document.documentElement;
const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
const themeBtn = document.getElementById('themeToken');
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', currentTheme);
if (themeBtn) {
    const icon = themeBtn.querySelector('i');
    const updateIcon = (theme) => {
        if (!icon) return;
        if (theme === 'dark') {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    };

    updateIcon(currentTheme);
    themeBtn.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });
}
const copyBtn = document.getElementById('copyBtn');
const emailInput = document.getElementById('email-address');
if (copyBtn && emailInput) {
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
}
const LATEST_VIDEO_ID = "dQw4w9WgXcQ"; // PLEASE UPDATE THIS ID TO YOUR LATEST VIDEO ID

const translations = {
    tr: {
        nav_about: "Hakkında",
        nav_projects: "Projeler",
        nav_community: "Topluluk",
        nav_library: "Kütüphane",
        nav_game: "Oyna (Beta)",
        nav_contact: "İletişim",
        location: "Samsun, Türkiye",
        hero_kicker: "Yasin Engin — Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Bilgisayar Mühendisliği öğrencisi. Go, gRPC, dağıtık sistemler ve SDN odaklı production-grade backend sistemleri ve network otomasyon araçları geliştiriyorum.",
        projects_title: "Öne Çıkan Projeler (Featured)",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Lider–üye, mTLS gRPC, heartbeat hata tespiti, disk kalıcılığı, metrikler/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab ve gNMI tabanlı otomasyon iş akışları.",
        proj_go_desc: "Go ile ağ protokolleri, soketler ve HTTP sunucuları uygulamaları.",
        proj_restapi_desc: "REST API tabanlı backend servis; temiz routing, doğrulama ve JSON yanıtları.",
        proj_cisco_desc: "Cisco sertifikaları için kapsamlı çalışma notları, lab yapılandırmaları ve otomasyon scriptleri.",
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
        nav_game: "Play (Beta)",
        nav_contact: "Contact",
        location: "Samsun, Turkey",
        hero_kicker: "Yasin Engin — Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Computer Engineering student building production-grade backend systems and network automation tools. Focused on Go, gRPC, distributed systems, and SDN.",
        projects_title: "Featured Projects",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Leader–member, mTLS gRPC, heartbeat failure detection, disk persistence, metrics/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab, and gNMI based automation workflows.",
        proj_go_desc: "Implementation of network protocols, sockets, and HTTP servers using Go.",
        proj_restapi_desc: "REST API backend service with clean routing, validation, and JSON responses.",
        proj_cisco_desc: "Comprehensive study notes, lab configurations, and automation scripts for Cisco certifications.",
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

// Update YouTube Link on Load
document.addEventListener('DOMContentLoaded', () => {
    const videoLink = document.getElementById('latest-video-link');
    if (videoLink) {
        videoLink.href = `https://www.youtube.com/watch?v=${LATEST_VIDEO_ID}`;
        // Optionally update text if you want dynamic titles, but for now specific ID link is enough
        // videoLink.textContent = "Watch Latest Video"; 
    }
});
const langToggle = document.getElementById('langToggle');
const setLanguage = (newLang) => {
    if (!translations[newLang]) return;
    document.documentElement.lang = newLang;
    localStorage.setItem('selectedLanguage', newLang);
    if (langToggle) {
        langToggle.textContent = newLang === 'tr' ? 'EN' : 'TR';
    }
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
};

const storedLang = localStorage.getItem('selectedLanguage');
setLanguage((storedLang && translations[storedLang]) ? storedLang : (document.documentElement.lang || 'tr'));

if (langToggle) {
    langToggle.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'tr' ? 'en' : 'tr';
        setLanguage(newLang);
    });
}
// Mobile Menu Logic
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        const isActive = navLinks.classList.toggle('active');
        mobileBtn.setAttribute('aria-expanded', String(isActive));
        // Toggle icon between bars and times (X)
        const icon = mobileBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileBtn.setAttribute('aria-expanded', 'false');
            const icon = mobileBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
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
console.log("Portfolio ready.");

/* -----------------------------------------------------------
   COMMAND PALETTE (CTRL+K) LOGIC
   ----------------------------------------------------------- */
const cmdk = document.getElementById("cmdk");
const cmdkInput = document.getElementById("cmdkInput");
const cmdkCloseBtn = document.getElementById("cmdkClose");

if (cmdk && cmdkInput && cmdkCloseBtn && !isMobileLite) {
    cmdkCloseBtn.addEventListener("click", () => cmdk.close());

    const actions = [
        { key: "github", run: () => window.open("https://github.com/YasinEnginn", "_blank", "noopener") },
        { key: "linkedin", run: () => window.open("https://www.linkedin.com/in/yasin-engin-696890289/", "_blank", "noopener") },
        { key: "youtube", run: () => window.open("https://www.youtube.com/@Netreka_Akademi", "_blank", "noopener") },
        { key: "projects", run: () => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }) },
        {
            key: "cv", run: () => {
                // Trigger print dialog for the "One Page PDF" experience
                window.print();
            }
        },
        {
            key: "focus", run: () => {
                document.body.classList.toggle("focus-mode");
                alert("Focus Mode Toggled (BG disabled)");
            }
        },
        { key: "lang tr", run: () => setLanguage('tr') },
        { key: "lang en", run: () => setLanguage('en') },
        // Shortcuts for specific projects
        { key: "projects: netreka", run: () => window.open("https://github.com/YasinEnginn/Netreka-Nexus", "_blank") },
        { key: "projects: tolerex", run: () => window.open("https://github.com/YasinEnginn/Tolerex", "_blank") },
        { key: "projects: rest-api", run: () => window.open("https://github.com/YasinEnginn/REST-API", "_blank") },
        {
            key: "vcard", run: () => {
                // Dynamically generate vCard
                const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Yasin Engin
N:Engin;Yasin;;;
TITLE:Network Engineer & Automation Developer
EMAIL;TYPE=INTERNET;TYPE=WORK:yasinenginoffical@gmail.com
URL:https://yasinenginn.github.io/
NOTE:SDN, Go, Distributed Systems, Network Automation
END:VCARD`;
                const blob = new Blob([vcardData], { type: "text/vcard" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Yasin_Engin.vcf";
                a.click();
                URL.revokeObjectURL(url);
            }
        },
        {
            key: "email", run: async () => {
                const mail = ["yasinenginoffical", "gmail.com"].join("@");
                try {
                    await navigator.clipboard.writeText(mail);
                    alert("Email copied: " + mail);
                } catch {
                    window.location.href = "mailto:" + mail;
                }
            }
        },
        // Community Commands
        { key: "idea", run: () => document.getElementById("ideas")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "help", run: () => document.getElementById("help-wanted")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "submit", run: () => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "discuss", run: () => document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }) },
    ];

    function toggleCmdk() {
        if (cmdk.open) {
            cmdk.close();
            return;
        }
        cmdk.showModal();
        setTimeout(() => cmdkInput.focus(), 50);
    }

    // Toggle on Ctrl+K or Cmd+K
    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            toggleCmdk();
        }
        if (e.key === "Escape" && cmdk.open) cmdk.close();
    });

    // Execute command on Enter
    cmdkInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const q = cmdkInput.value.trim().toLowerCase();
        // Exact match or starts-with
        const hit = actions.find(a => a.key === q) || actions.find(a => a.key.startsWith(q));
        if (hit) {
            cmdk.close();
            hit.run();
            cmdkInput.value = "";
        }
    });
} else if (cmdk && isMobileLite) {
    cmdk.remove();
}

/* -----------------------------------------------------------
   EMAIL OBFUSCATION (Spam Protection)
   ----------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email-address");
    if (emailInput) {
        // Construct email only when needed
        const part1 = "yasinenginoffical";
        const part2 = "gmail.com";
        emailInput.value = `${part1}@${part2}`;
    }

    // Giscus Theme/Lang Sync Logic
    function updateGiscusTheme() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const lang = document.documentElement.lang || 'tr';
        const giscusFrame = document.querySelector('iframe.giscus-frame');

        if (giscusFrame) {
            const message = {
                setConfig: {
                    theme: theme,
                    lang: lang
                }
            };
            giscusFrame.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
        }
    }

    // Initial sync attempts
    setTimeout(updateGiscusTheme, 2000);
    setTimeout(updateGiscusTheme, 5000);

    // Hook into existing toggle if possible, or just observe attribute changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && (mutation.attributeName === "data-theme" || mutation.attributeName === "lang")) {
                updateGiscusTheme();
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });
});
