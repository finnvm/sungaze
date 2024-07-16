import json
import os
import markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Load articles from JSON file
with open('articles.json', 'r') as file:
    articles = json.load(file)

# Set up Jinja2 environment
env = Environment(
    loader=FileSystemLoader('templates'),
    autoescape=select_autoescape(['html', 'xml'])
)

# Create a custom markdown filter
def markdown_filter(text):
    return markdown.markdown(text)

env.filters['markdown'] = markdown_filter

# Load article template
template = env.get_template('article_template.html')

# Ensure the output directory exists
output_dir = 'articles'
os.makedirs(output_dir, exist_ok=True)

# Generate static HTML files for each article
for article in articles:
    output_path = os.path.join(output_dir, f"{article['slug']}.html")
    with open(output_path, 'w') as file:
        file.write(template.render(article=article))

print("Static site generated successfully.")
