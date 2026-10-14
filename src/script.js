async function fetchProjects() {
    const username = 'hamidgurmani';
    const apiURL = `https://api.github.com/users/${username}/repos?sort=updated`;

    try {
        const response = await fetch(apiURL);
        if (!response.ok) throw new Error('Failed to fetch repositories');

        const repos = await response.json();

        return repos
            .filter(repo => !repo.fork && repo.description)
            .map(repo => ({
                name: repo.name,
                description: repo.description,
                link: repo.html_url
            }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [
            {
                name: "Error Loading Projects",
                description: "Could not fetch projects from GitHub. Please check your connection.",
                link: "https://github.com/hamidgurmani"
            }
        ];
    }
}

function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

async function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Fetching latest projects from GitHub...</p>';

    const projects = await fetchProjects();

    grid.innerHTML = projects.map((project, index) => `
        <div class="project-card reveal" style="transition-delay: ${0.1 * index}s">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <a href="${project.link}" target="_blank" class="project-link">
                View on GitHub &rarr;
            </a>
        </div>
    `).join('');

    // After rendering, we need to observe the newly created cards
    initScrollReveal();
}

async function handleContactForm() {
    const form = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        // UI Loading State
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        statusDiv.textContent = '';
        statusDiv.className = 'form-status';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.textContent = result.message;
                statusDiv.classList.add('success');
                form.reset();
            } else {
                throw new Error(result.detail || 'Something went wrong');
            }
        } catch (error) {
            statusDiv.textContent = error.message;
            statusDiv.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    renderProjects();
    handleContactForm();
    initBackToTop();
});
