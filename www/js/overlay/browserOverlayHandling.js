import { getVideoList, splitVideoFilename, getDayAndMonthNames } from "../footageLoading.js";
import { loadedCameraConfList } from "../json-loaders/camConfLoader.js";
import { showFootageOverlay } from "./footageOverlayHandling.js";
import { resumeAllStreams, pauseAllStreams } from "../streamContainerHandling.js";

const ITEMS_PER_PAGE = 15;
const BROWSER_TABLE_ID = "browserTable";
const BROWSER_PAGE_NUM_ID = "browserPageNum";

const NEXT_BUTTON_ID = "browserPageNext";
const PREV_BUTTON_ID = "browserPagePrev";

var currentPageNum = 1;
var currentPageTotal = 1;
var currentCamConf = null;

function getCurrentDateTimeInWords() {
    const now = new Date();

    // Use Intl.DateTimeFormat with default browser locale
    const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now); // e.g., "Monday"
    const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now); // e.g., "October"
    const day = now.getDate(); // e.g., 6
    const year = now.getFullYear(); // e.g., 2024

    // Get time components and format them
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Adds leading zero for minutes

    // Construct the final string in words
    const dateInWords = `${dayName}, ${monthName} ${day}, ${year}`;

    return dateInWords + ", " + hours + ":" + minutes;
}


function setCurrentPageAndTotalHTML() {
    showBrowserOverlay(currentCamConf, currentPageNum);
    const pageNumElement = document.getElementById(BROWSER_PAGE_NUM_ID);
    pageNumElement.setAttribute("pageNum", currentPageNum);
    pageNumElement.setAttribute("pageTotal", currentPageTotal);
    pageNumElement.textContent = "Strana " + String(currentPageNum) + " z " + String(currentPageTotal);
    
    // Disable the next button if on the last page
    const nextButton = document.getElementById(NEXT_BUTTON_ID);
    if (currentPageNum >= currentPageTotal) {
        nextButton.setAttribute("disabled", true);
    } else {
        nextButton.removeAttribute("disabled"); // Remove disabled attribute instead of setting it to false
    }

    // Disable the previous button if on the first page
    const prevButton = document.getElementById(PREV_BUTTON_ID);
    if (currentPageNum <= 1) {
        prevButton.setAttribute("disabled", true);
    } else {
        prevButton.removeAttribute("disabled"); // Remove disabled attribute instead of setting it to false
    }
}

function goPrevPage() {
    if (currentPageNum > 1) {
        currentPageNum = currentPageNum - 1;
        setCurrentPageAndTotalHTML(currentPageNum, currentPageTotal);
    }
}

async function goNextPage() {
    // Refresh the currentPageTotal
    currentPageTotal = await getPageTotal(ITEMS_PER_PAGE);
    if (currentPageTotal > currentPageNum) {
        currentPageNum = currentPageNum + 1;
        setCurrentPageAndTotalHTML(currentPageNum, currentPageTotal);
    }
}

function paginateItems(items, itemsPerPage, pageNumber) {
    // Calculate the starting index
    const startIndex = (pageNumber - 1) * itemsPerPage;
    // Calculate the ending index
    const endIndex = startIndex + itemsPerPage;

    // Slice the items array to get the items for the requested page
    const paginatedItems = items.slice(startIndex, endIndex);

    return paginatedItems;
}

async function getPageTotal(itemsPerPage) {
    const cameraConf = currentCamConf;

    try {
        const videoList = await getVideoList(cameraConf.footageDirectory);
        // Drop all previous rows
        const totalPageNum = Math.ceil(videoList.length / itemsPerPage); // No need to parseInt
        return totalPageNum; // Return the total number of pages
    } catch (error) {
        // Handle any errors that may occur
        console.error('Failed to fetch video list:', error);
        return 0; // Return 0 in case of error
    }
}

