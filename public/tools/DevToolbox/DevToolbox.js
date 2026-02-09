(function () {
    const leftInput = document.getElementById("leftInput");
    const rightInput = document.getElementById("rightInput");
    const compareBtn = document.getElementById("compareBtn");
    const themeToggle = document.getElementById("themeToggle");
    const lineNumbersToggle = document.getElementById("lineNumbersToggle");
    const resultsSection = document.getElementById("results");
    const leftResult = document.getElementById("leftResult");
    const rightResult = document.getElementById("rightResult");
    const summaryLeftList = document.getElementById("summaryLeftList");
    const summaryRightList = document.getElementById("summaryRightList");
    const diffMode = document.getElementById("diffMode");
    const refLeftInput = document.getElementById("refLeftInput");
    const refRightInput = document.getElementById("refRightInput");
    const refCheckBtn = document.getElementById("refCheckBtn");
    const refResults = document.getElementById("refResults");
    const refLeftResult = document.getElementById("refLeftResult");
    const refRightResult = document.getElementById("refRightResult");
    const refInlineResult = document.getElementById("refInlineResult");
    const refSummaryList = document.getElementById("refSummaryList");
    const refLeftOnlyList = document.getElementById("refLeftOnlyList");
    const refRightOnlyList = document.getElementById("refRightOnlyList");
    const tcLeftInput = document.getElementById("tcLeftInput");
    const tcRightInput = document.getElementById("tcRightInput");
    const tcCompareBtn = document.getElementById("tcCompareBtn");
    const tcSwapBtn = document.getElementById("tcSwapBtn");
    const tcClearBtn = document.getElementById("tcClearBtn");
    const tcResults = document.getElementById("tcResults");
    const tcLeftResult = document.getElementById("tcLeftResult");
    const tcRightResult = document.getElementById("tcRightResult");
    const tcGroupList = document.getElementById("tcGroupList");
    const tcLeftFileBtn = document.getElementById("tcLeftFileBtn");
    const tcRightFileBtn = document.getElementById("tcRightFileBtn");
    const tcLeftFile = document.getElementById("tcLeftFile");
    const tcRightFile = document.getElementById("tcRightFile");
    const summaryWordsRemoved = document.getElementById("summaryWordsRemoved");
    const summaryWordsAdded = document.getElementById("summaryWordsAdded");
    const summaryLinesRemoved = document.getElementById("summaryLinesRemoved");
    const summaryLinesAdded = document.getElementById("summaryLinesAdded");
    const lineNumbersStorageKey = "devtoolbox-line-numbers";
    const optionToggleInputs = Array.from(document.querySelectorAll(".option-toggle input[data-option]"));

    function ensureTextareaLineNumberLayout(textarea) {
        if (!textarea || !textarea.parentNode) return;
        const existingShell = textarea.parentNode.classList && textarea.parentNode.classList.contains("textarea-shell");
        if (existingShell) return;

        const shell = document.createElement("div");
        shell.className = "textarea-shell";

        const lineNumbers = document.createElement("pre");
        lineNumbers.className = "textarea-line-numbers";
        lineNumbers.setAttribute("aria-hidden", "true");
        lineNumbers.textContent = "1";

        const parent = textarea.parentNode;
        parent.insertBefore(shell, textarea);
        shell.append(lineNumbers, textarea);
    }

    function getTextareaLineNumberEl(textarea) {
        if (!textarea || !textarea.parentElement || !textarea.parentElement.classList.contains("textarea-shell")) {
            return null;
        }
        return textarea.parentElement.querySelector(".textarea-line-numbers");
    }

    function buildLineNumbersText(value) {
        const lineCount = Math.max(1, String(value || "").split(/\r?\n/).length);
        const rows = [];
        for (let i = 1; i <= lineCount; i += 1) {
            rows.push(String(i));
        }
        return rows.join("\n");
    }

    function syncTextareaLineNumbers(textarea) {
        const lineNumbersEl = getTextareaLineNumberEl(textarea);
        if (!lineNumbersEl) return;
        lineNumbersEl.textContent = buildLineNumbersText(textarea.value || "");
        lineNumbersEl.scrollTop = textarea.scrollTop;
        lineNumbersEl.style.height = `${textarea.offsetHeight}px`;
    }

    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        const minHeight = Number.parseFloat(window.getComputedStyle(textarea).minHeight) || 180;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
        syncTextareaLineNumbers(textarea);
    }

    function autoResizeAllTextareas() {
        Array.from(document.querySelectorAll("textarea")).forEach((textarea) => {
            autoResizeTextarea(textarea);
        });
    }

    function setLineNumbersEnabled(enabled) {
        const useLineNumbers = Boolean(enabled);
        document.documentElement.classList.toggle("show-line-numbers", useLineNumbers);
        if (lineNumbersToggle) {
            lineNumbersToggle.checked = useLineNumbers;
        }
        if (window.localStorage) {
            localStorage.setItem(lineNumbersStorageKey, useLineNumbers ? "1" : "0");
        }
        autoResizeAllTextareas();
    }

    if (typeof window !== "undefined") {
        window.devToolboxAutoResizeTextarea = autoResizeTextarea;
        window.devToolboxAutoResizeAllTextareas = autoResizeAllTextareas;
    }

    Array.from(document.querySelectorAll("textarea")).forEach((textarea) => {
        ensureTextareaLineNumberLayout(textarea);
        autoResizeTextarea(textarea);
        textarea.addEventListener("input", () => autoResizeTextarea(textarea));
        textarea.addEventListener("scroll", () => {
            const lineNumbersEl = getTextareaLineNumberEl(textarea);
            if (lineNumbersEl) {
                lineNumbersEl.scrollTop = textarea.scrollTop;
            }
        });
    });

    const savedTheme = window.localStorage
        ? localStorage.getItem("devtoolbox-theme")
        : null;
    setTheme(savedTheme === "light" ? "light" : "dark");

    const savedLineNumbers = window.localStorage
        ? localStorage.getItem(lineNumbersStorageKey)
        : null;
    setLineNumbersEnabled(savedLineNumbers === "1");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            const next = current === "light" ? "dark" : "light";
            if (window.localStorage) {
                localStorage.setItem("devtoolbox-theme", next);
            }
            setTheme(next);
        });
    }

    if (lineNumbersToggle) {
        lineNumbersToggle.addEventListener("change", () => {
            setLineNumbersEnabled(lineNumbersToggle.checked);
        });
    }

    optionToggleInputs.forEach((input) => {
        input.addEventListener("change", () => {
            syncOptionToggles(input);
        });
    });

    compareBtn.addEventListener("click", () => {
        const leftText = leftInput.value || "";
        const rightText = rightInput.value || "";
        const mode = diffMode ? diffMode.value : "char";
        const options = getDiffOptions();

        const diff = buildDiff(leftText, rightText, mode, options);
        leftResult.innerHTML = renderDiff(diff, "left", mode, { allowInline: mode !== "word", options });
        rightResult.innerHTML = renderDiff(diff, "right", mode, { allowInline: mode !== "word", options });
        renderSummary(diff, options);
        renderTotals(computeDiffStats(leftText, rightText, options));

        resultsSection.classList.remove("hidden");
    });

    if (refCheckBtn) {
        refCheckBtn.addEventListener("click", () => {
            const leftEntries = parseRefLines(refLeftInput.value || "");
            const rightEntries = parseRefLines(refRightInput.value || "");

            const leftNormalized = leftEntries
                .map((entry) => ({
                    raw: entry.raw,
                    normalized: normalizeRef(entry.raw),
                    line: entry.line,
                }))
                .filter((item) => item.normalized);
            const leftUnique = uniqueInOrder(leftNormalized.map((item) => item.normalized));
            const leftLineMap = new Map();
            leftNormalized.forEach((item) => {
                if (!leftLineMap.has(item.normalized)) {
                    leftLineMap.set(item.normalized, item.line);
                }
            });
            const leftSet = new Set(leftUnique);

            const rightData = rightEntries
                .map((entry) => ({
                    raw: entry.raw,
                    normalized: normalizeRef(entry.raw),
                    line: entry.line,
                }))
                .filter((item) => item.normalized);

            renderRefList(refLeftResult, leftUnique, leftLineMap);
            renderRefMatches(refRightResult, rightData, leftSet);
            renderRefInline(refInlineResult, rightData, leftSet);
            renderRefSummary(refSummaryList, refLeftOnlyList, refRightOnlyList, leftUnique, rightData, leftSet);

            if (refResults) {
                refResults.classList.remove("hidden");
            }
        });
    }

    if (tcLeftFileBtn && tcLeftFile) {
        tcLeftFileBtn.addEventListener("click", () => tcLeftFile.click());
        tcLeftFile.addEventListener("change", (event) => {
            handleFileSelection(event, tcLeftInput);
        });
    }

    if (tcRightFileBtn && tcRightFile) {
        tcRightFileBtn.addEventListener("click", () => tcRightFile.click());
        tcRightFile.addEventListener("change", (event) => {
            handleFileSelection(event, tcRightInput);
        });
    }

    if (tcSwapBtn) {
        tcSwapBtn.addEventListener("click", () => {
            if (!tcLeftInput || !tcRightInput) return;
            const leftValue = tcLeftInput.value;
            tcLeftInput.value = tcRightInput.value;
            tcRightInput.value = leftValue;
            autoResizeAllTextareas();
        });
    }

    if (tcClearBtn) {
        tcClearBtn.addEventListener("click", () => {
            if (tcLeftInput) tcLeftInput.value = "";
            if (tcRightInput) tcRightInput.value = "";
            if (tcLeftResult) tcLeftResult.innerHTML = "";
            if (tcRightResult) tcRightResult.innerHTML = "";
            if (tcGroupList) tcGroupList.innerHTML = "";
            if (tcResults) tcResults.classList.add("hidden");
            if (tcLeftFile) tcLeftFile.value = "";
            if (tcRightFile) tcRightFile.value = "";
            autoResizeAllTextareas();
        });
    }

    if (tcCompareBtn) {
        tcCompareBtn.addEventListener("click", () => {
            if (!tcLeftInput || !tcRightInput || !tcLeftResult || !tcRightResult || !tcGroupList) {
                return;
            }
            const leftText = tcLeftInput.value || "";
            const rightText = tcRightInput.value || "";
            const options = getDiffOptions();
            const diff = buildDiff(leftText, rightText, "word", options);
            tcLeftResult.innerHTML = renderDiff(diff, "left", "word", { allowInline: true, options });
            tcRightResult.innerHTML = renderDiff(diff, "right", "word", { allowInline: true, options });
            renderWordGroups(tcGroupList, diff, options);
            if (tcResults) tcResults.classList.remove("hidden");
        });
    }

    function handleFileSelection(event, targetInput) {
        if (!event || !targetInput) return;
        const file = event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            targetInput.value = typeof reader.result === "string" ? reader.result : "";
            autoResizeTextarea(targetInput);
        };
        reader.readAsText(file);
    }

    function syncOptionToggles(source) {
        if (!source || !source.dataset) return;
        const option = source.dataset.option;
        if (!option) return;
        optionToggleInputs.forEach((input) => {
            if (input === source) return;
            if (input.dataset.option === option) {
                input.checked = source.checked;
            }
        });
    }

    function getDiffOptions() {
        return {
            ignoreCase: isOptionChecked("ignoreCase"),
            ignoreWhitespace: isOptionChecked("ignoreWhitespace"),
            ignorePunctuation: isOptionChecked("ignorePunctuation"),
        };
    }

    function isOptionChecked(option) {
        return optionToggleInputs.some((input) => input.dataset.option === option && input.checked);
    }

    function renderDiff(segments, side, mode, renderOptions) {
        if (!segments.length) {
            return '<span class="diff-muted">Nessun testo inserito.</span>';
        }

        const html = renderSegmentsWithLineNumbers(segments, side, mode, renderOptions);
        const options = normalizeOptions(renderOptions ? renderOptions.options : {});

        const sideHasChange = segments.some((s) => {
            if (s.type === "equal") return false;
            if (isIgnorableSegment(s.value, options)) return false;
            return side === "left" ? s.type === "delete" : s.type === "insert";
        });

        return sideHasChange ? html : '<span class="diff-muted">Nessuna differenza trovata.</span>';
    }

    function renderSegmentsWithLineNumbers(segments, side, mode, renderOptions) {
        const options = normalizeOptions(renderOptions ? renderOptions.options : {});
        const allowInline = renderOptions && renderOptions.allowInline === false ? false : true;
        const lines = [];
        let currentLine = [];
        let hasRendered = false;

        function pushLine() {
            lines.push(currentLine.join(""));
            currentLine = [];
        }

        function appendHtml(html) {
            if (!html) return;
            currentLine.push(html);
        }

        function appendSegmentValue(value, className) {
            if (!value) return;
            hasRendered = true;
            const parts = value.split("\n");
            parts.forEach((part, index) => {
                if (part) {
                    currentLine.push(`<span class="${className}">${escapeHtml(part)}</span>`);
                }
                if (index < parts.length - 1) {
                    pushLine();
                }
            });
        }

        for (let i = 0; i < segments.length; i += 1) {
            const replacement = getInlineReplacement(segments, i, mode, {
                allowInline,
                options,
            });
            if (replacement) {
                hasRendered = true;
                appendHtml(side === "left" ? replacement.left : replacement.right);
                i += replacement.skip;
                continue;
            }

            const segment = segments[i];
            if (segment.type === "equal") {
                appendSegmentValue(segment.value, "diff-equal");
            } else if (side === "left" && segment.type === "delete") {
                const className = isIgnorableSegment(segment.value, options) ? "diff-equal" : "diff-delete";
                appendSegmentValue(segment.value, className);
            } else if (side === "right" && segment.type === "insert") {
                const className = isIgnorableSegment(segment.value, options) ? "diff-equal" : "diff-insert";
                appendSegmentValue(segment.value, className);
            }
        }

        if (hasRendered) {
            pushLine();
        }

        return lines.map((line, index) => {
            const content = line || "&nbsp;";
            return `<div class="diff-line"><span class="diff-line-no">${index + 1}</span><span class="diff-line-text">${content}</span></div>`;
        }).join("");
    }

    function renderSegments(segments, side, mode, renderOptions) {
        const options = normalizeOptions(renderOptions ? renderOptions.options : {});
        const allowInline = renderOptions && renderOptions.allowInline === false ? false : true;
        const html = [];

        for (let i = 0; i < segments.length; i += 1) {
            const replacement = getInlineReplacement(segments, i, mode, {
                allowInline,
                options,
            });
            if (replacement) {
                html.push(side === "left" ? replacement.left : replacement.right);
                i += replacement.skip;
                continue;
            }

            html.push(renderSegment(segments[i], side, options));
        }

        return html.join("");
    }

    function renderSegment(segment, side, options) {
        const safe = escapeHtml(segment.value);
        if (!safe) return "";

        if (segment.type === "equal") {
            return `<span class="diff-equal">${safe}</span>`;
        }

        if (isIgnorableSegment(segment.value, options)) {
            return `<span class="diff-equal">${safe}</span>`;
        }

        if (side === "left" && segment.type === "delete") {
            return `<span class="diff-delete">${safe}</span>`;
        }

        if (side === "right" && segment.type === "insert") {
            return `<span class="diff-insert">${safe}</span>`;
        }

        // Ignore changes that belong to the other side to keep text clean
        return "";
    }

    function getInlineReplacement(segments, index, mode, renderOptions) {
        const allowInline = renderOptions && renderOptions.allowInline === false ? false : true;
        const options = normalizeOptions(renderOptions ? renderOptions.options : {});
        if (!allowInline) return null;
        if (mode !== "word") return null;
        const current = segments[index];
        const next = segments[index + 1];
        if (!current || !next) return null;

        if (current.type === "delete" && next.type === "insert") {
            if (!isInlineToken(current.value) || !isInlineToken(next.value)) return null;
            return { ...renderInlineReplacement(current.value, next.value, options), skip: 1 };
        }

        if (current.type === "insert" && next.type === "delete") {
            if (!isInlineToken(current.value) || !isInlineToken(next.value)) return null;
            return { ...renderInlineReplacement(next.value, current.value, options), skip: 1 };
        }

        return null;
    }

    function isInlineToken(value) {
        return value && !/\s/.test(value);
    }

    function renderInlineReplacement(leftValue, rightValue, options) {
        const segments = buildDiff(leftValue, rightValue, "char", options);
        return {
            left: renderSegments(segments, "left", "char", { options }),
            right: renderSegments(segments, "right", "char", { options }),
        };
    }

    function renderSummary(segments, options) {
        if (!summaryLeftList || !summaryRightList) return;
        summaryLeftList.innerHTML = "";
        summaryRightList.innerHTML = "";

        if (!segments.length) {
            appendSummaryMessage(summaryLeftList, "Nessun testo inserito.");
            appendSummaryMessage(summaryRightList, "Nessun testo inserito.");
            return;
        }

        let leftCount = 0;
        let rightCount = 0;

        const normalizedOptions = normalizeOptions(options);
        segments.forEach((segment) => {
            if (!segment.value) return;
            if (isIgnorableSegment(segment.value, normalizedOptions)) return;
            const chunks = summarizeChunk(segment.value);
            const isLeft = segment.type === "delete";
            const isRight = segment.type === "insert";
            if (!isLeft && !isRight) return;

            chunks.forEach((chunk) => {
                const li = document.createElement("li");
                li.className = isLeft ? "summary-left" : "summary-right";
                li.textContent = `"${chunk}"`;
                if (isLeft) {
                    summaryLeftList.appendChild(li);
                    leftCount += 1;
                } else {
                    summaryRightList.appendChild(li);
                    rightCount += 1;
                }
            });
        });

        if (!leftCount && !rightCount) {
            appendSummaryMessage(summaryLeftList, "I testi sono identici.");
            appendSummaryMessage(summaryRightList, "I testi sono identici.");
        }
    }

    function appendSummaryMessage(container, message) {
        const li = document.createElement("li");
        li.className = "diff-muted";
        li.textContent = message;
        container.appendChild(li);
    }

    function buildDiff(oldText, newText, mode, options) {
        const normalizedOptions = normalizeOptions(options);
        const oldTokens = tokenize(oldText, mode);
        const newTokens = tokenize(newText, mode);
        const oldNorm = oldTokens.map((token) => normalizeToken(token, mode, normalizedOptions));
        const newNorm = newTokens.map((token) => normalizeToken(token, mode, normalizedOptions));

        const dp = createLcsMatrix(oldNorm, newNorm);
        const segments = [];
        let i = 0;
        let j = 0;

        while (i < oldTokens.length && j < newTokens.length) {
            if (oldNorm[i] === newNorm[j]) {
                segments.push({ type: "equal", value: oldTokens[i] });
                i += 1;
                j += 1;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                segments.push({ type: "delete", value: oldTokens[i] });
                i += 1;
            } else {
                segments.push({ type: "insert", value: newTokens[j] });
                j += 1;
            }
        }

        while (i < oldTokens.length) {
            segments.push({ type: "delete", value: oldTokens[i] });
            i += 1;
        }
        while (j < newTokens.length) {
            segments.push({ type: "insert", value: newTokens[j] });
            j += 1;
        }

        return mergeSegments(segments);
    }

    function tokenize(text, mode) {
        if (!text) return [];
        if (mode === "word") {
            return text.match(/\s+|[^\s]+/g) || [];
        }
        if (mode === "line") {
            const lines = text.split(/\r?\n/);
            return lines.map((line, index) => (index < lines.length - 1 ? `${line}\n` : line));
        }
        // Split to single characters (including spaces/newlines) so we can highlight
        // even one-letter differences in-place.
        return Array.from(text);
    }

    function createLcsMatrix(a, b) {
        const rows = a.length + 1;
        const cols = b.length + 1;
        const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

        for (let i = a.length - 1; i >= 0; i -= 1) {
            for (let j = b.length - 1; j >= 0; j -= 1) {
                dp[i][j] = a[i] === b[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }

        return dp;
    }

    function mergeSegments(segments) {
        if (!segments.length) {
            return [];
        }

        const merged = [segments[0]];

        for (let idx = 1; idx < segments.length; idx += 1) {
            const current = segments[idx];
            const prev = merged[merged.length - 1];

            if (current.type === prev.type) {
                prev.value += current.value;
            } else {
                merged.push({ ...current });
            }
        }

        return merged;
    }

    function summarizeChunk(value) {
        const trimmedWords = value.trim().split(/\s+/).filter(Boolean);

        if (trimmedWords.length) {
            // Raggruppa per parola per leggibilità (es. differenze lunghe)
            return [trimmedWords.join(" ")];
        }

        // Solo spazi/a capo/tab: rendili visibili
        const visible = value
            .replace(/ /g, "␠")
            .replace(/\t/g, "⇥")
            .replace(/\r?\n/g, "⏎");

        // Collassa sequenze ripetute (es. ␠␠␠ -> ␠x3)
        return [visible.replace(/(␠|⇥|⏎)\1+/g, (m, c) => `${c}x${m.length}`)];
    }

    function normalizeOptions(options) {
        return {
            ignoreCase: Boolean(options && options.ignoreCase),
            ignoreWhitespace: Boolean(options && options.ignoreWhitespace),
            ignorePunctuation: Boolean(options && options.ignorePunctuation),
        };
    }

    function stripPunctuation(value) {
        return value.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "");
    }

    function normalizeToken(token, mode, options) {
        let normalized = token || "";
        if (!normalized) return "";

        if (options.ignoreWhitespace) {
            if (mode === "line") {
                normalized = normalized.replace(/\s+/g, " ");
            } else if (/^\s+$/.test(normalized)) {
                normalized = " ";
            }
        }

        if (options.ignorePunctuation) {
            normalized = stripPunctuation(normalized);
        }

        if (options.ignoreCase) {
            normalized = normalized.toLowerCase();
        }

        return normalized;
    }

    function isWhitespaceOnly(value) {
        return value && /^\s+$/.test(value);
    }

    function isPunctuationOnly(value) {
        if (!value) return false;
        const trimmed = value.replace(/\s/g, "");
        if (!trimmed) return false;
        return /^[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(trimmed);
    }

    function isIgnorableSegment(value, options) {
        const normalizedOptions = normalizeOptions(options);
        if (!value) return false;
        if (normalizedOptions.ignoreWhitespace && isWhitespaceOnly(value)) return true;
        if (normalizedOptions.ignorePunctuation && isPunctuationOnly(value)) return true;
        return false;
    }

    function countWords(value, options) {
        if (!value) return 0;
        const normalizedOptions = normalizeOptions(options);
        let text = value;
        if (normalizedOptions.ignorePunctuation) {
            text = stripPunctuation(text);
        }
        const trimmed = text.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    }

    function countLines(value, options) {
        if (!value) return 0;
        const normalizedOptions = normalizeOptions(options);
        let text = value;
        if (normalizedOptions.ignorePunctuation) {
            text = stripPunctuation(text);
        }
        if (normalizedOptions.ignoreWhitespace && !text.replace(/\s/g, "")) {
            return 0;
        }
        const parts = text.split(/\r?\n/);
        let count = parts.length;
        if (text.endsWith("\n") || text.endsWith("\r\n")) {
            count -= 1;
        }
        return Math.max(count, 0);
    }

    function computeDiffStats(oldText, newText, options) {
        const normalizedOptions = normalizeOptions(options);
        const wordDiff = buildDiff(oldText, newText, "word", normalizedOptions);
        const lineDiff = buildDiff(oldText, newText, "line", normalizedOptions);
        const stats = {
            wordsAdded: 0,
            wordsRemoved: 0,
            linesAdded: 0,
            linesRemoved: 0,
        };

        wordDiff.forEach((segment) => {
            if (segment.type !== "insert" && segment.type !== "delete") return;
            if (isIgnorableSegment(segment.value, normalizedOptions)) return;
            const count = countWords(segment.value, normalizedOptions);
            if (segment.type === "insert") {
                stats.wordsAdded += count;
            } else {
                stats.wordsRemoved += count;
            }
        });

        lineDiff.forEach((segment) => {
            if (segment.type !== "insert" && segment.type !== "delete") return;
            if (isIgnorableSegment(segment.value, normalizedOptions)) return;
            const count = countLines(segment.value, normalizedOptions);
            if (segment.type === "insert") {
                stats.linesAdded += count;
            } else {
                stats.linesRemoved += count;
            }
        });

        return stats;
    }

    function renderTotals(stats) {
        if (!summaryWordsAdded || !summaryWordsRemoved || !summaryLinesAdded || !summaryLinesRemoved) {
            return;
        }
        summaryWordsAdded.textContent = String(stats.wordsAdded);
        summaryWordsRemoved.textContent = String(stats.wordsRemoved);
        summaryLinesAdded.textContent = String(stats.linesAdded);
        summaryLinesRemoved.textContent = String(stats.linesRemoved);
    }

    function buildWordGroups(segments, options) {
        const groups = [];
        let current = null;
        const normalizedOptions = normalizeOptions(options);

        segments.forEach((segment) => {
            if (segment.type === "equal") {
                if (current) {
                    const hasWords = hasMeaningfulContent(current.left, normalizedOptions)
                        || hasMeaningfulContent(current.right, normalizedOptions);
                    if (hasWords) {
                        groups.push({
                            left: formatGroupText(current.left),
                            right: formatGroupText(current.right),
                        });
                    }
                    current = null;
                }
                return;
            }

            if (!current) {
                current = { left: "", right: "" };
            }

            if (segment.type === "delete") {
                current.left += segment.value;
            } else if (segment.type === "insert") {
                current.right += segment.value;
            }
        });

        if (current) {
            const hasWords = hasMeaningfulContent(current.left, normalizedOptions)
                || hasMeaningfulContent(current.right, normalizedOptions);
            if (hasWords) {
                groups.push({
                    left: formatGroupText(current.left),
                    right: formatGroupText(current.right),
                });
            }
        }

        return groups;
    }

    function renderWordGroups(container, segments, options) {
        if (!container) return;
        container.innerHTML = "";

        const groups = buildWordGroups(segments, options);

        if (!groups.length) {
            const empty = document.createElement("div");
            empty.className = "diff-muted";
            empty.textContent = "Nessuna differenza trovata.";
            container.appendChild(empty);
            return;
        }

        groups.forEach((group) => {
            const row = document.createElement("div");
            row.className = "group-row";

            const leftCell = document.createElement("div");
            leftCell.className = "group-cell group-left";
            renderGroupCell(leftCell, group.left, group.right, "left", options);

            const rightCell = document.createElement("div");
            rightCell.className = "group-cell group-right";
            renderGroupCell(rightCell, group.left, group.right, "right", options);

            row.append(leftCell, rightCell);
            container.appendChild(row);
        });
    }

    function renderGroupCell(cell, leftValue, rightValue, side, options) {
        const raw = side === "left" ? leftValue : rightValue;
        if (!raw || isIgnorableSegment(raw, options)) {
            cell.innerHTML = '<span class="diff-muted">n/a</span>';
            return;
        }

        const diff = buildDiff(leftValue || "", rightValue || "", "char", options);
        const html = renderSegments(diff, side, "char", { options });
        cell.innerHTML = html || '<span class="diff-muted">n/a</span>';
    }

    function formatGroupText(value) {
        if (!value) return "";
        const trimmed = value.trim();
        if (trimmed) {
            return trimmed.replace(/\s+/g, " ");
        }
        return summarizeChunk(value)[0];
    }

    function hasMeaningfulContent(value, options) {
        if (!value) return false;
        if (isIgnorableSegment(value, options)) return false;
        return value.trim().length > 0;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function setTheme(theme) {
        const normalized = theme === "light" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", normalized);
        if (themeToggle) {
            const isLight = normalized === "light";
            themeToggle.textContent = isLight ? "Tema: Light" : "Tema: Dark";
            themeToggle.setAttribute("aria-pressed", String(isLight));
        }
    }

    function parseRefLines(text) {
        return text
            .split(/\r?\n/)
            .map((line, index) => ({ raw: line.trim(), line: index + 1 }))
            .filter((item) => item.raw);
    }

    function normalizeRef(value) {
        const trimmed = value.trim();
        if (!trimmed) return "";
        const withoutCount = trimmed.replace(/\s*\(\d+x\)\s*$/i, "");
        return withoutCount.toUpperCase();
    }

    function uniqueInOrder(values) {
        const seen = new Set();
        const unique = [];

        values.forEach((value) => {
            if (!value || seen.has(value)) return;
            seen.add(value);
            unique.push(value);
        });

        return unique;
    }

    function renderRefList(container, items, lineMap) {
        if (!container) return;
        container.innerHTML = "";

        if (!items.length) {
            container.innerHTML = '<span class="diff-muted">Nessuna reference inserita.</span>';
            return;
        }

        const list = document.createElement("ul");
        list.className = "ref-list ref-list-numbered";

        items.forEach((item, index) => {
            const li = document.createElement("li");
            const lineNo = document.createElement("span");
            lineNo.className = "ref-line-no";
            lineNo.textContent = lineMap && lineMap.has(item) ? lineMap.get(item) : String(index + 1);

            const lineText = document.createElement("span");
            lineText.className = "ref-line-text";
            lineText.textContent = item;

            li.append(lineNo, lineText);
            list.appendChild(li);
        });

        container.appendChild(list);
    }

    function renderRefMatches(container, items, leftSet) {
        if (!container) return;
        container.innerHTML = "";

        if (!items.length) {
            container.innerHTML = '<span class="diff-muted">Nessuna reference inserita.</span>';
            return;
        }

        const list = document.createElement("ul");
        list.className = "ref-list ref-list-numbered";

        items.forEach((item) => {
            const li = document.createElement("li");
            const isMatch = leftSet.has(item.normalized);
            li.className = isMatch ? "ref-match" : "ref-missing";
            const lineNo = document.createElement("span");
            lineNo.className = "ref-line-no";
            lineNo.textContent = String(item.line);

            const lineText = document.createElement("span");
            lineText.className = "ref-line-text";
            lineText.textContent = item.raw;

            li.append(lineNo, lineText);
            list.appendChild(li);
        });

        container.appendChild(list);
    }

    function renderRefInline(container, items, leftSet) {
        if (!container) return;
        container.innerHTML = "";

        if (!items.length) {
            container.innerHTML = '<span class="diff-muted">Nessuna reference inserita.</span>';
            return;
        }

        const lines = items.map((item) => {
            const isMatch = leftSet.has(item.normalized);
            const className = isMatch ? "diff-insert" : "diff-delete";
            const safe = escapeHtml(item.raw);
            return `<div class="diff-line"><span class="diff-line-no">${item.line}</span><span class="diff-line-text"><span class="${className}">${safe}</span></span></div>`;
        });

        container.innerHTML = lines.join("");
    }

    function renderRefSummary(container, leftOnlyList, rightOnlyList, leftUnique, rightData, leftSet) {
        if (!container) return;
        container.innerHTML = "";
        if (leftOnlyList) leftOnlyList.innerHTML = "";
        if (rightOnlyList) rightOnlyList.innerHTML = "";

        if (!leftUnique.length && !rightData.length) {
            const li = document.createElement("li");
            li.className = "diff-muted";
            li.textContent = "Nessuna reference inserita.";
            container.appendChild(li);
            renderRefBucket(leftOnlyList, [], "Nessuna ref solo in DLQ.");
            renderRefBucket(rightOnlyList, [], "Nessuna ref solo nel ticket.");
            return;
        }

        const totalLeft = leftUnique.length;
        const rightUnique = uniqueInOrder(
            rightData.map((item) => item.normalized).filter(Boolean)
        );
        const rightSet = new Set(rightUnique);
        const leftOnly = leftUnique.filter((value) => !rightSet.has(value));
        const rightOnlyCounted = countRefs(rightData).filter(
            (item) => !leftSet.has(item.value)
        );

        const totalLi = document.createElement("li");
        totalLi.className = "diff-muted";
        totalLi.textContent = `REF uniche DLQ: ${totalLeft}`;
        container.appendChild(totalLi);

        const leftOnlyLi = document.createElement("li");
        leftOnlyLi.className = "summary-left";
        leftOnlyLi.textContent = `Solo in DLQ: ${leftOnly.length}`;
        container.appendChild(leftOnlyLi);

        const rightOnlyLi = document.createElement("li");
        rightOnlyLi.className = "summary-right";
        rightOnlyLi.textContent = `Solo nel ticket: ${rightOnlyCounted.length}`;
        container.appendChild(rightOnlyLi);

        const leftOnlyItems = leftOnly.map((value) => ({ value, count: 1 }));
        renderRefBucket(leftOnlyList, leftOnlyItems, "Nessuna ref solo in DLQ.", "summary-left");
        renderRefBucket(rightOnlyList, rightOnlyCounted, "Nessuna ref solo nel ticket.", "summary-right");
    }

    function countRefs(items) {
        const counts = new Map();
        const order = [];

        items.forEach((item) => {
            if (!item.normalized) return;
            if (!counts.has(item.normalized)) {
                counts.set(item.normalized, 0);
                order.push(item.normalized);
            }
            counts.set(item.normalized, counts.get(item.normalized) + 1);
        });

        return order.map((value) => ({ value, count: counts.get(value) }));
    }

    function renderRefBucket(container, items, emptyText, highlightClass) {
        if (!container) return;
        container.innerHTML = "";

        if (!items.length) {
            const li = document.createElement("li");
            li.className = "diff-muted";
            li.textContent = emptyText;
            container.appendChild(li);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            if (highlightClass) {
                li.className = highlightClass;
            }
            li.textContent = item.count > 1 ? `${item.value} (${item.count}x)` : item.value;
            container.appendChild(li);
        });
    }
}());
