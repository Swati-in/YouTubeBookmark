(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = []; // Fixed variable name

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            });
        });
    };

    const getTime = t => {
        var date = new Date(0);
        date.setSeconds(t);
        return date.toISOString().substring(11, 19);
    };

    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime), // Added space after "at"
        };

        currentVideoBookmarks = await fetchBookmarks();

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)), // Fixed typos
        });
    };

    const newVideoLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0]; // Fixed class name
        
        currentVideoBookmarks = await fetchBookmarks(); // Fixed variable name

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button bookmark-btn"; // Fixed class name
            bookmarkBtn.title = "Click to bookmark current timestamp";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];

            if (youtubeLeftControls && youtubePlayer) {
                youtubeLeftControls.appendChild(bookmarkBtn);
                bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
            }
        }
    };

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = value;
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({ 
                [currentVideo]: JSON.stringify(currentVideoBookmarks) // Fixed variable name
            });

            response(currentVideoBookmarks);
        }
    });

    newVideoLoaded();
})();