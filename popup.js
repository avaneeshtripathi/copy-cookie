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
                localStorage.aviCookieData = JSON.stringify(cookie);
            });
        },
    );
    setTimeout(() => handlePopupUI('copy'), 200);
};

// When the popup Paste Button is clicked
const onPasteButtonClick = () => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    if (!aviCookieData)
        return alert('Oh Man! You need to copy the cookies first.');

    let domain = document.getElementById('domainInput').value.trim();
    if (!domain) domain = 'localhost';

    let validTabUrl = true;

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (tab[0].url) {
                chrome.cookies.getAll({ url: tab[0].url }, cookies => {
                    for (let i = 0; i < cookies.length; i++) {
                        chrome.cookies.remove({
                            url: tab[0].url + cookies[i].path,
                            name: cookies[i].name,
                        });
                    }
                });
                aviCookieData.forEach(({ name, value, path }, index) => {
                    try {
                        chrome.cookies.set({
                            url: tab[0].url,
                            name,
                            value,
                            path,
                            domain,
                        });
                    } catch (error) {
                        console.error(`There was an error: ${error}`);
                    }
                });
            } else {
                validTabUrl = false;
                return alert('Tab with invalid URL. Are you kidding me ???');
            }
        },
    );
    setTimeout(() => {
        if (validTabUrl) onResetButtonClick('paste');
    }, 200);
};

// When the popup Reset Button is clicked
const onResetButtonClick = action => {
    localStorage.removeItem('aviCookieData');
    handlePopupUI(action);
};

const handlePopupUI = action => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');
    if (aviCookieData) {
        containerElement.classList.add('container2');
    } else {
        containerElement.classList.add('container1');
    }

    const successpasteLabel = document.getElementById('successPasteLabel');
    const welcomeLabel = document.getElementById('welcomeLabel');
    if (action === 'paste') {
        successpasteLabel.setAttribute('style', 'display: block');
    } else {
        successpasteLabel.setAttribute('style', 'display: none');
    }
    if (action === 'copy' || aviCookieData) {
        welcomeLabel.setAttribute('style', 'display: none');
    } else if (action === 'reset') {
        welcomeLabel.setAttribute('style', 'display: block');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', event => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick('reset'));
});
