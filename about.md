---
layout: default
title: About
permalink: /about/
---

<h1>Hi, I'm Mohsen</h1>

I'm a software developer based in Iran, passionate about web development, automation, and building tools that solve real problems.

## What I Do

When I'm not coding, I enjoy:

- **Building web applications** with modern stacks
- **Writing technical blog posts** to share what I learn
- **Contributing to open-source** projects
- **Learning new technologies** and experimenting with ideas

## Technical Skills

<div class="skills-grid">
  <div class="skill-group">
    <h3>Languages</h3>
    <ul>
      <li>JavaScript / TypeScript</li>
      <li>Python</li>
      <li>HTML/CSS</li>
    </ul>
  </div>

  <div class="skill-group">
    <h3>Frameworks & Tools</h3>
    <ul>
      <li>React, Vue.js</li>
      <li>Jekyll, Hugo</li>
      <li>Node.js</li>
      <li>Git</li>
    </ul>
  </div>

  <div class="skill-group">
    <h3>Currently Learning</h3>
    <ul>
      <li>React & modern frontend</li>
      <li>AI/ML basics</li>
      <li>Cloud deployment</li>
    </ul>
  </div>
</div>

## Projects I'm Proud Of

- **[Mohsen's Tech Blog](/projects)** - This very blog, built with Jekyll
- **[Portfolio Template](https://github.com/mohsen-niksirat/portfolio-template)** - A clean template for developers
- **CLI Helper** - A Node.js tool for project scaffolding

## Get in Touch

I'm always open to new opportunities, collaborations, or just having a chat about tech!

- 📧 Email: [mohsen@example.com](mailto:mohsen@example.com)
- 🐙 GitHub: [@mohsen-niksirat](https://github.com/mohsen-niksirat)
- 💼 LinkedIn: [/in/mohsen-niksirat](https://www.linkedin.com/in/mohsen-niksirat)
- 🐦 Twitter: [@mohsenniksirat](https://twitter.com/mohsenniksirat)

<a href="/assets/resume.pdf" class="resume-link">📄 Download my resume (PDF)</a>

<div class="newsletter-section">
  <h2>Stay Updated</h2>
  <p>Subscribe to my newsletter to get the latest posts delivered to your inbox.</p>
  <form action="https://buttondown.email/api/emails/embed-subscribe/mohsenniksirat" method="post" target="popupwindow" onsubmit="window.open('https://buttondown.email/mohsenniksirat', 'popupwin', 'scrollbars=yes,width=550,height=520');return true">
    <input type="email" name="email" placeholder="you@example.com" required>
    <button type="submit">Subscribe</button>
  </form>
</div>

<style>
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.skill-group h3 {
  font-size: 1.1rem;
  color: #4a90d9;
  margin-bottom: 0.5rem;
}

.skill-group ul {
  list-style: none;
  padding: 0;
}

.skill-group li {
  margin-bottom: 0.3rem;
  color: var(--muted);
}

.resume-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  text-decoration: none;
  transition: all 0.2s;
}

.resume-link:hover {
  background: var(--code-inline);
}

.newsletter-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--code-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.newsletter-section h2 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.newsletter-section form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.newsletter-section input[type="email"] {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
}

.newsletter-section button {
  padding: 0.6rem 1.2rem;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.newsletter-section button:hover {
  background: #2c6cb0;
}
</style>

<script>
// Open Buttondown signup in a popup
function openPopup() {
  window.open('https://buttondown.email/mohsenniksirat', 'popupwin');
  return false;
}
</script>