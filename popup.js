const input = document.getElementById('domainInput');

(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      input.value = url.hostname;
    } catch(e) {
      alert(e);
      // ignore
    }
  }

  input.focus();
})();

// When the popup Paste Button is clicked
const onCopyButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                localStorage.copyCookieData = JSON.stringify(cookie);
                setTimeout(() => handlePopupUI('copy'), 100);
            });
        },
    );
};

const onCopyClipboardButtonClick = (e) => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                const cookieString = cookie.map(o => `${o.name}=${o.value}`).join(';');
                const el = document.createElement('textarea')
                el.value = cookieString;
                document.body.append(el);
                // Select the text and copy to clipboard
                el.select();
                document.execCommand('copy', true);
                el.remove();
                
                const text = e.target.innerText;
                e.target.innerText = 'Success';
                setTimeout(() => e.target.innerText = text, 1000);
            });
        },
    );
};

const removeOldCookies = (cookies, index, url, callback) => {
    if (!cookies[index]) return callback();

    try {
        chrome.cookies.remove({
            url: url + cookies[index].path,
            name: cookies[index].name,
        }, () => removeOldCookies(cookies, index + 1, url, callback));
    } catch (e) {
        console.error(`There was an error removing the cookies: ${error}`, cookies[index].name);
    }
};

// When the popup Paste Button is clicked
const onPasteButtonClick = async () => {
    let copyCookieData;
    try {
        copyCookieData = localStorage.copyCookieData
            ? JSON.parse(localStorage.copyCookieData)
            : null;
    } catch (e) {
        return alert('Error parsing cookies. Please try again.');
    }

    if (!copyCookieData)
        return alert('Uh-Oh! You need to copy the cookies first.');

    let domain = input.value.trim();
    if (!domain) domain = 'localhost';

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (!tab?.[0]?.url) {
                return alert('Uh-Oh! Tab with invalid URL.');
            }

            chrome.cookies.getAll({ url: tab[0].url }, cookies => {
                removeOldCookies(cookies, 0, tab[0].url, () => {
                    copyCookieData.forEach(({ name, value, path, httpOnly, secure }) => {
                        try {
                            chrome.cookies.set({
                                url: tab[0].url,
                                secure,
                                name,
                                value,
                                path,
                                httpOnly,
                                domain,
                            });
                        } catch (error) {
                            console.error(`There was an error: ${error}`);
                        }
                    });
                    onResetButtonClick('paste');
                });
            });
        },
    );
};

// When the popup Reset Button is clicked
const onResetButtonClick = action => {
    localStorage.removeItem('copyCookieData');
    handlePopupUI(action);
};

const handlePopupUI = action => {
    const copyCookieData = localStorage.copyCookieData;
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');

    if (copyCookieData) {
        containerElement.classList.add('container2');
    } else {
        containerElement.classList.add('container1');
    }

    const successPasteLabel = document.getElementById('successPasteLabel');
    const welcomeLabel = document.getElementById('welcomeLabel');
    if (action === 'paste') {
        successPasteLabel.setAttribute('style', 'display: block');
    } else {
        successPasteLabel.setAttribute('style', 'display: none');
    }
    if (action === 'copy' || copyCookieData) {
        welcomeLabel.setAttribute('style', 'display: none');
    } else if (action === 'reset') {
        welcomeLabel.setAttribute('style', 'display: block');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', () => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('copyToClipboard')
        .addEventListener('click', onCopyClipboardButtonClick);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick('reset'));
});
