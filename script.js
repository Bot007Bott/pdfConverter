(function () {
  "use strict";

  // =========================
  // STATE
  // =========================

  var items = [];
  var nextId = 1;

  // =========================
  // DOM
  // =========================

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
  var fileNameEl = document.getElementById("fileName");

  var pageSizeEl = document.getElementById("pageSize");

  var orientationEl = document.getElementById("orientation");

  var fitModeEl = document.getElementById("fitMode");

  var marginEl = document.getElementById("margin");

  // =========================
  // EVENTS
  // =========================

  dropZone.addEventListener("click", function (event) {
    if (event.target === fileInput) {
      return;
    }

    if (event.target === chooseBtn) {
      return;
    }

    fileInput.click();
  });

  chooseBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      addFiles(fileInput.files);

      // Allows selecting the same file again later.
      fileInput.value = "";
    }
  });

  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();

    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();

    dropZone.classList.remove("drag-over");

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  });

  clearBtn.addEventListener("click", function () {
    clearAll();
  });

  downloadBtn.addEventListener("click", function () {
    generatePDF();
  });

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

      var dimensions = "Loading...";

      if (item.width > 0 && item.height > 0) {
        dimensions = item.width + " × " + item.height + " px";
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
        dimensions +
        "</div>" +
        "</div>" +
        '<div class="image-actions">' +
        "<button " +
        'class="icon-btn move" ' +
        'data-action="up" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Move up" ' +
        (isFirst ? "disabled" : "") +
        ">↑</button>" +
        "<button " +
        'class="icon-btn move" ' +
        'data-action="down" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Move down" ' +
        (isLast ? "disabled" : "") +
        ">↓</button>" +
        "<button " +
        'class="icon-btn delete" ' +
        'data-action="delete" ' +
        'data-id="' +
        item.id +
        '" ' +
        'title="Delete">' +
        "✕" +
        "</button>" +
        "</div>";

      imageList.appendChild(li);
    }

    imageList.onclick = function (event) {
      var button = event.target.closest("[data-action]");

      if (!button || button.disabled) {
        return;
      }

      var action = button.getAttribute("data-action");

      var id = parseInt(button.getAttribute("data-id"), 10);

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

      var page = computePage(item.width, item.height, pageSize, orientation);

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

  // =========================
  // PAGE SIZE
  // =========================

  function computePage(imgW, imgH, pageSize, orientation) {
    var pageW;
    var pageH;

    if (pageSize === "letter") {
      pageW = 216;
      pageH = 279;
    } else if (pageSize === "original") {
      // Convert pixels to a sensible
      // mm size while keeping aspect ratio.
      var maxWidth = 210;

      pageW = maxWidth;

      pageH = maxWidth * (imgH / imgW);

      if (pageH < 1) {
        pageH = 1;
      }
    } else {
      // A4
      pageW = 210;
      pageH = 297;
    }

    if (orientation === "portrait") {
      if (pageW > pageH) {
        var pTemp = pageW;
        pageW = pageH;
        pageH = pTemp;
      }
    }

    if (orientation === "landscape") {
      if (pageH > pageW) {
        var lTemp = pageW;
        pageW = pageH;
        pageH = lTemp;
      }
    }

    if (orientation === "auto") {
      var imageLandscape = imgW > imgH;

      if (imageLandscape && pageW < pageH) {
        var aTemp1 = pageW;
        pageW = pageH;
        pageH = aTemp1;
      }

      if (!imageLandscape && pageH < pageW) {
        var aTemp2 = pageW;
        pageW = pageH;
        pageH = aTemp2;
      }
    }

    return {
      width: pageW,
      height: pageH,
    };
  }

  // =========================
  // PDF GENERATION
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

      // =========================
      // FILE NAME
      // =========================

      var fileName = fileNameEl.value.trim();

      if (!fileName) {
        fileName = "images";
      }

      // Remove .pdf if user typed it.
      fileName = fileName.replace(/\.pdf$/i, "");

      // Remove characters that are
      // invalid/problematic in filenames.
      fileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

      fileName = fileName.trim();

      if (!fileName) {
        fileName = "images";
      }

      var doc = null;
      var addedPages = 0;

      for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (!item.width || !item.height) {
          continue;
        }

        var page = computePage(item.width, item.height, pageSize, orientation);

        var pageW = page.width;

        var pageH = page.height;

        var isPortrait = pageH >= pageW;

        // =========================
        // CREATE PDF
        // =========================

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

        // =========================
        // CONTENT AREA
        // =========================

        var contentW = pageW - margin * 2;

        var contentH = pageH - margin * 2;

        if (contentW <= 0 || contentH <= 0) {
          margin = 0;

          contentW = pageW;
          contentH = pageH;
        }

        // =========================
        // WAIT FOR IMAGE
        // =========================

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

        // =========================
        // ADD IMAGE
        // =========================

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

      // =========================
      // SAVE
      // =========================

      if (doc && addedPages > 0) {
        doc.save(fileName + ".pdf");
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
  // LOAD IMAGE
  // =========================

  function loadImageData(item) {
    return new Promise(function (resolve, reject) {
      var img = new Image();

      img.onload = function () {
        try {
          var maxDimension = 3000;

          var width = img.naturalWidth;

          var height = img.naturalHeight;

          if (!width || !height) {
            reject(new Error("Invalid image dimensions"));

            return;
          }

          // Reduce extremely large
          // images to protect browser
          // memory.
          if (width > maxDimension || height > maxDimension) {
            var scale = maxDimension / Math.max(width, height);

            width = Math.round(width * scale);

            height = Math.round(height * scale);
          }

          var canvas = document.createElement("canvas");

          canvas.width = width;

          canvas.height = height;

          var ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not create canvas"));

            return;
          }

          // White background.
          // This makes transparent PNGs
          // look correct in the PDF.
          ctx.fillStyle = "#ffffff";

          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          var imageData = canvas.toDataURL("image/jpeg", 0.92);

          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = function () {
        reject(new Error("Could not load " + item.name));
      };

      img.src = item.url;
    });
  }

  // =========================
  // SECURITY / HTML HELPERS
  // =========================

  function escapeHTML(value) {
    var div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // =========================
  // INITIAL RENDER
  // =========================

  render();
})();
