function initMainUi() {
    document.body.classList.remove("mobile-menu-open");

    const menuCollapseElement = document.getElementById("mainMenuCollapse");
    const menuToggleButton = document.getElementById("menuToggleButton");
    const sourceSelect = document.getElementById("userSRC");
    const amountInput = document.getElementById("PLT");
    const submitButton = document.getElementById("transferSubmit");
    const stateBlock = document.getElementById("transferState");
    const animatedDetailsSelector = ".news-edit-block, .news-suggest-block, .news-reply-block";

    document.querySelectorAll(animatedDetailsSelector).forEach(function (details) {
        const summary = details.querySelector(".news-edit-summary, .news-reply-summary");
        const body = details.querySelector(".news-edit-body");

        if (!summary || !body || details.dataset.animatedDetailsBound === "true") {
            return;
        }

        details.dataset.animatedDetailsBound = "true";
        details.open = false;
        details.classList.add("is-collapsed");
        body.style.maxHeight = "0px";
        body.style.opacity = "0";
        body.style.transform = "translateY(-8px)";

        const openDetails = function () {
            details.open = true;
            details.classList.remove("is-collapsed", "is-closing");
            details.classList.add("is-open");

            body.style.maxHeight = body.scrollHeight + "px";
            body.style.opacity = "1";
            body.style.transform = "translateY(0)";

            const finishOpen = function (event) {
                if (event.propertyName !== "max-height") {
                    return;
                }
                if (details.classList.contains("is-open")) {
                    body.style.maxHeight = "none";
                }
                body.removeEventListener("transitionend", finishOpen);
            };

            body.addEventListener("transitionend", finishOpen);
        };

        const closeDetails = function () {
            details.classList.remove("is-open");
            details.classList.add("is-closing");

            body.style.maxHeight = body.scrollHeight + "px";
            body.style.opacity = "1";
            body.style.transform = "translateY(0)";
            body.getBoundingClientRect();

            window.requestAnimationFrame(function () {
                body.style.maxHeight = "0px";
                body.style.opacity = "0";
                body.style.transform = "translateY(-8px)";
            });

            const finishClose = function (event) {
                if (event.propertyName !== "max-height") {
                    return;
                }
                details.open = false;
                details.classList.remove("is-closing");
                details.classList.add("is-collapsed");
                body.removeEventListener("transitionend", finishClose);
            };

            body.addEventListener("transitionend", finishClose);
        };

        summary.addEventListener("click", function (event) {
            event.preventDefault();
            if (details.classList.contains("is-open") || details.classList.contains("is-closing")) {
                closeDetails();
                return;
            }
            openDetails();
        });
    });

    document.querySelectorAll("[data-leaderboard-sync='true']").forEach(function (select) {
        if (select.dataset.uiBound === "true") {
            return;
        }

        select.dataset.uiBound = "true";
        const nameInput = document.getElementById(select.dataset.nameTarget || "");
        const scoreInput = document.getElementById(select.dataset.scoreTarget || "");
        const stateBlock = document.getElementById(select.dataset.stateTarget || "");

        if (!nameInput || !scoreInput) {
            return;
        }

        const syncLeaderboardForm = function () {
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) {
                return;
            }

            const currentName = selectedOption.dataset.name || selectedOption.textContent || "";
            const currentScore = selectedOption.dataset.score || "0";

            nameInput.value = currentName;
            scoreInput.value = currentScore;

            if (stateBlock) {
                stateBlock.textContent = `Сейчас у легиона ${currentScore} очков влияния.`;
            }
        };

        select.addEventListener("change", syncLeaderboardForm);
        syncLeaderboardForm();
    });

    if (menuCollapseElement && menuToggleButton && !menuCollapseElement.dataset.uiBound) {
        menuCollapseElement.dataset.uiBound = "true";
        const desktopMenuQuery = window.matchMedia("(min-width: 993px)");
        const menuLinks = menuCollapseElement.querySelectorAll(".nav-link");
        const setMenuState = function (isOpen) {
            const showMobileOverlay = isOpen && !desktopMenuQuery.matches;
            menuCollapseElement.classList.toggle("is-open", isOpen);
            menuToggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
            document.body.classList.toggle("mobile-menu-open", showMobileOverlay);
        };

        const syncMenuState = function () {
            setMenuState(desktopMenuQuery.matches);
        };

        menuToggleButton.addEventListener("click", function () {
            setMenuState(!menuCollapseElement.classList.contains("is-open"));
        });

        menuLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                if (!desktopMenuQuery.matches) {
                    setMenuState(false);
                }
            });
        });

        setMenuState(desktopMenuQuery.matches);

        if (typeof desktopMenuQuery.addEventListener === "function") {
            desktopMenuQuery.addEventListener("change", syncMenuState);
        } else if (typeof desktopMenuQuery.addListener === "function") {
            desktopMenuQuery.addListener(syncMenuState);
        }
    }

    if (!amountInput || !submitButton) {
        return;
    }

    function applyBalance(balance) {
        const safeBalance = Number.isFinite(balance) && balance > 0 ? Math.floor(balance) : 0;
        amountInput.max = String(safeBalance);
        amountInput.min = "0";

        if (safeBalance === 0) {
            amountInput.value = "0";
            amountInput.disabled = true;
            submitButton.disabled = true;
            if (stateBlock) {
                stateBlock.textContent = "Перевод недоступен: у выбранного легиона нулевой баланс.";
            }
            return;
        }

        amountInput.disabled = false;
        submitButton.disabled = false;

        const currentValue = parseInt(amountInput.value || "0", 10);
        if (!currentValue || currentValue < 1 || currentValue > safeBalance) {
            amountInput.value = "1";
        }
        amountInput.min = "1";

        if (stateBlock) {
            stateBlock.textContent = "";
        }
    }

    if (sourceSelect) {
        if (sourceSelect.dataset.uiBound === "true") {
            return;
        }
        sourceSelect.dataset.uiBound = "true";

        const syncAdminBalance = function () {
            const selectedOption = sourceSelect.options[sourceSelect.selectedIndex];
            const balance = parseInt(selectedOption?.dataset.balance || "0", 10);
            applyBalance(balance);
        };

        sourceSelect.addEventListener("change", syncAdminBalance);
        syncAdminBalance();
        return;
    }

    applyBalance(parseInt(amountInput.max || "0", 10));
}

window.initMainUi = initMainUi;
document.addEventListener("DOMContentLoaded", initMainUi);
