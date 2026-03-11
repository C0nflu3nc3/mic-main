document.addEventListener("DOMContentLoaded", function () {
    const menuCollapseElement = document.getElementById("mainMenuCollapse");
    const menuToggleButton = document.getElementById("menuToggleButton");
    const sourceSelect = document.getElementById("userSRC");
    const amountInput = document.getElementById("PLT");
    const submitButton = document.getElementById("transferSubmit");
    const stateBlock = document.getElementById("transferState");

    if (menuCollapseElement && menuToggleButton) {
        const menuLinks = menuCollapseElement.querySelectorAll(".nav-link");
        const setMenuState = function (isOpen) {
            menuCollapseElement.classList.toggle("is-open", isOpen);
            menuToggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
        };

        menuToggleButton.addEventListener("click", function () {
            setMenuState(!menuCollapseElement.classList.contains("is-open"));
        });

        menuLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                setMenuState(false);
            });
        });
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
});
