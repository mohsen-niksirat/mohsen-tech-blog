// Theme toggle
(function() {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'theme-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
  toggleBtn.innerHTML = '🌙';
  document.querySelector('nav').appendChild(toggleBtn);

  function setTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      toggleBtn.innerHTML = '☀️';
    } else {
      document.body.classList.remove('dark');
      toggleBtn.innerHTML = '🌙';
    }
    localStorage.setItem('theme', theme);
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  });
})();

// Syntax highlighting (simple)
document.addEventListener('DOMContentLoaded', function() {
  const preBlocks = document.querySelectorAll('pre code');
  preBlocks.forEach(function(block) {
    const text = block.textContent;
    const html = text
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await)\b/g, '<span class="token-keyword">$&</span>')
      .replace(/\b(this|true|false|null|undefined)\b/g, '<span class="token-atom">$&</span>')
      .replace(/('[^']*'|"[^"]*")/g, '<span class="token-string">$&</span>')
      .replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
    block.innerHTML = html;
  });
});