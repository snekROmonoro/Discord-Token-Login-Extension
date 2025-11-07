document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector("#submit");
    const tokenInput = document.querySelector("#token");
    const statusEl = document.querySelector("#status");
    const statusTextEl = document.querySelector("#status-text");

    function setStatus(text, state = 'info') {
        if (!text || text === '') {
            statusEl.className = 'status hidden';
            statusTextEl.textContent = '';
            return;
        }

        const short = String(text).slice(0, 300);
        statusTextEl.textContent = short;

        statusEl.className = 'status ' + (state || 'info');
        statusEl.classList.remove('hidden');
    }

    function extractToken() {
        let token = tokenInput.value.trim();
        if (!token) {
            return null;
        }

        const tokenMatch = token.match(/(mfa.[\w-]{84}|[\w-]{23,24}.[\w-]{6}.[\w-]{38}|[\w-]{24}.[\w-]{6}.[\w-]{27}|[\w-]{26}.[\w-]{6}.[\w-]{38}|[\w-]{24}.[\w-]{5}.([\w-]{38}|[\w-]{37}))/gm);
        if (!tokenMatch) {
            return null;
        }

        return tokenMatch[0].trim();
    }

    setStatus('Input a token to login', 'info');

    tokenInput.addEventListener("input", () => {
        if (statusEl.className.includes('error')) {
            setStatus('');
            tokenInput.style.border = "";
        }

        if (extractToken()) {
            setStatus('Valid token format detected', 'ok');
        } else {
            setStatus('Input a token to login', 'info');
        }
    });

    submitBtn.addEventListener("click", async () => {
        const token = extractToken();
        if (!token) {
            tokenInput.style.border = "1px solid #ee4445";
            setStatus("Please input a valid token", 'error');
            return;
        }

        tokenInput.style.border = "";

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
            setStatus("No active tab found", 'error');
            return;
        }

        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            setStatus("Please open a normal web page", 'error');
            return;
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (token) => {
                if (!window.location.href.includes('discord.com')) {
                    window.location.replace('https://discord.com/channels/@me');
                }

                let subdomain = ''
                if (window.location.href.includes('ptb.discord.com')) {
                    subdomain = 'ptb.'
                } else if (window.location.href.includes('canary.discord.com')) {
                    subdomain = 'canary.'
                }

                localStorage.setItem('token', `"${token}"`);
                window.location.replace(`https://${subdomain}discord.com/channels/@me`);
            },
            args: [token]
        });
    });
});
