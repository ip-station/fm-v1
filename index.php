<?php $config = require __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="<?= htmlspecialchars($config['description'], ENT_QUOTES) ?>" />
  <title><?= htmlspecialchars($config['title'], ENT_QUOTES) ?></title>
  <link rel="stylesheet" href="https://vjs.zencdn.net/8.10.0/video-js.css" />
  <link rel="stylesheet" href="assets/css/styles.css" />
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">TV</div>
      <div>
        <h1><?= htmlspecialchars($config['title'], ENT_QUOTES) ?></h1>
        <p class="tagline">Tek Video.js oynatıcıyla TV ve radyo yayınları</p>
        <div class="badge-row">
          <span class="pill-inline"><?= htmlspecialchars($config['brand'], ENT_QUOTES) ?></span>
          <span class="pill-inline">Lazy-load liste</span>
          <span class="pill-inline">Klavye kısayolu desteği</span>
        </div>
      </div>
    </div>
    <div class="auth-card">
      <input type="text" id="auth-name" placeholder="Ad" />
      <input type="email" id="auth-email" placeholder="E-posta" />
      <button id="auth-save">Giriş / Kaydol</button>
    </div>
  </header>

  <div class="sidebar-shell">
    <aside class="sidebar" id="sidebar">
      <button class="sidebar-toggle" id="sidebar-toggle">
        <span>Menü</span>
        <span>⇆</span>
      </button>
      <div class="menu-shell">
        <div class="menu-tabs">
          <button data-type="tv" class="active">TV</button>
          <button data-type="radio">Radyo</button>
        </div>
        <div class="channel-pane">
          <div class="channel-scroll" id="channel-scroll"></div>
        </div>
      </div>
    </aside>
  </div>

  <main class="main-area">
    <section class="player-card">
      <div class="player-top">
        <div>
          <div class="pill-inline" id="player-badge">Hazır</div>
          <h2 id="player-title" style="margin: 6px 0 4px;">Kanal seçin</h2>
          <p class="tagline" id="player-desc">Kanal seçtiğinizde otomatik oynar.</p>
        </div>
        <div class="keyboard-help" id="keyboard-help">
          <?php foreach ($config['keyboardHelp'] as $item): ?>
            <span class="help-item">• <?= htmlspecialchars($item, ENT_QUOTES) ?></span>
          <?php endforeach; ?>
        </div>
      </div>
      <video id="media-player" class="video-js vjs-default-skin" controls preload="auto" poster="">
        <p class="vjs-no-js">
          Bu oynatıcı için JavaScript gerekli.
        </p>
      </video>
      <div class="meta">
        <div>
          <h3 id="meta-title">Henüz bir kanal seçilmedi</h3>
          <p id="meta-sub">Aktif kaynak: bekleniyor</p>
        </div>
        <div class="actions">
          <button class="btn" id="play-selected">Seçili kanalı oynat</button>
          <button class="btn btn-ghost" id="clear-history">Geçmişi temizle</button>
        </div>
      </div>
    </section>

    <section class="history-card">
      <div class="player-top" style="margin-bottom: 6px;">
        <div>
          <div class="pill-inline">Geçmiş</div>
          <h3 style="margin:6px 0 0;">En son izlenenler</h3>
        </div>
        <p class="tagline">Yeniden yüklemede de saklanır</p>
      </div>
      <div class="history-list" id="history-list"></div>
    </section>
  </main>

  <footer>
    <div>
      <strong>StreamCMS</strong>
      <p>TV kaynak: GitHub IPTV • Radyo kaynak: IPFM</p>
    </div>
    <p class="tagline">Kısayollar: yön tuşları ve M</p>
  </footer>

  <script>
    window.cmsConfig = {
      tvSource: '<?= htmlspecialchars($config['tvSource'], ENT_QUOTES) ?>',
      radioSource: '<?= htmlspecialchars($config['radioSource'], ENT_QUOTES) ?>',
      radioPoster: '<?= htmlspecialchars($config['radioPoster'], ENT_QUOTES) ?>'
    };
  </script>
  <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
