'use strict';
(function () {
  function onReady(cb) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cb, { once: true });
    else cb();
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  onReady(function () {
    // Theme: default to dark, with toggle and persistence
    (function () {
      var storageKey = 'theme';
      var root = document.documentElement;
      function applyTheme(t) {
        root.classList.remove('theme-dark', 'theme-light');
        if (t === 'light') root.classList.add('theme-light');
        else root.classList.add('theme-dark');
      }
      function getStored() {
        try { return localStorage.getItem(storageKey); } catch (_) { return null; }
      }
      function setStored(t) {
        try { localStorage.setItem(storageKey, t); } catch (_) {}
      }
      var initial = (getStored() || '').toLowerCase();
      if (initial !== 'light' && initial !== 'dark') initial = 'dark';
      applyTheme(initial);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle-btn';
      btn.setAttribute('aria-label', 'Toggle color theme');
      btn.title = 'Toggle theme';
      function setIcon() { btn.textContent = root.classList.contains('theme-dark') ? '☀︎' : '☾'; }
      setIcon();
      document.body.appendChild(btn);
      btn.addEventListener('click', function () {
        var isDark = root.classList.contains('theme-dark');
        var next = isDark ? 'light' : 'dark';
        applyTheme(next);
        setStored(next);
        setIcon();
      });
    })();
    // 1) Ensure enhancements.css is present (fallback if HTML wasn't updated)
    try {
      if (!document.querySelector('link[href="css/enhancements.css"]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/enhancements.css';
        document.head.appendChild(link);
      }
    } catch (err) {}

    // 2) Current year (in case jQuery script didn't run yet)
    var yr = document.getElementById('current-year');
    if (yr) yr.textContent = new Date().getFullYear();

    // 3) Sticky header on scroll (uses header.sticky from base CSS)
    var header = document.querySelector('header');
    function updateSticky() {
      if (!header) return;
      if (window.pageYOffset > 60) header.classList.add('sticky');
      else header.classList.remove('sticky');
    }
    updateSticky();
    window.addEventListener('scroll', throttle(updateSticky, 100), { passive: true });

    // 4) Scroll progress bar (create if missing)
    var progress = document.getElementById('scroll-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.id = 'scroll-progress';
      document.body.insertBefore(progress, document.body.firstChild);
    }
    function setProgress() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = docHeight ? (scrollTop / docHeight) * 100 : 0;
      progress.style.width = pct + '%';
    }
    setProgress();
    window.addEventListener('scroll', throttle(setProgress, 50), { passive: true });
    window.addEventListener('resize', throttle(setProgress, 100));

    // 5) External links behavior
    var resumeLink = document.querySelector('#lead-content a.btn-rounded-white');
    if (resumeLink) {
      resumeLink.setAttribute('target', '_blank');
      resumeLink.setAttribute('rel', 'noopener');
    }
    Array.prototype.forEach.call(document.querySelectorAll('.project-info a, footer .social a'), function (a) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    // 6) Lazy-load and alt for project images
    Array.prototype.forEach.call(document.querySelectorAll('#projects .project-image img'), function (img) {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('alt')) {
        var titleEl = img.closest('.project').querySelector('.project-info h3');
        var title = titleEl ? titleEl.textContent.trim() : 'Project image';
        img.setAttribute('alt', title + ' preview');
      }
    });

    // 7) Make project cards expandable
    Array.prototype.forEach.call(document.querySelectorAll('#projects .project'), function (project, index) {
      var info = project.querySelector('.project-info');
      var title = info ? info.querySelector('h3') : null;
      if (!info || !title || info.querySelector('.project-toggle')) return;

      var nodes = [];
      var cursor = title.nextSibling;
      while (cursor) {
        var next = cursor.nextSibling;
        nodes.push(cursor);
        cursor = next;
      }

      var summary = document.createElement('div');
      summary.className = 'project-summary';

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-toggle';
      button.textContent = 'More Details';

      var details = document.createElement('div');
      details.className = 'project-details';
      details.id = 'project-details-' + (index + 1);

      var detailsInner = document.createElement('div');
      detailsInner.className = 'project-details-inner';

      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', details.id);

      summary.appendChild(title);
      summary.appendChild(button);
      info.insertBefore(summary, info.firstChild);
      details.appendChild(detailsInner);
      info.appendChild(details);

      nodes.forEach(function (node) {
        if (node.nodeType === 3 && !node.textContent.trim()) return;
        detailsInner.appendChild(node);
      });

      project.classList.add('project-collapsible');

      button.addEventListener('click', function () {
        var isExpanded = project.classList.toggle('project--expanded');
        button.textContent = isExpanded ? 'Hide Details' : 'More Details';
        button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      });
    });

    // 8) Reveal on scroll
    var reveals = [];
    try {
      var selectors = [
        '#lead-content',
        '#about .col-md-8 p',
        '#experience-timeline > div',
        '#education .education-block',
        '#projects .project',
        '#skills .skills-shell',
        '#skills .skills-overview',
        '#skills .skill-card',
        '#contact #contact-form'
      ];
      reveals = Array.prototype.slice.call(document.querySelectorAll(selectors.join(',')));
      reveals.forEach(function (el) { el.classList.add('reveal'); });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal--shown');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        reveals.forEach(function (el) { io.observe(el); });
      } else {
        reveals.forEach(function (el) { el.classList.add('reveal--shown'); });
      }
    } catch (e) {}

    // 9) Remove any stale injected skills filter UI
    Array.prototype.forEach.call(
      document.querySelectorAll('#skills input[type="search"], #skills input[placeholder*="Filter"], #skills input[placeholder*="filter"], #skills .skills-filter, #skills .skills-search'),
      function (el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
    );

    // 10) Contact quick actions (copy email)
    (function () {
      var form = document.querySelector('#contact-form');
      if (!form) return;
      if (form.querySelector('.contact-actions')) return;
      var wrap = document.createElement('div');
      wrap.className = 'contact-actions';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'copy-email';
      btn.textContent = 'Copy Email';
      var link = document.createElement('a');
      link.className = 'email-link';
      link.href = 'mailto:surajm20061998@gmail.com';
      link.textContent = 'Email me';
      wrap.appendChild(btn);
      wrap.appendChild(link);
      form.appendChild(wrap);
      btn.addEventListener('click', function () {
        var email = 'surajm20061998@gmail.com';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            btn.textContent = 'Copied!';
            setTimeout(function () { btn.textContent = 'Copy Email'; }, 1500);
          });
        } else {
          var ta = document.createElement('textarea');
          ta.value = email;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy Email'; }, 1500);
        }
      });
    })();

    // 11) Improve contact email placeholder
    var emailInput = document.querySelector('#contact-form input[type="email"]');
    if (emailInput) emailInput.placeholder = 'Your email';

    // 12) Hero role rotator
    (function () {
      var role = document.querySelector('#lead-content h2');
      if (!role) return;
      role.id = 'role-rotator';
      var roles = Array.from(new Set([
        role.textContent.trim() || 'Software Developer',
        'Backend Engineer',
        'ML Enthusiast',
        'Cloud & DevOps',
        'Problem Solver'
      ]));
      var idx = 0;
      setInterval(function () {
        idx = (idx + 1) % roles.length;
        role.textContent = roles[idx];
      }, 2500);
    })();
  });
})();
