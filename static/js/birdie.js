// Display an animated banner message at the top of the page
// with a slide-down and fade-in effect
// and a slide-up and fade-out effect after a specified duration.
// The banner can be dismissible or not (with a close button added).
// The banner can be styled with different colors based on the type of message (info, success, warning, error).
function createBanner(message, type='info', duration=5000, isDismissible=false) {
    const typeColors = [
        {type: 'info', color: '#007bff', text_color: '#fff'},
        {type: 'success', color: '#28a745', text_color: '#fff'},
        {type: 'warning', color: '#ffc107', text_color: '#000'},
        {type: 'error', color: '#dc3545', text_color: '#fff'}
    ];
    const typeColor = typeColors.find(t => t.hasOwnProperty('type') && t.type === type);
    if (!typeColor) {
        console.error(`Unknown type: ${type}`);
        return;
    } else if (debug) {
        console.log(`Banner type: ${type}`);
        console.log(`Banner color: ${typeColor.color}`);
        console.log(`Banner text color: ${typeColor.text_color}`);
    }

    const banner = document.createElement('div');
    banner.id = 'banner';
    banner.innerHTML = message;
    banner.style.position = 'fixed';
    banner.style.top = '-100px'; // Start hidden
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = typeColor.color;
    banner.style.color = typeColor.text_color;
    banner.style.opacity = '0';
    banner.style.padding = '1rem';
    banner.style.fontFamily = 'Helvetica, Arial, sans-serif';
    banner.style.zIndex = '1000';
    banner.style.textAlign = 'center';
    banner.style.fontSize = '1.2rem';
    banner.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
    banner.style.transition = 'top 0.5s ease, opacity 0.5s ease';
    document.body.appendChild(banner);
    if (isDismissible) {
        const closeButton = document.createElement('button');
        closeButton.innerHTML = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '1.5rem';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => {
            banner.style.top = '-100px';
            banner.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(banner);
            }, 500);
        };
        banner.appendChild(closeButton);
        // Slide down the banner
        setTimeout(() => {
            banner.style.top = '0';
            banner.style.opacity = '0.9';
        }, 100);

        
    } else {
        // Slide down the banner
        setTimeout(() => {
            banner.style.top = '0';
            banner.style.opacity = '0.9';
        }, 100);

        // Slide up the banner after 3 seconds
        setTimeout(() => {
            banner.style.top = '-100px';
            banner.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(banner);
            }, 500);
        }, duration);
    }
}

// Export the createBanner function to the Window object
// so it can be accessed globally
window.createBanner = createBanner;