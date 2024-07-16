document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', function() {
        toggleDarkMode();
    });

    if (document.getElementById('search')) {
        loadArticles(1);
        document.getElementById('search').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                loadArticles(1);
            }
        });
    }

    if (document.getElementById('article-form')) {
        document.getElementById('article-form').addEventListener('submit', function(event) {
            event.preventDefault();
            addArticle();
        });
    }
});

function initializeDarkMode() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        document.querySelector('header').classList.add('dark-mode');
        document.querySelectorAll('.nav-link').forEach(link => link.classList.add('dark-mode'));
        document.querySelectorAll('.article').forEach(article => article.classList.add('dark-mode'));
        document.querySelector('.article-container')?.classList.add('dark-mode');
        document.querySelectorAll('.back-link a').forEach(link => link.classList.add('dark-mode'));
        document.getElementById('dark-mode-toggle').classList.add('dark-mode');
        document.getElementById('search')?.classList.add('dark-mode');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.querySelector('header').classList.toggle('dark-mode');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('dark-mode'));
    document.querySelectorAll('.article').forEach(article => article.classList.toggle('dark-mode'));
    document.querySelector('.article-container')?.classList.toggle('dark-mode');
    document.querySelectorAll('.back-link a').forEach(link => link.classList.toggle('dark-mode'));
    document.getElementById('dark-mode-toggle').classList.toggle('dark-mode');
    document.getElementById('search')?.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

function loadArticles(page) {
    const searchQuery = document.getElementById('search') ? document.getElementById('search').value : '';
    fetch('articles.json')
        .then(response => response.json())
        .then(data => {
            const articlesDiv = document.getElementById('articles');
            if (!articlesDiv) return;

            let filteredArticles = data.filter(article => article.title.toLowerCase().includes(searchQuery.toLowerCase()));

            filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

            const perPage = 9;
            const total = filteredArticles.length;
            const start = (page - 1) * perPage;
            const end = start + perPage;
            const paginatedArticles = filteredArticles.slice(start, end);

            articlesDiv.innerHTML = '';

            paginatedArticles.forEach(article => {
                const articleDiv = document.createElement('div');
                articleDiv.className = 'article';
                if (document.body.classList.contains('dark-mode')) {
                    articleDiv.classList.add('dark-mode');
                }
                articleDiv.innerHTML = `
                    <a href="articles/${article.slug}.html">
                        <img src="${article.image}" alt="${article.title}">
                        <h2>${article.title}</h2>
                        <p>${article.snippet}</p>
                    </a>
                `;
                articlesDiv.appendChild(articleDiv);
            });

            const paginationDiv = document.getElementById('pagination');
            if (!paginationDiv) return;

            paginationDiv.innerHTML = '';

            const totalPages = Math.ceil(total / perPage);
            for (let i = 1; i <= totalPages; i++) {
                const pageLink = document.createElement('button');
                pageLink.innerText = i;
                pageLink.className = i === page ? 'active' : '';
                pageLink.onclick = () => loadArticles(i);
                paginationDiv.appendChild(pageLink);
            }
        });
}

function loadArticle(slug) {
    fetch('articles.json')
        .then(response => response.json())
        .then(data => {
            const article = data.find(article => article.slug === slug);
            if (!article) {
                document.getElementById('article-content').innerText = 'Article not found';
                return;
            }
            document.getElementById('article-title').innerText = article.title;
            document.getElementById('article-heading').innerText = article.title;
            document.getElementById('article-image').src = article.image;
            document.getElementById('article-image').alt = article.title;
            
            // Determine if the content is Markdown or HTML
            if (article.full_content.startsWith('<')) {
                // Assume it's HTML if it starts with an HTML tag
                document.getElementById('article-content').innerHTML = article.full_content;
            } else {
                // Otherwise, treat it as Markdown
                document.getElementById('article-content').innerHTML = marked(article.full_content);
            }

            if (window.location.hostname === '127.0.0.1') {
                document.getElementById('edit-link').style.display = 'block';
                document.getElementById('delete-link').style.display = 'block';
            }

            // Reload Disqus for the new article
            if (typeof DISQUS !== 'undefined') {
                DISQUS.reset({
                    reload: true,
                    config: function () {
                        this.page.url = window.location.href;
                        this.page.identifier = slug;
                    }
                });
            }
        });
}

function addArticle() {
    const title = document.getElementById('title').value;
    const full_content = document.getElementById('full_content').value;
    const imageInput = document.getElementById('image');
    const image = imageInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        const imageUrl = reader.result;
        const newArticle = {
            title: title,
            snippet: generateSnippet(full_content),
            full_content: full_content,
            image: imageUrl,
            slug: generateSlug(title),
            date: new Date().toISOString()
        };

        fetch('articles.json')
            .then(response => response.json())
            .then(data => {
                data.push(newArticle);
                download(JSON.stringify(data, null, 4), 'articles.json', 'application/json');
                alert('Article added successfully!');
                window.location.href = 'index.html';
            });
    };
    
    reader.readAsDataURL(image);
}

function deleteArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    fetch('articles.json')
        .then(response => response.json())
        .then(data => {
            const updatedData = data.filter(article => article.slug !== slug);
            download(JSON.stringify(updatedData, null, 4), 'articles.json', 'application/json');
            alert('Article deleted successfully!');
            window.location.href = 'index.html';
        });
}

function generateSnippet(full_content, length = 200) {
    return full_content.length > length ? full_content.substring(0, length) + '...' : full_content;
}

function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function download(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