function createTableEntry(tableId, rowData, videoPath) {
    // Find the table by its ID
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID '${tableId}' not found.`);
        return;
    }
    const tableBody = table.getElementsByTagName("tbody")[0];

    // Create a new table row
    const newRow = tableBody.insertRow();

    // Loop through the rowData array and create cells for each value
    rowData.forEach(data => {
        const newCell = newRow.insertCell();
        const textNode = document.createTextNode(data);
        newCell.appendChild(textNode);
    });

    // Create the button element
    const button = document.createElement("button");
    button.classList.add("button", "browser-play-button");  // Use classList.add to add multiple classes
    button.textContent = "PŘEHRÁT";

    button.addEventListener("click", function() {
        showFootageOverlay(currentCamConf, videoPath);
    });

    // Create a new cell and append the button to it
    const buttonCell = newRow.insertCell();
    buttonCell.appendChild(button);
}

export function hideBrowserOverlay() {
    const browserOverlayElements = document.getElementsByClassName("browser-overlay");

    Array.from(browserOverlayElements).forEach(element => {
        element.setAttribute('hidden', 'true'); // Hide the element
    });
}

export function dropTableRows() {
    // Drop all previous rows
    const tableBody = document.getElementById(BROWSER_TABLE_ID).getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear all rows
}

export async function showBrowserOverlay(cameraConf, pageNumber = 1) {
    const browserOverlayElements = document.getElementsByClassName("browser-overlay");
    const browserOverlayDescriptor = document.getElementById("browserOverlayDescriptor");
    const browserOverlayDateTime = document.getElementById("browserOverlayDateTime");

    // Show the overlay elements
    Array.from(browserOverlayElements).forEach(element => {
        element.removeAttribute('hidden'); 
    });

    try {
        const videoList = await getVideoList(cameraConf.footageDirectory);

        dropTableRows();

        // Reverse the video list
        const loadedVideoList = videoList.reverse();
        const videoListPage = paginateItems(loadedVideoList, ITEMS_PER_PAGE, pageNumber);

        // Await the total pages
        const totalPages = await getPageTotal(ITEMS_PER_PAGE);
        currentPageTotal = totalPages;

        // Set description
        browserOverlayDescriptor.textContent = "Vybraná kamera: " + cameraConf.title;

        // Function to update the current date and time every second
        function updateDateTime() {
            browserOverlayDateTime.textContent = "Dnes je: " + getCurrentDateTimeInWords();
        }

        // Update the time every second
        setInterval(updateDateTime, 1000); // 1000 ms = 1 second

        // Initial call to display the time immediately without waiting 1 second
        updateDateTime();

        // Populate the table with video items
        Array.from(videoListPage).forEach((videoItem, index) => {
            index = index + (pageNumber - 1) * ITEMS_PER_PAGE;
            const splitVideoName = splitVideoFilename(videoItem);
            const dayMonthNames = getDayAndMonthNames(splitVideoName.day, 
                                                      splitVideoName.month,
                                                      splitVideoName.year);
            createTableEntry(BROWSER_TABLE_ID, [
                index,
                splitVideoName.year,
                dayMonthNames[0],
                splitVideoName.day + ".",
                dayMonthNames[1],
                String(splitVideoName.hour) + ":" + String(splitVideoName.minute),

            ], videoItem);

            
        });

    } catch (error) {
        // Handle any errors that may occur
        console.error('Failed to fetch video list:', error);
    }
}


export function handleBrowserOverlay() {
    const browserOverlayButtons = document.querySelectorAll('.button-open-browser-overlay');
    browserOverlayButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const cameraID = event.target.parentNode.parentNode.getAttribute("camera-id");
            currentCamConf = loadedCameraConfList[cameraID];
            currentPageNum = 1;
            currentPageTotal = await getPageTotal(ITEMS_PER_PAGE);
            setCurrentPageAndTotalHTML();
            pauseAllStreams();
        });
    });

    const exitOverlayButtonElement = document.getElementById("exitBrowserOverlayButton");
    const prevPageButtonElement = document.getElementById("browserPagePrev");
    const nextPageButtonElement = document.getElementById("browserPageNext");
    exitOverlayButtonElement.addEventListener('click', (event) => {
        hideBrowserOverlay();
        resumeAllStreams();
        currentCamConf = null;
    });
    prevPageButtonElement.addEventListener('click', (event) => {
        goPrevPage();
    });
    nextPageButtonElement.addEventListener('click', async (event) => {
        await goNextPage();
    });
}
