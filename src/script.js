const GITHUB_TOKEN = ''; // WARNING: Do not hardcode a real PAT here in production. It will be publicly visible in the browser. Use a backend proxy for secure token management.
const CACHE_TTL = 21600000; // 6 hours in milliseconds

function getCachedProjects() {
    const cached = localStorage.getItem('github_projects_cache');
    if (!cached) return null;

    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem('github_projects_cache');
        return null;
    }
    return data;
}

function setCachedProjects(data) {
    const cacheData = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem('github_projects_cache', JSON.stringify(cacheData));
}

async function fetchProjects() {
    const username = 'hamidgurmani';
    const apiURL = `https://api.github.com/users/${username}/repos?sort=updated`;

    // Try cache first
    const cachedData = getCachedProjects();
    if (cachedData) return cachedData;

    const headers = {};
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    try {
        const response = await fetch(apiURL, { headers });

        if (response.status === 403) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        if (response.status === 404) {
            throw new Error('USER_NOT_FOUND');
        }
        if (!response.ok) {
            throw new Error('API_ERROR');
        }

        const repos = await response.json();
        const projects = repos
            .filter(repo => !repo.fork)
            .map(repo => ({
                name: repo.name,
                description: repo.description || "Explore this project to learn more.",
                link: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language || "Mixed"
            }));

        setCachedProjects(projects);
        return projects;
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error; // Propagate error to renderProjects
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

    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;" class="loading-text">Fetching latest projects from GitHub...</p>';

    try {
        const projects = await fetchProjects();

        if (projects.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No projects found.</p>';
            return;
        }

        grid.innerHTML = projects.map((project, index) => `
            <div class="project-card reveal" style="transition-delay: ${0.1 * index}s">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                <div class="project-stats">
                    <span class="stat-item">⭐ ${project.stars}</span>
                    <span class="stat-item">🍴 ${project.forks}</span>
                    <span class="stat-item">💻 ${project.language}</span>
                </div>
                <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="project-link">
                    View on GitHub &rarr;
                </a>
            </div>
        `).join('');

        initScrollReveal();
    } catch (error) {
        let errorMessage = 'Unable to connect to GitHub. Please refresh the page.';

        if (error.message === 'RATE_LIMIT_EXCEEDED') {
            errorMessage = 'GitHub API rate limit reached. Please check back later or view my profile directly.';
        } else if (error.message === 'USER_NOT_FOUND') {
            errorMessage = 'No projects found for this user.';
        }

        grid.innerHTML = `
            <div class="error-container" style="text-align: center; grid-column: 1/-1; padding: 2rem;">
                <p class="error-message">${errorMessage}</p>
                <button onclick="renderProjects()" class="retry-btn">Retry</button>
            </div>
        `;
    }
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
