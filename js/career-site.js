/**
 * Loads ./data/*.json (synced from personal-career-db). Use a local HTTP server.
 */
(function () {
  var MO_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var lang = document.documentElement.lang || "en";
  var isZh = lang.toLowerCase().startsWith("zh");

  var STR = isZh
    ? {
        brandLine: "金融工程硕士 · 伊利诺伊大学香槟分校",
        seekingLabel: "求职意向",
        eduSub: "数学、计算机与金融交叉背景。",
        spotlightTitle: "精选经历",
        spotlightSub: "与金融、数据与建模相关的实习摘要（各两条要点）；完整叙述见下方「实习与工作」。",
        projectsTitle: "项目与竞赛",
        projectsSub: "按标签筛选。每条目的标签以 JSON 存储，支持含空格或多词标签；修改 bullets.json 后刷新即可更新筛选按钮与结果。",
        workTitle: "实习与工作",
        workSub: "与个人数据库 experiences.json 同步的完整记录。",
        allTag: "全部",
        linkedinLabel: "领英",
        githubLabel: "GitHub",
        loadingMeta: "加载中…",
        deanBadge: "院长嘉许名单",
      }
    : {
        brandLine: "M.S. Financial Engineering · UIUC",
        seekingLabel: "Seeking",
        eduSub: "Strong background in mathematics, computer science, and finance.",
        spotlightTitle: "Highlights",
        spotlightSub: "Finance- and modeling-related internships (two bullets each); full narratives in Work below.",
        projectsTitle: "Projects & competitions",
        projectsSub: "Filter by tag. Tags are stored per card as JSON (multi-word tags supported); refresh after editing bullets.json to update chips and results.",
        workTitle: "Internships & work",
        workSub: "Full records synced from experiences.json.",
        allTag: "All",
        linkedinLabel: "LinkedIn",
        githubLabel: "GitHub",
        loadingMeta: "Loading…",
        deanBadge: "Dean's List",
      };

  function formatYm(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || "";
    var y = ym.slice(0, 4);
    var m = parseInt(ym.slice(5, 7), 10) - 1;
    if (isZh) return y + "年" + (m + 1) + "月";
    return MO_EN[m] + " " + y;
  }

  function formatRange(start, end) {
    return formatYm(start) + " – " + formatYm(end);
  }

  function degreeShort(d) {
    var map = { Master: "M.S.", Bachelor: "B.S.", Associate: "A.S.", PhD: "Ph.D.", MBA: "MBA", Certificate: "Cert." };
    return map[d] || d || "";
  }

  function degreeLine(edu) {
    var d = degreeShort(edu.degree);
    var f = edu.field || "";
    if (!isZh) return d + " in " + f;
    var degZh = { "M.S.": "硕士", "B.S.": "学士", "Ph.D.": "博士", MBA: "工商管理硕士" };
    var fieldZh = {
      "Financial Engineering": "金融工程",
      Mathematics: "数学",
    };
    var dz = degZh[d] || d;
    var fz = fieldZh[f] || f;
    return fz + " · " + dz;
  }

  function isProgramCurrent(endYm) {
    if (!endYm || !/^\d{4}-\d{2}$/.test(endYm)) return false;
    var parts = endYm.split("-");
    var end = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return end >= today;
  }

  function formatPhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length === 10) return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    return raw || "";
  }

  function esc(s) {
    var el = document.createElement("div");
    el.textContent = s == null ? "" : String(s);
    return el.innerHTML;
  }

  function langLevelDisplay(level) {
    if (!isZh) return level || "";
    var map = { Native: "母语", Advanced: "熟练", Basic: "基础", Fluent: "流利", Intermediate: "中等" };
    return map[level] || level || "";
  }

  function langNameDisplay(name) {
    if (!isZh) return name || "";
    var map = { Chinese: "中文", English: "英语", Japanese: "日语" };
    return map[name] || name || "";
  }

  function buildEducationHtml(list) {
    if (!list || !list.length) return "";
    return list
      .map(function (edu) {
        var current = isProgramCurrent((edu.end || "").trim());
        var badge = "";
        var isDean = edu.honors && /dean/i.test(edu.honors);
        if (current) badge = isZh ? "在读" : "Current";
        else if (isDean) badge = STR.deanBadge;
        else if (edu.honors) badge = edu.honors.length > 36 ? edu.honors.slice(0, 34) + "…" : edu.honors;

        var dateLine = formatRange(edu.start, edu.end);
        if (current) dateLine += isZh ? "（预计）" : " (expected)";

        var deg = degreeLine(edu);

        var detailParts = [];
        if (edu.location) detailParts.push(edu.location);
        if (edu.honors && !(badge === STR.deanBadge && isDean)) {
          detailParts.push(edu.honors);
        }
        var detail = detailParts.join(isZh ? " · " : " · ");

        return (
          '<div class="edu-card' +
          (current ? " edu-card--current" : "") +
          '">' +
          (badge ? '<span class="edu-badge">' + esc(badge) + "</span>" : "") +
          '<p class="edu-date">' +
          esc(dateLine) +
          "</p>" +
          '<h3 class="edu-school">' +
          esc(edu.school || "") +
          "</h3>" +
          '<p class="edu-degree">' +
          esc(deg) +
          "</p>" +
          (detail ? '<p class="edu-detail">' + esc(detail) + "</p>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function buildWorkArticle(ex) {
    var summary = (ex.highlights && ex.highlights[0]) || "";
    var rest = (ex.highlights || []).slice(1);
    var bullets =
      rest.length > 0
        ? "<ul class=\"item-bullets\">" + rest.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>"
        : "";
    var loc = (ex.location || "").trim();
    var time = formatYm(ex.start) + " – " + formatYm(ex.end);
    return (
      '<article class="item">' +
      '<div class="item-main">' +
      '<div class="item-title-row">' +
      '<h3 class="item-title">' +
      esc(ex.company || "") +
      "</h3>" +
      '<span class="item-role">' +
      esc(ex.title || "") +
      "</span></div>" +
      (summary ? '<p class="item-meta">' + esc(summary) + "</p>" : "") +
      bullets +
      "</div>" +
      '<div class="item-location">' +
      (loc ? '<p class="item-meta">' + esc(loc) + "</p>" : "") +
      '<p class="item-meta">' +
      esc(time) +
      "</p></div></article>"
    );
  }

  function buildSpotlightExp(ex) {
    var hs = (ex.highlights || []).slice(1, 3);
    var bullets =
      hs.length > 0
        ? "<ul class=\"item-bullets\">" + hs.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>"
        : "";
    var loc = (ex.location || "").trim();
    var time = formatYm(ex.start) + " – " + formatYm(ex.end);
    return (
      '<article class="item">' +
      '<div class="item-main">' +
      '<div class="item-title-row">' +
      '<h3 class="item-title">' +
      esc(ex.company || "") +
      "</h3>" +
      '<span class="item-role">' +
      esc(ex.title || "") +
      "</span></div>" +
      bullets +
      "</div>" +
      '<div class="item-location">' +
      (loc ? '<p class="item-meta">' + esc(loc) + "</p>" : "") +
      '<p class="item-meta">' +
      esc(time) +
      "</p></div></article>"
    );
  }

  function fixTagChipsHtml(b) {
    var tags = b.tags || [];
    if (!tags.length) return "";
    return (
      '<p class="item-meta career-record-tags">' +
      tags.map(function (t) { return '<span class="activity-chip">' + esc(t) + "</span>"; }).join("") +
      "</p>"
    );
  }

  function buildProjectRecordArticle(b) {
    var summary = (b.highlights && b.highlights[0]) || "";
    var rest = (b.highlights || []).slice(1);
    var bullets =
      rest.length > 0
        ? "<ul class=\"item-bullets\">" + rest.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>"
        : "";
    var loc = (b.location || "").trim();
    var tagsNorm = (b.tags || [])
      .map(function (t) { return String(t).toLowerCase().trim(); })
      .filter(Boolean);
    var tagsJson = JSON.stringify(tagsNorm);
    return (
      '<article class="item career-project-card" data-career-project-card data-record-tags="' +
      esc(tagsJson) +
      '">' +
      '<div class="item-main">' +
      '<div class="item-title-row">' +
      '<h3 class="item-title">' +
      esc(b.name || "") +
      "</h3>" +
      '<span class="item-role">' +
      esc(b.organization || "") +
      "</span></div>" +
      fixTagChipsHtml(b) +
      (summary ? '<p class="item-meta">' + esc(summary) + "</p>" : "") +
      bullets +
      "</div>" +
      '<div class="item-location">' +
      (loc ? '<p class="item-meta">' + esc(loc) + "</p>" : "") +
      '<p class="item-meta">' +
      esc(b.time || "") +
      "</p></div></article>"
    );
  }

  async function loadJson(path) {
    var r = await fetch(path, { cache: "no-store" });
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.json();
  }

  function applyHero(profile) {
    var nameEl = document.querySelector("[data-career-hero-name]");
    var brandEl = document.querySelector("[data-career-brand-tagline]");
    var contactEl = document.querySelector("[data-career-hero-contact]");
    var metaEl = document.querySelector("[data-career-hero-meta]");

    if (nameEl) {
      if (isZh && profile.display_name_zh) nameEl.textContent = profile.display_name_zh;
      else if (profile.display_name) nameEl.textContent = profile.display_name;
    }
    if (brandEl) brandEl.textContent = STR.brandLine;

    var roleCards = isZh
      ? profile.target_role_cards_zh && profile.target_role_cards_zh.length
        ? profile.target_role_cards_zh
        : profile.target_role_cards
      : profile.target_role_cards;

    var roles = [];
    if (isZh && profile.target_roles_zh && profile.target_roles_zh.length) roles = profile.target_roles_zh;
    else if (profile.target_roles && profile.target_roles.length) roles = profile.target_roles;

    if (metaEl) {
      metaEl.hidden = false;
      if (roleCards && roleCards.length) {
        var cardParts = roleCards.map(function (c) {
          return esc(c.title || "");
        });
        var cardBody = cardParts.join(isZh ? "；" : "; ");
        metaEl.innerHTML =
          '<span class="badge hero-seeking-badge"><span class="badge-dot"></span><span class="hero-seeking-inner"><strong>' +
          esc(STR.seekingLabel) +
          ':</strong> ' +
          cardBody +
          "</span></span>";
      } else if (roles.length) {
        var joined = roles.join(isZh ? "；" : "; ");
        metaEl.innerHTML =
          '<span class="badge hero-seeking-badge"><span class="badge-dot"></span><span class="hero-seeking-inner"><strong>' +
          esc(STR.seekingLabel) +
          ":</strong> " +
          esc(joined) +
          "</span></span>";
      } else {
        metaEl.innerHTML =
          '<span class="badge"><span class="badge-dot"></span>' + esc(STR.loadingMeta) + "</span>";
      }
    }

    if (!contactEl) return;
    var c = profile.contact || {};
    var links = profile.links || {};
    var parts = [];
    if (c.email) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          (isZh ? "邮箱" : "Email") +
          ":</strong> <a href=\"mailto:" +
          esc(c.email) +
          "\">" +
          esc(c.email) +
          "</a></span>"
      );
    }
    if (c.phone) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          (isZh ? "电话" : "Phone") +
          ":</strong> " +
          esc(formatPhone(c.phone)) +
          "</span>"
      );
    }
    var addr = isZh && profile.address_zh ? profile.address_zh : profile.address;
    if (addr) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          (isZh ? "所在地" : "Location") +
          ":</strong> " +
          esc(addr) +
          "</span>"
      );
    }
    if (links.linkedin) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          esc(STR.linkedinLabel) +
          ':</strong> <a href="' +
          esc(links.linkedin) +
          "\" target=\"_blank\" rel=\"noreferrer\">" +
          esc(links.linkedin.replace(/^https?:\/\//, "")) +
          "</a></span>"
      );
    }
    if (links.github) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          esc(STR.githubLabel) +
          ':</strong> <a href="' +
          esc(links.github) +
          "\" target=\"_blank\" rel=\"noreferrer\">" +
          esc(links.github.replace(/^https?:\/\//, "")) +
          "</a></span>"
      );
    }
    if (links.portfolio) {
      parts.push(
        '<span class="hero-contact-item"><strong>' +
          (isZh ? "个人网站" : "Website") +
          ":</strong> <a href=\"" +
          esc(links.portfolio) +
          "\" target=\"_blank\" rel=\"noreferrer\">" +
          esc(links.portfolio.replace(/^https?:\/\//, "")) +
          "</a></span>"
      );
    }
    contactEl.innerHTML = parts.join("");
  }

  function applySkills(profile) {
    var tagsEl = document.querySelector("[data-career-skills-tags]");
    var listEl = document.querySelector("[data-career-skills-list]");
    var langEl = document.querySelector("[data-career-languages]");
    var courseEl = document.querySelector("[data-career-related-coursework]");
    var skills = profile.skills || [];
    if (tagsEl) {
      tagsEl.innerHTML = skills.map(function (s) { return '<span class="tag">' + esc(s) + "</span>"; }).join("");
    }
    if (listEl) listEl.textContent = skills.join(isZh ? "、" : ", ");
    if (langEl && profile.languages && profile.languages.length) {
      langEl.textContent = profile.languages
        .map(function (L) {
          if (isZh) return langNameDisplay(L.name) + "（" + langLevelDisplay(L.level) + "）";
          return (L.name || "") + " (" + (L.level || "") + ")";
        })
        .join(isZh ? " · " : " · ");
    }
    if (courseEl) {
      var cw = isZh ? profile.related_coursework_zh || profile.related_coursework : profile.related_coursework;
      courseEl.textContent = cw || "";
    }
  }

  function buildProjectTagBar(bullets) {
    var bar = document.querySelector("[data-career-project-tags]");
    if (!bar || !bullets || !bullets.length) return;
    var seen = {};
    var unique = [];
    bullets.forEach(function (b) {
      (b.tags || []).forEach(function (t) {
        var k = String(t).toLowerCase().trim();
        if (!k) return;
        if (!seen[k]) {
          seen[k] = true;
          unique.push({ key: k, label: String(t).trim() });
        }
      });
    });
    unique.sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });
    var buttons = [
      '<button type="button" class="filter-button filter-button--active" data-career-project-tag="all">' +
        esc(STR.allTag) +
        "</button>",
    ];
    unique.forEach(function (x) {
      buttons.push(
        '<button type="button" class="filter-button" data-career-project-tag="' +
          esc(x.key) +
          '">' +
          esc(x.label) +
          "</button>"
      );
    });
    bar.innerHTML = buttons.join("");
  }

  function parseCardTagList(card) {
    var raw = card.getAttribute("data-record-tags");
    if (raw == null || raw === "") return [];
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(function (x) { return String(x).toLowerCase().trim(); }).filter(Boolean);
    } catch (e1) {}
    return raw.split(/\s+/).map(function (x) { return x.toLowerCase().trim(); }).filter(Boolean);
  }

  function wireProjectTagFilter() {
    var bar = document.querySelector("[data-career-project-tags]");
    var cards = document.querySelectorAll("[data-career-project-card]");
    if (!bar || !cards.length) return;

    bar.querySelectorAll("[data-career-project-tag]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = (btn.getAttribute("data-career-project-tag") || "all").toLowerCase().trim();
        bar.querySelectorAll(".filter-button").forEach(function (b) {
          b.classList.toggle("filter-button--active", b === btn);
        });
        cards.forEach(function (card) {
          var arr = parseCardTagList(card);
          var show = val === "all" || arr.indexOf(val) >= 0;
          card.classList.toggle("career-project-card--hidden", !show);
        });
      });
    });
  }

  async function run() {
    var base = "data/";
    var profile, experiences, bullets;
    try {
      profile = await loadJson(base + "profile.json");
      experiences = await loadJson(base + "experiences.json");
      bullets = await loadJson(base + "bullets.json");
    } catch (e) {
      console.warn("[career-site]", e);
      return;
    }

    applyHero(profile);
    applySkills(profile);

    var eduSub = document.querySelector("[data-career-edu-subtitle]");
    if (eduSub) eduSub.textContent = STR.eduSub;

    var skillsSub = document.querySelector("[data-career-section-skills] .section-subtitle");
    if (skillsSub) skillsSub.textContent = isZh ? "技能与课程来自个人数据库 profile.json。" : "Skills and coursework from profile.json in your career database.";

    var eduMount = document.querySelector("[data-career-mount=\"education\"]");
    if (eduMount && profile.education) eduMount.innerHTML = buildEducationHtml(profile.education);

    var spotMount = document.querySelector("[data-career-mount=\"spotlight\"]");
    if (spotMount && experiences && experiences.length) {
      spotMount.innerHTML = experiences.map(buildSpotlightExp).join("");
    }

    var spotH2 = document.querySelector("[data-career-section-spotlight] .section-title");
    var spotP = document.querySelector("[data-career-section-spotlight] .section-subtitle");
    if (spotH2) spotH2.textContent = STR.spotlightTitle;
    if (spotP) spotP.textContent = STR.spotlightSub;

    var projMount = document.querySelector("[data-career-mount=\"projects\"]");
    if (bullets && bullets.length) {
      buildProjectTagBar(bullets);
    }
    if (projMount && bullets && bullets.length) {
      projMount.innerHTML = bullets.map(buildProjectRecordArticle).join("");
    }
    var projH2 = document.querySelector("[data-career-section-projects] .section-title");
    var projP = document.querySelector("[data-career-section-projects] .section-subtitle");
    if (projH2) projH2.textContent = STR.projectsTitle;
    if (projP) projP.textContent = STR.projectsSub;
    wireProjectTagFilter();

    var workMount = document.querySelector("[data-career-mount=\"work-experience\"]");
    if (workMount && experiences && experiences.length) {
      workMount.innerHTML = experiences.map(buildWorkArticle).join("");
    }
    var workH2 = document.querySelector("[data-career-section-work] .section-title");
    var workP = document.querySelector("[data-career-section-work] .section-subtitle");
    if (workH2) workH2.textContent = STR.workTitle;
    if (workP) workP.textContent = STR.workSub;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
