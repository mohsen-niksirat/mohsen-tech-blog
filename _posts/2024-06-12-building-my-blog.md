---
layout: post
title: "Building My Personal Tech Blog with Jekyll and GitHub Pages"
date: 2024-06-12
tags: [jekyll, github-pages, web-dev, blogging]
---

# Building My Personal Tech Blog with Jekyll and GitHub Pages

I've been wanting to start a blog for a while now, and I finally took the plunge. Here's how I built this blog using Jekyll and GitHub Pages in just a few hours.

## Why Jekyll + GitHub Pages?

I chose this stack for several reasons:

- **Zero cost**: GitHub Pages is free for public repositories
- **Simplicity**: No database, no server setup, just static files
- **Markdown support**: Write in Markdown and focus on content
- **Built-in CI/CD**: Push to GitHub and your site is automatically deployed

## Setup

The process was surprisingly straightforward:

1. Created a GitHub repository called `mohsen-tech-blog`
2. Added a basic `_config.yml` file
3. Created layouts in the `_layouts` directory
4. Wrote my first post in Markdown

```yaml
# _config.yml
title: Mohsen's Tech Blog
description: Personal blog about tech, programming, and learnings
theme: minima
```

## Key Features

This blog includes several features out of the box:

- Responsive design with dark mode support
- Tag-based organization
- SEO optimization with meta tags
- Comment system via Utterances (powered by GitHub Discussions)
- RSS feed for subscribers

### Dark Mode Implementation

The dark mode toggle is handled purely on the client side using JavaScript and CSS variables:

```javascript
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
}
```

### Tag System

Each post can have tags, and there's an automatic tag listing on the About page that shows how many posts are associated with each tag.

## Lessons Learned

1. **Start simple**: Don't over-engineer the first version
2. **Markdown is powerful**: You can do almost everything with Markdown + a few Liquid tags
3. **GitHub Pages works**: It just works. No configuration headaches.

## Future Improvements

I plan to add these features over time:

- Search functionality (maybe using [Lunr.js](https://lunrjs.herokuapp.com/))
- A dedicated newsletter signup
- Analytics (probably Plausible for privacy)
- More interactive elements

## Conclusion

If you're thinking about starting a blog, I highly recommend the Jekyll + GitHub Pages combo. It lets you focus on writing without worrying about infrastructure.

Happy blogging!