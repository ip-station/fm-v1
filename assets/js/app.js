class MediaCMS {
  constructor(config) {
    this.config = config;
    this.player = null;
    this.channels = { tv: [], radio: [] };
    this.renderedCount = { tv: 0, radio: 0 };
    this.chunkSize = 30;
    this.activeType = 'tv';
    this.activeChannel = null;
    this.historyKey = 'mediaHistory';
    this.authKey = 'mediaAuthUser';

    this.elements = {
      scroll: document.getElementById('channel-scroll'),
      tabs: document.querySelectorAll('.menu-tabs button'),
      badge: document.getElementById('player-badge'),
      title: document.getElementById('player-title'),
      desc: document.getElementById('player-desc'),
      metaTitle: document.getElementById('meta-title'),
      metaSub: document.getElementById('meta-sub'),
      history: document.getElementById('history-list'),
      playSelected: document.getElementById('play-selected'),
      clearHistory: document.getElementById('clear-history'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      authName: document.getElementById('auth-name'),
      authEmail: document.getElementById('auth-email'),
      authSave: document.getElementById('auth-save'),
    };
  }

  init() {
    this.initPlayer();
    this.bindEvents();
    this.restoreAuth();
    this.loadSources();
    this.restoreHistory();
  }

  initPlayer() {
    this.player = videojs('media-player', {
      controls: true,
      preload: 'auto',
      fluid: true,
      controlBar: {
        volumePanel: { inline: false },
      },
    });
  }

  bindEvents() {
    this.elements.tabs.forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.type));
    });

    this.elements.scroll.addEventListener('scroll', () => this.handleLazyLoad());

    this.elements.playSelected.addEventListener('click', () => {
      if (this.activeChannel) this.playChannel(this.activeChannel, this.activeType);
    });

    this.elements.clearHistory.addEventListener('click', () => {
      localStorage.removeItem(this.historyKey);
      this.renderHistory();
    });

    this.elements.sidebarToggle.addEventListener('click', () => {
      this.elements.sidebar.classList.toggle('collapsed');
      if (this.elements.sidebar.classList.contains('collapsed')) {
        document.body.style.paddingLeft = '88px';
      } else {
        document.body.style.paddingLeft = 'var(--sidebar-width)';
      }
    });

    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    this.elements.authSave.addEventListener('click', () => this.saveAuth());
  }

  handleKeyboard(event) {
    const targetTag = document.activeElement.tagName.toLowerCase();
    if (['input', 'textarea'].includes(targetTag)) return;
    if (!this.activeChannel) return;

    const list = this.channels[this.activeType];
    const currentIndex = list.findIndex((c) => c.slug === this.activeChannel.slug);

    switch (event.key) {
      case 'ArrowDown':
        if (currentIndex < list.length - 1) {
          this.selectChannel(list[currentIndex + 1], this.activeType, true);
        }
        break;
      case 'ArrowUp':
        if (currentIndex > 0) {
          this.selectChannel(list[currentIndex - 1], this.activeType, true);
        }
        break;
      case 'ArrowRight':
        this.adjustVolume(0.05);
        break;
      case 'ArrowLeft':
        this.adjustVolume(-0.05);
        break;
      case 'm':
      case 'M':
        this.player.muted(!this.player.muted());
        break;
      case 'Enter':
        this.playChannel(this.activeChannel, this.activeType);
        break;
      default:
        break;
    }
  }

  adjustVolume(delta) {
    const newVolume = Math.max(0, Math.min(1, this.player.volume() + delta));
    this.player.volume(newVolume);
  }

  async loadSources() {
    this.setStatus('Kanallar yükleniyor...', 'Bekleyin');
    try {
      const [tvList, radioList] = await Promise.all([
        this.fetchM3U(this.config.tvSource, 'tv'),
        this.fetchM3U(this.config.radioSource, 'radio'),
      ]);
      this.channels.tv = tvList;
      this.channels.radio = radioList;
      this.renderInitial();
      this.restoreFromURL();
    } catch (error) {
      this.setStatus('Kaynaklar yüklenemedi', error.message || 'Hata');
    }
  }

  async fetchM3U(url, type) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${type.toUpperCase()} listesi yüklenemedi`);
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const entries = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXTINF')) {
        const name = (line.split(',')[1] || 'Bilinmeyen').trim();
        const urlLine = lines[i + 1];
        if (urlLine && !urlLine.startsWith('#')) {
          entries.push({
            name,
            url: urlLine.trim(),
            slug: this.slugify(name),
            type,
          });
        }
      }
    }
    return entries;
  }

  renderInitial() {
    this.elements.scroll.innerHTML = '';
    this.renderedCount.tv = 0;
    this.renderedCount.radio = 0;
    this.renderNextChunk(this.activeType);
  }

  renderNextChunk(type) {
    const list = this.channels[type];
    const start = this.renderedCount[type];
    const end = Math.min(start + this.chunkSize, list.length);
    const fragment = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      fragment.appendChild(this.createCard(list[i]));
    }

    this.renderedCount[type] = end;
    if (fragment.children.length) this.elements.scroll.appendChild(fragment);
  }

  createCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.dataset.slug = channel.slug;
    card.innerHTML = `
      <h4>${channel.name}</h4>
      <p>${channel.type === 'radio' ? 'Radyo yayını' : 'TV yayını'}</p>
      <div class="channel-meta">
        <span class="badge">${channel.type.toUpperCase()}</span>
        <span class="badge">Kaynak: uzak</span>
      </div>
    `;

    card.addEventListener('click', () => this.selectChannel(channel, channel.type, true));
    return card;
  }

  selectChannel(channel, type, autoplay = false) {
    this.activeChannel = channel;
    this.activeType = type;
    this.highlightActive(channel.slug);
    this.updateMeta(channel);
    this.updateURL(channel.slug);
    if (autoplay) this.playChannel(channel, type);
  }

  highlightActive(slug) {
    document.querySelectorAll('.channel-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.slug === slug);
    });
  }

  updateMeta(channel) {
    this.elements.title.textContent = channel.name;
    this.elements.metaTitle.textContent = channel.name;
    this.elements.metaSub.textContent = `${channel.type.toUpperCase()} • ${channel.url}`;
    this.elements.badge.textContent = channel.type === 'radio' ? 'Radyo' : 'TV';
    this.elements.desc.textContent = 'Seçilen kanal için akış hazır.';
  }

  playChannel(channel, type) {
    const isRadio = type === 'radio';
    const source = {
      src: channel.url,
      type: 'application/x-mpegURL',
    };

    this.player.poster(isRadio ? this.config.radioPoster : '');
    this.player.src(source);
    this.player.play();
    this.saveHistory(channel);
  }

  handleLazyLoad() {
    const { scrollTop, scrollHeight, clientHeight } = this.elements.scroll;
    if (scrollTop + clientHeight >= scrollHeight - 120) {
      this.renderNextChunk(this.activeType);
    }
  }

  switchTab(type) {
    if (this.activeType === type) return;
    this.activeType = type;
    this.elements.tabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.type === type));
    this.elements.scroll.innerHTML = '';
    this.renderedCount[type] = 0;
    this.renderNextChunk(type);
    if (this.channels[type].length) {
      this.selectChannel(this.channels[type][0], type, false);
    }
  }

  setStatus(title, desc) {
    this.elements.title.textContent = title;
    this.elements.desc.textContent = desc;
  }

  restoreFromURL() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('channel');
    if (!slug) {
      if (this.channels.tv.length) this.selectChannel(this.channels.tv[0], 'tv', true);
      return;
    }
    const found =
      this.channels.tv.find((c) => c.slug === slug) ||
      this.channels.radio.find((c) => c.slug === slug);
    if (found) {
      this.switchTab(found.type);
      this.selectChannel(found, found.type, true);
    } else if (this.channels.tv.length) {
      this.selectChannel(this.channels.tv[0], 'tv', true);
    }
  }

  updateURL(slug) {
    const params = new URLSearchParams(window.location.search);
    params.set('channel', slug);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  saveHistory(channel) {
    const history = this.getHistory();
    const filtered = history.filter((item) => item.slug !== channel.slug);
    filtered.unshift({ ...channel, viewedAt: Date.now() });
    localStorage.setItem(this.historyKey, JSON.stringify(filtered.slice(0, 12)));
    this.renderHistory();
  }

  getHistory() {
    const raw = localStorage.getItem(this.historyKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  renderHistory() {
    const history = this.getHistory();
    this.elements.history.innerHTML = '';
    if (!history.length) {
      this.elements.history.innerHTML = '<p class="tagline">Henüz geçmiş yok.</p>';
      return;
    }
    history.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'channel-card';
      card.innerHTML = `
        <h4>${item.name}</h4>
        <p>${item.type === 'radio' ? 'Radyo' : 'TV'} yayını</p>
        <div class="channel-meta">
          <span class="badge">${item.type.toUpperCase()}</span>
          <span class="badge">Tekrar oynat</span>
        </div>
      `;
      card.addEventListener('click', () => {
        this.switchTab(item.type);
        this.selectChannel(item, item.type, true);
      });
      this.elements.history.appendChild(card);
    });
  }

  restoreHistory() {
    this.renderHistory();
  }

  saveAuth() {
    const user = {
      name: this.elements.authName.value.trim(),
      email: this.elements.authEmail.value.trim(),
    };
    localStorage.setItem(this.authKey, JSON.stringify(user));
    this.elements.authSave.textContent = 'Kaydedildi';
    setTimeout(() => (this.elements.authSave.textContent = 'Giriş / Kaydol'), 1200);
  }

  restoreAuth() {
    const raw = localStorage.getItem(this.authKey);
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      if (user.name) this.elements.authName.value = user.name;
      if (user.email) this.elements.authEmail.value = user.email;
    } catch (e) {
      /* ignore */
    }
  }

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (!window.cmsConfig) return;
  const app = new MediaCMS(window.cmsConfig);
  app.init();
});
