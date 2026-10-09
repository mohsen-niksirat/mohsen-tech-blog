---
layout: default
title: About
permalink: /about/
---

# About Me

Hi, I'm Mohsen. This is where I write about tech stuff.

## Contact

- GitHub: [@mohsen-niksirat](https://github.com/mohsen-niksirat)
- Twitter: [@mohsenniksirat](https://twitter.com/mohsenniksirat)

## Tags

Here are the topics I write about:

<div class="tags-list">
  {% for tag in site.tags %}
    <a href="/tag/{{ tag[0] }}">{{ tag[0] }} ({{ tag[1].size }})</a>
  {% endfor %}
</div>