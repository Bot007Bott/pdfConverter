(function () {
  "use strict";

  var items = [];
  var nextId = 1;

  // DOM
  var dropZone = document.getElementById("dropZone");
  var fileInput = document.getElementById("fileInput");
  var chooseBtn = document.getElementById("chooseBtn");

  var imageSection = document.getElementById("imageSection");
  var imageList = document.getElementById("imageList");
  var countBadge = document.getElementById("countBadge");
  var clearBtn = document.getElementById("clearBtn");

  var settingsSection = document.getElementById("settingsSection");
  var previewSection = document.getElementById("previewSection");
  var previewGrid = document.getElementById("previewGrid");

  var actionsSection = document.getElementById("actionsSection");
  var downloadBtn = document.getElementById("downloadBtn");

  // Settings
  var pageSizeEl = document.getElementById("pageSize");
  var orientationEl = document.getElementById("orientation");
  var fitModeEl = document.getElementById("fitMode");
  var marginEl = document.getElementById("margin");

  // =========================
  // EVENTS
  // =========================

  dropZone.addEventListener("click", function (e) {
    if (e.target === fileInput) {
      return;
    }

    fileInput.click();
  });

  chooseBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      addFiles(fileInput.files);
      fileInput.value = "";
    }
  });

  dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  });

  clearBtn.addEventListener("click", function () {
    clearAll();
  });

  downloadBtn.addEventListener("click", function () {
    generatePDF();
  });

  // Update preview when settings change
  pageSizeEl.addEventListener("change", renderPreview);
  orientationEl.addEventListener("change", renderPreview);
  fitModeEl.addEventListener("change", renderPreview);
  marginEl.addEventListener("change", renderPreview);

  // =========================
  // FILE HANDLING
  // =========================

  function addFiles(fileList) {
    var validTypes = ["image/png", "image/jpeg"];

    for (var i = 0; i < fileList.length; i++) {
      var file = fileList[i];

      if (validTypes.indexOf(file.type) !== -1) {
        addItem(file);
      }
    }

    render();
  }

  function addItem(file) {
    var id = nextId++;

    var url = URL.createObjectURL(file);

    var item = {
      id: id,
      file: file,
      url: url,
      name: file.name,
      width: 0,
      height: 0,
    };

    items.push(item);

    loadDimensions(item);
  }

  function loadDimensions(item) {
    var img = new Image();

    img.onload = function () {
      item.width = img.naturalWidth;
      item.height = img.naturalHeight;

      render();
    };

    img.onerror = function () {
      console.warn("Could not load image:", item.name);
    };

    img.src = item.url;
  }

  function removeItem(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        URL.revokeObjectURL(items[i].url);
        items.splice(i, 1);
        break;
      }
    }

    render();
  }

  function moveItem(id, direction) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        var newIndex = i + direction;

        if (newIndex >= 0 && newIndex < items.length) {
          var temp = items[i];

          items[i] = items[newIndex];
          items[newIndex] = temp;
        }

        break;
      }
    }

    render();
  }

  function clearAll() {
    for (var i = 0; i < items.length; i++) {
      URL.revokeObjectURL(items[i].url);
    }

    items = [];

    render();
  }

  // =========================
  // RENDER
  // =========================

  function render() {
    var hasItems = items.length > 0;

    imageSection.hidden = !hasItems;
    settingsSection.hidden = !hasItems;
    previewSection.hidden = !hasItems;
    actionsSection.hidden = !hasItems;

    countBadge.textContent = items.length;

    renderImageList();
    renderPreview();
  }

  function renderImageList() {
    imageList.innerHTML = "";

    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      var li = document.createElement("li");
      li.className = "image-item";

      var isFirst = i === 0;
      var isLast = i === items.length - 1;

      var dimsText = "Loading...";

      if (item.width > 0 && item.height > 0) {
        dimsText = item.width + " × " + item.height + " px";
      }

      li.innerHTML =
        '<img src="' +
        escapeAttr(item.url) +
        '" alt="">' +
        '<div class="image-info">' +
        '<div class="image-name">' +
        escapeHTML(item.name) +
        "</div>" +
        '<div class="image-dims">' +
        dimsText +
        "</div>" +
        "</div>" +
        '<div class="image-actions">' +
        '<button class="icon-btn move" ' +
        'data-action="up" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Move up"' +
        (isFirst ? " disabled" : "") +
        ">↑</button>" +
        '<button class="icon-btn move" ' +
        'data-action="down" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Move down"' +
        (isLast ? " disabled" : "") +
        ">↓</button>" +
        '<button class="icon-btn delete" ' +
        'data-action="delete" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Delete">✕</button>' +
        "</div>";

      imageList.appendChild(li);
    }

    imageList.onclick = function (e) {
      var btn = e.target.closest("[data-action]");

      if (!btn || btn.disabled) {
        return;
      }

      var action = btn.getAttribute("data-action");
      var id = parseInt(btn.getAttribute("data-id"), 10);

      if (action === "up") {
        moveItem(id, -1);
      }

      if (action === "down") {
        moveItem(id, 1);
      }

      if (action === "delete") {
        removeItem(id);
      }
    };
  }

  // =========================
  // PREVIEW
  // =========================

  function renderPreview() {
    previewGrid.innerHTML = "";

    if (items.length === 0) {
      return;
    }

    var pageSize = pageSizeEl.value;
    var orientation = orientationEl.value;
    var margin = parseInt(marginEl.value, 10) || 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      if (!item.width || !item.height) {
        continue;
      }

      var page = computePage(
        item.width,
        item.height,
        pageSize,
        orientation,
        margin,
      );

      var card = document.createElement("div");
      card.className = "preview-page";

      card.innerHTML =
        '<img src="' +
        escapeAttr(item.url) +
        '" alt="">' +
        '<div class="preview-label">' +
        "Page " +
        (i + 1) +
        " · " +
        page.width +
        "×" +
        page.height +
        "mm" +
        "</div>";

      previewGrid.appendChild(card);
    }
  }

  function computePage(imgW, imgH, pageSize, orientation, margin) {
    var pw;
    var ph;

    if (pageSize === "original") {
      // Keep the original aspect ratio.
      var scale = 210 / imgW;

      pw = Math.round(imgW * scale);
      ph = Math.round(imgH * scale);
    } else if (pageSize === "letter") {
      pw = 216;
      ph = 279;
    } else {
      // A4
      pw = 210;
      ph = 297;
    }

    if (orientation === "portrait") {
      if (pw > ph) {
        var temp = pw;
        pw = ph;
        ph = temp;
      }
    } else if (orientation === "landscape") {
      if (ph > pw) {
        var temp2 = pw;
        pw = ph;
        ph = temp2;
      }
    } else {
      // Auto
      if (imgW > imgH && pw < ph) {
        var temp3 = pw;
        pw = ph;
        ph = temp3;
      }

      if (imgH > imgW && ph < pw) {
        var temp4 = pw;
        pw = ph;
        ph = temp4;
      }
    }

    return {
      width: pw,
      height: ph,
    };
  }

  // =========================
  // PDF
  // =========================

  async function generatePDF() {
    if (items.length === 0) {
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "PDF library could not load. Please check your internet connection and try again.",
      );

      return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = "Generating...";

    try {
      var jsPDF = window.jspdf.jsPDF;

      var pageSize = pageSizeEl.value;
      var orientation = orientationEl.value;
      var fitMode = fitModeEl.value;
      var margin = parseInt(marginEl.value, 10) || 0;

      var doc = null;
      var addedPages = 0;

      for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (!item.width || !item.height) {
          continue;
        }

        var page = computePage(
          item.width,
          item.height,
          pageSize,
          orientation,
          0,
        );

        var pageW = page.width;
        var pageH = page.height;

        var isPortrait = pageH >= pageW;

        // Create first page
        if (doc === null) {
          doc = new jsPDF({
            orientation: isPortrait ? "portrait" : "landscape",

            unit: "mm",

            format: [pageW, pageH],
          });
        } else {
          doc.addPage([pageW, pageH], isPortrait ? "portrait" : "landscape");
        }

        addedPages++;

        var contentW = pageW - margin * 2;

        var contentH = pageH - margin * 2;

        // Make sure margins cannot make
        // the content area negative.
        if (contentW <= 0) {
          contentW = pageW;
          margin = 0;
        }

        if (contentH <= 0) {
          contentH = pageH;
          margin = 0;
        }

        var imageData = await loadImageData(item);

        var drawW;
        var drawH;
        var drawX;
        var drawY;

        // =========================
        // FIT TO PAGE
        // =========================

        if (fitMode === "contain") {
          var containRatio = Math.min(
            contentW / item.width,
            contentH / item.height,
          );

          drawW = item.width * containRatio;

          drawH = item.height * containRatio;

          drawX = margin + (contentW - drawW) / 2;

          drawY = margin + (contentH - drawH) / 2;
        }

        // =========================
        // FILL PAGE
        // =========================
        else if (fitMode === "cover") {
          var coverRatio = Math.max(
            contentW / item.width,
            contentH / item.height,
          );

          drawW = item.width * coverRatio;

          drawH = item.height * coverRatio;

          drawX = margin + (contentW - drawW) / 2;

          drawY = margin + (contentH - drawH) / 2;
        }

        // =========================
        // ORIGINAL SIZE
        // =========================
        else {
          var originalRatio = Math.min(
            1,
            contentW / item.width,
            contentH / item.height,
          );

          drawW = item.width * originalRatio;

          drawH = item.height * originalRatio;

          drawX = margin + (contentW - drawW) / 2;

          drawY = margin + (contentH - drawH) / 2;
        }

        // We convert everything to JPEG
        // after putting a white background
        // behind the image.
        doc.addImage(
          imageData,
          "JPEG",
          drawX,
          drawY,
          drawW,
          drawH,
          undefined,
          "FAST",
        );
      }

      if (doc && addedPages > 0) {
        doc.save("images.pdf");
      } else {
        alert("No valid images were available to create the PDF.");
      }
    } catch (error) {
      console.error("PDF generation error:", error);

      alert(
        "Could not create the PDF. Please try again with smaller or fewer images.",
      );
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = "📥 Download PDF";
    }
  }

  // =========================
  // LOAD IMAGE CORRECTLY
  // =========================

  function loadImageData(item) {
    return new Promise(function (resolve, reject) {
      var img = new Image();

      img.onload = function () {
        try {
          var maxDim = 3000;

          var w = img.naturalWidth;
          var h = img.naturalHeight;

          if (!w || !h) {
            reject(new Error("Invalid image dimensions"));

            return;
          }

          // Reduce very large images so
          // the browser does not use too much memory.
          if (w > maxDim || h > maxDim) {
            var scale = maxDim / Math.max(w, h);

            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          var canvas = document.createElement("canvas");

          canvas.width = w;
          canvas.height = h;

          var ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not create canvas"));

            return;
          }

          // White background.
          // This also handles transparent PNGs.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);

          ctx.drawImage(img, 0, 0, w, h);

          var data = canvas.toDataURL("image/jpeg", 0.92);

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = function () {
        reject(new Error("Could not load " + item.name));
      };

      // Use the existing object URL.
      img.src = item.url;
    });
  }

  // =========================
  // HELPERS
  // =========================

  function escapeHTML(str) {
    var div = document.createElement("div");

    div.textContent = str;

    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // =========================
  // START
  // =========================

  render();
})();
