(function () {
  const API_BASE = window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://127.0.0.1:5000";

  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("ok", "err", "warn", "info");
    if (type) el.classList.add(type);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function syncTextareaHeights() {
    if (typeof window !== "undefined" && typeof window.devToolboxAutoResizeAllTextareas === "function") {
      window.devToolboxAutoResizeAllTextareas();
      return;
    }

    Array.from(document.querySelectorAll("textarea")).forEach((textarea) => {
      const minHeight = Number.parseFloat(window.getComputedStyle(textarea).minHeight) || 180;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
    });
  }

  syncTextareaHeights();

  // ---------- CRON Translator ----------
  const cronInput = document.getElementById("cronInput");
  const cronMuleFlag = document.getElementById("cronMuleFlag");
  const cronTranslateBtn = document.getElementById("cronTranslateBtn");
  const cronClearBtn = document.getElementById("cronClearBtn");
  const cronStatus = document.getElementById("cronStatus");
  const cronOutput = document.getElementById("cronOutput");

  if (cronTranslateBtn && cronInput && cronOutput) {
    cronTranslateBtn.addEventListener("click", () => {
      try {
        const expr = cronInput.value.trim();
        if (!expr) {
          throw new Error("Inserisci una cron expression.");
        }
        const isMule = Boolean(cronMuleFlag && cronMuleFlag.checked);
        const result = translateCron(expr, isMule);
        cronOutput.innerHTML = result.html;
        setStatus(cronStatus, result.status, "ok");
      } catch (error) {
        cronOutput.innerHTML = "";
        setStatus(cronStatus, `Errore: ${error.message}`, "err");
      }
    });
  }

  if (cronClearBtn) {
    cronClearBtn.addEventListener("click", () => {
      if (cronInput) cronInput.value = "";
      if (cronOutput) cronOutput.innerHTML = "";
      if (cronMuleFlag) cronMuleFlag.checked = false;
      setStatus(cronStatus, "");
      syncTextareaHeights();
    });
  }

  function translateCron(expression, muleMode) {
    const parts = expression.split(/\s+/).filter(Boolean);
    const expected = muleMode ? [6, 7] : [5];
    if (!expected.includes(parts.length)) {
      const label = muleMode ? "6 o 7 campi" : "5 campi";
      throw new Error(`Formato non valido: attesi ${label}, trovati ${parts.length}.`);
    }

    let fields;
    if (muleMode) {
      fields = {
        second: parts[0],
        minute: parts[1],
        hour: parts[2],
        dayOfMonth: parts[3],
        month: parts[4],
        dayOfWeek: parts[5],
        year: parts[6] || "*",
      };
    } else {
      fields = {
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      };
    }

    const rows = [];
    if (muleMode) rows.push(describeField("Seconds", fields.second, "second"));
    rows.push(describeField("Minutes", fields.minute, "minute"));
    rows.push(describeField("Hours", fields.hour, "hour"));
    rows.push(describeField("Day of month", fields.dayOfMonth, "dom"));
    rows.push(describeField("Month", fields.month, "month"));
    rows.push(describeField("Day of week", fields.dayOfWeek, "dow"));
    if (muleMode) rows.push(describeField("Year", fields.year, "year"));

    const notes = [];
    if (muleMode && fields.dayOfMonth !== "?" && fields.dayOfWeek !== "?") {
      notes.push("In Quartz/MuleSoft in genere uno tra Day-of-month e Day-of-week deve essere '?'.");
    }

    const htmlRows = rows
      .map((row) => `<li><strong>${row.label}:</strong> ${escapeHtml(row.value)}</li>`)
      .join("");
    const notesHtml = notes.length
      ? `<p>${notes.map((n) => `- ${escapeHtml(n)}`).join("<br>")}</p>`
      : "";

    return {
      status: muleMode ? "Traduzione CRON MuleSoft completata." : "Traduzione CRON standard completata.",
      html: `<ul>${htmlRows}</ul>${notesHtml}`,
    };
  }

  function describeField(label, value, type) {
    const cleaned = String(value || "").trim();
    if (!cleaned || cleaned === "*" || cleaned === "?") {
      return { label, value: "every value" };
    }

    if (cleaned.includes(",")) {
      return {
        label,
        value: `one of ${cleaned
          .split(",")
          .map((v) => describeSimple(v.trim(), type))
          .join(", ")}`,
      };
    }

    if (cleaned.includes("/")) {
      const [base, step] = cleaned.split("/");
      if (!step) return { label, value: describeSimple(cleaned, type) };
      if (!base || base === "*" || base === "?") {
        return { label, value: `every ${step} units` };
      }
      return {
        label,
        value: `every ${step} units starting at ${describeSimple(base, type)}`,
      };
    }

    if (cleaned.includes("-")) {
      const [from, to] = cleaned.split("-");
      if (from && to) {
        return {
          label,
          value: `from ${describeSimple(from, type)} to ${describeSimple(to, type)}`,
        };
      }
    }

    return { label, value: describeSimple(cleaned, type) };
  }

  function describeSimple(raw, type) {
    const token = String(raw || "").trim();
    const monthMap = {
      "1": "January", "2": "February", "3": "March", "4": "April", "5": "May", "6": "June",
      "7": "July", "8": "August", "9": "September", "10": "October", "11": "November", "12": "December",
      JAN: "January", FEB: "February", MAR: "March", APR: "April", MAY: "May", JUN: "June",
      JUL: "July", AUG: "August", SEP: "September", OCT: "October", NOV: "November", DEC: "December",
    };
    const dowMap = {
      "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday", "7": "Sunday",
      SUN: "Sunday", MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday",
    };

    if (type === "month" && monthMap[token.toUpperCase()]) return monthMap[token.toUpperCase()];
    if (type === "dow" && dowMap[token.toUpperCase()]) return dowMap[token.toUpperCase()];

    return token;
  }

  async function convertJsonYamlApi(input, direction, indent) {
    const response = await fetch(`${API_BASE}/api/json-yaml/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        direction,
        indent,
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      throw new Error("Risposta API non valida.");
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Conversione non riuscita.");
    }

    return data.output || "";
  }

  // ---------- JSON/XML Formatter ----------
  const formatType = document.getElementById("formatType");
  const formatIndent = document.getElementById("formatIndent");
  const formatSortToggle = document.getElementById("formatSortToggle");
  const formatPlainTextToggle = document.getElementById("formatPlainTextToggle");
  const formatInput = document.getElementById("formatInput");
  const formatOutput = document.getElementById("formatOutput");
  const formatStatus = document.getElementById("formatStatus");
  const formatValidateBtn = document.getElementById("formatValidateBtn");
  const formatPrettyBtn = document.getElementById("formatPrettyBtn");
  const formatMinifyBtn = document.getElementById("formatMinifyBtn");
  const formatCopyBtn = document.getElementById("formatCopyBtn");
  const formatClearBtn = document.getElementById("formatClearBtn");

  function getIndentValue() {
    const n = Number(formatIndent && formatIndent.value ? formatIndent.value : 2);
    return Math.max(1, Math.min(8, Number.isFinite(n) ? n : 2));
  }

  function shouldSortOutput() {
    return Boolean(formatSortToggle && formatSortToggle.checked);
  }

  function shouldConvertPlainText(mode) {
    if (mode !== "json") return false;
    return Boolean(formatPlainTextToggle && formatPlainTextToggle.checked);
  }

  function sortJsonDeep(value) {
    if (Array.isArray(value)) {
      return value.map(sortJsonDeep);
    }

    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      const sorted = {};
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          sorted[key] = sortJsonDeep(value[key]);
        });
      return sorted;
    }

    return value;
  }

  function parseXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const errNode = doc.getElementsByTagName("parsererror")[0];
    if (errNode) {
      throw new Error(errNode.textContent.replace(/\s+/g, " ").trim());
    }
    return doc;
  }

  function sanitizeXmlTagName(name) {
    let normalized = String(name || "").trim().replace(/[^A-Za-z0-9_.:-]/g, "_");
    if (!normalized) normalized = "item";
    if (!/^[A-Za-z_]/.test(normalized)) normalized = `n_${normalized}`;
    return normalized;
  }

  function sortXmlChildren(children) {
    const allElements = children.length > 0 && children.every((child) => child.nodeType === Node.ELEMENT_NODE);
    if (!allElements) {
      return children;
    }

    return children.slice().sort((a, b) => {
      const nameCmp = a.nodeName.localeCompare(b.nodeName);
      if (nameCmp !== 0) return nameCmp;
      const textA = (a.textContent || "").trim();
      const textB = (b.textContent || "").trim();
      return textA.localeCompare(textB);
    });
  }

  function formatXml(xmlText, indentSize, sortXml) {
    const doc = parseXml(xmlText);
    const indent = " ".repeat(indentSize);
    const lines = [];

    function renderNode(node, level) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text) lines.push(`${indent.repeat(level)}${text}`);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      let attrs = Array.from(node.attributes || []);
      if (sortXml) {
        attrs = attrs.sort((a, b) => a.name.localeCompare(b.name));
      }
      const attrsText = attrs.map((a) => `${a.name}="${a.value}"`).join(" ");
      const open = attrsText ? `<${node.nodeName} ${attrsText}>` : `<${node.nodeName}>`;
      const close = `</${node.nodeName}>`;

      let children = Array.from(node.childNodes || []).filter((child) => {
        if (child.nodeType === Node.TEXT_NODE) return child.nodeValue.trim() !== "";
        return true;
      });

      if (sortXml) {
        children = sortXmlChildren(children);
      }

      if (!children.length) {
        const selfClosing = attrsText ? `<${node.nodeName} ${attrsText} />` : `<${node.nodeName} />`;
        lines.push(`${indent.repeat(level)}${selfClosing}`);
        return;
      }

      if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
        lines.push(`${indent.repeat(level)}${open}${children[0].nodeValue.trim()}${close}`);
        return;
      }

      lines.push(`${indent.repeat(level)}${open}`);
      children.forEach((child) => renderNode(child, level + 1));
      lines.push(`${indent.repeat(level)}${close}`);
    }

    renderNode(doc.documentElement, 0);
    return lines.join("\n");
  }

  function minifyXml(xmlText, sortXml) {
    if (!sortXml) {
      parseXml(xmlText);
      return xmlText.replace(/>\s+</g, "><").trim();
    }
    const canonical = formatXml(xmlText, 0, true);
    return canonical.replace(/\n+/g, "").replace(/>\s+</g, "><").trim();
  }

  function plainTextToJsonValue(raw) {
    const normalized = String(raw || "").trim();
    if (!normalized) {
      throw new Error("Plain text vuoto: impossibile convertire in JSON.");
    }

    const lines = normalized
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      return lines;
    }

    const singleLine = lines[0];
    const words = singleLine
      .split(/[,\s;]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    if (words.length > 1) {
      return words;
    }

    return singleLine;
  }

  function parseJsonWithPlainTextFallback(raw, allowPlainTextFallback) {
    try {
      return {
        payload: JSON.parse(raw),
        plainTextFallbackUsed: false,
      };
    } catch (error) {
      if (!allowPlainTextFallback) {
        throw error;
      }
      return {
        payload: plainTextToJsonValue(raw),
        plainTextFallbackUsed: true,
      };
    }
  }

  function normalizeJson(raw, minify, indent, sortKeys, allowPlainTextFallback) {
    const parsedResult = parseJsonWithPlainTextFallback(raw, allowPlainTextFallback);
    let parsed = parsedResult.payload;
    if (sortKeys) {
      parsed = sortJsonDeep(parsed);
    }
    return {
      output: minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent),
      plainTextFallbackUsed: parsedResult.plainTextFallbackUsed,
    };
  }

  function normalizeXml(raw, minify, indent, sortXml) {
    return minify ? minifyXml(raw, sortXml) : formatXml(raw, indent, sortXml);
  }

  function appendJsonAsXml(doc, parent, key, value) {
    const nodeName = sanitizeXmlTagName(key);

    if (Array.isArray(value)) {
      if (value.length === 0) {
        parent.appendChild(doc.createElement(nodeName));
        return;
      }
      value.forEach((item) => appendJsonAsXml(doc, parent, nodeName, item));
      return;
    }

    const node = doc.createElement(nodeName);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      Object.keys(value).forEach((childKey) => {
        appendJsonAsXml(doc, node, childKey, value[childKey]);
      });
    } else if (value === null || typeof value === "undefined") {
      node.setAttribute("nil", "true");
    } else {
      node.textContent = String(value);
    }
    parent.appendChild(node);
  }

  function jsonToXml(raw, minify, indent, sortXml) {
    let parsed = JSON.parse(raw);
    if (sortXml) {
      parsed = sortJsonDeep(parsed);
    }

    const doc = document.implementation.createDocument("", "", null);
    const root = doc.createElement("root");
    doc.appendChild(root);

    if (Array.isArray(parsed)) {
      parsed.forEach((item) => appendJsonAsXml(doc, root, "item", item));
    } else if (parsed && Object.prototype.toString.call(parsed) === "[object Object]") {
      Object.keys(parsed).forEach((key) => appendJsonAsXml(doc, root, key, parsed[key]));
    } else {
      appendJsonAsXml(doc, root, "value", parsed);
    }

    const serialized = new XMLSerializer().serializeToString(doc);
    return minify ? minifyXml(serialized, sortXml) : formatXml(serialized, indent, sortXml);
  }

  function xmlElementToJson(node) {
    const elementChildren = Array.from(node.children || []);
    const textContent = Array.from(node.childNodes || [])
      .filter((child) => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== "")
      .map((child) => child.nodeValue.trim())
      .join(" ");
    const attrs = Array.from(node.attributes || []);

    if (!elementChildren.length && attrs.length === 1 && attrs[0].name === "nil" && attrs[0].value === "true" && !textContent) {
      return null;
    }

    if (!elementChildren.length && attrs.length === 0) {
      return textContent || null;
    }

    const result = {};
    attrs.forEach((attr) => {
      result[`@${attr.name}`] = attr.value;
    });
    if (textContent) {
      result["#text"] = textContent;
    }

    elementChildren.forEach((child) => {
      const key = child.nodeName;
      const value = xmlElementToJson(child);
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        if (!Array.isArray(result[key])) {
          result[key] = [result[key]];
        }
        result[key].push(value);
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  function xmlToJson(raw, minify, indent, sortKeys) {
    const doc = parseXml(raw);
    let payload = { [doc.documentElement.nodeName]: xmlElementToJson(doc.documentElement) };
    if (sortKeys) {
      payload = sortJsonDeep(payload);
    }
    return minify ? JSON.stringify(payload) : JSON.stringify(payload, null, indent);
  }

  function getInputHintForMode(mode) {
    switch (mode) {
      case "json":
        return "Incolla JSON valido (oppure plain text con flag fallback attivo)...";
      case "xml":
        return "Incolla XML valido...";
      case "json_to_xml":
        return "Incolla JSON da convertire in XML...";
      case "xml_to_json":
        return "Incolla XML da convertire in JSON...";
      case "json_to_yaml":
        return "Incolla JSON da convertire in YAML...";
      case "yaml_to_json":
        return "Incolla YAML da convertire in JSON...";
      default:
        return "Incolla JSON, XML o YAML in base alla modalita selezionata...";
    }
  }

  function updateFormatterUi() {
    if (!formatType) return;
    const mode = formatType.value || "json";
    if (formatInput) {
      formatInput.placeholder = getInputHintForMode(mode);
    }
    if (formatMinifyBtn) {
      const minifyEnabled = mode !== "json_to_yaml";
      formatMinifyBtn.disabled = !minifyEnabled;
      formatMinifyBtn.title = minifyEnabled ? "" : "Minify non disponibile per output YAML.";
    }
    if (formatPlainTextToggle) {
      const enabled = mode === "json";
      formatPlainTextToggle.disabled = !enabled;
      formatPlainTextToggle.title = enabled ? "" : "Opzione disponibile solo in modalita JSON.";
    }
  }

  async function runFormatAction(action) {
    const raw = formatInput && formatInput.value ? formatInput.value : "";
    if (!raw.trim()) {
      const actionMap = {
        validate: "validare",
        pretty: "formattare o convertire",
        minify: "minificare",
      };
      setStatus(formatStatus, `Inserisci un payload da ${actionMap[action] || "elaborare"}.`, "err");
      return;
    }

    const mode = formatType && formatType.value ? formatType.value : "json";
    const indent = getIndentValue();
    const sortEnabled = shouldSortOutput();

    let output = "";
    let message = "";

    if (action === "validate") {
      message = "Payload valido. Output aggiornato.";
    } else if (action === "minify") {
      message = "Minify completato.";
    } else {
      message = "Formato / conversione completata.";
    }

    if (mode === "json") {
      const jsonResult = normalizeJson(raw, action === "minify", indent, sortEnabled, shouldConvertPlainText(mode));
      output = jsonResult.output;
      if (jsonResult.plainTextFallbackUsed) {
        message = action === "validate"
          ? "Plain text convertito in JSON valido. Output aggiornato."
          : action === "minify"
            ? "Plain text convertito e JSON minificato."
            : "Plain text convertito in JSON e formattato.";
      } else {
        message = action === "validate" ? "JSON valido. Output aggiornato." : action === "minify" ? "JSON minificato." : "Formato JSON completato.";
      }
    } else if (mode === "xml") {
      output = normalizeXml(raw, action === "minify", indent, sortEnabled);
      message = action === "validate" ? "XML valido. Output aggiornato." : action === "minify" ? "XML minificato." : "Formato XML completato.";
    } else if (mode === "json_to_xml") {
      output = jsonToXml(raw, action === "minify", indent, sortEnabled);
      message = action === "validate"
        ? "Conversione JSON -> XML valida. Output aggiornato."
        : action === "minify"
          ? "JSON -> XML convertito e minificato."
          : "Conversione JSON -> XML completata.";
    } else if (mode === "xml_to_json") {
      output = xmlToJson(raw, action === "minify", indent, sortEnabled);
      message = action === "validate"
        ? "Conversione XML -> JSON valida. Output aggiornato."
        : action === "minify"
          ? "XML -> JSON convertito e minificato."
          : "Conversione XML -> JSON completata.";
    } else if (mode === "json_to_yaml") {
      if (action === "minify") {
        throw new Error("Minify non disponibile per output YAML.");
      }
      let jsonInput = raw;
      if (sortEnabled) {
        jsonInput = JSON.stringify(sortJsonDeep(JSON.parse(raw)));
      }
      output = await convertJsonYamlApi(jsonInput, "json_to_yaml", indent);
      message = action === "validate"
        ? "Conversione JSON -> YAML valida. Output aggiornato."
        : "Conversione JSON -> YAML completata.";
    } else if (mode === "yaml_to_json") {
      const converted = await convertJsonYamlApi(raw, "yaml_to_json", indent);
      let parsed = JSON.parse(converted);
      if (sortEnabled) {
        parsed = sortJsonDeep(parsed);
      }
      output = action === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      message = action === "validate"
        ? "Conversione YAML -> JSON valida. Output aggiornato."
        : action === "minify"
          ? "YAML -> JSON convertito e minificato."
          : "Conversione YAML -> JSON completata.";
    } else {
      throw new Error("Modalita non supportata.");
    }

    formatOutput.value = output;
    setStatus(formatStatus, message, "ok");
    syncTextareaHeights();
  }

  if (formatType) {
    updateFormatterUi();
    formatType.addEventListener("change", () => {
      updateFormatterUi();
      setStatus(formatStatus, "");
      syncTextareaHeights();
    });
  }

  if (formatValidateBtn && formatInput && formatOutput) {
    formatValidateBtn.addEventListener("click", async () => {
      try {
        await runFormatAction("validate");
      } catch (error) {
        formatOutput.value = "";
        setStatus(formatStatus, `Errore validazione: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (formatPrettyBtn && formatInput && formatOutput) {
    formatPrettyBtn.addEventListener("click", async () => {
      try {
        await runFormatAction("pretty");
      } catch (error) {
        formatOutput.value = "";
        setStatus(formatStatus, `Errore formato/conversione: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (formatMinifyBtn && formatInput && formatOutput) {
    formatMinifyBtn.addEventListener("click", async () => {
      try {
        await runFormatAction("minify");
      } catch (error) {
        formatOutput.value = "";
        setStatus(formatStatus, `Errore minify: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (formatCopyBtn) {
    formatCopyBtn.addEventListener("click", async () => {
      if (!formatOutput.value) {
        setStatus(formatStatus, "Nessun output da copiare.", "err");
        return;
      }
      try {
        await navigator.clipboard.writeText(formatOutput.value);
        setStatus(formatStatus, "Output copiato negli appunti.", "ok");
      } catch (_) {
        setStatus(formatStatus, "Copia automatica non disponibile.", "err");
      }
    });
  }

  if (formatClearBtn) {
    formatClearBtn.addEventListener("click", () => {
      formatInput.value = "";
      formatOutput.value = "";
      if (formatSortToggle) formatSortToggle.checked = false;
      if (formatPlainTextToggle) formatPlainTextToggle.checked = false;
      setStatus(formatStatus, "");
      syncTextareaHeights();
    });
  }

  // ---------- JSON/YAML Converter ----------
  const jyDirection = document.getElementById("jyDirection");
  const jyIndent = document.getElementById("jyIndent");
  const jyInput = document.getElementById("jyInput");
  const jyOutput = document.getElementById("jyOutput");
  const jyStatus = document.getElementById("jyStatus");
  const jyConvertBtn = document.getElementById("jyConvertBtn");
  const jyCheckYamlBtn = document.getElementById("jyCheckYamlBtn");
  const jySwapBtn = document.getElementById("jySwapBtn");
  const jyCopyBtn = document.getElementById("jyCopyBtn");
  const jyClearBtn = document.getElementById("jyClearBtn");

  function getJyIndentValue() {
    const n = Number(jyIndent && jyIndent.value ? jyIndent.value : 2);
    return Math.max(1, Math.min(8, Number.isFinite(n) ? n : 2));
  }

  const yamlSmartDoubleQuotes = new Set(["\u201C", "\u201D", "\u201E", "\u201F", "\u00AB", "\u00BB", "\u2033", "\u275D", "\u275E", "\uFF02"]);
  const yamlSmartSingleQuotes = new Set(["\u2018", "\u2019", "\u201A", "\u201B", "\u2032", "\u275B", "\u275C", "\uFF07"]);
  const yamlUnicodeDashes = new Set(["\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\u2015", "\u2212", "\uFE58", "\uFE63", "\uFF0D"]);
  const yamlZeroWidthChars = new Set(["\u200B", "\u200C", "\u200D", "\uFEFF"]);

  function toCodePointHex(char) {
    const codePoint = char.codePointAt(0) || 0;
    return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
  }

  function describeYamlCharIssue(ch) {
    if (yamlSmartDoubleQuotes.has(ch)) {
      return { label: "Virgolette doppie tipografiche", fix: 'Usa il doppio apice ASCII (")' };
    }

    if (yamlSmartSingleQuotes.has(ch)) {
      return { label: "Virgolette singole tipografiche", fix: "Usa l'apice ASCII (')" };
    }

    if (yamlUnicodeDashes.has(ch)) {
      return { label: "Trattino Unicode", fix: "Usa il trattino ASCII (-)" };
    }

    if (ch === "\u00A0") {
      return { label: "Spazio non separabile (NBSP)", fix: "Usa uno spazio ASCII normale" };
    }

    if (yamlZeroWidthChars.has(ch)) {
      return { label: "Carattere invisibile (zero-width/BOM)", fix: "Rimuovi il carattere invisibile" };
    }

    const codePoint = ch.codePointAt(0) || 0;
    if (codePoint < 0x20 && ch !== "\n" && ch !== "\r" && ch !== "\t") {
      return { label: "Carattere di controllo non valido", fix: "Rimuovi il carattere di controllo" };
    }

    if (codePoint > 0x7E) {
      return { label: "Carattere non ASCII", fix: "Verifica che il carattere sia voluto e supportato" };
    }

    return null;
  }

  function collectYamlCharIssues(text) {
    const source = String(text || "");
    const issues = [];
    let line = 1;
    let column = 1;

    for (const ch of source) {
      const issue = describeYamlCharIssue(ch);
      if (issue) {
        issues.push({
          line,
          column,
          char: ch,
          code: toCodePointHex(ch),
          label: issue.label,
          fix: issue.fix,
        });
      }

      if (ch === "\n") {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }

    return issues;
  }

  function printableYamlChar(ch) {
    if (ch === " ") return "[space]";
    if (ch === "\t") return "[tab]";
    if (ch === "\n") return "[newline]";
    if (ch === "\r") return "[carriage-return]";
    return ch;
  }

  function buildYamlValidationReport(parseError, issues) {
    const lines = [];

    if (parseError) {
      lines.push("Sintassi YAML: ERRORE");
      lines.push("Dettaglio parser: " + parseError);
    } else {
      lines.push("Sintassi YAML: OK");
    }

    if (!issues.length) {
      lines.push("Caratteri sospetti/non-ASCII: nessuno.");
      return lines.join("\n");
    }

    lines.push("Caratteri sospetti/non-ASCII trovati: " + issues.length);

    const maxRows = 120;
    issues.slice(0, maxRows).forEach((entry, index) => {
      lines.push(
        (index + 1)
        + ". riga " + entry.line
        + ", colonna " + entry.column
        + " -> " + printableYamlChar(entry.char)
        + " (" + entry.code + ")"
        + " - " + entry.label + ". " + entry.fix + "."
      );
    });

    if (issues.length > maxRows) {
      lines.push("... altri " + (issues.length - maxRows) + " elementi non mostrati.");
    }

    return lines.join("\n");
  }

  if (jyConvertBtn && jyDirection && jyInput && jyOutput) {
    jyConvertBtn.addEventListener("click", async () => {
      const input = jyInput.value || "";
      if (!input.trim()) {
        setStatus(jyStatus, "Inserisci un contenuto da convertire.", "err");
        return;
      }

      setStatus(jyStatus, "Conversione in corso...");
      try {
        jyOutput.value = await convertJsonYamlApi(input, jyDirection.value, getJyIndentValue());
        setStatus(jyStatus, "Conversione completata.", "ok");
        syncTextareaHeights();
      } catch (error) {
        setStatus(jyStatus, `Errore: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (jyCheckYamlBtn && jyInput && jyOutput) {
    jyCheckYamlBtn.addEventListener("click", async () => {
      const input = jyInput.value || "";
      if (!input.trim()) {
        setStatus(jyStatus, "Incolla YAML da validare.", "err");
        return;
      }

      const issues = collectYamlCharIssues(input);
      let parseError = "";

      setStatus(jyStatus, "Validazione YAML in corso...");
      try {
        await convertJsonYamlApi(input, "yaml_to_json", getJyIndentValue());
      } catch (error) {
        parseError = error && error.message ? error.message : "Errore sconosciuto.";
      }

      jyOutput.value = buildYamlValidationReport(parseError, issues);

      if (parseError) {
        const cleanError = String(parseError).replace(/^YAML non valido:\s*/i, "");
        const suffix = issues.length ? " | Caratteri sospetti: " + issues.length + "." : "";
        setStatus(jyStatus, "YAML non valido: " + cleanError + suffix, "err");
      } else if (issues.length) {
        setStatus(jyStatus, "YAML valido ma con " + issues.length + " caratteri sospetti/non-ASCII. Vedi report.", "warn");
      } else {
        setStatus(jyStatus, "YAML valido. Nessun carattere sospetto rilevato.", "ok");
      }

      syncTextareaHeights();
    });
  }

  if (jySwapBtn && jyDirection && jyInput && jyOutput) {
    jySwapBtn.addEventListener("click", () => {
      jyDirection.value = jyDirection.value === "json_to_yaml" ? "yaml_to_json" : "json_to_yaml";
      const currentInput = jyInput.value;
      jyInput.value = jyOutput.value;
      jyOutput.value = currentInput;
      setStatus(jyStatus, "Direction invertita.", "ok");
      syncTextareaHeights();
    });
  }

  if (jyCopyBtn && jyOutput) {
    jyCopyBtn.addEventListener("click", async () => {
      if (!jyOutput.value) {
        setStatus(jyStatus, "Nessun output da copiare.", "err");
        return;
      }

      try {
        await navigator.clipboard.writeText(jyOutput.value);
        setStatus(jyStatus, "Output copiato negli appunti.", "ok");
      } catch (_) {
        setStatus(jyStatus, "Copia automatica non disponibile.", "err");
      }
    });
  }

  if (jyClearBtn && jyInput && jyOutput) {
    jyClearBtn.addEventListener("click", () => {
      jyInput.value = "";
      jyOutput.value = "";
      setStatus(jyStatus, "");
      syncTextareaHeights();
    });
  }

  // ---------- Text Inspector & Case Converter ----------
  const textCaseInput = document.getElementById("textCaseInput");
  const textCaseActions = document.getElementById("textCaseActions");
  const textCaseStatus = document.getElementById("textCaseStatus");
  const statChars = document.getElementById("statChars");
  const statCharsNoSpace = document.getElementById("statCharsNoSpace");
  const statWords = document.getElementById("statWords");
  const statLines = document.getElementById("statLines");
  const statSentences = document.getElementById("statSentences");
  const statParagraphs = document.getElementById("statParagraphs");

  function splitWords(text) {
    return (text || "")
      .trim()
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean);
  }

  function toTitleCase(text) {
    return (text || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toSentenceCase(text) {
    const lower = (text || "").toLowerCase();
    return lower.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (s) => s.toUpperCase());
  }

  function toCamelCase(text) {
    const words = splitWords(text).map((w) => w.toLowerCase());
    if (!words.length) return "";
    return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  }

  function toPascalCase(text) {
    return splitWords(text)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
  }

  function toSnakeCase(text) {
    return splitWords(text).map((w) => w.toLowerCase()).join("_");
  }

  function toKebabCase(text) {
    return splitWords(text).map((w) => w.toLowerCase()).join("-");
  }

  function swapCase(text) {
    return Array.from(text || "")
      .map((ch) => {
        const upper = ch.toUpperCase();
        const lower = ch.toLowerCase();
        if (ch === upper && ch !== lower) return lower;
        if (ch === lower && ch !== upper) return upper;
        return ch;
      })
      .join("");
  }

  function updateTextStats() {
    if (!textCaseInput) return;
    const text = textCaseInput.value || "";

    if (statChars) statChars.textContent = String(text.length);
    if (statCharsNoSpace) statCharsNoSpace.textContent = String(text.replace(/\s/g, "").length);
    if (statWords) statWords.textContent = String(text.trim() ? text.trim().split(/\s+/).length : 0);
    if (statLines) statLines.textContent = String(text.length ? text.split(/\r?\n/).length : 0);

    const sentenceMatches = text.match(/[^.!?]+[.!?]+/g) || [];
    const sentenceCount = sentenceMatches.length || (text.trim() ? 1 : 0);
    if (statSentences) statSentences.textContent = String(sentenceCount);

    const paragraphCount = text.trim()
      ? text.split(/\n\s*\n/).filter((p) => p.trim()).length
      : 0;
    if (statParagraphs) statParagraphs.textContent = String(paragraphCount);
  }

  if (textCaseInput) {
    textCaseInput.addEventListener("input", updateTextStats);
    updateTextStats();
  }

  if (textCaseActions && textCaseInput) {
    textCaseActions.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;

      let text = textCaseInput.value || "";
      switch (btn.dataset.action) {
        case "upper":
          text = text.toUpperCase();
          break;
        case "lower":
          text = text.toLowerCase();
          break;
        case "title":
          text = toTitleCase(text);
          break;
        case "sentence":
          text = toSentenceCase(text);
          break;
        case "camel":
          text = toCamelCase(text);
          break;
        case "pascal":
          text = toPascalCase(text);
          break;
        case "snake":
          text = toSnakeCase(text);
          break;
        case "kebab":
          text = toKebabCase(text);
          break;
        case "swap":
          text = swapCase(text);
          break;
        case "trim":
          text = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .join("\n");
          break;
        case "collapse":
          text = text
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n");
          break;
        case "clear":
          text = "";
          break;
        default:
          return;
      }

      textCaseInput.value = text;
      updateTextStats();
      setStatus(textCaseStatus, "Trasformazione applicata.", "ok");
      syncTextareaHeights();
    });
  }

  // ---------- API & Integrations ----------
  const jsonPathExpr = document.getElementById("jsonPathExpr");
  const jsonPathInput = document.getElementById("jsonPathInput");
  const jsonPathOutput = document.getElementById("jsonPathOutput");
  const jsonPathStatus = document.getElementById("jsonPathStatus");
  const jsonPathRunBtn = document.getElementById("jsonPathRunBtn");
  const jsonPathCopyBtn = document.getElementById("jsonPathCopyBtn");
  const jsonPathClearBtn = document.getElementById("jsonPathClearBtn");

  const xpathExpr = document.getElementById("xpathExpr");
  const xpathXmlInput = document.getElementById("xpathXmlInput");
  const xpathOutput = document.getElementById("xpathOutput");
  const xpathStatus = document.getElementById("xpathStatus");
  const xpathRunBtn = document.getElementById("xpathRunBtn");
  const xpathCopyBtn = document.getElementById("xpathCopyBtn");
  const xpathClearBtn = document.getElementById("xpathClearBtn");

  const httpMethod = document.getElementById("httpMethod");
  const httpUrl = document.getElementById("httpUrl");
  const httpTimeout = document.getElementById("httpTimeout");
  const httpAsJson = document.getElementById("httpAsJson");
  const httpIgnoreTls = document.getElementById("httpIgnoreTls");
  const httpHeadersInput = document.getElementById("httpHeadersInput");
  const httpBodyInput = document.getElementById("httpBodyInput");
  const httpSendBtn = document.getElementById("httpSendBtn");
  const httpBuildCurlBtn = document.getElementById("httpBuildCurlBtn");
  const httpCopyBtn = document.getElementById("httpCopyBtn");
  const httpClearBtn = document.getElementById("httpClearBtn");
  const httpStatus = document.getElementById("httpStatus");
  const httpMeta = document.getElementById("httpMeta");
  const httpResponseOutput = document.getElementById("httpResponseOutput");

  const curlInputCommand = document.getElementById("curlInputCommand");
  const curlMethod = document.getElementById("curlMethod");
  const curlUrl = document.getElementById("curlUrl");
  const curlAsJson = document.getElementById("curlAsJson");
  const curlInsecure = document.getElementById("curlInsecure");
  const curlHeadersInput = document.getElementById("curlHeadersInput");
  const curlBodyInput = document.getElementById("curlBodyInput");
  const curlGenerateBtn = document.getElementById("curlGenerateBtn");
  const curlParseBtn = document.getElementById("curlParseBtn");
  const curlToRunnerBtn = document.getElementById("curlToRunnerBtn");
  const curlCopyBtn = document.getElementById("curlCopyBtn");
  const curlClearBtn = document.getElementById("curlClearBtn");
  const curlStatus = document.getElementById("curlStatus");
  const curlCommandOutput = document.getElementById("curlCommandOutput");

  const schemaInput = document.getElementById("schemaInput");
  const schemaJsonInput = document.getElementById("schemaJsonInput");
  const schemaValidateBtn = document.getElementById("schemaValidateBtn");
  const schemaCopyBtn = document.getElementById("schemaCopyBtn");
  const schemaClearBtn = document.getElementById("schemaClearBtn");
  const schemaStatus = document.getElementById("schemaStatus");
  const schemaOutput = document.getElementById("schemaOutput");

  const secretMaskInput = document.getElementById("secretMaskInput");
  const secretMaskOutput = document.getElementById("secretMaskOutput");
  const secretMaskRunBtn = document.getElementById("secretMaskRunBtn");
  const secretMaskCopyBtn = document.getElementById("secretMaskCopyBtn");
  const secretMaskClearBtn = document.getElementById("secretMaskClearBtn");
  const secretMaskStatus = document.getElementById("secretMaskStatus");
  const maskKeepEdgesToggle = document.getElementById("maskKeepEdgesToggle");
  const maskPreserveLengthToggle = document.getElementById("maskPreserveLengthToggle");

  const diff3BaseInput = document.getElementById("diff3BaseInput");
  const diff3LeftInput = document.getElementById("diff3LeftInput");
  const diff3RightInput = document.getElementById("diff3RightInput");
  const diff3RunBtn = document.getElementById("diff3RunBtn");
  const diff3CopyBtn = document.getElementById("diff3CopyBtn");
  const diff3ClearBtn = document.getElementById("diff3ClearBtn");
  const diff3Status = document.getElementById("diff3Status");
  const diff3Summary = document.getElementById("diff3Summary");
  const diff3Output = document.getElementById("diff3Output");

  function copyTextToClipboard(text, statusEl, okMessage, emptyMessage) {
    if (!String(text || "").trim()) {
      setStatus(statusEl, emptyMessage || "Nessun contenuto da copiare.", "err");
      return;
    }

    navigator.clipboard.writeText(String(text))
      .then(() => {
        setStatus(statusEl, okMessage || "Contenuto copiato.", "ok");
      })
      .catch(() => {
        setStatus(statusEl, "Copia automatica non disponibile.", "err");
      });
  }

  function parseHeadersInput(raw) {
    const source = String(raw || "").trim();
    if (!source) {
      return {};
    }

    if (source.startsWith("{")) {
      let parsed;
      try {
        parsed = JSON.parse(source);
      } catch (error) {
        throw new Error(`Headers JSON non valido: ${error.message}`);
      }
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("Headers JSON deve essere un oggetto chiave/valore.");
      }

      const headers = {};
      Object.entries(parsed).forEach(([key, value]) => {
        headers[String(key)] = value == null ? "" : String(value);
      });
      return headers;
    }

    const headers = {};
    source.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const separatorIndex = trimmed.indexOf(":");
      if (separatorIndex <= 0) {
        throw new Error(`Header non valido: ${trimmed}`);
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      headers[key] = value;
    });
    return headers;
  }

  function serializeHeaders(headers) {
    if (!headers || typeof headers !== "object") return "";
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  }

  function shellQuote(value) {
    return `'${String(value || "").replace(/'/g, `'"'"'`)}'`;
  }

  function buildCurlCommand(config) {
    const method = String(config.method || "GET").toUpperCase();
    const url = String(config.url || "").trim();
    const headers = config.headers || {};
    const body = config.body == null ? "" : String(config.body);
    const insecure = Boolean(config.insecure);

    if (!url) {
      throw new Error("URL mancante.");
    }

    const parts = ["curl"];
    if (insecure) {
      parts.push("--insecure");
    }
    if (method && method !== "GET") {
      parts.push("-X", method);
    }

    Object.entries(headers).forEach(([key, value]) => {
      parts.push("-H", shellQuote(`${key}: ${value}`));
    });

    if (body && !["GET", "HEAD"].includes(method)) {
      parts.push("--data-raw", shellQuote(body));
    }

    parts.push(shellQuote(url));
    return parts.join(" ");
  }

  function tokenizeCommand(input) {
    const command = String(input || "");
    const tokens = [];
    let current = "";
    let quote = null;

    for (let i = 0; i < command.length; i += 1) {
      const ch = command[i];

      if (quote) {
        if (ch === quote) {
          quote = null;
          continue;
        }
        if (quote === '"' && ch === "\\" && i + 1 < command.length) {
          current += command[i + 1];
          i += 1;
          continue;
        }
        current += ch;
        continue;
      }

      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }

      if (/\s/.test(ch)) {
        if (current) {
          tokens.push(current);
          current = "";
        }
        continue;
      }

      if (ch === "\\" && i + 1 < command.length) {
        current += command[i + 1];
        i += 1;
        continue;
      }

      current += ch;
    }

    if (quote) {
      throw new Error("Comando cURL non valido: quote non chiusa.");
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  function parseCurlCommand(command) {
    const tokens = tokenizeCommand(command);
    if (!tokens.length) {
      throw new Error("Comando vuoto.");
    }

    let index = 0;
    if (tokens[0].toLowerCase() === "curl") {
      index = 1;
    }

    const parsed = {
      method: "GET",
      url: "",
      headers: {},
      body: "",
      insecure: false,
      asJson: false,
    };

    while (index < tokens.length) {
      const token = tokens[index];

      if (token === "-X" || token === "--request") {
        parsed.method = String(tokens[index + 1] || "GET").toUpperCase();
        index += 2;
        continue;
      }

      if (token === "-H" || token === "--header") {
        const header = String(tokens[index + 1] || "");
        const sep = header.indexOf(":");
        if (sep > 0) {
          const key = header.slice(0, sep).trim();
          const value = header.slice(sep + 1).trim();
          parsed.headers[key] = value;
        }
        index += 2;
        continue;
      }

      if (["-d", "--data", "--data-raw", "--data-binary", "--data-urlencode"].includes(token)) {
        const piece = String(tokens[index + 1] || "");
        parsed.body = parsed.body ? `${parsed.body}
${piece}` : piece;
        index += 2;
        continue;
      }

      if (token === "--url") {
        parsed.url = String(tokens[index + 1] || "").trim();
        index += 2;
        continue;
      }

      if (token === "-k" || token === "--insecure") {
        parsed.insecure = true;
        index += 1;
        continue;
      }

      if (/^https?:\/\//i.test(token)) {
        parsed.url = token;
      }

      index += 1;
    }

    if (parsed.body) {
      const maybeJson = parsed.body.trim();
      if ((maybeJson.startsWith("{") && maybeJson.endsWith("}")) || (maybeJson.startsWith("[") && maybeJson.endsWith("]"))) {
        try {
          JSON.parse(maybeJson);
          parsed.asJson = true;
        } catch (_) {
          parsed.asJson = false;
        }
      }
    }

    return parsed;
  }

  function normalizeUrl(url) {
    const value = String(url || "").trim();
    if (!value) {
      throw new Error("URL obbligatorio.");
    }
    if (!/^https?:\/\//i.test(value)) {
      throw new Error("URL non valido: usare http:// o https://.");
    }
    return value;
  }

  function getHttpRunnerConfigFromInputs() {
    return {
      method: String(httpMethod && httpMethod.value ? httpMethod.value : "GET").toUpperCase(),
      url: normalizeUrl(httpUrl && httpUrl.value ? httpUrl.value : ""),
      headers: parseHeadersInput(httpHeadersInput && httpHeadersInput.value ? httpHeadersInput.value : ""),
      body: httpBodyInput && httpBodyInput.value ? httpBodyInput.value : "",
      timeout: Number(httpTimeout && httpTimeout.value ? httpTimeout.value : 20),
      asJson: Boolean(httpAsJson && httpAsJson.checked),
      insecure: Boolean(httpIgnoreTls && httpIgnoreTls.checked),
    };
  }

  function buildHttpOutputPayload(data) {
    const headersText = serializeHeaders(data.headers || {});
    const bodyText = String(data.body || "");
    return `# Response Headers
${headersText || "(none)"}

# Response Body
${bodyText}`;
  }

  async function executeHttpRunner(config) {
    const timeout = Number.isFinite(config.timeout) ? Math.max(1, Math.min(120, config.timeout)) : 20;
    const response = await fetch(`${API_BASE}/api/http-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: config.method,
        url: config.url,
        headers: config.headers,
        body: config.body,
        timeout,
        as_json: config.asJson,
        verify_tls: !config.insecure,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Request fallita.");
    }

    if (httpMeta) {
      const reason = data.reason ? ` ${data.reason}` : "";
      const elapsed = data.elapsed_ms == null ? "n/a" : `${data.elapsed_ms} ms`;
      httpMeta.textContent = `HTTP ${data.status_code}${reason} | ${elapsed} | ${data.final_url || config.url}`;
    }
    if (httpResponseOutput) {
      httpResponseOutput.value = buildHttpOutputPayload(data);
    }
    setStatus(httpStatus, "Request completata.", "ok");
    syncTextareaHeights();
  }

  function copyCurlConfigToHttpRunner(config) {
    if (httpMethod) httpMethod.value = config.method || "GET";
    if (httpUrl) httpUrl.value = config.url || "";
    if (httpHeadersInput) httpHeadersInput.value = serializeHeaders(config.headers || {});
    if (httpBodyInput) httpBodyInput.value = config.body || "";
    if (httpAsJson) httpAsJson.checked = Boolean(config.asJson);
    if (httpIgnoreTls) httpIgnoreTls.checked = Boolean(config.insecure);
    syncTextareaHeights();
  }

  function parseJsonPathExpression(expression) {
    const expr = String(expression || "").trim();
    if (!expr) {
      throw new Error("Espressione JSONPath vuota.");
    }

    let index = 0;
    if (expr[index] === "$") {
      index += 1;
    }

    const tokens = [];

    while (index < expr.length) {
      const ch = expr[index];

      if (/\s/.test(ch)) {
        index += 1;
        continue;
      }

      if (ch === ".") {
        if (expr[index + 1] === ".") {
          throw new Error("Operatore '..' non supportato in questa versione.");
        }
        index += 1;
        if (expr[index] === "*") {
          tokens.push({ type: "wildcard" });
          index += 1;
          continue;
        }

        const start = index;
        while (index < expr.length && /[A-Za-z0-9_$-]/.test(expr[index])) {
          index += 1;
        }
        if (start === index) {
          throw new Error(`Token non valido vicino a posizione ${index}.`);
        }
        tokens.push({ type: "prop", key: expr.slice(start, index) });
        continue;
      }

      if (ch === "[") {
        index += 1;
        let content = "";
        let quote = null;

        while (index < expr.length) {
          const curr = expr[index];
          if (quote) {
            if (curr === "\\" && index + 1 < expr.length) {
              content += curr + expr[index + 1];
              index += 2;
              continue;
            }
            if (curr === quote) {
              quote = null;
              content += curr;
              index += 1;
              continue;
            }
            content += curr;
            index += 1;
            continue;
          }

          if (curr === "'" || curr === '"') {
            quote = curr;
            content += curr;
            index += 1;
            continue;
          }

          if (curr === "]") {
            break;
          }

          content += curr;
          index += 1;
        }

        if (index >= expr.length || expr[index] !== "]") {
          throw new Error("Espressione JSONPath non valida: parentesi quadra non chiusa.");
        }

        const tokenValue = content.trim();
        if (tokenValue === "*") {
          tokens.push({ type: "wildcard" });
        } else if (/^-?\d+$/.test(tokenValue)) {
          tokens.push({ type: "index", index: Number(tokenValue) });
        } else {
          const sliceMatch = tokenValue.match(/^(-?\d*)\s*:\s*(-?\d*)$/);
          if (sliceMatch) {
            tokens.push({
              type: "slice",
              start: sliceMatch[1] === "" ? null : Number(sliceMatch[1]),
              end: sliceMatch[2] === "" ? null : Number(sliceMatch[2]),
            });
          } else if ((tokenValue.startsWith("'") && tokenValue.endsWith("'")) || (tokenValue.startsWith('"') && tokenValue.endsWith('"'))) {
            const key = tokenValue.slice(1, -1).replace(/\\(['"])/g, "$1");
            tokens.push({ type: "prop", key });
          } else {
            throw new Error(`Token JSONPath non supportato: [${tokenValue}]`);
          }
        }

        index += 1;
        continue;
      }

      throw new Error(`Sintassi JSONPath non valida vicino a '${ch}'`);
    }

    return tokens;
  }

  function evaluateJsonPath(data, expression) {
    const tokens = parseJsonPathExpression(expression);
    let nodes = [data];

    tokens.forEach((token) => {
      const next = [];
      nodes.forEach((node) => {
        if (token.type === "prop") {
          if (node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, token.key)) {
            next.push(node[token.key]);
          }
          return;
        }

        if (token.type === "index") {
          if (Array.isArray(node)) {
            const idx = token.index < 0 ? node.length + token.index : token.index;
            if (idx >= 0 && idx < node.length) {
              next.push(node[idx]);
            }
          }
          return;
        }

        if (token.type === "slice") {
          if (Array.isArray(node)) {
            const start = token.start == null ? 0 : (token.start < 0 ? node.length + token.start : token.start);
            const end = token.end == null ? node.length : (token.end < 0 ? node.length + token.end : token.end);
            node.slice(Math.max(0, start), Math.max(0, end)).forEach((item) => next.push(item));
          }
          return;
        }

        if (token.type === "wildcard") {
          if (Array.isArray(node)) {
            node.forEach((item) => next.push(item));
          } else if (node && typeof node === "object") {
            Object.values(node).forEach((item) => next.push(item));
          }
        }
      });
      nodes = next;
    });

    return nodes;
  }

  function serializeXPathNode(node) {
    if (!node) return "";
    if (node.nodeType === Node.ELEMENT_NODE) {
      return new XMLSerializer().serializeToString(node);
    }
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      return `${node.nodeName}="${node.nodeValue}"`;
    }
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
      return node.nodeValue || "";
    }
    return node.textContent || "";
  }

  function evaluateXPath(xmlText, expression) {
    const doc = parseXml(xmlText);
    const result = doc.evaluate(expression, doc, null, XPathResult.ANY_TYPE, null);

    if (result.resultType === XPathResult.STRING_TYPE) {
      return [result.stringValue];
    }
    if (result.resultType === XPathResult.NUMBER_TYPE) {
      return [String(result.numberValue)];
    }
    if (result.resultType === XPathResult.BOOLEAN_TYPE) {
      return [String(result.booleanValue)];
    }

    const entries = [];
    let node = result.iterateNext();
    while (node) {
      entries.push(serializeXPathNode(node));
      node = result.iterateNext();
    }
    return entries;
  }

  function getJsonType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "number") return Number.isFinite(value) ? "number" : "number";
    return typeof value;
  }

  function deepEqual(left, right) {
    if (left === right) return true;
    if (typeof left !== typeof right) return false;

    if (left && right && typeof left === "object") {
      if (Array.isArray(left) !== Array.isArray(right)) return false;

      if (Array.isArray(left)) {
        if (left.length !== right.length) return false;
        for (let i = 0; i < left.length; i += 1) {
          if (!deepEqual(left[i], right[i])) return false;
        }
        return true;
      }

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return false;
      for (const key of leftKeys) {
        if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
        if (!deepEqual(left[key], right[key])) return false;
      }
      return true;
    }

    return false;
  }

  function schemaTypeMatches(value, expectedType) {
    if (expectedType === "integer") {
      return typeof value === "number" && Number.isInteger(value);
    }
    if (expectedType === "number") {
      return typeof value === "number" && Number.isFinite(value);
    }
    if (expectedType === "object") {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    if (expectedType === "array") {
      return Array.isArray(value);
    }
    if (expectedType === "null") {
      return value === null;
    }
    return typeof value === expectedType;
  }

  function validateJsonAgainstSchema(value, schema, pathExpr, errors) {
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      return;
    }

    if (Array.isArray(schema.allOf)) {
      schema.allOf.forEach((subSchema, index) => {
        validateJsonAgainstSchema(value, subSchema, `${pathExpr}.allOf[${index}]`, errors);
      });
    }

    if (Array.isArray(schema.anyOf)) {
      const passing = schema.anyOf.filter((subSchema) => {
        const localErrors = [];
        validateJsonAgainstSchema(value, subSchema, pathExpr, localErrors);
        return localErrors.length === 0;
      }).length;
      if (passing === 0) {
        errors.push(`${pathExpr}: nessuna condizione anyOf soddisfatta.`);
      }
    }

    if (Array.isArray(schema.oneOf)) {
      const passing = schema.oneOf.filter((subSchema) => {
        const localErrors = [];
        validateJsonAgainstSchema(value, subSchema, pathExpr, localErrors);
        return localErrors.length === 0;
      }).length;
      if (passing !== 1) {
        errors.push(`${pathExpr}: oneOf richiede esattamente 1 match (trovati ${passing}).`);
      }
    }

    if (schema.not && typeof schema.not === "object") {
      const localErrors = [];
      validateJsonAgainstSchema(value, schema.not, pathExpr, localErrors);
      if (!localErrors.length) {
        errors.push(`${pathExpr}: condizione not violata.`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(schema, "const") && !deepEqual(value, schema.const)) {
      errors.push(`${pathExpr}: valore diverso da const.`);
    }

    if (Array.isArray(schema.enum) && !schema.enum.some((item) => deepEqual(item, value))) {
      errors.push(`${pathExpr}: valore non presente in enum.`);
    }

    if (schema.type) {
      const acceptedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
      const typeMatch = acceptedTypes.some((expected) => schemaTypeMatches(value, expected));
      if (!typeMatch) {
        errors.push(`${pathExpr}: tipo atteso ${acceptedTypes.join(" | ")}, trovato ${getJsonType(value)}.`);
        return;
      }
    }

    if (typeof value === "string") {
      if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
        errors.push(`${pathExpr}: lunghezza < minLength (${schema.minLength}).`);
      }
      if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        errors.push(`${pathExpr}: lunghezza > maxLength (${schema.maxLength}).`);
      }
      if (schema.pattern) {
        try {
          const pattern = new RegExp(schema.pattern);
          if (!pattern.test(value)) {
            errors.push(`${pathExpr}: pattern non rispettato (${schema.pattern}).`);
          }
        } catch (error) {
          errors.push(`${pathExpr}: pattern schema non valido (${error.message}).`);
        }
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      if (typeof schema.minimum === "number" && value < schema.minimum) {
        errors.push(`${pathExpr}: valore < minimum (${schema.minimum}).`);
      }
      if (typeof schema.maximum === "number" && value > schema.maximum) {
        errors.push(`${pathExpr}: valore > maximum (${schema.maximum}).`);
      }
    }

    if (Array.isArray(value)) {
      if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
        errors.push(`${pathExpr}: numero elementi < minItems (${schema.minItems}).`);
      }
      if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
        errors.push(`${pathExpr}: numero elementi > maxItems (${schema.maxItems}).`);
      }

      if (Array.isArray(schema.items)) {
        value.forEach((item, idx) => {
          const itemSchema = schema.items[idx];
          if (itemSchema) {
            validateJsonAgainstSchema(item, itemSchema, `${pathExpr}[${idx}]`, errors);
          } else if (schema.additionalItems === false) {
            errors.push(`${pathExpr}[${idx}]: additionalItems non consentito.`);
          } else if (schema.additionalItems && typeof schema.additionalItems === "object") {
            validateJsonAgainstSchema(item, schema.additionalItems, `${pathExpr}[${idx}]`, errors);
          }
        });
      } else if (schema.items && typeof schema.items === "object") {
        value.forEach((item, idx) => {
          validateJsonAgainstSchema(item, schema.items, `${pathExpr}[${idx}]`, errors);
        });
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (Number.isInteger(schema.minProperties) && keys.length < schema.minProperties) {
        errors.push(`${pathExpr}: numero proprieta < minProperties (${schema.minProperties}).`);
      }
      if (Number.isInteger(schema.maxProperties) && keys.length > schema.maxProperties) {
        errors.push(`${pathExpr}: numero proprieta > maxProperties (${schema.maxProperties}).`);
      }

      if (Array.isArray(schema.required)) {
        schema.required.forEach((requiredKey) => {
          if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
            errors.push(`${pathExpr}: missing required '${requiredKey}'.`);
          }
        });
      }

      const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
      Object.keys(properties).forEach((propKey) => {
        if (Object.prototype.hasOwnProperty.call(value, propKey)) {
          validateJsonAgainstSchema(value[propKey], properties[propKey], `${pathExpr}.${propKey}`, errors);
        }
      });

      const additionalBehavior = schema.additionalProperties;
      keys.forEach((propKey) => {
        if (Object.prototype.hasOwnProperty.call(properties, propKey)) return;
        if (additionalBehavior === false) {
          errors.push(`${pathExpr}.${propKey}: additionalProperties non consentita.`);
        } else if (additionalBehavior && typeof additionalBehavior === "object") {
          validateJsonAgainstSchema(value[propKey], additionalBehavior, `${pathExpr}.${propKey}`, errors);
        }
      });
    }
  }

  function maskSensitiveValue(value, options) {
    const input = String(value || "");
    if (!input) return input;

    const preserveLength = Boolean(options && options.preserveLength);
    const keepEdges = Boolean(options && options.keepEdges);

    if (keepEdges && input.length > 4) {
      const prefix = input.slice(0, 2);
      const suffix = input.slice(-2);
      const maskLen = preserveLength ? Math.max(1, input.length - 4) : 8;
      return `${prefix}${"*".repeat(maskLen)}${suffix}`;
    }

    if (preserveLength) {
      return "*".repeat(input.length);
    }

    return "********";
  }

  function maskSecrets(rawText, options) {
    let output = String(rawText || "");

    const directPatterns = [
      /(Authorization\s*:\s*Bearer\s+)([A-Za-z0-9._~+/=-]+)/gi,
      /([?&](?:access_token|refresh_token|id_token|token|api[_-]?key|client_secret|password|secret)=)([^&#\s]+)/gi,
      /((?:"|')?(?:access_token|refresh_token|id_token|token|api[_-]?key|client_secret|password|secret)(?:"|')?\s*[:=]\s*(?:"|')?)([^"'\s,;]+)((?:"|')?)/gi,
    ];

    output = output.replace(directPatterns[0], (_, prefix, secret) => `${prefix}${maskSensitiveValue(secret, options)}`);
    output = output.replace(directPatterns[1], (_, prefix, secret) => `${prefix}${maskSensitiveValue(secret, options)}`);
    output = output.replace(directPatterns[2], (_, prefix, secret, suffix) => `${prefix}${maskSensitiveValue(secret, options)}${suffix || ""}`);

    return output;
  }

  function splitLines(value) {
    return String(value || "").split(/\r?\n/);
  }

  function buildThreeWayDiff(baseText, leftText, rightText) {
    const baseLines = splitLines(baseText);
    const leftLines = splitLines(leftText);
    const rightLines = splitLines(rightText);
    const maxLines = Math.max(baseLines.length, leftLines.length, rightLines.length);

    const merged = [];
    const conflictLines = [];
    const stats = {
      same: 0,
      fromLeft: 0,
      fromRight: 0,
      conflicts: 0,
    };

    for (let i = 0; i < maxLines; i += 1) {
      const baseLine = baseLines[i] == null ? "" : baseLines[i];
      const leftLine = leftLines[i] == null ? "" : leftLines[i];
      const rightLine = rightLines[i] == null ? "" : rightLines[i];

      if (leftLine === rightLine) {
        merged.push(leftLine);
        stats.same += 1;
        continue;
      }

      if (leftLine === baseLine && rightLine !== baseLine) {
        merged.push(rightLine);
        stats.fromRight += 1;
        continue;
      }

      if (rightLine === baseLine && leftLine !== baseLine) {
        merged.push(leftLine);
        stats.fromLeft += 1;
        continue;
      }

      stats.conflicts += 1;
      conflictLines.push(i + 1);
      merged.push(
        "<<<<<<< LEFT",
        leftLine,
        "||||||| BASE",
        baseLine,
        "=======",
        rightLine,
        ">>>>>>> RIGHT",
      );
    }

    return {
      mergedText: merged.join("\n"),
      conflictLines,
      stats,
    };
  }

  if (jsonPathRunBtn && jsonPathInput && jsonPathExpr && jsonPathOutput) {
    jsonPathRunBtn.addEventListener("click", () => {
      const raw = jsonPathInput.value || "";
      if (!raw.trim()) {
        setStatus(jsonPathStatus, "Inserisci un JSON input.", "err");
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const results = evaluateJsonPath(parsed, jsonPathExpr.value || "$.");
        jsonPathOutput.value = JSON.stringify(results, null, 2);
        setStatus(jsonPathStatus, `Match trovati: ${results.length}.`, "ok");
        syncTextareaHeights();
      } catch (error) {
        jsonPathOutput.value = "";
        setStatus(jsonPathStatus, `Errore JSONPath: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (jsonPathCopyBtn && jsonPathOutput) {
    jsonPathCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(jsonPathOutput.value, jsonPathStatus, "Output JSONPath copiato.", "Nessun output da copiare.");
    });
  }

  if (jsonPathClearBtn) {
    jsonPathClearBtn.addEventListener("click", () => {
      if (jsonPathInput) jsonPathInput.value = "";
      if (jsonPathOutput) jsonPathOutput.value = "";
      if (jsonPathExpr) jsonPathExpr.value = "$.items[*]";
      setStatus(jsonPathStatus, "");
      syncTextareaHeights();
    });
  }

  if (xpathRunBtn && xpathXmlInput && xpathExpr && xpathOutput) {
    xpathRunBtn.addEventListener("click", () => {
      const xmlText = xpathXmlInput.value || "";
      const expression = xpathExpr.value || "";
      if (!xmlText.trim()) {
        setStatus(xpathStatus, "Inserisci un XML input.", "err");
        return;
      }
      if (!expression.trim()) {
        setStatus(xpathStatus, "Inserisci un'espressione XPath.", "err");
        return;
      }

      try {
        const matches = evaluateXPath(xmlText, expression);
        xpathOutput.value = matches.length
          ? matches.map((entry, index) => `[${index + 1}] ${entry}`).join("\n\n")
          : "";
        setStatus(xpathStatus, `Match XPath trovati: ${matches.length}.`, "ok");
        syncTextareaHeights();
      } catch (error) {
        xpathOutput.value = "";
        setStatus(xpathStatus, `Errore XPath: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (xpathCopyBtn && xpathOutput) {
    xpathCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(xpathOutput.value, xpathStatus, "Output XPath copiato.", "Nessun output da copiare.");
    });
  }

  if (xpathClearBtn) {
    xpathClearBtn.addEventListener("click", () => {
      if (xpathXmlInput) xpathXmlInput.value = "";
      if (xpathOutput) xpathOutput.value = "";
      if (xpathExpr) xpathExpr.value = "//item";
      setStatus(xpathStatus, "");
      syncTextareaHeights();
    });
  }

  if (httpSendBtn) {
    httpSendBtn.addEventListener("click", async () => {
      try {
        const config = getHttpRunnerConfigFromInputs();
        setStatus(httpStatus, "Request in corso...");
        await executeHttpRunner(config);
      } catch (error) {
        if (httpResponseOutput) httpResponseOutput.value = "";
        if (httpMeta) httpMeta.textContent = "";
        setStatus(httpStatus, `Errore HTTP: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (httpBuildCurlBtn) {
    httpBuildCurlBtn.addEventListener("click", () => {
      try {
        const config = getHttpRunnerConfigFromInputs();
        const command = buildCurlCommand(config);
        if (curlCommandOutput) curlCommandOutput.value = command;
        if (curlMethod) curlMethod.value = config.method;
        if (curlUrl) curlUrl.value = config.url;
        if (curlHeadersInput) curlHeadersInput.value = serializeHeaders(config.headers);
        if (curlBodyInput) curlBodyInput.value = config.body;
        if (curlAsJson) curlAsJson.checked = config.asJson;
        if (curlInsecure) curlInsecure.checked = config.insecure;
        setStatus(httpStatus, "Comando cURL generato e copiato nella sezione cURL Builder.", "ok");
        setStatus(curlStatus, "Comando generato da HTTP Runner.", "ok");
        syncTextareaHeights();
      } catch (error) {
        setStatus(httpStatus, `Errore generate cURL: ${error.message}`, "err");
      }
    });
  }

  if (httpCopyBtn) {
    httpCopyBtn.addEventListener("click", () => {
      const composed = `${httpMeta && httpMeta.textContent ? `${httpMeta.textContent}

` : ""}${httpResponseOutput && httpResponseOutput.value ? httpResponseOutput.value : ""}`;
      copyTextToClipboard(composed, httpStatus, "Output HTTP copiato.", "Nessun output da copiare.");
    });
  }

  if (httpClearBtn) {
    httpClearBtn.addEventListener("click", () => {
      if (httpMethod) httpMethod.value = "GET";
      if (httpUrl) httpUrl.value = "";
      if (httpTimeout) httpTimeout.value = "20";
      if (httpAsJson) httpAsJson.checked = false;
      if (httpIgnoreTls) httpIgnoreTls.checked = false;
      if (httpHeadersInput) httpHeadersInput.value = "";
      if (httpBodyInput) httpBodyInput.value = "";
      if (httpMeta) httpMeta.textContent = "";
      if (httpResponseOutput) httpResponseOutput.value = "";
      setStatus(httpStatus, "");
      syncTextareaHeights();
    });
  }

  if (curlGenerateBtn) {
    curlGenerateBtn.addEventListener("click", () => {
      try {
        const config = {
          method: String(curlMethod && curlMethod.value ? curlMethod.value : "GET").toUpperCase(),
          url: normalizeUrl(curlUrl && curlUrl.value ? curlUrl.value : ""),
          headers: parseHeadersInput(curlHeadersInput && curlHeadersInput.value ? curlHeadersInput.value : ""),
          body: curlBodyInput && curlBodyInput.value ? curlBodyInput.value : "",
          insecure: Boolean(curlInsecure && curlInsecure.checked),
          asJson: Boolean(curlAsJson && curlAsJson.checked),
        };
        if (curlCommandOutput) {
          curlCommandOutput.value = buildCurlCommand(config);
        }
        setStatus(curlStatus, "Comando cURL generato.", "ok");
        syncTextareaHeights();
      } catch (error) {
        if (curlCommandOutput) curlCommandOutput.value = "";
        setStatus(curlStatus, `Errore generate cURL: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (curlParseBtn && curlInputCommand) {
    curlParseBtn.addEventListener("click", () => {
      try {
        const parsed = parseCurlCommand(curlInputCommand.value || "");
        if (curlMethod) curlMethod.value = parsed.method || "GET";
        if (curlUrl) curlUrl.value = parsed.url || "";
        if (curlHeadersInput) curlHeadersInput.value = serializeHeaders(parsed.headers || {});
        if (curlBodyInput) curlBodyInput.value = parsed.body || "";
        if (curlInsecure) curlInsecure.checked = Boolean(parsed.insecure);
        if (curlAsJson) curlAsJson.checked = Boolean(parsed.asJson);
        if (curlCommandOutput) curlCommandOutput.value = buildCurlCommand(parsed);
        setStatus(curlStatus, "Parse cURL completata.", "ok");
        syncTextareaHeights();
      } catch (error) {
        setStatus(curlStatus, `Errore parse cURL: ${error.message}`, "err");
      }
    });
  }

  if (curlToRunnerBtn) {
    curlToRunnerBtn.addEventListener("click", () => {
      try {
        const config = {
          method: String(curlMethod && curlMethod.value ? curlMethod.value : "GET").toUpperCase(),
          url: normalizeUrl(curlUrl && curlUrl.value ? curlUrl.value : ""),
          headers: parseHeadersInput(curlHeadersInput && curlHeadersInput.value ? curlHeadersInput.value : ""),
          body: curlBodyInput && curlBodyInput.value ? curlBodyInput.value : "",
          insecure: Boolean(curlInsecure && curlInsecure.checked),
          asJson: Boolean(curlAsJson && curlAsJson.checked),
        };
        copyCurlConfigToHttpRunner(config);
        setStatus(curlStatus, "Configurazione inviata a HTTP Runner.", "ok");
        setStatus(httpStatus, "Configurazione ricevuta da cURL Builder.", "ok");
      } catch (error) {
        setStatus(curlStatus, `Errore invio a runner: ${error.message}`, "err");
      }
    });
  }

  if (curlCopyBtn && curlCommandOutput) {
    curlCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(curlCommandOutput.value, curlStatus, "Comando cURL copiato.", "Nessun comando da copiare.");
    });
  }

  if (curlClearBtn) {
    curlClearBtn.addEventListener("click", () => {
      if (curlInputCommand) curlInputCommand.value = "";
      if (curlMethod) curlMethod.value = "GET";
      if (curlUrl) curlUrl.value = "";
      if (curlHeadersInput) curlHeadersInput.value = "";
      if (curlBodyInput) curlBodyInput.value = "";
      if (curlAsJson) curlAsJson.checked = false;
      if (curlInsecure) curlInsecure.checked = false;
      if (curlCommandOutput) curlCommandOutput.value = "";
      setStatus(curlStatus, "");
      syncTextareaHeights();
    });
  }

  if (schemaValidateBtn && schemaInput && schemaJsonInput && schemaOutput) {
    schemaValidateBtn.addEventListener("click", () => {
      const schemaRaw = schemaInput.value || "";
      const jsonRaw = schemaJsonInput.value || "";

      if (!schemaRaw.trim() || !jsonRaw.trim()) {
        setStatus(schemaStatus, "Inserisci sia schema che payload JSON.", "err");
        return;
      }

      try {
        const schema = JSON.parse(schemaRaw);
        const payload = JSON.parse(jsonRaw);
        const errors = [];
        validateJsonAgainstSchema(payload, schema, "$", errors);

        if (!errors.length) {
          schemaOutput.value = JSON.stringify(payload, null, 2);
          setStatus(schemaStatus, "Payload valido rispetto allo schema.", "ok");
        } else {
          schemaOutput.value = errors.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
          setStatus(schemaStatus, `Validazione fallita: ${errors.length} errore/i.`, "err");
        }
        syncTextareaHeights();
      } catch (error) {
        schemaOutput.value = "";
        setStatus(schemaStatus, `Errore schema/JSON: ${error.message}`, "err");
        syncTextareaHeights();
      }
    });
  }

  if (schemaCopyBtn && schemaOutput) {
    schemaCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(schemaOutput.value, schemaStatus, "Esito validazione copiato.", "Nessun output da copiare.");
    });
  }

  if (schemaClearBtn) {
    schemaClearBtn.addEventListener("click", () => {
      if (schemaInput) schemaInput.value = "";
      if (schemaJsonInput) schemaJsonInput.value = "";
      if (schemaOutput) schemaOutput.value = "";
      setStatus(schemaStatus, "");
      syncTextareaHeights();
    });
  }

  if (secretMaskRunBtn && secretMaskInput && secretMaskOutput) {
    secretMaskRunBtn.addEventListener("click", () => {
      const input = secretMaskInput.value || "";
      if (!input.trim()) {
        setStatus(secretMaskStatus, "Inserisci testo log da mascherare.", "err");
        return;
      }

      const masked = maskSecrets(input, {
        keepEdges: Boolean(maskKeepEdgesToggle && maskKeepEdgesToggle.checked),
        preserveLength: Boolean(maskPreserveLengthToggle && maskPreserveLengthToggle.checked),
      });

      secretMaskOutput.value = masked;
      setStatus(secretMaskStatus, "Mascheramento completato.", "ok");
      syncTextareaHeights();
    });
  }

  if (secretMaskCopyBtn && secretMaskOutput) {
    secretMaskCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(secretMaskOutput.value, secretMaskStatus, "Output mascherato copiato.", "Nessun output da copiare.");
    });
  }

  if (secretMaskClearBtn) {
    secretMaskClearBtn.addEventListener("click", () => {
      if (secretMaskInput) secretMaskInput.value = "";
      if (secretMaskOutput) secretMaskOutput.value = "";
      if (maskKeepEdgesToggle) maskKeepEdgesToggle.checked = true;
      if (maskPreserveLengthToggle) maskPreserveLengthToggle.checked = false;
      setStatus(secretMaskStatus, "");
      syncTextareaHeights();
    });
  }

  if (diff3RunBtn && diff3BaseInput && diff3LeftInput && diff3RightInput && diff3Output) {
    diff3RunBtn.addEventListener("click", () => {
      const result = buildThreeWayDiff(diff3BaseInput.value || "", diff3LeftInput.value || "", diff3RightInput.value || "");
      diff3Output.value = result.mergedText;

      if (diff3Summary) {
        diff3Summary.textContent = `Linee uguali: ${result.stats.same} | prese da LEFT: ${result.stats.fromLeft} | prese da RIGHT: ${result.stats.fromRight} | conflitti: ${result.stats.conflicts}${result.conflictLines.length ? ` | linee conflitto: ${result.conflictLines.join(", ")}` : ""}`;
      }

      if (result.stats.conflicts > 0) {
        setStatus(diff3Status, `Merge con conflitti (${result.stats.conflicts}).`, "err");
      } else {
        setStatus(diff3Status, "Merge completato senza conflitti.", "ok");
      }
      syncTextareaHeights();
    });
  }

  if (diff3CopyBtn && diff3Output) {
    diff3CopyBtn.addEventListener("click", () => {
      copyTextToClipboard(diff3Output.value, diff3Status, "Output 3-way copiato.", "Nessun output da copiare.");
    });
  }

  if (diff3ClearBtn) {
    diff3ClearBtn.addEventListener("click", () => {
      if (diff3BaseInput) diff3BaseInput.value = "";
      if (diff3LeftInput) diff3LeftInput.value = "";
      if (diff3RightInput) diff3RightInput.value = "";
      if (diff3Output) diff3Output.value = "";
      if (diff3Summary) diff3Summary.textContent = "";
      setStatus(diff3Status, "");
      syncTextareaHeights();
    });
  }

  // ---------- Certificate Parser ----------
  const certInput = document.getElementById("certInput");
  const certParseBtn = document.getElementById("certParseBtn");
  const certClearBtn = document.getElementById("certClearBtn");
  const certStatus = document.getElementById("certStatus");
  const certOutput = document.getElementById("certOutput");

  function renderCertificates(certificates) {
    if (!certOutput) return;
    certOutput.innerHTML = "";

    certificates.forEach((cert) => {
      const card = document.createElement("article");
      card.className = "cert-card";
      const validityClass = cert.valid_now ? "cert-valid" : "cert-expired";
      const validityLabel = cert.valid_now ? "VALID" : "NOT VALID";
      const sans = Array.isArray(cert.subject_alt_names) && cert.subject_alt_names.length
        ? cert.subject_alt_names.join(", ")
        : "n/a";

      card.innerHTML = `
        <div class="cert-title">Certificate #${cert.index}</div>
        <div class="cert-row"><strong>Validity:</strong> <span class="${validityClass}">${validityLabel}</span></div>
        <div class="cert-row"><strong>Subject:</strong> ${escapeHtml(cert.subject || "")}</div>
        <div class="cert-row"><strong>Issuer:</strong> ${escapeHtml(cert.issuer || "")}</div>
        <div class="cert-row"><strong>Serial:</strong> ${escapeHtml(cert.serial_number || "")}</div>
        <div class="cert-row"><strong>Not Before:</strong> ${escapeHtml(cert.not_before || "")}</div>
        <div class="cert-row"><strong>Not After:</strong> ${escapeHtml(cert.not_after || "")}</div>
        <div class="cert-row"><strong>Days Remaining:</strong> ${cert.days_remaining == null ? "n/a" : cert.days_remaining}</div>
        <div class="cert-row"><strong>SAN:</strong> ${escapeHtml(sans)}</div>
        <div class="cert-row"><strong>SHA-256 Fingerprint:</strong> ${escapeHtml(cert.fingerprint_sha256 || "")}</div>
      `;

      certOutput.appendChild(card);
    });
  }

  if (certParseBtn && certInput) {
    certParseBtn.addEventListener("click", async () => {
      const certText = certInput.value || "";
      if (!certText.trim()) {
        setStatus(certStatus, "Incolla un certificato PEM.", "err");
        return;
      }

      setStatus(certStatus, "Parsing certificato in corso...");
      if (certOutput) certOutput.innerHTML = "";

      try {
        const response = await fetch(`${API_BASE}/api/certificate-parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certText }),
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Parsing failed");
        }

        renderCertificates(data.certificates || []);
        setStatus(certStatus, `Certificati letti: ${(data.certificates || []).length}.`, "ok");
      } catch (error) {
        setStatus(certStatus, `Errore: ${error.message}`, "err");
      }
    });
  }

  if (certClearBtn) {
    certClearBtn.addEventListener("click", () => {
      if (certInput) certInput.value = "";
      if (certOutput) certOutput.innerHTML = "";
      setStatus(certStatus, "");
      syncTextareaHeights();
    });
  }
}());
