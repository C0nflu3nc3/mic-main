function initMainUi() {
    const menuCollapseElement = document.getElementById("mainMenuCollapse");
    const menuToggleButton = document.getElementById("menuToggleButton");
    const sourceSelect = document.getElementById("userSRC");
    const amountInput = document.getElementById("PLT");
    const submitButton = document.getElementById("transferSubmit");
    const stateBlock = document.getElementById("transferState");
    const animatedDetailsSelector = ".news-edit-block, .news-suggest-block, .news-reply-block";

    document.querySelectorAll(animatedDetailsSelector).forEach(function (details) {
        const summary = details.querySelector(".news-edit-summary, .news-reply-summary");

        if (!summary || details.dataset.animatedDetailsBound === "true") {
            return;
        }

        details.dataset.animatedDetailsBound = "true";
        details.classList.toggle("is-open", !details.classList.contains("is-collapsed"));

        summary.addEventListener("click", function (event) {
            event.preventDefault();
            const willOpen = !details.classList.contains("is-open");
            details.classList.toggle("is-open", willOpen);
            details.classList.toggle("is-collapsed", !willOpen);
        });
    });

    if (menuCollapseElement && menuToggleButton && !menuCollapseElement.dataset.uiBound) {
        menuCollapseElement.dataset.uiBound = "true";
        const desktopMenuQuery = window.matchMedia("(min-width: 993px)");
        const menuLinks = menuCollapseElement.querySelectorAll(".nav-link");
        const setMenuState = function (isOpen) {
            menuCollapseElement.classList.toggle("is-open", isOpen);
            menuToggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
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

        syncMenuState();

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
